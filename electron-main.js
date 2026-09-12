const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { loadDatabase, saveDatabase } = require('./database-store');

// Electron 22 — последняя ветка Chromium с официальной поддержкой Windows 7.
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

function databasePath() { return path.join(app.getPath('userData'), 'database.json'); }
ipcMain.handle('db:load', () => loadDatabase(databasePath()));
ipcMain.handle('db:save', (_event, value) => saveDatabase(databasePath(), value));
ipcMain.handle('db:location', () => databasePath());

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 680,
    backgroundColor: '#edf5ff',
    autoHideMenuBar: true,
    show: false,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (process.argv.includes('--diagnostic')) {
    window.webContents.once('did-finish-load', async () => {
      const result = await window.webContents.executeJavaScript("(async()=>{await new Promise(r=>setTimeout(r,1000));try{await hydrateDb();return {bridge:typeof window.desktopDb,location:await window.desktopDb.location(),loaded:await window.desktopDb.load(),patients:document.querySelectorAll('[data-patient]').length,title:document.title}}catch(error){return {error:String(error),stack:error&&error.stack}}})()");
      console.log('DIAGNOSTIC', JSON.stringify(result));
    });
  }
  window.loadFile(path.join(__dirname, 'index.html'));
  window.once('ready-to-show', () => {
    window.maximize();
    window.show();
    if (process.argv.includes('--fullscreen')) window.maximize();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
