from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import uuid
import re
import requests
from datetime import datetime

from .models import Conversation, Message, Order
from application.product.models import Producto, Categoria
from .knowledge_base import get_store_context, FAQS, STORE_INFO


# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURACIÓN DE CATEGORÍAS
# ══════════════════════════════════════════════════════════════════════════════

# ── Las 7 categorías reales de Electrohome ────────────────────────────────────
CATEGORY_URLS = {
    'cocina':          '/productos/?categoria=Cocina',
    'climatizacion':   '/productos/?categoria=Climatizaci%C3%B3n',
    'entretenimiento': '/productos/?categoria=Entretenimiento',
    'limpieza':        '/productos/?categoria=Limpieza',
    'cuidado_persona': '/productos/?categoria=Cuidado+persona',
    'salud':           '/productos/?categoria=Salud',
}

CATEGORY_DISPLAY = {
    'cocina':          'Cocina',
    'climatizacion':   'Climatización',
    'entretenimiento': 'Entretenimiento',
    'limpieza':        'Limpieza',
    'cuidado_persona': 'Cuidado Personal',
    'salud':           'Salud',
}

# Nombre exacto en BD (campo category del modelo Product)
CATEGORY_DB_NAME = {
    'cocina':          'Cocina',
    'climatizacion':   'Climatización',
    'entretenimiento': 'Entretenimiento',
    'limpieza':        'Limpieza',
    'cuidado_persona': 'Cuidado persona',
    'salud':           'Salud',
}

# Lo que el usuario puede decir → categoría interna
# CLAVE: neveras/refrigeradores → Cocina (así están en tu BD)
#         lavadoras/aspiradoras → Limpieza
#         tv/parlantes/consolas → Entretenimiento
CATEGORY_KEYWORDS = {
    'cocina': [
        'nevera', 'neveras', 'refrigerador', 'refrigeradora', 'frigorifico', 'frigorífico',
        'nevecon', 'congelador', 'frigobar', 'nevecón',
        'estufa', 'estufas', 'fogón', 'fogon',
        'horno', 'hornos', 'microondas', 'micro',
        'licuadora', 'licuadoras', 'batidora', 'batidoras', 'batidora pedestal',
        'cafetera', 'cafeteras', 'sanduchera', 'tostadora',
        'freidora', 'freidora de aire', 'air fryer',
        'procesador de alimentos', 'olla multifuncional', 'olla',
        'cocina', 'electrodomesticos de cocina',
    ],
    'climatizacion': [
        'aire acondicionado', 'aire', 'acondicionado', 'split',
        'ventilador', 'ventiladores', 'abanico',
        'calefactor', 'climatizacion', 'climatización',
    ],
    'entretenimiento': [
        'televisor', 'televisores', 'televisión', 'television', 'tv', 'tele',
        'smart tv', 'pantalla', 'oled', 'qled', 'uhd', '4k',
        'parlante', 'parlantes', 'altavoz', 'bocina', 'speaker',
        'consola', 'play', 'playstation', 'ps5', 'xbox', 'nintendo', 'switch',
        'minicomponente', 'equipo de sonido', 'barra de sonido',
        'entretenimiento',
    ],
    'limpieza': [
        'lavadora', 'lavadoras', 'secadora', 'lavadora secadora', 'lavar ropa',
        'lavavajillas', 'lavaplatos',
        'aspiradora', 'aspiradoras', 'robot aspirador', 'aspiradora robotica',
        'trapeador', 'trapeador de vapor', 'mopa',
        'plancha de ropa', 'plancha vapor', 'limpieza',
    ],
    'cuidado_persona': [
        'cortapelo', 'cortadora de pelo', 'maquina de peluqueria', 'maquinilla',
        'afeitador', 'rasuradora', 'depiladora',
        'secador de cabello', 'secador', 'plancha de cabello', 'plancha pelo',
        'cepillo de aire', 'rizador', 'cuidado personal',
    ],
    'salud': [
        'suplemento', 'suplementos', 'vitamina', 'vitaminas', 'proteina',
        'colageno', 'colágeno', 'krill', 'astaxantina', 'glutathione',
        'shilajit', 'azul de metileno', 'salud', 'bienestar',
    ],
}

