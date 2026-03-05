from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from anymail.message import AnymailMessage
from django.contrib.auth.tokens import default_token_generator
from .forms import RegisterForm, LoginForm
from .models import Usuario
import re
import logging
logger = logging.getLogger(__name__)

def register_view(request):
    if request.user.is_authenticated:
        return redirect('product:home')

    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            user.save()
            send_verification_email(request, user)
            messages.success(
                request, 
                f'Â¡Registro exitoso! Hemos enviado un correo de verificaciÃ³n a {user.email}. '
                f'Por favor revisa tu bandeja de entrada y carpeta de spam.'
            )
            return redirect('user:verification_sent')
        else:
            messages.error(request, 'Por favor corrige los errores en el formulario.')
    else:
        form = RegisterForm()

    return render(request, 'user/register.html', {'form': form})


def send_verification_email(request, user):
    logger.error(f"INICIANDO envio de correo a {user.email}")
    try:
        current_site = get_current_site(request)
        mail_subject = 'ðŸ” Activa tu cuenta de ElectroHome'
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        message = render_to_string('user/verification_email.html', {
            'user': user,
            'domain': current_site.domain,
            'uid': uid,
            'token': token,
            'protocol': 'https' if request.is_secure() else 'http',
        })
        email = AnymailMessage(mail_subject, message, to=[user.email], from_email='ElectroHome <noreply@electrohome.site>')
        email.content_subtype = "html"
        email.send(fail_silently=True)
    except Exception as e:
        print(f"Error al enviar correo: {e}")


# ============================================
# âœ… VERIFICACIÃ“N DE CORREO
# ============================================

def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = Usuario.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
        user = None
    
    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        messages.success(
            request, 
            'Â¡Correo verificado exitosamente! Tu cuenta ha sido activada. Ahora puedes iniciar sesiÃ³n.'
        )
        return redirect('user:verification_success')
    else:
        messages.error(
            request, 
            'El enlace de verificaciÃ³n es invÃ¡lido o ha expirado. '
            'Por favor solicita un nuevo correo de verificaciÃ³n.'
        )
        return redirect('user:verification_failed')


# ============================================
# âœ… PÃGINAS DE CONFIRMACIÃ“N
# ============================================

def verification_sent(request):
    return render(request, 'user/verification_sent.html')


def verification_success(request):
    return render(request, 'user/verification_success.html')


def verification_failed(request):
    return render(request, 'user/verification_failed.html')


