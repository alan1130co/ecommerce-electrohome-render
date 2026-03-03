from .cart_services import CartService

def cart_context(request):
    """
    Context processor para hacer disponible el contador del carrito
    en todos los templates
    """
    try:
        cart_service = CartService(request)
        cart_summary = cart_service.get_cart_summary()
        return {
            'cart_items_count': cart_summary['total_items']
        }
    except:
        return {
            'cart_items_count': 0
        }