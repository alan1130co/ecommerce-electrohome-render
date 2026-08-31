from django.conf import settings


def frontend_url(request):
    """Expone FRONTEND_URL a cualquier template de Django — lo necesitan las
    plantillas de allauth (socialaccount/*) que ya no pueden usar
    {% url 'user:...' %} porque esas rutas se dieron de baja junto con
    user/urls.py; el frontend real es la app Next.js."""
    return {'FRONTEND_URL': settings.FRONTEND_URL}
