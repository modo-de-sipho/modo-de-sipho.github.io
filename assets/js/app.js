/**
 * Portfolio Main Application
 * Handles navigation, forms, scroll reveal, and CursorSwarm integration
 */

// ============================================================================
// GLOBAL STATE & CONFIG
// ============================================================================

const AppState = {
  swarm: null,
  swarmCompleted: false,
  isSPA: false, // Set to true if using SPA navigation
};

const AppConfig = {
  swarmSelector: '[data-swarm-target]',
  formEndpoint: null, // Will be set from data attribute
  formCooldown: 8464, // ms
};

// ============================================================================
// UTILITIES
// ============================================================================

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ============================================================================
// CURSOR SWARM INTEGRATION
// ============================================================================

async function initCursorSwarm() {
  // Check if already completed in this session (page load cycle)
  if (AppState.swarmCompleted) {
    revealAllImmediately();
    return;
  }

  // Check for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealAllImmediately();
    return;
  }

  // Hide content immediately to prevent flash
  document.body.classList.add('swarm-active');

  try {
    // Dynamic import for code splitting
    const { CursorSwarm } = await import('./cursor-swarm.js?v=4');

    AppState.swarm = new CursorSwarm({
      selector: AppConfig.swarmSelector,
      maxAgents: 20,
      minAgents: 5,
      onComplete: () => {
        AppState.swarmCompleted = true;
        document.body.classList.remove('swarm-active');
        document.body.classList.add('swarm-complete');
        initScrollReveal(); // Initialize scroll reveal for any elements not covered by swarm
        initPostSwarmFeatures();
      },
    });

    AppState.swarm.init();
    AppState.swarm.start();
  } catch (error) {
    console.warn('CursorSwarm failed to load, falling back to immediate reveal:', error);
    revealAllImmediately();
  }
}

function revealAllImmediately() {
  const targets = $$(AppConfig.swarmSelector);
  targets.forEach(el => {
    el.style.visibility = 'visible';
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.classList.add('swarm-built');
  });
  document.body.classList.remove('swarm-active');
  document.body.classList.add('swarm-complete');
  AppState.swarmCompleted = true;
  initScrollReveal();
  initPostSwarmFeatures();
}

// ============================================================================
// SCROLL REVEAL (for non-swarm elements / after swarm)
// ============================================================================

function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

// ============================================================================
// NAVIGATION
// ============================================================================

function initNavigation() {
  const header = $('.site-header');
  const mobileBtn = $('.mobile-menu-btn');
  const nav = $('.nav');
  const navLinks = $$('.nav-link');

  // Scroll effect on header
  const handleScroll = throttle(() => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, 16);
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Mobile menu toggle
  mobileBtn?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', isOpen);
    mobileBtn.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        nav.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });

  // Smooth scroll for anchor links (non-SPA)
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = $(targetId);
      if (target) {
        e.preventDefault();
        const headerHeight = header?.offsetHeight || 0;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });
}

// ============================================================================
// SKILLS ANIMATION
// ============================================================================

function initSkillsAnimation() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.skill-fill').forEach(fill => {
      fill.style.width = fill.dataset.width || '0%';
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.skill-fill');
        if (fill) {
          const width = fill.dataset.width || '0%';
          setTimeout(() => { fill.style.width = width; }, 200);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  $$('.skill-item').forEach(item => observer.observe(item));
}

// ============================================================================
// FORM HANDLING (Command form)
// ============================================================================

