from rest_framework import serializers

from application.order.models import Order
from application.order.serializers import OrderSerializer
from application.product.models import BannerPromocion, Categoria, Promocion, Resena
from application.product.serializers import (
    BannerPromocionSerializer, CategoriaSerializer, ProductoDetailSerializer,
    ProductoListSerializer, ResenaSerializer,
)
from application.user.models import Usuario

# Re-exportado tal cual: el detalle de producto en el dashboard es idéntico
# al del storefront (misma info + galería), no hace falta duplicarlo.
ProductoAdminSerializer = ProductoDetailSerializer


class ProductoAdminListSerializer(ProductoListSerializer):
    """Igual que el listado del storefront + 'activo', porque el dashboard
    también debe mostrar productos desactivados (a diferencia de la tienda)."""

    class Meta(ProductoListSerializer.Meta):
        fields = ProductoListSerializer.Meta.fields + ['activo']


class CategoriaAdminSerializer(CategoriaSerializer):
    total_productos = serializers.SerializerMethodField()

    class Meta(CategoriaSerializer.Meta):
        fields = CategoriaSerializer.Meta.fields + ['activo', 'fecha_creacion', 'total_productos']

    def get_total_productos(self, obj):
        # Usa la annotation de la queryset si vino (categorias_list la trae);
        # si no, cuenta directo (fallback para create/update de una sola categoría).
        annotated = getattr(obj, 'total_productos', None)
        return annotated if annotated is not None else obj.productos.count()


class PromocionAdminSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    vigente = serializers.ReadOnlyField()

    class Meta:
        model = Promocion
        fields = [
            'id', 'producto', 'producto_nombre', 'descuento_porcentaje',
            'precio_promocional', 'etiqueta', 'activo', 'fecha_inicio',
            'fecha_fin', 'vigente', 'created_at',
        ]


class BannerAdminSerializer(BannerPromocionSerializer):
    class Meta(BannerPromocionSerializer.Meta):
        fields = BannerPromocionSerializer.Meta.fields + ['activo']


class ResenaAdminSerializer(ResenaSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)

    class Meta(ResenaSerializer.Meta):
        fields = ResenaSerializer.Meta.fields + [
            'motivo_rechazo', 'revisado_en', 'producto', 'producto_nombre', 'usuario_email',
        ]


class OrderAdminSerializer(OrderSerializer):
    """Igual que OrderSerializer (customer-facing) + identidad del comprador,
    que la vista de pedidos del dashboard necesita y el cliente no."""
    user_email = serializers.SerializerMethodField()
    user_nombre = serializers.SerializerMethodField()

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['user_email', 'user_nombre']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_user_nombre(self, obj):
        return obj.user.nombre_completo if obj.user else 'Invitado'


class UsuarioAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'first_name', 'last_name', 'telefono', 'ciudad',
            'fecha_registro', 'is_staff', 'is_active', 'tipo_usuario',
        ]
