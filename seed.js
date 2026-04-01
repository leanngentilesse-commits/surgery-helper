const mongoose = require('mongoose');
const { Department, Procedure, Competitor } = require('./models');

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/surgical-robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  seedData();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// 科室数据
const departments = [
  { id: "general", name: "普外科", organs: [
    { name: "肝胆", order: 1, procedures: ["腹腔镜胆囊切除术"] },
    { name: "胃肠", order: 2, procedures: ["胃癌根治术"] }
  ]},
  { id: "ortho", name: "骨科", organs: [
    { name: "膝关节", order: 1, procedures: ["全膝关节置换术"] },
    { name: "脊柱", order: 2, procedures: ["脊柱融合术"] }
  ]},
  { id: "urology", name: "泌尿外科", organs: [
    { name: "前列腺", order: 1, procedures: ["前列腺癌根治术"] },
    { name: "肾脏", order: 2, procedures: ["肾部分切除术"] }
  ]},
  { id: "gyn", name: "妇产科", organs: [
    { name: "子宫", order: 1, procedures: ["子宫切除术"] }
  ]},
  { id: "neurosurgery", name: "神经外科", organs: [
    { name: "颅内肿瘤", order: 1, procedures: ["颅内肿瘤切除术"] }
  ]},
  { id: "thoracic", name: "胸外科", organs: [
    { name: "肺部", order: 1, procedures: ["肺叶切除术"] }
  ]},
  { id: "cardiac", name: "心脏外科", organs: [
    { name: "冠脉", order: 1, procedures: ["冠状动脉搭桥术"] }
  ]},
  { id: "vascular", name: "血管外科", organs: [
    { name: "主动脉", order: 1, procedures: ["腹主动脉瘤切除术"] }
  ]},
  { id: "pediatric", name: "小儿外科", organs: [
    { name: "先天性巨结肠", order: 1, procedures: ["巨结肠根治术"] }
  ]},
  { id: "plastic", name: "整形外科", organs: [
    { name: "乳房", order: 1, procedures: ["乳房重建术"] }
  ]}
];

// 术式详情数据
const proceduresData = [
  {
    name: "全膝关节置换术",
    dept: "骨科",
    organ: "膝关节",
    indications: "重度骨关节炎、类风湿关节炎晚期",
    contraindications: "活动性感染、伸膝装置功能丧失",
    guidelines: [{ name: "《中国膝关节置换术加速康复指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "下肢力线偏差", value: "≤3°", desc: "髋-膝-踝角与术前规划偏差" },
      { name: "截骨深度偏差", value: "≤1 mm", desc: "股骨远端/胫骨近端截骨厚度与计划偏差" },
      { name: "截骨角度偏差", value: "≤2°", desc: "冠状面/矢状面截骨角度与计划偏差" },
      { name: "5年假体生存率", value: "≥95%", desc: "翻修率≤5%" },
      { name: "严重并发症率", value: "≤2%", desc: "术后30天内深静脉血栓、感染等" },
      { name: "KSS功能评分提升", value: "≥30分", desc: "术后6个月较术前改善" }
    ],
    operationMetrics: [
      { name: "机器人操作时间", value: "45 ± 15 min", desc: "从机械臂启动到关键步骤完成" },
      { name: "注册配准精度", value: "≤0.5 mm", desc: "术前影像与术中解剖配准误差" },
      { name: "机械臂轴数", value: "6轴", desc: "自由度，影响操作灵活性" },
      { name: "机械臂调整次数", value: "≤1次/台", desc: "术中因碰撞或范围受限重新定位次数" },
      { name: "学习曲线陡峭度", value: "20例", desc: "达到稳定操作所需例数" }
    ],
    guidelineDiff: "最新指南强调力线重建与软组织平衡，机器人辅助可提高截骨精度。",
    steps: [
      { name: "股骨远端截骨", timestamp: 20 },
      { name: "胫骨近端截骨", timestamp: 85 },
      { name: "试模与软组织平衡", timestamp: 140 },
      { name: "假体植入", timestamp: 200 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  {
    name: "腹腔镜胆囊切除术",
    dept: "普外科",
    organ: "肝胆",
    indications: "症状性胆囊结石，胆囊息肉≥10mm",
    contraindications: "严重凝血功能障碍",
    guidelines: [{ name: "《胆囊良性疾病外科治疗专家共识(2023版)》", status: "现行" }],
    clinicalMetrics: [
      { name: "结石清除率", value: "98.2%", desc: "术后影像确认" },
      { name: "并发症率", value: "4.3%", desc: "胆漏、出血等" },
      { name: "住院天数", value: "2-3天", desc: "平均住院日" },
      { name: "中转开腹率", value: "≤1%", desc: "意外情况中转" }
    ],
    operationMetrics: [
      { name: "平均手术时间", value: "45min", desc: "从切皮到缝合" },
      { name: "术中出血量", value: "10-30ml", desc: "估计失血量" },
      { name: "机械臂轴数", value: "4轴", desc: "达芬奇标准配置" }
    ],
    guidelineDiff: "2023版共识强调胆总管探查指征，新版主张选择性引流。",
    steps: [
      { name: "建立气腹与穿刺", timestamp: 10 },
      { name: "解剖胆囊三角", timestamp: 45 },
      { name: "离断胆囊管及动脉", timestamp: 90 },
      { name: "剥离胆囊床", timestamp: 150 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  }
];

// 竞品数据
const competitorsData = [
  {
    procedureName: "全膝关节置换术",
    brand: "MAKO (史赛克)",
    model: "RIO",
    params: "机器人辅助截骨, 6轴机械臂",
    priceAvg: "2600万",
    installs: "210台",
    advantage: "精准截骨, 力线控制",
    source: "NMPA注册证、2024年政府采购网"
  },
  {
    procedureName: "全膝关节置换术",
    brand: "国产鸿鹄",
    model: "SkyWalker",
    params: "6轴机械臂, 5G远程",
    priceAvg: "1200万",
    installs: "45台",
    advantage: "高性价比, 国产替代",
    source: "公司财报、行业白皮书"
  },
  {
    procedureName: "腹腔镜胆囊切除术",
    brand: "达芬奇Xi",
    model: "IS4000",
    params: "3D高清, 4臂",
    priceAvg: "2800万",
    installs: "320台",
    advantage: "直觉式操控, 市场成熟",
    source: "公司官网、财报"
  }
];

// 导入数据
async function seedData() {
  try {
    // 清空现有数据
    await Department.deleteMany({});
    await Procedure.deleteMany({});
    await Competitor.deleteMany({});

    // 导入科室数据
    await Department.insertMany(departments);
    console.log('Departments seeded successfully');

    // 导入术式数据
    await Procedure.insertMany(proceduresData);
    console.log('Procedures seeded successfully');

    // 导入竞品数据
    await Competitor.insertMany(competitorsData);
    console.log('Competitors seeded successfully');

    console.log('All data seeded successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
}
