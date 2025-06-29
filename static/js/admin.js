document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  setupLogout();
  preventBackNavigation();
  loadChatHistory();
  initializeChat();
  setupPromptForm();
  setupFileUploadForms();
  setupPromptSelect();
  setupFileNameDisplays();
  setupEnterKeySubmission();
  setupDeletePromptButton();
});

// 1️⃣ Verificar sesión al cargar la página
function checkAuthentication() {
  fetch('/check_auth', { credentials: 'same-origin' })
    .then(response => response.json())
    .then(data => {
      if (!data.authenticated) {
        window.location.href = "/login";
      }
    })
    .catch(error => {
      console.error("Error verificando autenticación:", error);
      window.location.href = "/login";
    });
}

// 2️⃣ Evitar que el usuario vuelva atrás con el botón del navegador
function preventBackNavigation() {
  window.history.replaceState(null, null, window.location.href);
  window.addEventListener("popstate", function () {
    window.location.href = "/login";
  });
}

// 3️⃣ Configurar el botón de logout
function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            window.location.href = "/login";
          }
        })
        .catch(error => console.error("Error al hacer logout:", error));
    });
  }
}

// 4️⃣ Inicializar el chat con mensaje de bienvenida
function initializeChat() {
  addMessage(`
    Hello, welcome to The Lock Up Self Storage! How can I assist you today? For example, you can ask:
    - What storage unit sizes are available?
    - How much does a unit cost?
    - What are your office hours?
  `, false);
}

// 5️⃣ Cargar historial del chat
function loadChatHistory() {
  const chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
  chatHistory.forEach(item => addMessage(item.message, item.isUser));
}

// Pre 6 === Prompts ===
function loadPrompts() {
  fetch('/get_prompts')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const selectElement = document.getElementById('prompt-select');
        selectElement.innerHTML = '<option value="">-- Select a prompt --</option>';

        data.prompts.forEach(prompt => {
          const option = document.createElement('option');
          option.value = prompt.name;
          option.textContent = `${prompt.name}${prompt.is_active ? " (active)" : ""}`;
          option.dataset.content = prompt.content;
          option.dataset.active = prompt.is_active;
          selectElement.appendChild(option);
        });

        const activePrompt = data.prompts.find(p => p.is_active);
        if (activePrompt) {
          document.getElementById('prompt-select').value = activePrompt.name;
          document.getElementById('prompt-name').value = activePrompt.name;
          document.getElementById('prompt-content').value = activePrompt.content;
          document.getElementById('prompt-active').checked = true;
        }
      } else {
        console.error('Error loading prompts:', data.message);
      }
    })
    .catch(error => console.error('Error fetching prompts:', error));
}

// 6️⃣ Configurar la selección de prompts
function setupPromptSelect() {
  loadPrompts();
  document.getElementById("create-new-prompt").addEventListener("click", () => {
    document.getElementById("prompt-name").value = "";
    document.getElementById("prompt-content").value = "";
    document.getElementById("prompt-select").value = "";
  });

  document.getElementById("prompt-select").addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
      document.getElementById("prompt-name").value = selectedOption.value;
      document.getElementById("prompt-content").value = selectedOption.dataset.content;
    }
  });
}

// 7️⃣ Configurar el formulario de prompts
function setupPromptForm() {
  document.getElementById("prompt-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("prompt-name").value.trim();
    const content = document.getElementById("prompt-content").value.trim();

    if (!name || !content) {
      alert("Please provide both a name and content for the prompt");
      return;
    }

    fetch('/update_prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content })
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      if (data.success) loadPrompts();
    })
    .catch(error => console.error('Error saving prompt:', error));
  });
}

// 8️⃣ Configurar la eliminación de prompts
function setupDeletePromptButton() {
  const deleteButton = document.getElementById("delete-prompt");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      const name = document.getElementById("prompt-name").value.trim();
      if (!name) {
        alert("Please select or enter a prompt to delete.");
        return;
      }

      if (!confirm(`Are you sure you want to delete the prompt "${name}"?`)) return;

      fetch('/delete_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) {
          document.getElementById("prompt-name").value = "";
          document.getElementById("prompt-content").value = "";
          document.getElementById("prompt-select").value = "";
          loadPrompts();
        }
      })
      .catch(error => console.error('Error deleting prompt:', error));
    });
  }
}

// 9️⃣ Configurar subida de archivos
function setupFileUploadForms() {
  handleFileUpload("qa-form", "qa-file", "qa_file");
  handleFileUpload("locations-form", "locations-file", "locations_file");
}

