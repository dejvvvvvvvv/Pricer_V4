/**
 * confetti.js — Lightweight canvas-based confetti celebration animation.
 *
 * Pure JavaScript, zero dependencies.
 * Respects prefers-reduced-motion.
 * Auto-cleans up canvas after animation ends.
 *
 * Usage:
 *   import { triggerConfetti } from '@/lib/confetti';
 *   triggerConfetti();                       // defaults
 *   triggerConfetti({ particleCount: 200 }); // custom
 */

// Forge palette colors (teal, orange, purple, blue, white)
const COLORS = [
  '#00D4AA', // teal (accent-primary)
  '#FF6B35', // orange (accent-secondary)
  '#6C63FF', // purple (accent-tertiary)
  '#4DA8DA', // blue (info)
  '#E8ECF1', // white-ish (text-primary)
  '#00F0C0', // bright teal
  '#FFB547', // warm yellow (warning)
];

const DEFAULTS = {
  particleCount: 150,
  spread: 70,
  origin: { x: 0.5, y: 0.3 },
  duration: 3000,
  gravity: 980,
  drift: 0.4,
};

/**
 * @param {object} [opts]
 * @param {number} [opts.particleCount=150]
 * @param {number} [opts.spread=70] - spread angle in degrees
 * @param {{ x?: number, y?: number }} [opts.origin] - 0..1 normalized
 * @param {number} [opts.duration=3000] - ms
 */
export function triggerConfetti(opts = {}) {
  // Respect prefers-reduced-motion
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const config = { ...DEFAULTS, ...opts };
  config.origin = { ...DEFAULTS.origin, ...opts.origin };

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create particles
  const particles = [];
  const spreadRad = (config.spread * Math.PI) / 180;

  for (let i = 0; i < config.particleCount; i++) {
    // Random angle centered upward (-PI/2) with spread
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad;
    // Random initial speed
    const speed = 300 + Math.random() * 500;

    particles.push({
      x: config.origin.x * w,
      y: config.origin.y * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      // Each particle is either a rectangle or circle
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      size: 3 + Math.random() * 5,
      // Rotation state
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 12,
      // Wind drift
      drift: (Math.random() - 0.5) * config.drift,
      // Opacity — starts at 1, fades near end
      opacity: 1,
      // Wobble for more organic feel
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 3,
    });
  }

  const startTime = performance.now();
  let animationId;

  function tick(now) {
    const elapsed = now - startTime;
    if (elapsed > config.duration) {
      cleanup();
      return;
    }

    const progress = elapsed / config.duration;
    // Delta time in seconds (capped to avoid huge jumps on tab switch)
    const dt = Math.min((now - (tick._lastTime || now)) / 1000, 0.05);
    tick._lastTime = now;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Physics
      p.vy += config.gravity * dt;
      p.vx += p.drift * 60 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;

      // Fade out in the last 40% of duration
      if (progress > 0.6) {
        p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      // Skip offscreen or invisible
      if (p.opacity <= 0 || p.y > h + 20 || p.x < -20 || p.x > w + 20) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        // Wobble the aspect ratio for a fluttering effect
        const wobble = Math.sin(elapsed * 0.001 * p.wobbleSpeed + p.wobblePhase);
        const rw = p.size * (0.6 + 0.4 * Math.abs(wobble));
        const rh = p.size * 0.6;
        ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    animationId = requestAnimationFrame(tick);
  }

  function cleanup() {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  // Start
  tick._lastTime = performance.now();
  animationId = requestAnimationFrame(tick);

  // Safety net: cleanup after duration + buffer
  const safetyTimeout = setTimeout(cleanup, config.duration + 500);

  // Return a cancel handle
  return () => {
    clearTimeout(safetyTimeout);
    cleanup();
  };
}

/**
 * Play a brief cheerful "ding" sound via Web Audio API.
 * Fails silently if audio is not available or user has not interacted yet.
 */
export function playSuccessSound() {
  // Respect reduced motion as a proxy for "less stimulation" preference
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // Two quick tones for a cheerful "ding-ding"
    const playTone = (freq, startAt, duration, gain) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(gain, ctx.currentTime + startAt);
      vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + duration);
    };

    // Two ascending tones — subtle and brief
    playTone(880, 0, 0.15, 0.08);    // A5
    playTone(1175, 0.08, 0.2, 0.06); // D6

    // Close audio context after sounds finish
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Silently ignore — sound is optional
  }
}
