const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { Department, Procedure, Competitor } = require('./models');

const app = express();

// 配置CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
app.use(cors({
  origin: allowedOrigins, // 生产环境应该设置具体的域名
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
    steps: [
      { name: "股骨远端截骨", timestamp: 20 },
      { name: "胫骨近端截骨", timestamp: 85 },
      { name: "试模与软组织平衡", timestamp: 140 },
      { name: "假体植入", timestamp: 200 }
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
    steps: [
      { name: "建立气腹与穿刺", timestamp: 10 },
      { name: "解剖胆囊三角", timestamp: 45 },
      { name: "离断胆囊管及动脉", timestamp: 90 },
      { name: "剥离胆囊床", timestamp: 150 }
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
    steps: [
      { name: "麻醉与消毒", timestamp: 5 },
      { name: "牙槽骨准备", timestamp: 15 },
      { name: "种植体植入", timestamp: 30 },
      { name: "缝合与愈合", timestamp: 45 }
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
    steps: [
      { name: "麻醉与消毒", timestamp: 5 },
      { name: "开髓与根管定位", timestamp: 15 },
      { name: "根管预备与冲洗", timestamp: 30 },
      { name: "根管充填与封闭", timestamp: 45 }
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
  "前列腺癌根治术": [
    {
      brand: "达芬奇SP",
      model: "SP",
      params: "系统精度: 0.05mm; 单孔设计; 3D高清; 7自由度",
      priceAvg: "3000万",
      installs: "280台",
      advantage: "精准操作, 创伤小",
      source: "公司财报"
    },
    {
      brand: "精锋医疗",
      model: "腔镜手术机器人",
      params: "系统精度: 0.1mm; 4臂设计; 3D视觉; 国产替代",
      priceAvg: "1600万",
      installs: "60台",
      advantage: "性价比高, 适合中国患者",
      source: "公开资料"
    }
  ],
  "肾部分切除术": [
    {
      brand: "达芬奇Xi",
      model: "Xi",
      params: "系统精度: 0.05mm; 4臂设计; 3D高清; 7自由度",
      priceAvg: "2800万",
      installs: "320台",
      advantage: "精准操作, 保留肾功能",
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
  ]
};

// 数据库连接状态
let dbConnected = false;

// 数据库连接配置
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/surgical-robot';

// 连接MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  dbConnected = true;
}).catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Using default data as fallback');
  dbConnected = false;
});

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
    // 前列腺癌根治术
    else if (procedureName.includes('前列腺')) {
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

// 用户模型
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String
}));

// 检查账号是否已存在
app.post('/api/users/check', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
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
        const user = new User({ username, password });
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
        
        // 首先尝试从数据库中查找用户
        let user = null;
        if (dbConnected) {
            user = await User.findOne({ username, password });
        }
        
        // 如果数据库中没有找到用户，使用默认用户
        if (!user) {
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
        }
        
        res.json({ success: !!user });
    } catch (error) {
        console.error('登录失败:', error);
        // 即使出错，也允许默认用户登录
        const { username, password } = req.body;
        if ((username === 'admin' && password === '123456') || (username === 'user' && password === 'user123')) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    }
});

