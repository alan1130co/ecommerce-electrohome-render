# application/product/urls.py
from django.urls import path
from . import views
from . import wishlist_views  # ✅ Importar vistas de wishlist

app_name = 'product'

urlpatterns = [
    # Home
    path('', views.index, name='home'),
    
    # Carrito
    path('carrito/', views.cart_view, name='cart'),
    path('carrito/agregar/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('carrito/actualizar/<int:cart_item_id>/', views.update_cart_item, name='update_cart_item'),
    path('carrito/eliminar/<int:cart_item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('carrito/vaciar/', views.clear_cart, name='clear_cart'),
    
    # Productos
    path('search/', views.search_view, name='search'),
    path('producto/<int:product_id>/', views.product_detail, name='product_detail'),
    path('producto/<int:product_id>/resena/', views.crear_resena, name='crear_resena'),  # ← AGREGAR
    path('productos/', views.products_list, name='products_list'),
    
    # Contacto
    path('contact/', views.contact, name='contact'),
    
    # ✅ Wishlist (Lista de Deseos)
    path('wishlist/', wishlist_views.wishlist_view, name='wishlist'),
    path('wishlist/add/<int:product_id>/', wishlist_views.add_to_wishlist, name='add_to_wishlist'),
    path('wishlist/remove/<int:product_id>/', wishlist_views.remove_from_wishlist, name='remove_from_wishlist'),
    path('wishlist/check/<int:product_id>/', wishlist_views.check_wishlist_status, name='check_wishlist'),
]