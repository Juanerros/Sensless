document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("juego");
  const title = document.querySelector(".juego-title-animate");
  const description = document.querySelector(".juego-description-animate");
  const btn = document.querySelector(".juego-btn-animate");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          title.classList.add("animate");
          description.classList.add("animate");
          btn.classList.add("animate");
          observer.disconnect();
        }
      });
    },
    { threshold: 0.5 }
  );

  if (section) {
    observer.observe(section);
  }
});