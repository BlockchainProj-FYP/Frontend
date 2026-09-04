import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const RPC_URL = 'http://127.0.0.1:18443';
const RPC_USER = process.env.RPC_USER || 'btquser';
const RPC_PASS = process.env.RPC_PASS || 'btqpass123';
const HISTORY_FILE = path.join(__dirname, 'rpc-history.jsonl');
const CACHE_DEPTH = 300; // how many recent blocks to keep in memory

async function rpcCall(method, params = [], wallet = null) {
  const url = wallet ? `${RPC_URL}/wallet/${wallet}` : RPC_URL;
  const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
    body: JSON.stringify({ jsonrpc: '1.0', id: 'dash', method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.result;
}

function logHistory(entry) {
  try { fs.appendFileSync(HISTORY_FILE, JSON.stringify(entry) + '\n'); }
  catch (e) { console.error('history write failed', e); }
}

// ---------------- Block cache ----------------
const blockCache = new Map(); // height -> full block (verbosity 2)
let cachedTip = -1;

async function refreshBlockCache() {
  try {
    const info = await rpcCall('getblockchaininfo');
    const tip = info.blocks;
    if (tip === cachedTip) return; // nothing new

    const from = cachedTip === -1 ? Math.max(0, tip - CACHE_DEPTH) : cachedTip + 1;
    for (let h = from; h <= tip; h++) {
      const hash = await rpcCall('getblockhash', [h]);
      const block = await rpcCall('getblock', [hash, 2]);
      blockCache.set(h, block);
    }
    cachedTip = tip;

    // trim old entries beyond CACHE_DEPTH
    for (const h of blockCache.keys()) {
      if (h < tip - CACHE_DEPTH) blockCache.delete(h);
    }
    console.log(`block cache refreshed, tip=${tip}, cached=${blockCache.size}`);
  } catch (e) {
    console.error('block cache refresh failed:', e.message);
  }
}

refreshBlockCache(); // initial backfill on startup
setInterval(refreshBlockCache, 2000); // poll for new blocks every 2s

app.get('/api/blocks', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const heights = [...blockCache.keys()].sort((a, b) => b - a).slice(0, limit);
  res.json({ tip: cachedTip, blocks: heights.map(h => blockCache.get(h)) });
});

app.get('/api/blocks/hash/:hash', (req, res) => {
  const block = [...blockCache.values()].find(b => b.hash === req.params.hash);
  if (!block) return res.status(404).json({ error: 'not in cache (too old or not yet indexed)' });
  res.json(block);
});
// -----------------------------------------------

app.post('/api/rpc', async (req, res) => {
  const { method, params = [], wallet = null } = req.body;
  const start = Date.now();
  try {
    const result = await rpcCall(method, params, wallet);
    logHistory({ timestamp: new Date().toISOString(), method, params, wallet, status: 'ok', durationMs: Date.now() - start, result });
    res.json({ result });
    // if this call could have changed the chain (mining), nudge cache to refresh sooner
    if (method === 'generatetoaddress' || method === 'invalidateblock' || method === 'reconsiderblock') {
      refreshBlockCache();
    }
  } catch (e) {
    logHistory({ timestamp: new Date().toISOString(), method, params, wallet, status: 'error', durationMs: Date.now() - start, error: e.message });
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const lines = fs.existsSync(HISTORY_FILE)
      ? fs.readFileSync(HISTORY_FILE, 'utf-8').trim().split('\n').filter(Boolean)
      : [];
    const entries = lines.slice(-500).reverse().map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    res.json(entries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/*splat', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));

app.listen(4000, '0.0.0.0', () => console.log('BTQ admin dashboard on :4000'));