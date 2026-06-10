const express = require('express');
const { spawn } = require('child_process');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const app = express();
const PORT = 3030;

app.use(express.static('public'));

async function getDB() {
    return open({
        filename: path.join(__dirname, '../core/lantern.sqlite'),
        driver: sqlite3.Database
    });
}

// NEW: History Endpoint
app.get('/api/history', async (req, res) => {
    try {
        const db = await getDB();
        const history = await db.all("SELECT * FROM briefings ORDER BY timestamp DESC LIMIT 5");
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/sift', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sifter = spawn('bash', [path.join(__dirname, '../scripts/sift.sh')]);
    let fullBriefing = "";

    sifter.stdout.on('data', (data) => {
        const chunk = data.toString();
        fullBriefing += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    sifter.on('close', async (code) => {
        try {
            const db = await getDB();
            await db.run(
                "INSERT INTO briefings (source, headline, content) VALUES (?, ?, ?)",
                ["Chico Enterprise-Record", "Morning Briefing", fullBriefing]
            );
        } catch (err) { console.error("DB Error:", err); }
        res.write('data: {"done": true}\n\n');
        res.end();
    });
});

app.listen(PORT, () => {
    console.log("🏮 LANTERN OS v0.0.1");
    console.log(`📡 Mission Control: http://localhost:${PORT}`);
});
