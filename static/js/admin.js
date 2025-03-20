// admin.js
document.addEventListener('DOMContentLoaded', function() {
  // Cargar los prompts al iniciar
  loadPrompts();

  // Mostrar mensaje de bienvenida en el chat
  addMessage(`Hello, welcome to The Lock Up Self Storage! How can I assist you today? For example, you can ask:
- What storage unit sizes are available?
- How much does a unit cost?
- What are your office hours?`, false);
});

// Cargar prompts desde el servidor
function loadPrompts() {
  fetch('/get_prompts')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const selectElement = document.getElementById('prompt-select');
        // Limpiar opciones existentes
        selectElement.innerHTML = '<option value="">-- Select a prompt --</option>';
        
        // Añadir cada prompt al selector
        data.prompts.forEach(prompt => {
          const option = document.createElement('option');
          option.value = prompt.name;
          option.textContent = prompt.name;
          option.dataset.content = prompt.content;
          option.dataset.active = prompt.is_active;
          selectElement.appendChild(option);
        });

        // Escuchar cambios en el selector
        selectElement.addEventListener('change', function() {
          const selectedOption = this.options[this.selectedIndex];
          if (selectedOption.value) {
            document.getElementById('prompt-name').value = selectedOption.value;
            document.getElementById('prompt-content').value = selectedOption.dataset.content;
          }
        });
      } else {
        console.error('Error loading prompts:', data.message);
      }
    })
    .catch(error => {
      console.error('Error fetching prompts:', error);
    });
}

// Formulario para subir archivos Q&A
document.getElementById("qa-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const file = document.getElementById("qa-file").files[0];
  
  if (!file) {
    alert("Please select a file to upload");
    return;
  }
  
  const formData = new FormData();
  formData.append("qa_file", file);
  
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => {
    console.error('Error uploading Q&A file:', error);
    alert("Error uploading file. Please try again.");
  });
});

// Formulario para subir archivos de ubicaciones
document.getElementById("locations-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const file = document.getElementById("locations-file").files[0];
  
  if (!file) {
    alert("Please select a file to upload");
    return;
  }
  
  const formData = new FormData();
  formData.append("locations_file", file);
  
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => {
    console.error('Error uploading locations file:', error);
    alert("Error uploading file. Please try again.");
  });
});

// Formulario para guardar prompts
document.getElementById("prompt-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("prompt-name").value;
  const content = document.getElementById("prompt-content").value;

  if (!name || !content) {
    alert("Please provide both a name and content for the prompt");
    return;
  }

  fetch('/update_prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, content })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    if (data.success) {
      // Recargar los prompts para actualizar el selector
      loadPrompts();
    }
  })
  .catch(error => {
    console.error('Error saving prompt:', error);
    alert("Error saving prompt. Please try again.");
  });
});

// Botón para crear un nuevo prompt
document.getElementById("create-new-prompt").addEventListener("click", function () {
  document.getElementById("prompt-name").value = "";
  document.getElementById("prompt-content").value = "";
  document.getElementById("prompt-select").value = "";
});

// Funciones del chatbot
function addMessage(message, isUser = false) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

  let formattedMessage = message;
  formattedMessage = formattedMessage.replace(/(\d+\.\s+[^\n]+)(?=\n|$)/g, '<p class="step">$1</p>');
  formattedMessage = formattedMessage.replace(/\-\s+([^\n]+)(?=\n|$)/g, '<p class="bullet-point">$1</p>');
  formattedMessage = formattedMessage.replace(/\n/g, '<br>');

  if (!isUser) {
    // Usamos rutas absolutas en lugar de plantillas Jinja2
    messageDiv.innerHTML = `
      <div class="bot-message-content">
        <div>
          <!-- <img src="{{ url_for('static', filename='assets/lock-up-bot-icon.svg') }}" alt="Bot" class="bot-icon"> -->

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

  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();

  if (message) {
    addMessage(message, true);
    input.value = '';

    const humanContactKeywords = [
      "human", "person", "agent", "representative", "speak to someone",
      "talk to someone", "real person", "customer service", "speak with a human",
      "talk with a human", "agent", "representative", "manager", "help desk",
      "not helpful", "can't help", "useless", "frustrated", "annoyed",
      "speak to a manager"
    ];

    const wantsHumanContact = humanContactKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (wantsHumanContact) {
      setTimeout(() => {
        addMessage("I understand you'd like to speak with a human representative. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
      }, 500);
      return;
    }

    fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
      addMessage(data.response);
    })
    .catch(() => {
      addMessage('Sorry, there was an error processing your message.');
    });
  }
}

// Contador de mensajes para sugerir contacto humano
let messageCount = 0;
const MAX_MESSAGES_BEFORE_HELP = 5;
const originalSendMessage = sendMessage;

sendMessage = function() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();

  if (message) {
    messageCount++;
    if (messageCount >= MAX_MESSAGES_BEFORE_HELP) {
      setTimeout(() => {
        addMessage("I notice we've been chatting for a while. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
        messageCount = 0;
      }, 1000);
    }

    originalSendMessage.call(this);
  }
};

// Enviar con Enter
document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && document.activeElement.id === 'user-input') {
    sendMessage();
  }
});

// Para el primer input de archivo
document.getElementById('qa-file').addEventListener('change', function() {
  var fileName = this.files.length > 0 ? this.files[0].name : 'No file selected';
  document.getElementById('file-name-qa').textContent = fileName;
});

// Para el segundo input de archivo
document.getElementById('locations-file').addEventListener('change', function() {
  var fileName = this.files.length > 0 ? this.files[0].name : 'No file selected';
  document.getElementById('file-name-locations').textContent = fileName;
});

// Aquí va la lógica de logout

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.querySelector(".logout-button");

  logoutButton.addEventListener("click", () => {
    window.location.href = "/login"; // Ajustar ruta en backend si es necesario
  });
});
