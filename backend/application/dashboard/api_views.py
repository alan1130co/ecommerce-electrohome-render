import base64
from calendar import monthrange
from datetime import timedelta
from io import BytesIO

from django.contrib.auth import authenticate, login, logout
from django.core.files.storage import default_storage
from django.core.mail import EmailMultiAlternatives
from django.core.paginator import Paginator
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from application.order.models import Order
from application.product.models import (
    BannerPromocion, Categoria, ImagenProducto, ProductView, Producto,
    Promocion, Purchase, Resena,
)
from application.user.models import Administrador, Cliente, Usuario

from .forms import BannerForm, CategoriaForm, PromocionForm, ProductoForm
from .serializers import (
    BannerAdminSerializer, CategoriaAdminSerializer, OrderAdminSerializer,
    ProductoAdminListSerializer, ProductoAdminSerializer, PromocionAdminSerializer,
    ResenaAdminSerializer, UsuarioAdminSerializer,
)
# Reutiliza el formset de imágenes tal cual está definido en views.py — no se
# redefine, para no duplicar la lógica de inlineformset_factory.
from .views import ImagenProductoFormSet


# ========== PERMISOS ==========

class IsSupervisor(BasePermission):
    """Espeja exactamente application.user.decorators.supervisor_required:
    is_staff o tipo_usuario == 'supervisor'. Con SessionAuthentication como
    único backend, DRF responde 403 tanto si no hay sesión como si el rol no
    califica (no hay header WWW-Authenticate que dispare 401) — Next.js debe
    tratar 401/403 igual: redirigir a /admin/login."""
    message = 'No tienes permiso.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.tipo_usuario == 'supervisor'))


def _paginate(request, queryset, serializer_class, page_size):
    """Mismo mecanismo que las views originales (django.core.paginator.Paginator
    con ?page=), envuelto en un sobre JSON consistente para todos los listados
    del dashboard."""
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(request.query_params.get('page'))
    return {
        'results': serializer_class(page_obj.object_list, many=True).data,
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }


# ========== AUTENTICACIÓN (separada del login de clientes) ==========

def _admin_user_data(user):
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'tipo_usuario': user.tipo_usuario,
        'is_staff': user.is_staff,
    }


class AdminLoginAPIView(APIView):
    """POST /api/dashboard/auth/login/ — equivalente sin template de
    supervisor_login. Valida is_staff o tipo_usuario=='supervisor' ANTES de
    abrir sesión (un cliente nunca llega a loguearse por acá), igual que la
    view original."""

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Por favor completa email y contraseña.'}, status=400)

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'detail': 'Email o contraseña incorrectos.'}, status=401)

        if not (user.is_staff or user.tipo_usuario == 'supervisor'):
            return Response(
                {'detail': 'Solo supervisores y administradores pueden acceder al dashboard.'}, status=403
            )

        login(request, user)
        return Response(_admin_user_data(user))


class AdminLogoutAPIView(APIView):
    """POST /api/dashboard/auth/logout/ — igual que supervisor_logout, sin
    decorador (cualquiera puede llamarlo, solo cierra la sesión si existe)."""

    def post(self, request):
        logout(request)
        return Response({'detail': 'Sesión cerrada'})


class AdminMeAPIView(APIView):
    """GET /api/dashboard/auth/me/ — guard de rutas para el layout de
    /admin en Next.js. A diferencia de IsSupervisor no corta con 403: siempre
    200, con is_admin=False cuando no califica, para que el layout decida
    el redirect (a /admin/login, nunca a /login de clientes)."""

    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'is_admin': False, 'detail': 'No autenticado'}, status=401)
        return Response({'is_admin': bool(user.is_staff or user.tipo_usuario == 'supervisor'), **_admin_user_data(user)})


# ========== DASHBOARD PRINCIPAL ==========

