// Vercel API 入口 - 纯 Node.js 版本，不依赖 Express
// 处理 /api/* 所有请求

const { parse } = require('url');

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

// 设置 CORS 头
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 解析请求体
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// Vercel Serverless Function handler
module.exports = async (req, res) => {
    // 设置 CORS
    setCorsHeaders(res);
    
    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 解析 URL
    const parsedUrl = parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;
    
    console.log(`${req.method} ${path}`);
    
    try {
        // 登录 API
        if (req.method === 'POST' && path === '/api/users/login') {
            const { username, password } = await parseBody(req);
            console.log('登录请求:', username);
            
            // 默认用户验证（不需要数据库）
            if ((username === 'admin' && password === '123456') || 
                (username === 'user' && password === 'user123')) {
                res.status(200).json({ success: true });
            } else {
                res.status(200).json({ success: false, message: '用户名或密码错误' });
            }
            return;
        }
        
        // 获取科室列表
        if (req.method === 'GET' && path === '/api/departments') {
            res.status(200).json(departments);
            return;
        }
        
        // 健康检查
        if (req.method === 'GET' && path === '/health') {
            res.status(200).json({ status: 'ok' });
            return;
        }
        
        // API 配置
        if (req.method === 'GET' && path === '/api/config') {
            res.status(200).json({ mcpPort: 3003, mcpEnabled: true });
            return;
        }
        
        // 404 - 未匹配的路由
        res.status(404).json({ error: 'API endpoint not found', path });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};
