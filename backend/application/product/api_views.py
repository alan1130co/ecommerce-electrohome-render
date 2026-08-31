from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.cache import cache
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import (
    BannerPromocion, Categoria, Producto, ProductView, SeccionPromocional,
)
from .serializers import (
    BannerPromocionSerializer, CategoriaSerializer, ProductoDetailSerializer,
    ProductoListSerializer, SeccionPromocionalSerializer,
)
from .recommendations import RecommendationEngine, track_product_view, track_search_query

HOMEPAGE_API_CACHE_KEY = 'homepage_api_json_v1'
HOMEPAGE_API_CACHE_TIMEOUT = 60


class CategoriaListAPIView(generics.ListAPIView):
    """GET /api/categorias/ — categorías padre con sus subcategorías anidadas."""
    serializer_class = CategoriaSerializer
    pagination_class = None

    def get_queryset(self):
        return Categoria.objects.filter(
            activo=True, parent__isnull=True
        ).prefetch_related('subcategorias')


class ProductoListAPIView(generics.ListAPIView):
    """
    GET /api/productos/ — mismos filtros que la vista products_list:
    ?categoria=<id o nombre>&q=<busqueda>&precio_min=&precio_max=&disponible=1&orden=&page=
    """
    serializer_class = ProductoListSerializer

    def get_queryset(self):
        productos = Producto.objects.filter(activo=True).select_related(
            'categoria'
        ).prefetch_related('promociones')

        params = self.request.query_params

        categoria_id = params.get('categoria')
        if categoria_id:
            if categoria_id.isdigit():
                try:
                    cat = Categoria.objects.get(pk=categoria_id)
                    subcategoria_ids = list(cat.subcategorias.values_list('id', flat=True))
                    todos_ids = [cat.id] + subcategoria_ids
                    productos = productos.filter(categoria_id__in=todos_ids)
                except Categoria.DoesNotExist:
                    productos = productos.none()
            else:
                productos = productos.filter(categoria__nombre__iexact=categoria_id)

        search_query = params.get('q')
        if search_query:
            productos = productos.filter(
                Q(nombre__icontains=search_query) |
                Q(descripcion__icontains=search_query) |
                Q(marca__icontains=search_query)
            )

        precio_min = params.get('precio_min')
        precio_max = params.get('precio_max')
        if precio_min:
            productos = productos.filter(precio__gte=precio_min)
        if precio_max:
            productos = productos.filter(precio__lte=precio_max)

        if params.get('disponible') == '1':
            productos = productos.filter(stock__gt=0)

        orden = params.get('orden', '-fecha_creacion')
        orden_opciones = {
            'nombre_asc': 'nombre',
            'nombre_desc': '-nombre',
            'precio_asc': 'precio',
            'precio_desc': '-precio',
            'nuevo': '-fecha_creacion',
            'antiguo': 'fecha_creacion',
        }
        return productos.order_by(orden_opciones.get(orden, '-fecha_creacion'))


