// chat-core.js
// Este script contiene la lógica compartida del chatbot, usada por el widget flotante y el embed en el panel admin.

// 🛠️ 1. Mostrar el mensaje inicial de bienvenida
function initializeChat() {
  const welcomeMessage = "Hello! How can I assist you today? If you have any questions about storage, reservations, or anything else related to The Lock Up Self Storage, feel free to ask.";
  addMessage(welcomeMessage, 'bot');
}

// 💬 2. Enviar mensaje del usuario al hacer clic en el botón
function sendMessage() {
  const inputField = document.getElementById('user-input');
  const userMessage = inputField.value.trim();

  if (!userMessage) return;

  addMessage(userMessage, 'user');
  inputField.value = '';
  saveToHistory(userMessage, 'user');

  fetchBotResponse(userMessage);
}

// 🔁 3. Cargar historial de chat desde sessionStorage
function loadChatHistory() {
  const chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
  chatHistory.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}

// 💾 4. Guardar mensaje en sessionStorage para persistencia temporal
function saveToHistory(text, sender) {
  const history = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
  history.push({ text, sender });
  sessionStorage.setItem('chatHistory', JSON.stringify(history));
}

// 📥 5. Recibir respuesta del backend
async function fetchBotResponse(message) {
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.text(); // ⚠️ Suponemos que es texto plano
    console.log("🛠️ Respuesta cruda del backend:", data);

    addMessage(data, 'bot');
    saveToHistory(data, 'bot');

  } catch (error) {
    console.error('❌ Error al obtener respuesta del backend:', error);
    const fallbackMessage = "Oops! There was an issue reaching the server. Please try again later.";
    addMessage(fallbackMessage, 'bot');
    saveToHistory(fallbackMessage, 'bot');
  }
}

// 🧱 6. Agregar un mensaje al DOM
function addMessage(text, sender) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) {
    console.warn("⚠️ No se encontró el contenedor de mensajes. ¿Se llamó a addMessage antes de crear el DOM?");
    return;
  }

  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender);
  messageElem.innerHTML = text;

  chatMessages.appendChild(messageElem);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Desplazamiento automático
}

// ⌨️ 7. Enviar mensaje con Enter
function setupEnterKeySubmission() {
  const input = document.getElementById('user-input');
  if (!input) return;

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}
