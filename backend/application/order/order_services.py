# application/order/order_services.py
import re
import unicodedata
from django.db import transaction
from decimal import Decimal
from .models import Order, OrderItem
from application.product.models import Producto, Purchase


class OrderService:
    """Servicio para manejar órdenes"""
    
    @staticmethod
    @transaction.atomic
    def create_order_from_cart(user, cart, order_data):
        """Crear orden desde el carrito"""

        # Un solo fetch con el producto ya cargado — antes esto se
        # consultaba dos veces (una por loop) y cada `item.product` sin
        # select_related disparaba una query aparte por ítem (N+1).
        items = list(cart.items.select_related('product').all())
        if not items:
            raise ValueError("El carrito está vacío")

        # Validar stock de todos los productos
        for item in items:
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

        # Preparar items de la orden, compras y actualización de stock en
        # memoria, y escribirlos en 3 queries (bulk) en vez de 3 por ítem.
        order_items = []
        purchases = []
        productos_a_actualizar = []
        for item in items:
            # ✅ Guardar la URL de la imagen al momento de la compra
            product_image = None
            if item.product.imagen_principal:
                try:
                    product_image = str(item.product.imagen_principal)
                except Exception:
                    product_image = None

            order_items.append(OrderItem(
                order=order,
                product=item.product,
                product_name=item.product.nombre,
                product_price=item.product.precio,
                quantity=item.quantity,
                product_image=product_image,  # ✅ NUEVO CAMPO
            ))

            item.product.stock -= item.quantity
            productos_a_actualizar.append(item.product)

            purchases.append(Purchase(
                user=user,
                product=item.product,
                quantity=item.quantity,
                price=item.product.precio,
            ))

        OrderItem.objects.bulk_create(order_items)
        Purchase.objects.bulk_create(purchases)
        Producto.objects.bulk_update(productos_a_actualizar, ['stock'])

        # Vaciar carrito
        cart.clear()

        return order
    
    @staticmethod
    def _normalize_city(city):
        """Minúsculas, sin tildes, sin sufijos administrativos (", D.C.",
        " D.C.", etc). Así "Bogotá", "bogota", "Bogotá, D.C." y cualquier
        variante futura del mismo estilo matchean la misma tarifa, sin
        tener que listar cada variante a mano en SHIPPING_COSTS."""
        if not city:
            return ''
        city = re.sub(r',?\s*D\.?\s*C\.?\s*$', '', city.strip(), flags=re.IGNORECASE)
        city = unicodedata.normalize('NFKD', city.lower())
        return ''.join(c for c in city if not unicodedata.combining(c)).strip()

    @staticmethod
    def _calculate_shipping(city):
        """Calcular costo de envío según la ciudad"""
        SHIPPING_COSTS = {
            'bogota': Decimal('10000'),
            'medellin': Decimal('15000'),
            'cali': Decimal('15000'),
            'barranquilla': Decimal('20000'),
            'cartagena': Decimal('20000'),
            # El dataset de departamentos/ciudades usa el nombre oficial
            # completo — es un alias real, no una variante de acentos/
            # sufijo que _normalize_city ya resuelva por sí sola.
            'cartagena de indias': Decimal('20000'),
            'bucaramanga': Decimal('18000'),
            'pereira': Decimal('18000'),
            'manizales': Decimal('18000'),
            'armenia': Decimal('18000'),
            'ibague': Decimal('18000'),
            'pasto': Decimal('25000'),
            'neiva': Decimal('20000'),
            'villavicencio': Decimal('18000'),
            'santa marta': Decimal('22000'),
            'cucuta': Decimal('22000'),
        }

        return SHIPPING_COSTS.get(OrderService._normalize_city(city), Decimal('15000'))
