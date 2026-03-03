from django.db.models import Count, Q, Avg, F, Sum
from django.conf import settings
from django.core.cache import cache
from django.db import models
from datetime import timedelta
from django.utils import timezone

class RecommendationEngine:
    """
    Motor de Recomendaciones Mejorado
    Excluye: productos comprados, en carrito, en wishlist y vistos recientemente
    """
    
    def __init__(self, user=None, session_key=None):
        self.user = user
        self.session_key = session_key
        # Usar RECOMMENDATION_CONFIG si está definido, sino fallback a 3600
        config = getattr(settings, 'RECOMMENDATION_CONFIG', {})
        self.cache_timeout = config.get('CACHE_TIMEOUT', 3600)
    
    def _get_excluded_products(self):
        """
        Obtiene todos los productos que el usuario ya conoce
        y que NO deberían aparecer en recomendaciones
        """
        from .models import ProductView, Purchase, CartItem, WishlistItem
        
        excluded_ids = set()
        
        if not self.user or not self.user.is_authenticated:
            return excluded_ids
        
        # 1. Productos comprados
        purchased = Purchase.objects.filter(
            user=self.user
        ).values_list('product_id', flat=True)
        excluded_ids.update(purchased)
        
        # 2. Productos en el carrito
        cart_items = CartItem.objects.filter(
            cart__user=self.user
        ).values_list('product_id', flat=True)
        excluded_ids.update(cart_items)
        
        # 3. Productos en la wishlist
        wishlist_items = WishlistItem.objects.filter(
            wishlist__user=self.user
        ).values_list('product_id', flat=True)
        excluded_ids.update(wishlist_items)
        
        # 4. Productos vistos recientemente (últimas 24 horas)
        recent_threshold = timezone.now() - timedelta(hours=24)
        recent_views = ProductView.objects.filter(
            user=self.user,
            viewed_at__gte=recent_threshold
        ).values_list('product_id', flat=True)[:20]
        excluded_ids.update(recent_views)
        
        return excluded_ids
    
    def get_personalized_recommendations(self, limit=10):
        """
        Recomendaciones personalizadas que EXCLUYEN productos conocidos
        """
        if not self.user or not self.user.is_authenticated:
            return self.get_popular_products(limit)
        
        cache_key = f'personalized_recs_{self.user.id}_{limit}_v2'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        from .models import ProductView, Producto
        
        # Obtener productos a excluir
        excluded_ids = self._get_excluded_products()
        
        recommendations = []
        seen_ids = set(excluded_ids) 
        
        # 1. Basado en categorías de productos vistos (50%)
        recent_views = ProductView.objects.filter(
            user=self.user
        ).select_related('product__categoria').order_by('-viewed_at')[:20]
        
        recent_categories = list(set(
            view.product.categoria_id for view in recent_views 
            if view.product and view.product.categoria_id
        ))
        
        if recent_categories:
            category_products = Producto.objects.filter(
                categoria_id__in=recent_categories,
                activo=True,
                stock__gt=0
            ).exclude(
                id__in=seen_ids 
            ).select_related('categoria').order_by('-fecha_creacion')[:int(limit * 0.6)]
            
            for product in category_products:
                if product.id not in seen_ids:
                    recommendations.append(product)
                    seen_ids.add(product.id)
        
        # 2. Productos de categorías populares (30%)
        popular_categories = Producto.objects.filter(
            activo=True,
            stock__gt=0
        ).exclude(
            id__in=seen_ids
        ).values('categoria_id').annotate(
            count=Count('id')
        ).order_by('-count')[:3].values_list('categoria_id', flat=True)
        
        if popular_categories:
            popular_in_categories = Producto.objects.filter(
                categoria_id__in=popular_categories,
                activo=True,
                stock__gt=0
            ).exclude(
                id__in=seen_ids
            ).select_related('categoria').order_by('?')[:int(limit * 0.3)]
            
            for product in popular_in_categories:
                if product.id not in seen_ids and len(recommendations) < limit:
                    recommendations.append(product)
                    seen_ids.add(product.id)
        
        # 3. Llenar con productos aleatorios frescos (20%)
        if len(recommendations) < limit:
            remaining = limit - len(recommendations)
            random_products = Producto.objects.filter(
                activo=True,
                stock__gt=0
            ).exclude(
                id__in=seen_ids
            ).select_related('categoria').order_by('?')[:remaining + 5]
            
            for product in random_products:
                if product.id not in seen_ids and len(recommendations) < limit:
                    recommendations.append(product)
                    seen_ids.add(product.id)
        
        recommendations = recommendations[:limit]
        cache.set(cache_key, recommendations, self.cache_timeout // 2)
        
        return recommendations
    
    def get_similar_products(self, product, limit=6):
        """
        Productos similares excluyendo los conocidos
        """
        from .models import Producto
        
        if not self.user or not self.user.is_authenticated:
            cache_key = f'similar_products_anon_{product.id}_{limit}_v2'
        else:
            cache_key = f'similar_products_{self.user.id}_{product.id}_{limit}_v2'
            
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Obtener productos a excluir
        excluded_ids = self._get_excluded_products() if self.user and self.user.is_authenticated else set()
        excluded_ids.add(product.id) 
        
        similar = Producto.objects.filter(
            categoria=product.categoria,
            activo=True,
            stock__gt=0
        ).exclude(
            id__in=excluded_ids 
        ).select_related('categoria').order_by('-fecha_creacion')[:limit]
        
        similar = list(similar)
        cache.set(cache_key, similar, self.cache_timeout)
        
        return similar
    
    # ✅ MÉTODO FALTANTE AGREGADO AQUÍ
    def get_frequently_bought_together(self, product, limit=4):
        """
        Productos frecuentemente comprados juntos con el producto dado.
        Basado en órdenes completadas que contienen este producto.
        """
        from .models import Producto, Purchase
        
        # Cache key
        cache_key = f'frequently_bought_{product.id}_{limit}_v2'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Obtener productos a excluir
        excluded_ids = self._get_excluded_products() if self.user and self.user.is_authenticated else set()
        excluded_ids.add(product.id)
        
        try:
            # Buscar usuarios que compraron este producto
            users_who_bought = Purchase.objects.filter(
                product=product
            ).values_list('user_id', flat=True).distinct()
            
            if not users_who_bought:
                # Si no hay compras, retornar productos similares
                return self.get_similar_products(product, limit)
            
            # Buscar otros productos que esos usuarios compraron
            frequently_bought = Purchase.objects.filter(
                user_id__in=users_who_bought
            ).exclude(
                product_id__in=excluded_ids
            ).values('product_id').annotate(
                purchase_count=Count('id')
            ).order_by('-purchase_count')[:limit * 2]
            
            product_ids = [item['product_id'] for item in frequently_bought]
            
            # Obtener los productos
            products = Producto.objects.filter(
                id__in=product_ids,
                activo=True,
                stock__gt=0
            ).select_related('categoria')[:limit]
            
            products = list(products)
            
            # Si no hay suficientes, completar con productos similares
            if len(products) < limit:
                similar = self.get_similar_products(product, limit - len(products))
                products.extend([p for p in similar if p.id not in [prod.id for prod in products]])
            
            cache.set(cache_key, products, self.cache_timeout)
            return products
            
        except Exception as e:
            # En caso de error, retornar productos similares
            print(f"Error en get_frequently_bought_together: {e}")
            return self.get_similar_products(product, limit)
    
    def get_popular_products(self, limit=10):
        """
        Productos populares excluyendo los conocidos
        """
        from .models import ProductView, Producto
        
        if self.user and self.user.is_authenticated:
            excluded_ids = self._get_excluded_products()
            cache_key = None
        else:
            cache_key = f'popular_products_{limit}'
            cached = cache.get(cache_key)
            if cached:
                return cached
            excluded_ids = set()
        
        since = timezone.now() - timedelta(days=30)
        
        popular_ids = ProductView.objects.filter(
            viewed_at__gte=since
        ).values('product_id').annotate(
            view_count=Count('id')
        ).order_by('-view_count')[:limit * 3].values_list('product_id', flat=True)
        
        products = Producto.objects.filter(
            id__in=popular_ids,
            activo=True,
            stock__gt=0
        ).exclude(
            id__in=excluded_ids
        ).select_related('categoria')[:limit]
        
        products = list(products)
        
        if cache_key: 
            cache.set(cache_key, products, self.cache_timeout)
        
        return products
    
    def get_trending_products(self, days=7, limit=10):
        """
        Productos trending excluyendo los conocidos
        """
        from .models import ProductView, Producto
        
        excluded_ids = self._get_excluded_products() if self.user and self.user.is_authenticated else set()
        
        since = timezone.now() - timedelta(days=days)
        
        trending_ids = ProductView.objects.filter(
            viewed_at__gte=since
        ).values('product_id').annotate(
            view_count=Count('id')
        ).filter(
            view_count__gte=2 
        ).order_by('-view_count')[:limit * 3].values_list('product_id', flat=True)
        
        products = Producto.objects.filter(
            id__in=trending_ids,
            activo=True,
            stock__gt=0
        ).exclude(
            id__in=excluded_ids 
        ).select_related('categoria')[:limit]
        
        return list(products)
    
    def get_new_arrivals(self, limit=10):
        """
        Productos nuevos excluyendo los conocidos
        """
        from .models import Producto
        
        excluded_ids = self._get_excluded_products() if self.user and self.user.is_authenticated else set()
        
        products = Producto.objects.filter(
            activo=True,
            stock__gt=0
        ).exclude(
            id__in=excluded_ids
        ).select_related('categoria').order_by('-fecha_creacion')[:limit]
        
        return list(products)
    
    def get_homepage_recommendations(self):
        """
        Mix de recomendaciones para homepage
        """
        recommendations = {
            'personalized': self.get_personalized_recommendations(limit=12),
            'trending': self.get_trending_products(limit=8),
            'popular': self.get_popular_products(limit=8),
            'new_arrivals': self.get_new_arrivals(limit=8),
        }
        
        return recommendations
    
    def clear_user_cache(self):
        """
        Limpiar caché de recomendaciones del usuario
        """
        if self.user and self.user.is_authenticated:
            for limit in [6, 8, 10, 12, 15, 20]:
                cache.delete(f'personalized_recs_{self.user.id}_{limit}_v2')
            
# ----------------------------------------------------------------------
# ========== HELPER FUNCTIONS ==========
# ----------------------------------------------------------------------

def track_search_query(request, query, total_results=0): 
    """
    Registra la consulta de búsqueda de un usuario y limpia el caché.
    """
    if not query:
        return
        
    # Invalidar caché de recomendaciones si el usuario está logueado
    if request.user.is_authenticated:
        engine = RecommendationEngine(user=request.user)
        engine.clear_user_cache()


def track_cart_addition(request, product, quantity=1):
    """
    Limpiar caché cuando se agrega al carrito
    """
    from .models import CartInteraction
    
    CartInteraction.objects.create(
        user=request.user if request.user.is_authenticated else None,
        product=product,
        session_key=request.session.session_key if not request.user.is_authenticated else None,
        quantity=quantity
    )
    
    if request.user.is_authenticated:
        engine = RecommendationEngine(user=request.user)
        engine.clear_user_cache()


def track_wishlist_addition(request, product):
    """
    Limpiar caché cuando se agrega a wishlist
    """
    if request.user.is_authenticated:
        engine = RecommendationEngine(user=request.user)
        engine.clear_user_cache()


def get_recommendations_for_cart(cart_items, limit=6):
    """
    Recomendaciones para el carrito excluyendo productos conocidos
    """
    from .models import Purchase, Producto, CartItem, WishlistItem
    
    if not cart_items:
        return []
    
    cart_product_ids = [item.product_id for item in cart_items]
    user = cart_items[0].cart.user if hasattr(cart_items[0].cart, 'user') else None
    
    excluded_ids = set(cart_product_ids)
    
    if user and user.is_authenticated:
        wishlist_ids = WishlistItem.objects.filter(
            wishlist__user=user
        ).values_list('product_id', flat=True)
        excluded_ids.update(wishlist_ids)
        
        purchased_ids = Purchase.objects.filter(
            user=user
        ).values_list('product_id', flat=True)
        excluded_ids.update(purchased_ids)
    
    related_purchases = Purchase.objects.filter(
        product_id__in=cart_product_ids
    ).values_list('user_id', flat=True).distinct()
    
    recommendations_ids = Purchase.objects.filter(
        user_id__in=related_purchases
    ).exclude(
        product_id__in=excluded_ids 
    ).values('product_id').annotate(
        count=Count('id')
    ).order_by('-count')[:limit * 2].values_list('product_id', flat=True)
    
    return Producto.objects.filter(
        id__in=recommendations_ids,
        activo=True,
        stock__gt=0
    ).select_related('categoria')[:limit]
    

def track_product_view(request, product):
    """
    Registra una vista del producto y limpia el caché de recomendaciones.
    """
    from .models import ProductView

    ProductView.objects.create(
        user=request.user if request.user.is_authenticated else None,
        product=product,
        session_key=request.session.session_key if not request.user.is_authenticated and request.session.session_key else None
    )

    if request.user.is_authenticated:
        engine = RecommendationEngine(user=request.user)
        engine.clear_user_cache()