// THE BRIDGE — AI Coordination Server
// Port 3100 — File-based exchange protocol + SSE monitor
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('../dashboard/node_modules/express');

const PORT = 3100;
const EXCHANGE_DIR = path.join(__dirname, '..', 'dashboard', '.exchange');
const DASHBOARD_PUBLIC = path.join(__dirname, '..', 'dashboard', 'public');

// Watched files (relative to dashboard/)
const WATCHED_FILES = [
  'public/index.html',
  'public/geonews_latest.html',
  'app.js'
];

// --- File helpers ---

function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureSeedFiles() {
  if (!fs.existsSync(EXCHANGE_DIR)) {
    fs.mkdirSync(EXCHANGE_DIR, { recursive: true });
  }
  const seeds = {
    'outbox-claude.json': { agent: 'claude-code', messages: [] },
    'outbox-cursor.json': { agent: 'cursor', messages: [] },
    'ledger.json': { entries: [] },
    'state.json': {
      lanes: {
        'claude-code': {
          label: 'First Mate', files: ['public/index.html'],
          status: 'inactive', lastSeen: null, currentTask: null
        },
        cursor: {
          label: 'Quartermaster', files: ['public/geonews_latest.html'],
          status: 'inactive', lastSeen: null, currentTask: null
        }
      },
      fileChanges: [],
      lastUpdated: null
    },
    'promotions.json': { items: [] }
  };
  for (const [file, data] of Object.entries(seeds)) {
    const fp = path.join(EXCHANGE_DIR, file);
    if (!fs.existsSync(fp)) writeJSON(fp, data);
  }
}

// --- SSE clients ---

const sseClients = new Set();

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    res.write(payload);
  }
}

// --- Outbox ingestion ---

function ingestOutbox(agent) {
  const filename = agent === 'claude-code' ? 'outbox-claude.json' : 'outbox-cursor.json';
  const outbox = readJSON(path.join(EXCHANGE_DIR, filename));
  if (!outbox || !Array.isArray(outbox.messages) || outbox.messages.length === 0) return;

  const ledger = readJSON(path.join(EXCHANGE_DIR, 'ledger.json')) || { entries: [] };
  const existingIds = new Set(ledger.entries.map(e => e.id));

  let added = 0;
  for (const msg of outbox.messages) {
    const id = msg.id || crypto.randomUUID();
    if (existingIds.has(id)) continue;
    const entry = {
      id,
      agent,
      type: msg.type || 'status-update',
      content: msg.content || '',
      timestamp: msg.timestamp || new Date().toISOString(),
      ...(msg.meta ? { meta: msg.meta } : {})
    };
    ledger.entries.push(entry);
    existingIds.add(id);
    added++;
    broadcast('log', entry);
  }

  if (added > 0) {
    writeJSON(path.join(EXCHANGE_DIR, 'ledger.json'), ledger);
    // Update state
    const state = readJSON(path.join(EXCHANGE_DIR, 'state.json'));
    if (state && state.lanes && state.lanes[agent]) {
      state.lanes[agent].lastSeen = new Date().toISOString();
      state.lanes[agent].status = 'active';
      state.lastUpdated = new Date().toISOString();
      writeJSON(path.join(EXCHANGE_DIR, 'state.json'), state);
      broadcast('state', state);
    }
  }
}

// --- File change detection ---

const fileMtimes = new Map();

function checkFileChanges() {
  const dashboardDir = path.join(__dirname, '..', 'dashboard');
  const state = readJSON(path.join(EXCHANGE_DIR, 'state.json'));
  if (!state) return;

  let changed = false;
  for (const relPath of WATCHED_FILES) {
    const fullPath = path.join(dashboardDir, relPath);
    try {
      const stat = fs.statSync(fullPath);
      const mtime = stat.mtimeMs;
      const prev = fileMtimes.get(relPath);
      fileMtimes.set(relPath, mtime);

      if (prev !== undefined && mtime !== prev) {
        const change = {
          file: relPath,
          timestamp: new Date().toISOString(),
          size: stat.size
        };
        state.fileChanges = state.fileChanges || [];
        state.fileChanges.unshift(change);
        state.fileChanges = state.fileChanges.slice(0, 50); // keep last 50
        changed = true;
        broadcast('file-change', change);
      }
    } catch {
      // File doesn't exist yet — skip
    }
  }

  if (changed) {
    state.lastUpdated = new Date().toISOString();
    writeJSON(path.join(EXCHANGE_DIR, 'state.json'), state);
  }
}

