const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopDb', {
  load: () => ipcRenderer.invoke('db:load'),
  save: data => ipcRenderer.invoke('db:save', data),
  location: () => ipcRenderer.invoke('db:location')
});
