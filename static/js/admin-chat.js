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
      window.location.href = "/login";
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
  
  // 4️⃣ Mensaje de bienvenida
  function initializeChat() {
    addMessage(`
      Hello, welcome to The Lock Up Self Storage! How can I assist you today? For example, you can ask:
      - What storage unit sizes are available?
      - How much does a unit cost?
      - What are your office hours?
    `, false);
  }
  
  // 5️⃣ Historial de mensajes
  function loadChatHistory() {
    const chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
    chatHistory.forEach(item => addMessage(item.message, item.isUser));
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
      .catch(err => console.error("Error loading prompts:", err));
  }
  
  function setupPromptSelect() {
    loadPrompts();
    document.getElementById("create-new-prompt").addEventListener("click", () => {
      document.getElementById("prompt-name").value = "";
      document.getElementById("prompt-content").value = "";
      document.getElementById("prompt-select").value = "";
    });
  
    document.getElementById("prompt-select").addEventListener("change", function () {
      const opt = this.options[this.selectedIndex];
      if (opt.value) {
        document.getElementById("prompt-name").value = opt.value;
        document.getElementById("prompt-content").value = opt.dataset.content;
      }
    });
  }
  
  // 7️⃣ Formulario de prompts
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
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        if (data.success) loadPrompts();
      })
      .catch(err => console.error("Error saving prompt:", err));
    });
  }
  
  // 8️⃣ Botón de eliminar prompt
  function setupDeletePromptButton() {
    const deleteBtn = document.getElementById("delete-prompt");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
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
        .catch(err => console.error("Error deleting prompt:", err));
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
        alert("Please select a file to upload");
        return;
      }
  
      btn.disabled = true;
      btn.textContent = "Uploading...";
  
      const formData = new FormData();
      formData.append(fieldName, file);
  
      fetch('/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => alert(data.message))
        .catch(err => {
          console.error(`Error uploading ${fieldName}:`, err);
          alert("Error uploading file. Please try again.");
        })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = "Upload";
          fileInput.value = "";
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
        const fileName = this.files.length > 0 ? this.files[0].name : 'No file selected';
        document.getElementById(displayId).textContent = fileName;
      });
    });
  }
  
  // Revisado el 23/04/2025
  // Se usa para el admin panel junto a chat-core.js