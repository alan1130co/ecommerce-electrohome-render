"""
Script para cargar datos de prueba en la base de datos
Ejecutar con: python manage.py shell < chatbot/load_sample_data.py
"""

from django.contrib.auth.models import User
from chatbot.models import Product, Order, FAQ
from datetime import datetime, timedelta
from decimal import Decimal

print("Cargando datos de prueba...")

# Crear usuario de prueba si no existe
user, created = User.objects.get_or_create(
    username='cliente_test',
    defaults={
        'email': 'cliente@test.com',
        'first_name': 'Cliente',
        'last_name': 'Prueba'
    }
)
if created:
    user.set_password('password123')
    user.save()
    print(f"✅ Usuario creado: {user.username}")

# Crear productos de muestra
products_data = [
    {
        'name': 'Nevera Samsung No Frost 420L',
        'category': 'Refrigeración',
        'brand': 'Samsung',
        'price': Decimal('2499000'),
        'description': 'Nevera con tecnología No Frost, dispensador de agua, 420 litros de capacidad.',
        'specifications': {
            'capacidad': '420L',
            'tipo': 'No Frost',
            'color': 'Plateado',
            'dimensiones': '180x70x70 cm',
            'consumo': 'Clase A+'
        },
        'stock': 15,
        'is_available': True
    },
    {
        'name': 'Lavadora LG 18Kg Carga Frontal',
        'category': 'Lavado',
        'brand': 'LG',
        'price': Decimal('1899000'),
        'description': 'Lavadora de carga frontal con tecnología TurboWash, 18kg de capacidad.',
        'specifications': {
            'capacidad': '18kg',
            'tipo': 'Carga Frontal',
            'velocidad': '1400 RPM',
            'color': 'Blanco',
            'programas': 14
        },
        'stock': 8,
        'is_available': True
    },
    {
        'name': 'Estufa Haceb 4 Puestos',
        'category': 'Cocina',
        'brand': 'Haceb',
        'price': Decimal('899000'),
        'description': 'Estufa a gas con 4 puestos, horno con grill, encendido eléctrico.',
        'specifications': {
            'puestos': 4,
            'tipo': 'Gas',
            'horno': 'Sí',
            'grill': 'Sí',
            'color': 'Gris'
        },
        'stock': 12,
        'is_available': True
    },
    {
        'name': 'Microondas Panasonic 1.2 Cu.Ft',
        'category': 'Pequeños',
        'brand': 'Panasonic',
        'price': Decimal('499000'),
        'description': 'Microondas digital con grill, 1.2 pies cúbicos, 1200W de potencia.',
        'specifications': {
            'capacidad': '1.2 cu.ft',
            'potencia': '1200W',
            'tipo': 'Digital',
            'grill': 'Sí',
            'color': 'Negro'
        },
        'stock': 20,
        'is_available': True
    },
    {
        'name': 'Aire Acondicionado LG 12000 BTU',
        'category': 'Climatización',
        'brand': 'LG',
        'price': Decimal('1599000'),
        'description': 'Aire acondicionado split inverter, 12000 BTU, bajo consumo energético.',
        'specifications': {
            'capacidad': '12000 BTU',
            'tipo': 'Split Inverter',
            'eficiencia': 'A+++',
            'ruido': '19 dB',
            'color': 'Blanco'
        },
        'stock': 6,
        'is_available': True
    },
    {
        'name': 'Smart TV Samsung 55" 4K',
        'category': 'Televisión',
        'brand': 'Samsung',
        'price': Decimal('2299000'),
        'description': 'Smart TV 55 pulgadas, resolución 4K UHD, sistema operativo Tizen.',
        'specifications': {
            'tamaño': '55 pulgadas',
            'resolución': '4K UHD',
            'smart_tv': 'Sí',
            'sistema': 'Tizen',
            'hdmi': 3
        },
        'stock': 10,
        'is_available': True
    }
]

for product_data in products_data:
    product, created = Product.objects.get_or_create(
        name=product_data['name'],
        defaults=product_data
    )
    if created:
        print(f"✅ Producto creado: {product.name}")

# Crear pedidos de muestra
orders_data = [
    {
        'order_number': '100001',
        'user': user,
        'status': 'shipped',
        'product_name': 'Nevera Samsung No Frost 420L',
        'product_quantity': 1,
        'total_amount': Decimal('2499000'),
        'shipping_address': 'Calle 100 #15-20, Bogotá',
        'tracking_number': 'COORD12345',
        'estimated_delivery': datetime.now().date() + timedelta(days=2)
    },
    {
        'order_number': '100002',
        'user': user,
        'status': 'processing',
        'product_name': 'Lavadora LG 18Kg',
        'product_quantity': 1,
        'total_amount': Decimal('1899000'),
        'shipping_address': 'Carrera 50 #80-30, Medellín',
        'tracking_number': None,
        'estimated_delivery': datetime.now().date() + timedelta(days=4)
    },
    {
        'order_number': '100003',
        'user': user,
        'status': 'delivered',
        'product_name': 'Microondas Panasonic',
        'product_quantity': 2,
        'total_amount': Decimal('998000'),
        'shipping_address': 'Avenida 68 #25-10, Bogotá',
        'tracking_number': 'COORD67890',
        'estimated_delivery': datetime.now().date() - timedelta(days=3)
    }
]

for order_data in orders_data:
    order, created = Order.objects.get_or_create(
        order_number=order_data['order_number'],
        defaults=order_data
    )
    if created:
        print(f"✅ Pedido creado: #{order.order_number}")

# Crear FAQs
faqs_data = [
    {
        'question': '¿Cuánto tiempo demora el envío?',
        'answer': 'El tiempo de entrega es de 3-5 días hábiles. Para Bogotá generalmente llega en 2-3 días.',
        'category': 'Envíos'
    },
    {
        'question': '¿Hacen instalación de electrodomésticos?',
        'answer': 'Sí, ofrecemos servicio de instalación para aires acondicionados, lavadoras y estufas. El costo varía según el producto.',
        'category': 'Instalación'
    },
    {
        'question': '¿Qué métodos de pago aceptan?',
        'answer': 'Aceptamos tarjetas de crédito, débito, PSE, efectivo contra entrega y transferencia bancaria.',
        'category': 'Pagos'
    },
    {
        'question': '¿Tienen garantía los productos?',
        'answer': 'Todos nuestros productos tienen 1 año de garantía legal. También ofrecemos garantía extendida opcional.',
        'category': 'Garantía'
    },
    {
        'question': '¿Puedo cambiar un producto?',
        'answer': 'Sí, tienes 30 días para devolver el producto en sus condiciones originales. Debe estar sin usar y con todos sus accesorios.',
        'category': 'Devoluciones'
    }
]

for faq_data in faqs_data:
    faq, created = FAQ.objects.get_or_create(
        question=faq_data['question'],
        defaults=faq_data
    )
    if created:
        print(f"✅ FAQ creada: {faq.question}")

print("\n🎉 ¡Datos de prueba cargados exitosamente!")
print(f"📊 Productos: {Product.objects.count()}")
print(f"📦 Pedidos: {Order.objects.count()}")
print(f"❓ FAQs: {FAQ.objects.count()}")