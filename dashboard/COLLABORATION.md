# Dashboard Collaboration Guide

**Last updated:** 2026-02-27
**Purpose:** Coordinate parallel AI development on the Lantern dashboard without conflicts.

---

## Lane Assignments

| Lane | File | Owner | Role |
|------|------|-------|------|
| **Production** | `public/index.html` | Claude Code (CLI) | Backend-connected UI, all real data, map controls, sift pipeline |
| **Prototype** | `public/geonews_latest.html` | Other AI | Visual experiments, new interaction patterns, design concepts |

**Rule: Never edit the other lane's file.** If you want to propose a change to the other file, describe it in a comment or create a new file.

---

## API Contract

The Express backend (`app.js`, port 3030) exposes these endpoints. Both UIs should code against this contract.

### GET `/api/briefings?limit=30&offset=0`

Returns an array of briefing objects, newest first.

```json
[
  {
    "id": 1,
    "headline": "Structure fire reported near Enloe Medical",
    "source": "Chico ER Sweep",
    "timestamp": "2026-02-27 14:30:00",
    "preview": "First 200 chars of content, stripped of markdown/ANSI...",
    "content": "Full raw markdown briefing text...",
    "location_count": 3
  }
]
```

- `limit` max: 100, default: 20
- `headline` is extracted server-side from the first H1/H2 or first sentence
- `content` may contain ANSI escape codes — strip with `/\x1b\[[0-9;]*m/g`
- `location_count` is a COUNT of matching rows in the locations table

### GET `/api/locations`

Returns location pins from the last 24 hours, joined with briefing metadata.

```json
[
  {
    "id": 1,
    "briefing_id": 5,
    "label": "Pleasant Valley High School",
    "snippet": "The incident occurred near Pleasant Valley High School around 3pm.",
    "lat": 39.7605,
    "lng": -121.8169,
    "created_at": "2026-02-27 14:30:00",
    "timestamp": "2026-02-27 14:30:00",
    "source": "Chico ER Sweep"
  }
]
```

- Coordinates are always in the Chico, CA area (lat ~39.6–39.9, lng ~-122.1–-121.4)
- `label` comes from the gazetteer (80+ Chico POIs) or LLM extraction
- `snippet` is the sentence from the briefing where the location was mentioned
- `source` and `timestamp` come from the parent briefing

### GET `/api/sift?url=[optional]`

Server-Sent Events stream. Runs the sift pipeline.

```
data: {"content": "## Chico Intelligence Brief\n\n"}

data: {"content": "**Key developments:**\n"}

data: {"done": true}
```

- If `url` is provided, scrapes that URL via Firecrawl first
- If omitted, uses the latest file in `transmissions/`
- After `done: true`, the briefing has been inserted into SQLite
- Location extraction runs async after insert — wait ~3 seconds, then reload `/api/briefings` and `/api/locations`

### GET `/api/health`

Returns `200 OK` (plain text). Use for heartbeat/reconnect logic.

---

## Shared Constants

### Map Center
```javascript
const CHICO_CENTER = [39.728, -121.837];
const DEFAULT_ZOOM = 13;
```

### Tile Layer
```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

### Color Palette (Production)
```
Emerald accent:  #10b981
Dark background: #030712 (gray-950)
Card background: #111827 (gray-900)
Border:          #1f2937 (gray-800)
Text primary:    #d1d5db (gray-300)
Text muted:      #4b5563 (gray-600)
```

The prototype can use any palette for experimentation, but features promoted to production should adopt the emerald/dark theme above.

---

## What's Already Built

### Production (`index.html`) — Current Features
- 3-screen SPA: city selector → news feed → map view
- Hash routing (`#select`, `#news`, `#map`)
- News card grid with expand/collapse, markdown rendering (marked.js)
- Location badges on cards (click to jump to map pin)
- SSE sift pipeline with live streaming output
- Leaflet map with marker clusters, emerald dot pins
- Scale bar, attribution, legend panel (collapsible)
- Locate Me button (geolocation + blue pulsing dot)
- Fullscreen toggle (button + F key)
- Loading overlay with spinner
- "Updated X min ago" timestamp in navbar
- News ticker overlay on map (scrolling headlines)
- Keyboard shortcuts: N (news), F (fullscreen), Escape (exit fullscreen)
- Toast notifications
- Auto-reload heartbeat (detects server crash)
- localStorage persistence for recent cities

