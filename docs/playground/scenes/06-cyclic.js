/* scene 06 — cyclic is storage, not math */
(function () {
  const S = window.AppliedShared;
  const root = document.getElementById('scene-06-demo');
  if (!root) return;
  const W = 520, H = 380, L = 8;
  const cx = W / 2, cy = H / 2 + 4, R = 120;

  root.innerHTML = `
    <h3>cyclic() runs every frame · drag t past the seam</h3>
    <div class="stage">
      <svg class="viz" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <g id="s6-ring"></g>
      </svg>
    </div>
    <div class="scrubrow">
      <span class="label">raw t</span>
      <input type="range" min="-200" max="1000" value="900" id="s6-raw" />
      <output id="s6-raw-out">9.00s</output>
    </div>
    <div class="scrubrow">
      <span class="label">next chord</span>
      <input type="range" min="0" max="800" value="20" id="s6-next" />
      <output id="s6-next-out">0.20s</output>
    </div>
    <div class="readouts" id="s6-readouts"></div>
  `;

  const ring = root.querySelector('#s6-ring');
  ring.appendChild(S.svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--rule-2)', 'stroke-width': 2 }));
  ring.appendChild(S.svgEl('line', { x1: cx, y1: cy - R - 8, x2: cx, y2: cy - R + 8, stroke: 'var(--ink-3)' }));
  ring.appendChild(S.svgEl('text', { x: cx, y: cy - R - 14, 'text-anchor': 'middle', 'font-family': 'var(--sans)', 'font-size': 10, fill: 'var(--ink-4)', 'letter-spacing': '0.16em' })).textContent = 'STORAGE: [0, 8)';

  // 'after cyclic()' position
  const cycMark = S.svgEl('circle', { r: 8, fill: 'var(--ok)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(cycMark);
  const cycLabG = S.svgEl('g');
  cycLabG.appendChild(S.svgEl('rect', { x: -28, y: -10, width: 56, height: 20, rx: 4, fill: 'var(--bg-2)', stroke: 'none' }));
  const cycLab = S.svgEl('text', { 'font-family': 'var(--sans)', 'font-size': 10, fill: 'var(--ok)', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  cycLab.textContent = 'cyclic(t)'; cycLabG.appendChild(cycLab);
  ring.appendChild(cycLabG);

  const nextMark = S.svgEl('rect', { x: -7, y: -7, width: 14, height: 14, fill: 'var(--ink-2)', stroke: 'var(--bg)', 'stroke-width': 2 });
  ring.appendChild(nextMark);
  const nextLabG = S.svgEl('g');
  nextLabG.appendChild(S.svgEl('rect', { x: -18, y: -10, width: 36, height: 20, rx: 4, fill: 'var(--bg-2)', stroke: 'none' }));
  const nextLab = S.svgEl('text', { 'font-family': 'var(--sans)', 'font-size': 10, fill: 'var(--ink-3)', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  nextLab.textContent = 'next'; nextLabG.appendChild(nextLab);
  ring.appendChild(nextLabG);

  // value display
  const cycVal = S.svgEl('text', { x: cx, y: cy - 8, 'text-anchor': 'middle', 'font-family': 'var(--mono)', 'font-size': 18, fill: 'var(--ok)', 'font-weight': 600 });
  cycVal.textContent = '—'; ring.appendChild(cycVal);
  const cycCap = S.svgEl('text', { x: cx, y: cy + 10, 'text-anchor': 'middle', 'font-family': 'var(--sans)', 'font-size': 9, fill: 'var(--ink-4)', 'letter-spacing': '0.16em' });
  cycCap.textContent = 'IN-RANGE'; ring.appendChild(cycCap);

  const readouts = root.querySelector('#s6-readouts');
  readouts.innerHTML = `
    <div class="row" id="s6-r-cyc"><span class="swatch" style="background:var(--ok);box-shadow:0 0 0 3px var(--ok-soft);"></span><span class="name">after cyclic() <span class="sub">storage looks fine</span></span><span class="val">—</span></div>
    <div class="row" id="s6-r-naive"><span class="swatch scalar"></span><span class="name">next − cyclic(t) <span class="sub">subtraction is linear</span></span><span class="val">—</span></div>
    <div class="row" id="s6-r-hand"><span class="swatch hand"></span><span class="name">((next−t)%L+L)%L <span class="sub">forward, not shortest</span></span><span class="val">—</span></div>
    <div class="row" id="s6-r-lift"><span class="swatch vector"></span><span class="name">arc distance <span class="sub">lift fixes the math</span></span><span class="val">—</span></div>
  `;

  function timeToPos(t, rad = R) {
    const a = (t / L) * S.TAU - Math.PI / 2;
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, a };
  }

  function update() {
    const raw  = (+root.querySelector('#s6-raw').value)  / 100;
    const next = (+root.querySelector('#s6-next').value) / 100;
    root.querySelector('#s6-raw-out').textContent  = `${raw.toFixed(2)}s`;
    root.querySelector('#s6-next-out').textContent = `${next.toFixed(2)}s`;

    const t = S.cyclic(raw, 0, L); // segu's cyclic, exact
    const pc = timeToPos(t), pn = timeToPos(next);
    cycMark.setAttribute('cx', pc.x); cycMark.setAttribute('cy', pc.y);
    nextMark.setAttribute('transform', `translate(${pn.x} ${pn.y})`);
    cycLabG.setAttribute('transform', `translate(${cx + Math.cos(pc.a) * (R + 30)} ${cy + Math.sin(pc.a) * (R + 30)})`);
    nextLabG.setAttribute('transform', `translate(${cx + Math.cos(pn.a) * (R + 30)} ${cy + Math.sin(pn.a) * (R + 30)})`);

    cycVal.textContent = `${t.toFixed(2)}s`;

    const naive = next - t;
    const fwd = ((next - t) % L + L) % L;
    const arc = S.arcDistanceL(t, next, L);

    document.getElementById('s6-r-cyc').querySelector('.val').textContent = `${t.toFixed(2)}s`;
    document.getElementById('s6-r-naive').querySelector('.val').textContent = `${S.fmt(naive, 2)}s`;
    document.getElementById('s6-r-hand').querySelector('.val').textContent = `${S.fmt(fwd, 2)}s`;
    document.getElementById('s6-r-lift').querySelector('.val').textContent = `${S.fmt(arc, 2)}s`;

    document.getElementById('s6-r-naive').classList.toggle('flagged', naive < 0);
    document.getElementById('s6-r-hand').classList.toggle('flagged', fwd > L/2 + 0.01 && Math.abs(arc) < L/2);
  }

  root.querySelector('#s6-raw').addEventListener('input', update);
  root.querySelector('#s6-next').addEventListener('input', update);
  update();
})();