# Palabras que indican pregunta ESPECÍFICA (→ buscar en BD)
SPECIFIC_QUERY_WORDS = [
    'cuánto cuesta', 'cuanto cuesta', 'cuánto vale', 'cuanto vale',
    'precio de', 'precio del', 'el precio', 'costo de', 'valor de',
    'está disponible', 'esta disponible', 'hay en stock',
    'tienen el', 'tienen la', 'disponible el', 'disponible la',
    'especificaciones', 'ficha técnica', 'ficha tecnica',
    'características de', 'caracteristicas de',
    # Marcas del catálogo
    'samsung', 'lg', 'haceb', 'mabe', 'whirlpool', 'hisense', 'sony',
    'nintendo', 'xbox', 'playstation',
    'black+decker', 'blackdecker', 'oster', 'challenger', 'electrolux',
    'ninja', 'imusa', 't-fal', 'tfal', 'remington', 'jbl', 'bose',
    'samurai', 'wurden', 'recco', 'wahl', 'vivitar', 'geemy', 'cusine',
    # Unidades técnicas
    'litros', 'pulgadas', 'watts', 'kilos', 'kg', 'btu', 'hp',
]

# ── Temas que SIEMPRE van al asesor ───────────────────────────────────────────
ASESOR_TRIGGERS = {
    'devolucion_dinero': [
        'devolver el dinero', 'reembolso', 'devolucion de dinero', 'devolución de dinero',
        'quiero mi dinero de vuelta', 'reembolsar', 'cobro indebido',
        'me cobraron de mas', 'me cobraron de más',
    ],
    'producto_defectuoso': [
        'llego danado', 'llegó dañado', 'llego roto', 'llegó roto',
        'producto defectuoso', 'defecto de fabrica', 'defecto de fábrica',
        'no enciende', 'no prende', 'hace ruido raro', 'huele a quemado',
    ],
    'garantia': [
        'reclamar garantia', 'reclamar garantía', 'aplicar garantia',
        'hacer efectiva la garantia', 'servicio tecnico', 'reparacion en garantia',
    ],
    'problema_pago': [
        'me cobro dos veces', 'me cobraron dos veces', 'cargo duplicado',
        'pago fallido', 'transaccion rechazada', 'pago no procesado',
        'error en el pago', 'disputa de pago',
    ],
    'contacto_asesor': [
    'quiero un asesor', 'hablar con un asesor', 'contactar asesor',
    'necesito un asesor', 'hablar con alguien', 'asesor humano',
    'quiero hablar con una persona', 'comunicarme con un asesor',
    'necesito hablar con un asesor',
],
}

ORDER_KEYWORDS = [
    'pedido', 'orden', 'seguimiento', 'rastrear', 'tracking',
    'donde esta mi pedido', 'como va mi pedido', 'estado de mi pedido',
    'numero de orden', 'buscar mi pedido',
]


# ══════════════════════════════════════════════════════════════════════════════
#  VISTA PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════

@require_http_methods(["GET"])
def chatbot_page(request):
    return render(request, 'chatbot/chat.html')


