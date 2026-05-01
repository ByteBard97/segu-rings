/* scene 02 — progress / invlerp
   Three views of "where am I in the bar?":
     - naive segu invlerp           (sawtooth)
     - hand-rolled modulo / barLen  (same sawtooth)
     - lifted: point on unit circle (smooth, no discontinuity)
*/
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-02-demo');
  if (!root) return;

  const W = 520, H = 360;
  const barLen = 4; // 4-second bar
  const period = barLen * 2; // play 2 bars worth so we see wraps

  // build SVG
  root.innerHTML = `
    <h3>bar timeline · loop = ${barLen}s</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <!-- bar timeline strip -->
        <g id="s2-timeline"></g>
        <!-- naive plot -->
        <g id="s2-plot-naive"></g>
        <!-- hand plot -->
        <g id="s2-plot-hand"></g>
        <!-- lifted lissajous -->
        <g id="s2-plot-lift"></g>
      </svg>
    </div>
    <div class="transport">
      <button id="s2-play">pause</button>
      <span>auto-advancing playhead</span>
    </div>
    <div class="readouts" id="s2-readouts"></div>
  `;

  // ---- timeline strip layout ----
  const stripX = 14, stripY = 18, stripW = W - 28, stripH = 26;
  const tl = root.querySelector('#s2-timeline');
  // wood-tone background
  tl.appendChild(S.svgEl('rect', {
    x: stripX, y: stripY, width: stripW, height: stripH, rx: 3,
    fill: 'var(--wood-2)', stroke: 'var(--wood-line)'
  }));
  // beat divisions (4 beats per bar)
  for (let i = 1; i < 4; i++) {
    const x = stripX + (stripW * i) / 4;
    tl.appendChild(S.svgEl('line', {
      x1: x, y1: stripY + 2, x2: x, y2: stripY + stripH - 2,
      stroke: 'var(--wood-line)', 'stroke-width': 1
    }));
  }
  // beat dots
  for (let i = 0; i < 4; i++) {
    const x = stripX + (stripW * (i + 0.5)) / 4;
    tl.appendChild(S.svgEl('circle', {
      cx: x, cy: stripY + stripH / 2, r: 2.5,
      fill: 'var(--fret-dot)'
    }));
  }
  // playhead
  const playhead = S.svgEl('rect', {
    x: stripX, y: stripY - 3, width: 3, height: stripH + 6, rx: 1,
    fill: 'var(--hand)'
  });
  tl.appendChild(playhead);
  // bar boundary marker
  const barBoundary = S.svgEl('line', {
    x1: stripX + stripW / 2, y1: stripY - 6,
    x2: stripX + stripW / 2, y2: stripY + stripH + 6,
    stroke: 'var(--rule-2)', 'stroke-dasharray': '2 3'
  });
  tl.appendChild(barBoundary);
  tl.appendChild(S.svgEl('text', {
    x: stripX + stripW / 2, y: stripY - 9,
    'text-anchor': 'middle',
    'font-family': 'var(--sans)', 'font-size': 9,
    fill: 'var(--ink-4)', 'letter-spacing': '0.14em'
  })).textContent = 'BAR WRAP';

  // ---- plot panes (naive + hand stacked, lift to right) ----
  // pane geometry
  const pane = (id, x, y, w, h, label, color) => {
    const g = root.querySelector('#' + id);
    g.appendChild(S.svgEl('rect', { x, y, width: w, height: h, rx: 3, fill: 'var(--bg)', stroke: 'var(--rule)' }));
    // baseline / midline
    g.appendChild(S.svgEl('line', { x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: 'var(--rule)' }));
    g.appendChild(S.svgEl('line', { x1: x, y1: y, x2: x + w, y2: y, stroke: 'var(--rule)' }));
    // label
    const t = S.svgEl('text', {
      x: x + 8, y: y + 14,
      'font-family': 'var(--sans)', 'font-size': 10,
      fill: color, 'letter-spacing': '0.12em'
    });
    t.textContent = label;
    g.appendChild(t);
    // 1.0 / 0.0 markers
    const t0 = S.svgEl('text', {
      x: x + w - 6, y: y + 11,
      'font-family': 'var(--mono)', 'font-size': 9,
      fill: 'var(--ink-4)', 'text-anchor': 'end'
    });
    t0.textContent = '1.0';
    const t1 = S.svgEl('text', {
      x: x + w - 6, y: y + h - 4,
      'font-family': 'var(--mono)', 'font-size': 9,
      fill: 'var(--ink-4)', 'text-anchor': 'end'
    });
    t1.textContent = '0.0';
    g.appendChild(t0); g.appendChild(t1);
    return { g, x, y, w, h };
  };

  const plotW = 280, plotH = 90;
  const pNaive = pane('s2-plot-naive', 14, 70,  plotW, plotH, 'NAIVE invlerp(now, 0, barLen)', 'var(--scalar)');
  const pHand  = pane('s2-plot-hand',  14, 180, plotW, plotH, 'HAND-ROLLED ((now-bs) % L) / L',  'var(--hand)');

  // lift pane (right) — square circular plot
  const liftSize = 200;
  const liftCx = W - liftSize/2 - 20;
  const liftCy = 180;
  const lg = root.querySelector('#s2-plot-lift');
  lg.appendChild(S.svgEl('rect', {
    x: liftCx - liftSize/2 - 4, y: liftCy - liftSize/2 - 4,
    width: liftSize + 8, height: liftSize + 8, rx: 3,
    fill: 'var(--bg)', stroke: 'var(--rule)'
  }));
  lg.appendChild(S.svgEl('text', {
    x: liftCx - liftSize/2 + 4, y: liftCy - liftSize/2 + 8,
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--vector)', 'letter-spacing': '0.12em'
  })).textContent = 'LIFTED [cos θ, sin θ]';
  // unit circle
  lg.appendChild(S.svgEl('circle', {
    cx: liftCx, cy: liftCy, r: liftSize / 2 - 14,
    fill: 'none', stroke: 'var(--rule-2)', 'stroke-dasharray': '2 4'
  }));
  // axes
  lg.appendChild(S.svgEl('line', {
    x1: liftCx - liftSize/2 + 6, y1: liftCy, x2: liftCx + liftSize/2 - 6, y2: liftCy,
    stroke: 'var(--rule)'
  }));
  lg.appendChild(S.svgEl('line', {
    x1: liftCx, y1: liftCy - liftSize/2 + 6, x2: liftCx, y2: liftCy + liftSize/2 - 6,
    stroke: 'var(--rule)'
  }));

  // dynamic elements: trail polylines, current dot
  const naiveTrail = S.svgEl('polyline', {
    fill: 'none', stroke: 'var(--scalar)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round'
  });
  pNaive.g.appendChild(naiveTrail);
  const naiveDot = S.svgEl('circle', { r: 3.5, fill: 'var(--scalar)' });
  pNaive.g.appendChild(naiveDot);

  const handTrail = S.svgEl('polyline', {
    fill: 'none', stroke: 'var(--hand)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round'
  });
  pHand.g.appendChild(handTrail);
  const handDot = S.svgEl('circle', { r: 3.5, fill: 'var(--hand)' });
  pHand.g.appendChild(handDot);

  const liftTrail = S.svgEl('polyline', {
    fill: 'none', stroke: 'var(--vector)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round'
  });
  lg.appendChild(liftTrail);
  const liftDot = S.svgEl('circle', { r: 4, fill: 'var(--vector)' });
  lg.appendChild(liftDot);

  // readouts
  const readouts = root.querySelector('#s2-readouts');
  readouts.innerHTML = `
    <div class="row" id="s2-r-naive">
      <span class="swatch scalar"></span>
      <span class="name">naive segu <span class="sub">invlerp(now, 0, barLen)</span></span>
      <span class="val">0.00</span>
    </div>
    <div class="row" id="s2-r-hand">
      <span class="swatch hand"></span>
      <span class="name">hand-rolled <span class="sub">((now − barStart) % L) / L</span></span>
      <span class="val">0.00</span>
    </div>
    <div class="row" id="s2-r-lift">
      <span class="swatch vector"></span>
      <span class="name">lifted <span class="sub">(cos 2π·now/L, sin 2π·now/L)</span></span>
      <span class="val">(1.00, 0.00)</span>
    </div>
  `;
  const rNaive = readouts.querySelector('#s2-r-naive .val');
  const rHand  = readouts.querySelector('#s2-r-hand .val');
  const rLift  = readouts.querySelector('#s2-r-lift .val');

  // history buffers
  const HIST = 240;
  const histNaive = [], histHand = [], histLift = [];

  function px(t) {
    // map global time t in [0, period) to plot x
    return pNaive.x + (t / period) * pNaive.w;
  }
  function py(p, pane) {
    return pane.y + pane.h - p * (pane.h - 2) - 1;
  }

  function compute(t) {
    // bar starts at 0 if t<barLen else barLen
    const barStart = Math.floor(t / barLen) * barLen;
    const barEnd = barStart + barLen;

    // naive: invlerp(now, 0, barLen) — only correct for first bar; sawtooth-style break
    // (we deliberately use the original [0, barLen] window so it explodes after the boundary)
    // For demo: clamp((t - 0) / (barLen - 0)) — caps at 1 after first bar.
    // But the more honest "naive" sawtooth is ((t-0) / barLen) % 1 as a number; let's show invlerp
    // applied with the *current* bar window — and when the bar boundary crosses, it snaps.
    // We'll show: y = invlerp(t, barStart, barEnd) — same as hand actually. Better: compute the
    // segu-naive way — using a constant window that doesn't update. So use [0, barLen]:
    const naive = S.invlerp(t, 0, barLen); // jumps to 1.0 after first bar, frozen
    // hand-rolled: ((t - barStart0) % L) / L  — a sawtooth
    const hand = ((t - 0) % barLen) / barLen;
    // lifted: point on unit circle
    const ang = (t / barLen) * S.TAU;
    const lx = Math.cos(ang), ly = Math.sin(ang);

    return { naive, hand, lx, ly, ang, barStart, barEnd };
  }

  function render(t) {
    const r = compute(t);

    // playhead position on timeline strip
    const phx = stripX + (t / period) * stripW;
    playhead.setAttribute('x', phx - 1.5);

    // push history
    histNaive.push({ t, v: r.naive });
    histHand.push({ t, v: r.hand });
    histLift.push({ x: r.lx, y: r.ly });
    if (histNaive.length > HIST) histNaive.shift();
    if (histHand.length > HIST) histHand.shift();
    if (histLift.length > HIST) histLift.shift();

    // draw naive trail — split into segments at jumps
    const nPts = histNaive.map(p => `${px(p.t).toFixed(1)},${py(p.v, pNaive).toFixed(1)}`);
    naiveTrail.setAttribute('points', nPts.join(' '));
    naiveDot.setAttribute('cx', px(t));
    naiveDot.setAttribute('cy', py(r.naive, pNaive));

    const hPts = histHand.map(p => `${px(p.t).toFixed(1)},${py(p.v, pHand).toFixed(1)}`);
    handTrail.setAttribute('points', hPts.join(' '));
    handDot.setAttribute('cx', px(t));
    handDot.setAttribute('cy', py(r.hand, pHand));

    // lifted trail (lissajous)
    const radius = liftSize / 2 - 14;
    const lPts = histLift.map(p =>
      `${(liftCx + p.x * radius).toFixed(1)},${(liftCy - p.y * radius).toFixed(1)}`);
    liftTrail.setAttribute('points', lPts.join(' '));
    liftDot.setAttribute('cx', liftCx + r.lx * radius);
    liftDot.setAttribute('cy', liftCy - r.ly * radius);

    // text readouts
    rNaive.textContent = S.fmt(r.naive, 3);
    rHand.textContent  = S.fmt(r.hand, 3);
    rLift.textContent  = `(${S.fmt(r.lx, 2)}, ${S.fmt(r.ly, 2)})`;

    // flag the broken ones when crossing the seam
    const nearWrap = Math.abs((t % barLen) - barLen) < 0.15 || (t % barLen) < 0.15;
    document.getElementById('s2-r-naive').classList.toggle('flagged', t > barLen + 0.05);
    document.getElementById('s2-r-hand').classList.toggle('flagged', nearWrap);
  }

  // playhead driver
  const ph = S.makePlayhead({
    period, speed: 1.2,
    onTick: (t) => render(t)
  });

  // pause when out of view
  const sec = root.closest('section.scene');
  const isVisible = S.visibilityGate(sec, 0.05);
  setInterval(() => {
    if (isVisible() && !ph.state.playing && !ph.state._userPaused) ph.play();
    if (!isVisible() && ph.state.playing) ph.pause();
  }, 250);

  const btn = root.querySelector('#s2-play');
  btn.addEventListener('click', () => {
    if (ph.state.playing) {
      ph.pause(); ph.state._userPaused = true; btn.textContent = 'play';
    } else {
      ph.play(); ph.state._userPaused = false; btn.textContent = 'pause';
    }
  });
})();
