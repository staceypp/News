import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = "/Volumes/ORICO/100 - Work - 工作/111 - GTD - 项目及日常工作/111.1.3 - HMonth - 周报半月看/周报/2026 Market View.xlsx";
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));

const china = new Set(["中国","香港","台湾","新疆"]);
const asia = new Set(["日本","韩国","泰国","越南","印尼","印度尼西亚","马来西亚","菲律宾","新加坡","孟加拉国","孟加拉","土耳其","柬埔寨","老挝","缅甸","印度","巴基斯坦","哈萨克斯坦","乌兹别克斯坦","阿联酋","阿布扎比","沙特","沙特阿拉伯","阿曼","约旦","东南亚"]);
const europe = new Set(["意大利","德国","英国","西班牙","法国","荷兰","波兰","葡萄牙","希腊","瑞典","挪威","丹麦","芬兰","比利时","奥地利","瑞士","欧洲"]);
const africa = new Set(["非洲","南非","肯尼亚","坦桑尼亚","埃及","塞拉利昂","马达加斯加","尼日利亚","摩洛哥","纳米比亚","刚果（金）","阿尔及利亚","乌干达","塞内加尔","赞比亚","埃塞俄比亚","厄立特里亚"]);
const americas = new Set(["美国","加拿大","巴西","墨西哥","智利","秘鲁","阿根廷","哥伦比亚"]);
const oceania = new Set(["澳大利亚","新西兰"]);
function geo(country="") { const c=String(country).trim(); if(china.has(c))return"中国"; if(asia.has(c))return"亚洲";if(europe.has(c))return"欧洲";if(africa.has(c))return"非洲";if(americas.has(c))return"美洲";if(oceania.has(c))return"大洋洲";return"全球"; }
function isoDate(v){if(!v)return"";if(typeof v==="number"){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return d.toISOString().slice(0,10)}const s=String(v).trim().replace(/[./]/g,"-");const m=s.match(/^(20\d{2})-(\d{1,2})-(\d{1,2})/);return m?`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`:""}
function clean(v,max=700){return String(v??"").replace(/\s+/g," ").trim().slice(0,max)}
// CJK sentence enders (。！？) don't need trailing whitespace like Latin ones do; matching
// only Latin `.!?` followed by space/EOL avoids splitting on decimals such as "1.17亿千瓦".
function oneSentence(v,fallback){const s=clean(v||fallback,600);const m=s.match(/^[\s\S]*?(?:[。！？]|[.!?](?=\s|$))/);const first=m?m[0]:s.slice(0,140);return first.trim().replace(/[。！？.!?]+$/,'')}
function firstUrl(v){const m=String(v??"").match(/https?:\/\/[^\s]+/);return m?m[0].replace(/[),，。]+$/g,""):""}
const records=[];
function add(r){if(!r.title||!r.date||!r.sourceUrl)return;records.push({...r,id:`${r.sourceSheet}|${r.date}|${r.country}|${r.title}`})}

for(const [sheetName,category] of [["同行动态Competitor","同行动态"],["市场信息Information","市场信息"]]){
  const rows=workbook.worksheets.getItem(sheetName).getUsedRange().values.slice(2);
  // 核心及观点 (row[6]) is always a hand-written Chinese synopsis; 主要内容 (row[5]) is the raw
  // pasted source article and for overseas stories is frequently English-only. Prefer row[6] for
  // the summary too (not just the title) so every card reads in Chinese; fall back to row[5] only
  // when row[6] is empty.
  for(const row of rows)add({date:isoDate(row[1]),country:clean(row[3],60)||"全球",geo:geo(row[3]),category,eventType:clean(row[4],40)||category,company:clean(row[2],80),title:oneSentence(row[6],row[5]),summary:clean(row[6]||row[5],600),sourceUrl:firstUrl(row[7]),sourceSheet:category});
}

const unique=[...new Map(records.map(r=>[r.id,r])).values()].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
await fs.writeFile("public/market-view-data.js",`window.MARKET_VIEW_DATA=${JSON.stringify(unique)};\n`,"utf8");
console.log(JSON.stringify({records:unique.length,missingDate:unique.filter(r=>!r.date).length,missingUrl:unique.filter(r=>!r.sourceUrl).length,byCategory:Object.fromEntries(Object.entries(Object.groupBy(unique,r=>r.category)).map(([k,v])=>[k,v.length])),byGeo:Object.fromEntries(Object.entries(Object.groupBy(unique,r=>r.geo)).map(([k,v])=>[k,v.length]))},null,2));
