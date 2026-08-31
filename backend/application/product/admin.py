from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from .models import (
    Categoria, Producto, ImagenProducto,
    ProductView, SearchQuery, CartInteraction,
    Purchase, ProductRating, Wishlist, WishlistItem,
    UserRecommendation, Cart, CartItem, BannerPromocion,
    Promocion, Resena
)


# ========== CATEGORÍAS ==========

class SubcategoriaInline(admin.TabularInline):
    """Muestra las subcategorías dentro de una categoría padre"""
    model = Categoria
    fk_name = 'parent'
    extra = 1
    fields = ('nombre', 'descripcion', 'activo')
    verbose_name = 'Subcategoría'
    verbose_name_plural = 'Subcategorías'
    show_change_link = True


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'parent', 'tipo_categoria', 'activo', 'cantidad_productos', 'fecha_creacion')
    list_filter = ('activo', 'parent', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')
    list_editable = ('activo',)
    readonly_fields = ('fecha_creacion',)
    # ✅ Muestra subcategorías embebidas solo en categorías padre
    inlines = [SubcategoriaInline]

    def tipo_categoria(self, obj):
        if obj.parent:
            return format_html('<span style="color: #0066cc;">↳ Subcategoría</span>')
        if obj.subcategorias.exists():
            return format_html('<span style="color: #28a745; font-weight:bold;">📁 Padre</span>')
        return format_html('<span style="color: #999;">—</span>')
    tipo_categoria.short_description = 'Tipo'

    def cantidad_productos(self, obj):
        # Cuenta productos directos + productos de subcategorías
        directos = obj.productos.count()
        en_subcats = sum(s.productos.count() for s in obj.subcategorias.all())
        total = directos + en_subcats
        if en_subcats > 0:
            return format_html(
                '<strong>{}</strong> <span style="color:#999; font-size:0.85em;">({} directos + {} en subcats)</span>',
                total, directos, en_subcats
            )
        return format_html('<strong>{}</strong>', directos)
    cantidad_productos.short_description = 'Productos'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('parent')


# ========== PRODUCTOS ==========

class ImagenProductoInline(admin.TabularInline):
    model = ImagenProducto
    extra = 1
    fields = ('imagen', 'descripcion', 'orden')


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'nombre', 'marca', 'get_categoria', 'get_subcategoria',
        'precio', 'stock', 'activo', 'disponible', 'vistas_totales', 'fecha_creacion'
    )
    list_filter = ('activo', 'categoria__parent', 'categoria', 'marca', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion', 'marca', 'caracteristicas_destacadas')
    list_editable = ('activo', 'stock', 'precio')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    inlines = [ImagenProductoInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'categoria', 'imagen_principal', 'activo')
        }),
        ('Precio y Stock', {
            'fields': ('precio', 'stock')
        }),
        ('Especificaciones Técnicas', {
            'fields': ('marca', 'capacidad', 'potencia', 'color', 'garantia_meses'),
            'classes': ('collapse',),
            'description': 'Completa estos campos para habilitar filtros de búsqueda'
        }),
        ('Características Destacadas', {
            'fields': ('caracteristicas_destacadas',),
            'classes': ('collapse',),
            'description': 'Separa las características con comas. Ej: No Frost, Inverter, Digital'
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )

    def get_categoria(self, obj):
        """Muestra la categoría padre"""
        if obj.categoria.parent:
            return format_html('<span style="color:#999;">{}</span>', obj.categoria.parent.nombre)
        return format_html('<strong>{}</strong>', obj.categoria.nombre)
    get_categoria.short_description = 'Categoría'
    get_categoria.admin_order_field = 'categoria__parent__nombre'

    def get_subcategoria(self, obj):
        """Muestra la subcategoría si existe"""
        if obj.categoria.parent:
            return format_html('<span style="color:#0066cc;">↳ {}</span>', obj.categoria.nombre)
        return format_html('<span style="color:#ccc;">—</span>')
    get_subcategoria.short_description = 'Subcategoría'

    def vistas_totales(self, obj):
        count = obj.productview_set.count()
        if count > 0:
            return format_html('<span style="color: #0066cc; font-weight: bold;">{} 👁️</span>', count)
        return '0'
    vistas_totales.short_description = 'Vistas'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('categoria', 'categoria__parent')


# ========== IMÁGENES ==========

@admin.register(ImagenProducto)
class ImagenProductoAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'descripcion', 'orden', 'preview')
    list_filter = ('producto',)
    search_fields = ('producto__nombre', 'descripcion')
    list_editable = ('orden',)

    def preview(self, obj):
        if obj.imagen:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover;" />', obj.imagen)
        return '-'
    preview.short_description = 'Vista Previa'


