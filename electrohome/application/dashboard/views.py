from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.db.models import Sum, Count
from django.core.paginator import Paginator
from django.forms import inlineformset_factory
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from datetime import timedelta
from application.product.models import Purchase, ProductView, Producto, Categoria, ImagenProducto
from application.order.models import Order
from application.user.models import Cliente, Administrador
from application.user.decorators import staff_or_supervisor_required, supervisor_required
from .forms import ProductoForm, CategoriaForm, ImagenProductoForm, PromocionForm
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO
from application.product.models import Resena

# ========== AUTENTICACIÓN ==========

def supervisor_login(request):
    if request.user.is_authenticated and (request.user.is_staff or request.user.tipo_usuario == 'supervisor'):
        return redirect('dashboard:index')

    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        if not email or not password:
            messages.error(request, 'Por favor completa email y contraseña.')
        else:
            user = authenticate(request, username=email, password=password)
            if user is not None:
                if user.is_staff or user.tipo_usuario == 'supervisor':
                    login(request, user)
                    messages.success(request, f'¡Bienvenido {user.first_name or user.email}!')
                    return redirect('dashboard:index')
                else:
                    messages.error(request, 'Solo supervisores y administradores pueden acceder al dashboard.')
            else:
                messages.error(request, 'Email o contraseña incorrectos.')

    return render(request, 'dashboard/login.html', {})


def supervisor_logout(request):
    logout(request)
    messages.success(request, 'Has cerrado sesión correctamente.')
    return redirect('user:login')

# ========== DASHBOARD PRINCIPAL ==========

@supervisor_required
def admin_dashboard(request):
    # Conteos rápidos
    total_productos = Producto.objects.count()
    total_pedidos = Order.objects.count()
    total_clientes = Cliente.objects.count()
    total_categorias = Categoria.objects.count()

    # Métricas generales
    total_ventas = Purchase.objects.count()
    ingresos_totales = Purchase.objects.aggregate(total=Sum('price'))['total'] or 0
    total_vistas = ProductView.objects.count()

    conversion = 0
    if total_vistas > 0:
        conversion = round((total_ventas / total_vistas) * 100, 2)

    # Top productos vendidos y vistos
    top_productos = (
        Purchase.objects
        .values('product__nombre')
        .annotate(total=Count('id'))
        .order_by('-total')[:5]
    )
    top_vistos = (
        ProductView.objects
        .values('product__nombre')
        .annotate(total=Count('id'))
        .order_by('-total')[:5]
    )

    # hoy se define una sola vez aquí arriba
    hoy = timezone.now().date()

    # Gráfica lineal: ingresos por día (mes actual)
    from calendar import monthrange
    primer_dia_mes = hoy.replace(day=1)
    ultimo_dia_mes = hoy.replace(day=monthrange(hoy.year, hoy.month)[1])
    ventas_por_dia = []
    dia_iter = primer_dia_mes
    while dia_iter <= ultimo_dia_mes:
        total = Purchase.objects.filter(purchased_at__date=dia_iter).aggregate(t=Sum('price'))['t'] or 0
        ventas_por_dia.append({
            'dia': dia_iter.strftime('%d %b'),
            'total': float(total),
        })
        dia_iter += timedelta(days=1)


    # Tabla: ventas de hoy por hora
    ventas_hoy = []
    for h in range(24):
        total = Purchase.objects.filter(
            purchased_at__date=hoy,
            purchased_at__hour=h
        ).aggregate(t=Sum('price'))['t'] or 0
        count = Purchase.objects.filter(purchased_at__date=hoy, purchased_at__hour=h).count()
        if count > 0:  # solo mostrar horas con ventas
            ventas_hoy.append({
                'hora': f'{h:02d}:00',
                'total': float(total),
                'count': count,
            })


    # Gráfica de barras semanal 
    inicio_semana_actual = hoy - timedelta(days=hoy.weekday())
    dias_semana_actual = []
    for d in range(7):
        dia = inicio_semana_actual + timedelta(days=d)
        total_dia = Purchase.objects.filter(purchased_at__date=dia).aggregate(t=Sum('price'))['t'] or 0
        count_dia = Purchase.objects.filter(purchased_at__date=dia).count()
        dias_semana_actual.append({
            'dia': dia.strftime('%d %b'),
            'total': float(total_dia),
            'count': count_dia,
        })
        
    context = {
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
    }
    return render(request, 'dashboard/index.html', context)


