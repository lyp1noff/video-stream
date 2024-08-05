import "./styles.css";

let ws;
let initStatus = true;

let username;

async function init() {
  const iframe = document.querySelector(".video-section iframe");
  iframe.src = process.env.PLAYER_URL;

  username = localStorage.getItem("username");
  const usernameInput = document.querySelector(".username-container input");
  if (username) {
    usernameInput.value = username;
  } else {
    username = "dolboyeb";
    usernameInput.value = username;
    localStorage.setItem("username", username);
  }

  const usernameBtn = document.querySelector(".username-container button");
  usernameBtn.addEventListener("click", updateUsername);

  const sendBtn = document.querySelector(".chat-input button");
  sendBtn.addEventListener("click", sendMessage);

  const messageInput = document.querySelector(".chat-input textarea");
  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  initWebSocket();
}

function initWebSocket() {
  ws = new WebSocket(process.env.WS_SERVER_URL);

  ws.onmessage = function (event) {
    const newMessages = JSON.parse(event.data).messages;
    if (!initStatus) {
      if (JSON.parse(event.data).type === "init") return;
    } else {
      initStatus = false;
    }
    appendMessages(newMessages);
  };

  ws.onopen = function () {
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
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

async function sendMessage() {
  const messageInput = document.querySelector(".chat-input textarea");
  const message = messageInput.value.trim();

  if (message === "") return;
  if (message.length > 1000) {
    alert("Message is too long. Please keep it under 1000 characters.");
    return;
  }

  const response = await fetch("/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, timestamp: Date.now(), message }),
  });

  if (!response.ok) {
    alert("Failed to send message");
  }

  messageInput.value = "";
}

function appendMessages(messages) {
  const chatMessages = document.querySelector(".chat-messages");
  messages.forEach((msg) => {
    const p = document.createElement("p");
    const userSpan = document.createElement("span");
    userSpan.textContent = `${msg.username}: `;
    userSpan.classList.add("user");
    const messageText = document.createTextNode(msg.message);
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


function updateUsername() {
  const usernameInput = document.querySelector(".username-container input");
  if (usernameInput.value.length > 20) {
    alert("Nickname is too long. Please keep it under 20 characters.");
    return;
  }
  username = usernameInput.value;
  localStorage.setItem("username", username);
}

document.addEventListener("DOMContentLoaded", init);
