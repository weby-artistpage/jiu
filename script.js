document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  const mark = document.querySelector('.site-mark');
  const snsBar = document.querySelector('.sns-fab');
  const menuBar = document.querySelector('.menu-bar');
  const menuToggle = document.querySelector('.menu-toggle');
  const menuPanel = document.getElementById('menu-panel');
  if (!hero || !mark) return;

  const showMark = () => setTimeout(() => {
    mark.classList.add('visible');
    if (snsBar) snsBar.classList.add('visible');
    if (menuBar) menuBar.classList.add('visible');
  }, 400);

  // Collapsible menu interactions
  if (menuToggle && menuBar) {
    const setExpanded = (open) => {
      menuBar.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    };
    menuToggle.addEventListener('click', () => {
      const isOpen = menuBar.classList.contains('open');
      setExpanded(!isOpen);
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menuBar.contains(e.target)) setExpanded(false);
    });
    // Close on link click
    menuPanel?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setExpanded(false)));
    // Close on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setExpanded(false); });
  }

  // If hero has an animation, wait for it to finish, then +3s
  let waited = false;
  hero.addEventListener('animationend', () => {
    waited = true;
    showMark();
  }, { once: true });

  // Safety: if reduced motion disables animation, or event missed, fall back
  setTimeout(() => {
    if (!waited) showMark();
  }, 550); // hero fade is ~0.5s; fallback shortly after
});

// Live section interactions: lightbox only (DM goes directly to external link)
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox?.querySelector('.lightbox-image');

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }


  // Openers (any element with data-large)
  document.querySelectorAll('[data-large]').forEach(el => {
    el.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const src = target.getAttribute('data-large');
      if (src) openLightbox(src);
    });
  });

  // Closers
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); }
  });
});

// Background: subtle water ripples
document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Switch site to black-water mode (hide gradient)
  document.body.classList.add('water-black');

  function startRipples(canvas, opts = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let ripples = [];
    let running = true;

    function resize() {
      const w = opts.fullscreen ? window.innerWidth : (canvas.clientWidth || window.innerWidth);
      const h = opts.fullscreen ? window.innerHeight : (canvas.clientHeight || window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    function spawnRipple(x, y) {
      const now = performance.now();
      ripples.push({
        x, y,
        t0: now,
        dur: (opts.durMin || 1400) + Math.random() * (opts.durVar || 900),
        rMax: (opts.rMin || 140) + Math.random() * (opts.rVar || 200),
        lw: (opts.lwMin || 0.6) + Math.random() * (opts.lwVar || 0.6)
      });
      if (ripples.length > (opts.max || 50)) ripples.shift();
    }

    function randomSpawn() {
      const rect = canvas.getBoundingClientRect();
      const drops = (opts.baseDrops || 1) + (Math.random() < (opts.extraProb ?? 0.5) ? (opts.extraCount || 1) : 0);
      for (let i = 0; i < drops; i++) {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        spawnRipple(x - rect.left, y - rect.top);
      }
      const next = (opts.spawnMin || 240) + Math.random() * (opts.spawnVar || 700);
      if (running) setTimeout(randomSpawn, next);
    }
    setTimeout(randomSpawn, opts.firstDelay || 300);

    function draw(now) {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const p = Math.min(1, (now - r.t0) / r.dur);
        if (p >= 1) { continue; }
        const radius = r.rMax * (0.10 + 0.90 * p);
        const alpha = (1 - p) * (opts.alpha || 0.5);
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        const col = opts.color || [255, 106, 167]; // default: soft pink
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.min(1, alpha * (opts.bright || 0.6))})`;
        ctx.lineWidth = r.lw * (1 + p * 1.0);
        ctx.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},${alpha * 0.35})`;
        ctx.shadowBlur = 6;
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(draw);
    });

    // Optional interaction: click/tap to drop a ripple
    if (opts.interactive) {
      window.addEventListener('pointerdown', (ev) => {
        const rect = canvas.getBoundingClientRect();
        spawnRipple(ev.clientX - rect.left, ev.clientY - rect.top);
      });
    }
  }

  // Start global background ripples
  startRipples(document.getElementById('water-canvas'), {
    alpha: 0.8,
    bright: 1.0,
    rMin: 200,
    rVar: 240,
    durMin: 1800,
    durVar: 1200,
    max: 100,
    spawnMin: 140,
    spawnVar: 320,
    baseDrops: 1,
    extraProb: 0.7,
    extraCount: 1,
    color: [255,106,167],
    fullscreen: true,
    interactive: true
  });
});
