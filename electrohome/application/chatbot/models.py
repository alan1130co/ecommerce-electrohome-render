from django.db import models
from django.conf import settings

class Conversation(models.Model):
    """Modelo para almacenar conversaciones del chatbot"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Conversación {self.session_id} - {self.created_at}"


class Message(models.Model):
    """Modelo para almacenar mensajes individuales"""
    ROLE_CHOICES = [
        ('user', 'Usuario'),
        ('assistant', 'Asistente'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class Order(models.Model):
    """Modelo para pedidos (para el seguimiento)"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('processing', 'En Proceso'),
        ('shipped', 'Enviado'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
    ]
    
    order_number = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chatbot_orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    product_name = models.CharField(max_length=200)
    product_quantity = models.IntegerField(default=1)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    tracking_number = models.CharField(max_length=50, blank=True, null=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido {self.order_number} - {self.status}"


class FAQ(models.Model):
    """Modelo para preguntas frecuentes"""
    question = models.CharField(max_length=300)
    answer = models.TextField()
    category = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Pregunta Frecuente"
        verbose_name_plural = "Preguntas Frecuentes"
        ordering = ['category', 'question']
    
    def __str__(self):
        return self.question


class Product(models.Model):
    """Modelo para productos de Electrohome"""
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    specifications = models.JSONField(default=dict)
    stock = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - ${self.price}"