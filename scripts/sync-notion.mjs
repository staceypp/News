#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";

const NOTION_API_VERSION = "2026-03-11";
const NOTION_API_BASE = "https://api.notion.com/v1";
const APPROVED = "批准发布";

export const DATA_SOURCES = [
  {
    key: "china",
    label: "国内",
    id: "fc8ebb0c-8fac-4d26-88dd-3f1c5a8c0fbf",
    country: "中国",
    statusProperty: "Select",
    titleProperties: ["标题（一句话）"],
    summaryProperties: ["内容摘要"],
    interpretationProperties: ["解读"],
    sourceProperties: ["链接"],
    tagProperties: ["标签"],
    locationProperties: ["所属省、市、自治区"],
  },
  {
    key: "global",
    label: "海外",
    id: "982c5630-545d-41f8-8897-77b4c12df13a",
    statusProperty: "审核状态",
    titleProperties: ["标题（一句话）"],
    summaryProperties: ["主要内容"],
    interpretationProperties: ["解读"],
    sourceProperties: ["来源网站"],
    tagProperties: ["细分"],
    countryProperties: ["国别"],
  },
];

const COUNTRY_GEO = new Map([
  ["中国", "中国"],
  ["德国", "欧洲"], ["意大利", "欧洲"], ["西班牙", "欧洲"], ["法国", "欧洲"],
  ["英国", "欧洲"], ["荷兰", "欧洲"], ["土耳其", "欧洲"],
  ["肯尼亚", "非洲"], ["坦桑尼亚", "非洲"], ["南非", "非洲"], ["埃及", "非洲"],
  ["摩洛哥", "非洲"],
  ["美国", "美洲"], ["巴西", "美洲"], ["智利", "美洲"], ["墨西哥", "美洲"],
  ["澳大利亚", "大洋洲"],
  ["沙特阿拉伯", "中东"], ["阿联酋", "中东"],
  ["泰国", "亚洲"], ["越南", "亚洲"], ["日本", "亚洲"], ["韩国", "亚洲"],
  ["印度", "亚洲"], ["马来西亚", "亚洲"], ["印尼", "亚洲"], ["菲律宾", "亚洲"],
  ["新加坡", "亚洲"], ["老挝", "亚洲"], ["柬埔寨", "亚洲"],
  ["多国/区域", "全球"],
]);

const BUSINESS_TAG_MAP = new Map([
  ["集中式光伏", "集中式"],
  ["分布式光伏", "分布式"],
  ["工商业光伏", "分布式"],
  ["户用光伏", "户用光伏"],
  ["储能", "储能"],
  ["绿电直连", "绿电直连"],
  ["零碳园区", "零碳园区"],
  ["算电协同", "算电协同"],
  ["AIDC", "AIDC"],
  ["智能微电网", "微电网"],
  ["离网光伏", "微电网"],
  ["电力交易", "电力交易"],
  ["系统销售", "系统销售"],
]);

const KNOWN_SUBJECTS = [
  "国家能源局", "国家发展改革委", "江苏省生态环境厅", "江苏省能源局", "河北省发展改革委",
  "内蒙古自治区发展改革委", "安徽省能源局", "无锡市人民政府", "浙江省发展改革委",
  "隆基绿能", "隆基", "晶澳科技", "JA Solar", "晶科能源", "晶科", "天合光能", "天合",
  "阳光电源", "宁德时代", "锦浪科技", "华为数字能源", "通威", "阿特斯", "正泰新能",
  "PLN", "MEA", "ERC", "TNB", "Masdar", "JUWI",
];

function textParts(parts = []) {
  return parts.map((part) => part?.plain_text ?? part?.text?.content ?? "").join("").trim();
}

export function propertyValue(page, names = []) {
  const properties = page?.properties ?? {};
  const property = names.map((name) => properties[name]).find(Boolean);
  if (!property) return null;
  const type = property.type;
  if (type === "title") return textParts(property.title);
  if (type === "rich_text" || type === "text") return textParts(property.rich_text ?? property.text);
  if (type === "select") return property.select?.name ?? null;
  if (type === "status") return property.status?.name ?? null;
  if (type === "multi_select") return (property.multi_select ?? []).map((item) => item.name).filter(Boolean);
  if (type === "date") return property.date?.start ?? null;
  if (type === "url") return property.url ?? null;
  if (typeof property[type] === "string") return property[type];
  return null;
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function oneLine(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return String(value ?? "").trim();
  }
}