class AdminDashboardStatsAPIView(APIView):
    """GET /api/dashboard/stats/ — equivalente exacto de admin_dashboard,
    mismos cálculos, respuesta JSON en vez de template."""
    permission_classes = [IsSupervisor]

    def get(self, request):
        total_productos = Producto.objects.count()
        total_pedidos = Order.objects.count()
        total_clientes = Cliente.objects.count()
        total_categorias = Categoria.objects.count()

        total_ventas = Purchase.objects.count()
        ingresos_totales = Purchase.objects.aggregate(total=Sum('price'))['total'] or 0
        total_vistas = ProductView.objects.count()

        conversion = 0
        if total_vistas > 0:
            conversion = round((total_ventas / total_vistas) * 100, 2)

        top_productos = list(
            Purchase.objects.values('product__nombre').annotate(total=Count('id')).order_by('-total')[:5]
        )
        top_vistos = list(
            ProductView.objects.values('product__nombre').annotate(total=Count('id')).order_by('-total')[:5]
        )

        hoy = timezone.now().date()

        primer_dia_mes = hoy.replace(day=1)
        ultimo_dia_mes = hoy.replace(day=monthrange(hoy.year, hoy.month)[1])
        ventas_por_dia = []
        dia_iter = primer_dia_mes
        while dia_iter <= ultimo_dia_mes:
            total = Purchase.objects.filter(purchased_at__date=dia_iter).aggregate(t=Sum('price'))['t'] or 0
            ventas_por_dia.append({'dia': dia_iter.strftime('%d %b'), 'total': float(total)})
            dia_iter += timedelta(days=1)

        ventas_hoy = []
        for h in range(24):
            total = Purchase.objects.filter(
                purchased_at__date=hoy, purchased_at__hour=h
            ).aggregate(t=Sum('price'))['t'] or 0
            count = Purchase.objects.filter(purchased_at__date=hoy, purchased_at__hour=h).count()
            if count > 0:
                ventas_hoy.append({'hora': f'{h:02d}:00', 'total': float(total), 'count': count})

        inicio_semana_actual = hoy - timedelta(days=hoy.weekday())
        dias_semana_actual = []
        for d in range(7):
            dia = inicio_semana_actual + timedelta(days=d)
            total_dia = Purchase.objects.filter(purchased_at__date=dia).aggregate(t=Sum('price'))['t'] or 0
            count_dia = Purchase.objects.filter(purchased_at__date=dia).count()
            dias_semana_actual.append({'dia': dia.strftime('%d %b'), 'total': float(total_dia), 'count': count_dia})

        return Response({
            'total_productos': total_productos,
            'total_pedidos': total_pedidos,
            'total_clientes': total_clientes,
            'total_categorias': total_categorias,
            'total_ventas': total_ventas,
            'ingresos_totales': ingresos_totales,
            'conversion': conversion,
            'total_vistas': total_vistas,
            'top_productos': top_productos,
            'top_vistos': top_vistos,
            'ventas_por_dia': ventas_por_dia,
            'ventas_hoy': ventas_hoy,
            'dias_semana_actual': dias_semana_actual,
        })


class NotificacionesPedidosAPIView(APIView):
    """GET /api/dashboard/notificaciones/ — la view original ya devolvía
    JsonResponse, se traslada sin cambios."""
    permission_classes = [IsSupervisor]

    def get(self, request):
        desde = timezone.now() - timedelta(hours=24)
        pedidos_nuevos = Order.objects.filter(created_at__gte=desde).order_by('-created_at')[:10]
        data = [{
            'id': p.id,
            'usuario': p.user.email if p.user else 'Invitado',
            'total': str(p.total),
            'fecha': p.created_at.strftime('%d/%m %H:%M'),
        } for p in pedidos_nuevos]
        return Response({'pedidos': data, 'count': len(data)})


# ========== PEDIDOS ==========

class PedidosListAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        estado_filtro = request.query_params.get('status', '')
        pedidos = Order.objects.select_related('user').order_by('-created_at')
        if estado_filtro:
            pedidos = pedidos.filter(status=estado_filtro)
        data = _paginate(request, pedidos, OrderAdminSerializer, page_size=20)
        return Response({**data, 'estado_filtro': estado_filtro})


class CambiarEstadoPedidoAPIView(APIView):
    permission_classes = [IsSupervisor]

    def post(self, request, pedido_id):
        pedido = get_object_or_404(Order, id=pedido_id)
        nuevo_estado = request.data.get('status')
        estados_validos = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if nuevo_estado not in estados_validos:
            return Response({'detail': 'Estado no válido.'}, status=400)
        pedido.status = nuevo_estado
        pedido.save()
        return Response(OrderAdminSerializer(pedido).data)


# ========== PRODUCTOS ==========
#
# ProductoForm.imagen_principal e ImagenProductoForm.imagen son CharField en
# el modelo pero usan widget forms.FileInput() — el widget SIEMPRE lee de
# request.FILES (nunca de request.data), y como el field real es CharField
# (no FileField) no tiene el comportamiento de "si no llega archivo nuevo,
# conserva el valor existente" que sí tiene cualquier FileField real de
# Django. Verificado: guardar el form sin volver a elegir un archivo pone
# el campo en None. Nunca subió el archivo de verdad tampoco — solo
# guardaba el nombre del archivo como string.
#
# En vez de tocar ProductoForm/ImagenProductoForm (o los modelos), estas
# vistas:
#   1) siguen usando el form/formset tal cual para validar TODO lo demás,
#   2) ignoran lo que el widget roto haya puesto en imagen_principal/imagen,
#   3) aplican a mano la URL real (subida antes a Cloudinary vía
#      ImagenUploadAPIView) que llega en imagen_principal_url /
#      form-{i}-imagen_url, o conservan el valor existente si no llegó nada.

