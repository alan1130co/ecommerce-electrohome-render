# application/order/views.py
from django.urls import reverse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from application.product.cart_services import CartService
from .order_services import OrderService
from .models import Order
from application.product.recommendations import RecommendationEngine
import re


@login_required
def checkout_view(request):
    """Vista de checkout"""
    cart_service = CartService(request)
    cart_summary = cart_service.get_cart_summary()
    
    if not cart_summary['items']:
        messages.warning(request, 'Tu carrito está vacío')
        return redirect('product:cart')
    
    # Calcular envío estimado
    shipping_cost = 15000
    
    context = {
        **cart_summary,
        'shipping_cost': shipping_cost,
        'grand_total': cart_summary['total'] + shipping_cost,
    }
    
    return render(request, 'order/checkout.html', context)


@login_required
@require_POST
def process_checkout(request):
    """Procesar el checkout y crear la orden (AJAX)"""
    try:
        cart_service = CartService(request)
        cart = cart_service.get_or_create_cart()
        
        if not cart.items.exists():
            return JsonResponse({
                'success': False,
                'message': 'Tu carrito está vacío'
            }, status=400)
        
        # Obtener y validar el teléfono
        phone = request.POST.get('phone', '')
        phone_cleaned = re.sub(r'\D', '', phone)  # Eliminar caracteres no numéricos
        
        # Validar que tenga exactamente 10 dígitos
        if len(phone_cleaned) != 10:
            return JsonResponse({
                'success': False,
                'message': 'El teléfono debe tener exactamente 10 números.'
            }, status=400)
        
        order_data = {
            'email': request.POST.get('email', request.user.email),
            'phone': phone_cleaned,  # Usar el teléfono limpio
            'shipping_address': request.POST.get('shipping_address'),
            'shipping_city': request.POST.get('shipping_city'),
            'shipping_department': request.POST.get('shipping_department'),
            'shipping_postal_code': request.POST.get('shipping_postal_code', ''),
            'payment_method': request.POST.get('payment_method', 'credit_card'),
            'notes': request.POST.get('notes', ''),
        }
        
        # Validar campos requeridos
        required_fields = ['phone', 'shipping_address', 'shipping_city', 'shipping_department']
        for field in required_fields:
            if not order_data.get(field):
                field_names = {
                    'phone': 'Teléfono',
                    'shipping_address': 'Dirección',
                    'shipping_city': 'Ciudad',
                    'shipping_department': 'Departamento'
                }
                return JsonResponse({
                    'success': False,
                    'message': f'El campo {field_names.get(field, field)} es requerido'
                }, status=400)
        
        # Crear la orden
        order = OrderService.create_order_from_cart(request.user, cart, order_data)
        
        if order.payment_status == 'approved':
            order.status = 'processing'
            order.save()
        
        
        
        # ===== ENVIAR EMAIL DE CONFIRMACIÓN =====
        try:
            subject = f'Confirmación de Pedido #{order.order_number} - ElectroHome'
            
            # Construir lista de productos
            items_text = ""
            for item in order.items.all():
                items_text += f"  • {item.product_name} x{item.quantity} - ${item.product_price:,.0f}\n"
            
            message = f'''
Hola {request.user.first_name or request.user.email},

¡Gracias por tu compra en ElectroHome! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETALLES DE TU PEDIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Número de pedido: #{order.order_number}
Estado: {order.get_status_display()}
Fecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}

PRODUCTOS:
{items_text}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: ${order.subtotal:,.0f} COP
Envío: ${order.shipping_cost:,.0f} COP
IVA: ${order.tax:,.0f} COP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: ${order.total:,.0f} COP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIRECCIÓN DE ENVÍO:
{order.shipping_address}
{order.shipping_city}, {order.shipping_department}
Código Postal: {order.shipping_postal_code or 'N/A'}
Teléfono: {order.phone}

MÉTODO DE PAGO:
{order.get_payment_method_display()}

{f"NOTAS: {order.notes}" if order.notes else ""}

Nos pondremos en contacto contigo pronto para coordinar la entrega.

¿Tienes preguntas? Responde a este correo.

Saludos,
El equipo de ElectroHome 🏠
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [order.email],
                fail_silently=False,
            )
            
            print(f"✅ Correo de confirmación enviado a {order.email}")
            
        except Exception as e:
            print(f"⚠️ Error al enviar correo: {e}")
            # No detenemos el proceso, solo registramos el error
        # ===== FIN EMAIL =====
        
        # Limpiar caché de recomendaciones
        engine = RecommendationEngine(user=request.user)
        engine.clear_user_cache()
        
        return JsonResponse({
            'success': True,
            'message': 'Orden creada exitosamente',
            'order_id': order.id,
            'order_number': order.order_number,
            'redirect_url': reverse('order:order_confirmation', kwargs={'order_id': order.id})
        })
        
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al procesar la orden'
        }, status=500)


@login_required
def order_confirmation(request, order_id):
    """Vista de confirmación de orden"""
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'order/order_confirmation.html', {'order': order})


@login_required
def order_list(request):
    """Lista de órdenes del usuario"""
    orders = Order.objects.filter(user=request.user).prefetch_related('items__product')
    return render(request, 'order/order_list.html', {'orders': orders})


@login_required
def order_detail(request, order_id):
    """Detalle de una orden"""
    order = get_object_or_404(
        Order.objects.prefetch_related('items__product'),
        id=order_id,
        user=request.user
    )
    return render(request, 'order/order_detail.html', {'order': order})