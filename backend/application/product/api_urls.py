from django.urls import path

from . import api_views, cart_api_views, resena_api_views, wishlist_api_views

app_name = 'product_api'

urlpatterns = [
    path('categorias/', api_views.CategoriaListAPIView.as_view(), name='categorias'),
    path('productos/', api_views.ProductoListAPIView.as_view(), name='productos'),
    path('productos/<int:product_id>/', api_views.ProductoDetailAPIView.as_view(), name='producto_detail'),
    path('productos/<int:product_id>/similares/', api_views.ProductoSimilaresAPIView.as_view(), name='producto_similares'),
    path('productos/<int:product_id>/frecuentes/', api_views.ProductoFrecuentesAPIView.as_view(), name='producto_frecuentes'),
    path('productos/<int:product_id>/resenas/', resena_api_views.ResenaListCreateAPIView.as_view(), name='producto_resenas'),
    path('productos/<int:product_id>/puede-resenar/', resena_api_views.PuedeResenarAPIView.as_view(), name='puede_resenar'),
    path('home/', api_views.HomeAPIView.as_view(), name='home'),
    path('csrf/', cart_api_views.CSRFAPIView.as_view(), name='csrf'),
    path('cart/', cart_api_views.CartAPIView.as_view(), name='cart'),
    path('cart/items/', cart_api_views.CartItemListAPIView.as_view(), name='cart_items'),
    path('cart/items/<int:item_id>/', cart_api_views.CartItemDetailAPIView.as_view(), name='cart_item_detail'),
    path('wishlist/', wishlist_api_views.WishlistAPIView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/', wishlist_api_views.WishlistItemAPIView.as_view(), name='wishlist_item'),
    path('wishlist/<int:product_id>/status/', wishlist_api_views.WishlistStatusAPIView.as_view(), name='wishlist_status'),
    path('contact/', api_views.ContactAPIView.as_view(), name='contact'),
    path('search/', api_views.SearchAPIView.as_view(), name='search'),
]
