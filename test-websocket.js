const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('open', function open() {
  console.log('Connected to WebSocket');
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', function message(data) {
  console.log(JSON.stringify({
    event: 'websocket_message_received',
    byteLength: data.byteLength,
  }));
  ws.close();
});

ws.on('error', function error() {
  console.error('WebSocket error');
});

ws.on('close', function close(code) {
  console.log(JSON.stringify({ event: 'websocket_closed', code }));
});
