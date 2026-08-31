from django.conf import settings
from django.template.loader import render_to_string
from anymail.message import AnymailMessage
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import logging

logger = logging.getLogger(__name__)


# send_verification_email sigue viva porque application/user/api_views.py la
# reutiliza tal cual (RegisterAPIView y ResendVerificationAPIView). El enlace
# apunta directo al frontend Next.js (settings.FRONTEND_URL) — ya no pasa por
# ninguna vista de Django, así que no depende de user/urls.py.
def send_verification_email(_request, user):
    logger.error(f"INICIANDO envio de correo a {user.email}")
    try:
        mail_subject = 'Activa tu cuenta de ElectroHome'
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        message = render_to_string('user/verification_email.html', {
            'user': user,
            'frontend_url': settings.FRONTEND_URL,
            'uid': uid,
            'token': token,
        })
        email = AnymailMessage(
            mail_subject, message,
            to=[user.email],
            from_email='ElectroHome <noreply@electrohome.site>'
        )
        email.content_subtype = "html"
        email.send(fail_silently=True)
    except Exception as e:
        print(f"Error al enviar correo: {e}")
