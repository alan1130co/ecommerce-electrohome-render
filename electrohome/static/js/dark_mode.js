(function () {
  const KEY = 'electrohome-theme';

  function getTheme() {
    return localStorage.getItem(KEY) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.classList.toggle('dark-mode', theme === 'dark');
    }
  }

  // ← Aplicar ANTES de que cargue el DOM para evitar parpadeo
  applyTheme(getTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
      });
    }
  });
})();
