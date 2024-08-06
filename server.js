const path = require("path");
const WebSocket = require("ws");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const maxmind = require("maxmind");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const sqlite3 = require("sqlite3");
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.set('trust proxy', 1);
app.use("/public", express.static(path.join(__dirname, "dist", "public")));

const db = new sqlite3.Database("data/database.db", (err) => {
  if (err) {
    console.error("Could not open database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

let chatHistory = [];

function addToChatHistory(item) {
  chatHistory.push(item);
  if (chatHistory.length > 100) {
    chatHistory.shift();
  }
}

const dbPath = path.join(__dirname, "data/GeoLite2-City.mmdb");

let lookup;

maxmind
  .open(dbPath)
  .then((cityLookup) => {
    lookup = cityLookup;
    console.log("GeoLite2 City database loaded");
  })
  .catch((err) => {
    console.error("Error loading GeoLite2 City database", err);
  });

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

passport.use(
  new LocalStrategy(function (username, password, done) {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        // Verify password
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password." });
          }
        });
      }
    );
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    done(err, user);
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.PRODUCTION === "true",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 12, // 12 Hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "public", "login.html"));
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/admin");
  }
);

app.get("/admin", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "protected", "admin.html"));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.get("/geoip", (req, res) => {
  const ip = req.query.ip || req.ip;

  if (!lookup) {
    return res.status(500).json({ error: "GeoLite2 database not loaded yet" });
  }

  const geoData = lookup.get(ip);

  if (!geoData) {
    return res
      .status(404)
      .json({ error: "No geolocation data found for this IP" });
  }

  const city = geoData.city ? geoData.city.names.en : "Unknown";
  const country = geoData.country ? geoData.country.names.en : "Unknown";

  res.json({ city, country });
});

app.get('/api/*', ensureAuthenticated, (req, res) => {
  const pathAfterApi = req.params[0];
  const apiUrl = `${process.env.STREAM_API_URL}/${pathAfterApi}`;
  axios.get(apiUrl)
  .then(response => {
    res.json(response.data);
  })
  .catch(error => {
    console.error('Error making GET request:', error);
    res.status(500).send('Internal Server Error');
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "public", "index.html"));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'favicon.ico'));
});

// Start server
app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});
