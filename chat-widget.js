document.addEventListener('DOMContentLoaded', function() {
    // Crear el widget de chat
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chat-widget';
    chatWidget.innerHTML = `
        <div class="chat-toggle">
            
            <!-- link for flask <img src="/static/assets/chat-icon.svg" alt="Chat"> -->
            <img src="assets/chat-icon.svg" alt="Chat">    
        
        </div>
        <div class="chat-popup">
            <div class="chat-header">
                <div class="chat-header-left">
                    <img src="assets/the-lock-up.svg" alt="lockup">    
                    <h3>THE LOCK UP</h3>
                </div>
                <span class="close-chat"><img src="assets/close-x.svg"></span>
            </div>
            <div id="chat-messages"></div>
            <div class="input-container">
                <input type="text" id="user-input" placeholder="Type your question here...">
                <button onclick="sendMessage()"><img src="assets/send-01.svg" alt="Send">
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(chatWidget);

    // Mostrar mensaje de bienvenida
    addMessage("Hello, welcome to The Lock Up Self Storage! How can I assist you today? For example, you can ask:\n- What storage unit sizes are available?\n- How much does a unit cost?\n- What are your office hours?", false);

    // Toggle del chat
    document.querySelector('.chat-toggle').addEventListener('click', function() {
        document.querySelector('.chat-popup').classList.toggle('active');
        this.classList.toggle('hidden');
    });

    // Cerrar chat
    document.querySelector('.close-chat').addEventListener('click', function() {
        document.querySelector('.chat-popup').classList.remove('active');
        document.querySelector('.chat-toggle').classList.remove('hidden');
    });
});

function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
    // Procesar el formato del mensaje para mejorar la visualización
    let formattedMessage = message;

    // Detectar listas enumeradas (1. Paso uno, 2. Paso dos, etc.)
    formattedMessage = formattedMessage.replace(/(\d+\.\s+[^\n]+)(?=\n|$)/g, '<p class="step">$1</p>');

    // Detectar listas con viñetas simples (- Elemento uno, - Elemento dos, etc.)
    formattedMessage = formattedMessage.replace(/\-\s+([^\n]+)(?=\n|$)/g, '<p class="bullet-point">$1</p>');

    // Reemplazar otros saltos de línea con <br>
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    if (!isUser) {
        messageDiv.innerHTML = `
            <div class="bot-message-content">
                <div>
                    <img src="assets/lock-up-bot-icon.svg" alt="Bot" class="bot-icon">
                </div>
                <div class="bot-formatted-message">
                    <div>${formattedMessage}</div>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = formattedMessage;
    }
    

    // messageDiv.innerHTML = formattedMessage;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (message) {
        addMessage(message, true);
        input.value = '';

        // Detectar si el usuario quiere hablar con una persona real
        const humanContactKeywords = [
            "human", "person", "agent", "representative", "speak to someone", 
            "talk to someone", "real person", "customer service", "speak with a human", 
            "talk with a human", "agent", "representative", "manager", "help desk", 
            "not helpful", "can't help", "useless", "frustrated", "annoyed", 
            "speak to a manager"
        ];

        // Verificar si el mensaje contiene alguna de las palabras clave
        const wantsHumanContact = humanContactKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );

        if (wantsHumanContact) {
            // Responder con información de contacto
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
        .catch(error => {
            addMessage('Sorry, there was an error processing your message.');
        });
    }
}

// Contador de mensajes para ofrecer contacto humano después de varios intercambios
let messageCount = 0;
const MAX_MESSAGES_BEFORE_HELP = 5;

// Modificar sendMessage para contabilizar mensajes
const originalSendMessage = sendMessage;
sendMessage = function() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (message) {
        messageCount++;
        
        // Después de cierto número de mensajes, sugerir contacto humano
        if (messageCount >= MAX_MESSAGES_BEFORE_HELP) {
            setTimeout(() => {
                addMessage("I notice we've been chatting for a while. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
                messageCount = 0; // Reiniciar contador
            }, 1000);
        }
        
        // Llamar a la función original
        originalSendMessage.call(this);
    }
};

// Permitir enviar mensaje con Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.activeElement.id === 'user-input') {
        sendMessage();
    }
});
