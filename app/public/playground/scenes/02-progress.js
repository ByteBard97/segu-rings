/* scene 02 — the playhead snaps
   The real bug in the alpha jams: you write (now % barLen) / barLen.
   It gives a clean sawtooth that *looks* correct. But drive any smooth
   animation with it — a playhead, a knob, a fade — and it snaps at the wrap.

   Three views:
     - mini playhead strip driven by modulo — dot teleports at every seam
     - the sawtooth itself — the math that causes the snap
     - lifted: point on the unit circle — smooth, no teleport
*/
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-02-demo');
  if (!root) return;

  const W = 520, H = 670;
  const barLen = 4;             // 4-second bar
  const period = barLen * 3;    // observe three bars so we see multiple wraps

  // build SVG
  root.innerHTML = `
    <h3>one bar, looped 3× · ${barLen}s</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <g id="s2-timeline"></g>
        <g id="s2-playhead"></g>
        <g id="s2-interp"></g>
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

  // ---- timeline strip (shows 3 bars with wraps) ----
  const stripX = 14, stripY = 12, stripW = W - 28, stripH = 18;
  const tl = root.querySelector('#s2-timeline');
  tl.appendChild(S.svgEl('rect', {
    x: stripX, y: stripY, width: stripW, height: stripH, rx: 3,
    fill: 'var(--wood-2)', stroke: 'var(--wood-line)'
  }));
  const wrapsInPeriod = Math.round(period / barLen);
  for (let k = 1; k < wrapsInPeriod; k++) {
    const wx = stripX + (k * barLen / period) * stripW;
    const wrapLine = S.svgEl('line', {
      x1: wx, y1: stripY - 4, x2: wx, y2: stripY + stripH + 4,
      stroke: 'var(--rule-2)', 'stroke-dasharray': '2 3'
    });
    wrapLine.appendChild(S.svgEl('title')).textContent = 'Bar boundary — the loop wraps here';
    tl.appendChild(wrapLine);
    const wrapLabel = S.svgEl('text', {
      x: wx, y: stripY - 7, 'text-anchor': 'middle',
      'font-family': 'var(--sans)', 'font-size': 9,
      fill: 'var(--ink-4)', 'letter-spacing': '0.14em'
    });
    wrapLabel.textContent = 'BAR WRAP';
    wrapLabel.appendChild(S.svgEl('title')).textContent = 'Bar boundary — the loop wraps here';
    tl.appendChild(wrapLabel);
  }
  for (let k = 0; k < wrapsInPeriod; k++) {
    for (let i = 0; i < 4; i++) {
      const tBeat = k * barLen + (i + 0.5) * (barLen / 4);
      const x = stripX + (tBeat / period) * stripW;
      const beatDot = S.svgEl('circle', {
        cx: x, cy: stripY + stripH / 2, r: 2,
        fill: 'var(--fret-dot)'
      });
      beatDot.appendChild(S.svgEl('title')).textContent = `Beat ${i + 1} of bar ${k + 1}`;
      tl.appendChild(beatDot);
    }
  }
  const playhead = S.svgEl('rect', {
    x: stripX, y: stripY - 2, width: 3, height: stripH + 4, rx: 1,
    fill: 'var(--hand)'
  });
  playhead.appendChild(S.svgEl('title')).textContent = 'Current position in the 3-bar timeline';
  tl.appendChild(playhead);

  // ---- mini playhead strip (driven by modulo — snaps at wrap) ----
  const miniY = 34, miniH = 26;
  const phg = root.querySelector('#s2-playhead');
  phg.appendChild(S.svgEl('rect', {
    x: stripX, y: miniY, width: stripW, height: miniH, rx: 3,
    fill: 'var(--bg-2)', stroke: 'var(--rule)'
  }));
  // beat dots inside the mini strip (one bar's worth, repeated visually)
  for (let i = 0; i < 4; i++) {
    const x = stripX + (i + 0.5) * (stripW / 4);
    phg.appendChild(S.svgEl('circle', {
      cx: x, cy: miniY + miniH / 2, r: 2.5,
      fill: 'var(--fret-dot)'
    }));
  }
  const miniDot = S.svgEl('circle', {
    r: 4, fill: 'var(--hand)'
  });
  miniDot.appendChild(S.svgEl('title')).textContent = 'Current position in bar (snaps at wrap)';
  phg.appendChild(miniDot);
  const miniSnapPulse = S.svgEl('circle', {
    r: 10, fill: 'none', stroke: 'var(--hand)', 'stroke-width': 1.5, opacity: 0
  });
  phg.appendChild(miniSnapPulse);

  // ---- interpolation strip (static: line vs circle midpoint) ----
  const interpY = 66, interpH = 22;
  const ig = root.querySelector('#s2-interp');
  ig.appendChild(S.svgEl('rect', {
    x: stripX, y: interpY, width: stripW, height: interpH, rx: 3,
    fill: 'var(--bg-2)', stroke: 'var(--rule)'
  }));
  // fixed endpoints A=3.5 and B=0.5, midpoint at t=0.5
  const iA = 3.5, iB = 0.5;
  const iAx = stripX + (iA / barLen) * stripW;
  const iBx = stripX + (iB / barLen) * stripW;
  // line midpoint: (3.5 + 0.5) / 2 = 2.0 — opposite side
  const lineMidVal = (iA + iB) / 2;
  const lineMidX = stripX + (lineMidVal / barLen) * stripW;
  // circle midpoint: slerp(3.5, 0.5, 0.5) = 0.0 — the seam
  const aAng = (iA / barLen) * S.TAU;
  const bAng = (iB / barLen) * S.TAU;
  const diff = S.shortestAngle(aAng, bAng);
  const circleMidAng = aAng + diff * 0.5;
  const circleMidVal = ((circleMidAng / S.TAU) * barLen + barLen) % barLen;
  const circleMidX = stripX + (circleMidVal / barLen) * stripW;

  const iADot = S.svgEl('circle', { cx: iAx, cy: interpY + interpH / 2, r: 3.5, fill: 'var(--hand)' });
  iADot.appendChild(S.svgEl('title')).textContent = 'Beat A (3.5s)';
  const iBDot = S.svgEl('circle', { cx: iBx, cy: interpY + interpH / 2, r: 3.5, fill: 'var(--hand)' });
  iBDot.appendChild(S.svgEl('title')).textContent = 'Beat B (0.5s)';
  const iLineMid = S.svgEl('circle', { cx: lineMidX, cy: interpY + interpH / 2, r: 4, fill: 'var(--scalar)' });
  iLineMid.appendChild(S.svgEl('title')).textContent = 'Line midpoint = 2.0s (opposite side)';
  const iCircleMid = S.svgEl('circle', { cx: circleMidX, cy: interpY + interpH / 2, r: 4, fill: 'var(--vector)' });
  iCircleMid.appendChild(S.svgEl('title')).textContent = 'Circle midpoint = 0.0s (the seam)';
  // dashed connectors
  const iLineConn = S.svgEl('line', {
    x1: iAx, y1: interpY + interpH / 2, x2: lineMidX, y2: interpY + interpH / 2,
    stroke: 'var(--scalar)', 'stroke-width': 1, opacity: 0.4, 'stroke-dasharray': '3 3'
  });
  const iCircleConn = S.svgEl('line', {
    x1: iAx, y1: interpY + interpH / 2, x2: circleMidX, y2: interpY + interpH / 2,
    stroke: 'var(--vector)', 'stroke-width': 1, opacity: 0.4, 'stroke-dasharray': '3 3'
  });
  [iADot, iBDot, iLineConn, iCircleConn, iLineMid, iCircleMid].forEach(x => ig.appendChild(x));

  // ---- hand-rolled sawtooth plot ----
  const pane = (id, x, y, w, h) => {
    const g = root.querySelector('#' + id);
    g.appendChild(S.svgEl('rect', { x, y, width: w, height: h, rx: 3, fill: 'var(--bg)', stroke: 'var(--rule)' }));
    g.appendChild(S.svgEl('line', { x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: 'var(--rule)' }));
    g.appendChild(S.svgEl('line', { x1: x, y1: y, x2: x + w, y2: y, stroke: 'var(--rule)' }));
    return { g, x, y, w, h };
  };

  const plotW = 492, plotH = 48;
  const pHand = pane('s2-plot-hand', 14, 96, plotW, plotH);

  // dashed verticals on the hand plot at every wrap
  for (let k = 1; k < wrapsInPeriod; k++) {
    const wx = pHand.x + (k * barLen / period) * pHand.w;
    pHand.g.appendChild(S.svgEl('line', {
      x1: wx, y1: pHand.y + 2, x2: wx, y2: pHand.y + pHand.h - 2,
      stroke: 'var(--hand)', 'stroke-width': 0.8,
      'stroke-dasharray': '2 3', opacity: 0.45
    }));
  }

  // axis labels
  pHand.g.appendChild(S.svgEl('text', {
    x: pHand.x + pHand.w - 6, y: pHand.y + 11,
    'font-family': 'var(--mono)', 'font-size': 9,
    fill: 'var(--ink-4)', 'text-anchor': 'end'
  })).textContent = '1.0';
  pHand.g.appendChild(S.svgEl('text', {
    x: pHand.x + pHand.w - 6, y: pHand.y + pHand.h - 4,
    'font-family': 'var(--mono)', 'font-size': 9,
    fill: 'var(--ink-4)', 'text-anchor': 'end'
  })).textContent = '0.0';

  // tear label below hand plot
  const handTearLabel = S.svgEl('text', {
    x: pHand.x + 8, y: pHand.y + pHand.h + 22,
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--hand)', opacity: 0.85
  });
  handTearLabel.textContent = '↳ vertical drop = discontinuity';
  pHand.g.appendChild(handTearLabel);

  // lifted — circular plot
  const liftSize = 460;
  const liftCx = W / 2;
  const liftCy = 410;
  const lg = root.querySelector('#s2-plot-lift');
  lg.appendChild(S.svgEl('rect', {
    x: liftCx - liftSize/2 - 4, y: liftCy - liftSize/2 - 4,
    width: liftSize + 8, height: liftSize + 8, rx: 3,
    fill: 'var(--bg)', stroke: 'var(--rule)'
  }));

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

  // angle ticks
  const tickLen = 5;
  lg.appendChild(S.svgEl('line', { x1: liftCx + radius, y1: liftCy, x2: liftCx + radius + tickLen, y2: liftCy, stroke: 'var(--ink-3)', 'stroke-width': 1 }));
  lg.appendChild(S.svgEl('line', { x1: liftCx, y1: liftCy - radius, x2: liftCx, y2: liftCy - radius - tickLen, stroke: 'var(--ink-3)', 'stroke-width': 1 }));
  lg.appendChild(S.svgEl('line', { x1: liftCx - radius, y1: liftCy, x2: liftCx - radius - tickLen, y2: liftCy, stroke: 'var(--ink-3)', 'stroke-width': 1 }));
  lg.appendChild(S.svgEl('line', { x1: liftCx, y1: liftCy + radius, x2: liftCx, y2: liftCy + radius + tickLen, stroke: 'var(--ink-3)', 'stroke-width': 1 }));
  const idxG = S.svgEl('g', { 'font-family': 'var(--sans)', 'font-size': 8, fill: 'var(--ink-3)' });
  idxG.appendChild(S.svgEl('text', { x: liftCx + radius + tickLen + 10, y: liftCy, 'dominant-baseline': 'central' })).textContent = '0';
  idxG.appendChild(S.svgEl('text', { x: liftCx, y: liftCy - radius - tickLen - 10, 'text-anchor': 'middle' })).textContent = 'π/2';
  idxG.appendChild(S.svgEl('text', { x: liftCx - radius - tickLen - 10, y: liftCy, 'text-anchor': 'end', 'dominant-baseline': 'central' })).textContent = 'π';
  idxG.appendChild(S.svgEl('text', { x: liftCx, y: liftCy + radius + tickLen + 14, 'text-anchor': 'middle' })).textContent = '3π/2';
  lg.appendChild(idxG);

  // ---- animation elements ----
  const handPath = S.svgEl('path', {
    fill: 'none', stroke: 'var(--hand)', 'stroke-width': 1.5,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round'
  });
  pHand.g.appendChild(handPath);
  const handDot = S.svgEl('circle', { r: 3.5, fill: 'var(--hand)' });
  handDot.appendChild(S.svgEl('title')).textContent = 'Sawtooth progress value';
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
  liftDot.appendChild(S.svgEl('title')).textContent = 'Orbiting progress on the unit circle';
  lg.appendChild(liftDot);
  const liftSeamPulse = S.svgEl('circle', {
    r: 10, fill: 'none', stroke: 'var(--vector)', 'stroke-width': 1.5, opacity: 0
  });
  lg.appendChild(liftSeamPulse);

  const liftCaption = S.svgEl('text', {
    x: liftCx, y: liftCy + liftSize/2 + 18,
    'text-anchor': 'middle',
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--ink-2)', opacity: 0.9
  });
  liftCaption.textContent = 'smooth past the seam — no discontinuity';
  lg.appendChild(liftCaption);

  const liftSeamLabel = S.svgEl('text', {
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--ink-2)', opacity: 0, 'text-anchor': 'start'
  });
  liftSeamLabel.textContent = 'no jump';
  lg.appendChild(liftSeamLabel);

  const liftMeasureLabel = S.svgEl('text', {
    'font-family': 'var(--sans)', 'font-size': 9,
    fill: 'var(--vector)', 'text-anchor': 'middle', 'dominant-baseline': 'central',
    'font-weight': '600'
  });
  liftMeasureLabel.textContent = '1';
  lg.appendChild(liftMeasureLabel);

  // readouts
  const readouts = root.querySelector('#s2-readouts');
  readouts.innerHTML = `
    <div class="row" id="s2-r-hand">
      <span class="swatch hand"></span>
      <span class="name">sawtooth <span class="sub">(now % L) / L</span></span>
      <span class="val">0.00</span>
    </div>
    <div class="row" id="s2-r-lift">
      <span class="swatch vector"></span>
      <span class="name">lifted <span class="sub">(cos 2π·now/L, sin 2π·now/L)</span></span>
      <span class="val">(1.00, 0.00)</span>
    </div>
  `;
  const rHand  = readouts.querySelector('#s2-r-hand .val');
  const rLift  = readouts.querySelector('#s2-r-lift .val');

  // history buffers
  const HIST = 1500;
  const histHand = [], histLift = [];
  let prevT = 0;
  let seamFlashStart = -10;
  const SEAM_FLASH_DURATION = 0.9;

  function px(t, pane) { return pane.x + (t / period) * pane.w; }
  function py(p, pane) { return pane.y + pane.h - p * (pane.h - 2) - 1; }

  function compute(t) {
    const phase = t % barLen;
    const hand  = ((phase) + barLen) % barLen / barLen;
    const ang = (t / barLen) * S.TAU;
    return { phase, hand, lx: Math.cos(ang), ly: Math.sin(ang), ang };
  }

  function buildHandPath(history) {
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

  function render(t) {
    const r = compute(t);

    const prevPhase = prevT % barLen;
    const curPhase = t % barLen;
    const crossedBarSeam = curPhase < prevPhase && (prevPhase > barLen * 0.5);
    if (crossedBarSeam) seamFlashStart = t;

    // timeline playhead
    const phx = stripX + (t / period) * stripW;
    playhead.setAttribute('x', phx - 1.5);

    // mini playhead dot — snaps at wrap because phase resets
    const miniDotX = stripX + (r.phase / barLen) * stripW;
    miniDot.setAttribute('cx', miniDotX);
    miniDot.setAttribute('cy', miniY + miniH / 2);

    // history push
    if (t < prevT) {
      histHand.length  = 0;
      histLift.length  = 0;
    }
    histHand.push({ t, v: r.hand });
    histLift.push({ x: r.lx, y: r.ly });
    if (histHand.length  > HIST) histHand.shift();
    if (histLift.length  > HIST) histLift.shift();

    // sawtooth plot
    handPath.setAttribute('d', buildHandPath(histHand));
    handDot.setAttribute('cx', px(t, pHand));
    handDot.setAttribute('cy', py(r.hand, pHand));

    // lifted circle
    const lPts = histLift.map(p =>
      `${(liftCx + p.x * radius).toFixed(1)},${(liftCy - p.y * radius).toFixed(1)}`);
    liftTrail.setAttribute('points', lPts.join(' '));
    const ldx = liftCx + r.lx * radius;
    const ldy = liftCy - r.ly * radius;
    liftDot.setAttribute('cx', ldx);
    liftDot.setAttribute('cy', ldy);

    // text readouts
    rHand.textContent  = S.fmt(r.hand, 3);
    rLift.textContent  = `(${S.fmt(r.lx, 2)}, ${S.fmt(r.ly, 2)})`;

    // seam flash — synchronized pulse on all three visuals
    const sinceSeam = t - seamFlashStart;
    const flashOn = sinceSeam >= 0 && sinceSeam < SEAM_FLASH_DURATION;
    const fade = flashOn ? Math.max(0, 1 - sinceSeam / SEAM_FLASH_DURATION) : 0;

    miniSnapPulse.setAttribute('opacity', fade);
    miniSnapPulse.setAttribute('cx', miniDotX);
    miniSnapPulse.setAttribute('cy', miniY + miniH / 2);
    miniSnapPulse.setAttribute('r', 6 + (1 - fade) * 12);

    handSeamPulse.setAttribute('opacity', fade);
    handSeamPulse.setAttribute('cx', px(t, pHand));
    handSeamPulse.setAttribute('cy', py(r.hand, pHand));
    handSeamPulse.setAttribute('r', 6 + (1 - fade) * 10);

    liftSeamPulse.setAttribute('opacity', fade);
    liftSeamPulse.setAttribute('cx', ldx);
    liftSeamPulse.setAttribute('cy', ldy);
    liftSeamPulse.setAttribute('r', 6 + (1 - fade) * 10);
    liftSeamLabel.setAttribute('opacity', fade * 0.95);
    liftSeamLabel.setAttribute('x', ldx + 18);
    liftSeamLabel.setAttribute('y', ldy + 18);

    // measure counter
    const measure = Math.floor(t / barLen) + 1;
    const mlOffset = 12;
    liftMeasureLabel.textContent = String(measure);
    liftMeasureLabel.setAttribute('x', ldx + r.lx * mlOffset);
    liftMeasureLabel.setAttribute('y', ldy - r.ly * mlOffset);

    // flag row during seam moment
    document.getElementById('s2-r-hand').classList.toggle('flagged', flashOn);

    prevT = t;
  }

  // playhead driver
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

  // instant tooltips — read <title> text, show in styled div
  const tooltip = document.createElement('div');
  tooltip.className = 's2-tooltip';
  document.body.appendChild(tooltip);
  const svg = root.querySelector('svg');
  svg.querySelectorAll('*').forEach(el => {
    const title = Array.from(el.children).find(c => c.tagName.toLowerCase() === 'title');
    if (!title) return;
    el.style.cursor = 'help';
    el.addEventListener('mouseenter', () => {
      tooltip.textContent = title.textContent;
      tooltip.classList.add('visible');
    });
    el.addEventListener('mousemove', (e) => {
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY + 12) + 'px';
    });
    el.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
})();
