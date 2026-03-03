# application/user/models.py
from django.contrib.auth.models import AbstractUser, UserManager as BaseUserManager
from django.db import models


class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        
        email = self.normalize_email(email)
        
        if 'username' not in extra_fields or not extra_fields.get('username'):
            import uuid
            base_username = email.split('@')[0]
            extra_fields['username'] = f"{base_username}_{uuid.uuid4().hex[:8]}"
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('tipo_usuario', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractUser):
    email = models.EmailField(unique=True, blank=False)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    codigo_postal = models.CharField(max_length=10, blank=True)
    tipo_usuario = models.CharField(
        max_length=20,
        choices=[
            ('cliente', 'Cliente'),
            ('admin', 'Administrador'),
            ('supervisor', 'Supervisor'),  # ← AGREGADO
        ],
        default='cliente'
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UsuarioManager()
    
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='grupos',
        blank=True,
        help_text='Los grupos a los que pertenece este usuario.',
        related_name='usuarios',
        related_query_name='usuario',
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='permisos de usuario',
        blank=True,
        help_text='Permisos específicos para este usuario.',
        related_name='usuarios',
        related_query_name='usuario',
    )
    
    def save(self, *args, **kwargs):
        if not self.username:
            import uuid
            base_username = self.email.split('@')[0]
            self.username = f"{base_username}_{uuid.uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
    
    @property
    def nombre_completo(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    def get_total_orders(self):
        return self.orders.count()

    def get_total_spent(self):
        from django.db.models import Sum
        result = self.orders.filter(
            status='delivered',
            payment_status='approved'
        ).aggregate(total_sum=Sum('total'))
        return result['total_sum'] if result['total_sum'] else 0
    
    def get_pending_orders(self):
        return self.orders.filter(status='pending').count()
    
    def get_completed_orders(self):
        return self.orders.filter(status='delivered').count()
    
    def get_processing_orders(self):
        return self.orders.filter(status__in=['processing', 'shipped']).count()
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-fecha_registro']


# Proxy Model para Administradores
class Administrador(Usuario):
    class Meta:
        proxy = True
        verbose_name = 'Administrador'
        verbose_name_plural = 'Administradores'
        app_label = 'auth'


# Proxy Model para Clientes
class Cliente(Usuario):
    class Meta:
        proxy = True
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'


# Proxy Model para Supervisores
class Supervisor(Usuario):
    class Meta:
        proxy = True
        verbose_name = 'Supervisor'
        verbose_name_plural = 'Supervisores'
        app_label = 'user'