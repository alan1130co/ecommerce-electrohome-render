from .base import *
from decouple import config
import os
import dj_database_url

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '*']

ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY', default='')

# ===== CONFIGURACIÓN DE BASE DE DATOS =====
# Por defecto usa SQLite local, así el entorno local nunca depende de
# la base de datos remota (Supabase/Postgres en la nube).
# Si quieres apuntar a un Postgres propio, define DATABASE_URL en tu .env.
DATABASE_URL = config('DATABASE_URL', default='')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL)
    }
    # Supabase expone su pooler (puerto 6543) en modo transacción de
    # PgBouncer: la conexión física puede rotar entre queries de la MISMA
    # request, así que un cursor server-side abierto por una query puede
    # dejar de existir para la siguiente (psycopg2.errors.InvalidCursorName,
    # intermitente). django-allauth abre uno de estos con .iterator() en
    # filter_users_by_email(), reventando CUALQUIER login con password
    # incorrecta con un 500 en vez de 401. Este flag es la recomendación
    # oficial de Django para pooler en modo transacción.
    DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
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

# ===== CONFIGURACIÓN DE EMAIL =====
# Sin RESEND_API_KEY, los correos se imprimen en la consola en vez de
# enviarse (así el servidor local arranca aunque no tengas esa credencial).
RESEND_API_KEY = config('RESEND_API_KEY', default='')
if RESEND_API_KEY:
    EMAIL_BACKEND = 'anymail.backends.resend.EmailBackend'
    ANYMAIL = {
        'RESEND_API_KEY': RESEND_API_KEY,
    }
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

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

# ===== WOMPI (sandbox por defecto en local) =====
WOMPI_PUBLIC_KEY = config('WOMPI_PUBLIC_KEY', default='')
WOMPI_PRIVATE_KEY = config('WOMPI_PRIVATE_KEY', default='')
WOMPI_ENVIRONMENT = config('WOMPI_ENVIRONMENT', default='test')

if WOMPI_ENVIRONMENT == 'prod':
    WOMPI_API_URL = 'https://production.wompi.co/v1'
else:
    WOMPI_API_URL = 'https://sandbox.wompi.co/v1'

SITE_URL = 'https://electrohome.site'

# ===== CLOUDINARY (opcional en local) =====
# Sin credenciales de Cloudinary, los archivos que subas localmente
# (reseñas, banners) se guardan en el sistema de archivos local en vez
# de romper el arranque del servidor.
CLOUDINARY_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME', default='')
if CLOUDINARY_CLOUD_NAME:
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': config('CLOUDINARY_API_KEY', default=''),
        'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
    }

# ===== SEGURIDAD =====
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SITE_ID = 7
CSRF_TRUSTED_ORIGINS = ['https://electrohome.site', 'https://www.electrohome.site']
