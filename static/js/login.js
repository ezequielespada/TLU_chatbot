// login.js - Versión corregida
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorDiv = document.getElementById("login-error");

  // Crear un FormData para enviar como formulario
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  // Realizar la solicitud al backend Flask
  fetch("/login", {
    method: "POST",
    body: formData
  })
  .then(response => {
    // Si la respuesta es una redirección (código 302), seguirla
    if (response.redirected) {
      window.location.href = response.url;
      return null;
    }
    // Si no, intentar leer la respuesta como JSON
    return response.json();
  })
  .then(data => {
    if (data === null) {
      // Ya se manejó la redirección
      return;
    }
    
    if (data.success) {
      // Redirigir a la página de administración
      window.location.href = "/admin";
    } else {
      errorDiv.textContent = data.message || "Error de inicio de sesión";
      errorDiv.style.display = "block";
    }
  })
  .catch(err => {
    console.error("Error al iniciar sesión:", err);
    errorDiv.textContent = "Error de servidor";
    errorDiv.style.display = "block";
  });
});