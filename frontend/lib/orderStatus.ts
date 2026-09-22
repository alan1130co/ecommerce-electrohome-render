// Colores por estado — refleja Order.STATUS_CHOICES en application/order/models.py
export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
}

export const STATUS_ICONS: Record<string, string> = {
  pending: "fa-clock",
  processing: "fa-cog",
  shipped: "fa-truck",
  delivered: "fa-check-circle",
  cancelled: "fa-times-circle",
};

export function statusIcon(status: string): string {
  return STATUS_ICONS[status] ?? "fa-circle";
}

// hour12:false + reemplazo de la coma — Intl.DateTimeFormat con es-CO siempre
// antepone una coma antes de la hora ("05/09/2026, 18:46"), pero producción
// (formato Django) la muestra sin coma: "05/09/2026 18:46".
export const formatFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(", ", " ");

export const formatFechaCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));

// Para campos DateField puros (sin hora, ej. Promocion.fecha_inicio/fin):
// NO pasar por `new Date(iso)` — un string "YYYY-MM-DD" se interpreta como
// medianoche UTC, y en una zona horaria detrás de UTC (America/Bogota)
// Intl lo muestra como el día anterior. Al no tener componente de hora, el
// valor no necesita (ni debe) convertirse de zona horaria.
export const formatFechaSolo = (fecha: string) => {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
};

const MESES_ABREV = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Espeja el filtro Django "d M Y, H:i" (ej: "26 Mar 2026, 15:15") usado en
// las tarjetas de moderación de reseñas.
export const formatFechaLarga = (iso: string) => {
  const fecha = new Date(iso);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const hora = String(fecha.getHours()).padStart(2, "0");
  const min = String(fecha.getMinutes()).padStart(2, "0");
  return `${dia} ${MESES_ABREV[fecha.getMonth()]} ${fecha.getFullYear()}, ${hora}:${min}`;
};

export const formatPrecio = (precio: string | number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(precio));
