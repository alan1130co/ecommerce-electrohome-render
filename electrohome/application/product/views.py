from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.http import require_POST
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, Min, Max

from .models import Producto, Categoria, Promocion, BannerPromocion, ProductView
from .cart_services import CartService
from .recommendations import (
    RecommendationEngine,
    track_product_view,
    get_recommendations_for_cart
)
from application.order.models import Order, OrderItem
from application.product.models import Resena

HOMEPAGE_ANON_CACHE_KEY = 'homepage_anon_html_v1'
HOMEPAGE_ANON_CACHE_TIMEOUT = 60


def index(request):
    from django.db.models import Count, Sum
    from django.utils import timezone
    from application.product.models import SeccionPromocional, Promocion

    is_anonymous = not request.user.is_authenticated
    if is_anonymous:
        cached_html = cache.get(HOMEPAGE_ANON_CACHE_KEY)
        if cached_html is not None:
            return HttpResponse(cached_html)

    user = request.user if request.user.is_authenticated else None
    engine = RecommendationEngine(user=user)
    recomendaciones = engine.get_homepage_recommendations()

    ids_usados = set()
    hoy = timezone.now().date()

    # ── Ofertas especiales ────────────────────────────────────────────
    ofertas_especiales = list(Producto.objects.filter(
        activo=True,
        stock__gt=0,
        promociones__activo=True,
        promociones__fecha_inicio__lte=timezone.now(),
        promociones__fecha_fin__gte=timezone.now(),
    ).select_related('categoria').prefetch_related('promociones').distinct()[:6])

    ids_usados.update(p.id for p in ofertas_especiales)

    # ── Secciones promocionales ───────────────────────────────────────
    secciones_vigentes = SeccionPromocional.objects.filter(
        activo=True,
        fecha_inicio__lte=hoy,
        fecha_fin__gte=hoy,
    ).prefetch_related(
        'productos_seccion__producto__categoria'
    ).order_by('orden')

    for seccion in secciones_vigentes:
        for ps in seccion.productos_seccion.all():
            ids_usados.add(ps.producto.id)

    # ── Recomendados ──────────────────────────────────────────────────
    recomendados = list(recomendaciones.get('personalized', []))

    if len(recomendados) < 15:
        ids_recomendados = {p.id for p in recomendados}
        adicionales = Producto.objects.filter(
            activo=True, stock__gt=0
        ).exclude(id__in=ids_recomendados
        ).select_related('categoria').prefetch_related('promociones').order_by('-fecha_creacion')[:15 - len(recomendados)]
        recomendados.extend(list(adicionales))

    # ── Más vendidos ──────────────────────────────────────────────────
    from application.order.models import OrderItem as OI
    ids_mas_vendidos = (
        OI.objects.filter(order__status='delivered')
        .values('product_id')
        .annotate(total=Sum('quantity'))
        .order_by('-total')
        .values_list('product_id', flat=True)[:30]
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

    # ── Más vistos ────────────────────────────────────────────────────
    ids_mas_vistos = (
        ProductView.objects.values('product_id')
        .annotate(total=Count('id'))
        .order_by('-total')
        .values_list('product_id', flat=True)[:30]
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

    # ── Nuevos ────────────────────────────────────────────────────────
    nuevos = list(
        Producto.objects.filter(activo=True, stock__gt=0)
        .exclude(id__in=ids_usados)
        .select_related('categoria')
        .order_by('-fecha_creacion')[:15]
    )
    ids_usados.update(p.id for p in nuevos)

    # ── Carruseles por categoría ──────────────────────────────────────
    productos_cocina = Producto.objects.filter(
        categoria__nombre__icontains='cocina', activo=True, stock__gt=0
    ).exclude(id__in=ids_usados).select_related('categoria').order_by('-fecha_creacion')[:15]

    ids_usados.update(p.id for p in productos_cocina)

    productos_limpieza = Producto.objects.filter(
        categoria__nombre__icontains='limpieza', activo=True, stock__gt=0
    ).exclude(id__in=ids_usados).select_related('categoria').order_by('-fecha_creacion')[:15]

    banners = BannerPromocion.objects.filter(activo=True)

    context = {
        'ofertas_especiales': ofertas_especiales,
        'secciones_vigentes': secciones_vigentes,
        'recomendados': recomendados[:15],
        'mas_vendidos': mas_vendidos,
        'mas_vistos': mas_vistos,
        'nuevos': nuevos,
        'productos_cocina': productos_cocina,
        'productos_limpieza': productos_limpieza,
        'categorias': Categoria.objects.filter(activo=True),
        'banners': banners,
    }

    response = render(request, 'product/home.html', context)

    if is_anonymous:
        cache.set(HOMEPAGE_ANON_CACHE_KEY, response.content, HOMEPAGE_ANON_CACHE_TIMEOUT)

    return response


def product_detail(request, product_id):
    producto = get_object_or_404(
        Producto.objects.prefetch_related('galeria').select_related('categoria'), 
        id=product_id
    )
    
    track_product_view(request, producto)
    
    user = request.user if request.user.is_authenticated else None
    engine = RecommendationEngine(user=user)
    
    productos_similares = engine.get_similar_products(producto, limit=4)
    productos_frecuentes = engine.get_frequently_bought_together(producto, limit=4)
    
    if not productos_frecuentes:
        productos_frecuentes = productos_similares[:4]

    # ★ RESEÑAS
    resenas = Resena.objects.filter(producto=producto, estado='aprobada').select_related('usuario')
    total_resenas = resenas.count()
    promedio = round(sum(r.calificacion for r in resenas) / total_resenas, 1) if total_resenas else 0

    # ★ ¿Puede reseñar?
    puede_resenar = False
    ya_reseno = False
    if request.user.is_authenticated:
        from application.order.models import OrderItem
        compro = OrderItem.objects.filter(
            order__user=request.user,
            order__status='delivered',
            product=producto
        ).exists()
        ya_reseno = Resena.objects.filter(producto=producto, usuario=request.user).exists()
        puede_resenar = compro and not ya_reseno
    
    context = {
        'producto': producto,
        'productos_relacionados': productos_similares,
        'productos_frecuentes': productos_frecuentes,
        'resenas': resenas,
        'total_resenas': total_resenas,
        'promedio': promedio,
        'puede_resenar': puede_resenar,
        'ya_reseno': ya_reseno,
    }
    
    return render(request, 'product/product_detail.html', context)


# ============================================================
# VIEWS DEL CARRITO
# ============================================================

def cart_view(request):
    """Vista del carrito de compras CON RECOMENDACIONES"""
    # Guardar session_key para recuperarla después del login con Google
    if not request.user.is_authenticated and request.session.session_key:
        request.session['_cart_session_key'] = request.session.session_key
        request.session.save()
    
    cart_service = CartService(request)
    cart_summary = cart_service.get_cart_summary()
    
    # Recomendaciones basadas en el carrito
    recommendations = []
    if cart_summary['items']:
        recommendations = get_recommendations_for_cart(cart_summary['items'], limit=4)
    
    # Si no hay recomendaciones basadas en carrito, usar productos populares
    if not recommendations:
        engine = RecommendationEngine(user=request.user if request.user.is_authenticated else None)
        recommendations = engine.get_popular_products(limit=4)
    
    context = {
        **cart_summary,
        'recommendations': recommendations,
    }
    
    return render(request, 'product/cart.html', context)


@require_POST
def add_to_cart(request, product_id):
    """Agregar producto al carrito (AJAX)"""
    try:
        quantity = int(request.POST.get('quantity', 1))
        
        if quantity <= 0:
            return JsonResponse({
                'success': False,
                'message': 'Cantidad inválida'
            }, status=400)
        
        cart_service = CartService(request)
        cart_item = cart_service.add_product(product_id, quantity)
        cart_summary = cart_service.get_cart_summary()
        
        return JsonResponse({
            'success': True,
            'message': f'{cart_item.product.nombre} agregado al carrito',
            'cart_total_items': cart_summary['total_items'],
            'cart_total': str(cart_summary['total']),
        })
        
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al agregar al carrito'
        }, status=500)


