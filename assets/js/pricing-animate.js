(() => {
  const packCards = Array.from(document.querySelectorAll('[data-pack-card]'));
  const revealCards = Array.from(document.querySelectorAll(
    '.hero .hero-title, .hero .hero-sub, .hero .hero-actions, .hero .hero-payment, .hero .hero-meta, .hero .hero-note, .hero .hero-card, ' +
    '.section-header, #why-cleaning-sites .pill-soft, #how-it-works .card, #packages .meta-card, #packages .price-card, ' +
    '#work-demos .card, #faq .faq-item, #contact .contact-right, #contact .contact-form, ' +
    '.trade-picker .trade-chip, .trust-box .trust-item, .site-footer .footer-brand, .site-footer .footer-col, ' +
    '.section-intro, .section-support, .hero-card-note, .contact-note, .contact-trust li, ' +
    '#packages .meta-bullets li, #packages .price-list li, #packages .price-terms li'
  ));
  const allTargets = [...new Set([...packCards, ...revealCards])].sort((a, b) => {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  if (!allTargets.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {
    document.documentElement.classList.add('packs-animate');
  }

  const groupCounts = new Map();
  allTargets.forEach((el) => {
    if (!el.hasAttribute('data-pack-card')) el.setAttribute('data-qt-reveal', '');
    const group = el.closest('.hero, .section, .site-footer') || document.body;
    const count = groupCounts.get(group) || 0;
    groupCounts.set(group, count + 1);
    const delay = Math.min(count, 8) * 46;
    el.style.transitionDelay = `${delay}ms`;
  });

  const reveal = (el) => el.classList.add('is-in');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    allTargets.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.03, rootMargin: '0px 0px -4% 0px' });

  allTargets.forEach(el => observer.observe(el));

  const checkVisible = () => {
    if (allTargets.some(el => el.classList.contains('is-in'))) return;
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    allTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewH * 0.98 && rect.bottom >= 0) reveal(el);
    });
  };

  window.addEventListener('load', checkVisible, { once: true });
  setTimeout(checkVisible, 900);

  // Home hero reach effect: keep logo static while the arm reaches toward navbar logo.
  const setupHeroReach = () => {
    if (prefersReduced) return;
    if (!document.body.classList.contains('page-home')) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;

    const root = document.documentElement;
    const hero = document.querySelector('.page-home .hero');
    const brand = document.querySelector('.site-header .brand-mark, .site-header .brand');
    if (!hero || !brand) return;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let maxShiftX = -260;
    let maxShiftY = -320;
    let lastX = Number.NaN;
    let lastY = Number.NaN;
    let raf = null;

    const recalcTarget = () => {
      const heroRect = hero.getBoundingClientRect();
      const brandRect = brand.getBoundingClientRect();
      const anchorX = heroRect.width * 0.43;
      const anchorY = heroRect.height * 0.74;
      const targetX = (brandRect.left + brandRect.width * 0.5) - heroRect.left;
      const targetY = (brandRect.top + brandRect.height * 0.5) - heroRect.top;
      maxShiftX = clamp((targetX - anchorX), -560, 100);
      maxShiftY = clamp((targetY - anchorY), -620, 80);
    };

    const applyScrollPose = () => {
      raf = null;
      const rect = hero.getBoundingClientRect();
      const travel = Math.min(Math.max(rect.height * 0.95, 360), 760);
      const raw = clamp((-rect.top + 20) / travel, 0, 1);
      const progress = 1 - Math.pow(1 - raw, 1.45);
      const x = Math.round(maxShiftX * progress * 100) / 100;
      const y = Math.round(maxShiftY * progress * 100) / 100;

      if (!Number.isFinite(lastX) || Math.abs(x - lastX) > 0.22) {
        root.style.setProperty('--hero-arm-x', `${x.toFixed(2)}px`);
        lastX = x;
      }
      if (!Number.isFinite(lastY) || Math.abs(y - lastY) > 0.22) {
        root.style.setProperty('--hero-arm-y', `${y.toFixed(2)}px`);
        lastY = y;
      }
    };

    const requestApply = () => {
      if (!raf) raf = requestAnimationFrame(applyScrollPose);
    };

    const onResize = () => {
      recalcTarget();
      requestApply();
    };

    recalcTarget();
    requestApply();
    window.addEventListener('scroll', requestApply, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  };

  setupHeroReach();

  // Reactive nano field: randomized particles that scatter from cursor pressure.
  if (!prefersReduced) {
    const root = document.documentElement;
    const isHomePage = document.body.classList.contains('page-home');
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const compactViewport = window.matchMedia('(max-width: 900px)').matches;
    const disableNanoMotion = !isHomePage || coarsePointer || compactViewport;
    if (disableNanoMotion) {
      root.classList.add('qt-no-nano-motion');
    } else {
    const nanoLayer = document.createElement('canvas');
    nanoLayer.className = 'qt-nano-field';
    nanoLayer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(nanoLayer);

    const ctx = nanoLayer.getContext('2d', { alpha: true });
    const nano = {
      w: 1,
      h: 1,
      dpr: 1,
      pointerX: 0,
      pointerY: 0,
      pointerTx: 0,
      pointerTy: 0,
      pointerActive: false
    };
    const particles = [];
    const cpuCores = navigator.hardwareConcurrency || 4;
    const deviceMemory = navigator.deviceMemory || 8;
    const lowPower = cpuCores <= 10 || deviceMemory <= 14;
    if (lowPower) root.classList.add('qt-lite');
    const renderScale = lowPower ? 0.5 : 0.64;
    const minParticles = lowPower ? 16 : 26;
    const maxParticles = lowPower ? 42 : 68;
    const particleDensity = lowPower ? 76000 : 56000;
    const frameMsActive = 1000 / 40;
    const frameMsIdle = 1000 / 16;
    const cssCache = new Map();
    let nanoRaf = null;
    let resizeRaf = null;
    let pointerIdleTimer = null;
    let lastFrameTs = 0;
    let lastMotion = 1;
    let idleFrames = 0;
    let nanoSleeping = false;
    let lastFillStyle = '';
    const colorA = 'rgb(56 189 248)';
    const colorB = 'rgb(37 99 235)';
    const forceRadius = lowPower ? 130 : 160;
    const forceRadiusSq = forceRadius * forceRadius;

    const rand = (min, max) => min + Math.random() * (max - min);
    const setVarPx = (name, value) => {
      const rounded = Math.round(value * 100) / 100;
      const prev = cssCache.get(name);
      if (prev != null && Math.abs(prev - rounded) < 0.16) return;
      cssCache.set(name, rounded);
      root.style.setProperty(name, `${rounded.toFixed(2)}px`);
    };

    const buildParticles = () => {
      particles.length = 0;
      const count = Math.min(maxParticles, Math.max(minParticles, Math.round((nano.w * nano.h) / particleDensity)));
      for (let i = 0; i < count; i += 1) {
        const x = rand(0, nano.w);
        const y = rand(0, nano.h);
        const tone = Math.random() > 0.5 ? 1 : 0;
        particles.push({
          bx: x,
          by: y,
          x,
          y,
          vx: 0,
          vy: 0,
          r: rand(0.6, 1.75),
          a: rand(0.2, 0.5),
          tone,
          alphaMul: tone ? 1 : 0.86
        });
      }
    };

    const resizeNano = () => {
      nano.dpr = Math.min(window.devicePixelRatio || 1, 2);
      nano.w = Math.max(window.innerWidth || 1, 1);
      nano.h = Math.max(window.innerHeight || 1, 1);
      nanoLayer.width = Math.floor(nano.w * nano.dpr * renderScale);
      nanoLayer.height = Math.floor(nano.h * nano.dpr * renderScale);
      nanoLayer.style.width = `${nano.w}px`;
      nanoLayer.style.height = `${nano.h}px`;
      if (ctx) {
        ctx.setTransform(nano.dpr * renderScale, 0, 0, nano.dpr * renderScale, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }
      buildParticles();
    };

    const renderNano = (ts = 0) => {
      if (!ctx) {
        nanoRaf = null;
        return;
      }
      const frameInterval = (!nano.pointerActive && lastMotion < 0.08) ? frameMsIdle : frameMsActive;
      if (ts - lastFrameTs < frameInterval) {
        nanoRaf = requestAnimationFrame(renderNano);
        return;
      }
      lastFrameTs = ts;
      lastFillStyle = '';
      ctx.clearRect(0, 0, nano.w, nano.h);

      let motion = 0;
      nano.pointerX += (nano.pointerTx - nano.pointerX) * 0.18;
      nano.pointerY += (nano.pointerTy - nano.pointerY) * 0.18;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        if (nano.pointerActive) {
          const dx = p.x - nano.pointerX;
          const dy = p.y - nano.pointerY;
          const d2 = dx * dx + dy * dy;
          if (d2 < forceRadiusSq) {
            const d = Math.sqrt(d2) || 1;
            const falloff = 1 - (d / forceRadius);
            const blast = falloff * falloff * 1.72;
            p.vx += (dx / d) * blast;
            p.vy += (dy / d) * blast;
          }
        }

        p.vx += (p.bx - p.x) * 0.015;
        p.vy += (p.by - p.y) * 0.015;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
        const speed = Math.abs(p.vx) + Math.abs(p.vy);
        motion += speed;

        const m = Math.min(speed * 0.34, 0.34);
        const alpha = (p.a + m) * p.alphaMul;
        const size = (p.r + m * 1.8) * 1.45;
        const half = size * 0.5;
        const fillStyle = p.tone ? colorA : colorB;
        if (fillStyle !== lastFillStyle) {
          ctx.fillStyle = fillStyle;
          lastFillStyle = fillStyle;
        }
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - half, p.y - half, size, size);
      }
      ctx.globalAlpha = 1;

      const nx = nano.pointerActive ? (nano.pointerX / nano.w - 0.5) : 0;
      const ny = nano.pointerActive ? (nano.pointerY / nano.h - 0.5) : 0;
      const avgMotion = motion / Math.max(particles.length, 1);
      lastMotion = avgMotion;
      if (!nano.pointerActive && avgMotion < 0.01) idleFrames += 1;
      else idleFrames = 0;
      const motionBoost = Math.min(avgMotion * 0.9, 1.15);
      if (nano.pointerActive || avgMotion > 0.02) {
        setVarPx('--nano-bg-x', nx * (20 + motionBoost * 8));
        setVarPx('--nano-bg-y', ny * (18 + motionBoost * 7));
        setVarPx('--nano-hero-x', nx * (26 + motionBoost * 12));
        setVarPx('--nano-hero-y', ny * (22 + motionBoost * 11));
      } else {
        setVarPx('--nano-bg-x', 0);
        setVarPx('--nano-bg-y', 0);
        setVarPx('--nano-hero-x', 0);
        setVarPx('--nano-hero-y', 0);
      }

      if (!nano.pointerActive && idleFrames > 24) {
        nanoRaf = null;
        nanoSleeping = true;
        return;
      }
      nanoRaf = requestAnimationFrame(renderNano);
    };

    const onPointerMove = (ev) => {
      const mdx = Math.abs(ev.clientX - nano.pointerTx);
      const mdy = Math.abs(ev.clientY - nano.pointerTy);
      if (mdx < 0.35 && mdy < 0.35) return;
      nano.pointerTx = ev.clientX;
      nano.pointerTy = ev.clientY;
      nano.pointerActive = true;
      if (pointerIdleTimer) clearTimeout(pointerIdleTimer);
      pointerIdleTimer = window.setTimeout(() => {
        nano.pointerActive = false;
      }, 140);
      if (nanoSleeping) startNano();
    };

    const onPointerLeave = () => {
      if (pointerIdleTimer) {
        clearTimeout(pointerIdleTimer);
        pointerIdleTimer = null;
      }
      nano.pointerActive = false;
      nano.pointerTx = nano.w * 0.5;
      nano.pointerTy = nano.h * 0.5;
    };
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        resizeNano();
      });
    };
    const startNano = () => {
      if (nanoRaf) return;
      nanoSleeping = false;
      idleFrames = 0;
      nanoRaf = requestAnimationFrame(renderNano);
    };
    const stopNano = () => {
      if (!nanoRaf) return;
      cancelAnimationFrame(nanoRaf);
      nanoRaf = null;
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopNano();
        return;
      }
      lastFrameTs = 0;
      startNano();
    };

    resizeNano();
    nano.pointerX = nano.w * 0.5;
    nano.pointerY = nano.h * 0.5;
    nano.pointerTx = nano.pointerX;
    nano.pointerTy = nano.pointerY;
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    startNano();
    }
  }

  // Smash effect: section/card under cursor compresses and tilts with mouse movement.
  if (prefersReduced) return;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return;

  const smashSelector = '.card, .price-card, .meta-card, .proof-card, .faq-item, .how-step, .service-card, .svc-card, .contact-right, .contact-form, .hero-card, .trade-chip, .pill-soft';
  const smashTargets = Array.from(document.querySelectorAll(smashSelector));
  if (!smashTargets.length) return;
  const state = { x: 0, y: 0, tx: 0, ty: 0, raf: null, lastInputTs: 0 };
  let activeEl = null;
  let activeRect = null;
  let pendingMove = null;
  let moveRaf = null;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let lastTransform = '';
  let leaveTimer = null;
  let smashRectRaf = null;
  const smashFrameMs = 1000 / 48;
  let smashLastTs = 0;

  const resetEl = (el) => {
    if (!el) return;
    el.classList.remove('qt-smash-active');
    el.style.transition = 'transform 420ms cubic-bezier(.22,1,.36,1)';
    el.style.transform = '';
    lastTransform = '';
    window.setTimeout(() => {
      if (el !== activeEl) el.style.willChange = '';
    }, 430);
  };

  const setActive = (el) => {
    if (leaveTimer) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    if (el === activeEl) return;
    const prev = activeEl;
    activeEl = el;
    if (prev) resetEl(prev);
    // Reset motion state when switching targets to avoid snap/jump carry-over.
    state.x = 0;
    state.y = 0;
    state.tx = 0;
    state.ty = 0;
    activeRect = null;
    lastTransform = '';
    if (activeEl) {
      activeEl.classList.add('qt-smash-active');
      activeEl.style.willChange = 'transform';
      activeEl.style.transition = 'transform 160ms cubic-bezier(.22,.61,.36,1)';
      activeRect = activeEl.getBoundingClientRect();
      if (activeRect.width > 2 && activeRect.height > 2) {
        state.tx = ((lastMouseX - activeRect.left) / activeRect.width) - 0.5;
        state.ty = ((lastMouseY - activeRect.top) / activeRect.height) - 0.5;
        state.tx = Math.max(-0.5, Math.min(0.5, state.tx));
        state.ty = Math.max(-0.5, Math.min(0.5, state.ty));
        state.x = state.tx * 0.6;
        state.y = state.ty * 0.6;
      }
    }
  };

  const tickSmash = (ts = 0) => {
    if (!activeEl) {
      state.raf = null;
      return;
    }
    if (ts - smashLastTs < smashFrameMs) {
      state.raf = requestAnimationFrame(tickSmash);
      return;
    }
    smashLastTs = ts;

    const dx = state.tx - state.x;
    const dy = state.ty - state.y;
    state.x += dx * 0.12;
    state.y += dy * 0.12;

    const rx = (-state.y * 2.3);
    const ry = (state.x * 2.8);
    const tx = (state.x * 2.6);
    const ty = (state.y * 2.1);
    const sx = 1 - Math.abs(state.y) * 0.0065;
    const sy = 1 - Math.abs(state.x) * 0.006;

    const transform =
      `perspective(1100px) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) ` +
      `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    if (transform !== lastTransform) {
      activeEl.style.transform = transform;
      lastTransform = transform;
    }
    const settled = Math.abs(dx) < 0.0008 && Math.abs(dy) < 0.0008;
    if (settled && performance.now() - state.lastInputTs > 170) {
      state.raf = null;
      return;
    }
    state.raf = requestAnimationFrame(tickSmash);
  };

  const processMove = () => {
    moveRaf = null;
    if (!pendingMove || !activeEl) return;
    const ev = pendingMove;
    pendingMove = null;

    const now = performance.now();
    if (!activeRect) {
      activeRect = activeEl.getBoundingClientRect();
    }
    if (!activeRect || activeRect.width < 2 || activeRect.height < 2) return;
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    if (activeRect.bottom < 0 || activeRect.top > viewH) {
      state.tx = 0;
      state.ty = 0;
      return;
    }

    const ntx = ((ev.x - activeRect.left) / activeRect.width) - 0.5;
    const nty = ((ev.y - activeRect.top) / activeRect.height) - 0.5;
    const ctx = Math.max(-0.42, Math.min(0.42, ntx));
    const cty = Math.max(-0.42, Math.min(0.42, nty));
    state.tx = Math.abs(ctx) < 0.005 ? 0 : ctx;
    state.ty = Math.abs(cty) < 0.005 ? 0 : cty;
    state.lastInputTs = now;
    if (!state.raf) state.raf = requestAnimationFrame(tickSmash);
  };

  const onMove = (ev) => {
    const mdx = Math.abs(ev.clientX - lastMouseX);
    const mdy = Math.abs(ev.clientY - lastMouseY);
    if (mdx < 0.3 && mdy < 0.3) return;
    lastMouseX = ev.clientX;
    lastMouseY = ev.clientY;
    if (!activeEl) return;
    pendingMove = { x: ev.clientX, y: ev.clientY };
    if (!moveRaf) moveRaf = requestAnimationFrame(processMove);
  };

  const onLeaveWindow = () => {
    state.tx = 0;
    state.ty = 0;
    pendingMove = null;
    if (moveRaf) {
      cancelAnimationFrame(moveRaf);
      moveRaf = null;
    }
    if (leaveTimer) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }
    if (activeEl) {
      const old = activeEl;
      activeEl = null;
      activeRect = null;
      resetEl(old);
    }
  };

  const updateSmashRect = () => {
    smashRectRaf = null;
    if (!activeEl) return;
    activeRect = activeEl.getBoundingClientRect();
  };

  const onResize = () => {
    if (smashRectRaf) return;
    smashRectRaf = requestAnimationFrame(updateSmashRect);
  };

  const onScroll = () => {
    if (smashRectRaf) return;
    smashRectRaf = requestAnimationFrame(updateSmashRect);
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseleave', onLeaveWindow);
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  smashTargets.forEach((el) => {
    el.addEventListener('mouseenter', (ev) => {
      if (leaveTimer) {
        clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      lastMouseX = ev.clientX;
      lastMouseY = ev.clientY;
      setActive(el);
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      if (activeEl !== el) return;
      leaveTimer = window.setTimeout(() => {
        if (activeEl === el) setActive(null);
        leaveTimer = null;
      }, 32);
    }, { passive: true });
  });
})();
