// Vercel API - 用户登录
// 路由: /api/users/login

module.exports = (req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 只处理 POST 请求
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    // 解析请求体
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { username, password } = JSON.parse(body);
            console.log('登录请求:', username);
            
            // 默认用户验证
            if ((username === 'admin' && password === '123456') || 
                (username === 'user' && password === 'user123')) {
                res.status(200).json({ success: true });
            } else {
                res.status(200).json({ success: false, message: '用户名或密码错误' });
            }
        } catch (error) {
            console.error('解析错误:', error);
            res.status(400).json({ error: 'Invalid request body' });
        }
    });
};
