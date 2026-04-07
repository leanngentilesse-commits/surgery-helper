console.log('Starting test script...');

// 打印一些信息
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment variables:', Object.keys(process.env).length);

// 尝试一些基本的操作
console.log('Testing basic operations...');

// 测试数学运算
const result = 1 + 2;
console.log('1 + 2 =', result);

// 测试字符串操作
const str = 'Hello, world!';
console.log('String length:', str.length);

// 测试数组操作
const arr = [1, 2, 3, 4, 5];
console.log('Array length:', arr.length);
console.log('Array elements:', arr);

// 测试对象操作
const obj = { name: 'Test', value: 123 };
console.log('Object:', obj);

// 测试文件系统操作
const fs = require('fs');
console.log('Testing file system operations...');

try {
  // 读取当前目录
  const files = fs.readdirSync('.');
  console.log('Files in current directory:', files);
} catch (error) {
  console.error('Error reading directory:', error);
}

console.log('Test script completed successfully!');
