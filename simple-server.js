const http = require('http');

console.log('Starting simple server...');

// 创建服务器
const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // 返回静态HTML页面
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Simple Server</title>
    </head>
    <body>
      <h1>Simple Server</h1>
      <p>This is a simple server test.</p>
    </body>
    </html>
  `);
});

// 启动服务器
const PORT = 8080;
console.log('Attempting to listen on port', PORT);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}`);
});

// 捕获所有未处理的错误
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});

console.log('Server setup complete');