function handleFileUpload(formId, inputId, fieldName) {
  document.getElementById(formId).addEventListener("submit", function (e) {
      e.preventDefault();
      const fileInput = document.getElementById(inputId);
      const file = fileInput.files[0];
      const submitButton = this.querySelector("button[type='submit']");

      if (!file) {
          alert("Please select a file to upload");
          return;
      }

      // Deshabilitar el botón mientras se procesa la carga
      submitButton.disabled = true;
      submitButton.textContent = "Uploading...";

      const formData = new FormData();
      formData.append(fieldName, file);

      fetch('/upload', { method: 'POST', body: formData })
          .then(response => response.json())
          .then(data => {
              alert(data.message);
          })
          .catch(error => {
              console.error(`Error uploading ${fieldName} file:`, error);
              alert("Error uploading file. Please try again.");
          })
          .finally(() => {
              // Habilitar el botón nuevamente al finalizar la carga
              submitButton.disabled = false;
              submitButton.textContent = "Upload";
              fileInput.value = ""; // Opcional: Limpiar la selección del archivo
          });
  });
}

// 🔟 Configurar la visualización de nombres de archivos
function setupFileNameDisplays() {
  [{ inputId: 'qa-file', displayId: 'file-name-qa' },
   { inputId: 'locations-file', displayId: 'file-name-locations' }]
    .forEach(({ inputId, displayId }) => {
      document.getElementById(inputId).addEventListener('change', function () {
        const fileName = this.files.length > 0 ? this.files[0].name : 'No file selected';
        document.getElementById(displayId).textContent = fileName;
      });
    });
}

// === Funciones del chatbot ===
function addMessage(message, isUser = false) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

  let formattedMessage;

  // Verifica si el mensaje contiene HTML
  const containsHTML = /<\/?[a-z][\s\S]*>/i.test(message);

  if (containsHTML) {
      // Si contiene HTML, lo insertamos tal cual
      formattedMessage = message;
  } else {
      // Si no contiene HTML, realizamos las modificaciones para formato
      formattedMessage = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Reemplazar **texto** por <strong>texto</strong>
      .replace(/(\d+\.\s+[^\n]+)(?=\n|$)/g, '<p class="step">$1</p>') // pasos numerados
      .replace(/\-\s+([^\n]+)(?=\n|$)/g, '<p class="bullet-point">$1</p>') // puntos con guiones
      .replace(/\n/g, '<br>'); // saltos de línea
  }

  // Renderizado del mensaje en el DOM
  if (!isUser) {
      messageDiv.innerHTML = `
      <div class="bot-message-content">
          <div>
              <img src="../static/assets/lock-up-bot-icon.svg" alt="Bot" class="bot-icon">
          </div>
          <div class="bot-formatted-message">
              <div>${formattedMessage}</div>
          </div>
      </div>
      `;
  } else {
      messageDiv.innerHTML = formattedMessage;
  }

  // Añadir el mensaje al chat y hacer scroll automático hacia abajo
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // Guardar el mensaje en sessionStorage
  let chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
  chatHistory.push({ message, isUser });
  sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

let messageCount = 0;
const MAX_MESSAGES_BEFORE_HELP = 5;
  
function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, true);
  input.value = '';
  // messageCount++;

  // if (messageCount >= MAX_MESSAGES_BEFORE_HELP) {
  //   setTimeout(() => {
  //     addMessage("I notice we've been chatting for a while. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
  //     messageCount = 0;
  //   }, 1000);
  // }

  const humanContactKeywords = [
    "human", "person", "agent", "representative", "speak to someone",
    "talk to someone", "real person", "customer service", "speak with a human",
    "talk with a human", "manager", "help desk", "not helpful",
    "can't help", "useless", "frustrated", "annoyed", "speak to a manager"
  ];

  const wantsHuman = humanContactKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );

  if (wantsHuman) {
    setTimeout(() => {
      addMessage("I understand you'd like to speak with a human representative. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
    }, 500);
    return;
  }

  fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  .then(response => {
    if (!response.ok) throw new Error("Server error");
    return response.json();
  })
  .then(data => addMessage(data.response))
  .catch(() => addMessage('Sorry, there was an error processing your message.'));
}

// 🔟+1 Configurar envío con Enter
function setupEnterKeySubmission() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && document.activeElement.id === 'user-input') {
            sendMessage();
        }
    });
}