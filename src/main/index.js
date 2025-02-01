import "./styles.css";

let ws;
let initStatus = true;

let username;

document.addEventListener('keydown', function(event) {
  const iframe = document.querySelector('.video-section iframe');

  // Check if the key pressed is 'F' or 'M'
  if (event.key.toLowerCase() === 'f') {
      toggleFullScreen(iframe);
  } else if (event.key.toLowerCase() === 'm') {
      toggleMute(iframe);
  }
});

function toggleFullScreen(iframe) {
  if (iframe.requestFullscreen) {
      if (document.fullscreenElement) {
          document.exitFullscreen();
      } else {
          iframe.requestFullscreen();
      }
  }
}

function toggleMute(iframe) {
  // Access the video element within the iframe (assuming it's your own source)
  const video = iframe.contentWindow.document.querySelector('video');
  if (video) {
      video.muted = !video.muted;
  } else {
      // Handle embedded videos like YouTube
      iframe.contentWindow.postMessage('{"event":"command","func":"mute"}', '*');
  }
}

async function init() {
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

  const toggleButton = document.querySelector(".toggle-chat");
  const chatSection = document.querySelector(".chat-section");

  toggleButton.addEventListener("click", () => {
    if (chatSection.style.display === "none") {
      chatSection.style.display = "flex";
      toggleButton.textContent = "Hide Chat";
    } else {
      chatSection.style.display = "none";
      toggleButton.textContent = "Show Chat";
    }
  });

  initWebSocket();
}

function initWebSocket() {
  ws = new WebSocket(process.env.WS_SERVER_URL);

  ws.onopen = function () {
    if (initStatus) {
      const data = { type: "init" };
      ws.send(JSON.stringify(data));
      initStatus = false;
    }

    setInterval(() => {
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

    if (data.type === "status") {
      showPlayer(data.message.status);
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

async function sendMessage() {
  const messageInput = document.querySelector(".chat-input textarea");
  const message = messageInput.value.trim();

  if (message === "") return;
  if (message.length > 1000) {
    alert("Message is too long. Please keep it under 1000 characters.");
    return;
  }

  ws.send(
    JSON.stringify({
      type: "new_user_msg",
      message_data: { username, timestamp: Date.now(), message },
    })
  );
  // const response = await fetch("/messages", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ username, timestamp: Date.now(), message }),
  // });

  // if (!response.ok) {
  //   alert("Failed to send message");
  // }

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

function showPlayer(status) {
  const videoSection = document.querySelector(".video-section");
  const iframe = document.querySelector(".video-section iframe");
  if (status) {
    iframe.style.display = "block";
    iframe.src = process.env.PLAYER_URL;
    videoSection;
  } else {
    iframe.style.display = "none";
    iframe.src = "";
  }
}

document.addEventListener("DOMContentLoaded", init);
