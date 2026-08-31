from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

Usuario = get_user_model()

class EmailBackend(ModelBackend):
    """
    Permite autenticación con email
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Debug: imprimir lo que llega
        print(f"[DEBUG] authenticate - username recibido: {username}")
        print(f"[DEBUG] authenticate - password recibido: {'***' if password else 'None'}")

        if not username or not password:
            print("[ERROR] Username o password vacios")
            return None

        try:
            # Buscar usuario por email
            user = Usuario.objects.get(email=username)
            print(f"[OK] Usuario encontrado: {user.email}")

            # Verificar contraseña
            if user.check_password(password):
                print("[OK] Contrasena correcta")
                return user
            else:
                print("[ERROR] Contrasena incorrecta")
                return None

        except Usuario.DoesNotExist:
            print(f"[ERROR] No existe usuario con email: {username}")
            return None
        except Exception as e:
            print(f"[ERROR] Error inesperado: {e}")
            return None
    
    def get_user(self, user_id):
        try:
            return Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            return None