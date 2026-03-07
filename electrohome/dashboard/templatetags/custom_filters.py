from django import template

register = template.Library()

@register.filter
def formato_precio(value):
    try:
        value = float(value)
        formatted = f"{value:,.0f}".replace(",", ".")
        return f"$ {formatted}"
    except (ValueError, TypeError):
        return value
