import re

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from application.product.cart_services import CartService
from application.product.recommendations import RecommendationEngine

from .models import Order
from .order_services import OrderService
from .serializers import CheckoutSerializer, OrderSerializer


def _send_confirmation_email(order, user):
    """Mismo contenido que process_checkout — duplicado a propósito porque
    esa lógica vive inline en la vista y no se debía tocar views.py."""
    try:
        subject = f'Confirmación de Pedido #{order.order_number} - ElectroHome'

        items_text = ''.join(
            f"  • {item.product_name} x{item.quantity} - ${item.product_price:,.0f}\n"
            for item in order.items.all()
        )

        message = f'''
Hola {user.first_name or user.email},

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

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [order.email], fail_silently=False)
    except Exception as e:
        print(f"[WARN] Error al enviar correo: {e}")


class CheckoutAPIView(APIView):
    """
    POST /api/checkout/ — equivalente de process_checkout.
    Único método de pago disponible: contraentrega ('cash'). No hay
    integración con Wompi todavía — el cliente no elige método de pago.
    """

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión para continuar'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        cart_service = CartService(request)
        cart = cart_service.get_or_create_cart()

        if not cart.items.exists():
            return Response({'detail': 'Tu carrito está vacío'}, status=status.HTTP_400_BAD_REQUEST)

        phone_cleaned = re.sub(r'\D', '', data.get('phone', ''))
        if len(phone_cleaned) != 10:
            return Response(
                {'detail': 'El teléfono debe tener exactamente 10 números.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_data = {
            'email': data.get('email') or request.user.email,
            'phone': phone_cleaned,
            'shipping_address': data.get('shipping_address'),
            'shipping_city': data.get('shipping_city'),
            'shipping_department': data.get('shipping_department'),
            'shipping_postal_code': data.get('shipping_postal_code', ''),
            'payment_method': 'cash',
            'notes': data.get('notes', ''),
        }

        try:
            order = OrderService.create_order_from_cart(request.user, cart, order_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        _send_confirmation_email(order, request.user)

        engine = RecommendationEngine(user=request.user)
        engine.clear_user_cache()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListAPIView(generics.ListAPIView):
    """GET /api/orders/ — equivalente a order_list. Sin paginación, igual
    que la vista actual (Order.objects.filter(user=...) sin slicing)."""
    serializer_class = OrderSerializer
    pagination_class = None

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')

    def list(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión'}, status=status.HTTP_401_UNAUTHORIZED)
        return super().list(request, *args, **kwargs)


class OrderDetailAPIView(generics.RetrieveAPIView):
    """GET /api/orders/<id>/ — equivalente a order_detail (mismo filtro
    por user, así que un usuario nunca puede ver la orden de otro)."""
    serializer_class = OrderSerializer
    lookup_url_kwarg = 'order_id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items__product')

    def retrieve(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión'}, status=status.HTTP_401_UNAUTHORIZED)
        return super().retrieve(request, *args, **kwargs)
