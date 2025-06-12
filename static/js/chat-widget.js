// chat-widget.js
// Este script construye e inicializa el widget de chat flotante visible en la página de inicio (index.html)

// 🟢 1. Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // 🧱 2. Crear e insertar el HTML del widget de chat en el body
  const chatWidget = document.createElement('div');
  chatWidget.id = 'chat-widget';
  chatWidget.innerHTML = `
    <div class="chat-toggle">
      <img src="../static/assets/chat-icon.svg" alt="Chat">
    </div>
    <div class="chat-popup">
      <div class="chat-header">
        <div class="chat-header-left">
          <img src="../static/assets/the-lock-up.svg" alt="lockup">
          <h3>THE LOCK UP</h3>
        </div>
        <span class="close-chat">
          <img src="../static/assets/close-x.svg" alt="Close">
        </span>
      </div>
      <div id="chat-messages"></div>
      <div class="input-container">
        <input type="text" id="user-input" placeholder="Type your question here...">
        <button id="send-button">
          <img src="../static/assets/send-01.svg" alt="Send">
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(chatWidget);

  // 🔁 3. Variables de estado
  let chatOpened = false;

  // 📤 4. Mostrar u ocultar el chat al hacer clic en el botón flotante
  document.querySelector('.chat-toggle').addEventListener('click', () => {
    document.querySelector('.chat-popup').classList.toggle('active'); // Mostrar u ocultar ventana de chat
    document.querySelector('.chat-toggle').classList.toggle('hidden'); // Ocultar botón flotante

    // ▶️ Inicializar chat solo una vez (mensaje de bienvenida)
    if (!chatOpened) {
      initializeChat();
      chatOpened = true;
    }
  });

  // ❌ 5. Cerrar el chat al hacer clic en el botón "X"
  document.querySelector('.close-chat').addEventListener('click', () => {
    document.querySelector('.chat-popup').classList.remove('active');
    document.querySelector('.chat-toggle').classList.remove('hidden');
  });

  // 📩 6. Enviar mensaje al hacer clic en el botón de enviar
  document.getElementById('send-button').addEventListener('click', sendMessage);

  // ⌨️ 7. Permitir enviar mensaje al presionar Enter
  setupEnterKeySubmission();

  // 🕘 8. Recuperar historial del chat si existe (sessionStorage)
  loadChatHistory();
});

// ✅ Este script debe trabajar en conjunto con chat-core.js, que contiene la lógica del chat
