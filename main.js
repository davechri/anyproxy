const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'production';
const dataDir = `${process.env.HOME + path.sep}allproxy`;
process.env.ALLPROXY_DATA_DIR = dataDir;

const mkDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const startServer = () => {
  mkDir(dataDir);
  mkDir(`${dataDir + path.sep}intercept`);
  mkDir(`${dataDir + path.sep}proto`);
  mkDir(`${dataDir + path.sep}bin`);
  require('./build/app.js');
};

const createWindow = () => {
  const win = new BrowserWindow();
  win.maximize();
  setTimeout(() => {
    win.loadURL('http://localhost:8888/allproxy');
    switch (process.platform) {
      case 'darwin':
        fs.copyFileSync('./bin/macos/installCa.sh', `${dataDir}/bin/installCa.sh`);
        break;
      case 'win32':
        fs.copyFileSync('./bin/win32/installCa.bat', `${dataDir}\bin\installCa.bat`);
        break;
      default:
        fs.copyFileSync('./bin/linux/installCa.sh', `${dataDir}/bin/installCa.sh`);
        break;
    }
  }, 1000);
};

startServer();

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});