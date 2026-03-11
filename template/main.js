const { app, BrowserWindow, WebContentsView, shell, nativeTheme, ipcMain, Menu, Tray, session } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');

const APP_NAME = '{{APP_NAME}}';
const APP_URL = '{{APP_URL}}';
const APP_ID = '{{APP_ID}}';
const APP_ORIGIN = new URL(APP_URL).origin;

const store = new Store({
  defaults: {
    closeToTray: false,
    showAppName: true,
    theme: 'system',
    autoLaunch: false,
    startMinimized: false,
    alwaysOnTop: false,
  },
});

let mainWindow = null;
let contentView = null;
let tray = null;
let settingsWindow = null;
let forceQuit = false;

const TITLEBAR_HEIGHT = 32;
const SEARCHBAR_HEIGHT = 36;
let searchBarVisible = false;

function applyThemeSetting(theme) {
  nativeTheme.themeSource = theme === 'system' ? 'system' : theme;
}

function getSystemColors() {
  const isDark = nativeTheme.shouldUseDarkColors;
  return {
    bg: isDark ? '#202020' : '#f3f3f3',
    fg: isDark ? '#ffffff' : '#1a1a1a',
  };
}

function getTopOffset() {
  return TITLEBAR_HEIGHT + (searchBarVisible ? SEARCHBAR_HEIGHT : 0);
}

function updateContentBounds() {
  if (!mainWindow || !contentView) return;
  const [width, height] = mainWindow.getContentSize();
  contentView.setBounds({
    x: 0,
    y: getTopOffset(),
    width,
    height: height - getTopOffset(),
  });
}

