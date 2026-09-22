from django.urls import path

from . import api_views

app_name = 'order_api'

urlpatterns = [
    path('checkout/', api_views.CheckoutAPIView.as_view(), name='checkout'),
    path('checkout/calcular-envio/', api_views.CalcularEnvioAPIView.as_view(), name='calcular_envio'),
    path('ubicaciones/departamentos/', api_views.UbicacionesDepartamentosAPIView.as_view(), name='ubicaciones_departamentos'),
    path('ubicaciones/ciudades/', api_views.UbicacionesCiudadesAPIView.as_view(), name='ubicaciones_ciudades'),
    path('orders/', api_views.OrderListAPIView.as_view(), name='orders'),
    path('orders/<int:order_id>/', api_views.OrderDetailAPIView.as_view(), name='order_detail'),
]
