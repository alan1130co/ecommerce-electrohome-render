from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


@receiver(user_logged_in)
def merge_cart_on_login(sender, request, user, **kwargs):
    try:
        from application.product.models import Cart

        # Intentar con la session_key actual
        session_key = request.session.session_key
        logger.warning(f"[SIGNAL CART MERGE] session actual: {session_key}")

        # Tambien revisar si hay session_key guardada antes del redirect de Google
        old_session_key = request.session.get('_cart_session_key')
        logger.warning(f"[SIGNAL CART MERGE] session guardada: {old_session_key}")

        # Probar con ambas keys
        session_cart = None
        for key in [session_key, old_session_key]:
            if key:
                session_cart = Cart.objects.filter(
                    session_key=key,
                    user__isnull=True
                ).first()
                if session_cart and session_cart.items.exists():
                    logger.warning(f"[SIGNAL CART MERGE] carrito encontrado con key: {key}")
                    break

        if not session_cart or not session_cart.items.exists():
            logger.warning("[SIGNAL CART MERGE] no hay items para migrar")
            return

        user_cart, created = Cart.objects.get_or_create(user=user)

        for item in session_cart.items.all():
            existing = user_cart.items.filter(product=item.product).first()
            if existing:
                existing.quantity += item.quantity
                existing.save()
                logger.warning(f"[SIGNAL CART MERGE] sumado: {item.product.nombre}")
            else:
                item.pk = None
                item.cart = user_cart
                item.save()
                logger.warning(f"[SIGNAL CART MERGE] movido: {item.product.nombre}")

        session_cart.delete()
        # Limpiar la key guardada
        if '_cart_session_key' in request.session:
            del request.session['_cart_session_key']
        logger.warning(f"[SIGNAL CART MERGE] merge exitoso para {user.email}")

    except Exception as e:
        logger.error(f"[SIGNAL CART MERGE] ERROR: {type(e).__name__}: {e}")