def _aplicar_imagen_principal(request, form, imagen_actual=None):
    url = request.data.get('imagen_principal_url', '').strip()
    if url:
        form.instance.imagen_principal = url
    elif imagen_actual is not None:
        form.instance.imagen_principal = imagen_actual


def _guardar_imagenes_formset(request, formset, producto):
    """formset.save() decide crear/actualizar cada fila según has_changed(),
    calculado ANTES de que le apliquemos la url real — una fila nueva que
    solo trae una imagen (sin cambiar descripción) se vería "sin cambios" y
    el formset la saltaría. Por eso se guarda cada fila a mano, reusando
    igual formset.is_valid()/cleaned_data (misma validación de siempre)."""
    for i, imagen_form in enumerate(formset.forms):
        cd = imagen_form.cleaned_data
        if not cd:
            continue
        if cd.get('DELETE'):
            if imagen_form.instance.pk:
                imagen_form.instance.delete()
            continue
        url = request.data.get(f'form-{i}-imagen_url', '').strip()
        if not url and not imagen_form.instance.pk:
            continue  # fila extra vacía del formset, nada que crear
        instancia = imagen_form.save(commit=False)
        if url:
            instancia.imagen = url
        instancia.producto = producto
        instancia.save()


class ProductoAdminListCreateAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        productos = Producto.objects.select_related('categoria').order_by('-fecha_creacion')
        return Response(_paginate(request, productos, ProductoAdminListSerializer, page_size=20))

    def post(self, request):
        form = ProductoForm(request.data, request.FILES)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        _aplicar_imagen_principal(request, form)
        producto = form.save()

        formset = ImagenProductoFormSet(request.data, request.FILES, instance=producto)
        if not formset.is_valid():
            return Response(
                {**ProductoAdminSerializer(producto).data, 'warning': 'Producto creado, pero algunas imágenes no se guardaron.'},
                status=201,
            )
        _guardar_imagenes_formset(request, formset, producto)
        return Response(ProductoAdminSerializer(producto).data, status=201)


class ProductoOpcionesAPIView(APIView):
    """GET /api/dashboard/productos/opciones/ — id+nombre de TODOS los
    productos sin paginar, para el <select> de PromocionForm (mismo
    queryset que usa ese form: Producto.objects.all(), sin filtrar por
    activo). Nuevo endpoint liviano — un dropdown no puede paginar."""
    permission_classes = [IsSupervisor]

    def get(self, request):
        productos = Producto.objects.order_by('nombre').values('id', 'nombre')
        return Response(list(productos))


class ProductoAdminDetailAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request, producto_id):
        producto = get_object_or_404(Producto, id=producto_id)
        return Response(ProductoAdminSerializer(producto).data)

    def put(self, request, producto_id):
        producto = get_object_or_404(Producto, id=producto_id)
        imagen_actual = producto.imagen_principal
        form = ProductoForm(request.data, request.FILES, instance=producto)
        formset = ImagenProductoFormSet(request.data, request.FILES, instance=producto)
        if not (form.is_valid() and formset.is_valid()):
            errors = dict(form.errors)
            if formset.errors:
                errors['imagenes'] = formset.errors
            return Response({'errors': errors}, status=400)
        _aplicar_imagen_principal(request, form, imagen_actual)
        form.save()
        _guardar_imagenes_formset(request, formset, producto)
        return Response(ProductoAdminSerializer(producto).data)

    def delete(self, request, producto_id):
        producto = get_object_or_404(Producto, id=producto_id)
        nombre = producto.nombre
        producto.delete()
        return Response({'detail': f'Producto "{nombre}" eliminado correctamente'})


class ImagenUploadAPIView(APIView):
    """POST /api/dashboard/upload-imagen/ — sube un archivo al storage por
    defecto (Cloudinary cuando CLOUDINARY_CLOUD_NAME está configurado, igual
    que Resena.foto/BannerPromocion.imagen) y devuelve la URL resultante.
    No existía antes: el form viejo de Django nunca subió un archivo real
    (ver nota arriba). Esto es infraestructura nueva, no reemplaza ninguna
    vista existente."""
    permission_classes = [IsSupervisor]

    def post(self, request):
        archivo = request.FILES.get('file')
        if not archivo:
            return Response({'detail': 'No se recibió ningún archivo.'}, status=400)
        nombre_guardado = default_storage.save(f'productos/{archivo.name}', archivo)
        return Response({'url': default_storage.url(nombre_guardado)})


