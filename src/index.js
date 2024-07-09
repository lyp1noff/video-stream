import './styles.css';

async function init() {
  const sendBtn = document.querySelector('.chat-input button');
  sendBtn.addEventListener('click', sendMessage);
  
  const messageInput = document.querySelector('.chat-input textarea');
  messageInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
  });

  const ws = new WebSocket(process.env.WS_SERVER_URL);
  ws.onmessage = function (event) {
    const newMessages = JSON.parse(event.data);
    appendMessages(newMessages);
  };
}

async function sendMessage() {
  const messageInput = document.querySelector(".chat-input textarea");
  const message = messageInput.value.trim();
  messageInput.value = "";

  if (message === "") return;

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
  const chatMessages = document.querySelector('.chat-messages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.addEventListener('DOMContentLoaded', init);