@csrf_exempt
@require_http_methods(["POST"])
def chat_message(request):
    try:
        data         = json.loads(request.body)
        user_message = data.get('message', '').strip()
        session_id   = data.get('session_id', str(uuid.uuid4()))

        if not user_message:
            return JsonResponse({'error': 'Mensaje vacío'}, status=400)

        conversation, _ = Conversation.objects.get_or_create(
            session_id=session_id,
            defaults={'user': request.user if request.user.is_authenticated else None}
        )

        Message.objects.create(conversation=conversation, role='user', content=user_message)
        history = list(conversation.messages.all().order_by('timestamp'))

        assistant_response, redirect_url, needs_agent = route_message(
            user_message, history, conversation
        )

        Message.objects.create(
            conversation=conversation, role='assistant', content=assistant_response
        )

        response_data = {
            'success':     True,
            'response':    assistant_response,
            'session_id':  session_id,
            'timestamp':   datetime.now().isoformat(),
            'needs_agent': needs_agent,
        }
        if redirect_url:
            response_data['redirect_url'] = redirect_url

        return JsonResponse(response_data)

    except Exception as e:
        print(f"❌ Error en chat_message: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ══════════════════════════════════════════════════════════════════════════════
#  ENRUTADOR PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════

def route_message(user_message, history, conversation):
    """
    Prioridad:
      1. Temas para asesor humano         → local, needs_agent=True
      2. Seguimiento de pedido            → lógica local con BD
      3. Pregunta ESPECÍFICA de producto  → buscar en BD y responder
      4. Pregunta GENERAL de categoría    → redirect al catálogo
      5. Todo lo demás                    → Claude con historial completo
    """
    msg_lower = user_message.lower()

    # 1 ── Asesor obligatorio
    motivo = _check_needs_agent(msg_lower)
    if motivo:
        return _respond_needs_agent(motivo), None, True

    # 2 ── Seguimiento de pedido
    if any(kw in msg_lower for kw in ORDER_KEYWORDS):
        return handle_order_flow(user_message, history), None, False

    if _bot_asked_for_order_data(history):
        result = _extract_and_lookup(user_message, history)
        if result:
            return result, None, False

    # 3 ── Pregunta ESPECÍFICA de producto → consultar BD
    if _is_specific_product_query(msg_lower):
        result = search_products_db(msg_lower, user_message)
        if result:
            return result, None, False
        # Si no encontró nada en BD, caer al catálogo si hay categoría detectada
        cat_key, cat_url = _detect_category(msg_lower)
        if cat_key:
            return _not_found_redirect(cat_key, cat_url), cat_url, False

    # 4 ── Pregunta GENERAL de categoría → catálogo
    cat_key, cat_url = _detect_category(msg_lower)
    if cat_key:
        return _product_category_response(cat_key, cat_url), cat_url, False

    # 5 ── Claude (conversación natural con memoria)
    return call_claude_api(user_message, history), None, False


# ══════════════════════════════════════════════════════════════════════════════
#  DETECCIÓN: ¿PREGUNTA GENERAL O ESPECÍFICA?
# ══════════════════════════════════════════════════════════════════════════════

def _is_specific_product_query(msg_lower):
    """
    Retorna True si el mensaje hace una pregunta específica sobre un producto
    (precio puntual, marca, modelo, disponibilidad de uno concreto, specs).
    Retorna False si es una pregunta general de categoría.
    """
    return any(kw in msg_lower for kw in SPECIFIC_QUERY_WORDS)


# ══════════════════════════════════════════════════════════════════════════════
#  BÚSQUEDA EN BASE DE DATOS DE PRODUCTOS
# ══════════════════════════════════════════════════════════════════════════════

def search_products_db(msg_lower, original_message):
    """
    Busca en el modelo Producto real (application.product.models).
    Campos: nombre, precio, marca, descripcion, stock, activo, categoria__nombre
    """
    from django.db.models import Q

    stopwords = {
        'cuánto', 'cuanto', 'cuesta', 'vale', 'precio', 'del', 'de', 'la', 'el',
        'los', 'las', 'un', 'una', 'tiene', 'hay', 'está', 'esta', 'es', 'son',
        'tienen', 'me', 'puedes', 'puedo', 'ver', 'quiero', 'busco', 'necesito',
        'disponible', 'stock', 'en', 'con', 'para', 'que', 'qué', 'y', 'o',
        'su', 'sus', 'ese', 'esa', 'este', 'alguna', 'algún', 'algun',
    }

    words = [w for w in re.findall(r'\b\w+\b', msg_lower) if w not in stopwords and len(w) > 2]
    if not words:
        return None

    # Filtro por categoría si se detecta
    cat_key, _ = _detect_category(msg_lower)
    cat_filter = Q()
    if cat_key:
        db_name = CATEGORY_DB_NAME.get(cat_key, cat_key)
        cat_filter = Q(categoria__nombre__iexact=db_name)

    # Buscar por palabras en nombre, marca y descripción
    q = Q()
    for word in words:
        q |= Q(nombre__icontains=word)
        q |= Q(marca__icontains=word)
        q |= Q(descripcion__icontains=word)

    productos = Producto.objects.filter(cat_filter & q, activo=True).distinct()[:5]

    # Si con categoría no encontró, buscar sin filtro
    if not productos.exists() and cat_key:
        productos = Producto.objects.filter(q, activo=True).distinct()[:5]

    if not productos.exists():
        return None

    if productos.count() == 1:
        return _format_producto_detail(productos.first())

    return _format_producto_list(productos)


def _format_producto_detail(p):
    """Formato detallado para 1 producto del modelo Producto real."""
    stock_text = "✅ Disponible" if p.stock > 0 else "❌ Agotado"
    stock_units = f" ({p.stock} unidades)" if p.stock > 0 else ""

    lines = [
        f"🛍️ **{p.nombre}**\n",
        f"💰 **Precio:** ${p.precio:,.0f}",
        f"📦 **Stock:** {stock_text}{stock_units}",
    ]
    if p.marca:
        lines.append(f"🏷️ **Marca:** {p.marca}")
    if p.categoria:
        lines.append(f"📂 **Categoría:** {p.categoria.nombre}")
    if p.capacidad:
        lines.append(f"📐 **Capacidad:** {p.capacidad}")
    if p.potencia:
        lines.append(f"⚡ **Potencia:** {p.potencia}")
    if p.garantia_meses:
        lines.append(f"🛡️ **Garantía:** {p.garantia_meses} meses")
    if p.caracteristicas_destacadas:
        lines.append(f"✨ **Características:** {p.caracteristicas_destacadas[:100]}")

    lines.append("\n¿Quieres verlo completo en el catálogo o tienes otra pregunta? 😊")
    return "\n".join(l for l in lines if l)


def _format_producto_list(productos):
    """Formato lista cuando se encuentran varios productos."""
    resp = f"Encontré **{productos.count()} productos** que coinciden:\n\n"
    for p in productos:
        stock_icon = "✅" if p.stock > 0 else "❌"
        marca = f" | 🏷️ {p.marca}" if p.marca else ""
        resp += (
            f"{stock_icon} **{p.nombre}**\n"
            f"   💰 ${p.precio:,.0f}{marca}  |  📦 Stock: {p.stock}\n\n"
        )
    resp += "¿Quieres más detalles de alguno? Dime el nombre o la referencia. 😊"
    return resp


def _not_found_redirect(cat_key, cat_url):
    """Cuando se buscó en BD pero no se encontró → redirigir al catálogo."""
    return (
        f"No encontré ese producto exacto en nuestro inventario actual. 😕\n\n"
        f"Pero tenemos más opciones en **{cat_key}** — te muestro el catálogo completo "
        f"con todos los modelos y precios actualizados. 👇"
    )


# ══════════════════════════════════════════════════════════════════════════════
#  CLAUDE API — conversación natural con historial y contexto de productos
# ══════════════════════════════════════════════════════════════════════════════

def call_claude_api(user_message, history):
    from django.conf import settings

    api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
    if not api_key:
        return _fallback_response()

    system_prompt = f"""Eres "Electro", el asistente virtual de Electrohome, tienda colombiana de electrodomésticos.
Tienes una personalidad cálida, cercana y profesional — como un asesor colombiano amigable de verdad.

{get_store_context()}

══════════════════════════════════════
PERSONALIDAD Y CONVERSACIÓN
══════════════════════════════════════

MEMORIA DE CONVERSACIÓN:
- Recuerdas todo lo que el usuario ha dicho en esta sesión.
- Si la conversación ya lleva varios turnos, NO saludes como si fuera la primera vez.
- Si el usuario ya se presentó o contó algo, úsalo en tu respuesta.

SALUDO Y CHARLA CASUAL:
- Si alguien dice "hola", "qué más", "cómo estás", "qué haces" — responde natural y cercano.
  Ejemplo: "Todo bien, aquí ayudándote 😊 ¿En qué te puedo colaborar?"
- Si el usuario usa apelativos como "pai", "parcero", "amor", "mami", "jefe", "reina" —
  acepta ese tono afectuoso y responde con calidez colombiana.
- Varía tus respuestas. No repitas siempre la misma frase.

PRODUCTOS:
- Si alguien pregunta por un producto específico (marca, modelo, precio puntual) y NO tienes
  el dato exacto, dile que puedes buscarlo y sugiere ir al catálogo o hablar con un asesor.
- Nunca inventes precios ni especificaciones.

FOCO EN ELECTROHOME:
- Solo atiendes temas de Electrohome: productos, pedidos, envíos, pagos, horarios, contacto.
- Si preguntan algo completamente ajeno di: "Ese tema se me escapa, solo manejo lo de
  Electrohome 😅 ¿Te ayudo con algo de eso?"

ESCALAR A ASESOR:
- Devolución de dinero, producto defectuoso, garantía técnica, problema con pago →
  indica que eso lo maneja un asesor:
  WhatsApp: {STORE_INFO['whatsapp']} | Tel: {STORE_INFO['telefono']}

FORMATO:
- Máximo 4-5 líneas. Máximo 2 emojis.
- Español colombiano, tono cálido.
"""

    recent = list(history)[-12:] if len(history) > 12 else list(history)
    messages_payload = []
    for msg in recent[:-1]:
        messages_payload.append({'role': msg.role, 'content': msg.content})
    messages_payload.append({'role': 'user', 'content': user_message})

    try:
        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            },
            json={
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 400,
                'system': system_prompt,
                'messages': messages_payload,
            },
            timeout=12,
        )

        if resp.status_code == 200:
            return resp.json()['content'][0]['text'].strip()

        print(f"❌ Claude API {resp.status_code}: {resp.text}")
        return _fallback_response()

    except requests.exceptions.Timeout:
        return _fallback_response()
    except Exception as e:
        print(f"❌ Claude error: {e}")
        return _fallback_response()


