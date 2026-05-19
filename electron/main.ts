import { app, BrowserWindow, shell, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'node:net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

async function findFreePort(from = 3001): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', () => findFreePort(from + 1).then(resolve, reject));
    srv.listen(from, () => srv.close(() => resolve(from)));
  });
}

async function waitForUrl(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise<void>(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

let appUrl = '';

function createWindow() {
  const iconFile = process.platform === 'win32' ? 'icon.ico'
    : process.platform === 'darwin' ? 'icon.icns'
    : 'icon.png';
  const icon = path.join(__dirname, '..', 'build', iconFile);

  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'Awhile',
    titleBarStyle: 'default',
    icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(appUrl);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

Menu.setApplicationMenu(null);

app.whenReady().then(async () => {
  if (isDev) {
    // Dev: Vite on :5173, Express on :3001 — both started by concurrently
    appUrl = 'http://localhost:5173';
    await waitForUrl(appUrl);
  } else {
    // Production: start Express server in-process, point to userData for writes
    const port = await findFreePort(3001);
    const dataDir = path.join(app.getPath('userData'), 'data');

    process.env.PORT = String(port);
    process.env.AWHILE_DATA_DIR = dataDir;

    const serverEntry = pathToFileURL(path.join(__dirname, '..', 'server', 'index.js')).href;
    await import(serverEntry);

    appUrl = `http://localhost:${port}`;
    await waitForUrl(appUrl);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
