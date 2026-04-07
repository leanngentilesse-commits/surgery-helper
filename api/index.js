// Vercel API 入口 - 备用处理
// 如果 /api/users/login 直接匹配不到，会走这里

module.exports = async (req, res) => {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // 处理 OPTIONS 预检
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    const path = req.url || '';

    console.log(`${req.method} ${path}`);

    // 登录 API
    if (path === '/api/users/login' && req.method === 'POST') {
        try {
            const { username, password } = req.body || {};
            console.log('登录请求:', username);
            
            if ((username === 'admin' && password === '123456') || 
                (username === 'user' && password === 'user123')) {
                res.status(200).json({ success: true });
            } else {
                res.status(200).json({ success: false, message: '用户名或密码错误' });
            }
        } catch (e) {
            res.status(400).json({ error: '请求格式错误' });
        }
        return;
    }

    // 404
    res.status(404).json({ error: 'API endpoint not found', path });
};
