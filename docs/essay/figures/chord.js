/* Fig: chord on the disk (§6 fourth panel).
   Two draggable points on the unit circle. Chord between them; chord midpoint inside the disk
   (the linear average upstairs — off the manifold). Renormalization arrow back to the circle.
   A second dot showing the scalar (degree-space) wrong answer. */
(function () {
  const cell = document.querySelector('.up-cell[data-op-cell="chord"]');
  if (!cell) return;
  const svg = d3.select(cell.querySelector('.up-svg'));
  const W = 240, H = 240, cx = W / 2, cy = H / 2, R = 80;
  const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
  const vector = 'var(--vector)', scalar = 'var(--scalar)';

  // chrome
  svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R)
    .attr('fill', 'var(--paper)').attr('stroke', ink3);
  svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 1.5).attr('fill', ink3);
  svg.append('line').attr('x1', cx - R - 10).attr('y1', cy).attr('x2', cx + R + 10).attr('y2', cy).attr('stroke', rule);
  svg.append('line').attr('x1', cx).attr('y1', cy - R - 10).attr('x2', cx).attr('y2', cy + R + 10).attr('stroke', rule);

  const dyn = svg.append('g');

  let aDeg = 320, bDeg = 40;

  function pt(deg) {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  }
  function degOfXY(x, y) {
    return ((Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90) + 360) % 360;
  }

  function render() {
    dyn.selectAll('*').remove();
    const [ax, ay] = pt(aDeg);
    const [bx, by] = pt(bDeg);
    // chord
    dyn.append('line').attr('x1', ax).attr('y1', ay).attr('x2', bx).attr('y2', by)
      .attr('stroke', ink).attr('stroke-width', 1.4);
    // chord midpoint (off-manifold)
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    // renormalized point on circle (geometric mean)
    const dx = mx - cx, dy_ = my - cy;
    const m = Math.hypot(dx, dy_) || 1e-6;
    const ux = cx + (dx / m) * R, uy = cy + (dy_ / m) * R;
    // renormalization arrow
    dyn.append('line').attr('x1', mx).attr('y1', my).attr('x2', ux).attr('y2', uy)
      .attr('stroke', vector).attr('stroke-width', 1.2).attr('stroke-dasharray', '3 2');
    // scalar (degree-space) average — projected onto circle
    const scalarDeg = ((aDeg + bDeg) / 2 + 360) % 360;
    const [sx, sy] = pt(scalarDeg);

    // hollow midpoint marker
    dyn.append('circle').attr('cx', mx).attr('cy', my).attr('r', 4.5)
      .attr('fill', 'var(--paper)').attr('stroke', ink).attr('stroke-width', 1.4);
    // scalar wrong dot (dashed coral ring)
    dyn.append('circle').attr('cx', sx).attr('cy', sy).attr('r', 5)
      .attr('fill', 'var(--paper)').attr('stroke', scalar).attr('stroke-width', 2)
      .attr('stroke-dasharray', '3 2');
    // geometric (correct) dot
    dyn.append('circle').attr('cx', ux).attr('cy', uy).attr('r', 5).attr('fill', vector);
    // input dots (draggable)
    [['a', ax, ay, aDeg], ['b', bx, by, bDeg]].forEach(([id, x, y]) => {
      dyn.append('circle').attr('cx', x).attr('cy', y).attr('r', 6)
        .attr('fill', ink).attr('stroke', 'var(--paper)').attr('stroke-width', 2)
        .style('cursor', 'grab')
        .call(d3.drag()
          .on('start', function () { d3.select(this).style('cursor', 'grabbing'); })
          .on('drag', function (event) {
            const newDeg = degOfXY(event.x, event.y);
            if (id === 'a') aDeg = newDeg; else bDeg = newDeg;
            render();
          })
          .on('end', function () { d3.select(this).style('cursor', 'grab'); })
        );
    });
  }
  render();
})();
