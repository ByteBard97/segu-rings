/* Fig 3 — three failing widgets: average, lerp, distance.
   Each is a compass dial with input arrows + scalar (wrong) result + geometric (right) result.
   Drag inputs, watch wrongness emerge at the seam. */
(function () {
  const cells = document.querySelectorAll('#fig-failures .failure');
  cells.forEach(cell => {
    const mode = cell.dataset.mode;
    const sv = d3.select(cell.querySelector('.failure-svg'));
    const W = 280, H = 280, cx = W / 2, cy = H / 2, R = 100;
    const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
    const scalar = 'var(--scalar)', vector = 'var(--vector)';

    // dial chrome
    sv.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R)
      .attr('fill', 'var(--paper)').attr('stroke', rule);

    for (let d = 0; d < 360; d += 30) {
      const a = (d - 90) * Math.PI / 180;
      sv.append('line')
        .attr('x1', cx + Math.cos(a) * R).attr('y1', cy + Math.sin(a) * R)
        .attr('x2', cx + Math.cos(a) * (R - (d % 90 === 0 ? 8 : 4)))
        .attr('y2', cy + Math.sin(a) * (R - (d % 90 === 0 ? 8 : 4)))
        .attr('stroke', d % 90 === 0 ? ink3 : rule);
    }
    // Seam marker (top, where 0/360 meets) — subtle dashed line
    sv.append('line')
      .attr('x1', cx).attr('y1', cy - R - 6).attr('x2', cx).attr('y2', cy - R + 6)
      .attr('stroke', ink3).attr('stroke-dasharray', '2 2');
    sv.append('text')
      .attr('x', cx).attr('y', cy - R - 12)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 9).attr('fill', ink3).attr('letter-spacing', '0.1em')
      .text('SEAM');

    // Layer for dynamic content
    const layer = sv.append('g');

    // ---- helpers ----
    function pt(deg, r) {
      const a = (deg - 90) * Math.PI / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    function shortArc(a, b) {
      // returns shortest signed delta from a to b in (-180, 180]
      let d = ((b - a) % 360 + 540) % 360 - 180;
      return d;
    }
    function arcPath(start, end, r) {
      const [x1, y1] = pt(start, r), [x2, y2] = pt(end, r);
      const delta = shortArc(start, end);
      const sweep = delta > 0 ? 1 : 0;
      const large = Math.abs(delta) > 180 ? 1 : 0;
      return `M${x1},${y1} A${r},${r} 0 ${large} ${sweep} ${x2},${y2}`;
    }

    function arrow(deg, color, opts) {
      const len = (opts && opts.len) || R - 12;
      const dashed = opts && opts.dashed;
      const width = (opts && opts.width) || 2;
      const [x, y] = pt(deg, len);
      const g = layer.append('g');
      g.append('line').attr('x1', cx).attr('y1', cy).attr('x2', x).attr('y2', y)
        .attr('stroke', color).attr('stroke-width', width)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', dashed ? '5 4' : null);
      // arrowhead
      const a = (deg - 90) * Math.PI / 180;
      const px = -Math.sin(a), py = Math.cos(a);
      const base = [x - Math.cos(a) * 8, y - Math.sin(a) * 8];
      g.append('path')
        .attr('d', `M${x},${y} L${base[0] + px * 5},${base[1] + py * 5} L${base[0] - px * 5},${base[1] - py * 5} Z`)
        .attr('fill', color);
      return g;
    }

    function dot(deg, r, color) {
      const [x, y] = pt(deg, r);
      layer.append('circle').attr('cx', x).attr('cy', y).attr('r', 4)
        .attr('fill', color).attr('stroke', 'var(--paper)').attr('stroke-width', 2);
    }

    // ---- compute / render ----
    const inputs = cell.querySelectorAll('input[type=range]');
    const outs = {
      a: cell.querySelector('[data-out="a"]'),
      b: cell.querySelector('[data-out="b"]'),
      t: cell.querySelector('[data-out="t"]'),
      scalar: cell.querySelector('[data-out="scalar"]'),
      vector: cell.querySelector('[data-out="vector"]'),
    };

    function geomMean(a, b) {
      const ar = a * Math.PI / 180, br = b * Math.PI / 180;
      const x = (Math.cos(ar) + Math.cos(br)) / 2;
      const y = (Math.sin(ar) + Math.sin(br)) / 2;
      return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    }
    function geomLerp(t, a, b) {
      // lerp along the shorter arc
      const d = shortArc(a, b);
      return ((a + d * t) + 360) % 360;
    }
    function geomDist(a, b) { return Math.abs(shortArc(a, b)); }

    function render() {
      const a = +cell.querySelector('[data-input="a"]').value;
      const b = +cell.querySelector('[data-input="b"]').value;
      const tEl = cell.querySelector('[data-input="t"]');
      const t = tEl ? +tEl.value / 100 : 0.5;

      outs.a.textContent = a + '°';
      outs.b.textContent = b + '°';
      if (outs.t) outs.t.textContent = t.toFixed(2);

      layer.selectAll('*').remove();

      // Two inputs always shown
      arrow(a, ink, { len: R - 12, width: 1.6 });
      arrow(b, ink, { len: R - 12, width: 1.6 });
      dot(a, R - 12, ink);
      dot(b, R - 12, ink);

      // Mode-specific
      if (mode === 'avg') {
        const scalarRes = ((a + b) / 2 + 360) % 360;
        const vectorRes = geomMean(a, b);
        // wrong arrow (dashed coral)
        arrow(scalarRes, scalar, { dashed: true, width: 2.2 });
        // right arrow (solid blue) — slightly shorter so they don't overlap
        arrow(vectorRes, vector, { width: 2.2, len: R - 26 });
        outs.scalar.textContent = scalarRes.toFixed(0) + '°';
        outs.vector.textContent = vectorRes.toFixed(0) + '°';
      } else if (mode === 'lerp') {
        const scalarRes = (a + t * (b - a) + 720) % 360;
        const vectorRes = geomLerp(t, a, b);
        // scalar path: straight line through the middle (chord through center area is just a point on dial; we draw the scalar arc going long way if relevant, but better: show scalar result point in dashed coral)
        arrow(scalarRes, scalar, { dashed: true, width: 2.2 });
        arrow(vectorRes, vector, { width: 2.2, len: R - 26 });
        // arc connecting a and b along scalar route (linearly through degree space)
        // To visualize the scalar bug: draw the long-way arc when t crosses seam
        outs.scalar.textContent = scalarRes.toFixed(0) + '°';
        outs.vector.textContent = vectorRes.toFixed(0) + '°';
      } else if (mode === 'dist') {
        const scalarRes = Math.abs(a - b);
        const vectorRes = geomDist(a, b);
        // Draw scalar "long way" arc in dashed coral (the route abs(a-b) implies)
        const longStart = a, longEnd = b;
        // scalar interprets distance as the long way if shorter arc went across seam
        const scalarDir = (b - a >= 0) ? 1 : -1;
        // long way path: full sweep from a to b in scalar direction
        const longLarge = scalarRes > 180 ? 1 : 0;
        const longSweep = scalarDir > 0 ? 1 : 0;
        const [x1, y1] = pt(a, R - 18), [x2, y2] = pt(b, R - 18);
        layer.append('path')
          .attr('d', `M${x1},${y1} A${R - 18},${R - 18} 0 ${longLarge} ${longSweep} ${x2},${y2}`)
          .attr('fill', 'none').attr('stroke', scalar).attr('stroke-width', 2.2)
          .attr('stroke-dasharray', '5 4');
        // short arc in vector blue
        layer.append('path')
          .attr('d', arcPath(a, b, R - 30))
          .attr('fill', 'none').attr('stroke', vector).attr('stroke-width', 2.2);
        outs.scalar.textContent = scalarRes.toFixed(0) + '°';
        outs.vector.textContent = vectorRes.toFixed(0) + '°';
      }

      // center dot
      layer.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 2.5).attr('fill', ink);
    }

    inputs.forEach(i => i.addEventListener('input', render));
    render();
  });
})();
