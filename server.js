const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// WebSocket server
const wsServer = new WebSocket.Server({ port: 3030 });

// Store chat messages in memory
let chatHistory = [];

// WebSocket connection handling
wsServer.on('connection', function connection(ws) {
    // Send current chat history to new connections
    ws.send(JSON.stringify(chatHistory));
});

// Endpoint to receive new messages
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`HTTP Server is running on http://localhost:${PORT}`);
});

// WebSocket server is already running on port 3030
console.log(`WebSocket Server is running on ws://localhost:3030`);

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