// Tipos que reflejan exactamente los serializers de application/product/serializers.py
// (Django REST Framework). Mantener sincronizados si cambian los serializers.

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  parent: number | null;
  subcategorias: Categoria[];
  es_subcategoria: boolean;
  es_categoria_padre: boolean;
}

export interface PromocionActiva {
  id: number;
  descuento_porcentaje: string;
  precio_promocional: string | null;
  etiqueta: string;
  fecha_inicio: string;
  fecha_fin: string;
  vigente: boolean;
}

export interface ProductoResumen {
  id: number;
  nombre: string;
  precio: string;
  stock: number;
  disponible: boolean;
  imagen_principal: string | null;
  marca: string | null;
  categoria_id: number;
  categoria_nombre: string;
  promocion_activa: PromocionActiva | null;
  fecha_creacion: string;
}

export interface ImagenProducto {
  id: number;
  imagen: string;
  descripcion: string;
  orden: number;
}

export interface ProductoDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: number;
  disponible: boolean;
  categoria: Categoria;
  imagen_principal: string | null;
  galeria: ImagenProducto[];
  marca: string | null;
  capacidad: string | null;
  potencia: string | null;
  color: string | null;
  caracteristicas_destacadas: string | null;
  caracteristicas_lista: string[];
  garantia_meses: number | null;
  fecha_creacion: string;
  promocion_activa: PromocionActiva | null;
}

export interface Banner {
  id: number;
  titulo: string;
  subtitulo: string;
  imagen: string;
  url_destino: string;
  texto_boton: string;
  color_boton: string;
  orden: number;
}

export interface ProductoSeccionItem {
  id: number;
  producto: ProductoResumen;
  descuento_porcentaje: string;
  precio_promocional: string | null;
  orden: number;
  destacado: boolean;
  ahorro: number;
}

export interface SeccionPromocional {
  id: number;
  nombre: string;
  slug: string;
  subtitulo: string;
  icono: string;
  color_acento: string;
  orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  mostrar_timer: boolean;
  url_ver_todo: string;
  vigente: boolean;
  productos_seccion: ProductoSeccionItem[];
}

export interface HomeData {
  ofertas_especiales: ProductoResumen[];
  secciones_vigentes: SeccionPromocional[];
  recomendados: ProductoResumen[];
  mas_vendidos: ProductoResumen[];
  mas_vistos: ProductoResumen[];
  nuevos: ProductoResumen[];
  productos_cocina: ProductoResumen[];
  productos_limpieza: ProductoResumen[];
  categorias: Categoria[];
  banners: Banner[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SearchResults {
  query: string;
  total_results: number;
  productos: ProductoResumen[];
  sugerencias: ProductoResumen[];
}

export interface CartItemData {
  id: number;
  producto: ProductoResumen;
  quantity: number;
  subtotal: string;
}

export interface CartSummary {
  total_items: number;
  subtotal: string;
  tax: string;
  total: string;
  items: CartItemData[];
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  tipo_usuario: string;
}

export interface OrderItemData {
  id: number;
  product_name: string;
  product_price: string;
  quantity: number;
  product_image: string | null;
  subtotal: string;
}

export interface Order {
  id: number;
  order_number: string;
  email: string;
  phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_postal_code: string;
  payment_method: string;
  payment_method_display: string;
  payment_status: string;
  subtotal: string;
  tax: string;
  shipping_cost: string;
  total: string;
  status: string;
  status_display: string;
  notes: string;
  created_at: string;
  items: OrderItemData[];
}

export interface UserProfile extends User {
  telefono: string;
  ciudad: string;
  direccion: string;
  total_orders: number;
  total_spent: string;
  fecha_registro: string;
}

export interface WishlistItemData {
  id: number;
  producto: ProductoResumen;
  added_at: string;
}

export interface WishlistSummary {
  total_items: number;
  items: WishlistItemData[];
}

export interface Resena {
  id: number;
  calificacion: number;
  titulo: string;
  comentario: string;
  foto: string | null;
  estado: string;
  creado_en: string;
  usuario_nombre: string;
}

export interface PuedeResenarStatus {
  autenticado: boolean;
  puede_resenar: boolean;
  ya_reseno: boolean;
}
