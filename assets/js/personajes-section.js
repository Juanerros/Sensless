document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".personaje-fade-section");
  const options = {
    threshold: [0.3, 0.5, 0.7, 0.9, 1.0],
  };

  const observer = new IntersectionObserver((entries) => {
    let activeSection = null;
    let maxRatio = 0;

    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio;
        activeSection = entry.target;
      }
    });

    sections.forEach((section) => {
      section.classList.remove("visible");
    });

    if (activeSection) {
      activeSection.classList.add("visible");
    }
  }, options);

  sections.forEach((section) => {
    observer.observe(section);
  });
});