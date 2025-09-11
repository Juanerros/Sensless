document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("mecanicas");
  const title = document.querySelector(".mecanicas-title-animate");
  const background = document.querySelector(".mecanicas-bg");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          title.classList.add("animate");
          background.classList.add("animate");

          const cards = entry.target.querySelectorAll(".mecanica-card-animate");
          cards.forEach((card, idx) => {
            card.classList.add("animate");
            card.style.animationDelay = `${0.2 + idx * 0.2}s`;

            const cardTitle = card.querySelector(
              ".mecanica-card-title-animate"
            );
            const cardDesc = card.querySelector(".mecanica-card-desc-animate");
            if (cardTitle) {
              cardTitle.classList.add("animate");
            }
            if (cardDesc) {
              cardDesc.classList.add("animate");
            }
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
