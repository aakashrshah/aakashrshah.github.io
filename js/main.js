/* ============================================
   AAKASH SHAH - MODERN PORTFOLIO JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- Navbar scroll behavior ---
  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Mobile nav toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Parallax effect on hero circles ---
  const heroSection = document.querySelector('.hero');
  const circles = document.querySelectorAll('.intersection-circle');

  if (heroSection && circles.length) {
    const speeds = [0.03, 0.02, 0.04, 0.025];
    const baseTransforms = [
      { x: -120, y: -100 },
      { x: 120, y: -100 },
      { x: -120, y: 100 },
      { x: 120, y: 100 }
    ];

    // Responsive base transforms
    function getBaseTransforms() {
      const w = window.innerWidth;
      if (w <= 480) {
        return [
          { x: -50, y: -50 },
          { x: 50, y: -50 },
          { x: -50, y: 50 },
          { x: 50, y: 50 }
        ];
      } else if (w <= 768) {
        return [
          { x: -70, y: -65 },
          { x: 70, y: -65 },
          { x: -70, y: 65 },
          { x: 70, y: 65 }
        ];
      }
      return baseTransforms;
    }

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const bases = getBaseTransforms();
      circles.forEach((circle, i) => {
        const offsetY = scrollY * speeds[i];
        circle.style.transform = `translate(${bases[i].x}px, ${bases[i].y - offsetY}px)`;
      });
    }, { passive: true });
  }

  // --- Scroll reveal animations ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- Timeline expand/collapse ---
  document.querySelectorAll('.timeline-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const details = toggle.previousElementSibling;
      if (!details) return;
      const isOpen = details.classList.contains('open');
      details.classList.toggle('open');
      toggle.classList.toggle('expanded');
      toggle.querySelector('.toggle-text').textContent = isOpen ? 'Show details' : 'Hide details';
    });
  });

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id]');

  function updateActiveNav() {
    const scrollPos = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (link) {
        if (scrollPos >= top && scrollPos < top + height) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
});
