#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node scripts/build-news.mjs <news.json> <daily-news-data.js>");
  process.exit(2);
}

const records = JSON.parse(fs.readFileSync(input, "utf8"));
if (!Array.isArray(records)) throw new Error("News data must be an array");

const rendered = records.map((record) => ({
  ...record,
  tags: [...(record.businessTags || []), ...(record.tags || [])].join(" ")
}));

rendered.sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.id || "").localeCompare(b.id || ""));

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `window.DAILY_NEWS_DATA=${JSON.stringify(rendered, null, 2)};\n`, "utf8");
console.log(`Wrote ${rendered.length} records to ${path.resolve(output)}`);
