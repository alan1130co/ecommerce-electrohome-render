from .base import *
from decouple import config
import os

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY')
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '*']

# ===== CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL =====
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL')
    )
}

# ===== CONFIGURACIÓN DE CACHÉ =====
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'electrohome-cache',
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

RECOMMENDATION_CACHE_TIMEOUT = 3600
CACHE_MIDDLEWARE_SECONDS = 300

# ===== CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS =====
STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ===== CONFIGURACIÓN DE ARCHIVOS MEDIA =====
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ===== CONFIGURACIÓN CSRF =====
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_FAILURE_VIEW = 'django.views.csrf.csrf_failure'

# ===== CONFIGURACIÓN DE SESIONES =====
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400
SESSION_SAVE_EVERY_REQUEST = False

# ===== CONFIGURACIÓN DE EMAIL CON RESEND =====
EMAIL_BACKEND = 'anymail.backends.resend.EmailBackend'
ANYMAIL = {
    'RESEND_API_KEY': config('RESEND_API_KEY'),
}
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@electrohome.com')
SERVER_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@electrohome.com')
PASSWORD_RESET_TIMEOUT = 86400

# ===== CONFIGURACIÓN DE RECOMENDACIONES =====
RECOMMENDATION_CONFIG = {
    'CACHE_TIMEOUT': 3600,
    'MIN_RATINGS_FOR_BEST_RATED': 3,
    'GLOBAL_AVERAGE_RATING': 3.5,
    'SIMILAR_USERS_LIMIT': 20,
    'TRENDING_DAYS': 7,
    'POPULAR_DAYS': 30,
    'VIEW_DUPLICATE_THRESHOLD_MINUTES': 5,
}

# ===== LOGGING =====
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
}

# ===== ALLAUTH / GOOGLE =====
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

# ===== WOMPI =====
WOMPI_PUBLIC_KEY = config('WOMPI_PUBLIC_KEY')
WOMPI_PRIVATE_KEY = config('WOMPI_PRIVATE_KEY')
WOMPI_ENVIRONMENT = config('WOMPI_ENVIRONMENT', default='test')

if WOMPI_ENVIRONMENT == 'prod':
    WOMPI_API_URL = 'https://production.wompi.co/v1'
else:
    WOMPI_API_URL = 'https://sandbox.wompi.co/v1'

SITE_URL = 'https://electrohome.site'

# ===== CLOUDINARY =====
INSTALLED_APPS += ['cloudinary_storage', 'cloudinary', 'anymail']

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': config('CLOUDINARY_API_KEY'),
    'API_SECRET': config('CLOUDINARY_API_SECRET'),
}

# ===== SEGURIDAD =====
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SITE_ID = 7
CSRF_TRUSTED_ORIGINS = ['https://electrohome.site', 'https://www.electrohome.site']