# ========== CATEGORÍAS ==========

class CategoriaAdminListCreateAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        categorias = Categoria.objects.annotate(total_productos=Count('productos')).order_by('-fecha_creacion')
        return Response(_paginate(request, categorias, CategoriaAdminSerializer, page_size=20))

    def post(self, request):
        form = CategoriaForm(request.data)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        categoria = form.save()
        return Response(CategoriaAdminSerializer(categoria).data, status=201)


class CategoriaAdminDetailAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request, categoria_id):
        categoria = get_object_or_404(
            Categoria.objects.annotate(total_productos=Count('productos')), id=categoria_id
        )
        return Response(CategoriaAdminSerializer(categoria).data)

    def put(self, request, categoria_id):
        categoria = get_object_or_404(Categoria, id=categoria_id)
        form = CategoriaForm(request.data, instance=categoria)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        form.save()
        return Response(CategoriaAdminSerializer(categoria).data)

    def delete(self, request, categoria_id):
        categoria = get_object_or_404(Categoria, id=categoria_id)
        nombre = categoria.nombre
        categoria.delete()
        return Response({'detail': f'Categoría "{nombre}" eliminada correctamente'})


# ========== USUARIOS ==========

class UsuariosListAPIView(APIView):
    """GET /api/dashboard/usuarios/ — mismo criterio que usuarios_list:
    clientes paginados (15) + admins completos sin paginar."""
    permission_classes = [IsSupervisor]

    def get(self, request):
        clientes = Cliente.objects.filter(is_staff=False, is_superuser=False).order_by('-fecha_registro')
        admins = Administrador.objects.filter(is_staff=True).order_by('-fecha_registro')
        clientes_data = _paginate(request, clientes, UsuarioAdminSerializer, page_size=15)
        return Response({
            'clientes': clientes_data,
            'admins': UsuarioAdminSerializer(admins, many=True).data,
            'total_admins': admins.count(),
        })


# ========== PROMOCIONES ==========

class PromocionAdminListCreateAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        promociones = Promocion.objects.select_related('producto').order_by('-created_at')
        return Response(PromocionAdminSerializer(promociones, many=True).data)

    def post(self, request):
        form = PromocionForm(request.data)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        promo = form.save()
        return Response(PromocionAdminSerializer(promo).data, status=201)


class PromocionAdminDetailAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request, promo_id):
        promo = get_object_or_404(Promocion.objects.select_related('producto'), id=promo_id)
        return Response(PromocionAdminSerializer(promo).data)

    def put(self, request, promo_id):
        promo = get_object_or_404(Promocion, id=promo_id)
        form = PromocionForm(request.data, instance=promo)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        form.save()
        return Response(PromocionAdminSerializer(promo).data)

    def delete(self, request, promo_id):
        promo = get_object_or_404(Promocion, id=promo_id)
        promo.delete()
        return Response({'detail': 'Promoción eliminada correctamente'})


# ========== ENVÍO MASIVO DE CORREOS (se queda en Django) ==========

class EnvioMasivoAPIView(APIView):
    """GET: lista de destinatarios posibles. POST: dispara el envío — mismo
    loop de EmailMultiAlternatives + render_to_string('dashboard/email_cupon.html')
    de envio_masivo, solo cambia redirect+messages por JSON."""
    permission_classes = [IsSupervisor]

    def get(self, request):
        usuarios = Usuario.objects.filter(is_active=True, tipo_usuario='cliente').order_by('email')
        return Response(UsuarioAdminSerializer(usuarios, many=True).data)

    def post(self, request):
        asunto = request.data.get('asunto', '').strip()
        mensaje = request.data.get('mensaje', '').strip()
        codigo_cupon = request.data.get('codigo_cupon', '').strip()
        descuento = request.data.get('descuento', '').strip()
        destinatarios_ids = (
            request.data.getlist('destinatarios')
            if hasattr(request.data, 'getlist') else request.data.get('destinatarios', [])
        )
        imagen = request.FILES.get('imagen')

        if not asunto or not mensaje:
            return Response({'detail': 'El asunto y el mensaje son obligatorios.'}, status=400)
        if not destinatarios_ids:
            return Response({'detail': 'Debes seleccionar al menos un usuario.'}, status=400)

        imagen_base64 = None
        imagen_mime = None
        if imagen:
            imagen_base64 = base64.b64encode(imagen.read()).decode('utf-8')
            imagen_mime = imagen.content_type

        destinatarios = Usuario.objects.filter(id__in=destinatarios_ids)
        enviados = 0
        errores = 0

        for usuario in destinatarios:
            try:
                html_content = render_to_string('dashboard/email_cupon.html', {
                    'usuario': usuario,
                    'mensaje': mensaje,
                    'codigo_cupon': codigo_cupon,
                    'descuento': descuento,
                    'imagen_base64': imagen_base64,
                    'imagen_mime': imagen_mime,
                })
                email = EmailMultiAlternatives(subject=asunto, body=mensaje, to=[usuario.email])
                email.attach_alternative(html_content, "text/html")
                email.send()
                enviados += 1
            except Exception as e:
                errores += 1
                print(f"Error enviando a {usuario.email}: {e}")

        return Response({'enviados': enviados, 'errores': errores})


