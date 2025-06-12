document.addEventListener('DOMContentLoaded', function() {
    // Agregar mensaje de bienvenida al cargar la página
    addMessage("Hello, welcome to The Lock Up Self Storage! How can I assist you today? For example, you can ask:\n- What storage unit sizes are available?\n- How much does a unit cost?\n- What are your office hours?", false);

    // Manejar formulario de Q&A
    document.getElementById('qa-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('qa_file', document.getElementById('qa-file').files[0]);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => alert('Error al subir el archivo'));
    });

    // Manejar formulario de ubicaciones
    document.getElementById('locations-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('locations_file', document.getElementById('locations-file').files[0]);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => alert('No file has been provided'));
    });

    // Manejar formulario de prompts
    document.getElementById('prompt-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('prompt-name').value,
            content: document.getElementById('prompt-content').value
        };

        fetch('/update_prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Prompt successfully updated');
                loadPrompts(); // Recargar la lista de prompts
            } else {
                alert('Error updating the prompt: ' + data.message);
            }
        })
        .catch(error => alert('Error updating the prompt'));
    });

    // Event listener para el dropdown de prompts
    document.getElementById('prompt-select').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            document.getElementById('prompt-name').value = selectedOption.value;
            document.getElementById('prompt-content').value = selectedOption.dataset.content;
        }
    });
    
    // Event listener para el botón "Create New"
    document.getElementById('create-new-prompt').addEventListener('click', function() {
        document.getElementById('prompt-select').value = '';
        document.getElementById('prompt-name').value = '';
        document.getElementById('prompt-content').value = '';
    });

    // Cargar prompts existentes
    loadPrompts();
});

function loadPrompts() {
    fetch('/get_prompts')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.prompts.length > 0) {
                const promptSelect = document.getElementById('prompt-select');
                if (promptSelect) {
                    // Vaciar el dropdown
                    promptSelect.innerHTML = '';

                    // Añadir opción para nuevo prompt
                    const newOption = document.createElement('option');
                    newOption.value = '';
                    newOption.textContent = '-- Select a prompt --';
                    promptSelect.appendChild(newOption);

                    // Añadir prompts existentes
                    data.prompts.forEach(prompt => {
                        const option = document.createElement('option');
                        option.value = prompt.name;
                        option.textContent = prompt.name;
                        option.dataset.content = prompt.content;
                        option.selected = prompt.is_active;
                        promptSelect.appendChild(option);
                    });

                    // Si hay un prompt activo, cargar sus detalles
                    const activePrompt = data.prompts.find(p => p.is_active);
                    if (activePrompt) {
                        document.getElementById('prompt-name').value = activePrompt.name;
                        document.getElementById('prompt-content').value = activePrompt.content;
                    }
                }
            }
        })
        .catch(error => console.error('Error loading prompts:', error));
}

function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    // Procesar el formato del mensaje para mejorar la visualización
    let formattedMessage = message;

    // Detectar listas enumeradas (1. Paso uno, 2. Paso dos, etc.)
    formattedMessage = formattedMessage.replace(/(\d+\.\s+[^\n]+)(?=\n|$)/g, '<p class="step">$1</p>');

    // Detectar listas con viñetas (- Paso uno, - Paso dos, etc.)
    formattedMessage = formattedMessage.replace(/(\-\s+[^\n]+)(?=\n|$)/g, '<p class="bullet-point">$1</p>');

    // Reemplazar otros saltos de línea con <br>
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    messageDiv.innerHTML = formattedMessage;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (message) {
        addMessage(message, true);
        input.value = '';

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
        .catch(error => {
            addMessage('Sorry, there was an error processing your message.');
        });
    }
}

// Permitir enviar mensaje con Enter
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
