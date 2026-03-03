# application/user/decorators.py
from functools import wraps
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.shortcuts import redirect


def supervisor_required(view_func):
    """
    Decorador que permite acceso solo a supervisores y admins.
    Redirige a login si no está autenticado, y a forbidden si no es supervisor.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Si no está autenticado, redirige a login del dashboard
        if not request.user.is_authenticated:
            return redirect('dashboard:login')
        
        # Si está autenticado pero no es supervisor ni admin
        if not (request.user.is_staff or request.user.tipo_usuario == 'supervisor'):
            return HttpResponseForbidden('No tienes permiso para acceder a esta página.')
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def staff_or_supervisor_required(view_func):
    """
    Decorador que permite acceso a:
    - Usuarios staff (admin)
    - Usuarios con tipo_usuario == 'supervisor'
    """
    @wraps(view_func)
    @login_required
    def wrapper(request, *args, **kwargs):
        if request.user.is_staff or request.user.tipo_usuario == 'supervisor':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden('No tienes permiso para acceder a esta página.')
    
    return wrapper