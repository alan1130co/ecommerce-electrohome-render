from django import template

register = template.Library()

@register.filter(name='formato_precio')
def formato_precio(valor):
    """
    Formatea un número como precio colombiano con separador de miles
    Ejemplo: 95000 -> $95.000
    """
    try:
        # Convertir a número si es string
        if isinstance(valor, str):
            valor = float(valor.replace(',', ''))
        
        # Convertir a entero (sin decimales)
        valor = int(float(valor))
        
        # Formatear con separador de miles (punto)
        precio_formateado = f"{valor:,}".replace(',', '.')
        
        return f"${precio_formateado}"
    except (ValueError, TypeError):
        return valor


@register.filter(name='formato_numero')
def formato_numero(valor):
    """
    Formatea un número con separador de miles (sin símbolo $)
    Ejemplo: 95000 -> 95.000
    """
    try:
        if isinstance(valor, str):
            valor = float(valor.replace(',', ''))
        
        valor = int(float(valor))
        return f"{valor:,}".replace(',', 'z')
    except (ValueError, TypeError):
        return valor
    
@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)


@register.filter(name='cld_optimize')
def cld_optimize(url, width=400):
    """
    Inserta transformaciones de Cloudinary (f_auto,q_auto,w_<ancho>) en una
    URL de imagen para servir el formato y peso óptimos según el navegador.
    Si la URL no es de Cloudinary (ej. imágenes externas o de prueba),
    se devuelve sin modificar.
    """
    if not url or 'res.cloudinary.com' not in url or '/upload/' not in url:
        return url

    try:
        width = int(width)
    except (TypeError, ValueError):
        width = 400

    marker = '/upload/'
    idx = url.index(marker) + len(marker)
    return f"{url[:idx]}f_auto,q_auto,w_{width}/{url[idx:]}"