# cart_services.py - Crear este archivo en tu app

from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Cart, CartItem, Producto, Purchase
from application.order.models import Order, OrderItem
from .recommendations import track_cart_addition
from decimal import Decimal


class CartService:
    """Servicio para manejar operaciones del carrito"""
    
    def __init__(self, request):
        self.request = request
        self.user = request.user if request.user.is_authenticated else None
        self.session_key = request.session.session_key
        
        # Crear sesión si no existe
        if not self.session_key and not self.user:
            request.session.create()
            self.session_key = request.session.session_key
    
    def get_or_create_cart(self):
        """Obtener o crear carrito"""
        if self.user:
            cart, created = Cart.objects.get_or_create(user=self.user)
            
            # Migrar carrito de sesión si existe
            if self.session_key:
                self._migrate_session_cart(cart)
        else:
            cart, created = Cart.objects.get_or_create(session_key=self.session_key)
        
        return cart
    
    def _migrate_session_cart(self, user_cart):
        """Migrar items del carrito de sesión al carrito del usuario"""
        try:
            session_cart = Cart.objects.get(session_key=self.session_key)
            
            for item in session_cart.items.all():
                existing_item = user_cart.items.filter(product=item.product).first()
                
                if existing_item:
                    # Sumar cantidades
                    existing_item.quantity += item.quantity
                    existing_item.save()
                else:
                    # Mover item
                    item.cart = user_cart
                    item.save()
            
            # Eliminar carrito de sesión
            session_cart.delete()
        except Cart.DoesNotExist:
            pass
    
    def add_product(self, product_id, quantity=1):
        """Agregar producto al carrito"""
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
            # Item ya existe, actualizar cantidad
            cart_item.quantity += quantity
            if cart_item.quantity > product.stock:
                raise ValueError(f"Stock insuficiente. Solo hay {product.stock} disponibles")
            cart_item.save()
        
        # Trackear para recomendaciones
        track_cart_addition(self.request, product, quantity)
        
        return cart_item
    
    def update_quantity(self, cart_item_id, quantity):
        """Actualizar cantidad de un item"""
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
        """Eliminar item del carrito"""
        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=cart_item_id, cart=cart)
        cart_item.delete()
    
    def clear_cart(self):
        """Vaciar el carrito"""
        cart = self.get_or_create_cart()
        cart.clear()
    
    def get_cart_summary(self):
        """Obtener resumen del carrito"""
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
