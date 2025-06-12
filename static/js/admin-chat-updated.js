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
  setupEnterKeySubmission(); // Esta viene de chat-core.js
  setupDeletePromptButton();
  setupActivePromptToggle(); // Nuevo manejador para el checkbox de activar prompts
});

// 1️⃣ Verificar sesión
function checkAuthentication() {
  fetch('/check_auth', { credentials: 'same-origin' })
    .then(res => res.json())
    .then(data => {
      if (!data.authenticated) window.location.href = "/login";
    })
    .catch(() => window.location.href = "/login");
}

// 2️⃣ Evitar navegación hacia atrás
function preventBackNavigation() {
  window.history.replaceState(null, null, window.location.href);
  window.addEventListener("popstate", () => {
    window.history.forward();
  });
}

// 3️⃣ Logout
function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
          if (data.success) window.location.href = "/login";
        })
        .catch(error => console.error("Logout error:", error));
    });
  }
}

// 4️⃣ Mensaje de bienvenida específico para el panel de administración
function initializeChat() {
  const welcomeMessage = `
    <div class="bot-message-content">
      <img src="${getAssetUrl('the-lock-up.svg')}" class="bot-icon" alt="Bot">
      <div class="bot-formatted-message">
        Hello admin! Welcome to The Lock Up Self Storage Chat. You can test the chatbot here or make changes to the system using the admin controls. Try asking:
        <ul>
          <li class="bullet-point">How many locations do we have?</li>
          <li class="bullet-point">What storage unit sizes are available?</li>
          <li class="bullet-point">Show me Chicago locations</li>
        </ul>
      </div>
    </div>
  `;
  addMessage(welcomeMessage, 'bot');
}

// 5️⃣ Historial de mensajes específico para admin
function loadChatHistory() {
  const chatHistory = JSON.parse(sessionStorage.getItem('adminChatHistory')) || [];
  chatHistory.forEach(item => addMessage(item.text, item.sender));
}

// Sobrescribir la función saveToHistory para guardar en una clave específica para admin
function saveToHistory(text, sender) {
  const history = JSON.parse(sessionStorage.getItem('adminChatHistory')) || [];
  history.push({ text, sender });
  sessionStorage.setItem('adminChatHistory', JSON.stringify(history));
}

// 6️⃣ Select de prompts
function loadPrompts() {
  fetch('/get_prompts')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const select = document.getElementById('prompt-select');
        select.innerHTML = '<option value="">-- Select a prompt --</option>';

        data.prompts.forEach(prompt => {
          const option = document.createElement('option');
          option.value = prompt.name;
          option.textContent = `${prompt.name}${prompt.is_active ? " (active)" : ""}`;
          option.dataset.content = prompt.content;
          option.dataset.active = prompt.is_active;
          select.appendChild(option);
        });

        const active = data.prompts.find(p => p.is_active);
        if (active) {
          document.getElementById('prompt-select').value = active.name;
          document.getElementById('prompt-name').value = active.name;
          document.getElementById('prompt-content').value = active.content;
          document.getElementById('prompt-active').checked = true;
        }
      }
    })
    .catch(err => {
      console.error("Error loading prompts:", err);
      showNotification("Error loading prompts. Please check the console for details.", "error");
    });
}

function setupPromptSelect() {
  loadPrompts();
  document.getElementById("create-new-prompt").addEventListener("click", () => {
    document.getElementById("prompt-name").value = "";
    document.getElementById("prompt-content").value = "";
    document.getElementById("prompt-select").value = "";
    document.getElementById("prompt-active").checked = false;
  });

  document.getElementById("prompt-select").addEventListener("change", function () {
    const opt = this.options[this.selectedIndex];
    if (opt.value) {
      document.getElementById("prompt-name").value = opt.value;
      document.getElementById("prompt-content").value = opt.dataset.content;
      document.getElementById("prompt-active").checked = opt.dataset.active === "true";
    }
  });
}

// 7️⃣ Formulario de prompts
function setupPromptForm() {
  document.getElementById("prompt-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("prompt-name").value.trim();
    const content = document.getElementById("prompt-content").value.trim();
    const isActive = document.getElementById("prompt-active").checked;

    if (!name || !content) {
      showNotification("Please provide both a name and content for the prompt", "error");
      return;
    }

    // Mostrar indicador de carga
    const submitBtn = this.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    fetch('/update_prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, is_active: isActive })
    })
    .then(res => res.json())
    .then(data => {
      showNotification(data.message, data.success ? "success" : "error");
      if (data.success) loadPrompts();
    })
    .catch(err => {
      console.error("Error saving prompt:", err);
      showNotification("Error saving prompt. Please try again.", "error");
    })
    .finally(() => {
      // Restaurar el botón
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
  });
}

