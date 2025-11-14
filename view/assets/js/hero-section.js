document.addEventListener("DOMContentLoaded", () => {
  const btnPlay = document.getElementById("btnPlay");
  const heroSection = document.querySelector(".hero-section");

  // Animación del botón
  if (btnPlay) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            btnPlay.classList.add("animate");
            obs.disconnect();
          }
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(btnPlay);

    // Redirección al hacer click
    btnPlay.addEventListener("click", () => {
      console.log("Botón clickeado"); // Para testear
      window.location.href = "./view/pages/Menu.php";
    });
  }

  // Animación de la sección principal
  if (heroSection) {
    const heroObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            obs.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    heroObserver.observe(heroSection);
  }
});