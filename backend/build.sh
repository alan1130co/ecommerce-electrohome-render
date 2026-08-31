#!/usr/bin/env bash
set -o errexit

echo "Instalando dependencias..."
pip install -r backend/requirements.txt

echo "Recolectando archivos estáticos..."
python backend/manage.py collectstatic --no-input --settings=electrohome.settings.production

echo "Aplicando migraciones..."
python backend/manage.py migrate --settings=electrohome.settings.production

echo "Cargando categorías y subcategorías..."
python backend/manage.py loaddata backend/application/product/fixtures/categorias.json --settings=electrohome.settings.production

echo "Configurando Site domain..."
python backend/manage.py shell --settings=electrohome.settings.production -c "
from django.contrib.sites.models import Site
site, _ = Site.objects.get_or_create(id=7)
site.domain = 'electrohome.site'
site.name = 'ElectroHome'
site.save()
print('Site configurado:', site.domain)
"

echo "Cargando productos..."
echo "Build completado exitosamente."
echo 'Actualizando imagenes en OrderItems...'