/* Fig 6 — three small textbook diagrams: average, distance, interpolation, on the unit circle. */
(function () {
  const cells = document.querySelectorAll('#fig-upstairs .up-svg');
  cells.forEach(svg => {
    const op = svg.dataset.op;
    const sv = d3.select(svg);
    const W = 240, H = 240, cx = W / 2, cy = H / 2, R = 80;
    const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
    const vector = 'var(--vector)';

    // unit circle
    sv.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R)
      .attr('fill', 'none').attr('stroke', ink3);
    // axes — very subtle
    sv.append('line').attr('x1', cx - R - 16).attr('y1', cy).attr('x2', cx + R + 16).attr('y2', cy)
      .attr('stroke', rule);
    sv.append('line').attr('x1', cx).attr('y1', cy - R - 16).attr('x2', cx).attr('y2', cy + R + 16)
      .attr('stroke', rule);

    // two angles 350° and 10° (compass; convert to math angle: deg→radians where 0=top)
    const A = 340, B = 20;
    function pt(deg, r) {
      const a = (deg - 90) * Math.PI / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    const [ax, ay] = pt(A, R);
    const [bx, by] = pt(B, R);

    // input vectors (faint)
    sv.append('line').attr('x1', cx).attr('y1', cy).attr('x2', ax).attr('y2', ay)
      .attr('stroke', ink).attr('stroke-width', 1).attr('opacity', 0.55);
    sv.append('line').attr('x1', cx).attr('y1', cy).attr('x2', bx).attr('y2', by)
      .attr('stroke', ink).attr('stroke-width', 1).attr('opacity', 0.55);

    // dots
    function dot(x, y, color, r) {
      sv.append('circle').attr('cx', x).attr('cy', y).attr('r', r || 4)
        .attr('fill', color).attr('stroke', 'var(--paper)').attr('stroke-width', 1.5);
    }

    if (op === 'avg') {
      // Sum vector
      const sx = (ax - cx) + (bx - cx) + cx;
      const sy = (ay - cy) + (by - cy) + cy;
      // Renormalized
      const ar = (A * Math.PI / 180), br = (B * Math.PI / 180);
      const vx = (Math.cos(ar - Math.PI / 2) + Math.cos(br - Math.PI / 2)) / 2;
      const vy = (Math.sin(ar - Math.PI / 2) + Math.sin(br - Math.PI / 2)) / 2;
      const m = Math.hypot(vx, vy);
      const ux = cx + (vx / m) * R, uy = cy + (vy / m) * R;
      // dashed line from sum to renormalized
      sv.append('line').attr('x1', sx).attr('y1', sy).attr('x2', ux).attr('y2', uy)
        .attr('stroke', vector).attr('stroke-width', 1).attr('stroke-dasharray', '2 3');
      // sum dot (faint)
      dot(sx, sy, 'var(--paper)', 4);
      sv.append('circle').attr('cx', sx).attr('cy', sy).attr('r', 4)
        .attr('fill', 'none').attr('stroke', vector).attr('stroke-width', 1.5);
      // result on circle
      sv.append('line').attr('x1', cx).attr('y1', cy).attr('x2', ux).attr('y2', uy)
        .attr('stroke', vector).attr('stroke-width', 2);
      dot(ux, uy, vector, 5);
      dot(ax, ay, ink); dot(bx, by, ink);
    } else if (op === 'dist') {
      // chord
      sv.append('line').attr('x1', ax).attr('y1', ay).attr('x2', bx).attr('y2', by)
        .attr('stroke', vector).attr('stroke-width', 2).attr('stroke-dasharray', '4 3');
      // arc
      const [x1, y1] = pt(A, R), [x2, y2] = pt(B, R);
      const sweep = 1, large = 0;
      sv.append('path')
        .attr('d', `M${x1},${y1} A${R},${R} 0 ${large} ${sweep} ${x2},${y2}`)
        .attr('fill', 'none').attr('stroke', vector).attr('stroke-width', 2);
      dot(ax, ay, ink); dot(bx, by, ink);
      // labels
      sv.append('text').attr('x', cx).attr('y', cy - R - 28)
        .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
        .attr('font-size', 10).attr('fill', vector).text('arc');
      sv.append('text').attr('x', cx).attr('y', cy - R + 18)
        .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
        .attr('font-size', 10).attr('fill', vector).text('chord');
    } else if (op === 'lerp') {
      // shortest arc with 5 sample dots
      const [x1, y1] = pt(A, R), [x2, y2] = pt(B, R);
      sv.append('path')
        .attr('d', `M${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2}`)
        .attr('fill', 'none').attr('stroke', vector).attr('stroke-width', 2);
      // sample points along the arc at t = 0.25, 0.5, 0.75
      [0.25, 0.5, 0.75].forEach(t => {
        // shortest delta
        let dlt = ((B - A) % 360 + 540) % 360 - 180;
        const di = (A + dlt * t + 360) % 360;
        const [px, py] = pt(di, R);
        dot(px, py, vector, t === 0.5 ? 4 : 3);
      });
      dot(ax, ay, ink); dot(bx, by, ink);
    }
  });
})();