# ========== RESEÑAS ==========

class ResenasListAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        estado = request.query_params.get('estado', 'pendiente')
        resenas = Resena.objects.select_related('producto', 'usuario').order_by('-creado_en')
        if estado in ('pendiente', 'aprobada', 'rechazada'):
            resenas = resenas.filter(estado=estado)
        data = _paginate(request, resenas, ResenaAdminSerializer, page_size=20)
        conteos = {
            'pendiente': Resena.objects.filter(estado='pendiente').count(),
            'aprobada': Resena.objects.filter(estado='aprobada').count(),
            'rechazada': Resena.objects.filter(estado='rechazada').count(),
        }
        return Response({**data, 'estado': estado, 'conteos': conteos})


class AprobarResenaAPIView(APIView):
    permission_classes = [IsSupervisor]

    def post(self, request, resena_id):
        resena = get_object_or_404(Resena, id=resena_id)
        resena.estado = 'aprobada'
        resena.revisado_en = timezone.now()
        resena.motivo_rechazo = ''
        resena.save()
        return Response(ResenaAdminSerializer(resena).data)


class RechazarResenaAPIView(APIView):
    permission_classes = [IsSupervisor]

    def post(self, request, resena_id):
        resena = get_object_or_404(Resena, id=resena_id)
        motivo = request.data.get('motivo', '').strip()
        resena.estado = 'rechazada'
        resena.revisado_en = timezone.now()
        resena.motivo_rechazo = motivo
        resena.save()
        return Response(ResenaAdminSerializer(resena).data)


class EliminarResenaAPIView(APIView):
    permission_classes = [IsSupervisor]

    def delete(self, request, resena_id):
        resena = get_object_or_404(Resena, id=resena_id)
        resena.delete()
        return Response({'detail': 'Reseña eliminada definitivamente'})


# ========== SECCIONES PROMOCIONALES / BANNERS ==========

class SeccionesListAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        promociones = Promocion.objects.filter(activo=True).select_related('producto').order_by(
            'etiqueta', '-created_at'
        )
        banners = BannerPromocion.objects.all().order_by('orden')
        return Response({
            'promociones': PromocionAdminSerializer(promociones, many=True).data,
            'banners': BannerAdminSerializer(banners, many=True).data,
        })


class BannerAdminListCreateAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request):
        banners = BannerPromocion.objects.all().order_by('orden')
        return Response(BannerAdminSerializer(banners, many=True).data)

    def post(self, request):
        form = BannerForm(request.data, request.FILES)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        banner = form.save()
        return Response(BannerAdminSerializer(banner).data, status=201)


class BannerAdminDetailAPIView(APIView):
    permission_classes = [IsSupervisor]

    def get(self, request, banner_id):
        banner = get_object_or_404(BannerPromocion, id=banner_id)
        return Response(BannerAdminSerializer(banner).data)

    def put(self, request, banner_id):
        banner = get_object_or_404(BannerPromocion, id=banner_id)
        form = BannerForm(request.data, request.FILES, instance=banner)
        if not form.is_valid():
            return Response({'errors': form.errors}, status=400)
        form.save()
        return Response(BannerAdminSerializer(banner).data)

    def delete(self, request, banner_id):
        banner = get_object_or_404(BannerPromocion, id=banner_id)
        banner.delete()
        return Response({'detail': 'Banner eliminado correctamente'})


class ToggleBannerAPIView(APIView):
    permission_classes = [IsSupervisor]

    def post(self, request, banner_id):
        banner = get_object_or_404(BannerPromocion, id=banner_id)
        banner.activo = not banner.activo
        banner.save()
        return Response({'activo': banner.activo})