# ========== NOTIFICACIONES ==========

@supervisor_required
def notificaciones_pedidos(request):
    desde = timezone.now() - timedelta(hours=24)
    pedidos_nuevos = Order.objects.filter(created_at__gte=desde).order_by('-created_at')[:10]

    data = [{
        'id': p.id,
        'usuario': p.user.email if p.user else 'Invitado',
        'total': str(p.total),
        'fecha': p.created_at.strftime('%d/%m %H:%M'),
    } for p in pedidos_nuevos]

    return JsonResponse({'pedidos': data, 'count': len(data)})


# ========== PEDIDOS ==========

@supervisor_required
def pedidos_list(request):
    estado_filtro = request.GET.get('status', '')
    pedidos = Order.objects.select_related('user').order_by('-created_at')

    if estado_filtro:
        pedidos = pedidos.filter(status=estado_filtro)

    paginator = Paginator(pedidos, 20)
    page_obj = paginator.get_page(request.GET.get('page'))

    context = {
        'page_obj': page_obj,
        'total_count': paginator.count,
        'estado_filtro': estado_filtro,
    }
    return render(request, 'dashboard/pedidos.html', context)


@supervisor_required
def cambiar_estado_pedido(request, pedido_id):
    pedido = get_object_or_404(Order, id=pedido_id)
    if request.method == 'POST':
        nuevo_estado = request.POST.get('status')
        estados_validos = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if nuevo_estado in estados_validos:
            pedido.status = nuevo_estado
            pedido.save()
            messages.success(request, f'Estado del pedido #{pedido.order_number} actualizado.')
        else:
            messages.error(request, 'Estado no válido.')
    return redirect('dashboard:pedidos')


# ========== PRODUCTOS ==========

ImagenProductoFormSet = inlineformset_factory(
    Producto, ImagenProducto,
    form=ImagenProductoForm,
    fields=('imagen', 'descripcion'),
    extra=1,
    can_delete=True
)

@supervisor_required
def productos_list(request):
    productos = Producto.objects.select_related('categoria').order_by('-fecha_creacion')
    paginator = Paginator(productos, 20)
    page_obj = paginator.get_page(request.GET.get('page'))
    return render(request, 'dashboard/productos.html', {'page_obj': page_obj, 'total_count': paginator.count})


@supervisor_required
def crear_producto(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)
        if form.is_valid():
            producto = form.save()
            formset = ImagenProductoFormSet(request.POST, request.FILES, instance=producto)
            if formset.is_valid():
                formset.save()
            else:
                messages.warning(request, 'Producto creado, pero algunas imágenes no se guardaron.')
            messages.success(request, f'Producto "{producto.nombre}" creado exitosamente')
            return redirect('dashboard:productos')
        else:
            messages.error(request, 'Error al crear el producto. Verifica los datos.')
            formset = ImagenProductoFormSet(request.POST, request.FILES)
    else:
        form = ProductoForm()
        formset = ImagenProductoFormSet()

    context = {'form': form, 'formset': formset, 'titulo': 'Crear Nuevo Producto', 'boton': 'Crear Producto'}
    return render(request, 'dashboard/form_producto.html', context)


@supervisor_required
def editar_producto(request, producto_id):
    producto = get_object_or_404(Producto, id=producto_id)
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES, instance=producto)
        formset = ImagenProductoFormSet(request.POST, request.FILES, instance=producto)
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save()
            messages.success(request, f'Producto "{producto.nombre}" actualizado exitosamente')
            return redirect('dashboard:productos')
        else:
            messages.error(request, 'Error al actualizar el producto.')
    else:
        form = ProductoForm(instance=producto)
        formset = ImagenProductoFormSet(instance=producto)

    context = {'form': form, 'formset': formset, 'producto': producto, 'titulo': f'Editar: {producto.nombre}', 'boton': 'Actualizar Producto'}
    return render(request, 'dashboard/form_producto.html', context)


@supervisor_required
def eliminar_producto(request, producto_id):
    producto = get_object_or_404(Producto, id=producto_id)
    if request.method == 'POST':
        nombre = producto.nombre
        producto.delete()
        messages.success(request, f'Producto "{nombre}" eliminado correctamente')
        return redirect('dashboard:productos')
    return render(request, 'dashboard/eliminar_producto.html', {'producto': producto})


