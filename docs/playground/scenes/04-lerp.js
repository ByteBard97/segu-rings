/* scene 04 — lerp / cross-fade between two loop positions
   Three answers to "halfway between two loop times":
     - naive lerp                 (cuts through interior)
     - hand-rolled split lerp     (works but magic constant, antipodal flicker)
     - lifted slerp on circle     (always short arc)
*/
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-04-demo');
  if (!root) return;

  const W = 520, H = 380;
  const L = 8;
  const cx = W / 2, cy = H / 2 + 4;
  const R = 130;

  root.innerHTML = `
    <h3>loop = ${L}s · drag the endpoints, sweep t</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <g id="s4-ring"></g>
      </svg>
    </div>
    <div class="scrubrow">
      <span class="label">a</span>
      <input type="range" min="0" max="800" value="780" id="s4-a" />
      <output id="s4-a-out">7.80s</output>
    </div>
    <div class="scrubrow">
      <span class="label">b</span>
      <input type="range" min="0" max="800" value="20" id="s4-b" />
      <output id="s4-b-out">0.20s</output>
    </div>
    <div class="scrubrow">
      <span class="label">t</span>
      <input type="range" min="0" max="100" value="50" id="s4-t" />
      <output id="s4-t-out">0.50</output>
    </div>
    <div class="readouts" id="s4-readouts"></div>
  `;

  const ring = root.querySelector('#s4-ring');

  // base ring
  ring.appendChild(S.svgEl('circle', {
    cx, cy, r: R, fill: 'none', stroke: 'var(--rule-2)', 'stroke-width': 2
  }));
  // seam
  ring.appendChild(S.svgEl('line', {
    x1: cx, y1: cy - R - 8, x2: cx, y2: cy - R + 8,
    stroke: 'var(--ink-3)', 'stroke-width': 1.5
  }));
  ring.appendChild(S.svgEl('text', {
    x: cx, y: cy - R - 14,
    'text-anchor': 'middle',
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--ink-4)', 'letter-spacing': '0.16em'
  })).textContent = 'SEAM · 0/8';

  // beat ticks
  for (let i = 0; i < L; i++) {
    const ang = (i / L) * S.TAU - Math.PI / 2;
    ring.appendChild(S.svgEl('line', {
      x1: cx + Math.cos(ang) * (R - 4),
      y1: cy + Math.sin(ang) * (R - 4),
      x2: cx + Math.cos(ang) * (R + 4),
      y2: cy + Math.sin(ang) * (R + 4),
      stroke: 'var(--rule)'
    }));
  }

  // naive line (a -> b through interior) and naive midpoint
  const naiveLine = S.svgEl('line', {
    stroke: 'var(--scalar)', 'stroke-width': 1, 'stroke-dasharray': '3 3'
  });
  ring.appendChild(naiveLine);

  // hand split-arc indicator (renders only at antipodal flicker)
  const handArc = S.svgEl('path', {
    fill: 'none', stroke: 'var(--hand)', 'stroke-width': 5, 'stroke-linecap': 'round',
    opacity: 0.55
  });
  ring.appendChild(handArc);

  // lifted short arc
  const liftedArc = S.svgEl('path', {
    fill: 'none', stroke: 'var(--vector)', 'stroke-width': 5, 'stroke-linecap': 'round',
    opacity: 0.85
  });
  ring.appendChild(liftedArc);

  // endpoint markers
  const aMark = S.svgEl('circle', { r: 8, fill: 'var(--ink-2)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(aMark);
  const bMark = S.svgEl('circle', { r: 8, fill: 'var(--ink-2)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(bMark);
  const aLab = S.svgEl('text', { 'font-family': 'var(--sans)', 'font-size': 10, fill: 'var(--ink-3)', 'text-anchor': 'middle' });
  aLab.textContent = 'a'; ring.appendChild(aLab);
  const bLab = S.svgEl('text', { 'font-family': 'var(--sans)', 'font-size': 10, fill: 'var(--ink-3)', 'text-anchor': 'middle' });
  bLab.textContent = 'b'; ring.appendChild(bLab);

  // three indicator markers
  const naiveDot = S.svgEl('circle', { r: 6, fill: 'var(--scalar)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(naiveDot);
  const handDot = S.svgEl('rect', { x: -5, y: -5, width: 10, height: 10, fill: 'var(--hand)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(handDot);
  const liftDot = S.svgEl('g');
  liftDot.appendChild(S.svgEl('rect', { x: -6, y: -6, width: 12, height: 12, transform: 'rotate(45)', fill: 'var(--vector)', stroke: 'var(--bg)', 'stroke-width': 2 }));
  ring.appendChild(liftDot);

  function timeToPos(t) {
    const a = (t / L) * S.TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a };
  }
  function timeToLabel(t, off = 18) {
    const a = (t / L) * S.TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * (R + off), y: cy + Math.sin(a) * (R + off) + 3 };
  }

  function arcSweep(t1, t2) {
    const a1 = (t1 / L) * S.TAU - Math.PI / 2;
    let a2 = (t2 / L) * S.TAU - Math.PI / 2;
    let sweep = a2 - a1;
    while (sweep > Math.PI) sweep -= S.TAU;
    while (sweep <= -Math.PI) sweep += S.TAU;
    const x1 = cx + Math.cos(a1) * R;
    const y1 = cy + Math.sin(a1) * R;
    const x2 = cx + Math.cos(a1 + sweep) * R;
    const y2 = cy + Math.sin(a1 + sweep) * R;
    const sweepFlag = sweep > 0 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 0 ${sweepFlag} ${x2} ${y2}`;
  }

  // readouts
  const readouts = root.querySelector('#s4-readouts');
  readouts.innerHTML = `
    <div class="row" id="s4-r-naive">
      <span class="swatch scalar"></span>
      <span class="name">naive lerp <span class="sub">(1−t)·a + t·b</span></span>
      <span class="val">0.00s</span>
    </div>
    <div class="row" id="s4-r-hand">
      <span class="swatch hand"></span>
      <span class="name">hand-rolled <span class="sub">if |b−a|&gt;L/2 wrap</span></span>
      <span class="val">0.00s</span>
    </div>
    <div class="row" id="s4-r-lift">
      <span class="swatch vector"></span>
      <span class="name">lifted slerp <span class="sub">atan2 of lerped vectors</span></span>
      <span class="val">0.00s</span>
    </div>
  `;

  // helpers
  const aSlider = root.querySelector('#s4-a');
  const bSlider = root.querySelector('#s4-b');
  const tSlider = root.querySelector('#s4-t');
  const aOut = root.querySelector('#s4-a-out');
  const bOut = root.querySelector('#s4-b-out');
  const tOut = root.querySelector('#s4-t-out');

  function update() {
    const a = (+aSlider.value) / 100;
    const b = (+bSlider.value) / 100;
    const t = (+tSlider.value) / 100;
    aOut.textContent = `${a.toFixed(2)}s`;
    bOut.textContent = `${b.toFixed(2)}s`;
    tOut.textContent = t.toFixed(2);

    // ---- naive lerp on the scalar value ----
    const naiveScalar = a * (1 - t) + b * t;
    // place naive marker by mapping that scalar to ring position (so it visibly lands on the wrong side)
    const pn = timeToPos(((naiveScalar % L) + L) % L);
    naiveDot.setAttribute('cx', pn.x);
    naiveDot.setAttribute('cy', pn.y);

    // also draw the naive chord (straight line a -> b through interior)
    const pa = timeToPos(a), pb = timeToPos(b);
    naiveLine.setAttribute('x1', pa.x);
    naiveLine.setAttribute('y1', pa.y);
    naiveLine.setAttribute('x2', pb.x);
    naiveLine.setAttribute('y2', pb.y);

    // ---- hand-rolled split lerp ----
    let handScalar;
    const diff = b - a;
    if (Math.abs(diff) > L / 2) {
      // cross seam — adjust b by ±L
      const bAdj = b + (diff > 0 ? -L : L);
      handScalar = a * (1 - t) + bAdj * t;
      handScalar = ((handScalar % L) + L) % L;
    } else {
      handScalar = a * (1 - t) + b * t;
    }
    // antipodal flicker — when |diff| ≈ L/2 ± small, randomize the branch slightly
    const antipodalDelta = Math.abs(Math.abs(diff) - L / 2);
    if (antipodalDelta < 0.05) {
      // flicker: every 100ms toggle which branch we picked
      const tick = Math.floor(performance.now() / 120) % 2;
      if (tick) handScalar = ((handScalar + L/2) % L);
    }
    const ph = timeToPos(handScalar);
    handDot.setAttribute('transform', `translate(${ph.x} ${ph.y})`);

    // ---- lifted slerp ----
    const aa = (a / L) * S.TAU;
    const ab = (b / L) * S.TAU;
    const ax = Math.cos(aa), ay = Math.sin(aa);
    const bx = Math.cos(ab), by = Math.sin(ab);
    const lx = ax * (1 - t) + bx * t;
    const ly = ay * (1 - t) + by * t;
    let liftedAng = Math.atan2(ly, lx);
    if (liftedAng < 0) liftedAng += S.TAU;
    const liftedScalar = (liftedAng / S.TAU) * L;
    const pl = timeToPos(liftedScalar);
    liftDot.setAttribute('transform', `translate(${pl.x} ${pl.y})`);

    // arc visualizations
    liftedArc.setAttribute('d', arcSweep(a, b)); // short arc
    // hand version: when seam-crossing, also draws the same short arc but with split visible
    handArc.setAttribute('opacity', antipodalDelta < 0.05 ? 0.55 : 0);
    handArc.setAttribute('d', arcSweep(a, b));

    // endpoint marker positions
    aMark.setAttribute('cx', pa.x); aMark.setAttribute('cy', pa.y);
    bMark.setAttribute('cx', pb.x); bMark.setAttribute('cy', pb.y);
    const la = timeToLabel(a), lb = timeToLabel(b);
    aLab.setAttribute('x', la.x); aLab.setAttribute('y', la.y);
    bLab.setAttribute('x', lb.x); bLab.setAttribute('y', lb.y);

    // readouts
    document.getElementById('s4-r-naive').querySelector('.val').textContent = `${S.fmt(naiveScalar, 2)}s`;
    document.getElementById('s4-r-hand').querySelector('.val').textContent  = `${S.fmt(handScalar, 2)}s`;
    document.getElementById('s4-r-lift').querySelector('.val').textContent  = `${S.fmt(liftedScalar, 2)}s`;

    // flag broken
    const seamCrossing = Math.abs(diff) > L / 2;
    document.getElementById('s4-r-naive').classList.toggle('flagged', seamCrossing);
    document.getElementById('s4-r-hand').classList.toggle('flagged', antipodalDelta < 0.05);
  }

  aSlider.addEventListener('input', update);
  bSlider.addEventListener('input', update);
  tSlider.addEventListener('input', update);
  // animate (for antipodal flicker)
  setInterval(update, 80);
  update();
})();
