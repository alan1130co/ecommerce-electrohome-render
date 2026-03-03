from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import uuid
from datetime import datetime

from .models import Conversation, Message, Order, Product
from .knowledge_base import get_store_context, FAQS, STORE_INFO


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
        
        # Obtener historial de conversación
        history = list(conversation.messages.all().order_by('timestamp'))
        
        # Generar respuesta
        assistant_response = generate_response(user_message, history)
        
        # Guardar respuesta del asistente
        Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=assistant_response
        )
        
        return JsonResponse({
            'success': True,  # ← AGREGAR ESTA LÍNEA
            'response': assistant_response,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat()
})
        
    except Exception as e:
     return JsonResponse({
        'success': False,  # ← AGREGAR
        'error': str(e)
    }, status=500)


def generate_response(user_message, history):
    """
    Genera respuesta del chatbot basada en el mensaje del usuario
    Aquí puedes integrar la API de Claude o usar lógica basada en reglas
    """
    message_lower = user_message.lower()
    
    # Detectar intención: seguimiento de pedido
    if any(word in message_lower for word in ['pedido', 'orden', 'seguimiento', 'rastrear', 'tracking', 'guía']):
        return handle_order_tracking(user_message)
    
    # Detectar intención: productos
    if any(word in message_lower for word in ['producto', 'precio', 'disponible', 'stock', 'nevera', 'lavadora', 'estufa']):
        return handle_product_query(user_message)
    
    # Detectar intención: envío
    if any(word in message_lower for word in ['envío', 'entrega', 'delivery', 'cuánto demora', 'shipping']):
        return f"""
📦 **Información de Envíos:**

⏱️ Tiempo de entrega: 3-5 días hábiles
📍 Cobertura: Todo Colombia
💰 Costos:
   • Bogotá: Gratis en compras mayores a $200.000
   • Nacional: $15.000 - $30.000 según ciudad

Recibirás un número de guía por email cuando tu pedido sea despachado.

¿Necesitas ayuda con algo más?
"""
    
    # Detectar intención: devoluciones
    if any(word in message_lower for word in ['devolución', 'devolver', 'cambio', 'reembolso', 'garantía']):
        return f"""
🔄 **Política de Devoluciones:**

✅ Tienes 30 días para devolver tu producto
📋 Condiciones:
   • Producto sin usar y en perfecto estado
   • Empaque original completo
   • Factura de compra

🛡️ **Garantía:**
Todos los productos tienen 1 año de garantía legal.

Para iniciar una devolución, contáctanos:
📞 {STORE_INFO['telefono']}
📧 {STORE_INFO['email']}

¿Puedo ayudarte con algo más?
"""
    
    # Detectar intención: contacto
    if any(word in message_lower for word in ['contacto', 'teléfono', 'email', 'whatsapp', 'hablar', 'comunicar']):
        return f"""
📞 **Contáctanos:**

☎️ Teléfono: {STORE_INFO['telefono']}
📧 Email: {STORE_INFO['email']}
💬 WhatsApp: {STORE_INFO['whatsapp']}

🕒 Horario de atención:
{STORE_INFO['horarios']}

¿En qué más puedo ayudarte?
"""
    
    # Buscar en FAQs
    for faq in FAQS:
        if any(word in faq['pregunta'].lower() for word in message_lower.split()):
            return f"{faq['respuesta']}\n\n¿Tienes otra pregunta?"
    
    # Respuesta por defecto
    return f"""
¡Hola! 👋 Soy el asistente virtual de Electrohome.

Puedo ayudarte con:
• 📦 Seguimiento de pedidos
• 🔍 Información de productos
• 💳 Métodos de pago y envíos
• 🔄 Devoluciones y garantías
• 📞 Datos de contacto

¿En qué puedo ayudarte hoy?
"""


def handle_order_tracking(message):
    """Maneja consultas sobre seguimiento de pedidos"""
    # Buscar número de pedido en el mensaje
    import re
    order_pattern = r'#?\d{6,10}'
    match = re.search(order_pattern, message)
    
    if match:
        order_number = match.group().replace('#', '')
        try:
            order = Order.objects.get(order_number=order_number)
            status_emoji = {
                'pending': '⏳',
                'confirmed': '✅',
                'processing': '📦',
                'shipped': '🚚',
                'delivered': '🎉',
                'cancelled': '❌'
            }
            
            status_text = {
                'pending': 'Pendiente de confirmación',
                'confirmed': 'Confirmado - En preparación',
                'processing': 'En proceso de alistamiento',
                'shipped': 'Enviado - En camino',
                'delivered': 'Entregado',
                'cancelled': 'Cancelado'
            }
            
            response = f"""
📦 **Estado de tu Pedido #{order.order_number}**

{status_emoji.get(order.status, '📋')} Estado: {status_text.get(order.status, order.status)}

🛍️ Producto: {order.product_name}
📅 Fecha de compra: {order.created_at.strftime('%d/%m/%Y')}
"""
            
            if order.tracking_number:
                response += f"\n🔢 Número de guía: {order.tracking_number}"
            
            if order.estimated_delivery:
                response += f"\n📅 Entrega estimada: {order.estimated_delivery.strftime('%d/%m/%Y')}"
            
            response += "\n\n¿Necesitas ayuda con algo más?"
            
            return response
            
        except Order.DoesNotExist:
            return f"""
❌ No encontré el pedido **#{order_number}**.

Por favor verifica el número de pedido. Lo encuentras en:
• Email de confirmación
• Tu cuenta en la página web

¿Necesitas más ayuda?
"""
    else:
        return """
Para rastrear tu pedido necesito el número de orden. 

📋 ¿Dónde lo encuentro?
• En el email de confirmación
• En tu cuenta de Electrohome

Por favor escribe tu número de pedido (Ej: #123456)
"""


def handle_product_query(message):
    """Maneja consultas sobre productos"""
    message_lower = message.lower()
    
    # Categorías de productos
    categories = {
        'nevera': ['neveras', 'refrigerador', 'nevera', 'frigorifico'],
        'lavadora': ['lavadora', 'lavadoras', 'lavar'],
        'estufa': ['estufa', 'estufas', 'cocina'],
        'microondas': ['microondas', 'micro'],
        'aire': ['aire', 'acondicionado', 'clima'],
        'tv': ['televisor', 'tv', 'television', 'smart tv']
    }
    
    detected_category = None
    for category, keywords in categories.items():
        if any(keyword in message_lower for keyword in keywords):
            detected_category = category
            break
    
    if detected_category:
        # Buscar productos en la base de datos
        products = Product.objects.filter(
            category__icontains=detected_category,
            is_available=True
        )[:3]
        
        if products:
            response = f"🔍 **Productos de {detected_category.title()}:**\n\n"
            for product in products:
                response += f"""
**{product.name}**
💰 Precio: ${product.price:,.0f}
📦 Stock: {'Disponible' if product.stock > 0 else 'Agotado'}
---
"""
            response += "\n¿Quieres más información sobre alguno?"
            return response
    
    return """
🔍 Puedo ayudarte a buscar productos.

Tenemos estas categorías:
• Neveras y refrigeración
• Lavadoras y secadoras
• Estufas y hornos
• Microondas
• Aires acondicionados
• Televisores

¿Qué tipo de producto te interesa?
"""


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