from django.contrib import admin
from .models import Order, OrderItem

# Inline para mostrar los items dentro de la orden
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    readonly_fields = ('subtotal',)
    fields = ('product', 'product_name', 'quantity', 'product_price', 'subtotal')
    
    def subtotal(self, obj):
        return obj.subtotal if obj.pk else 0
    subtotal.short_description = 'Subtotal'


class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'email', 'status', 'total', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at', 'shipping_city')
    search_fields = ('order_number', 'user__username', 'user__email', 'email', 'phone')
    list_editable = ('status',)
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'subtotal', 'tax', 'total')
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('order_number', 'user', 'status', 'created_at', 'updated_at')
        }),
        ('Datos de Contacto', {
            'fields': ('email', 'phone')
        }),
        ('Dirección de Envío', {
            'fields': ('shipping_address', 'shipping_city', 'shipping_department', 'shipping_postal_code')
        }),
        ('Información de Pago', {
            'fields': ('payment_method',)
        }),
        ('Montos', {
            'fields': ('subtotal', 'tax', 'shipping_cost', 'total'),
            'description': 'Los montos se calculan automáticamente.'
        }),
        ('Notas', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']


class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'product_name', 'quantity', 'product_price', 'get_subtotal')
    list_filter = ('order__status', 'product')
    search_fields = ('product__nombre', 'product_name', 'order__order_number', 'order__user__username')
    readonly_fields = ('get_subtotal',)
    
    def get_subtotal(self, obj):
        return obj.subtotal
    get_subtotal.short_description = 'Subtotal'


# Registrar modelos
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)