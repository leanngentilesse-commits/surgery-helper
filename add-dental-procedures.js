const mongoose = require('mongoose');

// 连接到MongoDB数据库
mongoose.connect('mongodb://localhost:27017/robot-surgery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 定义模型
const Procedure = mongoose.model('Procedure', new mongoose.Schema({
  name: String,
  dept: String,
  organ: String,
  indications: String,
  contraindications: String,
  guidelines: Array,
  clinicalMetrics: Array,
  operationMetrics: Array,
  guidelineDiff: String,
  steps: Array,
  traditionalVideo: String,
  roboticVideo: String
}));

const Competitor = mongoose.model('Competitor', new mongoose.Schema({
  procedureName: String,
  brand: String,
  model: String,
  params: String,
  priceAvg: String,
  installs: String,
  advantage: String,
  source: String
}));

// 口腔科手术信息
const dentalProcedures = [
  {
    name: "口腔种植手术",
    dept: "口腔科",
    organ: "口腔",
    indications: "牙齿缺失，牙槽骨条件良好",
    contraindications: "严重骨质疏松、未控制的糖尿病",
    guidelines: [{ name: "《口腔种植技术指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "种植体成功率", value: "≥95%", desc: "5年成功率" },
      { name: "并发症率", value: "≤5%", desc: "包括感染、种植体松动等" },
      { name: "功能满意度", value: "≥90%", desc: "患者满意度" },
      { name: "骨结合时间", value: "3-6个月", desc: "种植体与骨组织结合时间" }
    ],
    operationMetrics: [
      { name: "平均手术时间", value: "30-60min", desc: "单颗种植体植入时间" },
      { name: "术中出血量", value: "5-10ml", desc: "估计失血量" },
      { name: "机械臂精度", value: "≤0.1mm", desc: "种植体植入精度" }
    ],
    guidelineDiff: "最新指南强调种植体精准植入与个性化设计，机器人辅助可提高手术精度。",
    steps: [
      { name: "麻醉与消毒", timestamp: 5 },
      { name: "牙槽骨准备", timestamp: 15 },
      { name: "种植体植入", timestamp: 30 },
      { name: "缝合与愈合", timestamp: 45 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  {
    name: "根管治疗术",
    dept: "口腔科",
    organ: "口腔",
    indications: "牙髓炎、根尖周炎、牙髓坏死",
    contraindications: "严重牙周病、无法修复的牙齿",
    guidelines: [{ name: "《根管治疗技术指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "治疗成功率", value: "90-95%", desc: "1年成功率" },
      { name: "并发症率", value: "≤5%", desc: "包括根管侧穿、器械分离等" },
      { name: "疼痛缓解率", value: "≥95%", desc: "术后疼痛缓解" },
      { name: "牙齿保存率", value: "≥85%", desc: "5年牙齿保存率" }
    ],
    operationMetrics: [
      { name: "平均手术时间", value: "30-60min", desc: "单根管治疗时间" },
      { name: "术中出血量", value: "1-5ml", desc: "估计失血量" },
      { name: "机械臂精度", value: "≤0.05mm", desc: "根管预备精度" }
    ],
    guidelineDiff: "最新指南强调根管预备的精准性与三维充填，机器人辅助可提高治疗精度。",
    steps: [
      { name: "麻醉与消毒", timestamp: 5 },
      { name: "开髓与根管定位", timestamp: 15 },
      { name: "根管预备与冲洗", timestamp: 30 },
      { name: "根管充填与封闭", timestamp: 45 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  }
];

// 口腔科手术的竞品信息
const dentalCompetitors = [
  // 口腔种植手术竞品
  {
    procedureName: "口腔种植手术",
    brand: "Yomi",
    model: "Yomi",
    params: "系统精度: 0.1mm; 机械臂辅助",
    priceAvg: "800万",
    installs: "150台",
    advantage: "精准种植, 提高成功率",
    source: "公司官网"
  },
  {
    procedureName: "口腔种植手术",
    brand: "Neocis",
    model: "Cerec Guide",
    params: "系统精度: 0.15mm; 数字化导航",
    priceAvg: "600万",
    installs: "120台",
    advantage: "数字化设计, 个性化种植",
    source: "公开资料"
  },
  // 根管治疗术竞品
  {
    procedureName: "根管治疗术",
    brand: "Trios",
    model: "Trios 4",
    params: "系统精度: 0.05mm; 数字化扫描",
    priceAvg: "300万",
    installs: "200台",
    advantage: "精准扫描, 提高治疗精度",
    source: "公司官网"
  },
  {
    procedureName: "根管治疗术",
    brand: "CEREC",
    model: "Primescan",
    params: "系统精度: 0.01mm; 3D扫描",
    priceAvg: "250万",
    installs: "180台",
    advantage: "数字化设计, 个性化治疗",
    source: "公开资料"
  }
];

// 插入数据
async function insertData() {
  try {
    // 插入手术信息
    for (const procedure of dentalProcedures) {
      const existingProcedure = await Procedure.findOne({ name: procedure.name });
      if (!existingProcedure) {
        const newProcedure = new Procedure(procedure);
        await newProcedure.save();
        console.log(`已添加手术: ${procedure.name}`);
      } else {
        console.log(`手术 ${procedure.name} 已存在，跳过`);
      }
    }

    // 插入竞品信息
    for (const competitor of dentalCompetitors) {
      const existingCompetitor = await Competitor.findOne({
        procedureName: competitor.procedureName,
        brand: competitor.brand,
        model: competitor.model
      });
      if (!existingCompetitor) {
        const newCompetitor = new Competitor(competitor);
        await newCompetitor.save();
        console.log(`已添加竞品: ${competitor.brand} ${competitor.model} (${competitor.procedureName})`);
      } else {
        console.log(`竞品 ${competitor.brand} ${competitor.model} (${competitor.procedureName}) 已存在，跳过`);
      }
    }

    console.log("数据插入完成！");
    mongoose.disconnect();
  } catch (error) {
    console.error("数据插入失败:", error);
    mongoose.disconnect();
  }
}

// 执行插入
insertData();
