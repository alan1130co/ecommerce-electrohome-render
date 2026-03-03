from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .models import Usuario, Administrador, Cliente, Supervisor


# Admin para Administradores
class AdministradorAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'fecha_registro')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'fecha_registro')
    search_fields = ('email', 'first_name', 'last_name', 'telefono')
    ordering = ('-fecha_registro',)
    
    fieldsets = (
        ('Información de Autenticación', {
            'fields': ('email', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'telefono')
        }),
        ('Permisos de Administrador', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'fecha_registro'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Crear Administrador', {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_superuser'),
        }),
    )
    
    readonly_fields = ('last_login', 'fecha_registro')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_staff=True) | qs.filter(is_superuser=True)
    
    def save_model(self, request, obj, form, change):
        obj.tipo_usuario = 'admin'
        if not change:
            obj.is_staff = True
        super().save_model(request, obj, form, change)


# Formularios para Clientes
class ClienteCreationForm(UserCreationForm):
    class Meta:
        model = Cliente
        fields = ('email', 'first_name', 'last_name', 'telefono', 'direccion', 'ciudad', 'codigo_postal')
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.tipo_usuario = 'cliente'
        user.is_staff = False
        user.is_superuser = False
        if commit:
            user.save()
        return user


class ClienteChangeForm(UserChangeForm):
    class Meta:
        model = Cliente
        fields = '__all__'


# Admin para Clientes
class ClienteAdmin(BaseUserAdmin):
    form = ClienteChangeForm
    add_form = ClienteCreationForm
    
    list_display = ('email', 'first_name', 'last_name', 'telefono', 'ciudad', 'fecha_registro')
    list_filter = ('is_active', 'fecha_registro', 'ciudad')
    search_fields = ('email', 'first_name', 'last_name', 'telefono')
    ordering = ('-fecha_registro',)
    
    fieldsets = (
        ('Información de Cuenta', {
            'fields': ('email', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'telefono')
        }),
        ('Dirección', {
            'fields': ('direccion', 'ciudad', 'codigo_postal')
        }),
        ('Estado', {
            'fields': ('is_active', 'fecha_registro'),
        }),
    )
    
    add_fieldsets = (
        ('Crear Cliente', {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'telefono', 'direccion', 'ciudad', 'codigo_postal', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('fecha_registro',)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_staff=False, is_superuser=False)
    
    def save_model(self, request, obj, form, change):
        obj.tipo_usuario = 'cliente'
        obj.is_staff = False
        obj.is_superuser = False
        super().save_model(request, obj, form, change)


# Admin para Supervisores
class SupervisorAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'fecha_registro')
    list_filter = ('is_active', 'fecha_registro')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-fecha_registro',)

    fieldsets = (
        ('Información de Cuenta', {
            'fields': ('email', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'telefono')
        }),
        ('Estado', {
            'fields': ('is_active', 'fecha_registro'),
        }),
    )

    add_fieldsets = (
        ('Crear Supervisor', {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    readonly_fields = ('fecha_registro',)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(tipo_usuario='supervisor')

    def save_model(self, request, obj, form, change):
        obj.tipo_usuario = 'supervisor'
        obj.is_staff = True
        obj.is_superuser = False
        super().save_model(request, obj, form, change)


# Desregistrar Group original
admin.site.unregister(Group)

# Registrar Administradores
admin.site.register(Administrador, AdministradorAdmin)

# Re-registrar Group
admin.site.register(Group)

# Registrar Clientes
admin.site.register(Cliente, ClienteAdmin)

# Registrar Supervisores
admin.site.register(Supervisor, SupervisorAdmin)