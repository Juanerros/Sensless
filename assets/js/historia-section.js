document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("historia");

  const animatedElements = document.querySelectorAll(
    ".historia-card-animate, .historia-title-animate, .historia-item-title-animate, .historia-item-desc-animate, .lampara-animate"
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