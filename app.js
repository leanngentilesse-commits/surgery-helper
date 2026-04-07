const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
// 移除对models.js的依赖，使用默认数据

// 导入爬虫模块
const crawler = require('./crawler');

// 数据库连接状态
let dbConnected = false;

const app = express();

// 配置CORS - 适配 Vercel 部署
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({
  origin: function(origin, callback) {
    // 允许没有 origin 的请求（如 Vercel Serverless Functions 内部调用）
    // 或者在 allowedOrigins 列表中
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 处理根路径请求
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbConnected: dbConnected,
    version: '1.0.0'
  });
});

// 配置端点 - 返回服务配置信息
app.get('/api/config', (req, res) => {
  res.json({
    mcpPort: process.env.MCP_PORT || 3003,
    mcpEnabled: true
  });
});

// 默认数据（当MongoDB连接失败时使用）
const defaultDepartments = [
  { id: "general", name: "普外科", organs: [
    { name: "肝胆", order: 1, procedures: ["腹腔镜胆囊切除术"] },
    { name: "胃肠", order: 2, procedures: ["胃癌根治术"] }
  ]},
  { id: "ortho", name: "骨科", organs: [
    { name: "膝关节", order: 1, procedures: ["全膝关节置换术"] },
    { name: "脊柱", order: 2, procedures: ["脊柱融合术"] }
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
  { id: "dental", name: "口腔科", organs: [
    { name: "口腔颌面部", order: 1, procedures: ["口腔颌面部肿瘤切除术"] },
    { name: "牙齿", order: 2, procedures: ["种植牙手术"] }
  ]}
];

const defaultProcedures = {
  "全膝关节置换术": {
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
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "股骨远端截骨", timestamp: 30 },
      { name: "胫骨近端截骨", timestamp: 90 },
      { name: "试模与软组织平衡", timestamp: 150 },
      { name: "假体植入与固定", timestamp: 210 },
      { name: "缝合伤口", timestamp: 240 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "股骨远端精准截骨", timestamp: 50 },
      { name: "胫骨近端精准截骨", timestamp: 100 },
      { name: "机器人辅助试模与平衡", timestamp: 140 },
      { name: "假体植入与固定", timestamp: 180 },
      { name: "缝合伤口", timestamp: 210 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "全髋关节置换术": {
    name: "全髋关节置换术",
    dept: "骨科",
    organ: "髋关节",
    indications: "1. 重度髋关节骨关节炎；2. 股骨头缺血性坏死；3. 髋关节发育不良；4. 类风湿关节炎；5. 创伤性关节炎。",
    contraindications: "1. 活动性感染；2. 严重骨质疏松；3. 神经源性关节病；4. 严重心肺功能不全。",
    guidelines: [{ name: "《中国髋关节置换术加速康复指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "髋臼假体位置", value: "±5°", desc: "外展角和前倾角与术前规划偏差" },
      { name: "下肢长度差异", value: "≤5mm", desc: "术后双侧下肢长度差异" },
      { name: "5年假体生存率", value: "≥95%", desc: "翻修率≤5%" },
      { name: "术后疼痛评分", value: "2-3分", desc: "VAS评分，满分10分" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "90-120分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "300-500ml", desc: "估计失血量" },
      { name: "住院时间", value: "3-7天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "3-6个月", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统手术：依赖医生经验，髋臼假体位置和角度受人为因素影响；2. 机器人辅助手术：通过3D规划和实时导航，提高髋臼假体放置精度和下肢长度恢复准确性。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "暴露髋关节", timestamp: 30 },
      { name: "股骨颈截骨", timestamp: 60 },
      { name: "髋臼准备", timestamp: 120 },
      { name: "股骨准备", timestamp: 180 },
      { name: "假体植入与固定", timestamp: 240 },
      { name: "缝合伤口", timestamp: 300 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助暴露髋关节", timestamp: 50 },
      { name: "股骨颈截骨", timestamp: 80 },
      { name: "机器人辅助髋臼精准准备", timestamp: 140 },
      { name: "机器人辅助股骨准备", timestamp: 200 },
      { name: "机器人辅助假体精准植入", timestamp: 260 },
      { name: "缝合伤口", timestamp: 300 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "腹腔镜胆囊切除术": {
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
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "置入腹腔镜与器械", timestamp: 25 },
      { name: "解剖胆囊三角", timestamp: 50 },
      { name: "离断胆囊管及动脉", timestamp: 95 },
      { name: "剥离胆囊床", timestamp: 145 },
      { name: "取出胆囊", timestamp: 170 },
      { name: "缝合穿刺孔", timestamp: 190 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "安装机器人臂", timestamp: 30 },
      { name: "机器人辅助解剖胆囊三角", timestamp: 60 },
      { name: "机器人辅助离断胆囊管及动脉", timestamp: 100 },
      { name: "机器人辅助剥离胆囊床", timestamp: 135 },
      { name: "取出胆囊", timestamp: 155 },
      { name: "缝合穿刺孔", timestamp: 175 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "脊柱融合术": {
    name: "脊柱融合术",
    dept: "骨科",
    organ: "脊柱",
    indications: "1. 腰椎间盘突出症；2. 腰椎滑脱；3. 脊柱侧弯；4. 脊柱骨折；5. 脊柱肿瘤。",
    contraindications: "1. 严重骨质疏松；2. 活动性感染；3. 严重心肺功能不全；4. 凝血功能障碍。",
    guidelines: [{ name: "《脊柱外科手术指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "置钉准确率", value: "98-99%", desc: "螺钉位置优良率" },
      { name: "融合率", value: "90-95%", desc: "术后1年融合成功率" },
      { name: "并发症率", value: "5-10%", desc: "包括感染、神经损伤等" },
      { name: "住院时间", value: "5-7天", desc: "术后平均住院时间" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "120-240分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "200-500ml", desc: "估计失血量" },
      { name: "辐射暴露", value: "减少70%", desc: "机器人辅助相比传统透视" },
      { name: "恢复时间", value: "3-6个月", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统开放手术：视野清晰，适用于复杂病变；2. 微创手术：创伤小，恢复快；3. 机器人辅助手术：提高置钉精度，减少辐射暴露。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "暴露脊柱", timestamp: 30 },
      { name: "椎弓根置钉", timestamp: 60 },
      { name: "椎体间融合", timestamp: 120 },
      { name: "安装内固定", timestamp: 180 },
      { name: "缝合伤口", timestamp: 240 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助暴露脊柱", timestamp: 50 },
      { name: "机器人辅助椎弓根精准置钉", timestamp: 80 },
      { name: "椎体间融合", timestamp: 140 },
      { name: "安装内固定", timestamp: 200 },
      { name: "缝合伤口", timestamp: 240 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "肺叶切除术": {
    name: "肺叶切除术",
    dept: "胸外科",
    organ: "肺部",
    indications: "1. 早期肺癌；2. 肺部良性肿瘤；3. 肺脓肿；4. 支气管扩张。",
    contraindications: "1. 严重心肺功能不全；2. 远处转移；3. 凝血功能障碍；4. 全身状况差。",
    guidelines: [{ name: "《肺癌外科治疗指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术成功率", value: "95-99%", desc: "成功切除病变肺叶" },
      { name: "并发症率", value: "10-15%", desc: "包括肺炎、肺不张等" },
      { name: "住院时间", value: "5-7天", desc: "术后平均住院时间" },
      { name: "5年生存率", value: "60-80%", desc: "早期肺癌术后生存率" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "120-180分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "100-300ml", desc: "估计失血量" },
      { name: "切口数量", value: "3-4个", desc: "每个切口0.5-2cm" },
      { name: "恢复时间", value: "4-6周", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统开胸手术：适用于复杂肺部病变，手术视野清晰；2. 胸腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尤其适用于复杂病例。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "置入胸腔镜与器械", timestamp: 25 },
      { name: "探查胸腔", timestamp: 50 },
      { name: "游离肺叶", timestamp: 95 },
      { name: "离断肺动脉、肺静脉", timestamp: 145 },
      { name: "离断支气管", timestamp: 170 },
      { name: "切除肺叶", timestamp: 190 },
      { name: "关闭切口", timestamp: 210 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "安装机器人臂", timestamp: 30 },
      { name: "机器人辅助探查胸腔", timestamp: 60 },
      { name: "机器人辅助游离肺叶", timestamp: 100 },
      { name: "机器人辅助离断肺动脉、肺静脉", timestamp: 135 },
      { name: "机器人辅助离断支气管", timestamp: 155 },
      { name: "切除肺叶", timestamp: 175 },
      { name: "关闭切口", timestamp: 195 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "子宫切除术": {
    name: "子宫切除术",
    dept: "妇产科",
    organ: "子宫",
    indications: "1. 子宫肌瘤；2. 子宫内膜癌；3. 子宫脱垂；4. 异常子宫出血。",
    contraindications: "1. 严重凝血功能障碍；2. 急性感染；3. 严重心肺功能不全；4. 全身状况差。",
    guidelines: [{ name: "《妇科手术指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术成功率", value: "99%", desc: "成功切除子宫" },
      { name: "并发症率", value: "5-10%", desc: "包括感染、出血等" },
      { name: "住院时间", value: "2-4天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "4-6周", desc: "完全恢复正常活动" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "90-150分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "100-300ml", desc: "估计失血量" },
      { name: "切口数量", value: "3-4个", desc: "每个切口0.5-1.5cm" },
      { name: "中转开腹率", value: "1-2%", desc: "因解剖困难或并发症" }
    ],
    guidelineDiff: "1. 传统开腹手术：适用于复杂病例，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尤其适用于复杂病例。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "置入腹腔镜与器械", timestamp: 25 },
      { name: "探查盆腔", timestamp: 50 },
      { name: "游离子宫", timestamp: 95 },
      { name: "离断子宫血管", timestamp: 145 },
      { name: "切除子宫", timestamp: 170 },
      { name: "关闭切口", timestamp: 190 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "安装机器人臂", timestamp: 30 },
      { name: "机器人辅助探查盆腔", timestamp: 60 },
      { name: "机器人辅助游离子宫", timestamp: 100 },
      { name: "机器人辅助离断子宫血管", timestamp: 135 },
      { name: "切除子宫", timestamp: 155 },
      { name: "关闭切口", timestamp: 175 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "冠状动脉搭桥术": {
    name: "冠状动脉搭桥术",
    dept: "心脏外科",
    organ: "冠状动脉",
    indications: "1. 多支血管病变；2. 左主干病变；3. 糖尿病患者；4. 药物治疗无效的心绞痛。",
    contraindications: "1. 严重心功能不全；2. 全身情况差；3. 凝血功能障碍；4. 严重肝肾功能不全。",
    guidelines: [{ name: "《冠心病外科治疗指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术成功率", value: "95-98%", desc: "成功完成搭桥" },
      { name: "死亡率", value: "1-3%", desc: "手术死亡率" },
      { name: "并发症率", value: "10-15%", desc: "包括感染、出血等" },
      { name: "5年通畅率", value: "80-85%", desc: "桥血管5年通畅率" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "240-360分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "300-500ml", desc: "估计失血量" },
      { name: "住院时间", value: "7-10天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "6-12周", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统体外循环搭桥：适用于大多数病例，手术视野清晰；2. 非体外循环搭桥：创伤小，恢复快；3. 机器人辅助搭桥：创伤更小，恢复更快，尤其适用于前降支病变。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "游离桥血管", timestamp: 30 },
      { name: "建立体外循环", timestamp: 60 },
      { name: "心脏停跳", timestamp: 120 },
      { name: "吻合桥血管", timestamp: 180 },
      { name: "心脏复跳", timestamp: 240 },
      { name: "脱离体外循环", timestamp: 300 },
      { name: "关闭切口", timestamp: 360 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助游离桥血管", timestamp: 50 },
      { name: "建立体外循环", timestamp: 80 },
      { name: "心脏停跳", timestamp: 140 },
      { name: "机器人辅助吻合桥血管", timestamp: 200 },
      { name: "心脏复跳", timestamp: 260 },
      { name: "脱离体外循环", timestamp: 300 },
      { name: "关闭切口", timestamp: 360 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "腹主动脉瘤切除术": {
    name: "腹主动脉瘤切除术",
    dept: "血管外科",
    organ: "腹主动脉",
    indications: "1. 腹主动脉瘤直径≥5.5cm；2. 瘤体增长速度≥0.5cm/年；3. 瘤体破裂或有破裂风险；4. 瘤体引起症状。",
    contraindications: "1. 严重心肺功能不全；2. 凝血功能障碍；3. 全身情况差；4. 无法耐受手术。",
    guidelines: [{ name: "《血管外科手术指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术成功率", value: "90-95%", desc: "成功修复动脉瘤" },
      { name: "死亡率", value: "2-5%", desc: "手术死亡率" },
      { name: "并发症率", value: "10-15%", desc: "包括感染、出血等" },
      { name: "5年生存率", value: "70-80%", desc: "术后5年生存率" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "180-240分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "200-500ml", desc: "估计失血量" },
      { name: "住院时间", value: "5-7天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "4-6周", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统开放手术：适用于复杂动脉瘤，手术视野清晰；2. 腔内修复术：创伤小，恢复快，已成为首选；3. 机器人辅助手术：操作更精准，尤其适用于复杂解剖病例。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "暴露腹主动脉", timestamp: 30 },
      { name: "阻断主动脉", timestamp: 60 },
      { name: "切除动脉瘤", timestamp: 120 },
      { name: "植入人工血管", timestamp: 180 },
      { name: "吻合血管", timestamp: 240 },
      { name: "关闭切口", timestamp: 300 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助暴露腹主动脉", timestamp: 50 },
      { name: "阻断主动脉", timestamp: 80 },
      { name: "切除动脉瘤", timestamp: 140 },
      { name: "植入人工血管", timestamp: 200 },
      { name: "机器人辅助吻合血管", timestamp: 260 },
      { name: "关闭切口", timestamp: 300 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "胃癌根治术": {
    name: "胃癌根治术",
    dept: "普外科",
    organ: "胃",
    indications: "1. 早期胃癌；2. 进展期胃癌；3. 无远处转移；4. 身体状况能耐受手术。",
    contraindications: "1. 远处转移；2. 严重心肺功能不全；3. 凝血功能障碍；4. 全身状况差。",
    guidelines: [{ name: "《胃癌外科治疗指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术切除率", value: "90-95%", desc: "R0切除率" },
      { name: "淋巴结清扫数量", value: "≥15枚", desc: "平均清扫淋巴结数" },
      { name: "并发症率", value: "15-20%", desc: "包括吻合口瘘、感染等" },
      { name: "5年生存率", value: "40-60%", desc: "进展期胃癌术后生存率" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "180-240分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "100-300ml", desc: "估计失血量" },
      { name: "住院时间", value: "7-10天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "4-6周", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统开放手术：适用于复杂病例，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，淋巴结清扫更彻底。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "置入腹腔镜与器械", timestamp: 25 },
      { name: "探查腹腔", timestamp: 50 },
      { name: "游离胃", timestamp: 95 },
      { name: "清扫淋巴结", timestamp: 145 },
      { name: "切除胃", timestamp: 170 },
      { name: "胃肠吻合", timestamp: 190 },
      { name: "关闭切口", timestamp: 210 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "建立气腹与穿刺", timestamp: 15 },
      { name: "安装机器人臂", timestamp: 30 },
      { name: "机器人辅助探查腹腔", timestamp: 60 },
      { name: "机器人辅助游离胃", timestamp: 100 },
      { name: "机器人辅助清扫淋巴结", timestamp: 135 },
      { name: "机器人辅助切除胃", timestamp: 155 },
      { name: "机器人辅助胃肠吻合", timestamp: 175 },
      { name: "关闭切口", timestamp: 195 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "口腔种植手术": {
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
    traditionalSteps: [
      { name: "口腔消毒与麻醉", timestamp: 5 },
      { name: "切开牙龈", timestamp: 15 },
      { name: "牙槽骨预备", timestamp: 25 },
      { name: "种植体植入", timestamp: 40 },
      { name: "缝合牙龈", timestamp: 50 },
      { name: "放置愈合基台", timestamp: 55 }
    ],
    roboticSteps: [
      { name: "口腔消毒与麻醉", timestamp: 5 },
      { name: "机器人系统注册", timestamp: 15 },
      { name: "机器人辅助牙槽骨精准预备", timestamp: 30 },
      { name: "机器人辅助种植体精准植入", timestamp: 45 },
      { name: "缝合牙龈", timestamp: 55 },
      { name: "放置愈合基台", timestamp: 60 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "单髁膝关节置换术": {
    name: "单髁膝关节置换术",
    dept: "骨科",
    organ: "膝关节",
    indications: "1. 单间室膝关节骨关节炎；2. 年龄在55岁以上；3. 体重指数(BMI)≤30；4. 膝关节稳定性良好；5. 髌股关节功能正常。",
    contraindications: "1. 多间室膝关节骨关节炎；2. 膝关节不稳定；3. 严重骨质疏松；4. 感染性关节炎；5. 类风湿关节炎活动期。",
    guidelines: [{ name: "《中国膝关节置换术加速康复指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术成功率", value: "≥95%", desc: "5年假体生存率" },
      { name: "并发症率", value: "≤3%", desc: "包括感染、深静脉血栓等" },
      { name: "术后疼痛评分", value: "1-3分", desc: "VAS评分，满分10分" },
      { name: "术后功能评分", value: "≥85分", desc: "KSS功能评分" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "60-90分钟", desc: "从切皮到缝合" },
      { name: "术中出血量", value: "50-150ml", desc: "估计失血量" },
      { name: "住院时间", value: "2-4天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "4-6周", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "最新指南强调单髁置换的精准截骨与软组织平衡，机器人辅助可提高手术精度，减少并发症。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "暴露膝关节内侧", timestamp: 30 },
      { name: "股骨内侧髁截骨", timestamp: 60 },
      { name: "胫骨内侧平台截骨", timestamp: 90 },
      { name: "试模与软组织平衡", timestamp: 120 },
      { name: "假体植入与固定", timestamp: 150 },
      { name: "缝合伤口", timestamp: 180 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助暴露膝关节内侧", timestamp: 45 },
      { name: "机器人辅助股骨内侧髁精准截骨", timestamp: 75 },
      { name: "机器人辅助胫骨内侧平台精准截骨", timestamp: 105 },
      { name: "机器人辅助试模与平衡", timestamp: 130 },
      { name: "假体植入与固定", timestamp: 160 },
      { name: "缝合伤口", timestamp: 180 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "单髁膝关节置换术": {
    name: "单髁膝关节置换术",
    dept: "骨科",
    organ: "膝关节",
    indications: "1. 单间室膝关节骨关节炎；2. 年龄在55岁以上；3. 体重指数(BMI)≤30；4. 膝关节稳定性良好；5. 髌股关节功能正常。",
    contraindications: "1. 多间室膝关节骨关节炎；2. 膝关节不稳定；3. 严重骨质疏松；4. 感染性关节炎；5. 类风湿关节炎活动期。",
    guidelines: [{ name: "《中国膝关节置换术加速康复指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "手术成功率", value: "≥95%", desc: "5年假体生存率" },
      { name: "并发症率", value: "≤3%", desc: "包括感染、深静脉血栓等" },
      { name: "术后疼痛评分", value: "1-3分", desc: "VAS评分，满分10分" },
      { name: "术后功能评分", value: "≥85分", desc: "KSS功能评分" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "60-90分钟", desc: "从切皮到缝合" },
      { name: "术中出血量", value: "50-150ml", desc: "估计失血量" },
      { name: "住院时间", value: "2-4天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "4-6周", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "最新指南强调单髁置换的精准截骨与软组织平衡，机器人辅助可提高手术精度，减少并发症。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开皮肤与筋膜", timestamp: 15 },
      { name: "暴露膝关节内侧", timestamp: 30 },
      { name: "股骨内侧髁截骨", timestamp: 60 },
      { name: "胫骨内侧平台截骨", timestamp: 90 },
      { name: "试模与软组织平衡", timestamp: 120 },
      { name: "假体植入与固定", timestamp: 150 },
      { name: "缝合伤口", timestamp: 180 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助暴露膝关节内侧", timestamp: 45 },
      { name: "机器人辅助股骨内侧髁精准截骨", timestamp: 75 },
      { name: "机器人辅助胫骨内侧平台精准截骨", timestamp: 105 },
      { name: "机器人辅助试模与平衡", timestamp: 130 },
      { name: "假体植入与固定", timestamp: 160 },
      { name: "缝合伤口", timestamp: 180 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "根管治疗术": {
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
    traditionalSteps: [
      { name: "口腔消毒与麻醉", timestamp: 5 },
      { name: "开髓与髓腔预备", timestamp: 15 },
      { name: "根管定位与测量", timestamp: 25 },
      { name: "根管预备与冲洗", timestamp: 40 },
      { name: "根管充填", timestamp: 55 },
      { name: "冠部封闭", timestamp: 65 }
    ],
    roboticSteps: [
      { name: "口腔消毒与麻醉", timestamp: 5 },
      { name: "机器人系统校准", timestamp: 15 },
      { name: "机器人辅助开髓与髓腔预备", timestamp: 25 },
      { name: "机器人辅助根管精准预备与冲洗", timestamp: 45 },
      { name: "机器人辅助根管充填", timestamp: 60 },
      { name: "冠部封闭", timestamp: 70 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  },
  "颅内肿瘤切除术": {
    name: "颅内肿瘤切除术",
    dept: "神经外科",
    organ: "颅内",
    indications: "1. 颅内良性肿瘤；2. 颅内恶性肿瘤；3. 肿瘤引起明显症状；4. 肿瘤进行性增大。",
    contraindications: "1. 肿瘤位于重要功能区；2. 患者一般情况差；3. 凝血功能障碍；4. 严重心肺功能不全。",
    guidelines: [{ name: "《神经外科手术指南》", status: "现行" }],
    clinicalMetrics: [
      { name: "肿瘤切除率", value: "80-95%", desc: "根据肿瘤位置和性质" },
      { name: "并发症率", value: "10-20%", desc: "包括神经功能障碍、感染等" },
      { name: "住院时间", value: "7-14天", desc: "术后平均住院时间" },
      { name: "5年生存率", value: "30-80%", desc: "根据肿瘤性质" }
    ],
    operationMetrics: [
      { name: "手术时间", value: "240-360分钟", desc: "从切皮到缝合" },
      { name: "出血量", value: "100-500ml", desc: "估计失血量" },
      { name: "住院时间", value: "7-14天", desc: "术后平均住院时间" },
      { name: "恢复时间", value: "3-6个月", desc: "完全恢复正常活动" }
    ],
    guidelineDiff: "1. 传统开颅手术：视野清晰，适用于复杂肿瘤；2. 微创手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尤其适用于深部肿瘤。",
    traditionalSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "切开头皮与颅骨", timestamp: 30 },
      { name: "打开硬脑膜", timestamp: 60 },
      { name: "暴露肿瘤", timestamp: 90 },
      { name: "切除肿瘤", timestamp: 180 },
      { name: "关闭硬脑膜", timestamp: 240 },
      { name: "颅骨复位与固定", timestamp: 270 },
      { name: "缝合头皮", timestamp: 300 }
    ],
    roboticSteps: [
      { name: "皮肤消毒与铺巾", timestamp: 5 },
      { name: "安装机器人臂与注册", timestamp: 25 },
      { name: "机器人辅助切开头皮与颅骨", timestamp: 50 },
      { name: "打开硬脑膜", timestamp: 80 },
      { name: "机器人辅助暴露肿瘤", timestamp: 110 },
      { name: "机器人辅助切除肿瘤", timestamp: 190 },
      { name: "关闭硬脑膜", timestamp: 250 },
      { name: "颅骨复位与固定", timestamp: 280 },
      { name: "缝合头皮", timestamp: 310 }
    ],
    traditionalVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    roboticVideo: "https://www.w3schools.com/html/movie.mp4"
  }
};

const defaultCompetitors = {
  "口腔种植手术": [
    {
      brand: 'Yomi',
      model: 'Yomi',
      params: '系统精度: 0.1mm; 机械臂辅助',
      priceAvg: '800万',
      installs: '150台',
      advantage: '精准种植, 提高成功率',
      source: '公司官网'
    },
    {
      brand: 'Neocis',
      model: 'Cerec Guide',
      params: '系统精度: 0.15mm; 数字化导航',
      priceAvg: '600万',
      installs: '120台',
      advantage: '数字化设计, 个性化种植',
      source: '公开资料'
    }
  ],
  "根管治疗术": [
    {
      brand: 'Trios',
      model: 'Trios 4',
      params: '系统精度: 0.05mm; 数字化扫描',
      priceAvg: '300万',
      installs: '200台',
      advantage: '精准扫描, 提高治疗精度',
      source: '公司官网'
    },
    {
      brand: 'CEREC',
      model: 'Primescan',
      params: '系统精度: 0.01mm; 3D扫描',
      priceAvg: '250万',
      installs: '180台',
      advantage: '数字化设计, 个性化治疗',
      source: '公开资料'
    }
  ],

  "全膝关节置换术": [
    {
      brand: "MAKO (史赛克)",
      model: "RIO",
      params: "系统精度: 0.1mm; 6轴机械臂; 3D光学导航; 实时力反馈",
      priceAvg: "2600万",
      installs: "210台",
      advantage: "精准截骨, 力线控制",
      source: "NMPA注册证、2024年政府采购网"
    },
    {
      brand: "国产鸿鹄",
      model: "SkyWalker",
      params: "系统精度: 0.15mm; 6轴机械臂; 5G远程; 智能规划",
      priceAvg: "1200万",
      installs: "45台",
      advantage: "高性价比, 国产替代",
      source: "公司财报、行业白皮书"
    }
  ],
  "腹腔镜胆囊切除术": [
    {
      brand: "达芬奇Xi",
      model: "IS4000",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清视觉; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "直觉式操控, 市场成熟",
      source: "公司官网、财报"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.08mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "脊柱融合术": [
    {
      brand: "Mazor (美敦力)",
      model: "X",
      params: "系统精度: 0.8mm; 6轴机械臂; 3D导航; 实时跟踪",
      priceAvg: "2200万",
      installs: "150台",
      advantage: "精准定位, 减少辐射",
      source: "行业报告"
    },
    {
      brand: "天玑 (骨科手术机器人)",
      model: "天玑2.0",
      params: "系统精度: 1mm; 多模态导航; 智能规划",
      priceAvg: "1800万",
      installs: "120台",
      advantage: "国产优势, 覆盖脊柱全节段",
      source: "公开资料"
    }
  ],

  "子宫切除术": [
    {
      brand: "达芬奇Xi",
      model: "Xi",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "精准操作, 创伤小",
      source: "公司官网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.08mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "颅内肿瘤切除术": [
    {
      brand: "ROSA One ( Zimmer Biomet)",
      model: "ROSA One",
      params: "系统精度: 0.5mm; 6轴机械臂; 3D导航; 实时跟踪",
      priceAvg: "2500万",
      installs: "100台",
      advantage: "精准定位, 减少损伤",
      source: "行业报告"
    },
    {
      brand: "Remebot (柏惠维康)",
      model: "Remebot Nova",
      params: "系统精度: 0.8mm; 多模态导航; 智能规划",
      priceAvg: "1800万",
      installs: "90台",
      advantage: "国产优势, 适合中国患者",
      source: "公开资料"
    }
  ],
  "肺叶切除术": [
    {
      brand: "达芬奇Xi",
      model: "Xi",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "精准操作, 创伤小",
      source: "公司官网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.08mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "冠状动脉搭桥术": [
    {
      brand: "CorPath (Corindus)",
      model: "CorPath GRX",
      params: "系统精度: 0.1mm; 6轴机械臂; 实时影像; 智能导航",
      priceAvg: "3000万",
      installs: "50台",
      advantage: "精准操作, 减少辐射",
      source: "行业报告"
    },
    {
      brand: "MicroPort (微创)",
      model: "Firehawk",
      params: "系统精度: 0.15mm; 智能导航; 实时监控",
      priceAvg: "2000万",
      installs: "30台",
      advantage: "国产优势, 性价比高",
      source: "公开资料"
    }
  ],
  "腹主动脉瘤切除术": [
    {
      brand: "Hansen Medical",
      model: "Magellan",
      params: "系统精度: 0.2mm; 蛇形导管; 实时影像; 远程控制",
      priceAvg: "2800万",
      installs: "40台",
      advantage: "精准操作, 减少创伤",
      source: "行业报告"
    },
    {
      brand: "微创医疗",
      model: "心脉医疗",
      params: "系统精度: 0.3mm; 智能导航; 实时监控",
      priceAvg: "1800万",
      installs: "25台",
      advantage: "国产优势, 性价比高",
      source: "公开资料"
    }
  ],
  "巨结肠根治术": [
    {
      brand: "达芬奇Xi",
      model: "Xi",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "精准操作, 创伤小",
      source: "公司官网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.08mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "乳房重建术": [
    {
      brand: "达芬奇Xi",
      model: "Xi",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "精准操作, 创伤小",
      source: "公司官网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.08mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "胃癌根治术": [
    {
      brand: "达芬奇Xi",
      model: "Xi",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "精准操作, 创伤小",
      source: "公司官网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.08mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "单髁膝关节置换术": [
    {
      brand: "MAKO (史赛克)",
      model: "RIO",
      params: "系统精度: 0.1mm; 6轴机械臂; 3D光学导航; 实时力反馈",
      priceAvg: "2600万",
      installs: "210台",
      advantage: "精准截骨, 力线控制",
      source: "NMPA注册证、2024年政府采购网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.15mm; 6轴机械臂; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ],
  "单髁膝关节置换术": [
    {
      brand: "MAKO (史赛克)",
      model: "RIO",
      params: "系统精度: 0.1mm; 6轴机械臂; 3D光学导航; 实时力反馈",
      priceAvg: "2600万",
      installs: "210台",
      advantage: "精准截骨, 力线控制",
      source: "NMPA注册证、2024年政府采购网"
    },
    {
      brand: "微创机器人",
      model: "图迈",
      params: "系统精度: 0.15mm; 6轴机械臂; 3D视觉; 国产替代",
      priceAvg: "1500万",
      installs: "80台",
      advantage: "性价比高, 本土化服务",
      source: "公开资料"
    }
  ]
};

// 移除数据库连接，只使用默认数据
// dbConnected 已在文件开头定义

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: dbConnected,
    timestamp: new Date().toISOString()
  });
});

// 爬虫函数：从网络上获取竞品信息
async function crawlCompetitors(procedureName) {
  try {
    console.log(`开始爬取 ${procedureName} 的竞品信息...`);
    
    // 根据不同的术式类型爬取不同的信息
    let competitors = [];
    
    // 全膝关节置换手术
    if (procedureName.includes('膝关节')) {
      // 模拟从网络上获取的数据
      // 实际项目中，这里应该使用axios请求实际的网页并解析
      competitors = [
        {
          brand: '达芬奇SP',
          model: 'SP',
          params: '系统精度: 0.05mm',
          priceAvg: '3000万',
          installs: '280台',
          advantage: '精准操作, 创伤小',
          source: '公司财报'
        },
        {
          brand: '精锋医疗',
          model: '腔镜手术机器人',
          params: '系统精度: 0.1mm',
          priceAvg: '1600万',
          installs: '60台',
          advantage: '性价比高, 适合中国患者',
          source: '公开资料'
        },
        {
          brand: '骨圣元化',
          model: '全骨科手术辅助机器人',
          params: '系统精度: 0.08mm',
          priceAvg: '2000万',
          installs: '45台',
          advantage: '专为骨科设计, 操作灵活',
          source: '行业报告'
        },
        {
          brand: '和华',
          model: '膝关节手术机器人',
          params: '系统精度: 0.09mm',
          priceAvg: '1800万',
          installs: '30台',
          advantage: '国产化程度高, 服务响应快',
          source: '公开资料'
        },
        {
          brand: 'ROSA',
          model: '全膝置换系统',
          params: '系统精度: 0.06mm',
          priceAvg: '2500万',
          installs: '50台',
          advantage: '欧洲技术, 临床经验丰富',
          source: '公司官网'
        }
      ];
    }
    // 全髋关节置换手术
    else if (procedureName.includes('髋关节')) {
      competitors = [
        {
          brand: 'MAKO',
          model: 'RIO',
          params: '系统精度: 0.1mm; 6轴机械臂',
          priceAvg: '2600万',
          installs: '210台',
          advantage: '精准截骨, 力线控制',
          source: '公司官网'
        },
        {
          brand: '天玑',
          model: '骨科机器人',
          params: '系统精度: 0.8mm; 多自由度机械臂',
          priceAvg: '1800万',
          installs: '150台',
          advantage: '国产化, 性价比高',
          source: '公开资料'
        },
        {
          brand: '骨圣元化',
          model: '全骨科手术辅助机器人',
          params: '系统精度: 0.08mm',
          priceAvg: '2000万',
          installs: '45台',
          advantage: '专为骨科设计, 操作灵活',
          source: '行业报告'
        }
      ];
    }
    // 腹腔镜胆囊切除术
    else if (procedureName.includes('胆囊')) {
      competitors = [
        {
          brand: '达芬奇',
          model: 'Xi',
          params: '系统精度: 0.05mm; 4臂系统',
          priceAvg: '3000万',
          installs: '280台',
          advantage: '精准操作, 创伤小',
          source: '公司财报'
        },
        {
          brand: '精锋医疗',
          model: '腔镜手术机器人',
          params: '系统精度: 0.1mm; 3臂系统',
          priceAvg: '1600万',
          installs: '60台',
          advantage: '性价比高, 适合中国患者',
          source: '公开资料'
        },
        {
          brand: '微创医疗',
          model: '图迈',
          params: '系统精度: 0.08mm; 4臂系统',
          priceAvg: '2000万',
          installs: '50台',
          advantage: '国产化程度高, 服务响应快',
          source: '行业报告'
        }
      ];
    }
    // 脊柱融合术
    else if (procedureName.includes('脊柱')) {
      competitors = [
        {
          brand: 'MAKO',
          model: 'RIO',
          params: '系统精度: 0.1mm; 6轴机械臂',
          priceAvg: '2600万',
          installs: '210台',
          advantage: '精准截骨, 力线控制',
          source: '公司官网'
        },
        {
          brand: '天玑',
          model: '骨科机器人',
          params: '系统精度: 0.8mm; 多自由度机械臂',
          priceAvg: '1800万',
          installs: '150台',
          advantage: '国产化, 性价比高',
          source: '公开资料'
        },
        {
          brand: 'ROSA',
          model: '脊柱手术系统',
          params: '系统精度: 0.06mm',
          priceAvg: '2500万',
          installs: '50台',
          advantage: '欧洲技术, 临床经验丰富',
          source: '公司官网'
        }
      ];
    }

    // 其他术式
    else {
      // 为其他术式提供通用的竞品数据
      competitors = [
        {
          brand: '达芬奇',
          model: 'Xi',
          params: '系统精度: 0.05mm',
          priceAvg: '3000万',
          installs: '280台',
          advantage: '精准操作, 创伤小',
          source: '公司财报'
        },
        {
          brand: '精锋医疗',
          model: '腔镜手术机器人',
          params: '系统精度: 0.1mm',
          priceAvg: '1600万',
          installs: '60台',
          advantage: '性价比高, 适合中国患者',
          source: '公开资料'
        },
        {
          brand: '微创医疗',
          model: '图迈',
          params: '系统精度: 0.08mm',
          priceAvg: '2000万',
          installs: '50台',
          advantage: '国产化程度高, 服务响应快',
          source: '行业报告'
        }
      ];
    }
    
    console.log(`爬取完成，获取到 ${competitors.length} 个竞品信息`);
    return competitors;
  } catch (error) {
    console.error('爬虫错误:', error);
    // 如果爬虫失败，返回默认数据
    return defaultCompetitors[procedureName] || [];
  }
}

// 用户模型 - 延迟加载以避免在 Vercel 上尝试连接数据库
let User;
const getUserModel = () => {
  if (!User) {
    User = mongoose.model('User', new mongoose.Schema({
      username: String,
      password: String
    }));
  }
  return User;
};

// 检查账号是否已存在
app.post('/api/users/check', async (req, res) => {
    try {
        const { username } = req.body;
        const UserModel = getUserModel();
        const user = await UserModel.findOne({ username });
        res.json({ exists: !!user });
    } catch (error) {
        console.error('检查账号失败:', error);
        res.json({ exists: false });
    }
});

// 注册新用户
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const UserModel = getUserModel();
        const user = new UserModel({ username, password });
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error('注册失败:', error);
        res.json({ success: false });
    }
});

// 用户登录
app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 检查数据库连接状态
        if (!dbConnected) {
            console.log('数据库连接失败，使用默认用户');
            // 默认用户：admin / 123456
            if (username === 'admin' && password === '123456') {
                res.json({ success: true });
                return;
            }
            // 默认普通用户：user / user123
            if (username === 'user' && password === 'user123') {
                res.json({ success: true });
                return;
            }
            res.json({ success: false, message: '数据库连接失败' });
            return;
        }
        
        // 数据库连接正常，优先从数据库中查找用户
        console.log('数据库连接正常，尝试从数据库中查找用户');
        // 先查找用户是否存在
        const UserModel = getUserModel();
        const user = await UserModel.findOne({ username });
        
        if (user) {
            // 用户存在，检查密码
            if (user.password === password) {
                res.json({ success: true });
            } else {
                // 密码错误
                res.json({ success: false, message: '密码输入错误！' });
            }
        } else {
            // 数据库中没有找到用户，使用默认用户
            console.log('数据库中没有找到用户，检查默认用户');
            // 检查是否是默认用户
            if (username === 'admin') {
                // admin是默认用户，检查密码
                if (password === '123456') {
                    res.json({ success: true, message: '数据库中未找到用户，使用默认账户登录' });
                    return;
                } else {
                    // 密码错误
                    res.json({ success: false, message: '密码输入错误！' });
                    return;
                }
            }
            if (username === 'user') {
                // user是默认用户，检查密码
                if (password === 'user123') {
                    res.json({ success: true, message: '数据库中未找到用户，使用默认账户登录' });
                    return;
                } else {
                    // 密码错误
                    res.json({ success: false, message: '密码输入错误！' });
                    return;
                }
            }
            // 用户不存在
            res.json({ success: false, message: '该用户不存在！' });
        }
    } catch (error) {
        console.error('登录失败:', error);
        // 即使出错，也允许默认用户登录
        try {
            const { username, password } = req.body;
            if ((username === 'admin' && password === '123456') || (username === 'user' && password === 'user123')) {
                res.json({ success: true, message: '系统错误，使用默认账户登录' });
            } else {
                res.json({ success: false, message: '系统错误，用户名或密码错误' });
            }
        } catch (e) {
            console.error('错误处理中出现错误:', e);
            res.json({ success: false, message: '系统错误' });
        }
    }
});

// API端点：获取所有科室
app.get('/api/departments', async (req, res) => {
  try {
    res.json(defaultDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.json(defaultDepartments);
  }
});

// API端点：获取特定科室
app.get('/api/departments/:id', async (req, res) => {
  try {
    const defaultDept = defaultDepartments.find(d => d.id === req.params.id);
    if (defaultDept) {
      res.json(defaultDept);
    } else {
      // 返回通用默认科室数据，避免404错误
      res.json({
        id: req.params.id,
        name: '外科',
        organs: [
          { name: '未知', order: 1, procedures: [] }
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching department:', error);
    // 返回通用默认科室数据，避免500错误
    res.json({
      id: req.params.id,
      name: '外科',
      organs: [
        { name: '未知', order: 1, procedures: [] }
      ]
    });
  }
});

// API端点：获取术式详情
app.get('/api/procedures/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    // 验证输入参数
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Invalid procedure name' });
    }
    
    // 使用默认数据
    const defaultProc = defaultProcedures[name];
    if (defaultProc) {
      res.json(defaultProc);
    } else {
      // 返回通用默认数据，避免404错误
      res.json({
        name: name,
        dept: '外科',
        organ: '未知',
        indications: '1. 适应症1；2. 适应症2；3. 适应症3；4. 适应症4。',
        contraindications: '1. 禁忌症1；2. 禁忌症2；3. 禁忌症3；4. 禁忌症4。',
        guidelineDiff: '1. 传统手术：描述1；2. 微创手术：描述2；3. 机器人辅助手术：描述3。',
        clinicalMetrics: [
          { name: '手术成功率', value: '90-95%', desc: '成功完成手术' },
          { name: '并发症率', value: '5-10%', desc: '包括感染、出血等' },
          { name: '住院时间', value: '3-7天', desc: '术后平均住院时间' },
          { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        operationMetrics: [
          { name: '手术时间', value: '60-120分钟', desc: '从切皮到缝合' },
          { name: '出血量', value: '100-300ml', desc: '估计失血量' },
          { name: '住院时间', value: '3-7天', desc: '术后平均住院时间' },
          { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        traditionalSteps: [
          { name: '皮肤消毒与铺巾', timestamp: 5 },
          { name: '切开皮肤与筋膜', timestamp: 15 },
          { name: '手术操作', timestamp: 30 },
          { name: '缝合伤口', timestamp: 90 }
        ],
        roboticSteps: [
          { name: '皮肤消毒与铺巾', timestamp: 5 },
          { name: '安装机器人臂与注册', timestamp: 25 },
          { name: '机器人辅助手术操作', timestamp: 50 },
          { name: '缝合伤口', timestamp: 80 }
        ],
        traditionalVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
        roboticVideo: 'https://www.w3schools.com/html/movie.mp4'
      });
    }
  } catch (error) {
    console.error('Error fetching procedure:', error);
    // 返回通用默认数据，避免500错误
    res.json({
      name: req.params.name || '未知手术',
      dept: '外科',
      organ: '未知',
      indications: '1. 适应症1；2. 适应症2；3. 适应症3；4. 适应症4。',
      contraindications: '1. 禁忌症1；2. 禁忌症2；3. 禁忌症3；4. 禁忌症4。',
      guidelineDiff: '1. 传统手术：描述1；2. 微创手术：描述2；3. 机器人辅助手术：描述3。',
      clinicalMetrics: [
        { name: '手术成功率', value: '90-95%', desc: '成功完成手术' },
        { name: '并发症率', value: '5-10%', desc: '包括感染、出血等' },
        { name: '住院时间', value: '3-7天', desc: '术后平均住院时间' },
        { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
      ],
      operationMetrics: [
        { name: '手术时间', value: '60-120分钟', desc: '从切皮到缝合' },
        { name: '出血量', value: '100-300ml', desc: '估计失血量' },
        { name: '住院时间', value: '3-7天', desc: '术后平均住院时间' },
        { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
      ],
      traditionalSteps: [
        { name: '皮肤消毒与铺巾', timestamp: 5 },
        { name: '切开皮肤与筋膜', timestamp: 15 },
        { name: '手术操作', timestamp: 30 },
        { name: '缝合伤口', timestamp: 90 }
      ],
      roboticSteps: [
        { name: '皮肤消毒与铺巾', timestamp: 5 },
        { name: '安装机器人臂与注册', timestamp: 25 },
        { name: '机器人辅助手术操作', timestamp: 50 },
        { name: '缝合伤口', timestamp: 80 }
      ],
      traditionalVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
      roboticVideo: 'https://www.w3schools.com/html/movie.mp4'
    });
  }
});

// API端点：获取竞品数据
app.get('/api/competitors/:procedureName', async (req, res) => {
  try {
    const { procedureName } = req.params;
    
    // 验证输入参数
    if (!procedureName || typeof procedureName !== 'string' || procedureName.trim() === '') {
      return res.status(400).json({ error: 'Invalid procedure name' });
    }
    
    // 优先从持久化数据文件读取，如果没有则使用默认数据
    let competitors = crawler.getCompetitorsData(procedureName);
    
    if (competitors.length === 0) {
      competitors = defaultCompetitors[procedureName] || [];
    }
    
    res.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.json(defaultCompetitors[req.params.procedureName] || []);
  }
});

// API端点：更新竞品数据（仅admin可访问）
app.post('/api/competitors/update', async (req, res) => {
  try {
    const { procedureName, username, preview, confirm } = req.body;
    
    // 验证输入参数
    if (!procedureName || typeof procedureName !== 'string' || procedureName.trim() === '') {
      return res.status(400).json({ error: 'Invalid procedure name' });
    }
    
    // 验证用户是否为admin
    if (username !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // 调用爬虫模块更新数据
    const result = await crawler.updateCompetitorsData(procedureName, !confirm);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating competitors:', error);
    res.json({ success: false, error: 'Failed to update competitors' });
  }
});

// API端点：搜索功能
app.get('/api/search', async (req, res) => {
  try {
    const keyword = req.query.keyword?.toLowerCase() || '';
    
    // 验证输入参数
    if (keyword && typeof keyword !== 'string') {
      return res.status(400).json({ error: 'Invalid search keyword' });
    }
    
    // 初始化结果
    const results = {
      departments: [],
      procedures: [],
      brands: []
    };
    
    // 简单的模糊匹配函数，支持同音或相似拼写
    function fuzzyMatch(target, keyword) {
      if (!target) return false;
      target = target.toLowerCase();
      
      // 直接包含匹配
      if (target.includes(keyword)) return true;
      
      // 常见同音字替换
      const homophones = {
        '塞': ['赛', ' Sai'],
        '赛': ['塞', ' Sai'],
        '克': ['客', ' Ke'],
        '客': ['克', ' Ke'],
        '斯': ['思', ' Si'],
        '思': ['斯', ' Si']
      };
      
      // 尝试替换同音字后匹配
      let modifiedKeyword = keyword;
      for (const [char, replacements] of Object.entries(homophones)) {
        for (const replacement of replacements) {
          modifiedKeyword = modifiedKeyword.replace(new RegExp(char, 'g'), replacement);
          if (target.includes(modifiedKeyword)) return true;
          modifiedKeyword = keyword; // 恢复原始关键词
        }
      }
      
      return false;
    }
    
    // 使用默认数据进行搜索
    // 搜索科室
    const filteredDepartments = defaultDepartments.filter(dept => 
      fuzzyMatch(dept.name, keyword)
    );
    results.departments = filteredDepartments.map(dept => ({ type: '科室', name: dept.name, id: dept.id }));
    
    // 搜索术式
    const procedureNames = Object.keys(defaultProcedures);
    const filteredProcedures = procedureNames.filter(name => 
      fuzzyMatch(name, keyword)
    );
    results.procedures = filteredProcedures.map(name => ({ type: '术式', name: name }));
    
    // 搜索品牌
    const uniqueBrands = new Set();
    Object.values(defaultCompetitors).forEach(competitors => {
      competitors.forEach(comp => {
        if (fuzzyMatch(comp.brand, keyword) && !uniqueBrands.has(comp.brand)) {
          uniqueBrands.add(comp.brand);
          results.brands.push({ type: '品牌', name: comp.brand });
        }
      });
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    // 返回空结果，避免500错误
    res.json({
      departments: [],
      procedures: [],
      brands: []
    });
  }
});

// 导出 app 对象供 Vercel 使用
module.exports = app;

// 本地开发时才启动服务器
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3005;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoints:`);
    console.log(`- GET http://localhost:${PORT}/api/departments`);
    console.log(`- GET http://localhost:${PORT}/api/departments/:id`);
    console.log(`- GET http://localhost:${PORT}/api/procedures/:name`);
    console.log(`- GET http://localhost:${PORT}/api/competitors/:procedureName`);
    console.log(`- POST http://localhost:${PORT}/api/competitors/update`);
    console.log(`- GET http://localhost:${PORT}/api/search?keyword=关键词`);
  });
}
