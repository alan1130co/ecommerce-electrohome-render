from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import uuid
import re
import requests
from datetime import datetime

from .models import Conversation, Message, Order, Product
from .knowledge_base import get_store_context, FAQS, STORE_INFO


# ─── URLs de categorías ───────────────────────────────────────────────────────
CATEGORY_URLS = {
    'nevera':      '/productos/?categoria=refrigeracion',
    'lavadora':    '/productos/?categoria=lavado',
    'estufa':      '/productos/?categoria=cocina',
    'horno':       '/productos/?categoria=cocina',
    'microondas':  '/productos/?categoria=cocina',
    'aire':        '/productos/?categoria=climatizacion',
    'ventilador':  '/productos/?categoria=climatizacion',
    'television':  '/productos/?categoria=television',
    'tv':          '/productos/?categoria=television',
    'licuadora':   '/productos/?categoria=pequenos',
    'batidora':    '/productos/?categoria=pequenos',
    'cafetera':    '/productos/?categoria=pequenos',
    'plancha':     '/productos/?categoria=pequenos',
}

CATEGORY_KEYWORDS = {
    'nevera':     ['nevera', 'neveras', 'refrigerador', 'frigorifico', 'congelador', 'frigobar'],
    'lavadora':   ['lavadora', 'lavadoras', 'secadora', 'lavar ropa'],
    'estufa':     ['estufa', 'estufas', 'fogón'],
    'horno':      ['horno', 'hornos'],
    'microondas': ['microondas', 'micro'],
    'aire':       ['aire acondicionado', 'aire', 'acondicionado', 'climatizacion', 'climatización'],
    'ventilador': ['ventilador', 'ventiladores', 'calefactor'],
    'television': ['televisor', 'televisores', 'televisión', 'smart tv', 'pantalla'],
    'tv':         ['tv', 'tele'],
    'licuadora':  ['licuadora', 'licuadoras', 'licuar'],
    'batidora':   ['batidora', 'batidoras'],
    'cafetera':   ['cafetera', 'cafeteras', 'café'],
    'plancha':    ['plancha', 'planchas'],
}


@require_http_methods(["GET"])
def chatbot_page(request):
    """Renderiza la página del chatbot"""
    return render(request, 'chatbot/chat.html')


