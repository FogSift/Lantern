const express = require('express');
const { spawn } = require('child_process');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const app = express();
const PORT = 3030;

app.use(express.static(path.join(__dirname, 'public')));

async function getDB() {
    return open({
        filename: path.join(__dirname, '../core/lantern.sqlite'),
        driver: sqlite3.Database
    });
}

// Initialize locations table
async function initDB() {
    const db = await getDB();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            briefing_id INTEGER,
            label TEXT,
            snippet TEXT,
            lat REAL,
            lng REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (briefing_id) REFERENCES briefings(id)
        )
    `);
    return db;
}

// Chico, CA gazetteer — verified coordinates for location matching.
// Entries are matched longest-first to prevent partial collisions.
// Each entry can have `aliases` for alternate names that map to the same pin.
const CHICO_GAZETTEER = [
    // === Schools (match before generic "pleasant valley", "chico high", etc.) ===
    { names: ["pleasant valley high school", "pleasant valley high", "pvhs"], label: "Pleasant Valley High School", lat: 39.7605, lng: -121.8169 },
    { names: ["chico high school", "chico high"], label: "Chico High School", lat: 39.7390, lng: -121.8454 },
    { names: ["chico state university", "chico state", "csu chico", "csuc"], label: "Chico State University", lat: 39.7257, lng: -121.8430 },
    { names: ["butte college"], label: "Butte College", lat: 39.6475, lng: -121.6451 },

    // === Medical ===
    { names: ["enloe medical center", "enloe hospital", "enloe medical", "enloe"], label: "Enloe Medical Center", lat: 39.7432, lng: -121.8441 },

    // === Parks & Recreation ===
    { names: ["upper bidwell park", "upper park", "upper bidwell"], label: "Upper Bidwell Park", lat: 39.7803, lng: -121.7480 },
    { names: ["lower bidwell park", "lower park", "lower bidwell"], label: "Lower Bidwell Park", lat: 39.7358, lng: -121.8275 },
    { names: ["bidwell park", "bidwell"], label: "Bidwell Park", lat: 39.7530, lng: -121.7900 },
    { names: ["one mile", "one-mile", "sycamore pool"], label: "One Mile (Bidwell Park)", lat: 39.7358, lng: -121.8275 },
    { names: ["five mile", "five-mile"], label: "Five Mile (Bidwell Park)", lat: 39.7600, lng: -121.7500 },
    { names: ["caper acres", "children's playground"], label: "Caper Acres", lat: 39.7370, lng: -121.8260 },
    { names: ["wildwood park"], label: "Wildwood Park", lat: 39.7643, lng: -121.8049 },
    { names: ["community park"], label: "Community Park", lat: 39.7267, lng: -121.8125 },
    { names: ["bidwell mansion", "mansion"], label: "Bidwell Mansion", lat: 39.7327, lng: -121.8432 },

    // === Downtown & Landmarks ===
    { names: ["city plaza", "the plaza"], label: "City Plaza", lat: 39.7284, lng: -121.8414 },
    { names: ["downtown chico", "downtown"], label: "Downtown Chico", lat: 39.7284, lng: -121.8414 },
    { names: ["madison bear garden", "madison bear"], label: "Madison Bear Garden", lat: 39.7292, lng: -121.8425 },
    { names: ["the graduate"], label: "The Graduate", lat: 39.7310, lng: -121.8450 },
    { names: ["sierra nevada brewing", "sierra nevada brewery"], label: "Sierra Nevada Brewing Co.", lat: 39.7248, lng: -121.8139 },
    { names: ["chico cemetery"], label: "Chico Cemetery", lat: 39.7367, lng: -121.8364 },
    { names: ["silver dollar fairgrounds", "silver dollar fair"], label: "Silver Dollar Fairgrounds", lat: 39.7171, lng: -121.8126 },
    { names: ["north valley plaza", "chico mall"], label: "North Valley Plaza", lat: 39.7605, lng: -121.8290 },

    // === Government / Emergency ===
    { names: ["chico police department", "chico police", "chico pd"], label: "Chico Police Dept.", lat: 39.7359, lng: -121.8153 },
    { names: ["chico fire station", "fire station 1"], label: "Chico Fire Station 1", lat: 39.7305, lng: -121.8445 },
    { names: ["butte county courthouse", "courthouse"], label: "Butte County Courthouse", lat: 39.7590, lng: -121.8250 },
    { names: ["torres shelter", "torres community shelter"], label: "Torres Shelter", lat: 39.7180, lng: -121.8140 },
    { names: ["jesus center"], label: "Jesus Center", lat: 39.7250, lng: -121.8380 },

    // === Infrastructure ===
    { names: ["chico municipal airport", "chico airport"], label: "Chico Airport", lat: 39.7953, lng: -121.8583 },

    // === Streets & Roads (match specific first) ===
    { names: ["west 3rd street", "west 3rd st", "w 3rd street", "w. 3rd", "west 3rd and west 4th", "west 3rd and 4th", "w 3rd and w 4th"], label: "West 3rd St Area", lat: 39.7295, lng: -121.8480 },
    { names: ["west 4th avenue", "west 4th ave", "w 4th ave", "west 4th street", "west 4th st", "w. 4th"], label: "West 4th Ave", lat: 39.7290, lng: -121.8480 },
    { names: ["east 20th street", "east 20th st", "e 20th", "20th street"], label: "East 20th Street", lat: 39.7248, lng: -121.8200 },
    { names: ["west sacramento avenue", "west sacramento ave", "w sacramento", "w. sacramento"], label: "W. Sacramento Ave", lat: 39.7400, lng: -121.8600 },
    { names: ["ord ferry road", "ord ferry rd", "ord ferry"], label: "Ord Ferry Road", lat: 39.6700, lng: -121.9200 },
    { names: ["cohasset road", "cohasset rd", "cohasset"], label: "Cohasset Road", lat: 39.7800, lng: -121.8400 },
    { names: ["the esplanade", "esplanade"], label: "The Esplanade", lat: 39.7450, lng: -121.8460 },
    { names: ["mangrove avenue", "mangrove ave", "mangrove"], label: "Mangrove Avenue", lat: 39.7440, lng: -121.8395 },
    { names: ["east avenue", "east ave", "e. ave"], label: "East Avenue", lat: 39.7580, lng: -121.8200 },
    { names: ["park avenue", "park ave"], label: "Park Avenue", lat: 39.7260, lng: -121.8350 },
    { names: ["nord avenue", "nord ave", "nord"], label: "Nord Avenue", lat: 39.7520, lng: -121.8700 },
    { names: ["forest avenue", "forest ave"], label: "Forest Avenue", lat: 39.7480, lng: -121.8320 },
    { names: ["bruce road", "bruce rd"], label: "Bruce Road", lat: 39.7350, lng: -121.8050 },
    { names: ["humboldt road", "humboldt rd", "humboldt ave"], label: "Humboldt Road", lat: 39.7360, lng: -121.8153 },
    { names: ["manzanita avenue", "manzanita ave", "manzanita"], label: "Manzanita Avenue", lat: 39.7600, lng: -121.8100 },
    { names: ["pillsbury road", "pillsbury rd"], label: "Pillsbury Road", lat: 39.7578, lng: -121.8452 },
    { names: ["stilson canyon", "stilson canyon road", "stilson canyon rd"], label: "Stilson Canyon Road", lat: 39.7650, lng: -121.7550 },
    { names: ["highway 99", "hwy 99", "route 99"], label: "Highway 99", lat: 39.7285, lng: -121.8100 },
    { names: ["highway 32", "hwy 32", "route 32"], label: "Highway 32", lat: 39.7580, lng: -121.7900 },

    // === Neighborhoods ===
    { names: ["south chico", "southside"], label: "South Chico", lat: 39.7170, lng: -121.8300 },
    { names: ["north chico"], label: "North Chico", lat: 39.7850, lng: -121.8500 },
    { names: ["chapmantown", "chapman neighborhood"], label: "Chapmantown", lat: 39.7200, lng: -121.8170 },
    { names: ["barber neighborhood"], label: "Barber Neighborhood", lat: 39.7088, lng: -121.8347 },
    { names: ["midway"], label: "Midway", lat: 39.6944, lng: -121.7992 },

    // === Sports context: "pleasant valley" without "high" = still pin to PVHS ===
    { names: ["pleasant valley"], label: "Pleasant Valley High School", lat: 39.7605, lng: -121.8169 },
];

// Extract the sentence containing a match for a clean snippet
function extractSentence(text, matchIndex, matchLength) {
    // Walk backward to find sentence start (. ! ? or start of text)
    let start = matchIndex;
    while (start > 0 && !/[.!?\n]/.test(text[start - 1])) start--;
    if (start > 0) start++; // skip past the punctuation
    // Walk forward to find sentence end
    let end = matchIndex + matchLength;
    while (end < text.length && !/[.!?\n]/.test(text[end])) end++;
    if (end < text.length) end++; // include the punctuation
    return text.substring(start, end).replace(/[\n\r]+/g, ' ').trim().substring(0, 200);
}

// Extract locations from briefing text using gazetteer (primary) + LLM (enrichment)
async function extractLocations(briefingId, briefingText) {
    // Strip ANSI codes and markdown noise for cleaner matching
    const clean = briefingText.replace(/\x1b\[[0-9;]*m/g, '').replace(/[#*`_]/g, '');
    const lower = clean.toLowerCase();
    const db = await getDB();
    const matched = new Set(); // track matched labels to deduplicate per briefing

    // Sort gazetteer entries: match longest names first to prevent partial hits
    // e.g. "pleasant valley high school" before "pleasant valley"
    const sorted = [...CHICO_GAZETTEER].sort((a, b) => {
        const aMax = Math.max(...a.names.map(n => n.length));
        const bMax = Math.max(...b.names.map(n => n.length));
        return bMax - aMax;
    });

    for (const entry of sorted) {
        if (matched.has(entry.label)) continue; // already pinned this location for this briefing

        for (const name of entry.names) {
            const idx = lower.indexOf(name);
            if (idx === -1) continue;

            // Word-boundary check: avoid matching "nord" inside "nordsomething"
            const before = idx > 0 ? lower[idx - 1] : ' ';
            const after = idx + name.length < lower.length ? lower[idx + name.length] : ' ';
            if (/[a-z]/.test(before) || /[a-z]/.test(after)) continue;

            const snippet = extractSentence(clean, idx, name.length);
            await db.run(
                "INSERT INTO locations (briefing_id, label, snippet, lat, lng) VALUES (?, ?, ?, ?, ?)",
                [briefingId, entry.label, snippet, entry.lat, entry.lng]
            );
            matched.add(entry.label);
            break; // don't match other aliases for same entry
        }
    }

    // Also try LLM extraction for locations the gazetteer might miss
    try {
        const prompt = `Extract specific geographic locations from this Chico, CA news text.
Return ONLY a JSON array. Each object: {"label":"Place Name","lat":39.xxxx,"lng":-121.xxxx,"snippet":"what happened there"}
Rules:
- Only real places in/near Chico CA (lat 39.6-39.9, lng -122.0 to -121.5)
- Use precise coordinates, not approximations
- Skip generic references like "the city" or "the area"
- If no specific places found, return []

Text:
${clean.substring(0, 2000)}

JSON:`;

        const response = await fetch('http://localhost:8080/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, n_predict: 600, temperature: 0.2, stop: ["\n\n", "```"] })
        });

        if (response.ok) {
            const result = await response.json();
            const content = (result.content || '').trim();
            const arrMatch = content.match(/\[[\s\S]*\]/);
            if (arrMatch) {
                const llmLocs = JSON.parse(arrMatch[0]);
                for (const loc of llmLocs) {
                    if (!loc.lat || !loc.lng || !loc.label) continue;
                    if (loc.lat < 39.5 || loc.lat > 39.9) continue;
                    if (loc.lng < -122.1 || loc.lng > -121.4) continue;
                    if (matched.has(loc.label)) continue;

                    // Check if this is too close to an existing gazetteer pin (within ~200m)
                    let tooClose = false;
                    for (const entry of CHICO_GAZETTEER) {
                        if (matched.has(entry.label) &&
                            Math.abs(entry.lat - loc.lat) < 0.002 &&
                            Math.abs(entry.lng - loc.lng) < 0.002) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (tooClose) continue;

                    await db.run(
                        "INSERT INTO locations (briefing_id, label, snippet, lat, lng) VALUES (?, ?, ?, ?, ?)",
                        [briefingId, loc.label, loc.snippet || '', loc.lat, loc.lng]
                    );
                    matched.add(loc.label);
                }
            }
        }
    } catch (err) {
        // LLM enrichment is best-effort; gazetteer already handled the core matches
    }

    console.log(`📍 Extracted ${matched.size} locations from briefing #${briefingId}`);
}

