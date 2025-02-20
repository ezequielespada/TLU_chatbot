function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (message === "") return;
    
    const chatBody = document.getElementById("chat-body");
    
    // User message
    const userMessage = document.createElement("div");
    userMessage.classList.add("chat-message", "user");
    userMessage.innerHTML = `<p>${message}</p>`;
    chatBody.appendChild(userMessage);
    
    inputField.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;
    
    setTimeout(() => {
        // Bot response
        const botMessage = document.createElement("div");
        botMessage.classList.add("chat-message", "bot");
        botMessage.innerHTML = `<img src="lock02.svg" class="icon" alt="Lock"> <p>Thank you for your message!</p>`;
        chatBody.appendChild(botMessage);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
}
