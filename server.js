const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = 3000;

let chatHistory = [];

function addToChatHistory(item) {
  chatHistory.push(item);
  if (chatHistory.length > 100) {
      chatHistory.shift();
  }
}

app.use(bodyParser.json());

const wsServer = new WebSocket.Server({ port: 3030 });
console.log(`WebSocket Server is running on ws://localhost:3030`);
wsServer.on("connection", function connection(ws) {
  ws.send(JSON.stringify({ type: "init", messages: chatHistory }));
});

app.post("/messages", (req, res) => {
  const { user, message } = req.body;

  if (!user || !message) {
    return res.status(400).send("Invalid data. User and message are required.");
  }

  if (message.length > 1000) {
    return res.status(400).send("Message exceeds maximum length of 1000 characters.");
  }

  const newMessage = { user, message };
  addToChatHistory(newMessage);

  // Broadcast new message to all connected clients
  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "init", messages: [newMessage] }));
    }
  });

  res.status(201).send("Message added");
});

app.use(express.static(path.join(__dirname, "dist")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});