function sourceName(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "来源网站";
  }
}

function inferEventType(category, text, explicit) {
  if (explicit) return oneLine(explicit);
  if (category === "政策") return "政策";
  const rules = [
    [/PPA|购电协议|购售电协议|绿电采购/i, "PPA"],
    [/融资|贷款|债券|募资|授信/, "融资"],
    [/收购|并购/, "收购"],
    [/出售|售出|资产转让|股权转让/, "出售"],
    [/中标|定标/, "中标"],
    [/招标|采购/, "招标"],
    [/投运|并网|启用|投入运营/, "投运"],
    [/开工|动工/, "开工"],
    [/认证|转换效率|技术突破|研发/, "技术"],
    [/发布|推出|新品|产品/, "产品"],
    [/产能|扩产|生产基地|工厂/, "产能"],
    [/合作|签署|协议|备忘录|MOU/i, "合作"],
    [/投资|入股|增资/, "投资"],
    [/开发|建设|项目|光伏电站|储能电站/, "开发"],
    [/装机|统计|价格|电价|市场规模|出货/, "市场数据"],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? "市场动态";
}

function inferSubject(category, country, locations, text, explicit) {
  if (explicit) return oneLine(explicit);
  const found = KNOWN_SUBJECTS.find((subject) => text.includes(subject));
  if (found) return found;
  const place = locations.find((item) => item !== "全国") ?? country;
  if (category === "政策") return `${place}政策机构`;
  if (category === "同行") return `${country}相关企业`;
  return `${country}项目主体`;
}

function fingerprint(record) {
  const raw = [record.country, record.company, record.title, record.eventType].join("|");
  return `notion|${crypto.createHash("sha256").update(raw).digest("hex").slice(0, 20)}`;
}

export function mapNotionPage(page, config, collectedAt = new Date().toISOString()) {
  const status = propertyValue(page, ["审核状态", "Select"]);
  if (status !== APPROVED) return { skipped: "审核状态不是批准发布" };

  const rawCategory = propertyValue(page, ["大类"]);
  const category = rawCategory === "同行" ? "同行动态" : "市场信息";
  const title = oneLine(propertyValue(page, config.titleProperties));
  const main = oneLine(propertyValue(page, config.summaryProperties));
  const interpretation = oneLine(propertyValue(page, config.interpretationProperties));
  const summary = [main, interpretation && `解读：${interpretation}`].filter(Boolean).join(" ");
  const date = String(propertyValue(page, ["日期"]) ?? "").slice(0, 10);
  const url = normalizeUrl(propertyValue(page, config.sourceProperties));
  const rawTags = asList(propertyValue(page, config.tagProperties)).map(oneLine);
  const locations = asList(propertyValue(page, config.locationProperties)).map(oneLine);
  // Prefer the actual province/city (所属省、市、自治区) as the drill-down "country" value for
  // domestic records, falling back to the flat "中国" only when no province is given (e.g. a
  // national-level policy tagged "全国"). This lets the 国别 filter show 北京/上海/河北/江苏 etc.
  // when 地域=中国 is selected, instead of collapsing every domestic record to one bucket.
  const province = locations.find((item) => item && item !== "全国");
  const country = province ?? config.country ?? oneLine(propertyValue(page, config.countryProperties));
  const businessTags = [...new Set(rawTags.map((tag) => BUSINESS_TAG_MAP.get(tag)).filter(Boolean))];
  const combined = `${title} ${summary}`;
  const explicitEvent = propertyValue(page, ["事件类型"]);
  const explicitSubject = propertyValue(page, ["主体/企业", "企业", "主体", "发布主体", "机构"]);
  const eventType = inferEventType(rawCategory, combined, explicitEvent);
  const company = inferSubject(rawCategory, country, locations, combined, explicitSubject);

  const missing = [];
  if (!title) missing.push("标题（一句话）");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) missing.push("日期");
  if (!summary) missing.push(config.summaryProperties[0]);
  if (!country) missing.push("国别");
  if (!/^https:\/\//.test(url)) missing.push(config.sourceProperties[0]);
  if (!businessTags.length) missing.push(config.tagProperties[0]);
  if (missing.length) return { skipped: `缺少或无效字段：${missing.join("、")}` };

  const record = {
    date,
    country,
    geo: config.country === "中国" ? "中国" : (COUNTRY_GEO.get(country) ?? "全球"),
    category,
    eventType,
    businessTags,
    tags: [...new Set([...rawTags, ...locations])],
    company,
    title,
    summary,
    sourceName: sourceName(url),
    sourceUrl: url,
    sourceType: "notion-approved",
    sourceSheet: `Notion·${config.label}`,
    id: `notion|${page.id}`,
    collectedAt,
    notionPageId: page.id,
  };
  record.fingerprint = fingerprint(record);
  return { record };
}

async function queryApprovedPages(token, config) {
  const results = [];
  let cursor;
  do {
    const body = {
      page_size: 100,
      filter: { property: config.statusProperty, select: { equals: APPROVED } },
    };
    if (cursor) body.start_cursor = cursor;
    const response = await fetch(`${NOTION_API_BASE}/data_sources/${config.id}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Notion ${config.label}数据源读取失败 (${response.status}): ${details.slice(0, 500)}`);
    }
    const payload = await response.json();
    results.push(...payload.results.filter((item) => item.object === "page"));
    cursor = payload.has_more ? payload.next_cursor : null;
  } while (cursor);
  return results;
}

