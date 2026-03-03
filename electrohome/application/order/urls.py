from django.urls import path
from . import views

app_name = 'order'

urlpatterns = [
    path('checkout/', views.checkout_view, name='checkout'),
    path('process-checkout/', views.process_checkout, name='process_checkout'),
    path('<int:order_id>/', views.order_confirmation, name='order_confirmation'),
    path('list/', views.order_list, name='order_list'),
    path('detail/<int:order_id>/', views.order_detail, name='order_detail'),
]