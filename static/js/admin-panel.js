document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupLogout();
    preventBackNavigation();
    setupPromptForm();
    setupFileUploadForms();
    setupPromptSelect();
    setupFileNameDisplays();
    setupDeletePromptButton();
  });
  
  // Verificar autenticación
  function checkAuthentication() {
    fetch('/check_auth', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) window.location.href = "/login";
      })
      .catch(() => window.location.href = "/login");
  }
  
  // Logout
  function setupLogout() {
    const logoutButton = document.querySelector(".logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
          .then(res => res.json())
          .then(data => {
            if (data.success) window.location.href = "/login";
          });
      });
    }
  }
  
  // Evitar navegación hacia atrás
  function preventBackNavigation() {
    window.history.replaceState(null, null, window.location.href);
    window.addEventListener("popstate", () => window.location.href = "/login");
  }
  
  // === Prompts ===
  function loadPrompts() {
    fetch('/get_prompts')
      .then(res => res.json())
      .then(data => {
        if (!data.success) return console.error('Error loading prompts:', data.message);
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
      });
  }
  
  function setupPromptSelect() {
    loadPrompts();
  
    document.getElementById("create-new-prompt").addEventListener("click", () => {
      document.getElementById("prompt-name").value = "";
      document.getElementById("prompt-content").value = "";
      document.getElementById("prompt-select").value = "";
    });
  
    document.getElementById("prompt-select").addEventListener("change", function () {
      const selected = this.options[this.selectedIndex];
      if (selected.value) {
        document.getElementById("prompt-name").value = selected.value;
        document.getElementById("prompt-content").value = selected.dataset.content;
      }
    });
  }
  
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
      });
    });
  }
  
  function setupDeletePromptButton() {
    const deleteBtn = document.getElementById("delete-prompt");
    if (!deleteBtn) return;
  
    deleteBtn.addEventListener("click", () => {
      const name = document.getElementById("prompt-name").value.trim();
      if (!name || !confirm(`Are you sure you want to delete "${name}"?`)) return;
  
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
      });
    });
  }
  
  // === Archivos ===
  function setupFileUploadForms() {
    handleFileUpload("qa-form", "qa-file", "qa_file");
    handleFileUpload("locations-form", "locations-file", "locations_file");
  }
  
  function handleFileUpload(formId, inputId, fieldName) {
    document.getElementById(formId).addEventListener("submit", function (e) {
      e.preventDefault();
      const fileInput = document.getElementById(inputId);
      const file = fileInput.files[0];
      const submitBtn = this.querySelector("button[type='submit']");
  
      if (!file) {
        alert("Please select a file to upload");
        return;
      }
  
      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading...";
  
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
          submitBtn.disabled = false;
          submitBtn.textContent = "Upload";
          fileInput.value = "";
        });
    });
  }
  
  function setupFileNameDisplays() {
    [
      { inputId: 'qa-file', displayId: 'file-name-qa' },
      { inputId: 'locations-file', displayId: 'file-name-locations' }
    ].forEach(({ inputId, displayId }) => {
      document.getElementById(inputId).addEventListener('change', function () {
        const fileName = this.files.length > 0 ? this.files[0].name : 'No file selected';
        document.getElementById(displayId).textContent = fileName;
      });
    });
  }

  // revision 23/04/2025 
  // No usar