export function mergeRecords(existing, incoming) {
  const records = [...existing];
  const byId = new Map(records.map((record, index) => [record.id, index]));
  const byUrl = new Map(records.map((record, index) => [normalizeUrl(record.sourceUrl), index]));
  const byFingerprint = new Map(records.map((record, index) => [record.fingerprint, index]));
  let added = 0;
  let updated = 0;

  for (const candidate of incoming) {
    const index = byId.get(candidate.id) ?? byUrl.get(normalizeUrl(candidate.sourceUrl)) ?? byFingerprint.get(candidate.fingerprint);
    if (index === undefined) {
      records.push(candidate);
      const addedIndex = records.length - 1;
      byId.set(candidate.id, addedIndex);
      byUrl.set(normalizeUrl(candidate.sourceUrl), addedIndex);
      byFingerprint.set(candidate.fingerprint, addedIndex);
      added += 1;
      continue;
    }
    const previous = records[index];
    const next = {
      ...previous,
      ...candidate,
      id: previous.id,
      collectedAt: previous.collectedAt ?? candidate.collectedAt,
      notionPageId: candidate.notionPageId,
    };
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      records[index] = next;
      updated += 1;
    }
  }

  records.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return { records, added, updated };
}

async function main() {
  const token = process.env.NOTION_TOKEN || process.env.NOTION;
  if (!token) throw new Error("缺少 NOTION_TOKEN（GitHub Actions 中应来自 secrets.NOTION）");
  const dataFile = process.env.NEWS_DATA_FILE || "data/news.json";
  const reportFile = process.env.NOTION_SYNC_REPORT;
  const collectedAt = new Date().toISOString();
  const existing = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const incoming = [];
  const skipped = [];
  const sourceCounts = {};

  for (const config of DATA_SOURCES) {
    const pages = await queryApprovedPages(token, config);
    sourceCounts[config.key] = pages.length;
    for (const page of pages) {
      const mapped = mapNotionPage(page, config, collectedAt);
      if (mapped.record) incoming.push(mapped.record);
      else skipped.push({ source: config.label, pageId: page.id, reason: mapped.skipped });
    }
  }

  const merged = mergeRecords(existing, incoming);
  fs.writeFileSync(dataFile, `${JSON.stringify(merged.records, null, 2)}\n`);
  const report = {
    approved: sourceCounts,
    mapped: incoming.length,
    added: merged.added,
    updated: merged.updated,
    skipped,
    total: merged.records.length,
  };
  if (reportFile) fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

const isDirectRun = process.argv[1] && new URL(import.meta.url).pathname === fs.realpathSync(process.argv[1]);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
