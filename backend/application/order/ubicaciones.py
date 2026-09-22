import json
from functools import lru_cache
from pathlib import Path

# Dataset vendorizado de marcovega/colombia-json (32 departamentos, 1104
# municipios, basado en DIVIPOLA). Es dato de referencia casi estático —
# se carga una sola vez por proceso en vez de leer el archivo en cada request.
DATA_PATH = Path(__file__).resolve().parent / "data" / "colombia_ubicaciones.json"


@lru_cache(maxsize=1)
def _get_data():
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def get_departamentos():
    return sorted(d["departamento"] for d in _get_data())


def get_ciudades(departamento):
    """Devuelve las ciudades del departamento (case-insensitive) o None si
    el departamento no existe en el dataset."""
    departamento_lower = departamento.strip().lower()
    for d in _get_data():
        if d["departamento"].strip().lower() == departamento_lower:
            return sorted(d["ciudades"])
    return None
