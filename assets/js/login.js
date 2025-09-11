document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const remember = document.getElementById("remember-me").checked;

      // Aquí podrías agregar la lógica para enviar los datos a un servidor.
      console.log("Username:", username);
      console.log("Password:", password);
      console.log("Remember me:", remember);

      // Ejemplo de alerta, en un caso real usarías fetch() para una API.
      alert(`Iniciando sesión con el usuario: ${username}`);
    });
  }
});