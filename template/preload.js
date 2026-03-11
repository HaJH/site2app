const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('site2app', {
  platform: process.platform,
  nav: {
    back: () => ipcRenderer.send('nav:back'),
    forward: () => ipcRenderer.send('nav:forward'),
    reload: () => ipcRenderer.send('nav:reload'),
  },
  search: {
    find: (query) => ipcRenderer.send('search:find', query),
    findNext: () => ipcRenderer.send('search:findNext'),
    findPrev: () => ipcRenderer.send('search:findPrev'),
    stop: () => ipcRenderer.send('search:stop'),
    setVisible: (visible) => ipcRenderer.send('search:toggleVisibility', visible),
    onResult: (callback) => ipcRenderer.on('search:result', (_e, result) => callback(result)),
    onToggle: (callback) => ipcRenderer.on('search:toggle', () => callback()),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key, value) => ipcRenderer.send('settings:set', key, value),
    onChanged: (callback) => ipcRenderer.on('settings:changed', (_e, settings) => callback(settings)),
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    onChanged: (callback) => ipcRenderer.on('theme:changed', (_e, isDark, colors) => callback(isDark, colors)),
  },
  menu: {
    show: () => ipcRenderer.send('menu:show'),
  },
});
