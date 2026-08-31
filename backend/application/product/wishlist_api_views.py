from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Producto, Wishlist, WishlistItem
from .serializers import WishlistItemSerializer


class WishlistAPIView(APIView):
    """GET /api/wishlist/ — equivalente a wishlist_view."""

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión'}, status=status.HTTP_401_UNAUTHORIZED)

        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        items = wishlist.items.select_related('product', 'product__categoria').all()
        return Response({
            'total_items': wishlist.total_items,
            'items': WishlistItemSerializer(items, many=True).data,
        })


class WishlistItemAPIView(APIView):
    """POST /api/wishlist/<product_id>/ — agregar. DELETE — quitar.
    Mismo comportamiento que add_to_wishlist/remove_from_wishlist."""

    def post(self, request, product_id):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión'}, status=status.HTTP_401_UNAUTHORIZED)

        producto = get_object_or_404(Producto, id=product_id)
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=producto)

        return Response(
            {
                'in_wishlist': True,
                'total_items': wishlist.total_items,
                'message': f'"{producto.nombre}" agregado a tu lista de deseos' if created else 'Este producto ya está en tu lista de deseos',
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, product_id):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión'}, status=status.HTTP_401_UNAUTHORIZED)

        wishlist = get_object_or_404(Wishlist, user=request.user)
        deleted, _ = WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).delete()

        return Response({
            'in_wishlist': False,
            'total_items': wishlist.total_items,
            'message': 'Eliminado de tu lista de deseos' if deleted else 'El producto no estaba en tu lista de deseos',
        })


class WishlistStatusAPIView(APIView):
    """GET /api/wishlist/<product_id>/status/ — equivalente a check_wishlist_status."""

    def get(self, request, product_id):
        if not request.user.is_authenticated:
            return Response({'in_wishlist': False, 'total_items': 0})

        wishlist = Wishlist.objects.filter(user=request.user).first()
        if not wishlist:
            return Response({'in_wishlist': False, 'total_items': 0})

        in_wishlist = WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).exists()
        return Response({'in_wishlist': in_wishlist, 'total_items': wishlist.total_items})
