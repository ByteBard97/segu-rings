/* scene 03 — distance to next chord
   Three answers to "how far to the next chord on the loop?":
     - naive subtraction      (negative across seam)
     - double-modulo forward  (always positive but goes the long way)
     - lifted arc distance    (always shortest, signed)
*/
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-03-demo');
  if (!root) return;

  const W = 520, H = 380;
  const L = 8; // loop length, seconds
  const cx = W / 2, cy = H / 2 + 4;
  const R = 130;

  root.innerHTML = `
    <h3>loop = ${L}s · drag the chord around the ring</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <g id="s3-ring"></g>
      </svg>
    </div>
    <div class="scrubrow">
      <span class="label">now</span>
      <input type="range" min="0" max="800" value="200" id="s3-now" />
      <output id="s3-now-out">2.00s</output>
    </div>
    <div class="scrubrow">
      <span class="label">next chord</span>
      <input type="range" min="0" max="800" value="180" id="s3-next" />
      <output id="s3-next-out">1.80s</output>
    </div>
    <div class="readouts" id="s3-readouts"></div>
  `;

  const ring = root.querySelector('#s3-ring');

  // ring (loop)
  ring.appendChild(S.svgEl('circle', {
    cx, cy, r: R, fill: 'none', stroke: 'var(--rule-2)', 'stroke-width': 2
  }));
  // seam mark (12 o'clock)
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

  // beat tick marks
  for (let i = 0; i < L; i++) {
    const ang = (i / L) * S.TAU - Math.PI / 2;
    const x1 = cx + Math.cos(ang) * (R - 6);
    const y1 = cy + Math.sin(ang) * (R - 6);
    const x2 = cx + Math.cos(ang) * (R + 6);
    const y2 = cy + Math.sin(ang) * (R + 6);
    ring.appendChild(S.svgEl('line', {
      x1, y1, x2, y2, stroke: 'var(--rule)', 'stroke-width': 1
    }));
  }

  // long-way arc indicator (drawn under markers)
  const longArc = S.svgEl('path', {
    d: '', fill: 'none', stroke: 'var(--scalar)', 'stroke-width': 6,
    'stroke-linecap': 'round', opacity: 0.35
  });
  ring.appendChild(longArc);
  const shortArc = S.svgEl('path', {
    d: '', fill: 'none', stroke: 'var(--vector)', 'stroke-width': 6,
    'stroke-linecap': 'round', opacity: 0.7
  });
  ring.appendChild(shortArc);

  // markers
  const nowMark = S.svgEl('g');
  nowMark.appendChild(S.svgEl('circle', { r: 9, fill: 'var(--hand)', stroke: 'var(--bg)', 'stroke-width': 2 }));
  nowMark.appendChild(S.svgEl('circle', { r: 3, fill: 'var(--bg)' }));
  ring.appendChild(nowMark);
  const nowLabelG = S.svgEl('g');
  nowLabelG.appendChild(S.svgEl('rect', {
    x: -16, y: -10, width: 32, height: 20, rx: 4,
    fill: 'var(--bg-2)', stroke: 'none'
  }));
  const nowLabel = S.svgEl('text', {
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--hand)', 'text-anchor': 'middle', 'letter-spacing': '0.1em',
    'dominant-baseline': 'central'
  });
  nowLabel.textContent = 'now';
  nowLabelG.appendChild(nowLabel);
  ring.appendChild(nowLabelG);

  const nextMark = S.svgEl('g');
  // diamond
  nextMark.appendChild(S.svgEl('rect', {
    x: -8, y: -8, width: 16, height: 16, transform: 'rotate(45)',
    fill: 'var(--vector)', stroke: 'var(--bg)', 'stroke-width': 2
  }));
  ring.appendChild(nextMark);
  const nextLabelG = S.svgEl('g');
  nextLabelG.appendChild(S.svgEl('rect', {
    x: -38, y: -10, width: 76, height: 20, rx: 4,
    fill: 'var(--bg-2)', stroke: 'none'
  }));
  const nextLabel = S.svgEl('text', {
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--vector)', 'text-anchor': 'middle', 'letter-spacing': '0.1em',
    'dominant-baseline': 'central'
  });
  nextLabel.textContent = 'next chord';
  nextLabelG.appendChild(nextLabel);
  ring.appendChild(nextLabelG);

  // center readout
  const centerVal = S.svgEl('text', {
    x: cx, y: cy - 4,
    'text-anchor': 'middle',
    'font-family': 'var(--mono)', 'font-size': 22,
    fill: 'var(--ink)', 'font-weight': 600
  });
  ring.appendChild(centerVal);
  const centerLab = S.svgEl('text', {
    x: cx, y: cy + 16,
    'text-anchor': 'middle',
    'font-family': 'var(--sans)', 'font-size': 10,
    fill: 'var(--ink-4)', 'letter-spacing': '0.16em'
  });
  centerLab.textContent = 'SHORTEST DISTANCE';
  ring.appendChild(centerLab);

  // readouts
  const readouts = root.querySelector('#s3-readouts');
  readouts.innerHTML = `
    <div class="row" id="s3-r-naive">
      <span class="swatch scalar"></span>
      <span class="name">naive subtraction <span class="sub">next − now</span></span>
      <span class="val">0.00</span>
    </div>
    <div class="row" id="s3-r-hand">
      <span class="swatch hand"></span>
      <span class="name">double-modulo <span class="sub">((b−a)%L+L)%L</span></span>
      <span class="val">0.00</span>
    </div>
    <div class="row" id="s3-r-lift">
      <span class="swatch vector"></span>
      <span class="name">lifted arc <span class="sub">atan2(cross, dot) · L / 2π</span></span>
      <span class="val">0.00</span>
    </div>
  `;

  // arc helpers
  function arcPath(t1, t2, dir) {
    // dir: +1 forward (counterclockwise on screen — we use clockwise mapping)
    // We map t -> angle = (t/L)*TAU - PI/2 (12 o'clock = 0)
    // Need an SVG arc from t1 to t2 going either short or long way.
    const a1 = (t1 / L) * S.TAU - Math.PI / 2;
    let a2 = (t2 / L) * S.TAU - Math.PI / 2;
    // unwrap to make absolute sweep
    let sweep = a2 - a1;
    if (dir === 'short') {
      while (sweep > Math.PI) sweep -= S.TAU;
      while (sweep <= -Math.PI) sweep += S.TAU;
    } else if (dir === 'long') {
      // long way = the other way around
      let sShort = sweep;
      while (sShort > Math.PI) sShort -= S.TAU;
      while (sShort <= -Math.PI) sShort += S.TAU;
      sweep = sShort > 0 ? sShort - S.TAU : sShort + S.TAU;
    } else if (dir === 'forward') {
      // forward = ccw from a1 (positive sweep)
      sweep = ((sweep % S.TAU) + S.TAU) % S.TAU;
    }
    const x1 = cx + Math.cos(a1) * R;
    const y1 = cy + Math.sin(a1) * R;
    const x2 = cx + Math.cos(a1 + sweep) * R;
    const y2 = cy + Math.sin(a1 + sweep) * R;
    const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
    const sweepFlag = sweep > 0 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} ${sweepFlag} ${x2} ${y2}`;
  }

  function pos(t) {
    const a = (t / L) * S.TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a };
  }
  function labelPos(t, off = 34) {
    const a = (t / L) * S.TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * (R + off), y: cy + Math.sin(a) * (R + off) + 3 };
  }

  function render(now, next) {
    const pn = pos(now), pc = pos(next);
    nowMark.setAttribute('transform', `translate(${pn.x} ${pn.y})`);
    nextMark.setAttribute('transform', `translate(${pc.x} ${pc.y})`);
    const ln = labelPos(now), lc = labelPos(next);
    nowLabelG.setAttribute('transform', `translate(${ln.x} ${ln.y})`);
    nextLabelG.setAttribute('transform', `translate(${lc.x} ${lc.y})`);

    const naive = next - now;
    const fwd = ((next - now) % L + L) % L;
    const arc = S.arcDistanceL(now, next, L); // signed, shortest

    // arcs: short = lift; long = forward-modulo when it disagrees
    shortArc.setAttribute('d', arcPath(now, next, 'short'));
    // forward arc (long way if forward != short magnitude direction)
    const forwardDisagrees = Math.abs(fwd - Math.abs(arc)) > 0.01;
    if (forwardDisagrees) {
      longArc.setAttribute('d', arcPath(now, next, 'forward'));
      longArc.setAttribute('opacity', 0.4);
    } else {
      longArc.setAttribute('opacity', 0);
    }

    // readouts
    document.getElementById('s3-r-naive').querySelector('.val').textContent = `${S.fmt(naive, 2)}s`;
    document.getElementById('s3-r-hand').querySelector('.val').textContent  = `${S.fmt(fwd, 2)}s`;
    document.getElementById('s3-r-lift').querySelector('.val').textContent  = `${S.fmt(arc, 2)}s`;

    document.getElementById('s3-r-naive').classList.toggle('flagged', naive < 0);
    document.getElementById('s3-r-hand').classList.toggle('flagged', forwardDisagrees && fwd > L/2);

    centerVal.textContent = `${S.fmt(Math.abs(arc), 2)}s`;
  }

  const nowSlider  = root.querySelector('#s3-now');
  const nextSlider = root.querySelector('#s3-next');
  const nowOut  = root.querySelector('#s3-now-out');
  const nextOut = root.querySelector('#s3-next-out');

  function update() {
    const now  = (+nowSlider.value)  / 100;
    const next = (+nextSlider.value) / 100;
    nowOut.textContent  = `${now.toFixed(2)}s`;
    nextOut.textContent = `${next.toFixed(2)}s`;
    render(now, next);
  }
  nowSlider.addEventListener('input', update);
  nextSlider.addEventListener('input', update);
  update();
})();