@require_POST
def update_cart_item(request, cart_item_id):
    """Actualizar cantidad de un item del carrito (AJAX)"""
    try:
        quantity = int(request.POST.get('quantity', 1))
        
        cart_service = CartService(request)
        cart_item = cart_service.update_quantity(cart_item_id, quantity)
        cart_summary = cart_service.get_cart_summary()
        
        if cart_item:
            return JsonResponse({
                'success': True,
                'message': 'Carrito actualizado',
                'item_subtotal': str(cart_item.subtotal),
                'cart_subtotal': str(cart_summary['subtotal']),
                'cart_tax': str(cart_summary['tax']),
                'cart_total': str(cart_summary['total']),
                'cart_total_items': cart_summary['total_items'],
            })
        else:
            return JsonResponse({
                'success': True,
                'message': 'Producto eliminado',
                'cart_subtotal': str(cart_summary['subtotal']),
                'cart_tax': str(cart_summary['tax']),
                'cart_total': str(cart_summary['total']),
                'cart_total_items': cart_summary['total_items'],
            })
        
    except ValueError as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al actualizar el carrito'
        }, status=500)


@require_POST
def remove_from_cart(request, cart_item_id):
    """Eliminar item del carrito (AJAX)"""
    try:
        cart_service = CartService(request)
        cart_service.remove_item(cart_item_id)
        cart_summary = cart_service.get_cart_summary()
        
        return JsonResponse({
            'success': True,
            'message': 'Producto eliminado del carrito',
            'cart_subtotal': str(cart_summary['subtotal']),
            'cart_tax': str(cart_summary['tax']),
            'cart_total': str(cart_summary['total']),
            'cart_total_items': cart_summary['total_items'],
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al eliminar del carrito'
        }, status=500)


