from django.db import models
from django.conf import settings
from django.utils import timezone

# Create your models here.

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='productos')
    imagen_principal = models.CharField(max_length=500, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    # ===== NUEVOS CAMPOS PARA FILTROS =====
    marca = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Marca",
        help_text="Marca del electrodoméstico (Samsung, LG, Haceb, etc.)"
    )
    
    capacidad = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        verbose_name="Capacidad",
        help_text="Capacidad del producto (250L, 15kg, 1.5L, etc.)"
    )
    
    potencia = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        verbose_name="Potencia",
        help_text="Potencia eléctrica (1200W, 800W, etc.)"
    )
    
    color = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        verbose_name="Color",
        help_text="Color principal del producto"
    )
    
    caracteristicas_destacadas = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Características destacadas",
        help_text="Separadas por comas (ej: No Frost, Inverter, Digital, Automático)"
    )
    
    garantia_meses = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Garantía (meses)",
        help_text="Meses de garantía del producto"
    )

    def __str__(self):
        return self.nombre
    
    @property
    def disponible(self):
        return self.stock > 0
    
    @property
    def caracteristicas_lista(self):
        """Retorna las características como una lista"""
        if self.caracteristicas_destacadas:
            return [c.strip() for c in self.caracteristicas_destacadas.split(',')]
        return []
    
    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-fecha_creacion']

class ImagenProducto(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='galeria')
    imagen = models.CharField(max_length=500, blank=True, null=True)
    descripcion = models.CharField(max_length=255, blank=True)
    orden = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Imagen de {self.producto.nombre}"
    
    class Meta:
        verbose_name = 'Imagen de Producto'
        verbose_name_plural = 'Imágenes de Productos'
        ordering = ['orden']


# ============================================================
# NUEVOS MODELOS PARA RECOMENDACIONES
# ============================================================

class ProductView(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Producto, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['product', '-viewed_at']),
        ]
    
    def __str__(self):
        user_info = self.user.username if self.user else "Anonymous"
        return f"{user_info} - {self.product.nombre} - {self.viewed_at}"


class SearchQuery(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    query = models.CharField(max_length=200)
    results_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-searched_at']
        verbose_name_plural = "Search Queries"
    
    def __str__(self):
        user_info = self.user.username if self.user else "Anonymous"
        return f"{user_info} searched: {self.query}"


class CartInteraction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Producto, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    removed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-added_at']
    
    def __str__(self):
        user_info = self.user.username if self.user else "Anonymous"
        return f"{user_info} - {self.product.nombre} - Qty: {self.quantity}"


class Purchase(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Producto, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    purchased_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-purchased_at']
        indexes = [
            models.Index(fields=['user', '-purchased_at']),
            models.Index(fields=['product', '-purchased_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.product.nombre} - ${self.price}"


class ProductRating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Producto, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.product.nombre} - {self.rating}★"





class UserRecommendation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    recommended_products = models.ManyToManyField(Producto)
    score = models.FloatField(default=0.0)
    calculated_at = models.DateTimeField(auto_now=True)
    algorithm = models.CharField(max_length=50, default='collaborative')
    
    class Meta:
        ordering = ['-calculated_at']
    
    def __str__(self):
        return f"Recommendations for {self.user.username}"
    
# ============================================================
# MODELOS PARA CARRITO Y ÓRDENES
# ============================================================
# IMPORTANTE: Agregar estos imports al inicio del archivo si no los tienes:
# from django.core.validators import MinValueValidator
# from decimal import Decimal

class Cart(models.Model):
    """Carrito de compras"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='cart'
    )
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Carrito'
        verbose_name_plural = 'Carritos'
    
    def __str__(self):
        if self.user:
            return f"Carrito de {self.user.username}"
        return f"Carrito Anónimo ({self.session_key})"
    
    @property
    def total_items(self):
        """Total de productos en el carrito"""
        return sum(item.quantity for item in self.items.all())
    
    @property
    def subtotal(self):
        """Subtotal sin impuestos"""
        return sum(item.subtotal for item in self.items.all())
    
    @property
    def tax(self):
        """Impuesto (19% IVA en Colombia)"""
        from decimal import Decimal
        return self.subtotal * Decimal('0.19')
    
    @property
    def total(self):
        """Total con impuestos"""
        return self.subtotal + self.tax
    
    def clear(self):
        """Vaciar el carrito"""
        self.items.all().delete()


class CartItem(models.Model):
    """Items del carrito"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Producto, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Item del Carrito'
        verbose_name_plural = 'Items del Carrito'
        unique_together = ('cart', 'product')
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.nombre}"
    
    @property
    def subtotal(self):
        """Subtotal del item"""
        return self.product.precio * self.quantity
    
    def save(self, *args, **kwargs):
        """Validar stock antes de guardar"""
        if self.quantity > self.product.stock:
            raise ValueError(f"Stock insuficiente. Solo hay {self.product.stock} disponibles")
        super().save(*args, **kwargs)
        
# ===== LISTA DE DESEOS =====
class Wishlist(models.Model):
    """Lista de deseos del usuario"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lista de Deseos'
        verbose_name_plural = 'Listas de Deseos'
    
    def __str__(self):
        return f"Wishlist de {self.user.email}"
    
    @property
    def total_items(self):
        return self.items.count()


class WishlistItem(models.Model):
    """Items en la lista de deseos"""
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE
    )
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Item de Lista de Deseos'
        verbose_name_plural = 'Items de Lista de Deseos'
        unique_together = ('wishlist', 'product')  # Evitar duplicados
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.product.nombre} - {self.wishlist.user.email}"

class Promocion(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='promociones')
    descuento_porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    precio_promocional = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    etiqueta = models.CharField(max_length=50, default='OFERTA')
    activo = models.BooleanField(default=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'

    def __str__(self):
        return f"{self.etiqueta} - {self.producto.nombre}"

    def save(self, *args, **kwargs):
        if self.descuento_porcentaje and self.producto.precio:
            from decimal import Decimal
            self.precio_promocional = self.producto.precio * (1 - self.descuento_porcentaje / 100)
        super().save(*args, **kwargs)

    @property
    def vigente(self):
        hoy = timezone.now().date()
        return self.activo and self.fecha_inicio <= hoy <= self.fecha_fin
