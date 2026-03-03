from django import forms
from application.product.models import Producto, Categoria


class ProductoForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = [
            'nombre', 'descripcion', 'categoria', 'precio', 'stock',
            'marca', 'capacidad', 'potencia', 'color', 'garantia_meses',
            'caracteristicas_destacadas', 'imagen_principal', 'activo'
        ]
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del producto'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción completa del producto'
            }),
            'categoria': forms.Select(attrs={'class': 'form-select'}),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01'
            }),
            'stock': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0'
            }),
            'marca': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Marca del producto'
            }),
            'capacidad': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 100L, 2.5 HP'
            }),
            'potencia': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 1500W'
            }),
            'color': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Color principal'
            }),
            'garantia_meses': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '12'
            }),
            'caracteristicas_destacadas': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Separa con comas (No Frost, Inverter, Digital)'
            }),
            'imagen_principal': forms.FileInput(attrs={'class': 'form-control'}),
            'activo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'nombre': 'Nombre del Producto',
            'descripcion': 'Descripción',
            'categoria': 'Categoría',
            'precio': 'Precio ($)',
            'stock': 'Stock',
            'marca': 'Marca',
            'capacidad': 'Capacidad',
            'potencia': 'Potencia',
            'color': 'Color',
            'garantia_meses': 'Garantía (meses)',
            'caracteristicas_destacadas': 'Características Destacadas',
            'imagen_principal': 'Imagen Principal',
            'activo': 'Producto Activo',
        }


class CategoriaForm(forms.ModelForm):
    class Meta:
        model = Categoria
        fields = ['nombre', 'descripcion', 'activo']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre de la categoría'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción de la categoría'
            }),
            'activo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'nombre': 'Nombre de la Categoría',
            'descripcion': 'Descripción',
            'activo': 'Categoría Activa',
        }


# form para imágenes adicionales usadas en el dashboard
from application.product.models import ImagenProducto

class ImagenProductoForm(forms.ModelForm):
    class Meta:
        model = ImagenProducto
        fields = ['imagen', 'descripcion', 'orden']
        widgets = {
            'imagen': forms.FileInput(attrs={'class': 'form-control'}),
            'descripcion': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Descripción (opcional)'
            }),
            'orden': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0'
            }),
        }
        labels = {
            'imagen': 'Archivo de imagen',
            'descripcion': 'Texto descriptivo',
            'orden': 'Orden (0 = primero)'
        }
from application.product.models import Promocion

class PromocionForm(forms.ModelForm):
    class Meta:
        model = Promocion
        fields = ['producto', 'descuento_porcentaje', 'etiqueta', 'fecha_inicio', 'fecha_fin', 'activo']
        widgets = {
            'producto': forms.Select(attrs={'class': 'form-select'}),
            'descuento_porcentaje': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '1', 'max': '99'}),
            'etiqueta': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: OFERTA, BLACK FRIDAY'}),
            'fecha_inicio': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'activo': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }