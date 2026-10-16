/* ═══════════════════════════════════════════════════════════
   PORTFOLIO JAVASCRIPT — Mohamed Yuhan
   Particle canvas, cursor, scroll animations, nav, form
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────
     0. THEME TOGGLE (Dark ↔ Light)
  ─────────────────────────────────────── */
  const themeToggle = document.getElementById('themeToggle');

  // Load saved theme preference
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      'aria-label',
      document.body.classList.contains('light') ? 'Switch to dark theme' : 'Switch to light theme'
    );
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const isLight = document.body.classList.contains('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  /* ──────────────────────────────────────
     1. PARTICLE / WAVE CANVAS BACKGROUND
  ─────────────────────────────────────── */
  const canvas  = document.getElementById('bgCanvas');
  const ctx     = canvas.getContext('2d');
  let   W, H, particles = [], mouseX = -9999, mouseY = -9999;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 20;
      this.r  = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.4 + 0.1);
      this.alpha = Math.random() * 0.6 + 0.1;
      this.hue = Math.random() < 0.5
        ? `${Math.round(170 + Math.random() * 20)}`   // cyan-teal
        : `${Math.round(200 + Math.random() * 20)}`;  // sky-blue
    }

    update() {
      // Drift toward / away from mouse
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        this.vx += dx / dist * 0.015;
        this.vy += dy / dist * 0.015;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Clamp velocity
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (spd > 0.8) { this.vx *= 0.96; this.vy *= 0.96; }

      if (this.y < -10 || this.x < -20 || this.x > W + 20) this.reset();
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    const count = Math.min(Math.floor(W * H / 8000), 140);
    particles = Array.from({ length: count }, () => new Particle());
  }

  // Scroll-driven wave
  let scrollY = 0;
  let animId;

  function drawWave(time, yOffset) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const t = (x / W) * Math.PI * 4;
      const wave = Math.sin(t + time / 1200) * 18
                 + Math.sin(t * 2 + time / 800) * 10
                 + Math.sin(t * 0.5 + time / 2000) * 25;
      ctx.lineTo(x, H * 0.78 + wave + yOffset * 0.08);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,212,170,0.025)';
    ctx.fill();
  }

  function loop(time) {
    scrollY = window.scrollY || 0;
    ctx.clearRect(0, 0, W, H);

    // Gradient vignette
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, 'rgba(0,212,170,0.04)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawWave(time, scrollY);

    particles.forEach(p => { p.update(); p.draw(); });

    // Draw connecting lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,212,170,${0.08 * (1 - d/90)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(loop);
  }

  function startCanvas() {
    resize();
    initParticles();
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('touchmove', e => {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
  }, { passive: true });

  startCanvas();


  /* ──────────────────────────────────────
     2. CUSTOM CURSOR
  ─────────────────────────────────────── */
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let cx = 0, cy = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
  });

  (function followLoop() {
    fx += (cx - fx) * 0.1;
    fy += (cy - fy) * 0.1;
    follower.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`;
    requestAnimationFrame(followLoop);
  })();

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    follower.style.opacity = '1';
  });


  /* ──────────────────────────────────────
     3. NAVBAR SCROLL
  ─────────────────────────────────────── */
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });


  /* ──────────────────────────────────────
     4. MOBILE MENU
  ─────────────────────────────────────── */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });


  /* ──────────────────────────────────────
     5. SCROLL-DRIVEN REVEAL ANIMATIONS
     (Native CSS scroll-driven + Intersection Observer fallback)
  ─────────────────────────────────────── */
  const revealSupported =
    CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  const revealEls = document.querySelectorAll('.reveal');

  if (!revealSupported) {
    // Fallback: IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stagger siblings
            const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')]
              .filter(el => el !== entry.target);
            siblings.forEach((sib, i) => {
              setTimeout(() => sib.classList.add('visible'), i * 80);
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(el => observer.observe(el));
  } else {
    // Native scroll-driven: add visible immediately but stagger with delay
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const group = [...entry.target.querySelectorAll('.reveal')];
            group.forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 80);
            });
          }
        });
      },
      { threshold: 0.05 }
    );
    document.querySelectorAll('.section').forEach(s => sectionObserver.observe(s));
  }


  /* ──────────────────────────────────────
     6. COUNTER ANIMATION
  ─────────────────────────────────────── */
  function animateCounter(el) {
    const target  = +el.dataset.target;
    const suffix  = el.dataset.target.includes('%') ? '%' : '';
    const dur     = 1800;
    const start   = performance.now();

    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));


  /* ──────────────────────────────────────
     7. ACTIVE NAV LINK HIGHLIGHT
  ─────────────────────────────────────── */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const sectionObserver2 = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    },
    { threshold: 0.4 }
  );
  sections.forEach(s => sectionObserver2.observe(s));

  // Active nav style
  const style = document.createElement('style');
  style.textContent = `.nav-link.active { color: var(--text) !important; } .nav-link.active::after { width: 100% !important; }`;
  document.head.appendChild(style);


  /* ──────────────────────────────────────
     8. CONTACT FORM & SMART EMAIL HANDLER
  ─────────────────────────────────────── */
  const TARGET_EMAIL = 'yuhanty44@gmail.com';

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
  };

  const form = document.getElementById('contactForm');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name    = document.getElementById('name').value.trim();
      const email   = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name || !email || !subject || !message) return;

      const body = `Hi Mohamed,\n\nMy name is ${name}.\nMy email: ${email}\n\n${message}`;

      const encodedSubject = encodeURIComponent(subject);
      const encodedBody    = encodeURIComponent(body);
      const isMobile       = isMobileDevice();

      if (isMobile) {
        // Direct mobile redirect to the native Gmail / default mail app via mailto:
        // Avoids opening legacy mobile web interface ("old Gmail" error on mobile browsers)
        const mailtoURL = `mailto:${TARGET_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
        window.location.href = mailtoURL;
      } else {
        // Desktop browser: open Gmail web compose in a clean new tab
        const gmailURL =
          `https://mail.google.com/mail/?view=cm` +
          `&to=${encodeURIComponent(TARGET_EMAIL)}` +
          `&su=${encodedSubject}` +
          `&body=${encodedBody}`;
        window.open(gmailURL, '_blank', 'noopener,noreferrer');
      }

      // Update button UI + reset form
      const btnText    = form.querySelector('.btn-text');
      const btnLoading = form.querySelector('.btn-loading');
      if (btnText && btnLoading) {
        btnText.hidden    = true;
        btnLoading.hidden = false;
      }

      setTimeout(() => {
        if (btnText && btnLoading) {
          btnText.hidden    = false;
          btnLoading.hidden = true;
        }
        form.reset();
        showToast(isMobile ? 'Opening your mail app... ✉️' : 'Gmail compose opened! ✉️');
      }, 600);
    });
  }

  // Smart mailto handler for all mailto: links across the portfolio
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', function(e) {
      if (!isMobileDevice()) {
        // On desktop, redirect to Gmail web composer in a new tab for frictionless desktop experience
        e.preventDefault();
        const rawHref = this.getAttribute('href');
        const mailtoParts = rawHref.replace(/^mailto:/i, '').split('?');
        const to = mailtoParts[0] || TARGET_EMAIL;
        const params = new URLSearchParams(mailtoParts[1] || '');
        const subject = params.get('subject') || '';
        const body = params.get('body') || '';

        const gmailUrl =
          `https://mail.google.com/mail/?view=cm` +
          `&to=${encodeURIComponent(to)}` +
          (subject ? `&su=${encodeURIComponent(subject)}` : '') +
          (body ? `&body=${encodeURIComponent(body)}` : '');

        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      }
      // On mobile devices, native mailto is permitted, launching the phone's Gmail / default mail app
    });
  });

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)',
      color: '#fff',
      padding: '0.85rem 1.8rem',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '0.9rem',
      zIndex: '99999',
      opacity: '0',
      transition: 'opacity 0.4s, transform 0.4s',
      pointerEvents: 'none',
      boxShadow: '0 8px 32px rgba(0,212,170,0.35)',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }


  /* ──────────────────────────────────────
     9. SMOOTH SCROLL FOR ALL ANCHOR LINKS
  ─────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* Resume modal */
  const resumeBtn = document.getElementById('resumeViewBtn');
  const resumeModal = document.getElementById('resumeModal');

  if (resumeBtn && resumeModal) {
    resumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resumeModal.classList.add('open');
      resumeModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });

    function closeResumeModal() {
      resumeModal.classList.remove('open');
      resumeModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-resume-close]').forEach(btn => {
      btn.addEventListener('click', closeResumeModal);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resumeModal.classList.contains('open')) {
        closeResumeModal();
      }
    });
  }

  /* Certificate image preview */
  const certificateModal = document.getElementById('certificateModal');
  const certificateModalImage = document.getElementById('certificateModalImage');
  const certificateModalTitle = document.getElementById('certificateModalTitle');

  function closeCertificateModal() {
    certificateModal.classList.remove('open');
    certificateModal.setAttribute('aria-hidden', 'true');
    certificateModalImage.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-certificate]').forEach(preview => {
    preview.addEventListener('click', () => {
      certificateModalImage.src = preview.dataset.certificate;
      certificateModalImage.alt = preview.dataset.title;
      certificateModalTitle.textContent = preview.dataset.title;
      certificateModal.classList.add('open');
      certificateModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  document.querySelectorAll('[data-certificate-close]').forEach(control => {
    control.addEventListener('click', closeCertificateModal);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && certificateModal.classList.contains('open')) closeCertificateModal();
  });


  /* ──────────────────────────────────────
     10. PARALLAX TILT ON HERO IMAGE
  ─────────────────────────────────────── */
  const heroImgWrap = document.querySelector('.hero-img-wrap');
  if (heroImgWrap) {
    document.addEventListener('mousemove', e => {
      const xRel = (e.clientX / window.innerWidth  - 0.5) * 12;
      const yRel = (e.clientY / window.innerHeight - 0.5) * 8;
      heroImgWrap.style.transform = `perspective(600px) rotateY(${xRel}deg) rotateX(${-yRel}deg)`;
    });
  }


  /* ──────────────────────────────────────
     11. SCROLL PROGRESS BAR
  ─────────────────────────────────────── */
  const progressBar = document.createElement('div');
  Object.assign(progressBar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    height: '3px',
    background: 'linear-gradient(90deg, #00d4aa, #0ea5e9, #a855f7)',
    zIndex: '10000',
    width: '0%',
    transition: 'width 0.1s linear',
    pointerEvents: 'none',
  });
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    progressBar.style.width = pct + '%';
  }, { passive: true });

})();
