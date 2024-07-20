const express = require("express");
const bodyParser = require("body-parser");
// const maxmind = require("maxmind");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

let chatHistory = [];

function addToChatHistory(item) {
  chatHistory.push(item);
  if (chatHistory.length > 100) {
    chatHistory.shift();
  }
}

// const dbPath = path.join(__dirname, "geolite/GeoLite2-City.mmdb");

// let lookup;

// maxmind
//   .open(dbPath)
//   .then((cityLookup) => {
//     lookup = cityLookup;
//     console.log("GeoLite2 City database loaded");
//   })
//   .catch((err) => {
//     console.error("Error loading GeoLite2 City database", err);
//   });

const wsServer = new WebSocket.Server({ port: 3030 });
console.log(`WebSocket Server is running on ws://localhost:3030`);
wsServer.on("connection", function connection(ws) {
  const cleanChatHistory = chatHistory.map(
    ({ username, timestamp, message }) => ({
      username,
      timestamp,
      message,
    })
  );
  ws.send(JSON.stringify({ type: "init", messages: cleanChatHistory }));
});

app.post("/messages", (req, res) => {
  const { username, timestamp, message } = req.body;
  const ip = req.socket.remoteAddress;

  if (message.length > 1000) {
    return res
      .status(400)
      .send("Message exceeds maximum length of 1000 characters.");
  }

  const newMessage = { username, ip, timestamp, message };
  addToChatHistory(newMessage);

  // Broadcast new message to all connected clients
  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "new",
          messages: [
            {
              username: newMessage.username,
              timestamp: newMessage.timestamp,
              message: newMessage.message,
            },
          ],
        })
      );
    }
  });

  res.status(201).send("Message added");
});

// app.get("/geoip", (req, res) => {
//   const ip = req.query.ip || req.ip;

//   if (!lookup) {
//     return res.status(500).json({ error: "GeoLite2 database not loaded yet" });
//   }

//   const geoData = lookup.get(ip);

//   if (!geoData) {
//     return res
//       .status(404)
//       .json({ error: "No geolocation data found for this IP" });
//   }

//   const city = geoData.city ? geoData.city.names.en : "Unknown";
//   const country = geoData.country ? geoData.country.names.en : "Unknown";

//   res.json({ city, country });
// });

// app.get("/admin", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "admin.html"));
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});
