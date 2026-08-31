from django.urls import path

from . import api_views
# Reutilizado directamente sin envolver en DRF: generar_reporte_pdf ya
# responde HttpResponse(pdf) binario protegido con @supervisor_required
# (redirige si no hay sesión válida), que es exactamente lo que necesita un
# <a href> / window.open() del navegador — no hace falta tocarlo.
from .views import generar_reporte_pdf

app_name = 'dashboard_api'

urlpatterns = [
    # Autenticación de supervisores/administradores — separada del login de clientes
    path('auth/login/', api_views.AdminLoginAPIView.as_view(), name='login'),
    path('auth/logout/', api_views.AdminLogoutAPIView.as_view(), name='logout'),
    path('auth/me/', api_views.AdminMeAPIView.as_view(), name='me'),

    # Dashboard principal
    path('stats/', api_views.AdminDashboardStatsAPIView.as_view(), name='stats'),
    path('notificaciones/', api_views.NotificacionesPedidosAPIView.as_view(), name='notificaciones'),
    path('reportes/pdf/', generar_reporte_pdf, name='reporte_pdf'),

    # Pedidos
    path('pedidos/', api_views.PedidosListAPIView.as_view(), name='pedidos'),
    path('pedidos/<int:pedido_id>/estado/', api_views.CambiarEstadoPedidoAPIView.as_view(), name='cambiar_estado_pedido'),

    # Productos
    path('productos/', api_views.ProductoAdminListCreateAPIView.as_view(), name='productos'),
    path('productos/opciones/', api_views.ProductoOpcionesAPIView.as_view(), name='producto_opciones'),
    path('productos/<int:producto_id>/', api_views.ProductoAdminDetailAPIView.as_view(), name='producto_detail'),
    path('upload-imagen/', api_views.ImagenUploadAPIView.as_view(), name='upload_imagen'),

    # Categorías
    path('categorias/', api_views.CategoriaAdminListCreateAPIView.as_view(), name='categorias'),
    path('categorias/<int:categoria_id>/', api_views.CategoriaAdminDetailAPIView.as_view(), name='categoria_detail'),

    # Usuarios
    path('usuarios/', api_views.UsuariosListAPIView.as_view(), name='usuarios'),

    # Promociones
    path('promociones/', api_views.PromocionAdminListCreateAPIView.as_view(), name='promociones'),
    path('promociones/<int:promo_id>/', api_views.PromocionAdminDetailAPIView.as_view(), name='promocion_detail'),

    # Envío masivo de correos
    path('envio-masivo/', api_views.EnvioMasivoAPIView.as_view(), name='envio_masivo'),

    # Reseñas
    path('resenas/', api_views.ResenasListAPIView.as_view(), name='resenas'),
    path('resenas/<int:resena_id>/aprobar/', api_views.AprobarResenaAPIView.as_view(), name='aprobar_resena'),
    path('resenas/<int:resena_id>/rechazar/', api_views.RechazarResenaAPIView.as_view(), name='rechazar_resena'),
    path('resenas/<int:resena_id>/eliminar/', api_views.EliminarResenaAPIView.as_view(), name='eliminar_resena'),

    # Secciones promocionales y banners
    path('secciones/', api_views.SeccionesListAPIView.as_view(), name='secciones'),
    path('banners/', api_views.BannerAdminListCreateAPIView.as_view(), name='banners'),
    path('banners/<int:banner_id>/', api_views.BannerAdminDetailAPIView.as_view(), name='banner_detail'),
    path('banners/<int:banner_id>/toggle/', api_views.ToggleBannerAPIView.as_view(), name='toggle_banner'),
]
