import re

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import RegisterForm
from .models import Usuario
from .views import send_verification_email


def _user_data(user):
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'tipo_usuario': user.tipo_usuario,
    }


def _user_data_full(user):
    return {
        **_user_data(user),
        'telefono': user.telefono,
        'ciudad': user.ciudad,
        'direccion': user.direccion,
        'total_orders': user.get_total_orders(),
        'total_spent': str(user.get_total_spent()),
    }


class LoginAPIView(APIView):
    """POST /api/auth/login/ — equivalente mínimo (sin templates) de login_view.
    El merge de carrito anónimo→usuario ya lo hace la señal user_logged_in
    (application/user/signals.py), que se dispara automáticamente con login()."""

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'detail': 'Email y contraseña son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'detail': 'Correo o contraseña incorrectos'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response(
                {'detail': 'Tu cuenta no ha sido verificada. Revisa tu correo electrónico.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)
        return Response(_user_data(user))


class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response({'detail': 'Sesión cerrada'})


class MeAPIView(APIView):
    """GET /api/auth/me/ — para que Next.js sepa si hay sesión activa."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(_user_data(request.user))


class RegisterAPIView(APIView):
    """POST /api/auth/register/ — usa RegisterForm tal cual (mismas
    validaciones de contraseña/nombre/teléfono) y send_verification_email
    de views.py, sin duplicar esa lógica."""

    def post(self, request):
        form = RegisterForm(request.data)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=status.HTTP_400_BAD_REQUEST)

        user = form.save(commit=False)
        user.is_active = False
        user.save()
        send_verification_email(request, user)

        return Response(
            {'detail': f'Registro exitoso. Revisa {user.email} para verificar tu cuenta.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailAPIView(APIView):
    """GET /api/auth/verify-email/<uidb64>/<token>/ — misma validación de
    token que verify_email, en JSON en vez de redirect a template."""

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = Usuario.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'detail': 'Correo verificado exitosamente. Ya puedes iniciar sesión.'})

        return Response(
            {'detail': 'El enlace de verificación es inválido o ha expirado.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ResendVerificationAPIView(APIView):
    """POST /api/auth/resend-verification/ — mismo comportamiento que
    resend_verification (no revela si el email existe, solo si ya está activo)."""

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'detail': 'El correo es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return Response({'detail': 'No existe una cuenta con este correo electrónico.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({'detail': 'Esta cuenta ya está verificada. Puedes iniciar sesión.'})

        send_verification_email(request, user)
        return Response({'detail': f'Correo de verificación reenviado a {email}.'})


class PasswordResetRequestAPIView(APIView):
    """POST /api/auth/password-reset/ — usa el PasswordResetForm nativo de
    Django, igual que hace internamente el PasswordResetView de user/urls.py."""

    def post(self, request):
        form = PasswordResetForm(data=request.data)
        if form.is_valid():
            form.save(
                request=request,
                email_template_name='user/password_reset_email.html',
                subject_template_name='user/password_reset_subject.txt',
                extra_email_context={'frontend_url': settings.FRONTEND_URL},
            )
        # Mismo comportamiento que Django: no revelar si el email existe.
        return Response({'detail': 'Si el correo existe, enviamos instrucciones para restablecer la contraseña.'})


class PasswordResetConfirmAPIView(APIView):
    """POST /api/auth/password-reset-confirm/<uidb64>/<token>/"""

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = Usuario.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            user = None

        if user is None or not default_token_generator.check_token(user, token):
            return Response({'detail': 'El enlace no es válido o ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        form = SetPasswordForm(user, data=request.data)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=status.HTTP_400_BAD_REQUEST)

        form.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'})


class ProfileAPIView(APIView):
    """GET/PATCH /api/auth/profile/ — mismas reglas de validación que
    profile_view (nombre/apellido/teléfono/ciudad), en JSON."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(_user_data_full(request.user))

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        user = request.user
        first_name = request.data.get('first_name', user.first_name).strip()
        last_name = request.data.get('last_name', user.last_name).strip()
        telefono = request.data.get('telefono', user.telefono).strip()
        ciudad = request.data.get('ciudad', user.ciudad).strip()

        errores = []
        if not first_name:
            errores.append('El nombre es obligatorio')
        elif len(first_name) < 3:
            errores.append('El nombre debe tener al menos 3 letras')
        elif not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', first_name):
            errores.append('El nombre solo puede contener letras')

        if not last_name:
            errores.append('El apellido es obligatorio')
        elif len(last_name) < 4:
            errores.append('El apellido debe tener al menos 4 letras')
        elif not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', last_name):
            errores.append('El apellido solo puede contener letras')

        if telefono and not re.match(r'^\d{10}$', telefono):
            errores.append('El teléfono debe tener exactamente 10 números')

        if not ciudad:
            errores.append('Debes indicar una ciudad')

        if errores:
            return Response({'errors': errores}, status=status.HTTP_400_BAD_REQUEST)

        user.first_name = first_name
        user.last_name = last_name
        user.telefono = telefono
        user.ciudad = ciudad
        user.save()

        return Response(_user_data_full(user))
