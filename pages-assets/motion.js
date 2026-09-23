/* Native Web Animations: no CDN, framework runtime or network requests. */
(() => {
  "use strict";
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = document.querySelector("#motion-toggle");
  const replay = document.querySelector("#replay-print");
  const stage = document.querySelector(".print-stage");
  const running = new Set();
  let paused = false;
  try {
    paused = localStorage.getItem("printflow-motion-paused") === "true";
  } catch {
    /* Optional preference. */
  }
  const enabled = () => !paused && !preference.matches;
  function animate(element, frames, options = {}) {
    if (!enabled() || !element?.animate) return;
    const animation = element.animate(frames, {
      duration: 650,
      easing: "cubic-bezier(.2,.75,.25,1)",
      ...options,
    });
    running.add(animation);
    animation.finished.then(
      () => running.delete(animation),
      () => running.delete(animation),
    );
    return animation;
  }
  function sync() {
    document.documentElement.classList.toggle("motion-paused", !enabled());
    toggle.hidden = false;
    toggle.disabled = preference.matches;
    toggle.textContent = preference.matches
      ? "Reduced motion"
      : paused
        ? "Enable motion"
        : "Pause motion";
    toggle.setAttribute("aria-pressed", String(paused || preference.matches));
    replay.hidden = !enabled();
    if (!enabled()) {
      running.forEach((animation) => animation.cancel());
      stage.classList.remove("is-printing");
    }
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    try {
      localStorage.setItem("printflow-motion-paused", String(paused));
    } catch {
      /* Optional preference. */
    }
    sync();
  });
  preference.addEventListener("change", sync);
  sync();
  function print() {
    if (!enabled()) return;
    stage.classList.remove("is-printing");
    void stage.offsetWidth;
    stage.classList.add("is-printing");
  }
  replay.addEventListener("click", print);
  const targets = document.querySelectorAll(
    ".hero-copy > *, .hero-collage, .product-tile, .section-top, .process-grid article, .workspace-art, .faq-section details, .contact-finale, .hero > div:first-child > *, .hero .paper-stack, .service-card, .print-story-copy, .print-stage, .welcome-banner, .summary-grid > *, #settings, #team",
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (entry.target === stage) print();
          else if (entry.target.matches(".paper-stack")) {
            animate(
              entry.target,
              [
                { opacity: 0, transform: "translateY(32px) rotate(-12deg)" },
                { opacity: 1, transform: "translateY(0) rotate(-7deg)" },
              ],
              { duration: 1000 },
            );
          } else {
            animate(
              entry.target,
              [
                { opacity: 0, transform: "translateY(22px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { delay: Math.min(index * 65, 260), fill: "backwards" },
            );
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((target) => observer.observe(target));
  }
  let pageAnimation;
  window.PrintFlowMotion = {
    enter(element) {
      pageAnimation?.cancel();
      pageAnimation = animate(
        element,
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 400 },
      );
    },
    feedback(element) {
      animate(
        element.querySelector('button[type="submit"]'),
        [
          { transform: "scale(1)" },
          { transform: "scale(.95)", offset: 0.35 },
          { transform: "scale(1)" },
        ],
        { duration: 350 },
      );
      animate(document.querySelector("#save-status"), [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ]);
    },
  };
})();
