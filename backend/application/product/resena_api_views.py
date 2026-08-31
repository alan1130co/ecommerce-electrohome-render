from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Producto, Resena
from .serializers import ResenaSerializer


class ResenaListCreateAPIView(APIView):
    """
    GET /api/productos/<id>/resenas/ — reseñas aprobadas del producto.
    POST — crear reseña, mismas reglas que crear_resena: solo quien
    recibió el producto (Order.status='delivered') y una sola vez.
    """

    def get(self, request, product_id):
        resenas = Resena.objects.filter(
            producto_id=product_id, estado='aprobada'
        ).select_related('usuario').order_by('-creado_en')
        return Response(ResenaSerializer(resenas, many=True).data)

    def post(self, request, product_id):
        if not request.user.is_authenticated:
            return Response({'detail': 'Debes iniciar sesión'}, status=status.HTTP_401_UNAUTHORIZED)

        from application.order.models import OrderItem

        producto = get_object_or_404(Producto, id=product_id)

        compro = OrderItem.objects.filter(
            order__user=request.user, order__status='delivered', product=producto
        ).exists()
        if not compro:
            return Response(
                {'detail': 'Solo puedes reseñar productos que hayas recibido.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if Resena.objects.filter(producto=producto, usuario=request.user).exists():
            return Response(
                {'detail': 'Ya dejaste una reseña para este producto.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            calificacion = int(request.data.get('calificacion', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'Calificación inválida'}, status=status.HTTP_400_BAD_REQUEST)

        comentario = request.data.get('comentario', '').strip()
        titulo = request.data.get('titulo', '').strip()

        if not (1 <= calificacion <= 5):
            return Response({'detail': 'La calificación debe ser entre 1 y 5.'}, status=status.HTTP_400_BAD_REQUEST)
        if not comentario:
            return Response({'detail': 'El comentario no puede estar vacío.'}, status=status.HTTP_400_BAD_REQUEST)

        resena = Resena.objects.create(
            producto=producto,
            usuario=request.user,
            calificacion=calificacion,
            titulo=titulo,
            comentario=comentario,
            foto=request.FILES.get('foto'),
            estado='pendiente',
        )
        return Response(ResenaSerializer(resena).data, status=status.HTTP_201_CREATED)


class PuedeResenarAPIView(APIView):
    """GET /api/productos/<id>/puede-resenar/ — para mostrar/ocultar el
    formulario de reseña en el frontend, misma lógica que product_detail."""

    def get(self, request, product_id):
        if not request.user.is_authenticated:
            return Response({'autenticado': False, 'puede_resenar': False, 'ya_reseno': False})

        from application.order.models import OrderItem

        compro = OrderItem.objects.filter(
            order__user=request.user, order__status='delivered', product_id=product_id
        ).exists()
        ya_reseno = Resena.objects.filter(producto_id=product_id, usuario=request.user).exists()

        return Response({
            'autenticado': True,
            'puede_resenar': compro and not ya_reseno,
            'ya_reseno': ya_reseno,
        })
