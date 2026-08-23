#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/validate-news.mjs <news.json|daily-news-data.js>");
  process.exit(2);
}

function readRecords(file) {
  const raw = fs.readFileSync(file, "utf8").trim();
  if (file.endsWith(".json")) return JSON.parse(raw);
  const match = raw.match(/^\s*window\.DAILY_NEWS_DATA\s*=\s*([\s\S]*?)\s*;\s*$/);
  if (!match) throw new Error("Unsupported JS format; expected window.DAILY_NEWS_DATA=[...];");
  return JSON.parse(match[1]);
}

const records = readRecords(input);
if (!Array.isArray(records)) throw new Error("News data must be an array");

const required = ["id", "date", "country", "geo", "category", "eventType", "company", "title", "summary", "sourceName", "sourceUrl", "fingerprint"];
const allowedGeo = new Set(["中国", "亚洲", "欧洲", "非洲", "美洲", "大洋洲", "中东", "全球"]);
const allowedCategory = new Set(["市场信息", "同行动态"]);
const ids = new Set();
const fingerprints = new Set();
const titleUrls = new Set();
const errors = [];
const warnings = [];

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

records.forEach((record, index) => {
  const label = `record ${index + 1}`;
  for (const field of required) {
    if (typeof record[field] !== "string" || !record[field].trim()) errors.push(`${label}: missing ${field}`);
  }
  if (!validDate(record.date)) errors.push(`${label}: invalid date ${record.date ?? ""}`);
  if (record.geo && !allowedGeo.has(record.geo)) errors.push(`${label}: unsupported geo ${record.geo}`);
  if (record.category && !allowedCategory.has(record.category)) errors.push(`${label}: unsupported category ${record.category}`);
  if (record.sourceUrl && !/^https:\/\//.test(record.sourceUrl)) errors.push(`${label}: sourceUrl must use HTTPS`);
  if (record.title?.includes("\n")) errors.push(`${label}: title must be one line`);
  if (!Array.isArray(record.businessTags) || !record.businessTags.length) errors.push(`${label}: missing businessTags`);

  if (record.id) {
    if (ids.has(record.id)) errors.push(`${label}: duplicate id ${record.id}`);
    ids.add(record.id);
  }
  if (record.fingerprint) {
    if (fingerprints.has(record.fingerprint)) errors.push(`${label}: duplicate fingerprint ${record.fingerprint}`);
    fingerprints.add(record.fingerprint);
  }
  const titleUrl = `${record.title || ""}|${record.sourceUrl || ""}`;
  if (titleUrls.has(titleUrl)) errors.push(`${label}: duplicate title and source URL`);
  titleUrls.add(titleUrl);
  if (!record.collectedAt) warnings.push(`${label}: legacy record has no collectedAt`);
});

const dates = records.map((record) => record.date).filter(Boolean).sort();
console.log(JSON.stringify({
  file: path.resolve(input),
  records: records.length,
  dateRange: dates.length ? [dates[0], dates.at(-1)] : [],
  errors: errors.length,
  warnings: warnings.length
}, null, 2));

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
