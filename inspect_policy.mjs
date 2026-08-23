import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

// Imports the "国家政策_核订" sheet (verified national PV policy list) from the desktop policy
// review file and merges it into public/market-view-data.js alongside the Market View archive.
// Column layout (0-based, row 5+): 0 序号, 1 年度, 2 政策分类, 3 成文日期, 4 官网发布日期,
// 5 文件名称, 6 文号, 7 文件性质, 8 主要内容, 9 政策解读/投资影响, 10 核验状态,
// 11 政府官网原文, 12 官方解读.
const source = "/Users/staceypu/Desktop/2025-2026上半年中国光伏政策梳理_查漏补缺版.xlsx";

function isoDate(v) {
  if (!v) return "";
  if (typeof v === "number") return new Date(Date.UTC(1899, 11, 30) + v * 86400000).toISOString().slice(0, 10);
  const s = String(v).trim().replace(/[./]/g, "-");
  const m = s.match(/^(20\d{2})-(\d{1,2})-(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
}
function clean(v, max = 700) { return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
function httpUrl(v) { const s = String(v ?? "").trim(); return /^https?:\/\//.test(s) ? s : ""; }

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const ws = workbook.worksheets.getItem("国家政策_核订");
const rows = ws.getUsedRange().values.slice(4);

const records = [];
for (const row of rows) {
  const title = clean(row[5], 90);
  const date = isoDate(row[3]) || isoDate(row[4]);
  const sourceUrl = httpUrl(row[11]) || httpUrl(row[12]);
  if (!title || !date || !sourceUrl) continue;
  const main = clean(row[8], 400);
  const insight = clean(row[9], 250);
  const summary = insight ? `${main}${main.endsWith("。") ? "" : "。"}${insight}` : main;
  records.push({
    date, country: "中国", geo: "中国", category: "市场信息", eventType: "政策",
    company: clean(row[2], 40) || "政策", title, summary: clean(summary, 600),
    sourceUrl, sourceSheet: "市场信息",
    id: `国家政策|${date}|中国|${title}`,
  });
}

const existingRaw = await fs.readFile("public/market-view-data.js", "utf8");
const existing = JSON.parse(existingRaw.replace(/^window\.MARKET_VIEW_DATA=/, "").replace(/;\s*$/, ""));
const merged = [...new Map([...existing, ...records].map((r) => [r.id, r])).values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

await fs.writeFile("public/market-view-data.js", `window.MARKET_VIEW_DATA=${JSON.stringify(merged)};\n`, "utf8");
console.log(JSON.stringify({ parsed: rows.length, kept: records.length, totalAfterMerge: merged.length, before: existing.length }, null, 2));
