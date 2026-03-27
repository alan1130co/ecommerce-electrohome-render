from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Autenticación
    path('login/', views.supervisor_login, name='login'),
    path('logout/', views.supervisor_logout, name='logout'),
    
    # Dashboard
    path('', views.admin_dashboard, name='index'),
    path('notificaciones/', views.notificaciones_pedidos, name='notificaciones'),
    path('reportes/pdf/', views.generar_reporte_pdf, name='reporte_pdf'),
    
    # Productos
    path('productos/', views.productos_list, name='productos'),
    path('productos/crear/', views.crear_producto, name='crear_producto'),
    path('productos/<int:producto_id>/editar/', views.editar_producto, name='editar_producto'),
    path('productos/<int:producto_id>/eliminar/', views.eliminar_producto, name='eliminar_producto'),
    
    # Categorías
    path('categorias/', views.categorias_list, name='categorias'),
    path('categorias/crear/', views.crear_categoria, name='crear_categoria'),
    path('categorias/<int:categoria_id>/editar/', views.editar_categoria, name='editar_categoria'),
    path('categorias/<int:categoria_id>/eliminar/', views.eliminar_categoria, name='eliminar_categoria'),
    
    # Pedidos y Usuarios
    path('pedidos/', views.pedidos_list, name='pedidos'),
    path('usuarios/', views.usuarios_list, name='usuarios'),
    path('pedidos/<int:pedido_id>/estado/', views.cambiar_estado_pedido, name='cambiar_estado_pedido'),
    
    # Promociones
    path('promociones/', views.promociones_list, name='promociones'),
    path('promociones/crear/', views.crear_promocion, name='crear_promocion'),
    path('promociones/<int:promo_id>/editar/', views.editar_promocion, name='editar_promocion'),
    path('promociones/<int:promo_id>/eliminar/', views.eliminar_promocion, name='eliminar_promocion'),
    path('envio-masivo/', views.envio_masivo, name='envio_masivo'),
    
    # Reseñas
    path('resenas/', views.resenas_list, name='resenas'),
    path('resenas/<int:resena_id>/aprobar/', views.aprobar_resena, name='aprobar_resena'),
    path('resenas/<int:resena_id>/rechazar/', views.rechazar_resena, name='rechazar_resena'),
    path('resenas/<int:resena_id>/eliminar/', views.eliminar_resena, name='eliminar_resena'),

    # Secciones promocionales y banners  ← ahora SÍ están adentro
    path('secciones/', views.secciones_list, name='secciones'),
    path('banners/crear/', views.crear_banner, name='crear_banner'),
    path('banners/<int:banner_id>/editar/', views.editar_banner, name='editar_banner'),
    path('banners/<int:banner_id>/eliminar/', views.eliminar_banner, name='eliminar_banner'),
    path('banners/<int:banner_id>/toggle/', views.toggle_banner, name='toggle_banner'),
]  # ← corchete de cierre al final