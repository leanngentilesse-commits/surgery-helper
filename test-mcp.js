const http = require('http');

const postData = JSON.stringify({
    procedureName: '全膝关节置换术'
});

const options = {
    hostname: 'localhost',
    port: 3003,
    path: '/mcp/tools/get_procedure_data',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('响应数据:', data);
        try {
            const parsedData = JSON.parse(data);
            console.log('解析后的数据:', JSON.stringify(parsedData, null, 2));
        } catch (e) {
            console.error('解析失败:', e);
        }
    });
});

req.on('error', (error) => {
    console.error('请求错误:', error);
});

req.write(postData);
req.end();