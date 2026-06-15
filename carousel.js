document.addEventListener("DOMContentLoaded", () => {


  const IMG_FOLDER = "img/";
  const IMG_EXT    = ".jpg";
  const MAX_IMAGES = 25;

  let slides  = [];
  let current = 0;

  const carouselWindow = document.getElementById("carouselWindow");
  const dotsWrap       = document.getElementById("dotsWrap");
  const counter        = document.getElementById("counter");
  const slideLabel     = document.getElementById("slideLabel");
  const btnPrev        = document.getElementById("btnPrev");
  const btnNext        = document.getElementById("btnNext");

  async function detectImages() {
    const found = [];
    for (let i = 1; i <= MAX_IMAGES; i++) {
      const src = IMG_FOLDER + "img_" + i + IMG_EXT;
      const ok  = await imageExists(src);
      if (!ok) break;
      found.push({ label: "img_" + i + IMG_EXT, src });
    }
    return found;
  }

  function imageExists(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  function buildSlides() {
    carouselWindow.innerHTML = "";

    if (slides.length === 0) {
      carouselWindow.innerHTML = `
        <div class="carousel-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Aucune image trouvée dans <code>${IMG_FOLDER}</code></span>
          <small>Dépose tes fichiers au format <code>img_1.jpg</code>, <code>img_2.jpg</code>…</small>
        </div>`;
      counter.textContent   = "0 / 0";
      slideLabel.textContent = "";
      dotsWrap.innerHTML     = "";
      btnPrev.style.display  = "none";
      btnNext.style.display  = "none";
      return;
    }

    btnPrev.style.display = "";
    btnNext.style.display = "";

    slides.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "carousel-slide" + (i === current ? " active" : "");
      div.id = "slide-" + i;

      const img = document.createElement("img");
      img.src   = s.src;
      img.alt   = s.label;
      div.appendChild(img);

      carouselWindow.appendChild(div);
    });

    buildDots();
    updateUI();
  }

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

  function updateUI() {
    document.querySelectorAll(".carousel-slide").forEach((el, i) => {
      el.classList.toggle("active", i === current);
    });
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
    });
    counter.textContent    = (current + 1) + " / " + slides.length;
    slideLabel.textContent = slides[current].label;
  }

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

  detectImages().then((found) => {
    slides = found;
    buildSlides();
  });

});