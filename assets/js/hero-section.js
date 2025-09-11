document.addEventListener("DOMContentLoaded", () => {
  const btnPlay = document.querySelector(".btn-play");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          btnPlay.classList.add("animate");
          observer.disconnect();
        }
      });
    },
    { threshold: 0.6 }
  );

  if (btnPlay) {
    observer.observe(btnPlay);
  }

  // Para animar la sección principal cuando es visible
  const heroSection = document.querySelector(".hero-section");

  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Agrega la clase 'animate' a la sección principal
          entry.target.classList.add("animate");
          // Deja de observar una vez que se activa
          heroObserver.disconnect();
        }
      });
    },
    { threshold: 0.1 } // El 10% de la sección debe estar visible para activarse
  );

  if (heroSection) {
    heroObserver.observe(heroSection);
  }
});
