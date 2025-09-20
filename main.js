const { app, BrowserWindow } = require('electron');
const path = require('path');

require('@electron/remote/main').initialize();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false
  });
  
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      app.emit('before-quit', event);
      app.isQuiting = true;
    }
  });

  mainWindow.loadFile('index.html');
  
  require('@electron/remote/main').enable(mainWindow.webContents);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    event.preventDefault();
    
    const mainWindow = windows[0];
    mainWindow.webContents.send('app-closing');
    
    setTimeout(() => {
      app.quit();
    }, 5000);
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});