function initCommandForm() {
  const form = $('#commandeForm');
  if (!form) return;

  const typeProjetSelect = form.querySelector('#type_projet');
  const descriptionField = form.querySelector('#description-field');
  const descriptionInput = form.querySelector('#description');
  const contactMethodSelect = form.querySelector('#contact_method');

  const contactFields = {
    telephone: form.querySelector('.contact-telephone'),
    email: form.querySelector('.contact-email'),
    discord: form.querySelector('.contact-discord'),
  };

  const contactInputs = {
    telephone: form.querySelector('#telephone'),
    email: form.querySelector('#email'),
    discord: form.querySelector('#discord'),
  };

  const contactMethodLabels = {
    telephone: 'Téléphone',
    email: 'Email',
    discord: 'Discord',
  };

  const successMsg = form.querySelector('.form-success');
  const errorMsg = form.querySelector('.form-error');

  const updateContactFields = () => {
    const selected = contactMethodSelect?.value;
    Object.keys(contactFields).forEach(key => {
      const field = contactFields[key];
      const input = contactInputs[key];
      if (!field || !input) return;
      if (selected === key) {
        field.classList.remove('hidden');
        input.required = true;
      } else {
        field.classList.add('hidden');
        input.required = false;
      }
    });
  };

  typeProjetSelect?.addEventListener('change', () => {
    if (typeProjetSelect.value) {
      descriptionField.classList.remove('hidden');
      descriptionInput.required = true;
    } else {
      descriptionField.classList.add('hidden');
      descriptionInput.required = false;
    }
  });

  contactMethodSelect?.addEventListener('change', updateContactFields);
  updateContactFields();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Cooldown check
    const lastSubmit = localStorage.getItem('lastSubmit');
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < AppConfig.formCooldown) {
      const secondsLeft = Math.ceil((AppConfig.formCooldown - (Date.now() - parseInt(lastSubmit))) / 1000);
      showFormMessage(errorMsg, `Veuillez attendre ${secondsLeft} secondes avant de renvoyer.`);
      return;
    }

    const contactMethod = contactMethodSelect?.value;
    if (!contactMethod) {
      showFormMessage(errorMsg, 'Veuillez sélectionner un moyen de contact.');
      return;
    }

    const typeProjet = form.querySelector('#type_projet')?.value;
    const description = form.querySelector('#description')?.value;
    const budget = form.querySelector('#budget')?.value;
    const contactLabel = contactMethodLabels[contactMethod];
    const contactValue = form.querySelector(`#${contactMethod}`)?.value;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi...';

    try {
      // Get webhook URL from data attribute or config
      const webhookUrl = form.dataset.webhook || AppConfig.formEndpoint;
      if (!webhookUrl) throw new Error('Webhook URL not configured');

      const embed = {
        title: '📋 Nouvelle commande',
        color: 0x06b6d4,
        fields: [
          { name: 'Type de projet', value: typeProjet || '—', inline: true },
          { name: 'Budget', value: budget || '—', inline: true },
          { name: 'Contact', value: `${contactLabel} : ${contactValue}`, inline: false },
          { name: 'Description', value: description || '—', inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Portfolio Sipho' },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (!response.ok) throw new Error(`Erreur webhook : ${response.status}`);

      localStorage.setItem('lastSubmit', Date.now().toString());
      showFormMessage(successMsg, 'Demande envoyée avec succès !');
      form.reset();
      descriptionField.classList.add('hidden');
      descriptionInput.required = false;
      updateContactFields();
    } catch (error) {
      console.error('Form error:', error);
      showFormMessage(errorMsg, 'Impossible d\'envoyer la demande. Veuillez réessayer ou me contacter directement sur Discord.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  function showFormMessage(element, message) {
    element.textContent = message;
    element.classList.add('show');
    // Hide the other message
    if (element === successMsg) errorMsg.classList.remove('show');
    else successMsg.classList.remove('show');
    setTimeout(() => element.classList.remove('show'), 8000);
  }
}

// ============================================================================
// CAROUSEL (theme.html gallery)
// ============================================================================

function initCarousel() {
  const carouselWindow = $('#carouselWindow');
  if (!carouselWindow) return;

  const IMG_FOLDER = 'img/';
  const IMG_EXT = '.jpg';
  const MAX_IMAGES = 25;

  let slides = [];
  let current = 0;

  const dotsWrap = $('#dotsWrap');
  const counter = $('#counter');
  const slideLabel = $('#slideLabel');
  const btnPrev = $('#btnPrev');
  const btnNext = $('#btnNext');

  async function detectImages() {
    const found = [];
    for (let i = 1; i <= MAX_IMAGES; i++) {
      const src = IMG_FOLDER + 'img_' + i + IMG_EXT;
      const ok = await imageExists(src);
      if (!ok) break;
      found.push({ label: 'img_' + i + IMG_EXT, src });
    }
    return found;
  }

  function imageExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  function buildSlides() {
    carouselWindow.innerHTML = '';

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
      counter.textContent = '0 / 0';
      slideLabel.textContent = '';
      dotsWrap.innerHTML = '';
      btnPrev.style.display = 'none';
      btnNext.style.display = 'none';
      return;
    }

    btnPrev.style.display = '';
    btnNext.style.display = '';

    slides.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'carousel-slide' + (i === current ? ' active' : '');
      div.id = 'slide-' + i;

      const img = document.createElement('img');
      img.src = s.src;
      img.alt = s.label;
      img.loading = i === 0 ? 'eager' : 'lazy';
      div.appendChild(img);

      carouselWindow.appendChild(div);
    });

    buildDots();
    updateUI();
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Aller à l\'image ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function updateUI() {
    document.querySelectorAll('.carousel-slide').forEach((el, i) => {
      el.classList.toggle('active', i === current);
    });
    document.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
    counter.textContent = (current + 1) + ' / ' + slides.length;
    slideLabel.textContent = slides[current].label;
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    updateUI();
  }

  btnPrev.addEventListener('click', () => goTo(current - 1));
  btnNext.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  // Touch/swipe support
  let touchStartX = 0;
  carouselWindow.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carouselWindow.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx > 0 ? goTo(current - 1) : goTo(current + 1);
  }, { passive: true });

  detectImages().then(found => {
    slides = found;
    buildSlides();
  });
}

// ============================================================================
// POST-SWARM FEATURES
// ============================================================================

function initPostSwarmFeatures() {
  initNavigation();
  initSkillsAnimation();
  initCommandForm();
  initCarousel();

  // Add reveal classes to sections for scroll reveal
  $$('section').forEach((section, i) => {
    if (!section.classList.contains('swarm-reveal')) {
      section.classList.add('reveal');
      section.style.transitionDelay = `${i * 100}ms`;
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
  // Always start at the very top of the page (disable browser scroll restoration)
  try { history.scrollRestoration = 'manual'; } catch (_) {}
  try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
  window.scrollTo(0, 0);
  // Mark page as loaded for SPA detection
  document.body.dataset.pageLoad = Date.now();

  // Swarm is handled by the reference implementation (swarm-cursors-ref.js).
  // Keep content visible so it can be snapshotted, then rebuilt by the swarm.
  AppState.swarmCompleted = true;
  revealAllImmediately();
}

// Handle SPA navigation if needed
function handleSPANavigation() {
  // For future SPA implementation
  // Would re-run initCursorSwarm() only on external navigation
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for potential SPA usage
window.PortfolioApp = {
  init,
  initCursorSwarm,
  revealAllImmediately,
};