// Extract a headline from briefing content
function extractHeadline(content, source, timestamp) {
    if (!content) return source + ' — ' + timestamp;
    // Strip ANSI codes
    const clean = content.replace(/\x1b\[[0-9;]*m/g, '');
    // Look for markdown heading
    const headingMatch = clean.match(/^#{1,2}\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].replace(/[*`_]/g, '').trim().substring(0, 120);
    // Use first sentence
    const firstLine = clean.replace(/[#*`_]/g, '').trim();
    const sentenceEnd = firstLine.search(/[.\n]/);
    if (sentenceEnd > 0 && sentenceEnd <= 100) return firstLine.substring(0, sentenceEnd);
    if (firstLine.length > 0) return firstLine.substring(0, 100);
    return source + ' — ' + timestamp;
}

// Paginated briefings with headlines and location counts
app.get('/api/briefings', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;
        const db = await getDB();
        const rows = await db.all(`
            SELECT b.id, b.source, b.timestamp, b.content,
                   COUNT(l.id) AS location_count
            FROM briefings b
            LEFT JOIN locations l ON l.briefing_id = b.id
            GROUP BY b.id
            ORDER BY b.timestamp DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        const briefings = rows.map(row => ({
            id: row.id,
            headline: extractHeadline(row.content, row.source, row.timestamp),
            source: row.source,
            timestamp: row.timestamp,
            preview: (row.content || '').replace(/\x1b\[[0-9;]*m/g, '').replace(/[#*`_]/g, '').trim().substring(0, 200),
            content: row.content,
            location_count: row.location_count
        }));
        res.json(briefings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// THE HEARTBEAT (For Auto-Reloading the Browser)
app.get('/api/health', (req, res) => res.sendStatus(200));

app.get('/api/history', async (req, res) => {
    try {
        const db = await getDB();
        const history = await db.all("SELECT * FROM briefings ORDER BY timestamp DESC LIMIT 8");
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/archive/:id', async (req, res) => {
    try {
        const db = await getDB();
        const record = await db.get("SELECT * FROM briefings WHERE id = ?", [req.params.id]);
        res.json(record);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Locations from the last 24 hours
app.get('/api/locations', async (req, res) => {
    try {
        const db = await getDB();
        const locations = await db.all(`
            SELECT l.id, l.label, l.snippet, l.lat, l.lng, l.created_at, l.briefing_id,
                   b.timestamp, b.source
            FROM locations l
            LEFT JOIN briefings b ON l.briefing_id = b.id
            WHERE l.created_at >= datetime('now', '-24 hours')
            ORDER BY l.created_at DESC
        `);
        res.json(locations);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sift', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    const targetUrl = req.query.url;
    const args = [path.join(__dirname, '../scripts/sift.sh')];
    let sourceName = "Chico ER Sweep";

    if (targetUrl) {
        args.push(targetUrl);
        try { sourceName = "Target: " + new URL(targetUrl).hostname; } catch(e) {}
        res.write(`data: ${JSON.stringify({ content: `> ACQUIRING TARGET: ${targetUrl}\n> ROUTING THROUGH FIRECRAWL DREDGE...\n\n` })}\n\n`);
    }

    const sifter = spawn('bash', args, { cwd: path.join(__dirname, '..') });
    let fullBriefing = "";

    sifter.stdout.on('data', (data) => {
        const chunk = data.toString();
        fullBriefing += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    sifter.on('close', async () => {
        if(fullBriefing.length > 10) {
            const db = await getDB();
            const result = await db.run("INSERT INTO briefings (source, content) VALUES (?, ?)", [sourceName, fullBriefing]);
            const briefingId = result.lastID;

            // Extract locations in the background (don't block SSE close)
            extractLocations(briefingId, fullBriefing).catch(err =>
                console.log('⚠️  Background location extraction failed:', err.message)
            );
        }
        res.write('data: {"done": true}\n\n');
        res.end();
    });
});

// Boot
initDB()
    .then(() => {
        app.listen(PORT, () => console.log(`🏮 MISSION CONTROL: http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
