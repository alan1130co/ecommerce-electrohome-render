from django.contrib import admin
from .models import Conversation, Message, Order, FAQ, Product


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['session_id', 'user__username']
    readonly_fields = ['session_id', 'created_at', 'updated_at']


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['role', 'content', 'timestamp']
    can_delete = False


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'content_preview', 'timestamp']
    list_filter = ['role', 'timestamp']
    search_fields = ['content', 'conversation__session_id']
    readonly_fields = ['conversation', 'role', 'content', 'timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Contenido'


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'product_name', 'total_amount', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order_number', 'user__username', 'product_name', 'tracking_number']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('order_number', 'user', 'status')
        }),
        ('Detalles del Producto', {
            'fields': ('product_name', 'product_quantity', 'total_amount')
        }),
        ('Envío', {
            'fields': ('shipping_address', 'tracking_number', 'estimated_delivery')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['question', 'answer']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Pregunta', {
            'fields': ('question', 'category')
        }),
        ('Respuesta', {
            'fields': ('answer',)
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'price', 'stock', 'is_available', 'created_at']
    list_filter = ['category', 'brand', 'is_available']
    search_fields = ['name', 'description', 'brand']
    list_editable = ['price', 'stock', 'is_available']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'category', 'brand')
        }),
        ('Precio e Inventario', {
            'fields': ('price', 'stock', 'is_available')
        }),
        ('Descripción', {
            'fields': ('description', 'specifications', 'image_url')
        }),
    )