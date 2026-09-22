import Link from "next/link";

import CatalogProductCard from "@/components/product/CatalogProductCard";
import CategoriaCard from "@/components/product/CategoriaCard";
import OfertasTimerBar from "@/components/product/OfertasTimerBar";
import SeccionPromocionalBlock from "@/components/product/SeccionPromocionalBlock";
import { apiGet } from "@/lib/api";
import type { HomeData, ProductoResumen } from "@/lib/types";

export default async function Home() {
  const data = await apiGet<HomeData>("/api/home/");

  // Igual que en Categoria.objects.filter(activo=True) de la vista de
  // Django: /api/home/ trae categorías padre e hijas mezcladas. Para el
  // grid de "explora por categoría" solo mostramos las padre.
  const categoriasPadre = data.categorias.filter((c) => c.parent === null);

  return (
    <main>
      <section id="video-banner-section" className="relative w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/video_banner_principal.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </section>

      {categoriasPadre.length > 0 && (
        <section className="categories-section">
          <div className="container mx-auto px-4">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div className="section-title-wrap">
                <div className="section-accent-bar" />
                <div>
                  <div className="section-title">Categorías</div>
                  <div className="section-subtitle">Explora lo que necesitas</div>
                </div>
              </div>
              <Link href="/productos" className="section-link">
                Ver todo <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
              </Link>
            </div>
            <div className="categories-strip">
              {categoriasPadre.map((categoria) => (
                <CategoriaCard key={categoria.id} categoria={categoria} />
              ))}
            </div>
          </div>
        </section>
      )}

      <OfertasTimerBar />

      <GridSection
        id="promociones"
        titulo="🔥 Ofertas especiales"
        subtitulo="Los mejores precios, solo por hoy"
        verTodoHref="/productos"
        verTodoTexto="Ver todas las ofertas"
        accentClass="red"
        productos={data.ofertas_especiales}
      />

      {data.secciones_vigentes.map((seccion) => (
        <SeccionPromocionalBlock key={seccion.id} seccion={seccion} />
      ))}

      <section className="promo-banner-section">
        <div className="container mx-auto px-4">
          <div className="promo-banner-inner">
            <div className="promo-banner-text">
              <div className="eyebrow">
                <i className="fas fa-fire" style={{ fontSize: "0.7rem" }} /> Ofertas exclusivas
              </div>
              <h2>
                Hasta <span>50% OFF</span>
                <br />
                en electrodomésticos
              </h2>
              <p>
                Aprovecha los mejores descuentos de la temporada.
                <br />
                Precios imbatibles en toda Colombia.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-end" }}>
              <div className="promo-cards-group">
                <div className="promo-mini-card">
                  <span className="promo-mini-card-pct">20%</span>
                  <div className="promo-mini-card-label">Cocina</div>
                </div>
                <div className="promo-mini-card">
                  <span className="promo-mini-card-pct">35%</span>
                  <div className="promo-mini-card-label">Audio</div>
                </div>
                <div className="promo-mini-card">
                  <span className="promo-mini-card-pct">50%</span>
                  <div className="promo-mini-card-label">Gaming</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/productos" className="btn-promo-cta">
                  <i className="fas fa-shopping-bag" /> Comprar ahora
                </Link>
                <a href="#promociones" className="btn-promo-secondary">
                  Ver ofertas <i className="fas fa-arrow-down" style={{ fontSize: "0.78rem" }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CarouselSection
        titulo="⭐ Recomendados para ti"
        subtitulo="Desliza para descubrir más productos"
        verTodoTexto="Ver catálogo"
        accentClass="yellow"
        productos={data.recomendados}
      />

      <CarouselSection
        titulo="🏆 Más vendidos"
        subtitulo="Los favoritos de nuestros clientes"
        verTodoTexto="Ver catálogo"
        accentClass="red"
        productos={data.mas_vendidos}
      />

      <CarouselSection
        titulo="👁️ Más vistos"
        subtitulo="Los productos que más llaman la atención"
        verTodoTexto="Ver catálogo"
        accentClass="purple"
        productos={data.mas_vistos}
      />

      <CarouselSection
        titulo="✨ Recién llegados"
        subtitulo="Lo último en nuestro catálogo"
        verTodoTexto="Ver catálogo"
        accentClass=""
        productos={data.nuevos}
      />

      <div className="trust-section">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-2 text-3xl font-extrabold" style={{ color: "var(--accent-blue)" }}>
              ¿Por qué elegirnos?
            </h2>
            <p className="text-base" style={{ color: "var(--text-secondary)" }}>
              Comprometidos con tu satisfacción en cada compra
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <div className="trust-card">
              <div className="trust-icon" style={{ background: "rgba(37,99,235,0.1)" }}>🚚</div>
              <div className="trust-title">Envío rápido</div>
              <div className="trust-desc">Recibe tu pedido en 24 a 48 horas en toda Colombia</div>
            </div>
            <div className="trust-card">
              <div className="trust-icon" style={{ background: "rgba(16,185,129,0.1)" }}>🔒</div>
              <div className="trust-title">Pago 100% seguro</div>
              <div className="trust-desc">Tus datos siempre protegidos con tecnología SSL</div>
            </div>
            <div className="trust-card">
              <div className="trust-icon" style={{ background: "rgba(245,158,11,0.1)" }}>↩️</div>
              <div className="trust-title">Devoluciones</div>
              <div className="trust-desc">30 días para cambios y devoluciones sin complicaciones</div>
            </div>
            <div className="trust-card">
              <div className="trust-icon" style={{ background: "rgba(139,92,246,0.1)" }}>🎧</div>
              <div className="trust-title">Soporte 24/7</div>
              <div className="trust-desc">Siempre disponibles para resolver tus preguntas</div>
            </div>
          </div>
        </div>
      </div>

      <section style={{ background: "var(--bg-card)", padding: "80px 0", borderTop: "1px solid var(--border-color)" }}>
        <div className="container mx-auto px-4">
          <div className="mb-14 text-center">
            <span className="about-badge">
              <i className="fas fa-info-circle" /> Sobre nosotros
            </span>
            <h2 className="mb-4 text-5xl font-extrabold" style={{ color: "var(--text-primary)" }}>
              ¿Qué es <span style={{ color: "#2563eb" }}>Electro</span>
              <span style={{ color: "#f59e0b" }}>Home</span>?
            </h2>
            <p className="mx-auto max-w-3xl text-lg" style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>
              <strong style={{ color: "var(--text-primary)" }}>ElectroHome</strong> es tu tienda virtual de
              electrodomésticos en Colombia. Nacimos con una misión clara: llevarte los mejores productos para tu
              hogar con la comodidad de comprar desde donde estés, con precios justos, garantía real y atención de
              primera.
            </p>
          </div>
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <SobreCard icono="🏪" gradiente="linear-gradient(135deg,#dbeafe,#bfdbfe)" titulo="Tu tienda de electrodomésticos">
              Contamos con un catálogo amplio de electrodomésticos para cocina, limpieza, audio y más. Productos
              seleccionados de marcas reconocidas con garantía y al mejor precio del mercado.
            </SobreCard>
            <SobreCard icono="⚡" gradiente="linear-gradient(135deg,#fef3c7,#fde68a)" titulo="Compra fácil y rápida">
              Diseñamos una experiencia de compra simple e intuitiva. Busca, agrega al carrito, paga con seguridad y
              recibe en tu puerta. Sin complicaciones, sin filas, sin perder tiempo.
            </SobreCard>
            <SobreCard icono="🤝" gradiente="linear-gradient(135deg,#d1fae5,#a7f3d0)" titulo="Atención y confianza">
              Somos una tienda comprometida con el cliente. Te acompañamos desde que buscas el producto hasta que lo
              tienes en casa, con soporte real, devoluciones y total transparencia.
            </SobreCard>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            <Stat valor="500+" color="#2563eb" label="Productos disponibles" />
            <Stat valor="10k+" color="#f59e0b" label="Clientes satisfechos" />
            <Stat valor="48h" color="#10b981" label="Tiempo de entrega" />
            <Stat valor="4.9★" color="#8b5cf6" label="Calificación promedio" />
          </div>
        </div>
      </section>
    </main>
  );
}

function GridSection({
  id,
  titulo,
  subtitulo,
  verTodoHref,
  verTodoTexto,
  accentClass,
  productos,
}: {
  id?: string;
  titulo: string;
  subtitulo: string;
  verTodoHref: string;
  verTodoTexto: string;
  accentClass: string;
  productos: ProductoResumen[];
}) {
  if (productos.length === 0) return null;

  return (
    <section id={id} className="section-white py-16">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className={`section-accent-bar ${accentClass}`} />
            <div>
              <div className="section-title">{titulo}</div>
              <div className="section-subtitle">{subtitulo}</div>
            </div>
          </div>
          <Link href={verTodoHref} className="section-link">
            {verTodoTexto} <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <CatalogProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CarouselSection({
  titulo,
  subtitulo,
  verTodoTexto,
  accentClass,
  productos,
}: {
  titulo: string;
  subtitulo: string;
  verTodoTexto: string;
  accentClass: string;
  productos: ProductoResumen[];
}) {
  if (productos.length === 0) return null;

  return (
    <section className="section-white py-16">
      <div className="container mx-auto px-4">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className={`section-accent-bar ${accentClass}`} />
            <div>
              <div className="section-title">{titulo}</div>
              <div className="section-subtitle">{subtitulo}</div>
            </div>
          </div>
          <Link href="/productos" className="section-link">
            {verTodoTexto} <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
          </Link>
        </div>
        <div className="carousel-strip">
          {productos.slice(0, 6).map((producto) => (
            <CatalogProductCard key={producto.id} producto={producto} variant="carousel" />
          ))}
        </div>
      </div>
    </section>
  );
}

function SobreCard({
  icono,
  gradiente,
  titulo,
  children,
}: {
  icono: string;
  gradiente: string;
  titulo: string;
  children: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1.5px solid var(--border-color)",
        borderRadius: 20,
        padding: "32px 28px",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          background: gradiente,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          marginBottom: 20,
        }}
      >
        {icono}
      </div>
      <h3 className="mb-2.5 text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
        {titulo}
      </h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
        {children}
      </p>
    </div>
  );
}

function Stat({ valor, color, label }: { valor: string; color: string; label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "24px 16px",
        borderRadius: 16,
        background: "var(--bg-card)",
        border: "1.5px solid var(--border-color)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div style={{ fontSize: "2.2rem", fontWeight: 900, color, lineHeight: 1 }}>{valor}</div>
      <div
        style={{
          fontSize: "0.82rem",
          color: "var(--text-secondary)",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}