@require_POST
def clear_cart(request):
    """Vaciar el carrito (AJAX)"""
    try:
        cart_service = CartService(request)
        cart_service.clear_cart()
        
        return JsonResponse({
            'success': True,
            'message': 'Carrito vaciado'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al vaciar el carrito'
        }, status=500)


# ============================================================
# BÚSQUEDA
# ============================================================

def search_view(request):
    """Vista de búsqueda de productos CON TRACKING"""
    from .recommendations import track_search_query
    
    query = request.GET.get('q', '').strip()
    productos = []
    sugerencias = []
    
    if query:
        productos = Producto.objects.filter(
            Q(nombre__icontains=query) |
            Q(descripcion__icontains=query) |
            Q(categoria__nombre__icontains=query) |
            Q(marca__icontains=query)
        ).filter(stock__gt=0, activo=True).select_related('categoria')
        
        # Registrar búsqueda para analytics
        track_search_query(request, query, productos.count())
        
        # Sugerencias si no hay resultados
        if not productos.exists() and len(query) >= 3:
            sugerencias = Producto.objects.filter(
                nombre__istartswith=query[:3],
                activo=True,
                stock__gt=0
            ).select_related('categoria')[:6]
    
    context = {
        'productos': productos,
        'query': query,
        'total_results': productos.count() if productos else 0,
        'sugerencias': sugerencias,
    }
    
    return render(request, 'product/search_results.html', context)


# ============================================================
# LISTADO DE PRODUCTOS
# ============================================================

