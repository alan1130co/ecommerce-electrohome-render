from django.urls import path

from . import api_views

app_name = 'order_api'

urlpatterns = [
    path('checkout/', api_views.CheckoutAPIView.as_view(), name='checkout'),
    path('orders/', api_views.OrderListAPIView.as_view(), name='orders'),
    path('orders/<int:order_id>/', api_views.OrderDetailAPIView.as_view(), name='order_detail'),
]