def _fallback_response():
    return (
        "Perdona, tuve un problema técnico momentáneo. 😅 "
        f"Escríbenos al WhatsApp {STORE_INFO['whatsapp']} y te atendemos de inmediato."
    )


# ══════════════════════════════════════════════════════════════════════════════
#  SEGUIMIENTO DE PEDIDOS
# ══════════════════════════════════════════════════════════════════════════════

def handle_order_flow(user_message, history):
    order_match = re.search(r'#?(\d{4,10})', user_message)
    if order_match:
        return _lookup_by_order_number(order_match.group(1))

    result = _extract_and_lookup(user_message, history)
    if result:
        return result

    return (
        "Con gusto te ayudo a rastrear tu pedido. 📦\n\n"
        "¿Cómo lo buscamos?\n\n"
        "**① Número de orden** — escríbelo así: `#123456`\n"
        "   _(está en tu email de confirmación)_\n\n"
        "**② Datos personales** — dime tu email, celular o nombre completo "
        "con el que compraste y lo busco yo. 🔍"
    )


def _lookup_by_order_number(order_number):
    try:
        return _format_order(Order.objects.get(order_number=order_number))
    except Order.DoesNotExist:
        return (
            f"No encontré el pedido **#{order_number}**. 😕\n\n"
            "Revisa que el número esté correcto (está en el email de confirmación).\n\n"
            "También puedo buscarlo con tu **email o celular**. 🔍"
        )


