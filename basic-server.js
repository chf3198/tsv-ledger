const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Basic HTTP server working' }));
});

server.listen(3001, () => {
  console.log('Basic HTTP server running at http://localhost:3001');
});
