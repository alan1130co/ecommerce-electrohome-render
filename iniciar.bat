@echo off
cd /d C:\Users\alanc\ecommerce-electrohome
call venv\Scripts\activate
set DJANGO_SETTINGS_MODULE=electrohome.settings.local
cd electrohome
python manage.py runserver
pause