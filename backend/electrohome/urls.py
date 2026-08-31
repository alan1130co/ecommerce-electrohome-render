from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    path('chatbot/', include('application.chatbot.urls')),
    path('api/', include('application.product.api_urls')),
    path('api/auth/', include('application.user.api_urls')),
    path('api/', include('application.order.api_urls')),
    path('api/dashboard/', include('application.dashboard.api_urls')),
]

# Servir archivos media siempre (desarrollo y producción)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])