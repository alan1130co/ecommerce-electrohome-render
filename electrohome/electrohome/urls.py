from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    path('order/', include('application.order.urls')),
    path('user/', include('application.user.urls')),
    path('chatbot/', include('application.chatbot.urls')),
    path('dashboard/', include('application.dashboard.urls')),
    path('', include('application.product.urls')),
]

# Servir archivos media siempre (desarrollo y producción)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])