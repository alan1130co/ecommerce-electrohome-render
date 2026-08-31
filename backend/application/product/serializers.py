from rest_framework import serializers

from .models import (
    BannerPromocion, CartItem, Categoria, ImagenProducto, Producto,
    ProductoSeccion, Promocion, Resena, SeccionPromocional, WishlistItem,
)


class SubcategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']


class CategoriaSerializer(serializers.ModelSerializer):
    subcategorias = SubcategoriaSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = [
            'id', 'nombre', 'descripcion', 'parent',
            'subcategorias', 'es_subcategoria', 'es_categoria_padre',
        ]


class PromocionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promocion
        fields = [
            'id', 'descuento_porcentaje', 'precio_promocional',
            'etiqueta', 'fecha_inicio', 'fecha_fin', 'vigente',
        ]


class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados (products_list, home)."""
    categoria_id = serializers.IntegerField(source='categoria.id', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    promocion_activa = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'precio', 'stock', 'disponible',
            'imagen_principal', 'marca', 'categoria_id', 'categoria_nombre',
            'promocion_activa', 'fecha_creacion',
        ]

    def get_promocion_activa(self, obj):
        promo = obj.promociones.filter(activo=True).order_by('-created_at').first()
        if promo and promo.vigente:
            return PromocionSerializer(promo).data
        return None


class BannerPromocionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BannerPromocion
        fields = [
            'id', 'titulo', 'subtitulo', 'imagen', 'url_destino',
            'texto_boton', 'color_boton', 'orden',
        ]


class ProductoSeccionItemSerializer(serializers.ModelSerializer):
    producto = ProductoListSerializer(read_only=True)

    class Meta:
        model = ProductoSeccion
        fields = [
            'id', 'producto', 'descuento_porcentaje',
            'precio_promocional', 'orden', 'destacado', 'ahorro',
        ]


class SeccionPromocionalSerializer(serializers.ModelSerializer):
    productos_seccion = ProductoSeccionItemSerializer(many=True, read_only=True)

    class Meta:
        model = SeccionPromocional
        fields = [
            'id', 'nombre', 'slug', 'subtitulo', 'icono', 'color_acento',
            'orden', 'fecha_inicio', 'fecha_fin', 'mostrar_timer',
            'url_ver_todo', 'vigente', 'productos_seccion',
        ]


class CartItemSerializer(serializers.ModelSerializer):
    producto = ProductoListSerializer(source='product', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'producto', 'quantity', 'subtotal']


class CartSummarySerializer(serializers.Serializer):
    """Espeja exactamente el dict que devuelve CartService.get_cart_summary()."""
    total_items = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = CartItemSerializer(many=True)


class ImagenProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagenProducto
        fields = ['id', 'imagen', 'descripcion', 'orden']


class ProductoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para /api/productos/<id>/ — equivalente a product_detail."""
    categoria = CategoriaSerializer(read_only=True)
    galeria = ImagenProductoSerializer(many=True, read_only=True)
    promocion_activa = serializers.SerializerMethodField()
    caracteristicas_lista = serializers.ReadOnlyField()

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'stock', 'disponible',
            'categoria', 'imagen_principal', 'galeria', 'marca', 'capacidad',
            'potencia', 'color', 'caracteristicas_destacadas', 'caracteristicas_lista',
            'garantia_meses', 'fecha_creacion', 'promocion_activa',
        ]

    def get_promocion_activa(self, obj):
        promo = obj.promociones.filter(activo=True).order_by('-created_at').first()
        if promo and promo.vigente:
            return PromocionSerializer(promo).data
        return None


class WishlistItemSerializer(serializers.ModelSerializer):
    producto = ProductoListSerializer(source='product', read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'producto', 'added_at']


class ResenaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Resena
        fields = [
            'id', 'calificacion', 'titulo', 'comentario', 'foto',
            'estado', 'creado_en', 'usuario_nombre',
        ]
        read_only_fields = ['estado', 'creado_en']

    def get_usuario_nombre(self, obj):
        return obj.usuario.first_name or obj.usuario.email.split('@')[0]
