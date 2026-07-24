const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function startBackend() {
  // 在打包后，后端 Python 脚本需要用 PyInstaller 单独打包
  // 开发模式下，这里暂时跳过自动启动
  console.log('后端服务需要单独启动: cd backend && python main.py');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: '搬家服务平台 - 管理后台',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加载 Vite 构建的前端
  const indexHtml = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexHtml);

  // 在外部浏览器打开链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
