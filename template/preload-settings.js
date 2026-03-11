const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('site2app', {
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key, value) => ipcRenderer.send('settings:set', key, value),
    onChanged: (callback) => ipcRenderer.on('settings:changed', (_e, settings) => callback(settings)),
  },
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    onChanged: (callback) => ipcRenderer.on('theme:changed', (_e, isDark) => callback(isDark)),
  },
});