def _extract_and_lookup(user_message, history):
    email = _find_email(user_message)
    phone = _find_phone(user_message)
    name  = _find_name(user_message)

    if not (email or phone or name):
        for msg in reversed(list(history)[-6:]):
            if msg.role == 'user' and msg.content != user_message:
                email = email or _find_email(msg.content)
                phone = phone or _find_phone(msg.content)
                name  = name  or _find_name(msg.content)
                if email or phone:
                    break

    if not (email or phone or name):
        return None

    from django.db.models import Q
    orders = None
    if email:
        orders = Order.objects.filter(customer_email__iexact=email).order_by('-created_at')[:5]
    elif phone:
        orders = Order.objects.filter(customer_phone__icontains=phone).order_by('-created_at')[:5]
    elif name:
        q = Q()
        for part in name.split():
            q &= Q(customer_name__icontains=part)
        orders = Order.objects.filter(q).order_by('-created_at')[:5]

    if not orders.exists():
        dato = email or phone or name
        return (
            f"Busqué con **{dato}** pero no encontré pedidos. 🔍\n\n"
            "Verifica que sea el mismo dato con el que hiciste la compra "
            "o intenta con otro (email, celular o nombre completo).\n\n"
            f"Si persiste escríbenos al WhatsApp {STORE_INFO['whatsapp']}."
        )

    if orders.count() == 1:
        return _format_order(orders.first())

    resp = f"Encontré **{orders.count()} pedidos** asociados:\n\n"
    emojis = {'pending':'⏳','confirmed':'✅','processing':'📦',
               'shipped':'🚚','delivered':'🎉','cancelled':'❌'}
    for i, o in enumerate(orders, 1):
        resp += (
            f"**{i}. #{o.order_number}** — {o.product_name} "
            f"{emojis.get(o.status,'📋')} _{o.created_at.strftime('%d/%m/%Y')}_\n"
        )
    resp += "\n¿De cuál quieres más detalles? 😊"
    return resp