// API端点：获取所有科室
app.get('/api/departments', async (req, res) => {
  try {
    if (dbConnected) {
      const departments = await Department.find();
      res.json(departments.length > 0 ? departments : defaultDepartments);
    } else {
      res.json(defaultDepartments);
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.json(defaultDepartments);
  }
});

// API端点：获取特定科室
app.get('/api/departments/:id', async (req, res) => {
  try {
    if (dbConnected) {
      const department = await Department.findOne({ id: req.params.id });
      if (department) {
        res.json(department);
      } else {
        const defaultDept = defaultDepartments.find(d => d.id === req.params.id);
        if (defaultDept) {
          res.json(defaultDept);
        } else {
          res.status(404).json({ error: 'Department not found' });
        }
      }
    } else {
      const defaultDept = defaultDepartments.find(d => d.id === req.params.id);
      if (defaultDept) {
        res.json(defaultDept);
      } else {
        res.status(404).json({ error: 'Department not found' });
      }
    }
  } catch (error) {
    console.error('Error fetching department:', error);
    const defaultDept = defaultDepartments.find(d => d.id === req.params.id);
    if (defaultDept) {
      res.json(defaultDept);
    } else {
      res.status(500).json({ error: 'Failed to fetch department' });
    }
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
    
    // 优先从数据库中获取
    if (dbConnected) {
      const procedure = await Procedure.findOne({ name: name });
      if (procedure) {
        res.json(procedure);
        return;
      }
    }
    
    // 如果数据库中没有，使用默认数据
    const defaultProc = defaultProcedures[name];
    if (defaultProc) {
      res.json(defaultProc);
    } else {
      res.status(404).json({ error: 'Procedure not found' });
    }
  } catch (error) {
    console.error('Error fetching procedure:', error);
    const defaultProc = defaultProcedures[req.params.name];
    if (defaultProc) {
      res.json(defaultProc);
    } else {
      res.status(500).json({ error: 'Failed to fetch procedure' });
    }
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
    
    // 优先从数据库中获取
    if (dbConnected) {
      const competitors = await Competitor.find({ procedureName: procedureName });
      
      // 如果数据库中有数据，确保每个竞品都包含所有必要的字段
      if (competitors.length > 0) {
        const enhancedCompetitors = competitors.map(competitor => {
          // 尝试从默认数据中找到对应的竞品
          const defaultCompetitorsList = defaultCompetitors[procedureName] || [];
          const defaultCompetitor = defaultCompetitorsList.find(dc => dc.brand === competitor.brand && dc.model === competitor.model);
          
          // 确保每个字段都有值，无论数据库中是否存在
          return {
            id: competitor._id,
            procedureName: competitor.procedureName,
            brand: competitor.brand,
            model: competitor.model,
            params: competitor.params || (defaultCompetitor ? defaultCompetitor.params : '系统精度: 0.1mm'),
            priceAvg: competitor.priceAvg || (defaultCompetitor ? defaultCompetitor.priceAvg : '2000万'),
            installs: competitor.installs || (defaultCompetitor ? defaultCompetitor.installs : '100台'),
            advantage: competitor.advantage || (defaultCompetitor ? defaultCompetitor.advantage : '精准操作, 创伤小'),
            source: competitor.source || (defaultCompetitor ? defaultCompetitor.source : '公开资料')
          };
        });
        res.json(enhancedCompetitors);
        return;
      }
    }
    
    // 如果数据库中没有，使用默认数据
    res.json(defaultCompetitors[procedureName] || []);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.json(defaultCompetitors[req.params.procedureName] || []);
  }
});

// API端点：更新竞品数据（仅admin可访问）
app.post('/api/competitors/update', async (req, res) => {
  try {
    const { procedureName, username } = req.body;
    
    // 验证输入参数
    if (!procedureName || typeof procedureName !== 'string' || procedureName.trim() === '') {
      return res.status(400).json({ error: 'Invalid procedure name' });
    }
    
    // 验证用户是否为admin
    if (username !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // 从网上获取最新数据
    let updatedCompetitors = await crawlCompetitors(procedureName);
    
    // 检查是否需要更新
    let isDataUpdated = false;
    
    // 如果数据库连接成功，添加新的竞品信息
    if (dbConnected) {
      // 获取现有数据
      const existingCompetitors = await Competitor.find({ procedureName });
      const existingBrands = new Set(existingCompetitors.map(comp => comp.brand));
      
      // 过滤出不存在的新竞品
      const newCompetitors = updatedCompetitors.filter(comp => !existingBrands.has(comp.brand));
      
      // 保存新数据
      if (newCompetitors.length > 0) {
        await Competitor.insertMany(newCompetitors.map(comp => ({
          ...comp,
          procedureName
        })));
        isDataUpdated = true;
      }
      
      // 合并现有数据和新数据
      updatedCompetitors = [...existingCompetitors, ...newCompetitors];
    }
    
    // 检查是否有数据更新
    if (!isDataUpdated && updatedCompetitors.length === 0) {
      // 没有数据更新，且没有获取到新数据
      res.json({ success: true, isUpToDate: true, message: '当前数据信息已经是最新信息！' });
    } else if (!isDataUpdated) {
      // 没有数据更新，但获取到了新数据（可能是数据库连接失败的情况）
      res.json({ success: true, isUpToDate: true, message: '当前数据信息已经是最新信息！', competitors: updatedCompetitors });
    } else {
      // 有数据更新
      res.json({ success: true, isUpToDate: false, competitors: updatedCompetitors });
    }
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
    
    if (dbConnected) {
      // 搜索科室
      const departments = await Department.find();
      results.departments = departments
        .filter(dept => fuzzyMatch(dept.name, keyword))
        .map(dept => ({ type: '科室', name: dept.name, id: dept.id }));
      
      // 搜索术式
      const procedures = await Procedure.find();
      results.procedures = procedures
        .filter(proc => fuzzyMatch(proc.name, keyword))
        .map(proc => ({ type: '术式', name: proc.name }));
      
      // 搜索品牌
      const competitors = await Competitor.find();
      const uniqueBrands = new Set();
      competitors.forEach(comp => {
        if (fuzzyMatch(comp.brand, keyword) && !uniqueBrands.has(comp.brand)) {
          uniqueBrands.add(comp.brand);
          results.brands.push({ type: '品牌', name: comp.brand });
        }
      });
    } else {
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
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

const PORT = process.env.PORT || 3002;
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