@csrf_exempt
@require_http_methods(["POST"])
def chat_message(request):
    """Procesa mensajes del usuario y genera respuestas"""
    try:
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', str(uuid.uuid4()))

        if not user_message:
            return JsonResponse({'error': 'Mensaje vacío'}, status=400)

        # Obtener o crear conversación
        conversation, created = Conversation.objects.get_or_create(
            session_id=session_id,
            defaults={'user': request.user if request.user.is_authenticated else None}
        )

        # Guardar mensaje del usuario
        Message.objects.create(
            conversation=conversation,
            role='user',
            content=user_message
        )

        # Historial de conversación
        history = list(conversation.messages.all().order_by('timestamp'))

        # Generar respuesta
        assistant_response, redirect_url = generate_response(user_message, history)

        # Guardar respuesta
        Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=assistant_response
        )

        response_data = {
            'success': True,
            'response': assistant_response,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
        }
        if redirect_url:
            response_data['redirect_url'] = redirect_url

        return JsonResponse(response_data)

    except Exception as e:
        print(f"❌ Error en chat_message: {e}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ─── Motor de detección de intención ─────────────────────────────────────────

def detect_category(message_lower):
    """Detecta si el mensaje menciona una categoría de producto."""
    for key, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in message_lower:
                return key, CATEGORY_URLS.get(key)
    return None, None


def detect_intent(message_lower):
    """Retorna la intención principal del mensaje."""
    intents = {
        'saludo':         ['hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'qué tal', 'como estas', 'cómo estás', 'como está', 'qué más', 'que mas'],
        'despedida':      ['adiós', 'adios', 'chao', 'hasta luego', 'bye', 'nos vemos', 'gracias hasta'],
        'agradecimiento': ['gracias', 'muchas gracias', 'te lo agradezco', 'perfecto gracias'],
        'pedido':         ['pedido', 'orden', 'seguimiento', 'rastrear', 'tracking', 'guía', 'donde esta mi'],
        'envio':          ['envío', 'envio', 'entrega', 'delivery', 'demora', 'shipping', 'llega', 'cuanto tarda'],
        'pago':           ['pago', 'pagar', 'cuotas', 'tarjeta', 'pse', 'efectivo', 'transferencia', 'precio total'],
        'devolucion':     ['devolución', 'devolucion', 'devolver', 'cambio', 'reembolso'],
        'garantia':       ['garantía', 'garantia', 'daño', 'falla', 'roto', 'no funciona', 'defecto'],
        'contacto':       ['contacto', 'teléfono', 'telefono', 'whatsapp', 'hablar con', 'asesor', 'humano', 'persona'],
        'horario':        ['horario', 'horarios', 'cuando atienden', 'a que hora', 'abren', 'cierran'],
        'instalacion':    ['instalación', 'instalacion', 'instalar', 'instalador'],
        'oferta':         ['oferta', 'descuento', 'promoción', 'promocion', 'rebaja', 'sale', 'barato'],
        'producto':       ['producto', 'precio', 'disponible', 'stock', 'cuánto cuesta', 'cuanto vale', 'tienen'],
    }
    for intent, keywords in intents.items():
        if any(kw in message_lower for kw in keywords):
            return intent
    return 'desconocido'


# ─── Generador de respuestas ──────────────────────────────────────────────────

def generate_response(user_message, history):
    """
    Genera respuesta usando Claude API con fallback a reglas.
    Retorna (texto_respuesta, redirect_url_o_None)
    """
    message_lower = user_message.lower()
    intent = detect_intent(message_lower)

    print(f"📩 Mensaje: '{user_message}' | Intención detectada: '{intent}'")

    # 1. Seguimiento de pedido (siempre local, necesita BD)
    if intent == 'pedido':
        return handle_order_tracking(user_message), None

    # 2. Detectar categoría de producto → redirigir
    cat_key, cat_url = detect_category(message_lower)
    if cat_key and intent in ('producto', 'desconocido'):
        products = Product.objects.filter(
            category__icontains=cat_key,
            is_available=True
        )[:3]

        nombres = ', '.join([p.name for p in products]) if products else None
        redirect_url = cat_url

        if nombres:
            texto = (
                f"¡Claro! Tenemos varias opciones en {cat_key}. "
                f"Algunos de nuestros modelos disponibles son: {nombres}. "
                f"Te llevo directo a esa sección para que veas todos los productos con precios y fotos. 👇"
            )
        else:
            texto = (
                f"¡Sí tenemos {cat_key}! Te muestro nuestra selección completa "
                f"con precios actualizados. Haz clic en el botón para verlos. 👇"
            )
        return texto, redirect_url

    # 3. Intentar con Claude API para respuestas naturales
    try:
        print("🤖 Llamando a Claude API...")
        claude_response = call_claude_api(user_message, history)
        if claude_response:
            print("✅ Claude respondió correctamente")
            return claude_response, None
        else:
            print("⚠️ Claude devolvió None — usando fallback")
    except Exception as e:
        print(f"❌ Exception en Claude API: {e}")

    # 4. Fallback a respuestas por reglas
    print(f"🔁 Usando fallback para intent: '{intent}'")
    return handle_rule_based(intent, message_lower), None


def call_claude_api(user_message, history):
    """Llama a Claude API con contexto de la tienda."""
    from django.conf import settings

    api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
    if not api_key:
        print("❌ ANTHROPIC_API_KEY no está configurada en settings")
        return None

    print(f"🔑 API Key encontrada: {api_key[:15]}...")

    system_prompt = get_store_context() + """

RESTRICCIONES ESTRICTAS — DEBES CUMPLIRLAS SIEMPRE:
1. Responde ÚNICAMENTE en español. Nunca uses otro idioma, aunque el usuario escriba en inglés u otro idioma.
2. Solo puedes responder preguntas relacionadas con Electrohome: productos, pedidos, envíos, pagos, devoluciones, garantías, horarios y contacto.
3. Si el usuario pregunta algo que NO tiene relación con Electrohome o electrodomésticos (política, deportes, recetas, chistes, otros temas), responde EXACTAMENTE: "Solo puedo ayudarte con temas relacionados con Electrohome y nuestros productos. ¿En qué te puedo ayudar? 😊"
4. Nunca inventes precios, modelos ni especificaciones técnicas. Si no tienes el dato exacto, sugiere visitar el catálogo o contactar a un asesor.
5. Respuestas cortas y directas, máximo 4-5 líneas.
6. Tono cálido y profesional, como un asesor colombiano amigable. Puedes usar "claro", "con gusto", "con mucho gusto".
7. Usa emojis con moderación (máximo 1-2 por respuesta).
8. Si el usuario parece molesto o frustrado, muéstrate empático antes de responder.
9. Para saludos casuales como "como estas", "qué tal", "hola", responde de forma natural y amigable antes de ofrecer ayuda.
"""

    messages_payload = []

    # Incluir últimos 6 mensajes de historial para contexto
    recent_history = list(history)[-6:] if len(history) > 6 else list(history)
    for msg in recent_history[:-1]:  # excluir el último (es el mensaje actual)
        messages_payload.append({
            'role': msg.role,
            'content': msg.content
        })

    messages_payload.append({'role': 'user', 'content': user_message})

    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            },
            json={
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 300,
                'system': system_prompt,
                'messages': messages_payload,
            },
            timeout=10
        )

        print(f"📡 Claude API status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            return data['content'][0]['text'].strip()
        else:
            print(f"❌ Claude API error {response.status_code}: {response.text}")
            return None

    except requests.exceptions.Timeout:
        print("⏰ Claude API timeout")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"🔌 Claude API connection error: {e}")
        return None


