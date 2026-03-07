from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.cache import never_cache 
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q, Min, Max

from .models import Producto, Categoria, Promocion, BannerPromocion
from .cart_services import CartService
from .recommendations import (
    RecommendationEngine, 
    track_product_view, 
    get_recommendations_for_cart
)
from application.order.models import Order, OrderItem
from application.product.models import Resena


@never_cache 
def index(request):
    """
    Vista principal del home con recomendaciones personalizadas
    """
    # Inicializar motor de recomendaciones
    user = request.user if request.user.is_authenticated else None
    engine = RecommendationEngine(user=user)
    
    # Obtener recomendaciones del homepage
    recomendaciones = engine.get_homepage_recommendations()
    
    # Productos por categoría para carruseles
    productos_cocina = Producto.objects.filter(
        categoria__nombre__icontains='cocina',
        activo=True,
        stock__gt=0
    ).select_related('categoria').order_by('-fecha_creacion')[:15]
    
    productos_limpieza = Producto.objects.filter(
        categoria__nombre__icontains='limpieza',
        activo=True,
        stock__gt=0
    ).select_related('categoria').order_by('-fecha_creacion')[:15]
    
    # Si no hay suficientes recomendaciones personalizadas, completar
    productos_destacados = list(recomendaciones.get('personalized', []))
    if len(productos_destacados) < 6:
        adicionales = Producto.objects.filter(
            activo=True,
            stock__gt=0
        ).exclude(
            id__in=[p.id for p in productos_destacados]
        ).select_related('categoria').order_by('-fecha_creacion')[:6 - len(productos_destacados)]
        productos_destacados.extend(list(adicionales))

    # Banners promocionales
    banners = BannerPromocion.objects.filter(activo=True)
    
    context = {
        # Para sección "Promociones Especiales"
        'productos': productos_destacados[:6],
        
        # Para carruseles
        'productos_cocina': productos_cocina,
        'productos_limpieza': productos_limpieza,
        
        # Categorías
        'categorias': Categoria.objects.filter(activo=True),

        # Banners
        'banners': banners,
    }
    
    return render(request, 'product/home.html', context)


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
    categoria_id = request.GET.get('categoria')
    if categoria_id:
        productos = productos.filter(categoria_id=categoria_id)
    
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
    
    categorias = Categoria.objects.filter(activo=True)
    
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