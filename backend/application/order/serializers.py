from rest_framework import serializers

from .models import Order, OrderItem


class CheckoutSerializer(serializers.Serializer):
    """Datos de envío del checkout. payment_method no se acepta del cliente:
    hoy solo existe contraentrega (ver OrderService/CheckoutAPIView)."""
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField()
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField()
    shipping_department = serializers.CharField()
    shipping_postal_code = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'product_price', 'quantity', 'product_image', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'email', 'phone', 'shipping_address', 'shipping_city',
            'shipping_department', 'shipping_postal_code', 'payment_method',
            'payment_method_display', 'payment_status', 'subtotal', 'tax', 'shipping_cost',
            'total', 'status', 'status_display', 'notes', 'created_at', 'items',
        ]