# ========== CATEGORÍAS ==========

@supervisor_required
def categorias_list(request):
    categorias = Categoria.objects.annotate(total_productos=Count('productos')).order_by('-fecha_creacion')
    paginator = Paginator(categorias, 20)
    page_obj = paginator.get_page(request.GET.get('page'))
    return render(request, 'dashboard/categorias.html', {'page_obj': page_obj, 'total_count': paginator.count})


@supervisor_required
def crear_categoria(request):
    if request.method == 'POST':
        form = CategoriaForm(request.POST)
        if form.is_valid():
            categoria = form.save()
            messages.success(request, f'Categoría "{categoria.nombre}" creada exitosamente')
            return redirect('dashboard:categorias')
        else:
            messages.error(request, 'Error al crear la categoría. Verifica los datos.')
    else:
        form = CategoriaForm()

    context = {'form': form, 'titulo': 'Crear Nueva Categoría', 'boton': 'Crear Categoría'}
    return render(request, 'dashboard/form_categoria.html', context)


@supervisor_required
def editar_categoria(request, categoria_id):
    categoria = get_object_or_404(Categoria, id=categoria_id)
    if request.method == 'POST':
        form = CategoriaForm(request.POST, instance=categoria)
        if form.is_valid():
            form.save()
            messages.success(request, f'Categoría "{categoria.nombre}" actualizada exitosamente')
            return redirect('dashboard:categorias')
        else:
            messages.error(request, 'Error al actualizar la categoría.')
    else:
        form = CategoriaForm(instance=categoria)

    context = {'form': form, 'categoria': categoria, 'titulo': f'Editar: {categoria.nombre}', 'boton': 'Actualizar Categoría'}
    return render(request, 'dashboard/form_categoria.html', context)


@supervisor_required
def eliminar_categoria(request, categoria_id):
    categoria = get_object_or_404(Categoria, id=categoria_id)
    if request.method == 'POST':
        nombre = categoria.nombre
        categoria.delete()
        messages.success(request, f'Categoría "{nombre}" eliminada correctamente')
        return redirect('dashboard:categorias')
    return render(request, 'dashboard/eliminar_categoria.html', {'categoria': categoria})


# ========== USUARIOS ==========

@supervisor_required
def usuarios_list(request):
    clientes = Cliente.objects.filter(is_staff=False, is_superuser=False).order_by('-fecha_registro')
    admins = Administrador.objects.filter(is_staff=True).order_by('-fecha_registro')

    paginator_clientes = Paginator(clientes, 15)
    clientes_page = paginator_clientes.get_page(request.GET.get('page', 1))

    context = {
        'clientes_page': clientes_page,
        'admins': admins,
        'total_clientes': paginator_clientes.count,
        'total_admins': admins.count(),
    }
    return render(request, 'dashboard/usuarios.html', context)

# ======= REPOSTES EN PDF =======
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO

