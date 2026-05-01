/* scene 02 — progress / invlerp
   Three views of "where am I in the bar?":
     - naive segu invlerp(now, 0, barLen) — a *frozen* clamp after the first bar
     - hand-rolled ((now-bs) % L) / L      — a true sawtooth with a tear at every seam
     - lifted: point on the unit circle    — smooth, no discontinuity

   Pedagogical goal: linear math on a cyclic value tears at the wrap.
   Lifting to the circle removes the tear. The sawtooth and the frozen ramp are
   two different ways the line is wrong; the circle is the same answer everywhere.
*/
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-02-demo');
  if (!root) return;

  const W = 520, H = 360;
  const barLen = 4;             // 4-second bar
  const period = barLen * 3;    // observe three bars so we see multiple wraps

  // build SVG
  root.innerHTML = `
    <h3>bar timeline · loop = ${barLen}s</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <g id="s2-timeline"></g>
        <g id="s2-plot-naive"></g>
        <g id="s2-plot-hand"></g>
        <g id="s2-plot-lift"></g>
      </svg>
    </div>
    <div class="transport">
      <button id="s2-play">pause</button>
      <span>auto-advancing playhead · slowed so the seam is catchable</span>
    </div>
    <div class="readouts" id="s2-readouts"></div>
  `;

  // ---- timeline strip layout ----
  const stripX = 14, stripY = 18, stripW = W - 28, stripH = 26;
  const tl = root.querySelector('#s2-timeline');
  tl.appendChild(S.svgEl('rect', {
    x: stripX, y: stripY, width: stripW, height: stripH, rx: 3,
    fill: 'var(--wood-2)', stroke: 'var(--wood-line)'
  }));
  // bar boundary markers (wraps) at t = k*barLen for k=1..N-1
  const wrapsInPeriod = Math.round(period / barLen);
  for (let k = 1; k < wrapsInPeriod; k++) {
    const wx = stripX + (k * barLen / period) * stripW;
    tl.appendChild(S.svgEl('line', {
      x1: wx, y1: stripY - 6, x2: wx, y2: stripY + stripH + 6,
      stroke: 'var(--rule-2)', 'stroke-dasharray': '2 3'
    }));
    tl.appendChild(S.svgEl('text', {
      x: wx, y: stripY - 9, 'text-anchor': 'middle',
      'font-family': 'var(--sans)', 'font-size': 9,
      fill: 'var(--ink-4)', 'letter-spacing': '0.14em'
    })).textContent = 'BAR WRAP';
  }
  // beat dots inside each bar
  for (let k = 0; k < wrapsInPeriod; k++) {
    for (let i = 0; i < 4; i++) {
      const tBeat = k * barLen + (i + 0.5) * (barLen / 4);
      const x = stripX + (tBeat / period) * stripW;
      tl.appendChild(S.svgEl('circle', {
        cx: x, cy: stripY + stripH / 2, r: 2,
        fill: 'var(--fret-dot)'
      }));
    }
  }
  // playhead
  const playhead = S.svgEl('rect', {
    x: stripX, y: stripY - 3, width: 3, height: stripH + 6, rx: 1,
    fill: 'var(--hand)'
  });
  tl.appendChild(playhead);

  // ---- plot panes ----
  const pane = (id, x, y, w, h, label, color) => {
    const g = root.querySelector('#' + id);
    g.appendChild(S.svgEl('rect', { x, y, width: w, height: h, rx: 3, fill: 'var(--bg)', stroke: 'var(--rule)' }));
    g.appendChild(S.svgEl('line', { x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: 'var(--rule)' }));
    g.appendChild(S.svgEl('line', { x1: x, y1: y, x2: x + w, y2: y, stroke: 'var(--rule)' }));
    const t = S.svgEl('text', {
      x: x + 8, y: y + 14,
      'font-family': 'var(--sans)', 'font-size': 10,
      fill: color, 'letter-spacing': '0.12em'
    });
    t.textContent = label;
    g.appendChild(t);
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
  const pHand  = pane('s2-plot-hand',  14, 180, plotW, plotH, 'HAND-ROLLED (now % L) / L',     'var(--hand)');

  // verbal labels on each plot describing the failure / behavior
  const naiveFrozenLabel = S.svgEl('text', {
    x: pNaive.x + 8, y: pNaive.y + pNaive.h - 8,
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--scalar)', opacity: 0
  });
  naiveFrozenLabel.textContent = '↳ frozen at 1.0 after the first bar';
  pNaive.g.appendChild(naiveFrozenLabel);

  const handTearLabel = S.svgEl('text', {
    x: pHand.x + 8, y: pHand.y + pHand.h - 8,
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--hand)', opacity: 0.85
  });
  handTearLabel.textContent = '↳ vertical drop = discontinuity';
  pHand.g.appendChild(handTearLabel);

  // dashed verticals on the hand plot at every wrap (already-passed wraps)
  for (let k = 1; k < wrapsInPeriod; k++) {
    const wx = pHand.x + (k * barLen / period) * pHand.w;
    pHand.g.appendChild(S.svgEl('line', {
      x1: wx, y1: pHand.y + 2, x2: wx, y2: pHand.y + pHand.h - 2,
      stroke: 'var(--hand)', 'stroke-width': 0.8,
      'stroke-dasharray': '2 3', opacity: 0.45
    }));
  }

  // lifted (right) — square circular plot
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
  const liftCaption = S.svgEl('text', {
    x: liftCx, y: liftCy + liftSize/2 + 18,
    'text-anchor': 'middle',
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--vector)', opacity: 0.9
  });
  liftCaption.textContent = 'smooth past the seam — no discontinuity';
  lg.appendChild(liftCaption);

  // unit circle and axes
  const radius = liftSize / 2 - 14;
  lg.appendChild(S.svgEl('circle', {
    cx: liftCx, cy: liftCy, r: radius,
    fill: 'none', stroke: 'var(--rule-2)', 'stroke-dasharray': '2 4'
  }));
  lg.appendChild(S.svgEl('line', {
    x1: liftCx - liftSize/2 + 6, y1: liftCy, x2: liftCx + liftSize/2 - 6, y2: liftCy,
    stroke: 'var(--rule)'
  }));
  lg.appendChild(S.svgEl('line', {
    x1: liftCx, y1: liftCy - liftSize/2 + 6, x2: liftCx, y2: liftCy + liftSize/2 - 6,
    stroke: 'var(--rule)'
  }));

  // dynamic elements
  const naivePath = S.svgEl('path', {
    fill: 'none', stroke: 'var(--scalar)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round'
  });
  pNaive.g.appendChild(naivePath);
  const naiveDot = S.svgEl('circle', { r: 3.5, fill: 'var(--scalar)' });
  pNaive.g.appendChild(naiveDot);
  const naiveSeamPulse = S.svgEl('circle', {
    r: 9, fill: 'none', stroke: 'var(--scalar)', 'stroke-width': 1.5, opacity: 0
  });
  pNaive.g.appendChild(naiveSeamPulse);

  // hand uses a path with M/L so wraps are real gaps, not vertical segments
  const handPath = S.svgEl('path', {
    fill: 'none', stroke: 'var(--hand)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round'
  });
  pHand.g.appendChild(handPath);
  const handDot = S.svgEl('circle', { r: 3.5, fill: 'var(--hand)' });
  pHand.g.appendChild(handDot);
  const handSeamPulse = S.svgEl('circle', {
    r: 9, fill: 'none', stroke: 'var(--hand)', 'stroke-width': 1.5, opacity: 0
  });
  pHand.g.appendChild(handSeamPulse);

  const liftTrail = S.svgEl('polyline', {
    fill: 'none', stroke: 'var(--vector)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round'
  });
  lg.appendChild(liftTrail);
  const liftDot = S.svgEl('circle', { r: 4, fill: 'var(--vector)' });
  lg.appendChild(liftDot);
  const liftSeamPulse = S.svgEl('circle', {
    r: 10, fill: 'none', stroke: 'var(--vector)', 'stroke-width': 1.5, opacity: 0
  });
  lg.appendChild(liftSeamPulse);
  const liftSeamLabel = S.svgEl('text', {
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--vector)', opacity: 0, 'text-anchor': 'start'
  });
  liftSeamLabel.textContent = 'no jump';
  lg.appendChild(liftSeamLabel);

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
      <span class="name">hand-rolled <span class="sub">(now % L) / L</span></span>
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

  // history buffers — sized to cover the full period at 60fps with margin
  const HIST = 1500;
  const histNaive = [], histHand = [], histLift = [];
  let prevT = 0;
  let seamFlashStart = -10;       // wall-clock-ish (uses virtual t)
  const SEAM_FLASH_DURATION = 0.9; // virtual seconds the pulse lingers

  function px(t, pane) { return pane.x + (t / period) * pane.w; }
  function py(p, pane) { return pane.y + pane.h - p * (pane.h - 2) - 1; }

  function compute(t) {
    const naive = S.invlerp(t, 0, barLen);     // clamps → frozen at 1.0 after first bar
    const hand  = ((t % barLen) + barLen) % barLen / barLen; // sawtooth
    const ang = (t / barLen) * S.TAU;
    return { naive, hand, lx: Math.cos(ang), ly: Math.sin(ang), ang };
  }

  function buildHandPath(history) {
    // emit M at every wrap (sample whose v dropped sharply from previous)
    if (history.length === 0) return '';
    const cmds = [];
    for (let i = 0; i < history.length; i++) {
      const p = history[i];
      const x = px(p.t, pHand).toFixed(1);
      const y = py(p.v, pHand).toFixed(1);
      const wrap = i === 0 || (history[i - 1].v - p.v > 0.5) || p.t < history[i - 1].t;
      cmds.push(`${wrap ? 'M' : 'L'}${x},${y}`);
    }
    return cmds.join(' ');
  }

  function buildNaivePath(history) {
    if (history.length === 0) return '';
    const cmds = [];
    for (let i = 0; i < history.length; i++) {
      const p = history[i];
      const x = px(p.t, pNaive).toFixed(1);
      const y = py(p.v, pNaive).toFixed(1);
      const wrap = i === 0 || p.t < history[i - 1].t;
      cmds.push(`${wrap ? 'M' : 'L'}${x},${y}`);
    }
    return cmds.join(' ');
  }

  function render(t) {
    const r = compute(t);

    // detect seam crossing (wrap from end-of-bar to start-of-bar)
    const prevPhase = prevT % barLen;
    const curPhase = t % barLen;
    const crossedBarSeam = curPhase < prevPhase && (prevPhase > barLen * 0.5);
    if (crossedBarSeam) seamFlashStart = t;

    // playhead
    const phx = stripX + (t / period) * stripW;
    playhead.setAttribute('x', phx - 1.5);

    // history push (drop oldest if buffer full or if t wrapped to start of period)
    if (t < prevT) {
      histNaive.length = 0;
      histHand.length  = 0;
      histLift.length  = 0;
    }
    histNaive.push({ t, v: r.naive });
    histHand.push({ t, v: r.hand });
    histLift.push({ x: r.lx, y: r.ly });
    if (histNaive.length > HIST) histNaive.shift();
    if (histHand.length  > HIST) histHand.shift();
    if (histLift.length  > HIST) histLift.shift();

    // plots
    naivePath.setAttribute('d', buildNaivePath(histNaive));
    naiveDot.setAttribute('cx', px(t, pNaive));
    naiveDot.setAttribute('cy', py(r.naive, pNaive));

    handPath.setAttribute('d', buildHandPath(histHand));
    handDot.setAttribute('cx', px(t, pHand));
    handDot.setAttribute('cy', py(r.hand, pHand));

    const lPts = histLift.map(p =>
      `${(liftCx + p.x * radius).toFixed(1)},${(liftCy - p.y * radius).toFixed(1)}`);
    liftTrail.setAttribute('points', lPts.join(' '));
    const ldx = liftCx + r.lx * radius;
    const ldy = liftCy - r.ly * radius;
    liftDot.setAttribute('cx', ldx);
    liftDot.setAttribute('cy', ldy);

    // text readouts
    rNaive.textContent = S.fmt(r.naive, 3);
    rHand.textContent  = S.fmt(r.hand, 3);
    rLift.textContent  = `(${S.fmt(r.lx, 2)}, ${S.fmt(r.ly, 2)})`;

    // "frozen" label fades in once t > barLen
    naiveFrozenLabel.setAttribute('opacity', t > barLen ? 0.9 : 0);

    // seam flash — synchronized pulse on all three plots
    const sinceSeam = t - seamFlashStart;
    const flashOn = sinceSeam >= 0 && sinceSeam < SEAM_FLASH_DURATION;
    const fade = flashOn ? Math.max(0, 1 - sinceSeam / SEAM_FLASH_DURATION) : 0;
    naiveSeamPulse.setAttribute('opacity', fade);
    naiveSeamPulse.setAttribute('cx', px(t, pNaive));
    naiveSeamPulse.setAttribute('cy', py(r.naive, pNaive));
    naiveSeamPulse.setAttribute('r', 6 + (1 - fade) * 10);
    handSeamPulse.setAttribute('opacity', fade);
    handSeamPulse.setAttribute('cx', px(t, pHand));
    handSeamPulse.setAttribute('cy', py(r.hand, pHand));
    handSeamPulse.setAttribute('r', 6 + (1 - fade) * 10);
    liftSeamPulse.setAttribute('opacity', fade);
    liftSeamPulse.setAttribute('cx', ldx);
    liftSeamPulse.setAttribute('cy', ldy);
    liftSeamPulse.setAttribute('r', 6 + (1 - fade) * 10);
    liftSeamLabel.setAttribute('opacity', fade * 0.95);
    liftSeamLabel.setAttribute('x', ldx + 12);
    liftSeamLabel.setAttribute('y', ldy + 4);

    // flag rows during seam moment
    document.getElementById('s2-r-naive').classList.toggle('flagged', t > barLen + 0.05);
    document.getElementById('s2-r-hand').classList.toggle('flagged', flashOn);

    prevT = t;
  }

  // playhead driver — slowed so the seam moment is catchable
  const ph = S.makePlayhead({
    period, speed: 0.7,
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
