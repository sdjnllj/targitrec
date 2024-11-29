const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log('\n--- New Request ---');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 处理URL，移除查询参数
    let urlPath = req.url.split('?')[0];
    
    // 如果是根路径，返回index.html
    if (urlPath === '/') {
        urlPath = '/index.html';
    }

    // 构建完整的文件路径
    const fullPath = path.join(__dirname, urlPath);
    
    // 检查路径是否试图访问父目录
    if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // 检查文件是否存在
    fs.stat(fullPath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.error('File not found:', fullPath);
                res.writeHead(404);
                res.end(`File not found: ${urlPath}`);
            } else {
                console.error('Server error:', err);
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
            return;
        }

        // 如果是目录，返回404
        if (stats.isDirectory()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        // 获取文件扩展名和内容类型
        const extname = path.extname(fullPath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };

        const contentType = contentTypes[extname] || 'application/octet-stream';

        // 读取并发送文件
        fs.readFile(fullPath, (error, content) => {
            if (error) {
                console.error('Error reading file:', error);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.end(content);
                console.log(`Successfully served ${urlPath} (${contentType})`);
            }
        });
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log('\n=== Server Started ===');
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Current directory:', __dirname);
    console.log('\nPress Ctrl+C to stop the server');
});
