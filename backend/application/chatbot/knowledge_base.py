"""
Base de conocimiento para el chatbot de Electrohome
Contiene información sobre la tienda, políticas y datos de productos
"""

STORE_INFO = {
    "nombre": "Electrohome",
    "tipo": "Tienda virtual de electrodomésticos",
    "horarios": "Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 2:00 PM",
    "telefono": "+57 300 123 4567",
    "email": "contacto@electrohome.com",
    "whatsapp": "+57 300 123 4567"
}

SHIPPING_INFO = {
    "tiempo_entrega": "3-5 días hábiles",
    "costo_envio": {
        "bogota": "Gratis en compras mayores a $200.000",
        "nacional": "$15.000 - $30.000 según la ciudad",
    },
    "cobertura": "Entregamos a todo Colombia",
    "seguimiento": "Recibirás un número de guía una vez despachado tu pedido"
}

PAYMENT_INFO = {
    "metodos": [
        "Tarjeta de crédito (Visa, Mastercard, American Express)",
        "Tarjeta débito",
        "PSE",
        "Efectivo contra entrega (ciudades principales)",
        "Transferencia bancaria"
    ],
    "cuotas": "Hasta 36 cuotas con tarjetas de crédito participantes",
    "descuentos": "10% de descuento pagando con PSE"
}

RETURN_POLICY = {
    "plazo": "30 días desde la recepción del producto",
    "condiciones": [
        "Producto en perfectas condiciones",
        "Empaque original",
        "Todos los accesorios incluidos",
        "Factura de compra"
    ],
    "proceso": "Contacta a nuestro servicio al cliente para iniciar la devolución",
    "reembolso": "5-10 días hábiles una vez recibido el producto"
}

WARRANTY_INFO = {
    "garantia_legal": "Todos los productos tienen garantía legal de 1 año",
    "garantia_extendida": "Disponible al momento de la compra",
    "cubre": [
        "Defectos de fabricación",
        "Fallas en el funcionamiento normal",
        "Piezas y mano de obra"
    ],
    "no_cubre": [
        "Daños por mal uso",
        "Daños por accidentes",
        "Instalación incorrecta"
    ]
}

PRODUCT_CATEGORIES = {
    "refrigeracion": ["Neveras", "Congeladores", "Frigobar", "Exhibidores"],
    "lavado": ["Lavadoras", "Secadoras", "Centros de lavado"],
    "cocina": ["Estufas", "Hornos", "Microondas", "Campanas extractoras"],
    "climatizacion": ["Aires acondicionados", "Ventiladores", "Calefactores"],
    "pequenos": ["Licuadoras", "Batidoras", "Procesadores", "Cafeteras", "Planchas"],
    "television": ["Smart TV", "Televisores", "Barras de sonido"]
}

FAQS = [
    {
        "pregunta": "¿Cómo puedo rastrear mi pedido?",
        "respuesta": "Puedes rastrear tu pedido proporcionándome tu número de pedido. También recibirás un email con el link de seguimiento cuando tu producto sea despachado."
    },
    {
        "pregunta": "¿Cuál es el tiempo de entrega?",
        "respuesta": f"El tiempo de entrega es de {SHIPPING_INFO['tiempo_entrega']}. Para Bogotá, generalmente llega en 2-3 días."
    },
    {
        "pregunta": "¿Hacen instalación de electrodomésticos?",
        "respuesta": "Sí, ofrecemos servicio de instalación para productos como aires acondicionados, lavadoras y estufas. El costo varía según el producto."
    },
    {
        "pregunta": "¿Puedo cambiar o devolver un producto?",
        "respuesta": f"Sí, tienes {RETURN_POLICY['plazo']} para devolver el producto en sus condiciones originales. El producto debe estar sin usar y con todos sus accesorios."
    },
    {
        "pregunta": "¿Qué métodos de pago aceptan?",
        "respuesta": f"Aceptamos: {', '.join(PAYMENT_INFO['metodos'][:3])} y más. También puedes pagar en cuotas con tarjeta de crédito."
    },
    {
        "pregunta": "¿Los productos tienen garantía?",
        "respuesta": f"Sí, todos nuestros productos tienen {WARRANTY_INFO['garantia_legal']}. También ofrecemos garantía extendida opcional."
    },
    {
        "pregunta": "¿Entregan a todo el país?",
        "respuesta": f"{SHIPPING_INFO['cobertura']}. El costo de envío varía según la ciudad."
    },
    {
        "pregunta": "¿Tienen tienda física?",
        "respuesta": "Somos una tienda 100% online, pero puedes contactarnos por WhatsApp, teléfono o email para cualquier consulta."
    }
]

def get_store_context():
    """Retorna el contexto completo de la tienda para el chatbot"""
    return f"""
Eres un asistente virtual de Electrohome, una tienda virtual colombiana especializada en electrodomésticos.

INFORMACIÓN DE LA TIENDA:
- Nombre: {STORE_INFO['nombre']}
- Horarios: {STORE_INFO['horarios']}
- Teléfono: {STORE_INFO['telefono']}
- Email: {STORE_INFO['email']}
- WhatsApp: {STORE_INFO['whatsapp']}

ENVÍOS:
- Tiempo de entrega: {SHIPPING_INFO['tiempo_entrega']}
- Cobertura: {SHIPPING_INFO['cobertura']}
- Costos: Gratis en Bogotá para compras mayores a $200.000, fuera de Bogotá entre $15.000-$30.000

PAGOS:
- Métodos: Tarjetas de crédito/débito, PSE, efectivo contra entrega, transferencia
- Cuotas: Hasta 36 cuotas con tarjetas de crédito
- Descuento especial: 10% pagando con PSE

POLÍTICAS:
- Cambios y devoluciones: 30 días desde la recepción
- Garantía: 1 año de garantía legal en todos los productos
- Reembolsos: 5-10 días hábiles

CATEGORÍAS DE PRODUCTOS:
{', '.join([cat.title() for cat in PRODUCT_CATEGORIES.keys()])}

Tu trabajo es:
1. Responder preguntas sobre productos, pedidos y políticas
2. Ayudar con el seguimiento de pedidos (pidiendo número de pedido)
3. Brindar información sobre disponibilidad y precios
4. Ser amable, profesional y eficiente
5. Si no sabes algo, ofrece contactar a un agente humano

Habla en español de forma natural y amigable. Usa emojis ocasionalmente para ser más cercano.
"""