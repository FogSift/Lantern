const fs = require('fs');
const { marked } = require('marked');

const filePath = process.argv[2];
if (!filePath) process.exit(1);

const markdown = fs.readFileSync(filePath, 'utf8');
// Standard parse is the most reliable for Substack ingestion
const html = marked.parse(markdown);

console.log(`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
