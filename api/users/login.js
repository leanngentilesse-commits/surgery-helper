// Vercel API - 用户登录
// 路由: /api/users/login

module.exports = async (req, res) => {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(200).send('');
        return;
    }

    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // 只处理 POST 请求
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // 解析请求体 - Vercel 自动解析 JSON
        const { username, password } = req.body;
        console.log('登录请求:', username);
        
        // 默认用户验证
        if ((username === 'admin' && password === '123456') || 
            (username === 'user' && password === 'user123')) {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false, message: '用户名或密码错误' });
        }
    } catch (error) {
        console.error('登录错误:', error);
        res.status(400).json({ error: 'Invalid request' });
    }
};
