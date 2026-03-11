(async function () {
  const btnBack = document.getElementById('btn-back');
  const btnForward = document.getElementById('btn-forward');
  const btnReload = document.getElementById('btn-reload');
  const appNameEl = document.getElementById('app-name');

  const btnMenu = document.getElementById('btn-menu');

  btnBack.addEventListener('click', () => window.site2app.nav.back());
  btnForward.addEventListener('click', () => window.site2app.nav.forward());
  btnReload.addEventListener('click', () => window.site2app.nav.reload());
  btnMenu.addEventListener('click', () => window.site2app.menu.show());

  function applyColors(colors) {
    document.body.style.background = colors.bg;
    document.body.style.color = colors.fg;
  }

  async function applyTheme() {
    const theme = await window.site2app.theme.get();
    document.body.classList.toggle('dark', theme.isDark);
    applyColors(theme.colors);
  }
  await applyTheme();
  window.site2app.theme.onChanged((isDark, colors) => {
    document.body.classList.toggle('dark', isDark);
    if (colors) applyColors(colors);
  });

  async function applySettings() {
    const settings = await window.site2app.settings.get();
    appNameEl.classList.toggle('hidden', !settings.showAppName);
  }
  await applySettings();
  window.site2app.settings.onChanged((settings) => {
    appNameEl.classList.toggle('hidden', !settings.showAppName);
  });
})();
