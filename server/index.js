import express from 'express';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = process.env.AWHILE_DATA_DIR ?? path.join(__dirname, '../data');
const DATA_FILE  = path.join(DATA_DIR, 'awhile.json');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const DIST_DIR   = path.join(__dirname, '../dist');
const PORT       = process.env.PORT ?? 3001;

await mkdir(DATA_DIR, { recursive: true });
await mkdir(IMAGES_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/api/data', async (_req, res) => {
  if (!existsSync(DATA_FILE)) {
    res.json({});
    return;
  }
  const raw = await readFile(DATA_FILE, 'utf8');
  res.json(JSON.parse(raw));
});

app.put('/api/data', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }
  await writeFile(DATA_FILE, JSON.stringify(body, null, 2), 'utf8');
  res.json({ ok: true });
});

app.use('/api/images', express.static(IMAGES_DIR));

app.post('/api/images', express.raw({ type: (req) => req.headers['content-type']?.startsWith('image/') ?? false, limit: '10mb' }), async (req, res) => {
  const contentType = req.headers['content-type'] ?? 'image/png';
  const ext = contentType.split('/')[1]?.split(';')[0] ?? 'png';
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(IMAGES_DIR, filename), req.body);
  res.json({ url: `/api/images/${filename}` });
});

app.delete('/api/images/:filename', async (req, res) => {
  const filename = path.basename(req.params.filename);
  await unlink(path.join(IMAGES_DIR, filename)).catch(() => {});
  res.json({ ok: true });
});

app.use(express.static(DIST_DIR));
app.use((_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

function listenOn(port) {
  const server = app.listen(port, () => console.log(`awhile server on :${port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`port ${port} in use, trying ${port + 1}`);
      listenOn(port + 1);
    } else {
      throw err;
    }
  });
}
listenOn(Number(PORT));