@supervisor_required
def generar_reporte_pdf(request):
    tipo = request.GET.get('tipo', 'diario')  # diario, semanal, mensual
    hoy = timezone.now().date()
    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # ===== Título =====
    titulos = {'diario': 'Reporte Diario', 'semanal': 'Reporte Semanal', 'mensual': 'Reporte Mensual'}
    story.append(Paragraph(f"ElectroHome - {titulos.get(tipo, 'Reporte')}", styles['Title']))
    story.append(Paragraph(f"Generado el {hoy.strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 20))

    # ===== Rango de fechas =====
    if tipo == 'diario':
        fecha_inicio = hoy
        fecha_fin = hoy
        subtitulo = f"Fecha: {hoy.strftime('%d/%m/%Y')}"
    elif tipo == 'semanal':
        fecha_inicio = hoy - timedelta(days=hoy.weekday())
        fecha_fin = fecha_inicio + timedelta(days=6)
        subtitulo = f"Semana: {fecha_inicio.strftime('%d/%m/%Y')} al {fecha_fin.strftime('%d/%m/%Y')}"
    else:  # mensual
        from calendar import monthrange
        fecha_inicio = hoy.replace(day=1)
        fecha_fin = hoy.replace(day=monthrange(hoy.year, hoy.month)[1])
        subtitulo = f"Mes: {hoy.strftime('%B %Y')}"

    story.append(Paragraph(subtitulo, styles['Heading2']))
    story.append(Spacer(1, 16))

    # ===== Métricas generales =====
    pedidos = Order.objects.filter(created_at__date__gte=fecha_inicio, created_at__date__lte=fecha_fin)
    total_pedidos = pedidos.count()
    ingresos = pedidos.aggregate(total=Sum('total'))['total'] or 0
    pendientes = pedidos.filter(status='pending').count()
    entregados = pedidos.filter(status='delivered').count()

    story.append(Paragraph("Resumen", styles['Heading2']))
    resumen_data = [
        ['Métrica', 'Valor'],
        ['Total Pedidos', str(total_pedidos)],
        ['Ingresos Totales', f'${ingresos:,.2f}'],
        ['Pedidos Pendientes', str(pendientes)],
        ['Pedidos Entregados', str(entregados)],
    ]
    tabla_resumen = Table(resumen_data, colWidths=[250, 200])
    tabla_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#343a40')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(tabla_resumen)
    story.append(Spacer(1, 20))

    # ===== Detalle de pedidos =====
    story.append(Paragraph("Detalle de Pedidos", styles['Heading2']))
    detalle_data = [['#', 'Cliente', 'Email', 'Estado', 'Total', 'Fecha']]
    for p in pedidos.select_related('user').order_by('-created_at')[:50]:
        cliente = p.user.get_full_name() if p.user else 'Anónimo'
        detalle_data.append([
            str(p.order_number),
            cliente[:20],
            p.email[:25],
            p.get_status_display(),
            f'${p.total:,.2f}',
            p.created_at.strftime('%d/%m/%Y %H:%M'),
        ])

    if len(detalle_data) > 1:
        tabla_detalle = Table(detalle_data, colWidths=[50, 90, 110, 70, 70, 90])
        tabla_detalle.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066cc')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4ff')]),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(tabla_detalle)
    else:
        story.append(Paragraph("No hay pedidos en este período.", styles['Normal']))

    # ===== Top productos =====
    story.append(Spacer(1, 20))
    story.append(Paragraph("Productos Más Vendidos", styles['Heading2']))
    top = (Purchase.objects
           .filter(purchased_at__date__gte=fecha_inicio, purchased_at__date__lte=fecha_fin)
           .values('product__nombre')
           .annotate(total=Count('id'), ingresos=Sum('price'))
           .order_by('-total')[:10])

    top_data = [['Producto', 'Unidades', 'Ingresos']]
    for item in top:
        top_data.append([item['product__nombre'][:35], str(item['total']), f"${item['ingresos']:,.2f}"])

    if len(top_data) > 1:
        tabla_top = Table(top_data, colWidths=[280, 80, 100])
        tabla_top.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#28a745')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fff4')]),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(tabla_top)
    else:
        story.append(Paragraph("No hay ventas en este período.", styles['Normal']))

    doc.build(story)
    buffer.seek(0)

    nombre_archivo = f"reporte_{tipo}_{hoy.strftime('%Y%m%d')}.pdf"
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
    return response

from application.product.models import Promocion
from application.user.models import Usuario
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
import base64

# ========== PROMOCIONES ==========

@supervisor_required
def promociones_list(request):
    hoy = timezone.now().date()
    promociones = Promocion.objects.select_related('producto').order_by('-created_at')
    return render(request, 'dashboard/promociones.html', {
        'promociones': promociones,
        'hoy': hoy,
    })

@supervisor_required
def crear_promocion(request):
    if request.method == 'POST':
        form = PromocionForm(request.POST)
        if form.is_valid():
            promo = form.save()
            messages.success(request, f'Promoción "{promo.etiqueta}" creada para {promo.producto.nombre}')
            return redirect('dashboard:promociones')
        else:
            messages.error(request, 'Error al crear la promoción.')
    else:
        form = PromocionForm()
    return render(request, 'dashboard/form_promocion.html', {
        'form': form, 'titulo': 'Crear Promoción', 'boton': 'Crear'
    })

