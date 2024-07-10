const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

let chatHistory = [];

app.use(bodyParser.json());

const wsServer = new WebSocket.Server({ port: 3030 });
console.log(`WebSocket Server is running on ws://localhost:3030`);
wsServer.on('connection', function connection(ws) {
    ws.send(JSON.stringify(chatHistory));
});

app.post('/messages', (req, res) => {
    const { user, message } = req.body;
    if (user && message) {
        const newMessage = { user, message };
        chatHistory.push(newMessage);
        
        // Broadcast new message to all connected clients
        wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify([newMessage]));
            }
        });

        res.status(201).send('Message added');
    } else {
        res.status(400).send('Invalid data');
    }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`HTTP Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    console.log('SIGINT received: closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});