import assert from "node:assert/strict";
import test from "node:test";

import { DATA_SOURCES, mapNotionPage, mergeRecords } from "../scripts/sync-notion.mjs";

const richText = (value) => ({ type: "rich_text", rich_text: [{ plain_text: value }] });
const select = (value) => ({ type: "select", select: { name: value } });
const multiSelect = (...values) => ({ type: "multi_select", multi_select: values.map((name) => ({ name })) });
const title = (value) => ({ type: "title", title: [{ plain_text: value }] });
const date = (value) => ({ type: "date", date: { start: value } });
const url = (value) => ({ type: "url", url: value });

test("maps an approved overseas row to canonical news data", () => {
  const page = {
    id: "page-global",
    properties: {
      "审核状态": select("批准发布"),
      "标题（一句话）": title("泰国拟更新光储产品标签规则"),
      "日期": date("2026-08-24"),
      "国别": select("泰国"),
      "大类": select("政策"),
      "细分": multiSelect("分布式光伏", "储能"),
      "主要内容": richText("规则处于公开征求意见阶段。"),
      "解读": richText("企业应提前准备合规材料。"),
      "来源网站": url("https://example.com/policy?utm_source=test"),
    },
  };
  const result = mapNotionPage(page, DATA_SOURCES[1], "2026-08-25T00:00:00.000Z");
  assert.equal(result.record.country, "泰国");
  assert.equal(result.record.geo, "亚洲");
  assert.equal(result.record.category, "市场信息");
  assert.equal(result.record.eventType, "政策");
  assert.deepEqual(result.record.businessTags, ["分布式光伏", "储能"]);
  assert.equal(result.record.sourceUrl, "https://example.com/policy");
});

test("supports the current domestic Select review column", () => {
  const page = {
    id: "page-china",
    properties: {
      "Select": select("批准发布"),
      "标题（一句话）": title("隆基绿能通过并购切入储能赛道"),
      "日期": date("2026-08-22"),
      "大类": select("同行"),
      "标签": select("储能"),
      "所属省、市、自治区": multiSelect("江苏"),
      "内容摘要": richText("隆基绿能拟收购一家储能系统企业。"),
      "链接": url("https://example.cn/deal"),
    },
  };
  const result = mapNotionPage(page, DATA_SOURCES[0], "2026-08-25T00:00:00.000Z");
  assert.equal(result.record.category, "同行动态");
  assert.equal(result.record.eventType, "收购");
  assert.equal(result.record.company, "隆基绿能");
});

test("skips rows that are not approved or miss publication fields", () => {
  const pending = { id: "pending", properties: { "审核状态": select("待审核") } };
  assert.match(mapNotionPage(pending, DATA_SOURCES[1]).skipped, /不是批准发布/);

  const incomplete = { id: "incomplete", properties: { "审核状态": select("批准发布") } };
  assert.match(mapNotionPage(incomplete, DATA_SOURCES[1]).skipped, /缺少或无效字段/);
});

test("updates an existing source URL without duplicating history", () => {
  const existing = [{ id: "old", sourceUrl: "https://example.com/a", fingerprint: "old-fp", date: "2026-01-01", collectedAt: "old-time" }];
  const incoming = [{ id: "notion|new", sourceUrl: "https://example.com/a/", fingerprint: "new-fp", date: "2026-01-02", collectedAt: "new-time", notionPageId: "new" }];
  const result = mergeRecords(existing, incoming);
  assert.equal(result.records.length, 1);
  assert.equal(result.updated, 1);
  assert.equal(result.records[0].id, "old");
  assert.equal(result.records[0].collectedAt, "old-time");
});
