// Función para agregar mensajes al chat
function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) {
        console.error("No se encontró el contenedor de mensajes.");
        return;
    }

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
        addMessage(message, true); // Agrega mensaje del usuario al chat
        input.value = '';

        fetch('http://195.200.0.73:5078/chat', { // Usa la URL correcta
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta del servidor:", data);
            if (data.response) {
                addMessage(data.response);
            } else {
                console.error("El servidor no devolvió una respuesta válida:", data);
            }
        })
        .catch(error => {
            console.error("Error en la petición:", error);
            addMessage('Hubo un error al procesar tu mensaje.');
        });
    }
}

// Permitir enviar mensaje presionando Enter
document.getElementById('user-input')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
