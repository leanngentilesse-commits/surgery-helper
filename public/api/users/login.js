// Vercel API - 用户登录（兜底：当 Root Directory=public 时也能部署）
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};

    if (
      (username === 'admin' && password === '123456') ||
      (username === 'user' && password === 'user123')
    ) {
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
};

