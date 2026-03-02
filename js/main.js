/* ========================================
   STL Services - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initDropdowns();
  initScrollAnimations();
});

/* ---- Navbar Scroll Effect ---- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ---- Mobile Menu ---- */
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a:not(.nav-dropdown-toggle)').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ---- Dropdown Menus ---- */
function initDropdowns() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(dropdown => {
    const toggleEl = dropdown.querySelector('.nav-dropdown-toggle');

    toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Close other dropdowns
      dropdowns.forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });

      dropdown.classList.toggle('open');
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      dropdowns.forEach(d => d.classList.remove('open'));
    }
  });
}

/* ---- Scroll Animations ---- */
function initScrollAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');
  if (fadeElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  fadeElements.forEach(el => observer.observe(el));
}
