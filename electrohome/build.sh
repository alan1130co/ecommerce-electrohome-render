#!/usr/bin/env bash
set -o errexit

echo "Instalando dependencias..."
pip install -r electrohome/requirements.txt

echo "Recolectando archivos estáticos..."
python electrohome/manage.py collectstatic --no-input --settings=electrohome.settings.production

echo "Aplicando migraciones..."
python electrohome/manage.py migrate --settings=electrohome.settings.production

echo "Configurando Site domain..."
python electrohome/manage.py shell --settings=electrohome.settings.production -c "
from django.contrib.sites.models import Site
site, _ = Site.objects.get_or_create(id=7)
site.domain = 'ecommerce-electrohome-render.onrender.com'
site.name = 'ElectroHome'
site.save()
print('Site configurado:', site.domain)
"

echo "Build completado exitosamente."