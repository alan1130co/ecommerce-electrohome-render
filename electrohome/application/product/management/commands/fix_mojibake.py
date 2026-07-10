from django.core.management.base import BaseCommand
from django.db import transaction

from application.product.models import (
    Producto, Categoria, BannerPromocion, SeccionPromocional,
)

# Detecta texto guardado en Windows-1252 (cp1252) que se leyo por error como
# CP437 (codepage clasica de consola de Windows) y lo revierte.
#
# INDICATORS = los 128 caracteres que puede producir CP437 en el rango alto
# (0x80-0xFF), EXCEPTO los que son simbolos legitimos en espanol (letras
# acentuadas, ¿, ¡, °, ª, º, ², ³). Si un texto contiene alguno de estos
# indicadores, se asume que esta corrupto y se revierte la cadena COMPLETA
# (encode cp437 / decode cp1252) — esto es seguro porque, en este dataset,
# un texto o esta totalmente corrupto o esta totalmente limpio (nunca
# mezclado), y probado explicitamente a ser idempotente: aplicar el fix
# sobre texto ya corregido no le vuelve a hacer nada (ver tests en el PR).
#
# Limitacion conocida: si un texto YA CORRECTO contiene legitimamente el
# simbolo '±' (ej. una tolerancia "±5%"), se marcaria como corrupto por
# error. Por eso este comando SIEMPRE corre en dry-run primero — revisa los
# ejemplos de antes/despues antes de usar --apply.
CP437_CHARS = bytes(range(0x80, 0x100)).decode('cp437')
SPANISH_SAFE = set('áéíóúÁÉÍÓÚñÑüÜ¿¡ª°º²³')
INDICATORS = set(c for c in CP437_CHARS if c not in SPANISH_SAFE)


def fix_mojibake(text):
    if not text or not isinstance(text, str):
        return text
    if not any(c in INDICATORS for c in text):
        return text
    try:
        return text.encode('cp437').decode('cp1252')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


MODEL_FIELDS = {
    Producto: ['nombre', 'descripcion', 'caracteristicas_destacadas', 'marca', 'capacidad', 'color', 'potencia'],
    Categoria: ['nombre', 'descripcion'],
    BannerPromocion: ['titulo', 'subtitulo', 'texto_boton'],
    SeccionPromocional: ['nombre', 'subtitulo'],
}


class Command(BaseCommand):
    help = (
        "Corrige texto en espanol corrupto (mojibake cp1252 leido como cp437), "
        "ej. 'S≤lidos' -> 'Sólidos'. Por defecto corre en modo dry-run "
        "(solo muestra lo que cambiaria). Usa --apply para guardar los cambios."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='Guarda los cambios en la base de datos. Sin esta bandera solo se simula.',
        )
        parser.add_argument(
            '--examples', type=int, default=5,
            help='Cuantos ejemplos de antes/despues mostrar por modelo (default: 5).',
        )

    def handle(self, *args, **options):
        apply_changes = options['apply']
        n_examples = options['examples']

        if not apply_changes:
            self.stdout.write(self.style.WARNING(
                "MODO DRY-RUN: no se va a guardar nada. Usa --apply cuando estes listo.\n"
                "Recomendado: haz un backup de la base de datos antes de correr con --apply."
            ))

        total_changed = 0

        with transaction.atomic():
            for model, fields in MODEL_FIELDS.items():
                changed = 0
                shown = 0
                for obj in model.objects.all():
                    dirty_fields = {}
                    for field in fields:
                        original = getattr(obj, field, None)
                        fixed = fix_mojibake(original)
                        if fixed != original:
                            dirty_fields[field] = (original, fixed)

                    if not dirty_fields:
                        continue

                    changed += 1
                    if shown < n_examples:
                        for field, (before, after) in dirty_fields.items():
                            self.stdout.write(f"  [{model.__name__} pk={obj.pk}] {field}:")
                            self.stdout.write(f"    antes:   {before!r}")
                            self.stdout.write(f"    despues: {after!r}")
                        shown += 1

                    if apply_changes:
                        for field, (_, after) in dirty_fields.items():
                            setattr(obj, field, after)
                        obj.save(update_fields=list(dirty_fields.keys()))

                self.stdout.write(self.style.SUCCESS(
                    f"{model.__name__}: {changed} objeto(s) con texto corregido de {model.objects.count()} total"
                ))
                total_changed += changed

            if not apply_changes:
                # Deshace cualquier cambio accidental (no deberia haber ninguno en dry-run)
                transaction.set_rollback(True)

        if apply_changes:
            self.stdout.write(self.style.SUCCESS(f"\nListo. {total_changed} objeto(s) actualizados en total."))
        else:
            self.stdout.write(self.style.WARNING(
                f"\nDry-run terminado. {total_changed} objeto(s) se actualizarian con --apply."
            ))
