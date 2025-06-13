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

// 🧩 6. Procesar diferentes tipos de respuestas del backend - VERSIÓN ACTUALIZADA
function processResponse(data) {
  if (!data || !data.type || !data.content) {
    addMessage("I received an empty or malformed response. Please try again.", 'bot');
    return;
  }

  const type = data.type;
  const content = data.content;

  console.log("🔍 Procesando respuesta tipo:", type, content); // Debug

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
      // IMPORTANTE: Mostrar primero el mensaje amable si existe
      if (content.message) {
        addMessage(content.message, 'bot');
        saveToHistory(content.message, 'bot');
      }
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

  // *** NUEVO CASO PARA PRICING WITH AI ***
  else if (type === "pricing_with_ai") {
    // Primero mostrar el mensaje principal
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
    
    // Si hay ubicaciones, mostrarlas también
    if (Array.isArray(content.locations) && content.locations.length > 0) {
      renderPricingLocations(content.locations, content.state);
    }
  }

  // *** NUEVO CASO PARA PRICE WITH LOCATIONS ***
  else if (type === "price_with_locations") {
    // Mostrar mensaje principal sobre precios
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
    
    // Mostrar ubicaciones relevantes
    if (Array.isArray(content.locations) && content.locations.length > 0) {
      renderPricingLocations(content.locations, content.state);
    }
  }

  // *** NUEVOS CASOS PARA AMENIDADES ***
  else if (type === "amenity_locations" && Array.isArray(content.locations)) {
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
    renderAmenityLocations(content.locations, content.amenity);
  }
  
  else if (type === "no_amenity_found" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  // *** NUEVO CASO PARA RESPUESTAS INTERPRETADAS POR IA ***
  else if (type === "ai_interpreted" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  // *** NUEVO CASO PARA FAQ MEJORADAS ***
  else if (type === "enhanced_faq" && content.message) {
    addMessage(content.message, 'bot');
    saveToHistory(content.message, 'bot');
  }

  else if (type === "area_locations" && Array.isArray(content.locations)) {
      if (content.message) {
        addMessage(content.message, 'bot');
        saveToHistory(content.message, 'bot');
      }
      renderAreaLocations(content.locations, content.area);
  }
  
  else if (type === "no_area_locations" && content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
  }
  
  else if (type === "location_help" && content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
  }

  // *** NUEVO CASO PARA PRICING WITH LOCATIONS ***
  else if (type === "pricing_with_locations") {
    // Mostrar mensaje principal sobre precios con contexto
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
  
    // Mostrar ubicaciones con contexto específico de precios
    if (Array.isArray(content.locations) && content.locations.length > 0) {
      renderPricingLocationsWithContext(content.locations, content.state);
    }
  }
  
  // *** NUEVO CASO PARA PRICING GENERAL ***
  else if (type === "pricing_general") {
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
  }
  
  // *** NUEVO CASO PARA FEATURES INFO ***
  else if (type === "features_info") {
    if (content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    }
  }

  else if (type === "combined_response") {
      // Mostrar el mensaje principal (FAQ + contexto)
      if (content.message) {
        addMessage(content.message, 'bot');
        saveToHistory(content.message, 'bot');
      }
      
      // Si hay ubicaciones, mostrarlas después del mensaje
      if (content.locations && Array.isArray(content.locations)) {
        renderCombinedLocations(content.locations, content.userLocation);
      }
      
      // Log adicional para debug
      if (content.faq_used) {
        console.log("📋 FAQ utilizada:", content.faq_used);
      }
  }


  else {
    // 🧯 Fallback por tipo desconocido - MEJORADO
    console.warn("⚠️ Tipo de respuesta no reconocido:", data);
    console.log("📋 Contenido completo:", JSON.stringify(data, null, 2));
    
    // Intentar mostrar el mensaje si existe
    if (content && content.message) {
      addMessage(content.message, 'bot');
      saveToHistory(content.message, 'bot');
    } else {
      addMessage("I received a response, but I don't know how to display it. Please try asking something else.", 'bot');
    }
  }
}

// 💰 Nueva función para renderizar ubicaciones en contexto de precios
function renderPricingLocations(locations, stateName) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">`;

  if (stateName) {
    html += `<p><strong>Our ${stateName} locations for pricing inquiries:</strong></p>`;
  } else {
    html += `<p><strong>Contact these locations for specific pricing:</strong></p>`;
  }

  html += `<ul class="locations-list pricing-locations">`;

  locations.forEach(location => {
    html += `
      <li class="location-item pricing-item">
        <div class="location-header">
          <strong>${location.name}</strong>
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">${location.address}</div>` : ''}
          ${location.formattedPhone ? 
            `<div class="location-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
            </div>` : ''}
          ${location.email ? 
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ? 
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location Page</a>
            </div>` : ''}
          ${location.hours ? 
            `<div class="location-hours">
              🕒 <strong>Hours:</strong> ${location.hours}
            </div>` : ''}
          ${location.distance ? 
            `<div class="location-distance">
              📍 <strong>Distance:</strong> ${location.distance.miles} miles
            </div>` : ''}
        </div>
      </li>`;
  });

  html += `</ul></div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}

// *** NUEVA FUNCIÓN PARA RENDERIZAR UBICACIONES CON AMENIDADES ***
function renderAmenityLocations(locations, amenityName) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p><strong>Locations with ${amenityName}:</strong></p>
      <ul class="locations-list amenity-locations">`;

  locations.forEach(location => {
    html += `
      <li class="location-item amenity-item">
        <div class="location-header">
          <strong>${location.name}</strong>
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">📍 ${location.address}</div>` : ''}
          ${location.formattedPhone ? 
            `<div class="location-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
            </div>` : ''}
          ${location.email ? 
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ? 
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location</a>
            </div>` : ''}
          ${location.hours ? 
            `<div class="location-hours">
              🕒 Hours: ${location.hours}
            </div>` : ''}
          ${location.amenities ? 
            `<div class="location-amenities">
              ✨ Features: ${location.amenities.substring(0, 100)}${location.amenities.length > 100 ? '...' : ''}
            </div>` : ''}
        </div>
      </li>`;
  });

  html += `</ul></div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}



// 📍 7. Renderizar lista de ubicaciones
function renderLocations(locations) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p>Here are the locations I found:</p>
      <ul class="locations-list general-locations">`;

  locations.forEach(location => {
    html += `
      <li class="location-item">
        <div class="location-header">
          <strong>${location.name}</strong>
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">📍 ${location.address}</div>` : ''}
          ${location.formattedPhone ? 
            `<div class="location-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
            </div>` : ''}
          ${location.email ? 
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ? 
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location</a>
            </div>` : ''}
          ${location.hours ? 
            `<div class="location-hours">
              🕒 Hours: ${location.hours}
            </div>` : ''}
        </div>
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

  locations.forEach((location, index) => {
    const isClosest = index === 0;
    const distance = location.distance?.miles ? `<span class="badge">${location.distance.miles} mi</span>` : '';
    const closestBadge = isClosest ? `<span class="badge closest">Closest</span>` : '';

    html += `
      <li class="location-item">
        <strong>${location.name} ${distance} ${closestBadge}</strong>
        ${location.address ? `<div><img src="../static/assets/address-icon.png" class="icon" alt="Address"> ${location.address}</div>` : ''}
        ${location.phone ? `<div><img src="../static/assets/phone-icon.png" class="icon" alt="Phone"> <a href="tel:${location.phone}">${location.formattedPhone || location.phone}</a></div>` : ''}
        ${location.email ? `<div><img src="../static/assets/email-icon.png" class="icon" alt="Email"> <a href="mailto:${location.email}">${location.email}</a></div>` : ''}
        ${location.website ? `<div><img src="../static/assets/website-icon.png" class="icon" alt="Website"> <a href="${location.website}" target="_blank">View location</a></div>` : ''}
        ${location.hours ? `<div><img src="../static/assets/hours-icon.png" class="icon" alt="Hours"> ${location.hours}</div>` : ''}
        ${location.amenities ? `<div class="location-features"><strong>Features:</strong> ${location.amenities}</div>` : ''}
      </li>`;
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

// ⭐ NUEVA FUNCIÓN para renderizar área específica
function renderAreaLocations(locations, areaName) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p><strong>The Lock Up Self Storage locations in ${areaName}:</strong></p>
      <ul class="locations-list area-locations">`;

  locations.forEach((location, index) => {
    // Indicador especial para el primer resultado si hay múltiples
    const primaryIndicator = locations.length > 1 && index === 0 ? 
      '<span class="primary-badge">Primary Location</span>' : '';

    html += `
      <li class="location-item area-item">
        <div class="location-header">
          <strong>${location.name}</strong>${primaryIndicator}
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">📍 ${location.address}</div>` : ''}
          ${location.formattedPhone ? 
            `<div class="location-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
            </div>` : ''}
          ${location.email ? 
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ? 
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location</a>
            </div>` : ''}
          ${location.hours ? 
            `<div class="location-hours">
              🕒 Hours: ${location.hours}
            </div>` : ''}
          ${location.amenities ? 
            `<div class="location-amenities">
              ✨ Features: ${location.amenities.substring(0, 100)}${location.amenities.length > 100 ? '...' : ''}
            </div>` : ''}
        </div>
      </li>`;
  });

  html += `</ul></div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}

function renderCombinedLocations(locations, userLocation) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p><strong>Nearest locations to ${userLocation}:</strong></p>
      <ul class="locations-list combined-locations">`;

  locations.forEach((location, index) => {
    const positionIndicator = index === 0 ? '<span class="closest-badge">Closest</span>' : '';
    
    html += `
      <li class="location-item combined-item">
        <div class="location-header">
          <strong>${location.name}</strong>
          ${location.distance ? ` <span class="distance-badge">${location.distance.miles} mi</span>` : ''}
          ${positionIndicator}
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">📍 ${location.address}</div>` : ''}
          ${location.formattedPhone ?
            `<div class="location-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
            </div>` : ''}
          ${location.email ?
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ?
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location</a>
            </div>` : ''}
          ${location.hours ?
            `<div class="location-hours">
              🕒 Hours: ${location.hours}
            </div>` : ''}
          ${location.amenities ?
            `<div class="location-amenities">
              ✨ Features: ${location.amenities.substring(0, 80)}${location.amenities.length > 80 ? '...' : ''}
            </div>` : ''}
        </div>
      </li>`;
  });

  html += `</ul></div></div>`;

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

  // 2. Mejorar espaciado - agregar espacio después de puntos
  html = html.replace(/\.(?=[A-Z])/g, '. ');
  
  // 3. Convertir saltos de línea dobles en párrafos
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // 4. Negrita, cursiva, enlaces markdown
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **negrita**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // *cursiva*
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'); // enlaces markdown

  // 5. Emojis para contacto (mejorar visual)
  html = html
    .replace(/📞/g, '<span class="emoji-phone">📞</span>')
    .replace(/📧/g, '<span class="emoji-email">📧</span>')
    .replace(/🌐/g, '<span class="emoji-web">🌐</span>');

  // 6. Citas y separadores
  html = html
    .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>') // > cita
    .replace(/^(-{3,}|\*{3,})$/gm, '<hr>');               // --- o ***

  // 7. Convertir bullets simples en listas
  html = html.replace(/(?:^|\n)((?:•\s.+(?:\n|$))+)/g, (match, listBlock) => {
    const items = listBlock.trim().split('\n').map(line =>
      `<li>${line.replace(/^•\s*/, '').trim()}</li>`
    );
    return '<ul class="formatted-list">' + items.join('') + '</ul>';
  });

  // 8. Convertir los saltos de línea simples en <br> pero no dentro de listas
  html = html.replace(/(?<!<\/li>)\n(?!<li>)/g, '<br>');

  // 9. Agregar clases CSS para mejor estilo
  html = html
    .replace(/<p>/g, '<p class="bot-paragraph">')
    .replace(/<ul>/g, '<ul class="bot-list">')
    .replace(/<blockquote>/g, '<blockquote class="bot-quote">');

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

function renderAreaLocations(locations, areaName) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">
      <p><strong>The Lock Up Self Storage locations in ${areaName}:</strong></p>
      <ul class="locations-list area-locations">`;

  locations.forEach(location => {
    html += `
      <li class="location-item area-item">
        <div class="location-header">
          <strong>${location.name}</strong>
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">📍 ${location.address}</div>` : ''}
          ${location.formattedPhone ?
            `<div class="location-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
            </div>` : ''}
          ${location.email ?
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ?
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location</a>
            </div>` : ''}
          ${location.hours ?
            `<div class="location-hours">
              🕒 Hours: ${location.hours}
            </div>` : ''}
        </div>
      </li>`;
  });

  html += `</ul></div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}


function renderPricingLocationsWithContext(locations, stateName) {
  let html = `<div class="bot-message-content">
    <img src="../static/assets/the-lock-up.svg" class="bot-icon" alt="Bot">
    <div class="bot-formatted-message">`;

  // Contexto específico para ubicaciones de precios
  if (stateName) {
    html += `<p><strong>For specific pricing information in ${stateName}:</strong></p>`;
  } else {
    html += `<p><strong>Contact these locations for current pricing:</strong></p>`;
  }

  html += `<ul class="locations-list pricing-context-locations">`;

  locations.forEach((location, index) => {
    // Indicador especial para el primer resultado
    const primaryIndicator = index === 0 ? '<span class="primary-location">📍 Primary</span>' : '';

    html += `
      <li class="location-item pricing-context-item">
        <div class="location-header">
          <strong>${location.name}</strong>${primaryIndicator}
          ${location.distance ? ` <span class="distance-badge">${location.distance.miles} mi</span>` : ''}
        </div>
        <div class="location-details">
          ${location.address ? `<div class="location-address">📍 ${location.address}</div>` : ''}
          ${location.formattedPhone ?
            `<div class="location-contact pricing-contact">
              📞 <a href="tel:${location.phone}" class="location-phone">${location.formattedPhone}</a>
              <span class="contact-note">Call for current rates</span>
            </div>` : ''}
          ${location.email ?
            `<div class="location-contact">
              📧 <a href="mailto:${location.email}" class="location-email">${location.email}</a>
            </div>` : ''}
          ${location.website ?
            `<div class="location-contact">
              🌐 <a href="${location.website}" target="_blank" class="location-website">Visit Location Page</a>
            </div>` : ''}
          ${location.hours ?
            `<div class="location-hours">
              🕒 <strong>Office Hours:</strong> ${location.hours}
            </div>` : ''}
          ${location.amenities ?
            `<div class="location-features">
              ✨ <strong>Features:</strong> ${location.amenities.substring(0, 80)}${location.amenities.length > 80 ? '...' : ''}
            </div>` : ''}
        </div>
      </li>`;
  });

  html += `</ul>`;

  // Nota adicional sobre factores de precio
  html += `
    <div class="pricing-note">
      <p><em>💡 Pricing varies by unit size, features, and current promotions. Contact the location directly for accurate quotes.</em></p>
    </div>
  `;

  html += `</div></div>`;

  addMessage(html, 'bot');
  saveToHistory(html, 'bot');
}
