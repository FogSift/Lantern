# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lantern is a local news intelligence system for Chico, CA, part of the FogSift ecosystem. It scrapes web sources via a local Firecrawl instance, processes them through a local LLM (llama.cpp), and delivers briefings through a web dashboard and Substack publishing pipeline. Everything runs locally — no cloud API dependencies.

**Repo:** `github.com/FogSift/Lantern`

## Architecture

Three-layer pipeline: **Acquisition → Processing → Delivery**

```
Dashboard (Express, port 3030)
    ↓ spawns
scripts/sift.sh (orchestrator)
    ↓ calls
Firecrawl (port 3002) → raw markdown → purify → llama.cpp (port 8080) → briefing
    ↓ stores
core/lantern.sqlite (briefings table) + archive/*.md
```

- `dashboard/app.js` — Express server, serves UI and exposes SSE streaming endpoint (`/api/sift`)
- `dashboard/public/index.html` — Tactical control UI (Tailwind CDN + Leaflet.js + marked.js)
- `scripts/sift.sh` — Core pipeline: scrape (optional) → clean signal → LLM inference → archive
- `scripts/dredge.sh` — Firecrawl web scraper, outputs to `transmissions/`
- `scripts/lighthouse.sh` — Autonomous 2-hour interval beacon (dredge → sift loop)
- `core/lantern.sqlite` — SQLite DB with `briefings` table (id, timestamp, source, headline, content, raw_file_path)
- `system_instructions.md` — Analyst persona and output format guidelines

## Commands

```bash
# Start dashboard server
cd /Users/ctavolazzi/Code/Lantern/dashboard && node app.js
# → http://localhost:3030

# Run a sift (autonomous mode — uses latest transmission)
cd /Users/ctavolazzi/Code/Lantern && ./scripts/sift.sh

# Run a sift against a specific URL
cd /Users/ctavolazzi/Code/Lantern && ./scripts/sift.sh https://www.chicoer.com/

# Scrape a URL via Firecrawl
./scripts/dredge.sh https://example.com

# Start autonomous lighthouse beacon (2-hour intervals)
./scripts/lighthouse.sh

# Kill lighthouse daemon
./scripts/kill-lighthouse.sh

# Install dashboard dependencies
cd /Users/ctavolazzi/Code/Lantern/dashboard && npm install

# Install core Python dependencies
cd /Users/ctavolazzi/Code/Lantern/core && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

No test suite, no linter configuration.

## Required External Services

These must be running for the pipeline to work:

| Service | Port | Purpose |
|---------|------|---------|
| Firecrawl | `localhost:3002` | Web scraping (`/v1/scrape` endpoint) |
| llama.cpp | `localhost:8080` | LLM inference (`/completion` endpoint, SSE streaming) |

## API Endpoints (Dashboard)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/sift?url=` | GET | SSE stream — runs sift.sh, streams output, stores in DB |
| `/api/history` | GET | Last 8 briefings from SQLite |
| `/api/archive/:id` | GET | Single briefing by ID |
| `/api/health` | GET | 200 OK heartbeat |

## Signal Pipeline Details

`sift.sh` processing steps:
1. Acquire signal: Firecrawl scrape (if URL provided) or latest `transmissions/raw-*.md`
2. Purify: strip ads/privacy/copyright boilerplate, truncate to 3000 chars
3. Infer: POST to llama.cpp with FogSift analyst prompt (800 tokens, temp 0.85)
4. Archive: write to `archive/briefing-YYYY-MM-DD_HHMMSS.md`
5. Store: dashboard inserts into SQLite after streaming completes

## Key Conventions

- **macOS-specific:** Scripts use `osascript`, `textutil`, `pbcopy` — not portable
- **Hardcoded paths:** Many scripts reference `/Users/ctavolazzi/Code/` directly
- **No git tracking of data:** `transmissions/` and `archive/` contents are in `.gitignore`
- **Never auto-commit** — always ask before any `git commit`
- **Never delete without backup verification**
- `core/lantern.sqlite` is the single source of truth for briefing history — back up before destructive operations
