from .base import *
import os
import dj_database_url

DEBUG = False

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

# ===== SITE ID PARA RAILWAY =====
SITE_ID = 7

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ===== SEGURIDAD =====
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = [x for x in os.environ.get('CSRF_TRUSTED_ORIGINS', 'https://ecommerce-electrohome-render.onrender.com').split(',') if x]
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ===== EMAIL =====
EMAIL_BACKEND = 'anymail.backends.resend.EmailBackend'
ANYMAIL = {'RESEND_API_KEY': os.environ.get('RESEND_API_KEY', '')}
DEFAULT_FROM_EMAIL = 'ElectroHome <noreply@electrohome.site>'

# ===== WOMPI =====
WOMPI_PUBLIC_KEY = os.environ.get('WOMPI_PUBLIC_KEY', '')
WOMPI_PRIVATE_KEY = os.environ.get('WOMPI_PRIVATE_KEY', '')
WOMPI_ENVIRONMENT = os.environ.get('WOMPI_ENVIRONMENT', 'test')
WOMPI_API_URL = 'https://sandbox.wompi.co/v1'

# ===== ARCHIVOS ESTÃTICOS =====
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# ===== CLOUDINARY =====
INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

# ===== GOOGLE OAUTH =====
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "https"
SOCIALACCOUNT_QUERY_EMAIL = True
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_STORE_TOKENS = True
SOCIALACCOUNT_LOGIN_ON_GET = True
SOCIALACCOUNT_AUTO_SIGNUP = True
ACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    }
}

