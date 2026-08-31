from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .cart_services import CartService
from .serializers import CartSummarySerializer


def _summary_response(cart_service, status_code=status.HTTP_200_OK):
    summary = cart_service.get_cart_summary()
    data = CartSummarySerializer(summary).data
    return Response(data, status=status_code)


class CartAPIView(APIView):
    """GET /api/cart/ — resumen del carrito. DELETE /api/cart/ — vaciarlo."""

    def get(self, request):
        return _summary_response(CartService(request))

    def delete(self, request):
        service = CartService(request)
        service.clear_cart()
        return _summary_response(service)


class CartItemListAPIView(APIView):
    """POST /api/cart/items/ — agregar producto. Body: {product_id, quantity}."""

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            quantity = int(request.data.get('quantity', 1))
        except (TypeError, ValueError):
            return Response({'detail': 'Cantidad inválida'}, status=status.HTTP_400_BAD_REQUEST)

        if not product_id or quantity <= 0:
            return Response({'detail': 'Datos inválidos'}, status=status.HTTP_400_BAD_REQUEST)

        service = CartService(request)
        try:
            service.add_product(product_id, quantity)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return _summary_response(service, status.HTTP_201_CREATED)


class CartItemDetailAPIView(APIView):
    """PATCH /api/cart/items/<id>/ — cambiar cantidad. DELETE — eliminar item."""

    def patch(self, request, item_id):
        try:
            quantity = int(request.data.get('quantity'))
        except (TypeError, ValueError):
            return Response({'detail': 'Cantidad inválida'}, status=status.HTTP_400_BAD_REQUEST)

        service = CartService(request)
        try:
            service.update_quantity(item_id, quantity)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return _summary_response(service)

    def delete(self, request, item_id):
        service = CartService(request)
        service.remove_item(item_id)
        return _summary_response(service)


@method_decorator(ensure_csrf_cookie, name='get')
class CSRFAPIView(APIView):
    """GET /api/csrf/ — sin lógica propia, solo asegura que el navegador
    reciba la cookie csrftoken antes de la primera mutación del carrito."""

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})
