from django.core.management.base import BaseCommand
from application.order.models import OrderItem

class Command(BaseCommand):
    help = 'Actualiza imagenes faltantes en OrderItems'

    def handle(self, *args, **kwargs):
        items = OrderItem.objects.filter(product_image__isnull=True)
        actualizados = 0
        for item in items:
            if item.product and item.product.imagen_principal:
                item.product_image = str(item.product.imagen_principal)
                item.save()
                actualizados += 1
        self.stdout.write(f'Actualizados: {actualizados}')
