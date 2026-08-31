from django import forms
from .models import Usuario
import re

class RegisterForm(forms.ModelForm):
    password1 = forms.CharField(
        label="Contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control', 
            'placeholder': 'Contraseña (mín. 8 caracteres)',
            'autocomplete': 'new-password',  # ✅ Evita autocompletado
            'autocorrect': 'off',
            'autocapitalize': 'off',
            'spellcheck': 'false'
        }),
        help_text="Debe contener: mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial"
    )
    password2 = forms.CharField(
        label="Confirmar contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control', 
            'placeholder': 'Confirmar contraseña',
            'autocomplete': 'new-password',  # ✅ Evita autocompletado
            'autocorrect': 'off',
            'autocapitalize': 'off',
            'spellcheck': 'false'
        })
    )

    class Meta:
        model = Usuario
        fields = ['email', 'first_name', 'last_name', 'telefono']
        widgets = {
            'email': forms.EmailInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Correo electrónico',
                'autocomplete': 'off',  # ✅ Evita autocompletado
                'autocorrect': 'off',
                'autocapitalize': 'off',
                'spellcheck': 'false'
            }),
            'first_name': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Nombre',
                'autocomplete': 'off',  # ✅ Evita autocompletado
                'autocorrect': 'off',
                'autocapitalize': 'off',
                'spellcheck': 'false'
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': 'Apellido',
                'autocomplete': 'off',  # ✅ Evita autocompletado
                'autocorrect': 'off',
                'autocapitalize': 'off',
                'spellcheck': 'false'
            }),
            'telefono': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': '3001234567',
                'autocomplete': 'off',  # ✅ Evita autocompletado
                'autocorrect': 'off',
                'autocapitalize': 'off',
                'spellcheck': 'false'
            }),
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if Usuario.objects.filter(email=email).exists():
            raise forms.ValidationError("Este correo ya está registrado.")
        return email

    def clean_first_name(self):
        first_name = self.cleaned_data.get('first_name')
        if not first_name:
            raise forms.ValidationError("El nombre es obligatorio.")
        
        # Validar que tenga mínimo 3 letras
        if len(first_name.strip()) < 3:
            raise forms.ValidationError("El nombre debe tener al menos 3 letras.")
        
        # Solo letras y espacios
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', first_name):
            raise forms.ValidationError("El nombre solo puede contener letras y espacios.")
        
        return first_name.strip()

    def clean_last_name(self):
        last_name = self.cleaned_data.get('last_name')
        if not last_name:
            raise forms.ValidationError("El apellido es obligatorio.")
        
        # Validar que tenga mínimo 4 letras
        if len(last_name.strip()) < 4:
            raise forms.ValidationError("El apellido debe tener al menos 4 letras.")
        
        # Solo letras y espacios
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', last_name):
            raise forms.ValidationError("El apellido solo puede contener letras y espacios.")
        
        return last_name.strip()

    def clean_telefono(self):
        telefono = self.cleaned_data.get('telefono')
        if telefono:
            # Eliminar espacios y guiones
            telefono_limpio = telefono.replace(' ', '').replace('-', '')
            
            # Validar que tenga exactamente 10 dígitos (sin el +57)
            if not re.match(r'^\d{10}$', telefono_limpio):
                raise forms.ValidationError("El teléfono debe tener exactamente 10 dígitos (ejemplo: 3001234567)")
            
            return telefono_limpio
        return telefono

    def clean_password1(self):
        password = self.cleaned_data.get('password1')
        
        if not password:
            raise forms.ValidationError("La contraseña es obligatoria.")
        
        # Validar longitud mínima de 8 caracteres
        if len(password) < 8:
            raise forms.ValidationError("La contraseña debe tener al menos 8 caracteres.")
        
        # Validar que tenga al menos una mayúscula
        if not re.search(r'[A-Z]', password):
            raise forms.ValidationError("La contraseña debe contener al menos una letra mayúscula.")
        
        # Validar que tenga al menos un número
        if not re.search(r'\d', password):
            raise forms.ValidationError("La contraseña debe contener al menos un número.")
        
        # Validar que tenga al menos un carácter especial
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;\'`~]', password):
            raise forms.ValidationError("La contraseña debe contener al menos un carácter especial (!@#$%^&*...)")
        
        return password

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Las contraseñas no coinciden.")
        
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        # La contraseña debe ser encriptada
        user.set_password(self.cleaned_data['password1'])
        # El username se genera automáticamente en el método save() del modelo
        user.tipo_usuario = 'cliente'
        user.is_staff = False
        user.is_superuser = False
        
        if commit:
            user.save()
            # Agregar el backend para permitir login automático
            user.backend = 'django.contrib.auth.backends.ModelBackend'
        
        return user


class LoginForm(forms.Form):
    email = forms.EmailField(
        label="Correo electrónico",
        widget=forms.EmailInput(attrs={
            'class': 'form-control', 
            'placeholder': 'Correo electrónico',
            'autocomplete': 'off',  # ✅ Evita autocompletado
            'autocorrect': 'off',
            'autocapitalize': 'off',
            'spellcheck': 'false'
        })
    )
    password = forms.CharField(
        label="Contraseña",
        widget=forms.PasswordInput(attrs={
            'class': 'form-control', 
            'placeholder': 'Contraseña',
            'autocomplete': 'off',  # ✅ Evita autocompletado
            'autocorrect': 'off',
            'autocapitalize': 'off',
            'spellcheck': 'false'
        })
    )