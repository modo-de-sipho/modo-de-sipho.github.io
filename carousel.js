document.addEventListener("DOMContentLoaded", () => {

  // ── Données initiales (placeholders) ───────────────────────────────
  const slides = [
    { label: "img_1.jpg", src: null },
    { label: "img_2.jpg", src: null },
    { label: "img_3.jpg", src: null },
  ];

  let current = 0;

  const carouselWindow = document.getElementById("carouselWindow");
  const dotsWrap       = document.getElementById("dotsWrap");
  const counter        = document.getElementById("counter");
  const slideLabel     = document.getElementById("slideLabel");
  const btnPrev        = document.getElementById("btnPrev");
  const btnNext        = document.getElementById("btnNext");
  const fileInput      = document.getElementById("fileInput");

  // ── Construction des slides ─────────────────────────────────────────
  function buildSlides() {
    carouselWindow.innerHTML = "";
    slides.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "carousel-slide" + (i === current ? " active" : "");
      div.id = "slide-" + i;

      if (s.src) {
        const img = document.createElement("img");
        img.src = s.src;
        img.alt = s.label;
        div.appendChild(img);
      } else {
        div.innerHTML = `
          <div class="carousel-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>${s.label}</span>
          </div>`;
      }
      carouselWindow.appendChild(div);
    });

    buildDots();
    updateUI();
  }

  // ── Points de navigation ────────────────────────────────────────────
  function buildDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot" + (i === current ? " active" : "");
      dot.setAttribute("aria-label", "Aller à l'image " + (i + 1));
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  // ── Mise à jour de l'affichage ──────────────────────────────────────
  function updateUI() {
    document.querySelectorAll(".carousel-slide").forEach((el, i) => {
      el.classList.toggle("active", i === current);
    });
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
    });
    counter.textContent   = (current + 1) + " / " + slides.length;
    slideLabel.textContent = slides[current].label;
  }

  // ── Navigation ──────────────────────────────────────────────────────
  function goTo(index) {
    current = (index + slides.length) % slides.length;
    updateUI();
  }

  btnPrev.addEventListener("click", () => goTo(current - 1));
  btnNext.addEventListener("click", () => goTo(current + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  // ── Ajout d'images via input file ──────────────────────────────────
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Libère les anciennes URLs blob
    slides.forEach(s => { if (s.src) URL.revokeObjectURL(s.src); });
    slides.length = 0;

    files.forEach(f => {
      slides.push({ label: f.name, src: URL.createObjectURL(f) });
    });

    current = 0;
    buildSlides();
    fileInput.value = "";
  });

  // ── Init ────────────────────────────────────────────────────────────
  buildSlides();

});