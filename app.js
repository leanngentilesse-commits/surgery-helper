const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { Department, Procedure, Competitor } = require('./models');

const app = express();

// 配置CORS
app.use(cors({
  origin: '*', // 允许所有来源，生产环境应该设置具体的域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  { id: "pediatric", name: "小儿外科", organs: [
    { name: "先天性巨结肠", order: 1, procedures: ["巨结肠根治术"] }
  ]},
  { id: "plastic", name: "整形外科", organs: [
    { name: "乳房", order: 1, procedures: ["乳房重建术"] }
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
  }
};

const defaultCompetitors = {
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

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/surgical-robot', {
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
    if (dbConnected) {
      const procedure = await Procedure.findOne({ name: req.params.name });
      if (procedure) {
        res.json(procedure);
      } else {
        const defaultProc = defaultProcedures[req.params.name];
        if (defaultProc) {
          res.json(defaultProc);
        } else {
          res.status(404).json({ error: 'Procedure not found' });
        }
      }
    } else {
      const defaultProc = defaultProcedures[req.params.name];
      if (defaultProc) {
        res.json(defaultProc);
      } else {
        res.status(404).json({ error: 'Procedure not found' });
      }
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
    if (dbConnected) {
      const competitors = await Competitor.find({ procedureName: req.params.procedureName });
      res.json(competitors.length > 0 ? competitors : defaultCompetitors[req.params.procedureName] || []);
    } else {
      res.json(defaultCompetitors[req.params.procedureName] || []);
    }
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.json(defaultCompetitors[req.params.procedureName] || []);
  }
});

// API端点：搜索功能
app.get('/api/search', async (req, res) => {
  try {
    const keyword = req.query.keyword?.toLowerCase() || '';
    
    if (dbConnected) {
      // 搜索科室
      const departments = await Department.find({ name: { $regex: keyword, $options: 'i' } });
      
      // 搜索术式
      const procedures = await Procedure.find({ name: { $regex: keyword, $options: 'i' } });
      
      // 构建搜索结果
      const results = {
        departments: departments.map(dept => ({ type: '科室', name: dept.name, id: dept.id })),
        procedures: procedures.map(proc => ({ type: '术式', name: proc.name }))
      };
      
      res.json(results);
    } else {
      // 使用默认数据进行搜索
      const filteredDepartments = defaultDepartments.filter(dept => 
        dept.name.toLowerCase().includes(keyword)
      );
      
      const procedureNames = Object.keys(defaultProcedures);
      const filteredProcedures = procedureNames.filter(name => 
        name.toLowerCase().includes(keyword)
      );
      
      const results = {
        departments: filteredDepartments.map(dept => ({ type: '科室', name: dept.name, id: dept.id })),
        procedures: filteredProcedures.map(name => ({ type: '术式', name: name }))
      };
      
      res.json(results);
    }
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
  console.log(`- GET http://localhost:${PORT}/api/search?keyword=关键词`);
});