def resend_verification(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = Usuario.objects.get(email=email)
            if user.is_active:
                messages.info(request, 'Esta cuenta ya estÃ¡ verificada. Puedes iniciar sesiÃ³n.')
                return redirect('user:login')
            # send_verification_email(request, user)
            messages.success(
                request, 
                f'Correo de verificaciÃ³n reenviado a {email}. Revisa tu bandeja de entrada.'
            )
            return redirect('user:verification_sent')
        except Usuario.DoesNotExist:
            messages.error(request, 'No existe una cuenta con este correo electrÃ³nico.')
    
    return render(request, 'user/resend_verification.html')


# ============================================
# âœ… LOGIN - REDIRIGE SEGÃšN TIPO DE USUARIO
# ============================================

@ensure_csrf_cookie
@csrf_protect
def login_view(request):
    if request.user.is_authenticated:
        # Si ya estÃ¡ autenticado redirigir segÃºn su tipo
        if request.user.is_superuser:
            return redirect('/admin/')
        elif request.user.tipo_usuario == 'supervisor':
            return redirect('dashboard:index')
        else:
            return redirect('product:home')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            # Verificar si el usuario existe y estÃ¡ activo
            try:
                user_check = Usuario.objects.get(email=email)
                if not user_check.is_active:
                    messages.error(
                        request, 
                        'Tu cuenta no ha sido verificada. Por favor revisa tu correo electrÃ³nico. '
                        '<a href="/user/resend-verification/" class="text-blue-600 font-bold underline">Reenviar correo de verificaciÃ³n</a>',
                        extra_tags='html'
                    )
                    return render(request, 'user/login.html', {'form': form})
            except Usuario.DoesNotExist:
                pass

            # Autenticar usuario
            user = authenticate(request, username=email, password=password)
            if user:
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                messages.success(request, f'Â¡Bienvenido de nuevo, {user.first_name or user.email}!')

                # âœ… REDIRECCIÃ“N SEGÃšN TIPO DE USUARIO
                if user.is_superuser:
                    # Admin â†’ panel de administraciÃ³n Django
                    return redirect('/admin/')
                elif user.tipo_usuario == 'supervisor':
                    # Supervisor â†’ dashboard
                    return redirect('dashboard:index')
                else:
                    # Cliente â†’ pÃ¡gina principal
                    next_url = request.GET.get('next', 'product:home')
                    return redirect(next_url)
            else:
                messages.error(request, 'Correo o contraseÃ±a incorrectos.')
        else:
            messages.error(request, 'Por favor verifica los datos del formulario.')
    else:
        form = LoginForm()

    return render(request, 'user/login.html', {'form': form})


# ============================================
# âœ… LOGOUT
# ============================================

@never_cache
@login_required(login_url='user:login')
@require_http_methods(["GET", "POST"])
def logout_view(request):
    user_name = request.user.first_name or request.user.username
    logout(request)
    messages.success(request, f'Â¡Hasta pronto, {user_name}! Has cerrado sesiÃ³n correctamente.')
    return redirect('product:home')


# ============================================
# âœ… PERFIL
# ============================================

@login_required
@never_cache
def profile_view(request):
    if request.method == 'POST':
        user = request.user
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        telefono = request.POST.get('telefono', '').strip()
        ciudad = request.POST.get('ciudad', '').strip()
        
        errores = []
        
        if not first_name:
            errores.append('El nombre es obligatorio')
        elif len(first_name) < 3:
            errores.append('El nombre debe tener al menos 3 letras')
        elif not re.match(r'^[a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘\s]+$', first_name):
            errores.append('El nombre solo puede contener letras')
        
        if not last_name:
            errores.append('El apellido es obligatorio')
        elif len(last_name) < 4:
            errores.append('El apellido debe tener al menos 4 letras')
        elif not re.match(r'^[a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘\s]+$', last_name):
            errores.append('El apellido solo puede contener letras')
        
        if telefono:
            if not re.match(r'^\d{10}$', telefono):
                errores.append('El telÃ©fono debe tener exactamente 10 nÃºmeros')
        
        if not ciudad:
            errores.append('Debes seleccionar una ciudad')
        
        if errores:
            for error in errores:
                messages.error(request, error)
            return redirect('user:profile')
        
        try:
            user.first_name = first_name
            user.last_name = last_name
            user.telefono = telefono
            user.ciudad = ciudad
            user.save()
            messages.success(request, 'Perfil actualizado correctamente!')
        except Exception as e:
            messages.error(request, f'Error al actualizar perfil: {str(e)}')
        
        return redirect('user:profile')
    
    context = {
        'user': request.user,
        'total_orders': request.user.get_total_orders(),
        'total_spent': request.user.get_total_spent(),
    }
    return render(request, 'user/profile.html', context)


@login_required
@never_cache
def edit_profile(request):
    if request.method == 'POST':
        user = request.user
        user.first_name = request.POST.get('first_name', '').strip()
        user.last_name = request.POST.get('last_name', '').strip()
        user.email = request.POST.get('email', '').strip()
        
        if not user.email:
            messages.error(request, 'El email es obligatorio')
            return redirect('user:edit_profile')
        
        user.save()
        messages.success(request, 'Perfil actualizado correctamente!')
        return redirect('user:profile')
    
    return render(request, 'user/edit_profile.html', {'user': request.user})


@never_cache
def access_denied(request):
    messages.warning(request, 'Debes iniciar sesiÃ³n para acceder a esta pÃ¡gina.')
    return redirect('user:login')










