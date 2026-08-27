// 集中式项目公司股权驾驶舱 · 示例数据（DEMO DATA）
// ------------------------------------------------------------------
// 以下 18 条记录为设计演示用的虚构数据，用于验证"股权驾驶舱"的信息架构、
// 交互与可视化效果，不含任何真实项目公司名称、合作方名称或财务数据。
// 正式上线前，建议将本文件替换为对接工商信息系统 / 合同管理系统 / 财务
// 系统的真实数据源（如通过每日/每周同步任务写入本文件，或改为接口拉取），
// 字段结构保持一致即可，页面逻辑无需改动。
window.EQUITY_DASHBOARD_DATA = [
  { id:'DEMO-001', name:'乌兰察布光伏项目公司（示例）', province:'内蒙古', region:'华北', tech:'光伏', stage:'建成运营', capacityMW:200, ourEntity:'华北区域开发公司', ourEquity:70, partners:[{name:'地方能源集团（示例）', equity:30}], regCapital:20000, paidCapital:20000, incorpDate:'2023-03-16' },
  { id:'DEMO-002', name:'张家口风电项目公司（示例）', province:'河北', region:'华北', tech:'风电', stage:'核准在建', capacityMW:150, ourEntity:'华北区域开发公司', ourEquity:60, partners:[{name:'省属能源集团（示例）', equity:40}], regCapital:15000, paidCapital:9000, incorpDate:'2024-06-02' },
  { id:'DEMO-003', name:'大同光伏+储能项目公司（示例）', province:'山西', region:'华北', tech:'光伏+储能', stage:'前期开发', capacityMW:100, ourEntity:'华北区域开发公司', ourEquity:100, partners:[], regCapital:10000, paidCapital:3000, incorpDate:'2025-01-20' },
  { id:'DEMO-004', name:'酒泉光伏项目公司（示例）', province:'甘肃', region:'西北', tech:'光伏', stage:'建成运营', capacityMW:300, ourEntity:'西北区域开发公司', ourEquity:65, partners:[{name:'地方城投平台（示例）', equity:35}], regCapital:30000, paidCapital:30000, incorpDate:'2022-09-08' },
  { id:'DEMO-005', name:'哈密风电项目公司（示例）', province:'新疆', region:'西北', tech:'风电', stage:'核准在建', capacityMW:250, ourEntity:'西北区域开发公司', ourEquity:51, partners:[{name:'产业投资基金（示例）', equity:49}], regCapital:25000, paidCapital:15000, incorpDate:'2024-11-11' },
  { id:'DEMO-006', name:'中卫光伏项目公司（示例）', province:'宁夏', region:'西北', tech:'光伏', stage:'建成运营', capacityMW:180, ourEntity:'西北区域开发公司', ourEquity:80, partners:[{name:'地方能源集团（示例）', equity:20}], regCapital:18000, paidCapital:18000, incorpDate:'2023-05-27' },
  { id:'DEMO-007', name:'海西光储项目公司（示例）', province:'青海', region:'西北', tech:'光伏+储能', stage:'前期开发', capacityMW:120, ourEntity:'西北区域开发公司', ourEquity:100, partners:[], regCapital:12000, paidCapital:2000, incorpDate:'2025-07-03' },
  { id:'DEMO-008', name:'盐城海上风电项目公司（示例）', province:'江苏', region:'华东', tech:'风电', stage:'建成运营', capacityMW:400, ourEntity:'华东区域开发公司', ourEquity:55, partners:[{name:'省属能源集团（示例）', equity:30},{name:'社会资本方（示例）', equity:15}], regCapital:40000, paidCapital:40000, incorpDate:'2021-12-19' },
  { id:'DEMO-009', name:'东营光伏项目公司（示例）', province:'山东', region:'华东', tech:'光伏', stage:'核准在建', capacityMW:200, ourEntity:'华东区域开发公司', ourEquity:60, partners:[{name:'地方城投平台（示例）', equity:40}], regCapital:20000, paidCapital:12000, incorpDate:'2024-04-15' },
  { id:'DEMO-010', name:'淮南光伏项目公司（示例）', province:'安徽', region:'华东', tech:'光伏', stage:'建成运营', capacityMW:90, ourEntity:'华东区域开发公司', ourEquity:100, partners:[], regCapital:9000, paidCapital:9000, incorpDate:'2022-02-25' },
  { id:'DEMO-011', name:'汕尾海上风电项目公司（示例）', province:'广东', region:'华南', tech:'风电', stage:'前期开发', capacityMW:300, ourEntity:'华南区域开发公司', ourEquity:49, partners:[{name:'省属能源集团（示例）', equity:51}], regCapital:30000, paidCapital:3000, incorpDate:'2025-03-09' },
  { id:'DEMO-012', name:'北海光伏项目公司（示例）', province:'广西', region:'华南', tech:'光伏', stage:'建成运营', capacityMW:100, ourEntity:'华南区域开发公司', ourEquity:70, partners:[{name:'地方能源集团（示例）', equity:30}], regCapital:10000, paidCapital:10000, incorpDate:'2023-08-14' },
  { id:'DEMO-013', name:'儋州光储项目公司（示例）', province:'海南', region:'华南', tech:'光伏+储能', stage:'核准在建', capacityMW:80, ourEntity:'华南区域开发公司', ourEquity:100, partners:[], regCapital:8000, paidCapital:5000, incorpDate:'2024-09-01' },
  { id:'DEMO-014', name:'朝阳风电项目公司（示例）', province:'辽宁', region:'东北', tech:'风电', stage:'建成运营', capacityMW:150, ourEntity:'东北区域开发公司', ourEquity:65, partners:[{name:'地方城投平台（示例）', equity:35}], regCapital:15000, paidCapital:15000, incorpDate:'2022-06-30' },
  { id:'DEMO-015', name:'白城光伏项目公司（示例）', province:'吉林', region:'东北', tech:'光伏', stage:'核准在建', capacityMW:200, ourEntity:'东北区域开发公司', ourEquity:51, partners:[{name:'产业投资基金（示例）', equity:49}], regCapital:20000, paidCapital:10000, incorpDate:'2024-12-06' },
  { id:'DEMO-016', name:'大庆光伏项目公司（示例）', province:'黑龙江', region:'东北', tech:'光伏', stage:'前期开发', capacityMW:100, ourEntity:'东北区域开发公司', ourEquity:100, partners:[], regCapital:10000, paidCapital:1000, incorpDate:'2025-08-05' },
  { id:'DEMO-017', name:'凉山光伏项目公司（示例）', province:'四川', region:'西南', tech:'光伏', stage:'建成运营', capacityMW:120, ourEntity:'西南区域开发公司', ourEquity:60, partners:[{name:'地方能源集团（示例）', equity:40}], regCapital:12000, paidCapital:12000, incorpDate:'2023-01-11' },
  { id:'DEMO-018', name:'曲靖风光互补项目公司（示例）', province:'云南', region:'西南', tech:'光伏+风电', stage:'核准在建', capacityMW:180, ourEntity:'西南区域开发公司', ourEquity:55, partners:[{name:'省属能源集团（示例）', equity:45}], regCapital:18000, paidCapital:9000, incorpDate:'2024-07-22' },
];
