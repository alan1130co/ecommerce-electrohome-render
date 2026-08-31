from calendar import monthrange
from datetime import timedelta
from io import BytesIO

from django.db.models import Sum, Count
from django.forms import inlineformset_factory
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from application.order.models import Order
from application.product.models import ImagenProducto, Producto, Purchase
from application.user.decorators import supervisor_required

from .forms import ImagenProductoForm

# ========== PRODUCTOS ==========
#
# ImagenProductoFormSet sigue viva porque dashboard/api_views.py la reutiliza
# tal cual (no se redefine, para no duplicar la lógica de inlineformset_factory).

ImagenProductoFormSet = inlineformset_factory(
    Producto, ImagenProducto,
    form=ImagenProductoForm,
    fields=('imagen', 'descripcion'),
    extra=1,
    can_delete=True
)


# ======= REPORTES EN PDF =======
#
# generar_reporte_pdf sigue viva porque dashboard/api_urls.py la reutiliza tal
# cual: ya responde HttpResponse(pdf) binario protegido con @supervisor_required
# (redirige a user:login si no hay sesión válida), que es exactamente lo que
# necesita un <a href> / window.open() del navegador.

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