// Nuevo: Manejar el toggle de activación de prompts
function setupActivePromptToggle() {
  document.getElementById("prompt-active").addEventListener("change", function() {
    const isChecked = this.checked;
    // Si está marcado, confirmamos si quiere desactivar otros prompts activos
    if (isChecked) {
      const promptName = document.getElementById("prompt-name").value.trim();
      if (promptName) {
        console.log(`El prompt "${promptName}" ha sido marcado como activo`);
      }
    }
  });
}

// 8️⃣ Botón de eliminar prompt
function setupDeletePromptButton() {
  const deleteBtn = document.getElementById("delete-prompt");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const name = document.getElementById("prompt-name").value.trim();
      if (!name) {
        showNotification("Please select or enter a prompt to delete.", "error");
        return;
      }

      if (!confirm(`Are you sure you want to delete the prompt "${name}"?`)) return;

      // Mostrar indicador de carga
      const originalText = deleteBtn.textContent;
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";

      fetch('/delete_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      .then(res => res.json())
      .then(data => {
        showNotification(data.message, data.success ? "success" : "error");
        if (data.success) {
          document.getElementById("prompt-name").value = "";
          document.getElementById("prompt-content").value = "";
          document.getElementById("prompt-select").value = "";
          document.getElementById("prompt-active").checked = false;
          loadPrompts();
        }
      })
      .catch(err => {
        console.error("Error deleting prompt:", err);
        showNotification("Error deleting prompt. Please try again.", "error");
      })
      .finally(() => {
        // Restaurar el botón
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalText;
      });
    });
  }
}

// 9️⃣ Subida de archivos
function setupFileUploadForms() {
  handleFileUpload("qa-form", "qa-file", "qa_file");
  handleFileUpload("locations-form", "locations-file", "locations_file");
}

function handleFileUpload(formId, inputId, fieldName) {
  document.getElementById(formId).addEventListener("submit", function (e) {
    e.preventDefault();
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];
    const btn = this.querySelector("button[type='submit']");

    if (!file) {
      showNotification("Please select a file to upload", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Uploading...";

    const formData = new FormData();
    formData.append(fieldName, file);

    fetch('/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        showNotification(data.message, data.success ? "success" : "error");
      })
      .catch(err => {
        console.error(`Error uploading ${fieldName}:`, err);
        showNotification("Error uploading file. Please try again.", "error");
      })
      .finally(() => {
        btn.disabled = false;
        btn.textContent = "Upload";
        fileInput.value = "";
        document.getElementById(`file-name-${fieldName.split('_')[0]}`).textContent = "No file selected...";
      });
  });
}

// 🔟 Visualización del nombre de archivo
function setupFileNameDisplays() {
  [
    { inputId: 'qa-file', displayId: 'file-name-qa' },
    { inputId: 'locations-file', displayId: 'file-name-locations' }
  ].forEach(({ inputId, displayId }) => {
    document.getElementById(inputId).addEventListener("change", function () {
      const fileName = this.files.length > 0 ? this.files[0].name : 'No file selected...';
      document.getElementById(displayId).textContent = fileName;
    });
  });
}

// 11 📢 Notificaciones
function showNotification(message, type = "info") {
  // Crear elemento de notificación si no existe
  let notificationArea = document.getElementById('notification-area');
  if (!notificationArea) {
    notificationArea = document.createElement('div');
    notificationArea.id = 'notification-area';
    notificationArea.style.position = 'fixed';
    notificationArea.style.top = '20px';
    notificationArea.style.right = '20px';
    notificationArea.style.zIndex = '1000';
    document.body.appendChild(notificationArea);
  }

  // Crear la notificación
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <p>${message}</p>
      <span class="close-notification">&times;</span>
    </div>
  `;
  notification.style.marginBottom = '10px';
  notification.style.padding = '15px';
  notification.style.borderRadius = '5px';
  notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  notification.style.minWidth = '250px';
  notification.style.animation = 'fadeIn 0.5s';

  // Establecer color según el tipo
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#d4edda';
      notification.style.color = '#155724';
      notification.style.borderColor = '#c3e6cb';
      break;
    case 'error':
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.borderColor = '#f5c6cb';
      break;
    default: // info
      notification.style.backgroundColor = '#e2f0fd';
      notification.style.color = '#0c5460';
      notification.style.borderColor = '#bee5eb';
  }

  // Añadir al área de notificaciones
  notificationArea.appendChild(notification);

  // Cerrar al hacer clic
  notification.querySelector('.close-notification').addEventListener('click', () => {
    notification.remove();
  });

  // Auto cerrar después de 5 segundos
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// 🔗 Función auxiliar para manejar rutas de assets según el entorno
function getAssetUrl(filename) {
  // Intentar usar Flask url_for si está disponible (producción)
  if (typeof Flask !== 'undefined' && Flask.url_for) {
    return Flask.url_for('static', {filename: `assets/${filename}`});
  }
  
  // Alternativa para desarrollo local o cuando Flask no está disponible
  return `../static/assets/${filename}`;
}

// Revisado el 08/05/2025
// Se usa para el admin panel junto a chat-core.js
