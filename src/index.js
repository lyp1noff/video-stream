import "./styles.css";

let ws
let pingInterval;
let initStatus = true;

async function init() {
  const iframe = document.querySelector(".video-section iframe");
  iframe.src = process.env.PLAYER_URL;

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
      else {
        initStatus = false
      }
    }
    appendMessages(newMessages);
  };

  ws.onopen = function () {
    pingInterval = setInterval(() => {
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

  messageInput.value = "";

  const response = await fetch("/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user: "User", message }),
  });

  if (response.ok) {
    // Message sent successfully
  } else {
    alert("Failed to send message");
  }
}

function appendMessages(messages) {
  const chatMessages = document.querySelector(".chat-messages");
  messages.forEach((msg) => {
    const p = document.createElement("p");
    p.textContent = `${msg.user}: ${msg.message}`;
    chatMessages.appendChild(p);
  });
  scrollChatToBottom();
}

function scrollChatToBottom() {
  const chatMessages = document.querySelector(".chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.addEventListener("DOMContentLoaded", init);
