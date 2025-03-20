document.addEventListener('DOMContentLoaded', function () {
    // Crear el widget de chat
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
                <span class="close-chat"><img src="../static/assets/close-x.svg"></span>
            </div>
            <div id="chat-messages"></div>
            <div class="input-container">
                <input type="text" id="user-input" placeholder="Type your question here...">
                <button id="send-button"><img src="../static/assets/send-01.svg" alt="Send"></button>
            </div>
        </div>
    `;
    document.body.appendChild(chatWidget);

    let chatOpened = false;

    // Mostrar mensaje de bienvenida solo al abrir el chat por primera vez
    document.querySelector('.chat-toggle').addEventListener('click', function () {
        document.querySelector('.chat-popup').classList.toggle('active');
        this.classList.toggle('hidden');

        if (!chatOpened) {
            addMessage(
                "Hello, welcome to The Lock Up Self Storage! How can I assist you today? For example, you can ask:\n- What storage unit sizes are available?\n- How much does a unit cost?\n- What are your office hours?",
                false
            );
            chatOpened = true;
        }
    });

    // Cerrar chat
    document.querySelector('.close-chat').addEventListener('click', function () {
        document.querySelector('.chat-popup').classList.remove('active');
        document.querySelector('.chat-toggle').classList.remove('hidden');
    });

    // Enviar mensaje con botón
    document.getElementById('send-button').addEventListener('click', sendMessage);

    // Enviar mensaje con Enter
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && document.activeElement.id === 'user-input') {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Contador de mensajes
let messageCount = 0;
const MAX_MESSAGES_BEFORE_HELP = 5;

function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, true);
    input.value = '';
    messageCount++;

    const humanContactKeywords = [
        "human", "person", "agent", "representative", "speak to someone",
        "talk to someone", "real person", "customer service", "speak with a human",
        "talk with a human", "manager", "help desk", "not helpful",
        "can't help", "useless", "frustrated", "annoyed", "speak to a manager"
    ];

    const wantsHumanContact = humanContactKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
    );

    if (wantsHumanContact) {
        setTimeout(() => {
            addMessage("I understand you'd like to speak with a human representative. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
        }, 500);
        messageCount = 0;
        return;
    }

    if (messageCount >= MAX_MESSAGES_BEFORE_HELP) {
        setTimeout(() => {
            addMessage("I notice we've been chatting for a while. If you need personal assistance, feel free to reach out to our team directly at 866-327-5625 or reservations@thelockup.com.", false);
            messageCount = 0;
        }, 1000);
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
        console.error('Error:', error);
        addMessage('Sorry, there was an error processing your message.');
    });
}

function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    let formattedMessage = message;

    // Detectar pasos numerados
    formattedMessage = formattedMessage.replace(/(\d+\.\s+[^\n]+)(?=\n|$)/g, '<p class="step">$1</p>');

    // Detectar viñetas con guiones
    formattedMessage = formattedMessage.replace(/\-\s+([^\n]+)(?=\n|$)/g, '<p class="bullet-point">$1</p>');

    // Reemplazar saltos de línea con <br>
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

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

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
