module.exports = (req, res) => {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }

    // 获取请求路径，去掉查询参数
    const url = require('url').parse(req.url || '', true);
    const path = url.pathname;

    console.log('请求:', req.method, path);

    // 登录 API
    if (path === '/api/users/login' && req.method === 'POST') {
        const { username, password } = req.body || {};
        
        console.log('登录尝试:', username);
        
        if ((username === 'admin' && password === '123456') || 
            (username === 'user' && password === 'user123')) {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false, message: '用户名或密码错误' });
        }
        return;
    }

    // 其他路径返回 404
    res.status(404).json({ error: 'Not found', path: path });
};
