// Tipos que reflejan application/dashboard/serializers.py y las formas de
// respuesta armadas a mano en application/dashboard/api_views.py. Separado
// de lib/types.ts (que documenta product/order/user) porque estos solo
// existen para el panel /dashboard.

import type { Order, ProductoResumen } from "./types";

export interface AdminMe {
  is_admin: boolean;
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  tipo_usuario?: string;
  is_staff?: boolean;
  detail?: string;
}

/** Sobre de paginación de _paginate() en dashboard/api_views.py — distinto
 * del PaginatedResponse de DRF (lib/types.ts) que usa el resto del sitio. */
export interface AdminPage<T> {
  results: T[];
  count: number;
  num_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DashboardStats {
  total_productos: number;
  total_pedidos: number;
  total_clientes: number;
  total_categorias: number;
  total_ventas: number;
  ingresos_totales: number;
  conversion: number;
  total_vistas: number;
  resenas_pendientes: number;
  top_productos: { product__nombre: string; total: number }[];
  top_vistos: { product__nombre: string; total: number }[];
  ventas_por_dia: { dia: string; total: number }[];
  ventas_hoy: { hora: string; total: number; count: number }[];
  dias_semana_actual: { dia: string; total: number; count: number }[];
}

export interface OrderAdmin extends Order {
  user_email: string | null;
  user_nombre: string;
}

export interface ProductoAdmin extends ProductoResumen {
  activo: boolean;
}

export interface CategoriaAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  parent: number | null;
  activo: boolean;
  fecha_creacion: string;
  total_productos: number;
  es_subcategoria: boolean;
  es_categoria_padre: boolean;
}

export interface PromocionAdmin {
  id: number;
  producto: number;
  producto_nombre: string;
  producto_precio: string;
  producto_imagen: string | null;
  descuento_porcentaje: string;
  precio_promocional: string | null;
  etiqueta: string;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  vigente: boolean;
  created_at: string;
}

export interface BannerAdmin {
  id: number;
  titulo: string;
  subtitulo: string;
  imagen: string;
  url_destino: string;
  texto_boton: string;
  color_boton: string;
  orden: number;
  activo: boolean;
}

export interface ResenaAdmin {
  id: number;
  calificacion: number;
  titulo: string;
  comentario: string;
  foto: string | null;
  estado: string;
  creado_en: string;
  usuario_nombre: string;
  motivo_rechazo: string;
  revisado_en: string | null;
  producto: number;
  producto_nombre: string;
  usuario_email: string;
  usuario_first_name: string;
  usuario_last_name: string;
}

export interface UsuarioAdmin {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  telefono: string;
  ciudad: string;
  fecha_registro: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  tipo_usuario: string;
  total_orders: number;
  last_login: string | null;
}

export interface UsuariosListResponse {
  clientes: AdminPage<UsuarioAdmin>;
  admins: UsuarioAdmin[];
  total_admins: number;
}
