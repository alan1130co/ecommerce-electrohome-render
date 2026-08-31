# application/order/order_services.py
from django.db import transaction
from decimal import Decimal
from .models import Order, OrderItem
from application.product.models import Purchase


class OrderService:
    """Servicio para manejar órdenes"""
    
    @staticmethod
    @transaction.atomic
    def create_order_from_cart(user, cart, order_data):
        """Crear orden desde el carrito"""
        
        if not cart.items.exists():
            raise ValueError("El carrito está vacío")
        
        # Validar stock de todos los productos
        for item in cart.items.all():
            if item.quantity > item.product.stock:
                raise ValueError(
                    f"Stock insuficiente para {item.product.nombre}. "
                    f"Solo hay {item.product.stock} disponibles"
                )
        
        # Calcular costo de envío
        shipping_cost = OrderService._calculate_shipping(order_data.get('shipping_city'))
        
        # Crear orden
        order = Order.objects.create(
            user=user,
            email=order_data.get('email', user.email),
            phone=order_data.get('phone'),
            shipping_address=order_data.get('shipping_address'),
            shipping_city=order_data.get('shipping_city'),
            shipping_department=order_data.get('shipping_department'),
            shipping_postal_code=order_data.get('shipping_postal_code', ''),
            payment_method=order_data.get('payment_method', 'credit_card'),
            subtotal=cart.subtotal,
            tax=cart.tax,
            shipping_cost=shipping_cost,
            total=cart.subtotal + cart.tax + shipping_cost,
            notes=order_data.get('notes', '')
        )
        
        # Crear items de la orden y actualizar stock
        for item in cart.items.all():
            # ✅ Guardar la URL de la imagen al momento de la compra
            product_image = None
            if item.product.imagen_principal:
                try:
                    product_image = str(item.product.imagen_principal)
                except Exception:
                    product_image = None

            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.nombre,
                product_price=item.product.precio,
                quantity=item.quantity,
                product_image=product_image,  # ✅ NUEVO CAMPO
            )
            
            # Actualizar stock
            item.product.stock -= item.quantity
            item.product.save()
            
            # Registrar compra para recomendaciones
            Purchase.objects.create(
                user=user,
                product=item.product,
                quantity=item.quantity,
                price=item.product.precio
            )
        
        # Vaciar carrito
        cart.clear()
        
        return order
    
    @staticmethod
    def _calculate_shipping(city):
        """Calcular costo de envío según la ciudad"""
        SHIPPING_COSTS = {
            'bogotá': Decimal('10000'),
            'bogota': Decimal('10000'),
            'medellín': Decimal('15000'),
            'medellin': Decimal('15000'),
            'cali': Decimal('15000'),
            'barranquilla': Decimal('20000'),
            'cartagena': Decimal('20000'),
            'bucaramanga': Decimal('18000'),
            'pereira': Decimal('18000'),
            'manizales': Decimal('18000'),
            'armenia': Decimal('18000'),
            'ibagué': Decimal('18000'),
            'ibague': Decimal('18000'),
            'pasto': Decimal('25000'),
            'neiva': Decimal('20000'),
            'villavicencio': Decimal('18000'),
            'santa marta': Decimal('22000'),
            'cúcuta': Decimal('22000'),
            'cucuta': Decimal('22000'),
        }
        
        city_lower = city.lower().strip() if city else ''
        return SHIPPING_COSTS.get(city_lower, Decimal('15000'))
