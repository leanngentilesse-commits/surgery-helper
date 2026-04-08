/**
 * Vercel：将 /api/* 全部交给根目录的 Express 应用处理。
 * 若仅部署 public 目录，仓库根目录的 api/ 不会上传，需在 Vercel 中将 Root Directory 设为仓库根目录（含 app.js 与本目录）。
 */
const app = require('../app');
module.exports = app;