# ========== ANALYTICS Y TRACKING ==========

@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user', 'product', 'viewed_at', 'ip_address')
    list_filter = ('viewed_at', 'product__categoria')
    search_fields = ('user__username', 'user__email', 'product__nombre', 'ip_address')
    date_hierarchy = 'viewed_at'
    readonly_fields = ('user', 'product', 'session_key', 'viewed_at', 'ip_address')

    def get_user(self, obj):
        if obj.user:
            return format_html('<strong>{}</strong>', obj.user.username)
        return format_html('<span style="color: #999;">Anónimo</span>')
    get_user.short_description = 'Usuario'

    def has_add_permission(self, request):
        return False


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ('id', 'query', 'get_user', 'results_count', 'searched_at')
    list_filter = ('searched_at', 'results_count')
    search_fields = ('query', 'user__username', 'user__email')
    date_hierarchy = 'searched_at'
    readonly_fields = ('user', 'session_key', 'query', 'results_count', 'searched_at')

    def get_user(self, obj):
        if obj.user:
            return format_html('<strong>{}</strong>', obj.user.username)
        return format_html('<span style="color: #999;">Anónimo</span>')
    get_user.short_description = 'Usuario'

    def has_add_permission(self, request):
        return False


@admin.register(CartInteraction)
class CartInteractionAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user', 'product', 'quantity', 'added_at', 'estado')
    list_filter = ('added_at', 'removed_at', 'product__categoria')
    search_fields = ('user__username', 'user__email', 'product__nombre')
    date_hierarchy = 'added_at'
    readonly_fields = ('user', 'product', 'session_key', 'quantity', 'added_at', 'removed_at')

    def get_user(self, obj):
        if obj.user:
            return format_html('<strong>{}</strong>', obj.user.username)
        return format_html('<span style="color: #999;">Anónimo</span>')
    get_user.short_description = 'Usuario'

    def estado(self, obj):
        if obj.removed_at:
            return format_html('<span style="color: red;">❌ Removido</span>')
        return format_html('<span style="color: green;">✅ En carrito</span>')
    estado.short_description = 'Estado'

    def has_add_permission(self, request):
        return False


# ========== COMPRAS Y RATINGS ==========

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'quantity', 'price', 'total_price', 'purchased_at')
    list_filter = ('purchased_at', 'product__categoria')
    search_fields = ('user__username', 'user__email', 'product__nombre')
    date_hierarchy = 'purchased_at'
    readonly_fields = ('user', 'product', 'quantity', 'price', 'purchased_at')

    def total_price(self, obj):
        total = obj.quantity * obj.price
        return format_html('<strong style="color: #28a745;">${:,.2f}</strong>', total)
    total_price.short_description = 'Total'

    def has_add_permission(self, request):
        return False


