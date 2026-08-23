import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the app shell and static dashboard aligned", async () => {
  const [page, layout, report, index, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/report.html", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /src="\/report\.html"/);
  assert.match(page, /title="中国绿电与算力项目情报"/);
  assert.match(layout, /title:\s*"晶汇·光储智｜JA Green × News"/);
  assert.match(layout, /<html lang="zh-CN">/);
  assert.match(report, /<h1>晶汇·光储智<\/h1>/);
  assert.match(report, /src="daily-news-data\.js/);
  assert.match(report, /src="market-view-data\.js/);
  assert.match(index, /url=report\.html/);
  assert.match(packageJson, /"news:validate"/);
  assert.match(packageJson, /"news:verify-generated"/);
});

test("keeps canonical news and generated browser data synchronized", async () => {
  const [canonicalRaw, generatedRaw] = await Promise.all([
    readFile(new URL("../data/news.json", import.meta.url), "utf8"),
    readFile(new URL("../public/daily-news-data.js", import.meta.url), "utf8"),
  ]);
  const canonical = JSON.parse(canonicalRaw);
  const match = generatedRaw.match(/^window\.DAILY_NEWS_DATA=([\s\S]*);\s*$/);
  assert.ok(match, "generated daily news must use the expected browser assignment");
  const generated = JSON.parse(match[1]);

  assert.deepEqual(
    generated.map((item) => item.id).sort(),
    canonical.map((item) => item.id).sort(),
  );
  for (const item of canonical) {
    assert.ok(item.fingerprint);
    assert.ok(item.sourceName);
    assert.match(item.sourceUrl, /^https:\/\//);
    assert.ok(item.businessTags.length > 0);
  }
});
