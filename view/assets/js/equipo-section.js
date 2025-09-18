document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("equipo");
  const animatedElements = document.querySelectorAll(
    ".equipo-title-animate, .equipo-avatar-animate, .equipo-nombre-animate, .equipo-rol-animate"
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animatedElements.forEach((el) => {
            el.classList.add("animate");
          });
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