# ─── Respuestas por reglas (fallback) ────────────────────────────────────────

def handle_rule_based(intent, message_lower):
    responses = {
        'saludo': (
            "¡Hola! 👋 Bienvenido a Electrohome. Con gusto te ayudo hoy.\n\n"
            "Puedo ayudarte con:\n"
            "• 📦 Seguimiento de pedidos\n"
            "• 🔍 Productos y precios\n"
            "• 🚚 Información de envíos\n"
            "• 🔄 Devoluciones y garantías\n\n"
            "¿Qué necesitas?"
        ),
        'despedida': (
            "¡Hasta luego! 😊 Fue un placer atenderte. "
            "Si necesitas algo más, aquí estaremos. ¡Que tengas un excelente día!"
        ),
        'agradecimiento': (
            "¡Con mucho gusto! Para eso estamos. 😊 "
            "¿Hay algo más en lo que pueda ayudarte?"
        ),
        'envio': (
            "🚚 **Envíos:**\n\n"
            f"⏱️ Tiempo: 3-5 días hábiles (Bogotá 2-3 días)\n"
            f"📍 Cobertura: Todo Colombia\n"
            f"💰 Bogotá: Gratis en compras +$200.000\n"
            f"💰 Nacional: $15.000 - $30.000\n\n"
            "Recibirás tu número de guía por email. ¿Algo más?"
        ),
        'pago': (
            "💳 **Métodos de pago:**\n\n"
            "• Tarjeta crédito/débito (Visa, Mastercard)\n"
            "• PSE — con 10% de descuento 🎉\n"
            "• Efectivo contra entrega\n"
            "• Transferencia bancaria\n"
            "• Hasta 36 cuotas con tarjeta de crédito\n\n"
            "¿Te puedo ayudar con algo más?"
        ),
        'devolucion': (
            "🔄 **Devoluciones:**\n\n"
            "Tienes 30 días para devolver tu producto.\n"
            "✅ Debe estar sin usar, con empaque original y factura.\n\n"
            f"Contáctanos para iniciar el proceso:\n"
            f"📞 {STORE_INFO['telefono']}\n"
            f"📧 {STORE_INFO['email']}"
        ),
        'garantia': (
            "🛡️ **Garantía:**\n\n"
            "Todos los productos tienen **1 año de garantía legal**.\n"
            "Cubre defectos de fabricación y fallas en funcionamiento normal.\n\n"
            "Para reclamar garantía comunícate con nosotros:\n"
            f"📞 {STORE_INFO['telefono']}\n"
            f"💬 WhatsApp: {STORE_INFO['whatsapp']}"
        ),
        'contacto': (
            "📞 **Contáctanos:**\n\n"
            f"☎️ Teléfono: {STORE_INFO['telefono']}\n"
            f"💬 WhatsApp: {STORE_INFO['whatsapp']}\n"
            f"📧 Email: {STORE_INFO['email']}\n\n"
            f"🕒 {STORE_INFO['horarios']}"
        ),
        'horario': (
            f"🕒 **Horario de atención:**\n\n{STORE_INFO['horarios']}\n\n"
            "Fuera de ese horario puedes escribirnos al WhatsApp y te respondemos al día siguiente. 😊"
        ),
        'instalacion': (
            "🔧 **Servicio de instalación:**\n\n"
            "Sí ofrecemos instalación para:\n"
            "• Aires acondicionados\n"
            "• Lavadoras\n"
            "• Estufas\n\n"
            "El costo varía según el producto. Para más info:\n"
            f"💬 WhatsApp: {STORE_INFO['whatsapp']}"
        ),
        'oferta': (
            "🎉 **Ofertas y descuentos:**\n\n"
            "• 10% de descuento pagando con PSE\n"
            "• Envío gratis en Bogotá en compras +$200.000\n"
            "• Hasta 36 cuotas sin interés con tarjetas participantes\n\n"
            "Visita nuestro catálogo para ver las promociones activas. ¿Te ayudo con algo más?"
        ),
        'producto': (
            "🔍 Tenemos estas categorías disponibles:\n\n"
            "• Neveras y refrigeración\n"
            "• Lavadoras y secadoras\n"
            "• Estufas y hornos\n"
            "• Microondas\n"
            "• Aires acondicionados\n"
            "• Televisores\n"
            "• Pequeños electrodomésticos\n\n"
            "¿Qué tipo de producto estás buscando?"
        ),
        'desconocido': (
            "Entiendo tu consulta. 😊 Puedo ayudarte con:\n\n"
            "• 📦 Seguimiento de pedidos\n"
            "• 🔍 Productos y precios\n"
            "• 🚚 Envíos y entregas\n"
            "• 💳 Métodos de pago\n"
            "• 🔄 Devoluciones y garantías\n"
            "• 📞 Contacto y horarios\n\n"
            "¿En qué te puedo ayudar?"
        ),
    }
    return responses.get(intent, responses['desconocido'])