function createWindow() {
  const winState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800,
  });

  const platformTitlebar = process.platform === 'darwin'
    ? { titleBarStyle: 'hiddenInset' }
    : {
        titleBarStyle: 'hidden',
        titleBarOverlay: {
          color: getSystemColors().bg,
          symbolColor: getSystemColors().fg,
          height: TITLEBAR_HEIGHT,
        },
      };

  mainWindow = new BrowserWindow({
    x: winState.x,
    y: winState.y,
    width: winState.width,
    height: winState.height,
    title: APP_NAME,
    alwaysOnTop: store.get('alwaysOnTop'),
    show: !store.get('startMinimized'),
    icon: path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.icns'),
    ...platformTitlebar,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  winState.manage(mainWindow);

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'titlebar.html'));

  const ses = session.fromPartition(`persist:${APP_ID}`);
  contentView = new WebContentsView({
    webPreferences: {
      session: ses,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.contentView.addChildView(contentView);
  contentView.webContents.loadURL(APP_URL);
  updateContentBounds();

  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'notifications') {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.on('resize', updateContentBounds);

  contentView.webContents.setWindowOpenHandler(({ url }) => {
    if (new URL(url).origin !== APP_ORIGIN) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  contentView.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== APP_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Search result forwarding
  contentView.webContents.on('found-in-page', (_e, result) => {
    mainWindow?.webContents.send('search:result', {
      activeMatchOrdinal: result.activeMatchOrdinal,
      matches: result.matches,
    });
  });

  mainWindow.on('close', (event) => {
    if (!forceQuit && store.get('closeToTray')) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    contentView = null;
  });
}

// --- IPC Handlers ---

ipcMain.on('nav:back', () => contentView?.webContents.goBack());
ipcMain.on('nav:forward', () => contentView?.webContents.goForward());
ipcMain.on('nav:reload', () => contentView?.webContents.reload());

function setTheme(theme) {
  store.set('theme', theme);
  applyThemeSetting(theme);
  mainWindow?.webContents.send('settings:changed', store.store);
}

ipcMain.on('menu:show', () => {
  const settings = store.store;
  const menu = Menu.buildFromTemplate([
    {
      label: settings.showAppName ? 'Hide App Name' : 'Show App Name',
      click: () => {
        store.set('showAppName', !settings.showAppName);
        mainWindow?.webContents.send('settings:changed', store.store);
      },
    },
    {
      label: 'Close to Tray',
      type: 'checkbox',
      checked: settings.closeToTray,
      click: () => {
        store.set('closeToTray', !settings.closeToTray);
        mainWindow?.webContents.send('settings:changed', store.store);
      },
    },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: () => {
        const value = !settings.alwaysOnTop;
        store.set('alwaysOnTop', value);
        mainWindow?.setAlwaysOnTop(value);
      },
    },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: settings.autoLaunch,
      click: () => {
        const value = !settings.autoLaunch;
        store.set('autoLaunch', value);
        app.setLoginItemSettings({ openAtLogin: value });
      },
    },
    {
      label: 'Start Minimized',
      type: 'checkbox',
      checked: settings.startMinimized,
      click: () => {
        store.set('startMinimized', !settings.startMinimized);
      },
    },
    { type: 'separator' },
    {
      label: 'Theme',
      submenu: [
        { label: 'System', type: 'radio', checked: settings.theme === 'system', click: () => setTheme('system') },
        { label: 'Light', type: 'radio', checked: settings.theme === 'light', click: () => setTheme('light') },
        { label: 'Dark', type: 'radio', checked: settings.theme === 'dark', click: () => setTheme('dark') },
      ],
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);
  menu.popup({ window: mainWindow });
});

let lastSearchQuery = '';

ipcMain.on('search:find', (_e, query) => {
  lastSearchQuery = query;
  if (!query) {
    contentView?.webContents.stopFindInPage('clearSelection');
    return;
  }
  contentView?.webContents.findInPage(query);
});
ipcMain.on('search:findNext', () => {
  if (lastSearchQuery) {
    contentView?.webContents.findInPage(lastSearchQuery, { forward: true, findNext: true });
  }
});
ipcMain.on('search:findPrev', () => {
  if (lastSearchQuery) {
    contentView?.webContents.findInPage(lastSearchQuery, { forward: false, findNext: true });
  }
});
ipcMain.on('search:stop', () => {
  contentView?.webContents.stopFindInPage('clearSelection');
  searchBarVisible = false;
  updateContentBounds();
});

ipcMain.handle('settings:get', () => store.store);
ipcMain.on('settings:set', (_e, key, value) => {
  store.set(key, value);
  mainWindow?.webContents.send('settings:changed', store.store);
  settingsWindow?.webContents.send('settings:changed', store.store);
});

ipcMain.handle('theme:get', () => ({
  isDark: nativeTheme.shouldUseDarkColors,
  colors: getSystemColors(),
}));
nativeTheme.on('updated', () => {
  const isDark = nativeTheme.shouldUseDarkColors;
  const colors = getSystemColors();
  mainWindow?.webContents.send('theme:changed', isDark, colors);
  settingsWindow?.webContents.send('theme:changed', isDark);
  if (process.platform === 'win32' && mainWindow) {
    const colors = getSystemColors();
    mainWindow.setTitleBarOverlay({
      color: colors.bg,
      symbolColor: colors.fg,
    });
  }
});

ipcMain.on('search:toggleVisibility', (_e, visible) => {
  searchBarVisible = visible;
  updateContentBounds();
});

// --- System Tray ---

function createTray() {
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.icns';
  tray = new Tray(path.join(__dirname, iconFile));
  tray.setToolTip(APP_NAME);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => { mainWindow?.show(); } },
    { label: 'Settings', click: openSettings },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow?.show(); });
}

// --- Settings Window ---

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    parent: mainWindow,
    modal: false,
    title: `${APP_NAME} - Settings`,
    webPreferences: {
      preload: path.join(__dirname, 'preload-settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.setMenu(null);
  settingsWindow.loadFile(path.join(__dirname, 'settings', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// --- App Menu (Keyboard Shortcuts) ---

function createMenu() {
  const isMac = process.platform === 'darwin';
  const mod = isMac ? 'Cmd' : 'Ctrl';

  const template = [
    {
      label: APP_NAME,
      submenu: [
        { label: 'Quit', accelerator: `${mod}+Q`, click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Find',
          accelerator: `${mod}+F`,
          click: () => mainWindow?.webContents.send('search:toggle'),
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: `${mod}+R`,
          click: () => contentView?.webContents.reload(),
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: `${mod}+=`,
          click: () => {
            const zoom = contentView?.webContents.getZoomLevel() ?? 0;
            contentView?.webContents.setZoomLevel(zoom + 0.5);
          },
        },
        {
          label: 'Zoom Out',
          accelerator: `${mod}+-`,
          click: () => {
            const zoom = contentView?.webContents.getZoomLevel() ?? 0;
            contentView?.webContents.setZoomLevel(zoom - 0.5);
          },
        },
        {
          label: 'Reset Zoom',
          accelerator: `${mod}+0`,
          click: () => contentView?.webContents.setZoomLevel(0),
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()),
        },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => contentView?.webContents.goBack(),
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => contentView?.webContents.goForward(),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- App Lifecycle ---

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    applyThemeSetting(store.get('theme'));
    app.setLoginItemSettings({ openAtLogin: store.get('autoLaunch') });
    createWindow();
    createTray();
    createMenu();
  });
}

app.on('before-quit', () => {
  forceQuit = true;
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