def _bot_asked_for_order_data(history):
    bot_msgs = [m for m in reversed(list(history)) if m.role == 'assistant']
    if not bot_msgs:
        return False
    last = bot_msgs[0].content.lower()
    return any(p in last for p in [
        'email', 'celular', 'nombre completo', 'datos personales', 'como lo buscamos',
    ])


def _format_order(order):
    status_map = {
        'pending':    ('⏳', 'Pendiente de confirmación'),
        'confirmed':  ('✅', 'Confirmado — en preparación'),
        'processing': ('📦', 'En proceso de alistamiento'),
        'shipped':    ('🚚', 'Enviado — en camino'),
        'delivered':  ('🎉', 'Entregado con éxito'),
        'cancelled':  ('❌', 'Cancelado'),
    }
    emoji, texto = status_map.get(order.status, ('📋', order.status))
    lines = [
        f"📦 **Pedido #{order.order_number}**\n",
        f"{emoji} **Estado:** {texto}",
        f"🛍️ **Producto:** {order.product_name}",
        f"📅 **Fecha de compra:** {order.created_at.strftime('%d/%m/%Y')}",
    ]
    if order.tracking_number:
        lines.append(f"🔢 **Guía de envío:** {order.tracking_number}")
    if order.estimated_delivery:
        lines.append(f"📅 **Entrega estimada:** {order.estimated_delivery.strftime('%d/%m/%Y')}")
    if order.customer_name:
        lines.append(f"👤 **Cliente:** {order.customer_name}")
    lines.append("\n¿Necesitas algo más? 😊")
    return "\n".join(lines)


# ── Helpers extracción de datos personales ────────────────────────────────────

def _find_email(text):
    m = re.search(r'[\w.\-]+@[\w.\-]+\.\w{2,4}', text)
    return m.group() if m else None