class ProductoDetailAPIView(generics.RetrieveAPIView):
    """GET /api/productos/<id>/ — equivalente a product_detail (sin reseñas, eso es fase de escritura)."""
    queryset = Producto.objects.filter(activo=True).select_related(
        'categoria'
    ).prefetch_related('galeria', 'promociones')
    serializer_class = ProductoDetailSerializer
    lookup_url_kwarg = 'product_id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mismo side-effect que la vista actual: registra la vista y limpia
        # el caché de recomendaciones del usuario si está logueado.
        track_product_view(request, instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProductoSimilaresAPIView(APIView):
    """GET /api/productos/<id>/similares/?limit=4 — usa RecommendationEngine.get_similar_products."""

    def get(self, request, product_id):
        producto = get_object_or_404(Producto, id=product_id)
        limit = int(request.query_params.get('limit', 4))
        user = request.user if request.user.is_authenticated else None
        engine = RecommendationEngine(user=user)
        similares = engine.get_similar_products(producto, limit=limit)
        return Response(ProductoListSerializer(similares, many=True).data)


class ProductoFrecuentesAPIView(APIView):
    """
    GET /api/productos/<id>/frecuentes/?limit=4
    Usa RecommendationEngine.get_frequently_bought_together, con el mismo
    fallback a productos similares que ya tiene product_detail.
    """

    def get(self, request, product_id):
        producto = get_object_or_404(Producto, id=product_id)
        limit = int(request.query_params.get('limit', 4))
        user = request.user if request.user.is_authenticated else None
        engine = RecommendationEngine(user=user)
        frecuentes = engine.get_frequently_bought_together(producto, limit=limit)
        if not frecuentes:
            frecuentes = engine.get_similar_products(producto, limit=limit)
        return Response(ProductoListSerializer(frecuentes, many=True).data)


class HomeAPIView(APIView):
    """
    GET /api/home/ — agregación equivalente a product/views.py::index,
    sin renderizar HTML. Reproduce exactamente la misma lógica de esa
    vista (no se pudo compartir como función porque no se debía tocar
    views.py) y aplica el mismo caché condicional: solo para anónimos,
    60s, nunca para usuarios autenticados (evita filtrar recomendaciones
    personalizadas entre usuarios).
    """

    def get(self, request):
        is_anonymous = not request.user.is_authenticated

        if is_anonymous:
            cached = cache.get(HOMEPAGE_API_CACHE_KEY)
            if cached is not None:
                return Response(cached)

        user = request.user if request.user.is_authenticated else None
        engine = RecommendationEngine(user=user)
        recomendaciones = engine.get_homepage_recommendations()

        ids_usados = set()
        hoy = timezone.now().date()

        # ── Ofertas especiales ──────────────────────────────────────
        ofertas_especiales = list(Producto.objects.filter(
            activo=True,
            stock__gt=0,
            promociones__activo=True,
            promociones__fecha_inicio__lte=timezone.now(),
            promociones__fecha_fin__gte=timezone.now(),
        ).select_related('categoria').prefetch_related('promociones').distinct()[:6])
        ids_usados.update(p.id for p in ofertas_especiales)

        # ── Secciones promocionales ─────────────────────────────────
        secciones_vigentes = SeccionPromocional.objects.filter(
            activo=True,
            fecha_inicio__lte=hoy,
            fecha_fin__gte=hoy,
        ).prefetch_related('productos_seccion__producto__categoria').order_by('orden')

        for seccion in secciones_vigentes:
            for ps in seccion.productos_seccion.all():
                ids_usados.add(ps.producto.id)

        # ── Recomendados ────────────────────────────────────────────
        recomendados = list(recomendaciones.get('personalized', []))
        if len(recomendados) < 15:
            ids_recomendados = {p.id for p in recomendados}
            adicionales = Producto.objects.filter(
                activo=True, stock__gt=0
            ).exclude(id__in=ids_recomendados
            ).select_related('categoria').prefetch_related('promociones').order_by('-fecha_creacion')[:15 - len(recomendados)]
            recomendados.extend(list(adicionales))

        # ── Más vendidos ────────────────────────────────────────────
        from application.order.models import OrderItem as OI
        ids_mas_vendidos = (
            OI.objects.filter(order__status='delivered')
            .values('product_id').annotate(total=Sum('quantity'))
            .order_by('-total').values_list('product_id', flat=True)[:30]
        )
        mas_vendidos = list(Producto.objects.filter(
            id__in=ids_mas_vendidos, activo=True, stock__gt=0
        ).exclude(id__in=ids_usados).select_related('categoria')[:15])

        if len(mas_vendidos) < 6:
            engine2 = RecommendationEngine(user=user)
            populares = engine2.get_popular_products(limit=30)
            ids_ya = ids_usados | {p.id for p in mas_vendidos}
            for p in populares:
                if p.id not in ids_ya:
                    mas_vendidos.append(p)
                    ids_ya.add(p.id)
                if len(mas_vendidos) >= 15:
                    break
        ids_usados.update(p.id for p in mas_vendidos)

        # ── Más vistos ──────────────────────────────────────────────
        ids_mas_vistos = (
            ProductView.objects.values('product_id').annotate(total=Count('id'))
            .order_by('-total').values_list('product_id', flat=True)[:30]
        )
        mas_vistos = list(Producto.objects.filter(
            id__in=ids_mas_vistos, activo=True, stock__gt=0
        ).exclude(id__in=ids_usados).select_related('categoria')[:15])

        if len(mas_vistos) < 6:
            adicionales = Producto.objects.filter(
                activo=True, stock__gt=0
            ).exclude(id__in=ids_usados | {p.id for p in mas_vistos}
            ).select_related('categoria').order_by('-fecha_creacion')[:15 - len(mas_vistos)]
            mas_vistos.extend(list(adicionales))
        ids_usados.update(p.id for p in mas_vistos)

        # ── Nuevos ──────────────────────────────────────────────────
        nuevos = list(
            Producto.objects.filter(activo=True, stock__gt=0)
            .exclude(id__in=ids_usados).select_related('categoria')
            .order_by('-fecha_creacion')[:15]
        )
        ids_usados.update(p.id for p in nuevos)

        # ── Carruseles por categoría ────────────────────────────────
        productos_cocina = Producto.objects.filter(
            categoria__nombre__icontains='cocina', activo=True, stock__gt=0
        ).exclude(id__in=ids_usados).select_related('categoria').order_by('-fecha_creacion')[:15]
        ids_usados.update(p.id for p in productos_cocina)

        productos_limpieza = Producto.objects.filter(
            categoria__nombre__icontains='limpieza', activo=True, stock__gt=0
        ).exclude(id__in=ids_usados).select_related('categoria').order_by('-fecha_creacion')[:15]

        banners = BannerPromocion.objects.filter(activo=True)

        data = {
            'ofertas_especiales': ProductoListSerializer(ofertas_especiales, many=True).data,
            'secciones_vigentes': SeccionPromocionalSerializer(secciones_vigentes, many=True).data,
            'recomendados': ProductoListSerializer(recomendados[:15], many=True).data,
            'mas_vendidos': ProductoListSerializer(mas_vendidos, many=True).data,
            'mas_vistos': ProductoListSerializer(mas_vistos, many=True).data,
            'nuevos': ProductoListSerializer(nuevos, many=True).data,
            'productos_cocina': ProductoListSerializer(productos_cocina, many=True).data,
            'productos_limpieza': ProductoListSerializer(productos_limpieza, many=True).data,
            'categorias': CategoriaSerializer(
                Categoria.objects.filter(activo=True).prefetch_related('subcategorias'), many=True
            ).data,
            'banners': BannerPromocionSerializer(banners, many=True).data,
        }

        if is_anonymous:
            cache.set(HOMEPAGE_API_CACHE_KEY, data, HOMEPAGE_API_CACHE_TIMEOUT)

        return Response(data)


class ContactAPIView(APIView):
    """
    POST /api/contact/ — equivalente EXACTO de product/views.py::contact.
    Aviso: esa vista hoy no envía correo ni guarda nada en la BD, solo
    confirma con un mensaje de éxito. Replicado tal cual, no es un bug
    nuevo de esta capa DRF.
    """

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        message = request.data.get('message', '').strip()

        if not (name and email and message):
            return Response({'detail': 'Nombre, correo y mensaje son obligatorios'}, status=400)

        return Response({'detail': '¡Gracias por contactarnos! Te responderemos pronto.'})


class SearchAPIView(APIView):
    """GET /api/search/?q=... — equivalente a search_view, misma lógica
    de query, mismo tracking, y las mismas sugerencias si no hay resultados."""

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        productos = []
        sugerencias = []

        if query:
            productos = Producto.objects.filter(
                Q(nombre__icontains=query) |
                Q(descripcion__icontains=query) |
                Q(categoria__nombre__icontains=query) |
                Q(marca__icontains=query)
            ).filter(stock__gt=0, activo=True).select_related('categoria')

            track_search_query(request, query, productos.count())

            if not productos.exists() and len(query) >= 3:
                sugerencias = Producto.objects.filter(
                    nombre__istartswith=query[:3],
                    activo=True,
                    stock__gt=0,
                ).select_related('categoria')[:6]

        return Response({
            'query': query,
            'total_results': len(productos) if isinstance(productos, list) else productos.count(),
            'productos': ProductoListSerializer(productos, many=True).data,
            'sugerencias': ProductoListSerializer(sugerencias, many=True).data,
        })
