// chat-core.js
// Este script contiene la lógica compartida del chatbot, usada por el widget flotante y el embed en el panel admin.

// 🛠️ 1. Mostrar el mensaje inicial de bienvenida
function initializeChat() {
  const welcomeMessage = "Hello! How can I assist you today? If you have any questions about storage, reservations, or anything else related to The Lock Up Self Storage, feel free to ask.";
  addMessage(welcomeMessage, 'bot');
}

// 💬 2. Enviar mensaje del usuario al hacer clic en el botón
function sendMessage() {
  const inputField = document.getElementById('user-input');
  const userMessage = inputField.value.trim();

  if (!userMessage) return;

  addMessage(userMessage, 'user');
  inputField.value = '';
  saveToHistory(userMessage, 'user');

  fetchBotResponse(userMessage);
}

// 🔁 3. Cargar historial de chat desde sessionStorage
function loadChatHistory() {
  const chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
  chatHistory.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}

// 💾 4. Guardar mensaje en sessionStorage para persistencia temporal
function saveToHistory(text, sender) {
  const history = JSON.parse(sessionStorage.getItem('chatHistory')) || [];
  history.push({ text, sender });
  sessionStorage.setItem('chatHistory', JSON.stringify(history));
}

// 📥 5. Recibir respuesta del backend
async function fetchBotResponse(message) {
  try {
    // Mostrar indicador de carga
    const loadingId = showLoadingIndicator();
    
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    // Procesar la respuesta como JSON en lugar de texto plano
    const data = await response.json();
    console.log("🛠️ Respuesta estructurada del backend:", data);
    
    // Ocultar indicador de carga
    hideLoadingIndicator(loadingId);
    
    // Procesar la respuesta según su tipo
    processResponse(data);

  } catch (error) {
    console.error('❌ Error al obtener respuesta del backend:', error);
    const fallbackMessage = "Oops! There was an issue reaching the server. Please try again later.";
    addMessage(fallbackMessage, 'bot');
    saveToHistory(fallbackMessage, 'bot');
    hideLoadingIndicator();
  }
}