def _find_phone(text):
    m = re.search(r'\b3\d{9}\b', text)
    if not m:
        m = re.search(r'\b\d{7,10}\b', text)
    return m.group() if m else None


def _find_name(text):
    m = re.search(
        r'(?:me llamo|soy|nombre[:\s]+)\s*'
        r'([A-ZÁÉÍÓÚÑA-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑA-záéíóúñ]{2,})+)',
        text, re.IGNORECASE
    )
    return m.group(1).strip() if m else None


# ══════════════════════════════════════════════════════════════════════════════
#  CATEGORÍAS DE PRODUCTO (pregunta general → catálogo)
# ══════════════════════════════════════════════════════════════════════════════

def _detect_category(msg_lower):
    for key, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in msg_lower for kw in keywords):
            return key, CATEGORY_URLS.get(key)
    return None, None


def _product_category_response(cat_key, cat_url):
    """Respuesta para pregunta GENERAL — redirige al catálogo."""
    db_name = CATEGORY_DB_NAME.get(cat_key, cat_key)
    display = CATEGORY_DISPLAY.get(cat_key, cat_key)

    productos = Producto.objects.filter(
        categoria__nombre__iexact=db_name, activo=True
    ).select_related('categoria')[:3]

    if productos.exists():
        nombres = ', '.join(p.nombre.split()[:4] for p in productos)
        return (
            f"¡Claro! Tenemos varias opciones en **{display}**. "
            f"Por ejemplo: {nombres}... y más. "
            f"Te mando al catálogo para que veas todos con precios y fotos. 👇"
        )
    return (
        f"¡Sí manejamos {display}! Te muestro el catálogo completo "
        f"con precios actualizados. 👇"
    )


# ══════════════════════════════════════════════════════════════════════════════
#  ESCALADA A ASESOR
# ══════════════════════════════════════════════════════════════════════════════

def _check_needs_agent(msg_lower):
    for motivo, triggers in ASESOR_TRIGGERS.items():
        if any(t in msg_lower for t in triggers):
            return motivo
    return None


def _respond_needs_agent(motivo):
    intros = {
        'devolucion_dinero':   "Entiendo, la devolución de dinero requiere atención personalizada de nuestros asesores. 💰",
        'producto_defectuoso': "Lamentamos el inconveniente con tu producto. 😔 Un asesor especializado debe revisar tu caso.",
        'garantia':            "Para gestionar la garantía, nuestro equipo técnico debe acompañarte. 🛡️",
        'problema_pago':       "Un problema de pago necesita revisión directa de nuestro equipo. 💳",
        'contacto_asesor':     "¡Con gusto! Te conecto con uno de nuestros asesores. 😊",
    }
    intro = intros.get(motivo, "Este tema requiere la atención de un asesor. 😊")
    return (
        f"{intro}\n\n"
        f"📞 <b>Contáctanos ahora:</b>\n"
        f"🕒 {STORE_INFO['horarios']}\n\n"
        f"<a href='https://wa.me/573007607645' target='_blank' "
        f"style='display:inline-block;background:linear-gradient(135deg,#25D366,#128C7E);"
        f"color:white;padding:10px 20px;border-radius:10px;text-decoration:none;"
        f"font-weight:700;font-size:14px;margin-top:8px;'>"
        f"💬 Hablar por WhatsApp</a>"
    )

# ══════════════════════════════════════════════════════════════════════════════
#  HISTORIAL
# ══════════════════════════════════════════════════════════════════════════════

@require_http_methods(["GET"])
def get_conversation_history(request, session_id):
    try:
        conversation = Conversation.objects.get(session_id=session_id)
        messages = conversation.messages.all().order_by('timestamp')
        history = [
            {'role': m.role, 'content': m.content, 'timestamp': m.timestamp.isoformat()}
            for m in messages
        ]
        return JsonResponse({'history': history})
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversación no encontrada'}, status=404)