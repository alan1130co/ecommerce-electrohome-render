from functools import wraps
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.shortcuts import redirect

def supervisor_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('user:login')
        if not (request.user.is_staff or request.user.tipo_usuario == 'supervisor'):
            return HttpResponseForbidden('No tienes permiso.')
        return view_func(request, *args, **kwargs)
    return wrapper

def staff_or_supervisor_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('user:login')
        if request.user.is_staff or request.user.tipo_usuario == 'supervisor':
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden('No tienes permiso.')
    return wrapper