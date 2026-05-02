import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storagePath = path.join(__dirname, 'storage.json');

async function readStore() {
  try {
    const raw = await fs.readFile(storagePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { devices: [] };
    if (!Array.isArray(parsed.devices)) return { devices: [] };
    return { devices: parsed.devices };
  } catch {
    return { devices: [] };
  }
}

async function writeStore(store) {
  await fs.writeFile(storagePath, JSON.stringify(store, null, 2), 'utf8');
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/devices', async (_req, res) => {
  const store = await readStore();
  res.json({ devices: store.devices });
});

app.get('/api/devices/by-qr/:qrData', async (req, res) => {
  const { qrData } = req.params;
  const store = await readStore();
  const found = store.devices.find((d) => d.qrData === qrData);
  if (!found) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ device: found });
});

app.post('/api/devices/upsert', async (req, res) => {
  const device = req.body?.device;
  if (!device || !device.id) return res.status(400).json({ error: 'INVALID_DEVICE' });

  const store = await readStore();
  const idx = store.devices.findIndex((d) => d.id === device.id);
  if (idx >= 0) store.devices[idx] = { ...store.devices[idx], ...device };
  else store.devices.push(device);
  await writeStore(store);
  res.json({ ok: true });
});

app.patch('/api/devices/:id', async (req, res) => {
  const { id } = req.params;
  const patch = req.body?.patch;
  if (!patch || typeof patch !== 'object') return res.status(400).json({ error: 'INVALID_PATCH' });

  const store = await readStore();
  const idx = store.devices.findIndex((d) => d.id === id);
  if (idx < 0) return res.status(404).json({ error: 'NOT_FOUND' });

  store.devices[idx] = { ...store.devices[idx], ...patch };
  await writeStore(store);
  res.json({ ok: true, device: store.devices[idx] });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Local API listening on http://localhost:${port}`);
});

