const http = require('http');

console.log('Starting server without listening...');

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
  
  // 返回通用默认数据
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    name: '测试手术',
    dept: '外科',
    organ: '未知'
  }));
});

console.log('Server created successfully');

// 不监听端口，只是打印一些信息
console.log('Server setup complete. Not listening on any port.');

// 测试服务器对象
console.log('Server object:', server);
console.log('Server methods:', Object.keys(server));

console.log('Test completed successfully!');