@admin.register(ProductRating)
class ProductRatingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'rating_stars', 'created_at', 'updated_at', 'tiene_resena')
    list_filter = ('rating', 'created_at', 'product__categoria')
    search_fields = ('user__username', 'user__email', 'product__nombre', 'review')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Información de Rating', {
            'fields': ('user', 'product', 'rating')
        }),
        ('Reseña', {
            'fields': ('review',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def rating_stars(self, obj):
        stars = '⭐' * obj.rating
        return format_html('<span style="font-size: 1.2em;">{}</span>', stars)
    rating_stars.short_description = 'Calificación'

    def tiene_resena(self, obj):
        if obj.review:
            return format_html('<span style="color: green;">✅ Sí</span>')
        return format_html('<span style="color: #999;">-</span>')
    tiene_resena.short_description = 'Reseña'


# ========== WISHLIST ==========

class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    readonly_fields = ('added_at',)
    raw_id_fields = ('product',)
    can_delete = True


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'get_total_items', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    list_filter = ('created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [WishlistItemInline]

    def get_total_items(self, obj):
        return obj.total_items
    get_total_items.short_description = 'Total Items'


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user', 'product', 'precio_producto', 'disponibilidad', 'added_at')
    search_fields = ('wishlist__user__email', 'product__nombre')
    list_filter = ('added_at', 'product__categoria', 'product__activo')
    readonly_fields = ('added_at',)
    raw_id_fields = ('wishlist', 'product')
    date_hierarchy = 'added_at'

    def get_user(self, obj):
        return format_html('<strong>{}</strong>', obj.wishlist.user.email)
    get_user.short_description = 'Usuario'

    def precio_producto(self, obj):
        return format_html('<strong>${:,.0f}</strong>', obj.product.precio)
    precio_producto.short_description = 'Precio'

    def disponibilidad(self, obj):
        if obj.product.disponible and obj.product.activo:
            return format_html('<span style="color: green;">✅ Disponible ({} en stock)</span>', obj.product.stock)
        elif not obj.product.activo:
            return format_html('<span style="color: red;">❌ Producto inactivo</span>')
        return format_html('<span style="color: red;">❌ Agotado</span>')
    disponibilidad.short_description = 'Disponibilidad'


# ========== RECOMENDACIONES ==========

@admin.register(UserRecommendation)
class UserRecommendationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'algorithm', 'score', 'cantidad_productos', 'calculated_at')
    list_filter = ('algorithm', 'calculated_at')
    search_fields = ('user__username', 'user__email')
    date_hierarchy = 'calculated_at'
    readonly_fields = ('calculated_at',)
    filter_horizontal = ('recommended_products',)

    def cantidad_productos(self, obj):
        count = obj.recommended_products.count()
        return format_html('<strong>{}</strong> productos', count)
    cantidad_productos.short_description = 'Productos'


# ========== CARRITO ==========

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'subtotal_display', 'added_at')
    can_delete = True
    fields = ('product', 'quantity', 'subtotal_display', 'added_at')

    def subtotal_display(self, obj):
        return format_html('<strong>${:,.0f}</strong>', obj.subtotal)
    subtotal_display.short_description = 'Subtotal'


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_user', 'total_items', 'subtotal_display', 'total_display', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'session_key')
    readonly_fields = ('created_at', 'updated_at', 'total_items', 'subtotal', 'tax', 'total')
    inlines = [CartItemInline]
    date_hierarchy = 'created_at'

    def get_user(self, obj):
        if obj.user:
            return format_html('<strong>{}</strong>', obj.user.username)
        return format_html('<span style="color: #999;">Anónimo</span>')
    get_user.short_description = 'Usuario'

    def subtotal_display(self, obj):
        return format_html('<span style="color: #666;">${:,.0f}</span>', obj.subtotal)
    subtotal_display.short_description = 'Subtotal'

    def total_display(self, obj):
        return format_html('<strong style="color: #28a745;">${:,.0f}</strong>', obj.total)
    total_display.short_description = 'Total'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart_user', 'product', 'quantity', 'subtotal_display', 'added_at')
    list_filter = ('added_at', 'product__categoria')
    search_fields = ('product__nombre', 'cart__user__username')
    readonly_fields = ('added_at', 'updated_at', 'subtotal')

    def cart_user(self, obj):
        if obj.cart.user:
            return obj.cart.user.username
        return 'Anónimo'
    cart_user.short_description = 'Usuario'

    def subtotal_display(self, obj):
        return format_html('<strong style="color: #28a745;">${:,.0f}</strong>', obj.subtotal)
    subtotal_display.short_description = 'Subtotal'


# ========== PROMOCIONES ==========

@admin.register(Promocion)
class PromocionAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'etiqueta', 'descuento_porcentaje', 'precio_promocional', 'activo', 'fecha_inicio', 'fecha_fin', 'vigente_display')
    list_filter = ('activo', 'fecha_inicio', 'fecha_fin')
    search_fields = ('producto__nombre', 'etiqueta')
    list_editable = ('activo',)

    def vigente_display(self, obj):
        if obj.vigente:
            return format_html('<span style="color: green;">✅ Vigente</span>')
        return format_html('<span style="color: red;">❌ Vencida</span>')
    vigente_display.short_description = 'Estado'


# ========== RESEÑAS ==========

@admin.register(Resena)
class ResenaAdmin(admin.ModelAdmin):
    list_display = ('id', 'producto', 'usuario', 'calificacion_stars', 'titulo', 'estado', 'creado_en')
    list_filter = ('estado', 'calificacion', 'creado_en')
    search_fields = ('producto__nombre', 'usuario__email', 'titulo', 'comentario')
    list_editable = ('estado',)
    readonly_fields = ('creado_en', 'revisado_en')

    fieldsets = (
        ('Información', {
            'fields': ('producto', 'usuario', 'calificacion', 'titulo', 'comentario', 'foto')
        }),
        ('Moderación', {
            'fields': ('estado', 'motivo_rechazo', 'creado_en', 'revisado_en')
        }),
    )

    def calificacion_stars(self, obj):
        return format_html('<span style="font-size:1.1em;">{}</span>', '⭐' * obj.calificacion)
    calificacion_stars.short_description = 'Calificación'


# ========== BANNERS ==========

@admin.register(BannerPromocion)
class BannerPromocionAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'orden', 'activo']
    list_editable = ['orden', 'activo']


# ========== PERSONALIZACIÓN DEL ADMIN SITE ==========
admin.site.site_header = "ElectroHome Admin"
admin.site.site_title = "ElectroHome"
admin.site.index_title = "Panel de Administración"