def products_list(request):
    """Vista de listado de productos con filtros y paginación"""
    
    # Obtener todos los productos activos
    productos = Producto.objects.filter(activo=True).select_related('categoria')
    
    # FILTROS
    # Acepta nombre de categoría (desde el chatbot) o ID numérico (desde los templates)
    categoria_id = request.GET.get('categoria')
    if categoria_id:
        if categoria_id.isdigit():
            try:
                cat = Categoria.objects.get(pk=categoria_id)
                # Si tiene subcategorías, incluir la categoría padre y todas sus hijas
                subcategoria_ids = list(cat.subcategorias.values_list('id', flat=True))
                todos_ids = [cat.id] + subcategoria_ids
                productos = productos.filter(categoria_id__in=todos_ids)
            except Categoria.DoesNotExist:
                productos = productos.none()
        else:
            # Viene desde el chatbot con nombre → filtrar por nombre
            productos = productos.filter(categoria__nombre__iexact=categoria_id)
    
    search_query = request.GET.get('q')
    if search_query:
        productos = productos.filter(
            Q(nombre__icontains=search_query) |
            Q(descripcion__icontains=search_query) |
            Q(marca__icontains=search_query)
        )
    
    precio_min = request.GET.get('precio_min')
    precio_max = request.GET.get('precio_max')
    if precio_min:
        productos = productos.filter(precio__gte=precio_min)
    if precio_max:
        productos = productos.filter(precio__lte=precio_max)
    
    disponible = request.GET.get('disponible')
    if disponible == '1':
        productos = productos.filter(stock__gt=0)
    
    # Ordenamiento
    orden = request.GET.get('orden', '-fecha_creacion')
    orden_opciones = {
        'nombre_asc': 'nombre',
        'nombre_desc': '-nombre',
        'precio_asc': 'precio',
        'precio_desc': '-precio',
        'nuevo': '-fecha_creacion',
        'antiguo': 'fecha_creacion',
    }
    productos = productos.order_by(orden_opciones.get(orden, '-fecha_creacion'))
    
    # PAGINACIÓN
    paginator = Paginator(productos, 8)
    page = request.GET.get('page', 1)
    
    try:
        productos_paginados = paginator.page(page)
    except PageNotAnInteger:
        productos_paginados = paginator.page(1)
    except EmptyPage:
        productos_paginados = paginator.page(paginator.num_pages)
    
    # Rango de precios
    precio_range = Producto.objects.filter(activo=True).aggregate(
        min_precio=Min('precio'),
        max_precio=Max('precio')
    )
    
    categorias = Categoria.objects.filter(activo=True, parent__isnull=True).prefetch_related('subcategorias')
    
    context = {
        'productos': productos_paginados,
        'categorias': categorias,
        'total_productos': paginator.count,
        'precio_range': precio_range,
        'filtros_activos': {
            'categoria': categoria_id,
            'search': search_query,
            'precio_min': precio_min,
            'precio_max': precio_max,
            'disponible': disponible,
            'orden': orden,
        }
    }
    
    return render(request, 'product/products_list.html', context)


def contact(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        phone = request.POST.get('phone', '')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        
        messages.success(request, '¡Gracias por contactarnos! Te responderemos pronto.')
        return redirect('product:contact')
    
    return render(request, 'product/contact.html')

@login_required
def crear_resena(request, product_id):
    producto = get_object_or_404(Producto, id=product_id)
    from application.order.models import OrderItem
    from application.product.models import Resena

    compro = OrderItem.objects.filter(
        order__user=request.user,
        order__status='delivered',
        product=producto
    ).exists()

    if not compro:
        messages.error(request, 'Solo puedes reseñar productos que hayas recibido.')
        return redirect('product:product_detail', product_id=product_id)

    ya_reseno = Resena.objects.filter(producto=producto, usuario=request.user).exists()
    if ya_reseno:
        messages.info(request, 'Ya dejaste una reseña para este producto.')
        return redirect('product:product_detail', product_id=product_id)

    if request.method == 'POST':
        calificacion = int(request.POST.get('calificacion', 0))
        titulo = request.POST.get('titulo', '').strip()
        comentario = request.POST.get('comentario', '').strip()
        foto = request.FILES.get('foto')

        if not (1 <= calificacion <= 5):
            messages.error(request, 'La calificación debe ser entre 1 y 5.')
            return redirect('product:product_detail', product_id=product_id)

        if not comentario:
            messages.error(request, 'El comentario no puede estar vacío.')
            return redirect('product:product_detail', product_id=product_id)

        Resena.objects.create(
            producto=producto,
            usuario=request.user,
            calificacion=calificacion,
            titulo=titulo,
            comentario=comentario,
            foto=foto,
            estado='pendiente'
        )
        messages.success(request, '¡Gracias! Tu reseña está pendiente de aprobación.')
        return redirect('product:product_detail', product_id=product_id)

    return redirect('product:product_detail', product_id=product_id)