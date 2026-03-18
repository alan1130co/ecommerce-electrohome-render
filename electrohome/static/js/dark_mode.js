/* ============================================================
   ELECTROHOME — dark_mode.js v2.0
   Coloca este archivo en: static/js/dark_mode.js
   ============================================================ */

(function () {
  'use strict';

  const THEME_KEY = 'electrohome-theme';

  /* ── 1. Leer tema guardado (o preferencia del sistema) ── */
  function getTheme() {
    return (
      localStorage.getItem(THEME_KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    );
  }

  /* ── 2. Aplicar tema al <html> ── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleButton(theme);
  }

  /* ── 3. Sincronizar el botón sol/luna del header ── */
  function updateToggleButton(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    if (theme === 'dark') {
      btn.classList.add('dark-mode');
    } else {
      btn.classList.remove('dark-mode');
    }
  }

  /* ── 4. Inicializar ── */
  function init() {
    /* Aplicar tema actual (puede que ya esté seteado por el inline script
       del <head>, pero lo confirmamos aquí para asegurarnos). */
    const current = getTheme();
    applyTheme(current);

    /* Conectar el botón de tema del header desktop */
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const next = getTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        /* Sincronizar el toggle del drawer móvil si existe */
        syncDrawerTheme(next);
      });
    }

    /* Sincronizar estado inicial del drawer */
    syncDrawerTheme(current);
  }

  /* ── 5. Sincronizar el pill del drawer lateral ── */
  function syncDrawerTheme(theme) {
    const dark = theme === 'dark';
    const ico  = document.getElementById('mdr-theme-ico');
    const lbl  = document.getElementById('mdr-theme-lbl');
    const pill = document.getElementById('mdr-theme-toggle-pill');
    const dot  = document.getElementById('mdr-theme-pill-dot');

    if (ico)  ico.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    if (lbl)  lbl.textContent = dark ? 'Modo claro' : 'Modo oscuro';
    if (pill) pill.style.background = dark ? '#2563eb' : '#cbd5e0';
    if (dot)  dot.style.transform   = dark ? 'translateX(18px)' : 'translateX(0)';
  }

  /* ── Exponer función globalmente para que los drawers inline puedan llamarla ── */
  window.syncDrawerTheme = syncDrawerTheme;

  /* Ejecutar cuando el DOM esté listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();1