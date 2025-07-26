const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('open', function open() {
  console.log('Connected to WebSocket');
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', function message(data) {
  console.log('Received:', data.toString());
  ws.close();
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
  console.log('Connection closed:', code, reason.toString());
});