### Prototype (`geonews_latest.html`) — Current Features
- Full-page map with floating sidebar
- Image-based circular pins with status-colored rings
- Smart category filters (Right Now, Weekend, Emergencies, Positive, Events, All)
- Breaking news pulsing badges
- Sidebar feed cards with thumbnails and sentiment coloring
- Card click → map flyTo + cluster zoom + popup open
- Scrolling news marquee (filtered for "now" events)
- "AI Core" status indicator (SYNCED/LIVE/FALLBACK/ERROR)
- Custom cluster blobs (blue default, red if contains breaking)
- Client-side category/sentiment/breaking inference from headline text
- Simulated breaking event injection (demo, 5s timer)
- Wired to real `/api/briefings` and `/api/locations` with seed data fallback

---

## Promotion Candidates

Features in the prototype that are good candidates for promotion to production:

| Feature | Effort | Value | Notes |
|---------|--------|-------|-------|
| Smart category filters | Medium | High | Need server-side category field or client-side inference |
| Card → map fly animation | Low | Medium | Replace `setView` with `flyTo` + cluster zoom |
| Breaking news pulse | Low | Medium | Add CSS animation + detection heuristic |
| Sentiment-colored card borders | Low | Medium | Keyword inference from headline |
| Image pins | High | Medium | Need image URLs — either scrape OG images or use category icons |
| Status indicator pill | Low | Low | Nice to have, shows API health |

To promote a feature: build it in the prototype first, verify it works against real API data, then port the CSS + JS into `index.html`.

---

## Exchange Protocol — THE BRIDGE

The Bridge (`exchange/server.js`, port 3100) provides real-time AI coordination via a file-based protocol and SSE monitor.

### File-Based Exchange (for Cursor / file-only agents)

All exchange files live in `dashboard/.exchange/`:

| File | Purpose |
|------|---------|
| `outbox-claude.json` | Claude Code writes messages here |
| `outbox-cursor.json` | Cursor writes messages here |
| `ledger.json` | Append-only log of all ingested messages |
| `state.json` | Lane ownership, file changes, agent status |
| `promotions.json` | Feature promotion queue |

### Writing a Message (Outbox Protocol)

To send a message, append to your outbox's `messages` array:

```json
{
  "agent": "cursor",
  "messages": [
    {
      "id": "unique-id-here",
      "type": "context-share",
      "content": "Added category filter CSS to geonews_latest.html",
      "timestamp": "2026-02-27T12:00:00Z",
      "meta": { "file": "public/geonews_latest.html", "lines": "45-80" }
    }
  ]
}
```

**Message types:** `file-change`, `context-share`, `promotion-request`, `api-contract`, `dependency-alert`, `status-update`

The Bridge server watches outbox files and automatically ingests new messages (deduped by `id`) into `ledger.json`.

### Reading State

- `state.json` — Check `lanes.<agent>.status` for activity, `fileChanges` for recent edits
- `ledger.json` — Full reverse-chronological message history
- `promotions.json` — Feature promotion queue with status (`pending` / `approved` / `rejected`)

### Requesting a Promotion

Write a `promotion-request` message to your outbox, or directly append to `promotions.json`:

```json
{
  "id": "promo-category-filters",
  "feature": "Smart category filters",
  "description": "Client-side category inference from headline keywords",
  "source": "public/geonews_latest.html",
  "target": "public/index.html",
  "status": "pending",
  "requestedBy": "cursor",
  "requestedAt": "2026-02-27T12:00:00Z"
}
```

### Bridge Monitor

Open `http://localhost:3100` for the live pirate-themed monitor UI (THE BRIDGE). It shows:
- **Ship Manifest** — agent status and lane ownership
- **Captain's Log** — live message feed (SSE-updated)
- **Plunder Queue** — promotion approve/reject
- **Cargo Hold** — watched file change history

### For Cursor (file-only access)

Since Cursor cannot make HTTP calls:
1. Write messages to `dashboard/.exchange/outbox-cursor.json`
2. Read state from `dashboard/.exchange/state.json` and `ledger.json`
3. The Bridge server auto-detects file changes and updates everything
4. The human operator uses the browser monitor to approve promotions

---

## Rules of Engagement

1. **Never edit the other lane's file** without explicit user instruction
2. **Never modify `app.js`** without coordinating — it's shared infrastructure
3. **Seed data is for demos only** — production UI must work with empty database
4. **Test against real API** — run `cd dashboard && node app.js`, hit `localhost:3030`
5. **No new npm dependencies** without user approval
6. **Never auto-commit** — always ask the user first
7. **If you need a new API endpoint**, document it here first so both lanes know about it
