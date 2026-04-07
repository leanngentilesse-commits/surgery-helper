// Vercel API 入口
// 处理 /api/* 所有请求

const { parse } = require('url');
const express = require('express');
const cors = require('cors');

// 创建 Express 应用
const app = express();

// 中间件
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 登录 API
app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('登录请求:', username);
    
    // 默认用户验证（不需要数据库）
    if ((username === 'admin' && password === '123456') || 
        (username === 'user' && password === 'user123')) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: '用户名或密码错误' });
    }
});

// 获取科室列表
app.get('/api/departments', (req, res) => {
    const departments = [
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
    res.json(departments);
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API 配置
app.get('/api/config', (req, res) => {
    res.json({ mcpPort: 3003, mcpEnabled: true });
});

// Vercel Serverless Function handler
module.exports = async (req, res) => {
    // 解析 URL
    const parsedUrl = parse(req.url, true);
    req.path = parsedUrl.pathname;
    req.query = parsedUrl.query;
    
    // 处理请求
    app(req, res);
};
