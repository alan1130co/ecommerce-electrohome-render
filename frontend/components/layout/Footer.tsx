export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-900 py-8 text-center text-sm text-gray-400">
      <p className="font-semibold text-white">ElectroHome</p>
      <p className="mt-1">
        La mejor tecnología para tu hogar. Compra fácil, rápido y con total
        seguridad.
      </p>
      <p className="mt-4">
        &copy; {new Date().getFullYear()} ElectroHome. Todos los derechos
        reservados.
      </p>
    </footer>
  );
}
