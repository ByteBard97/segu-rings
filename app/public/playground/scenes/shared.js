/* shared.js — small utilities shared across scenes */

// ---- math helpers ----
const TAU = Math.PI * 2;

function clamp(v, a = 0, b = 1) { return Math.min(b, Math.max(a, v)); }
function lerp(t, a, b) { return a * (1 - t) + b * t; }
function invlerp(v, a, b) { return clamp((v - a) / (b - a)); }

// segu's cyclic, copied verbatim
function cyclic(value, x, y) {
  return (value >= x ? value : value + y) % y;
}

// time -> point on unit circle (loop length L)
function toCircle(t, L) {
  const a = (t / L) * TAU;
  return { x: Math.cos(a), y: Math.sin(a), a };
}

// shortest signed angle a -> b on circle, in radians, in (-PI, PI]
function shortestAngle(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= TAU;
  while (d <= -Math.PI) d += TAU;
  return d;
}

// arc distance on circle of length L (signed, shortest)
function arcDistanceL(t1, t2, L) {
  return shortestAngle((t1 / L) * TAU, (t2 / L) * TAU) * L / TAU;
}

// classic forward distance via double-modulo
function forwardModulo(t1, t2, L) {
  return ((t2 - t1) % L + L) % L;
}

// shared scrubber driver — auto-advances when scene visible
function makePlayhead({ period = 8, speed = 1, onTick }) {
  const state = { t: 0, playing: true, period, speed, last: performance.now() };
  let raf;
  function step(now) {
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    if (state.playing) {
      state.t = (state.t + dt * state.speed) % state.period;
      if (state.t < 0) state.t += state.period;
    }
    onTick(state.t, state);
    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
  return {
    state,
    set(t) { state.t = ((t % state.period) + state.period) % state.period; },
    pause() { state.playing = false; },
    play()  { state.playing = true; state.last = performance.now(); },
    toggle(){ state.playing ? this.pause() : this.play(); },
    stop()  { cancelAnimationFrame(raf); }
  };
}

// IntersectionObserver gate — returns a function `gate(cb)` that only calls cb
// when the scene is at least partially visible.
function visibilityGate(el, threshold = 0.1) {
  let visible = true;
  const io = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
  }, { threshold });
  io.observe(el);
  return () => visible;
}

// pretty-print a number to fixed precision, with sign
function fmt(n, p = 2) {
  if (!isFinite(n)) return '—';
  const s = n.toFixed(p);
  return s === `-${(0).toFixed(p)}` ? (0).toFixed(p) : s;
}

// SVG element creation helper
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

window.AppliedShared = {
  TAU, clamp, lerp, invlerp, cyclic,
  toCircle, shortestAngle, arcDistanceL, forwardModulo,
  makePlayhead, visibilityGate, fmt, svgEl
};
