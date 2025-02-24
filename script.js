document.addEventListener('DOMContentLoaded', function() {
    // Manejar formulario de Q&A
    const qaForm = document.getElementById('qa-form');
    if (qaForm) {
        qaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData();
            const qaFile = document.getElementById('qa-file').files[0];
            if (qaFile) {
                formData.append('qa_file', qaFile);
                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => alert(data.message))
                .catch(error => alert('Error al subir el archivo'));
            }
        });
    }

    // Manejar formulario de ubicaciones
    const locationsForm = document.getElementById('locations-form');
    if (locationsForm) {
        locationsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData();
            const locationsFile = document.getElementById('locations-file').files[0];
            if (locationsFile) {
                formData.append('locations_file', locationsFile);
                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => alert(data.message))
                .catch(error => alert('Error al subir el archivo'));
            }
        });
    }
});

// Función para agregar mensajes al chat
function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Función para enviar mensaje al endpoint /chat
function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (message) {
        // Agrega mensaje del usuario al chat
        addMessage(message, true);
        input.value = '';

        // Enviar petición al endpoint /chat
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Agrega respuesta del bot al chat
            addMessage(data.response);
        })
        .catch(error => {
            console.error("Error:", error);
            addMessage('Lo siento, hubo un error al procesar tu mensaje.');
        });
    }
}

// Permitir enviar mensaje presionando Enter
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
