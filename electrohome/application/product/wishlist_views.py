# application/product/wishlist_views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_POST
from .models import Producto, Wishlist, WishlistItem


@login_required
def wishlist_view(request):
    """Vista de la lista de deseos"""
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    items = wishlist.items.select_related('product').all()
    
    context = {
        'wishlist': wishlist,
        'items': items,
    }
    return render(request, 'product/wishlist.html', context)


@login_required
@require_POST
def add_to_wishlist(request, product_id):
    """Agregar producto a la lista de deseos (AJAX)"""
    try:
        product = get_object_or_404(Producto, id=product_id)
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        # Verificar si ya existe
        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            product=product
        )
        
        if created:
            return JsonResponse({
                'success': True,
                'message': f'"{product.nombre}" agregado a tu lista de deseos',
                'total_items': wishlist.total_items  # ✅ AGREGADO
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Este producto ya está en tu lista de deseos',
                'total_items': wishlist.total_items  # ✅ AGREGADO
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al agregar el producto'
        }, status=400)


@login_required
@require_POST
def remove_from_wishlist(request, product_id):
    """Eliminar producto de la lista de deseos (AJAX)"""
    try:
        product = get_object_or_404(Producto, id=product_id)
        wishlist = get_object_or_404(Wishlist, user=request.user)
        
        item = WishlistItem.objects.filter(
            wishlist=wishlist,
            product=product
        ).first()
        
        if item:
            item.delete()
            return JsonResponse({
                'success': True,
                'message': f'"{product.nombre}" eliminado de tu lista de deseos',
                'total_items': wishlist.total_items  # ✅ AGREGADO
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'El producto no está en tu lista de deseos',
                'total_items': wishlist.total_items  # ✅ AGREGADO
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': 'Error al eliminar el producto'
        }, status=400)


@login_required
def check_wishlist_status(request, product_id):
    """Verificar si un producto está en la wishlist (AJAX)"""
    try:
        wishlist = Wishlist.objects.filter(user=request.user).first()
        if wishlist:
            is_in_wishlist = WishlistItem.objects.filter(
                wishlist=wishlist,
                product_id=product_id
            ).exists()
            return JsonResponse({
                'in_wishlist': is_in_wishlist,
                'total_items': wishlist.total_items  # ✅ AGREGADO
            })
        return JsonResponse({
            'in_wishlist': False,
            'total_items': 0  # ✅ AGREGADO
        })
    except:
        return JsonResponse({
            'in_wishlist': False,
            'total_items': 0  # ✅ AGREGADO
        })