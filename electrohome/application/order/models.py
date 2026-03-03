# application/order/models.py
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from application.product.models import Producto
import random
import string
from django.utils import timezone


class Order(models.Model):
    """Orden de compra"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('shipped', 'Enviado'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('credit_card', 'Tarjeta de Crédito'),
        ('debit_card', 'Tarjeta de Débito'),
        ('pse', 'PSE'),
        ('nequi', 'Nequi'),
        ('bancolombia', 'Bancolombia Transfer'),
        ('cash', 'Efectivo Contraentrega'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('declined', 'Rechazado'),
        ('error', 'Error'),
    ]
    
    # Validador para el teléfono
    phone_validator = RegexValidator(
        regex=r'^\d{10}$',
        message='El número de teléfono debe contener exactamente 10 dígitos numéricos.'
    )
    
    # Información del usuario
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    
    # Datos de contacto
    email = models.EmailField()
    phone = models.CharField(
        max_length=10,
        validators=[phone_validator],
        verbose_name='Teléfono',
        help_text='Ingrese 10 dígitos numéricos'
    )
    
    # Dirección de envío
    shipping_address = models.CharField(max_length=255, verbose_name='Dirección')
    shipping_city = models.CharField(max_length=100, verbose_name='Ciudad')
    shipping_department = models.CharField(max_length=100, verbose_name='Departamento')
    shipping_postal_code = models.CharField(max_length=20, verbose_name='Código Postal', blank=True)
    
    # Información de pago
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='credit_card'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        verbose_name='Estado del pago'
    )
    
    # ===== CAMPOS DE WOMPI =====
    wompi_transaction_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='ID de transacción Wompi'
    )
    wompi_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Referencia de pago Wompi'
    )
    wompi_payment_link = models.URLField(
        blank=True,
        null=True,
        verbose_name='Link de pago Wompi'
    )
    # ===== FIN CAMPOS WOMPI =====
    
    # Montos
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Estado y fechas
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, verbose_name='Notas adicionales')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Número de orden único
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    
    class Meta:
        verbose_name = 'Orden'
        verbose_name_plural = 'Órdenes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Orden #{self.order_number} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generar número de orden único
            date_str = timezone.now().strftime('%Y%m%d')
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            self.order_number = f"EH{date_str}{random_str}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """Items de la orden"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Producto, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)  # Guardar nombre por si se elimina el producto
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    
    class Meta:
        verbose_name = 'Item de Orden'
        verbose_name_plural = 'Items de Orden'
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
    
    @property
    def subtotal(self):
        return self.product_price * self.quantity