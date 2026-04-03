const app = require('../app');

// Vercel Serverless Function 入口
module.exports = async (req, res) => {
  // 让 Express 处理请求
  app(req, res);
};
