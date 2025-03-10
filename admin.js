document.getElementById("qa-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const file = document.getElementById("qa-file").files[0];
    if (file) {
      alert(`Q&A file "${file.name}" uploaded.`);
      // Aquí iría la lógica para enviar el archivo al servidor.
    }
  });
  
  document.getElementById("locations-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const file = document.getElementById("locations-file").files[0];
    if (file) {
      alert(`Location file "${file.name}" uploaded.`);
      // Aquí también puedes subir al servidor.
    }
  });
  
  document.getElementById("prompt-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("prompt-name").value;
    const content = document.getElementById("prompt-content").value;
  
    alert(`Prompt "${name}" saved.`);
    // Aquí agregarías lógica para guardar el prompt.
  });
  
  document.getElementById("create-new-prompt").addEventListener("click", function () {
    document.getElementById("prompt-name").value = "";
    document.getElementById("prompt-content").value = "";
    document.getElementById("prompt-select").value = "";
  });
  