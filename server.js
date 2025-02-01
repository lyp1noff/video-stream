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

const PORT = 3000;
const DIST = path.join(__dirname, "dist");

let lookup;
let chatHistory = [];
let streamStatus = false;
const adminClients = new Set();
const adminIPs = new Set();
const dbPath = path.join(__dirname, "data/GeoLite2-City.mmdb");

const app = express();
app.use(bodyParser.json());
app.set("trust proxy", 1);

if (process.env.PRODUCTION === "false") {
  const webpack = require("webpack");
  const webpackConfig = require("./webpack.dev.js");
  const webpackDevMiddleware = require("webpack-dev-middleware");

  const compiler = webpack(webpackConfig);
  const devMiddleware = webpackDevMiddleware(compiler, {
    writeToDisk: true,
    publicPath: webpackConfig.output.publicPath,
    stats: { colors: true },
  });

  app.use(devMiddleware);
} else {
  app.use("/public", express.static(path.join(DIST, "public")));
}

const db = new sqlite3.Database("data/database.db", (err) => {
  if (err) {
    console.error("Could not open database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

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
wsServer.on("connection", function connection(ws, req) {
  const params = new URLSearchParams(req.url.split("?")[1]);
  const apiKey = params.get("apiKey");
  let remoteAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    
  if (remoteAddress.startsWith('::ffff:')) {
      remoteAddress = remoteAddress.substring(7);
  }

  let isAdmin = process.env.ADMIN_API_KEY === apiKey;
  if (isAdmin) {
    adminClients.add(ws);
    adminIPs.add(remoteAddress);
    console.log(`Admin connected: ${remoteAddress}`);
  }

  ws.send(
    JSON.stringify({ type: "status", message: { status: streamStatus } })
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case "adm_init": {
          if (isAdmin) {
            ws.send(JSON.stringify({ type: "init", messages: chatHistory }));
            return;
          }
          break;
        }
        case "init": {
          const cleanChatHistory = chatHistory.map(
            ({ username, timestamp, message }) => ({
              username,
              timestamp,
              message,
            })
          );
          ws.send(JSON.stringify({ type: "init", messages: cleanChatHistory }));
          break;
        }
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        case "new_user_msg":
          recievedMessage(
            data.message_data.username,
            remoteAddress,
            data.message_data.timestamp,
            data.message_data.message
          );
          break;
        default:
          console.log("Received unknown type from client:", data);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    if (isAdmin) {
      adminClients.delete(ws);
      adminIPs.delete(remoteAddress);
      console.log(`Admin disconnected: ${remoteAddress}`);
    }
  });
});

setInterval(async () => {
  if (adminClients.size < 1) return;
  if (!streamStatus) return;
  let sendData = [];

  try {
    const apiUrl = `${process.env.STREAM_API_URL}/v3/paths/list`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const connections = data.items[0].readers;

    for (const connection of connections) {
      const connectionDetails = await fetch(
        `${process.env.STREAM_API_URL}/v3/webrtcsessions/get/${connection.id}`
      ); // hell bad
      const connectionData = await connectionDetails.json();
      const ip = connectionData.remoteAddr.split(":")[0];
      if (adminIPs.has(ip)) continue;
      const geo = await fetchGeo(ip);
      sendData.push({id: connectionData.id, time: connectionData.created, ip, city: geo.city, country: geo.country})
    }
  } catch (error) {
      console.error("Error making GET request:", error);
  }

  adminClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "adm_upd",
          message: sendData,
        })
      );
    }
  });
}, 10000);

async function fetchGeo(ip) {
  if (!lookup) {
    console.log("GeoIP database connection err");
    return { city: "Unknown", country: "Unknown" };
  }
  const geoData = lookup.get(ip);
  if (!geoData) {
    return { city: "Unknown", country: "Unknown" };
  }
  const city = geoData.city ? geoData.city.names.en : "Unknown";
  const country = geoData.country ? geoData.country.names.en : "Unknown";
  return { city, country };
}

function recievedMessage(username, ip, timestamp, message) {
  if (message.length > 1000) {
    return;
  }

  const newMessage = { username, ip, timestamp, message };
  addToChatHistory(newMessage);

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (adminClients.has(client)) {
        client.send(
          JSON.stringify({ type: "new_msg", messages: [newMessage] })
        );
      } else {
        client.send(
          JSON.stringify({
            type: "new_msg",
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
    }
  });
}

function addToChatHistory(item) {
  chatHistory.push(item);
  if (chatHistory.length > 100) {
    chatHistory.shift();
  }
}

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
      SameSite: "lax",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res) => {
  res.sendFile(path.join(DIST, "public", "login.html"));
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/admin");
  }
);

app.get("/admin", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(DIST, "protected", "admin.html"));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// app.get("/geoip", (req, res) => {
//   const ip = req.query.ip || req.ip;

//   if (!lookup) {
//     return res.status(500).json({ error: "GeoLite2 database not loaded yet" });
//   }

//   const geoData = lookup.get(ip);

//   if (!geoData) {
//     return res.json({ city: "Unknown", country: "Unknown" });
//   }

//   const city = geoData.city ? geoData.city.names.en : "Unknown";
//   const country = geoData.country ? geoData.country.names.en : "Unknown";

//   res.json({ city, country });
// });

app.post("/webhook", (req, res) => {
  const { status, path } = req.query;
  console.log(`Stream is ready: path=${path}, status=${status}`);

  if (path === "stream") {
    streamStatus = status === "up";
    brodcastStreamStatus();
  }

  res.status(200).send("Stream");
});

// app.get("/api/*", ensureAuthenticated, async (req, res) => {
//   const pathAfterApi = req.params[0];
//   const apiUrl = `${process.env.STREAM_API_URL}/${pathAfterApi}`;
//   const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
//   try {
//     const response = await fetch(apiUrl);
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
//     const data = await response.json();
//     res.json({ ip: clientIp, data: data });
//   } catch (error) {
//     console.error("Error making GET request:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.get("/", (req, res) => {
  res.sendFile(path.join(DIST, "public/index.html"));
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(DIST, "favicon.ico"));
});

async function checkStreamStatus() {
  const apiUrl = `${process.env.STREAM_API_URL}/v3/paths/list`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    if (data.items.length < 1) return false;
    if (data.items[0].ready !== true) return false;
    return true;
  } catch (error) {
    console.error("Error making GET request:", error);
    return false;
  }
}

function brodcastStreamStatus() {
  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ type: "status", message: { status: streamStatus } })
      );
    }
  });
}

async function init() {
  streamStatus = await checkStreamStatus();
}
init();

// Start server
app.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});