@supervisor_required
def editar_promocion(request, promo_id):
    promo = get_object_or_404(Promocion, id=promo_id)
    if request.method == 'POST':
        form = PromocionForm(request.POST, instance=promo)
        if form.is_valid():
            form.save()
            messages.success(request, 'Promoción actualizada.')
            return redirect('dashboard:promociones')
    else:
        form = PromocionForm(instance=promo)
    return render(request, 'dashboard/form_promocion.html', {
        'form': form, 'titulo': 'Editar Promoción', 'boton': 'Actualizar'
    })

@supervisor_required
def eliminar_promocion(request, promo_id):
    promo = get_object_or_404(Promocion, id=promo_id)
    if request.method == 'POST':
        promo.delete()
        messages.success(request, 'Promoción eliminada.')
        return redirect('dashboard:promociones')
    return render(request, 'dashboard/eliminar_promocion.html', {'promo': promo})


# ========== ENVÍO MASIVO DE CORREOS ==========

@supervisor_required
def envio_masivo(request):
    usuarios = Usuario.objects.filter(
        is_active=True,
        tipo_usuario='cliente'
    ).order_by('email')

    if request.method == 'POST':
        asunto = request.POST.get('asunto', '').strip()
        mensaje = request.POST.get('mensaje', '').strip()
        codigo_cupon = request.POST.get('codigo_cupon', '').strip()
        descuento = request.POST.get('descuento', '').strip()
        destinatarios_ids = request.POST.getlist('destinatarios')
        imagen = request.FILES.get('imagen')

        if not asunto or not mensaje:
            messages.error(request, 'El asunto y el mensaje son obligatorios.')
            return render(request, 'dashboard/envio_masivo.html', {'usuarios': usuarios})

        if not destinatarios_ids:
            messages.error(request, 'Debes seleccionar al menos un usuario.')
            return render(request, 'dashboard/envio_masivo.html', {'usuarios': usuarios})

        # Convertir imagen a base64 si se subió
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
                email = EmailMultiAlternatives(
                    subject=asunto,
                    body=mensaje,
                    to=[usuario.email]
                )
                email.attach_alternative(html_content, "text/html")
                email.send()
                enviados += 1
            except Exception as e:
                errores += 1
                print(f"Error enviando a {usuario.email}: {e}")

        messages.success(request, f'Correos enviados: {enviados}. Errores: {errores}.')
        return redirect('dashboard:envio_masivo')

    return render(request, 'dashboard/envio_masivo.html', {'usuarios': usuarios})

# ========== RESEÑAS ==========



@supervisor_required
def resenas_list(request):
    estado = request.GET.get('estado', 'pendiente')
    resenas = Resena.objects.select_related('producto', 'usuario').order_by('-creado_en')

    if estado in ('pendiente', 'aprobada', 'rechazada'):
        resenas = resenas.filter(estado=estado)

    paginator = Paginator(resenas, 20)
    page_obj  = paginator.get_page(request.GET.get('page'))

    conteos = {
        'pendiente': Resena.objects.filter(estado='pendiente').count(),
        'aprobada':  Resena.objects.filter(estado='aprobada').count(),
        'rechazada': Resena.objects.filter(estado='rechazada').count(),
    }

    return render(request, 'dashboard/resenas.html', {
        'page_obj': page_obj,
        'estado':   estado,
        'conteos':  conteos,
    })


@supervisor_required
def aprobar_resena(request, resena_id):
    resena = get_object_or_404(Resena, id=resena_id)
    resena.estado      = 'aprobada'
    resena.revisado_en = timezone.now()
    resena.motivo_rechazo = ''
    resena.save()
    messages.success(request, f'Reseña de "{resena.usuario.email}" aprobada.')
    return redirect(request.META.get('HTTP_REFERER', 'dashboard:resenas'))


@supervisor_required
def rechazar_resena(request, resena_id):
    resena = get_object_or_404(Resena, id=resena_id)
    if request.method == 'POST':
        motivo = request.POST.get('motivo', '').strip()
        resena.estado         = 'rechazada'
        resena.revisado_en    = timezone.now()
        resena.motivo_rechazo = motivo
        resena.save()
        messages.warning(request, 'Reseña rechazada.')
    return redirect('dashboard:resenas')


@supervisor_required
def eliminar_resena(request, resena_id):
    resena = get_object_or_404(Resena, id=resena_id)
    if request.method == 'POST':
        resena.delete()
        messages.success(request, 'Reseña eliminada definitivamente.')
    return redirect('dashboard:resenas')