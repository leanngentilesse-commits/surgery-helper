# MCP服务器使用说明

## 概述

本项目配置了一个MCP（Model Context Protocol）服务器，用于提供手术术式数据。前端会优先从MCP服务器获取数据，如果MCP服务器不可用，则回退到API调用，最后使用默认数据。

## 文件说明

- `mcp-server.js` - MCP服务器主文件
- `mcp-package.json` - MCP服务器的依赖配置
- `start-mcp-server.bat` - Windows启动脚本
- `test-mcp.js` - MCP服务器测试脚本

## 启动MCP服务器

### 方法1：使用启动脚本（推荐）
双击 `start-mcp-server.bat` 文件

### 方法2：使用命令行
```bash
node mcp-server.js
```

### 方法3：使用npm
```bash
npm install
npm start
```

## MCP服务器端点

### 健康检查
```
GET http://localhost:3003/health
```

### 获取工具列表
```
GET http://localhost:3003/mcp/tools
```

### 获取术式数据
```
POST http://localhost:3003/mcp/tools/get_procedure_data
Content-Type: application/json

{
  "procedureName": "全膝关节置换术"
}
```

### 获取术式列表
```
POST http://localhost:3003/mcp/tools/list_procedures
```

## 数据获取流程

前端按照以下优先级获取术式数据：

1. **MCP服务器** - 首先尝试从MCP服务器获取数据
2. **API调用** - 如果MCP服务器失败，尝试从后端API获取数据
3. **默认数据** - 如果API也失败，使用前端内置的默认数据

## 可用的术式

MCP服务器提供以下术式的数据：

- 全膝关节置换术
- 全髋关节置换术
- 腹腔镜胆囊切除术
- 脊柱融合术
- 前列腺癌根治术
- 肺叶切除术
- 子宫切除术
- 冠状动脉搭桥术
- 腹主动脉瘤切除术
- 胃癌根治术
- 肾部分切除术
- 巨结肠根治术
- 乳房重建术
- 颅内肿瘤切除术

## 测试MCP服务器

运行测试脚本：
```bash
node test-mcp.js
```

## 故障排除

### MCP服务器无法启动
- 检查端口3003是否被占用
- 确保已安装Node.js
- 运行 `npm install` 安装依赖

### 前端无法连接MCP服务器
- 确保MCP服务器正在运行
- 检查浏览器控制台的错误信息
- 确认CORS配置正确

### 数据获取失败
- 检查MCP服务器日志
- 确认术式名称拼写正确
- 查看浏览器控制台的详细错误信息