// --- File watchers ---

const watchDebounce = new Map();

function setupWatchers() {
  const dashboardDir = path.join(__dirname, '..', 'dashboard');

  // Watch outbox files
  for (const file of ['outbox-claude.json', 'outbox-cursor.json']) {
    const fp = path.join(EXCHANGE_DIR, file);
    try {
      fs.watch(fp, () => {
        const key = file;
        if (watchDebounce.has(key)) clearTimeout(watchDebounce.get(key));
        watchDebounce.set(key, setTimeout(() => {
          const agent = file.includes('claude') ? 'claude-code' : 'cursor';
          ingestOutbox(agent);
        }, 300));
      });
    } catch {
      console.log(`[Bridge] Could not watch ${file} — will rely on polling`);
    }
  }

  // Watch dashboard files
  for (const relPath of WATCHED_FILES) {
    const fp = path.join(dashboardDir, relPath);
    try {
      // Initialize mtime
      const stat = fs.statSync(fp);
      fileMtimes.set(relPath, stat.mtimeMs);

      fs.watch(fp, () => {
        if (watchDebounce.has(relPath)) clearTimeout(watchDebounce.get(relPath));
        watchDebounce.set(relPath, setTimeout(() => checkFileChanges(), 300));
      });
    } catch {
      console.log(`[Bridge] Could not watch ${relPath} — will rely on polling`);
    }
  }

  // Fallback poll every 10s
  setInterval(() => {
    ingestOutbox('claude-code');
    ingestOutbox('cursor');
    checkFileChanges();
  }, 10000);
}

// --- Express app ---

const app = express();
app.use(express.json());
// Serve bridge.html at root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bridge.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// SSE stream
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

app.get('/api/state', (_req, res) => {
  const state = readJSON(path.join(EXCHANGE_DIR, 'state.json'));
  res.json(state || {});
});

app.get('/api/ledger', (req, res) => {
  const ledger = readJSON(path.join(EXCHANGE_DIR, 'ledger.json')) || { entries: [] };
  const since = req.query.since;
  if (since) {
    const sinceDate = new Date(since);
    ledger.entries = ledger.entries.filter(e => new Date(e.timestamp) > sinceDate);
  }
  res.json(ledger);
});

app.get('/api/promotions', (_req, res) => {
  const promos = readJSON(path.join(EXCHANGE_DIR, 'promotions.json'));
  res.json(promos || { items: [] });
});

app.post('/api/promotions/:id/approve', (req, res) => {
  const promos = readJSON(path.join(EXCHANGE_DIR, 'promotions.json'));
  if (!promos) return res.status(500).json({ error: 'Cannot read promotions' });
  const item = promos.items.find(p => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Promotion not found' });
  item.status = 'approved';
  item.decidedAt = new Date().toISOString();
  writeJSON(path.join(EXCHANGE_DIR, 'promotions.json'), promos);
  broadcast('promotion', { action: 'approved', item });
  res.json(item);
});

app.post('/api/promotions/:id/reject', (req, res) => {
  const promos = readJSON(path.join(EXCHANGE_DIR, 'promotions.json'));
  if (!promos) return res.status(500).json({ error: 'Cannot read promotions' });
  const item = promos.items.find(p => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Promotion not found' });
  item.status = 'rejected';
  item.decidedAt = new Date().toISOString();
  writeJSON(path.join(EXCHANGE_DIR, 'promotions.json'), promos);
  broadcast('promotion', { action: 'rejected', item });
  res.json(item);
});

app.get('/api/health', (_req, res) => {
  res.status(200).send('OK');
});

// --- Start ---

ensureSeedFiles();
setupWatchers();

app.listen(PORT, () => {
  console.log(`
  ☠  THE BRIDGE — AI Coordination Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Port:     ${PORT}
  Monitor:  http://localhost:${PORT}
  Exchange: ${EXCHANGE_DIR}
  Watching: ${WATCHED_FILES.join(', ')}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
