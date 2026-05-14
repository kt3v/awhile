import express from 'express';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'awhile.json');
const DIST_DIR  = path.join(__dirname, '../dist');
const PORT      = process.env.PORT ?? 3001;

await mkdir(DATA_DIR, { recursive: true });

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

app.use(express.static(DIST_DIR));
app.use((_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => console.log(`awhile server on :${PORT}`));
