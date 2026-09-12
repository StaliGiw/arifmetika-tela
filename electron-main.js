const { app, BrowserWindow } = require('electron');
const path = require('path');

// Electron 22 — последняя ветка Chromium с официальной поддержкой Windows 7.
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

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
