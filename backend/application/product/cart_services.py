from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Producto, Purchase
from application.order.models import Order, OrderItem
from .recommendations import track_cart_addition
from decimal import Decimal


class CartService:

    def __init__(self, request):
        self.request = request
        self.user = request.user if request.user.is_authenticated else None

        # ★ FORZAR que la sesión exista y esté persistida en BD siempre.
        # Esto es crítico para que el carrito anónimo sobreviva hasta el login.
        if not request.session.session_key:
            request.session.create()
        request.session.save()          # ← persistir en BD en cada request
        request.session.modified = True

        self.session_key = request.session.session_key

    def get_or_create_cart(self):
        if self.user:
            cart, created = Cart.objects.get_or_create(user=self.user)
            # Si hay una sesión activa, intentar migrar el carrito anónimo
            if self.session_key:
                self._migrate_session_cart(cart)
        else:
            cart, created = Cart.objects.get_or_create(session_key=self.session_key)
        return cart

    def _migrate_session_cart(self, user_cart):
        """
        Fusiona el carrito anónimo (por session_key) con el carrito del usuario.
        Se llama automáticamente cuando un usuario autenticado hace cualquier
        acción en el carrito, como respaldo al merge del login_view.
        """
        try:
            session_cart = Cart.objects.filter(
                session_key=self.session_key,
                user__isnull=True  # solo carritos anónimos
            ).first()

            if session_cart and session_cart.items.exists():
                for item in session_cart.items.all():
                    existing_item = user_cart.items.filter(product=item.product).first()
                    if existing_item:
                        existing_item.quantity += item.quantity
                        existing_item.save()
                    else:
                        item.pk = None  # forzar INSERT nuevo
                        item.cart = user_cart
                        item.save()
                session_cart.delete()

        except Cart.DoesNotExist:
            pass
        except Exception:
            pass  # nunca interrumpir el flujo normal del carrito

    def add_product(self, product_id, quantity=1):
        product = get_object_or_404(Producto, id=product_id, activo=True)

        if quantity > product.stock:
            raise ValueError(f"Stock insuficiente. Solo hay {product.stock} disponibles")

        cart = self.get_or_create_cart()

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            if cart_item.quantity > product.stock:
                raise ValueError(f"Stock insuficiente. Solo hay {product.stock} disponibles")
            cart_item.save()

        track_cart_addition(self.request, product, quantity)
        return cart_item

    def update_quantity(self, cart_item_id, quantity):
        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=cart_item_id, cart=cart)

        if quantity <= 0:
            cart_item.delete()
            return None

        if quantity > cart_item.product.stock:
            raise ValueError(f"Stock insuficiente. Solo hay {cart_item.product.stock} disponibles")

        cart_item.quantity = quantity
        cart_item.save()
        return cart_item

    def remove_item(self, cart_item_id):
        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=cart_item_id, cart=cart)
        cart_item.delete()

    def clear_cart(self):
        cart = self.get_or_create_cart()
        cart.clear()

    def get_cart_summary(self):
        cart = self.get_or_create_cart()
        items = cart.items.select_related('product', 'product__categoria').all()
        return {
            'cart': cart,
            'items': items,
            'total_items': cart.total_items,
            'subtotal': cart.subtotal,
            'tax': cart.tax,
            'total': cart.total,
        }