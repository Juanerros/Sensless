document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const termsAccepted = document.getElementById("accept-terms").checked;

      // Aquí podrías agregar la lógica para enviar los datos a un servidor.
      console.log("Username:", username);
      console.log("Password:", password);
      console.log("Terms accepted:", termsAccepted);

      // Ejemplo de alerta, en un caso real usarías fetch() para una API.
      if (termsAccepted) {
        alert(`Registrando al usuario: ${username}`);
      } else {
        alert("Por favor, acepta los términos y condiciones.");
      }
    });
  }
});