/* scene 05 — snap to nearest beat */
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-05-demo');
  if (!root) return;
  const W = 520, H = 380;
  const L = 8, BEATS = 8;
  const cx = W / 2, cy = H / 2 + 4;
  const R = 130;

  root.innerHTML = `
    <h3>loop = ${L}s · ${BEATS} beats · drag "now" near the seam</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <g id="s5-ring"></g>
      </svg>
    </div>
    <div class="scrubrow">
      <span class="label">now</span>
      <input type="range" min="0" max="800" value="790" id="s5-now" />
      <output id="s5-now-out">7.90s</output>
    </div>
    <div class="scrubrow">
      <span class="label">rounding</span>
      <select id="s5-mode" style="background:var(--bg);color:var(--ink-2);border:1px solid var(--rule);padding:4px 8px;font-family:var(--mono);font-size:11px;border-radius:3px;">
        <option value="floor">Math.floor</option>
        <option value="round">Math.round</option>
      </select>
      <output></output>
    </div>
    <div class="readouts" id="s5-readouts"></div>
  `;

  const ring = root.querySelector('#s5-ring');
  ring.appendChild(S.svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--rule-2)', 'stroke-width': 2 }));
  ring.appendChild(S.svgEl('line', { x1: cx, y1: cy - R - 8, x2: cx, y2: cy - R + 8, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
  ring.appendChild(S.svgEl('text', { x: cx, y: cy - R - 14, 'text-anchor': 'middle', 'font-family': 'var(--sans)', 'font-size': 10, fill: 'var(--ink-4)', 'letter-spacing': '0.16em' })).textContent = 'SEAM · 0/8';

  // beat markers — circles at each integer beat
  const beatPos = [];
  for (let i = 0; i < BEATS; i++) {
    const t = i;
    const a = (t / L) * S.TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    beatPos.push({ t, x, y, a });
    ring.appendChild(S.svgEl('circle', { cx: x, cy: y, r: 4, fill: 'var(--fret-dot)', stroke: 'var(--ink-4)', 'stroke-width': 1 }));
    const labY = cy + Math.sin(a) * (R + 18);
    const labX = cx + Math.cos(a) * (R + 18);
    const tx = S.svgEl('text', { x: labX, y: labY + 3, 'text-anchor': 'middle', 'font-family': 'var(--mono)', 'font-size': 9, fill: 'var(--ink-4)' });
    tx.textContent = i;
    ring.appendChild(tx);
  }

  // now marker
  const nowDot = S.svgEl('circle', { r: 6, fill: 'var(--ink-2)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(nowDot);
  const nowLab = S.svgEl('text', { 'font-family': 'var(--sans)', 'font-size': 9, fill: 'var(--ink-3)', 'text-anchor': 'middle' });
  nowLab.textContent = 'now'; ring.appendChild(nowLab);

  // halo highlights for the three snaps
  function makeHalo(color, r) {
    const c = S.svgEl('circle', { r, fill: 'none', stroke: color, 'stroke-width': 2 });
    ring.appendChild(c);
    return c;
  }
  const naiveHalo = makeHalo('var(--scalar)', 11);
  const handHalo  = makeHalo('var(--hand)', 14);
  const liftHalo  = makeHalo('var(--vector)', 17);

  // off-loop "ghost" dot for naive when it points outside [0,L)
  const naiveGhost = S.svgEl('g');
  naiveGhost.appendChild(S.svgEl('circle', { r: 5, fill: 'none', stroke: 'var(--scalar)', 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }));
  naiveGhost.appendChild(S.svgEl('line', { x1: -8, y1: -8, x2: 8, y2: 8, stroke: 'var(--scalar)' }));
  naiveGhost.appendChild(S.svgEl('line', { x1: -8, y1: 8, x2: 8, y2: -8, stroke: 'var(--scalar)' }));
  ring.appendChild(naiveGhost);

  const readouts = root.querySelector('#s5-readouts');
  readouts.innerHTML = `
    <div class="row" id="s5-r-naive"><span class="swatch scalar"></span><span class="name">naive segu <span class="sub">snap(now, beat)</span></span><span class="val">0</span></div>
    <div class="row" id="s5-r-hand"><span class="swatch hand"></span><span class="name">hand-rolled <span class="sub">(snap(now,beat)) % L</span></span><span class="val">0</span></div>
    <div class="row" id="s5-r-lift"><span class="swatch vector"></span><span class="name">lifted <span class="sub">nearest of N points on circle</span></span><span class="val">0</span></div>
  `;

  function angleToTime(a) {
    let aa = a + Math.PI / 2;
    if (aa < 0) aa += S.TAU;
    return (aa / S.TAU) * L;
  }
  function timeToPos(t) {
    const a = (t / L) * S.TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a };
  }

  function update() {
    const now = (+root.querySelector('#s5-now').value) / 100;
    root.querySelector('#s5-now-out').textContent = `${now.toFixed(2)}s`;
    const mode = root.querySelector('#s5-mode').value;
    const round = mode === 'floor' ? Math.floor : Math.round;
    const beat = 1; // beat length in seconds

    const pNow = timeToPos(now);
    nowDot.setAttribute('cx', pNow.x); nowDot.setAttribute('cy', pNow.y);
    const a = (now / L) * S.TAU - Math.PI / 2;
    nowLab.setAttribute('x', cx + Math.cos(a) * (R - 16));
    nowLab.setAttribute('y', cy + Math.sin(a) * (R - 16) + 3);

    // naive snap: round(now / beat) * beat — may exceed L
    const naive = round(now / beat) * beat;
    // hand: snap then % L
    const hand = ((round(now / beat) * beat) % L + L) % L;
    // lifted: nearest beat on circle (always in [0, L))
    let bestI = 0, bestDist = Infinity;
    for (let i = 0; i < BEATS; i++) {
      const d = Math.abs(S.arcDistanceL(now, i, L));
      if (d < bestDist) { bestDist = d; bestI = i; }
    }
    const lifted = bestI;

    // place halos
    const isNaiveOnLoop = naive >= 0 && naive < L;
    if (isNaiveOnLoop) {
      const p = timeToPos(naive);
      naiveHalo.setAttribute('cx', p.x); naiveHalo.setAttribute('cy', p.y);
      naiveHalo.setAttribute('opacity', 1);
      naiveGhost.setAttribute('opacity', 0);
    } else {
      naiveHalo.setAttribute('opacity', 0);
      // ghost just outside ring near where it would land
      const ghostT = naive % L;
      const gp = timeToPos(ghostT);
      const ang = (ghostT / L) * S.TAU - Math.PI / 2;
      const gx = cx + Math.cos(ang) * (R + 24);
      const gy = cy + Math.sin(ang) * (R + 24);
      naiveGhost.setAttribute('transform', `translate(${gx} ${gy})`);
      naiveGhost.setAttribute('opacity', 1);
    }
    const ph = timeToPos(hand);
    handHalo.setAttribute('cx', ph.x); handHalo.setAttribute('cy', ph.y);
    const pl = timeToPos(lifted);
    liftHalo.setAttribute('cx', pl.x); liftHalo.setAttribute('cy', pl.y);

    document.getElementById('s5-r-naive').querySelector('.val').textContent = isNaiveOnLoop ? `beat ${naive}` : `${naive} (off-loop)`;
    document.getElementById('s5-r-hand').querySelector('.val').textContent  = `beat ${hand}`;
    document.getElementById('s5-r-lift').querySelector('.val').textContent  = `beat ${lifted}`;

    document.getElementById('s5-r-naive').classList.toggle('flagged', !isNaiveOnLoop);
    document.getElementById('s5-r-hand').classList.toggle('flagged', mode === 'round' && hand !== lifted);
  }

  root.querySelector('#s5-now').addEventListener('input', update);
  root.querySelector('#s5-mode').addEventListener('change', update);
  update();
})();
