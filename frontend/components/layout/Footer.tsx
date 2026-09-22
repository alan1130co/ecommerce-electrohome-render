export default function Footer() {
  return (
    <footer className="mt-auto bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 py-12 text-gray-200">
      <div className="container mx-auto px-6">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-wide text-white">ElectroHome</h2>
          <p className="mx-auto max-w-md text-sm text-gray-400">
            La mejor tecnología para tu hogar. Compra fácil, rápido y con total seguridad.
          </p>
        </div>

        <div className="mb-10 flex justify-center space-x-8">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="transition hover:scale-110">
            <i className="fab fa-facebook-f text-2xl text-blue-500 hover:text-blue-400" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="transition hover:scale-110">
            <i className="fab fa-instagram text-2xl text-pink-500 hover:text-pink-400" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="transition hover:scale-110">
            <i className="fab fa-tiktok text-2xl text-white hover:text-gray-300" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="transition hover:scale-110">
            <i className="fab fa-x-twitter text-2xl text-gray-200 hover:text-white" />
          </a>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm">
          <a href="/" className="transition hover:text-white">Inicio</a>
          <a href="/productos" className="transition hover:text-white">Productos</a>
          <a href="/productos" className="transition hover:text-white">Ofertas</a>
          <a href="/contacto" className="transition hover:text-white">Nosotros</a>
          <a href="/contacto" className="transition hover:text-white">Contacto</a>
        </div>

        <div className="mb-8 text-center text-sm text-gray-400">
          <p>📍 Calle 1 #2-40, Cartagena de Indias, Colombia</p>
          <p>📞 +57 300 760 7645</p>
          <p>
            ✉️{" "}
            <a href="mailto:info@electrohome.com" className="underline hover:text-blue-400">
              info@electrohome.com
            </a>
          </p>
        </div>

        <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} <span className="font-semibold text-white">ElectroHome</span>. Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
}
