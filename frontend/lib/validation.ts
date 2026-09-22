// Validación de campos en tiempo real (mientras el usuario escribe).
// Espeja las reglas que ya aplica el backend (application/user/forms.py
// clean_first_name/clean_last_name/clean_telefono) para dar feedback
// inmediato, pero el backend sigue siendo la fuente de verdad al enviar.

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
const SOLO_DIGITOS = /^\d*$/;
const EMAIL_FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function nombreError(value: string): string | null {
  if (!value) return null;
  if (!SOLO_LETRAS.test(value)) return "Solo se permiten letras y espacios";
  return null;
}

export function telefonoError(value: string): string | null {
  if (!value) return null;
  if (!SOLO_DIGITOS.test(value)) return "Solo se permiten números";
  if (value.length > 10) return "Máximo 10 dígitos";
  return null;
}

export function emailFormatError(value: string): string | null {
  if (!value) return null;
  if (!EMAIL_FORMATO.test(value)) return "Ingresa un correo electrónico válido (ej: nombre@dominio.com)";
  return null;
}
