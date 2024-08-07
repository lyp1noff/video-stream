import "./styles.css";

let ws;
let pingInterval;
let initStatus = true;

async function fetchConnections() {
  const response = await fetch("/api/v3/paths/list");
  const data = await response.json();

  const statusDot = document.querySelector(".dot");

  if (data.items.length < 1) {
    statusDot.classList.add("red");
    statusDot.classList.remove("green");
    return;
  } else if (data.items[0].ready !== true) {
    statusDot.classList.add("red");
    statusDot.classList.remove("green");
    return;
  }

  statusDot.classList.add("green");
  statusDot.classList.remove("red");

  const connections = data.items[0].readers;
  const connectionList = document.querySelector("#connections");

  // Create a map of current connections by ID
  const currentConnections = new Map();
  for (const item of connectionList.children) {
    currentConnections.set(item.dataset.id, item);
  }

  // Update the list without clearing it
  for (const connection of connections) {
    const connectionDetails = await fetch(
      `api/v3/webrtcsessions/get/${connection.id}`
    );
    const connectionData = await connectionDetails.json();

    const elapsedTime = calculateElapsedTime(connectionData.created);

    if (currentConnections.has(connection.id)) {
      // Update the existing list item if it has changed
      const listItem = currentConnections.get(connection.id);
      const ip = connectionData.remoteAddr.split(":")[0];
      const geo = await fetchGeo(ip);
      const newTextContent = `Geo: ${geo.city}, ${geo.country}, IP: ${ip}, Active: ${elapsedTime}`;
      listItem.textContent = newTextContent;
      currentConnections.delete(connection.id);
    } else {
      // Create a new list item if it doesn't exist
      const listItem = document.createElement("li");
      listItem.dataset.id = connection.id;
      const ip = connectionData.remoteAddr.split(":")[0];
      const geo = await fetchGeo(ip);
      listItem.textContent = `Geo: ${geo.city}, ${geo.country}, IP: ${ip}, Active: ${elapsedTime}`;
      connectionList.appendChild(listItem);
    }
  }

  // Remove any remaining items that were not updated
  for (const [id, item] of currentConnections) {
    connectionList.removeChild(item);
  }
}

function calculateElapsedTime(createdTime) {
  const createdDate = new Date(createdTime);
  const currentDate = new Date();
  const elapsedMilliseconds = currentDate - createdDate;

  const seconds = Math.floor((elapsedMilliseconds / 1000) % 60);
  const minutes = Math.floor((elapsedMilliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((elapsedMilliseconds / (1000 * 60 * 60)) % 24);
  const days = Math.floor(elapsedMilliseconds / (1000 * 60 * 60 * 24));

  let elapsedTime = "";
  if (days > 0) elapsedTime += `${days}d `;
  if (hours > 0 || days > 0) elapsedTime += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) elapsedTime += `${minutes}m `;
  elapsedTime += `${seconds}s`;

  return elapsedTime.trim();
}

function initWebSocket() {
  ws = new WebSocket(
    `${process.env.WS_SERVER_URL}?apiKey=${process.env.ADMIN_API_KEY}`
  );

  ws.onopen = function () {
    if (initStatus) {
      const data = { type: "init" };
      ws.send(JSON.stringify(data));
      initStatus = false;
    }

    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  };

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (data.type === "new_msg" || data.type === "init") {
      const newMessages = data.messages;
      appendMessages(newMessages);
    }
  };

  ws.onclose = function () {
    console.log("WebSocket closed, attempting to reconnect...");
    setTimeout(initWebSocket, 5000);
  };

  ws.onerror = function (error) {
    console.error("WebSocket error:", error);
    ws.close();
  };
}

async function fetchGeo(ip) {
  try {
    const response = await fetch(`/geoip?ip=${ip}`);
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    const data = await response.json();
    return { country: data.country, city: data.city };
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return { country: null, city: null };
  }
}

function appendMessages(messages) {
  const chatMessages = document.querySelector(".chat-messages");
  messages.forEach((msg) => {
    const p = document.createElement("p");
    const timeSpan = document.createElement("span");
    const ipSpan = document.createElement("span");
    const userSpan = document.createElement("span");
    timeSpan.textContent = `[${new Date(msg.timestamp).toLocaleString("en-GB", {
      hour12: false,
    })}] `;
    timeSpan.classList.add("time");
    ipSpan.textContent = ` [${msg.ip}] `;
    ipSpan.classList.add("ip");
    userSpan.textContent = `${msg.username}: `;
    userSpan.classList.add("user");
    const messageText = document.createTextNode(msg.message);
    p.appendChild(timeSpan);
    p.appendChild(ipSpan);
    p.appendChild(userSpan);
    p.appendChild(messageText);
    chatMessages.appendChild(p);
  });
  scrollChatToBottom();
}

function scrollChatToBottom() {
  const chatMessages = document.querySelector(".chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function timer() {
  const time = document.querySelector(".time-container p");
  time.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
}

setInterval(timer, 500);
setInterval(fetchConnections, 1000);

initWebSocket();