def handle_order_tracking(message):
    """Maneja seguimiento de pedidos."""
    order_pattern = r'#?\d{6,10}'
    match = re.search(order_pattern, message)

    if match:
        order_number = match.group().replace('#', '')
        try:
            order = Order.objects.get(order_number=order_number)
            status_emoji = {
                'pending':    '⏳',
                'confirmed':  '✅',
                'processing': '📦',
                'shipped':    '🚚',
                'delivered':  '🎉',
                'cancelled':  '❌'
            }
            status_text = {
                'pending':    'Pendiente de confirmación',
                'confirmed':  'Confirmado — en preparación',
                'processing': 'En proceso de alistamiento',
                'shipped':    'Enviado — en camino',
                'delivered':  'Entregado',
                'cancelled':  'Cancelado'
            }

            resp = (
                f"📦 **Pedido #{order.order_number}**\n\n"
                f"{status_emoji.get(order.status, '📋')} Estado: {status_text.get(order.status, order.status)}\n"
                f"🛍️ Producto: {order.product_name}\n"
                f"📅 Fecha: {order.created_at.strftime('%d/%m/%Y')}\n"
            )
            if order.tracking_number:
                resp += f"🔢 Guía: {order.tracking_number}\n"
            if order.estimated_delivery:
                resp += f"📅 Entrega estimada: {order.estimated_delivery.strftime('%d/%m/%Y')}\n"
            resp += "\n¿Necesitas algo más?"
            return resp

        except Order.DoesNotExist:
            return (
                f"❌ No encontré el pedido **#{order_number}**.\n\n"
                "Por favor verifica el número en tu email de confirmación o en tu cuenta. "
                "¿Te puedo ayudar con algo más?"
            )
    else:
        return (
            "Para rastrear tu pedido necesito el número de orden. 📋\n\n"
            "Lo encuentras en el email de confirmación o en tu cuenta de Electrohome.\n\n"
            "Escríbelo así: **#123456**"
        )


@require_http_methods(["GET"])
def get_conversation_history(request, session_id):
    """Obtiene el historial de una conversación"""
    try:
        conversation = Conversation.objects.get(session_id=session_id)
        messages = conversation.messages.all().order_by('timestamp')
        history = [{
            'role': msg.role,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages]
        return JsonResponse({'history': history})
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Conversación no encontrada'}, status=404)