// 🔄 Mostrar indicador de carga mientras se espera la respuesta
function showLoadingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  const loadingElem = document.createElement('div');
  const loadingId = 'loading-' + Date.now();
  loadingElem.id = loadingId;
  loadingElem.classList.add('message', 'bot-message');
  loadingElem.innerHTML = `
    <div class="bot-message-content">
      <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
      <div class="bot-formatted-message">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
  chatMessages.appendChild(loadingElem);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return loadingId;
}

// ⏹️ Ocultar indicador de carga
function hideLoadingIndicator(loadingId) {
  if (loadingId) {
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) loadingElem.remove();
  }
}

// 🧩 6. Procesar diferentes tipos de respuestas del backend
function processResponse(data) {
  if (!data || !data.type || !data.content) {
    addMessage("I received an empty or malformed response. Please try again.", 'bot');
    return;
  }

  const type = data.type;
  const content = data.content;

  // 🔄 Enrutamiento por tipo de respuesta
  if (type === "text" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  else if (type === "locations" && Array.isArray(content.locations)) {
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
    renderLocations(content.locations);
  }

  else if (type === "nearby_locations" && Array.isArray(content.locations)) {
    renderNearbyLocations(content.locations, content.userLocation || "your area");
  }

  else if (type === "specific_location" && content.location) {
    renderSpecificLocation(content.location);
  }

  else if (type === "contact_request" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  else if (type === "error" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  else if (type === "no_locations" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  else {
    // 🧯 Fallback por tipo desconocido
    console.warn("⚠️ Tipo de respuesta no reconocido:", data);
    addMessage("I received a response, but I don't know how to display it. Please try asking something else.", 'bot');
  }
}

// 📍 7. Renderizar lista de ubicaciones
function renderLocations(locations) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p>Here are the locations I found:</p>
      <ul class="locations-list">`;

  locations.forEach(location => {
    html += `
      <li class="location-item">
        <strong>${location.name}</strong><br>
        ${location.address}<br>
        <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone || location.phone}</a>
      </li>`;
  });

  html += `</ul></div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}

// 🗺️ 8. Renderizar ubicaciones cercanas
function renderNearbyLocations(locations, searchLocation) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p>Here are the locations nearest to "<strong>${searchLocation}</strong>":</p>
      <ul class="locations-list">`;

  // Calcula cuál es el más cercano (primero por defecto si están ordenados)
  locations.forEach((location, index) => {
    const isClosest = index === 0;
    const distance = location.distance?.miles ? `<span class="badge">${location.distance.miles} mi</span>` : '';
    const closestBadge = isClosest ? `<span class="badge closest">Closest</span>` : '';

    const addressIcon = '<img src="../static/assets/address-icon.png" class="icon" alt="Address">';
    const phoneIcon = '<img src="../static/assets/phone-icon.png" class="icon" alt="Phone">';
    const emailIcon = '<img src="../static/assets/email-icon.png" class="icon" alt="Email">';
    const websiteIcon = '<img src="../static/assets/website-icon.png" class="icon" alt="Website">';
    const hoursIcon = '<img src="../static/assets/hours-icon.png" class="icon" alt="Hours">';

    html += `
      <li class="location-item">
        <strong>${location.name} ${distance} ${closestBadge}</strong>
        ${location.address ? `<div>${addressIcon} ${location.address}</div>` : ''}
        ${location.phone ? `<div>${phoneIcon} <a href="tel:${location.phone}">${location.phone}</a></div>` : ''}
        ${location.email ? `<div>${emailIcon} <a href="mailto:${location.email}">View email</a></div>` : ''}
        ${location.website ? `<div>${websiteIcon} <a href="${location.website}" target="_blank">View location</a></div>` : ''}
        ${location.hours ? `<div>${hoursIcon} ${location.hours}</div>` : ''}
        ${location.amenities ? `<div class="location-features"><strong>Features:</strong> ${location.amenities}</div>` : ''}
      </li>
    `;
  });

  html += `</ul></div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}

// 🏢 9. Renderizar detalles de una ubicación específica
function renderSpecificLocation(location) {
  const address = location.address || "Address not available";
  const phone = location.formattedPhone || location.phone || "Phone not available";
  const hours = location.hours || "Contact store for hours";
  const units = location.units || "Call for availability";

  const html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <div class="location-detail">
        <h4>${location.name}</h4>
        <p>${address}</p>
        <p><strong>Phone:</strong> <a href="tel:${location.phone}">${phone}</a></p>
        <p><strong>Hours:</strong> ${hours}</p>
        <p><strong>Available Units:</strong> ${units}</p>
      </div>
    </div>
  </div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}

// 🧱 10. Agregar un mensaje al DOM con soporte para HTML
function addMessage(text, sender) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) {
    console.warn("⚠️ No se encontró el contenedor de mensajes. ¿Se llamó a addMessage antes de crear el DOM?");
    return;
  }

  const messageElem = document.createElement('div');
  messageElem.classList.add('message');
  
  if (sender === 'user') {
    messageElem.classList.add('user-message');
    messageElem.textContent = text; // Para mensajes de usuario usamos texto plano
  } else {
    messageElem.classList.add('bot-message');
    // Para mensajes del bot podemos incluir HTML
    if (text.startsWith('<div class="bot-message-content">')) {
      messageElem.innerHTML = text; // Ya tiene el formato correcto
    } else {
      // Formatear texto simple como un mensaje estructurado
      const formatted = formatBotText(text);
      messageElem.innerHTML = `
        <div class="bot-message-content">
          <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
          <div class="bot-formatted-message">${formatted}</div>
        </div>
      `;      
    }
  }

  chatMessages.appendChild(messageElem);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Desplazamiento automático
}

// 🧾 10 bis. Formatear texto del bot con soporte de Markdown, HTML y listas anidadas
function formatBotText(text) {
  // 1. No escapamos HTML si ya hay etiquetas como <a>, <br>, etc.
  let html = text;

  // 2. Negrita, cursiva, enlaces markdown
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **negrita**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // *cursiva*
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'); // enlaces markdown

  // 3. Citas y separadores
  html = html
    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>') // > cita
    .replace(/^(-{3,}|\*{3,})$/gm, '<hr>');               // --- o ***

  // 4A. Listas numeradas simples (sin subitems)
  html = html.replace(/(?:^|\n)((?:\d+\..+(?:\n(?! {2,}- ).+)*))/g, (match, block) => {
    const lines = block.trim().split('\n').filter(l => /^\d+\.\s/.test(l));
    const items = lines.map(line => {
      const content = line.replace(/^\d+\.\s*/, '').trim();
      return `<li>${content}</li>`;
    });
    return '<ol>' + items.join('') + '</ol>';
  });

  // 4. Listas numeradas con sub-bullets anidados
  html = html.replace(/(?:^|\n)((?:\d+\..+(?:\n(?: {2,}- .+))+)+)/g, (match, block) => {
    const lines = block.trim().split('\n');
    let output = '<ol>';
    let currentItem = '';

    lines.forEach(line => {
      if (/^\d+\.\s/.test(line)) {
        // Si hay un ítem previo, cerramos y lo agregamos
        if (currentItem) {
          if (currentItem.includes('<ul>')) currentItem += '</ul>';
          output += `<li>${currentItem}</li>`;
        }
        // Empezamos nuevo ítem numerado
        // currentItem = line.replace(/^\d+\.\s*/, '').trim();
        currentItem = line.trim(); // 🟢 Mantiene el número escrito por el usuario

      } else if (/^\s*-\s/.test(line)) {
        // Subitem: bullet anidado dentro del ítem actual
        const subitem = line.replace(/^\s*-\s*/, '').trim();
        if (!currentItem.includes('<ul>')) {
          currentItem += '<ul>';
        }
        currentItem += `<li>${subitem}</li>`;
      }
    });

    // Agregar el último ítem restante
    if (currentItem) {
      if (currentItem.includes('<ul>')) currentItem += '</ul>';
      output += `<li>${currentItem}</li>`;
    }

    output += '</ol>';
    return output;
  });

  // 5. Convertir bloques de bullets "- item" en <ul>
  html = html.replace(/(?:^|\n)((?:\s*-\s.+(?:\n|$))+)/g, (match, listBlock) => {
    const items = listBlock.trim().split('\n').map(line =>
      `<li>${line.replace(/^\s*-\s*/, '').trim()}</li>`
    );
    return '<ul>' + items.join('') + '</ul>';
  });

  // 6. Convertir los saltos de línea restantes en <br>
  html = html.replace(/\n/g, '<br>');

  // 7. Retornar el HTML listo para insertar en el DOM
  return html;
}

// ⌨️ 11. Enviar mensaje con Enter
function setupEnterKeySubmission() {
  const input = document.getElementById('user-input');
  if (!input) return;

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}
