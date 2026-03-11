(async function () {
  const closeToTray = document.getElementById('closeToTray');
  const showAppName = document.getElementById('showAppName');

  async function applyTheme() {
    const isDark = await window.site2app.theme.get();
    document.body.classList.toggle('dark', isDark);
  }
  await applyTheme();
  window.site2app.theme.onChanged((isDark) => {
    document.body.classList.toggle('dark', isDark);
  });

  const settings = await window.site2app.settings.get();
  closeToTray.checked = settings.closeToTray;
  showAppName.checked = settings.showAppName;

  closeToTray.addEventListener('change', () => {
    window.site2app.settings.set('closeToTray', closeToTray.checked);
  });
  showAppName.addEventListener('change', () => {
    window.site2app.settings.set('showAppName', showAppName.checked);
  });

  window.site2app.settings.onChanged((updated) => {
    closeToTray.checked = updated.closeToTray;
    showAppName.checked = updated.showAppName;
  });
})();
