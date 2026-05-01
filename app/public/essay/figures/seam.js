/* Fig 4 — "The seam is not where you think it is."
   Left half: a scalar number line from 0 to 360 with the seam at the user-chosen "zero".
   Right half: the same two headings on a compass dial — fixed in space.
   The scalar average lives on the line (and moves as the seam moves);
   the geometric average lives on the dial (and never moves).
   Two angles fixed at compass-350 and compass-10. */
(function () {
  const fig = document.getElementById('fig-seam');
  if (!fig) return;
  const svg = d3.select(fig.querySelector('.seam-svg'));
  const input = fig.querySelector('[data-input="zero"]');
  const outZ = fig.querySelector('[data-out="zero"]');
  const outS = fig.querySelector('[data-out="scalar"]');
  const outV = fig.querySelector('[data-out="vector"]');

  const W = 720, H = 360;
  const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
  const scalar = 'var(--scalar)', vector = 'var(--vector)';

  // ----- LEFT: number line with movable seam -----
  const lineG = svg.append('g').attr('transform', `translate(40, 60)`);
  const lineW = 280;
  // background label
  lineG.append('text').attr('x', 0).attr('y', -22)
    .attr('font-family', 'Inter,sans-serif').attr('font-size', 10)
    .attr('letter-spacing', '0.14em').attr('fill', ink3)
    .text('REPRESENTATION  —  flat number line');

  // line baseline
  lineG.append('line').attr('x1', 0).attr('y1', 60).attr('x2', lineW).attr('y2', 60)
    .attr('stroke', ink).attr('stroke-width', 1);

  // tick marks
  for (let i = 0; i <= 12; i++) {
    const x = (lineW * i) / 12;
    lineG.append('line').attr('x1', x).attr('y1', 60).attr('x2', x).attr('y2', i % 3 === 0 ? 68 : 64)
      .attr('stroke', ink3);
  }
  // endpoint labels
  lineG.append('text').attr('x', 0).attr('y', 86)
    .attr('font-family', 'JetBrains Mono,monospace').attr('font-size', 11)
    .attr('fill', ink3).attr('text-anchor', 'middle').text('0°');
  lineG.append('text').attr('x', lineW).attr('y', 86)
    .attr('font-family', 'JetBrains Mono,monospace').attr('font-size', 11)
    .attr('fill', ink3).attr('text-anchor', 'middle').text('360°');

  // dynamic layer for line
  const lineDyn = lineG.append('g');

  // ----- RIGHT: compass dial -----
  const dialG = svg.append('g').attr('transform', `translate(${W - 200}, ${H / 2})`);
  const R = 110;
  dialG.append('text').attr('x', 0).attr('y', -R - 30)
    .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
    .attr('font-size', 10).attr('letter-spacing', '0.14em').attr('fill', ink3)
    .text('GEOMETRY  —  what the data actually is');

  dialG.append('circle').attr('r', R).attr('fill', 'var(--paper)').attr('stroke', rule);

  // ticks every 30°, cardinals labelled
  for (let d = 0; d < 360; d += 30) {
    const a = (d - 90) * Math.PI / 180;
    dialG.append('line')
      .attr('x1', Math.cos(a) * R).attr('y1', Math.sin(a) * R)
      .attr('x2', Math.cos(a) * (R - (d % 90 === 0 ? 9 : 5)))
      .attr('y2', Math.sin(a) * (R - (d % 90 === 0 ? 9 : 5)))
      .attr('stroke', d % 90 === 0 ? ink3 : rule);
  }
  ['N', 'E', 'S', 'W'].forEach((l, i) => {
    const a = (i * 90 - 90) * Math.PI / 180;
    dialG.append('text')
      .attr('x', Math.cos(a) * (R + 16)).attr('y', Math.sin(a) * (R + 16) + 4)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 10).attr('fill', ink3).attr('letter-spacing', '0.06em')
      .text(l);
  });

  const dialDyn = dialG.append('g');

  // bridge label between the two
  svg.append('text')
    .attr('x', 40 + lineW + 18).attr('y', H / 2 + 6)
    .attr('font-family', 'Inter,sans-serif').attr('font-size', 11)
    .attr('fill', ink3).attr('letter-spacing', '0.04em').text('lift →');

  // The two fixed compass angles
  const A = 350, B = 10; // compass degrees, fixed forever

  function shortArc(a, b) {
    return ((b - a) % 360 + 540) % 360 - 180;
  }
  function geomMean(a, b) {
    const ar = a * Math.PI / 180, br = b * Math.PI / 180;
    return ((Math.atan2((Math.sin(ar) + Math.sin(br)) / 2, (Math.cos(ar) + Math.cos(br)) / 2) * 180 / Math.PI) + 360) % 360;
  }
  function pt(deg, r) {
    const a = (deg - 90) * Math.PI / 180;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }

  function render() {
    const zero = +input.value; // compass-degree where the line begins
    outZ.textContent = zero + '°';

    // Convert compass A,B into "line coordinate" given current seam.
    // The line shows the values 0..360 in scalar form, where scalar(c) = (c - zero + 360) % 360
    const scalarA = ((A - zero) + 360) % 360;
    const scalarB = ((B - zero) + 360) % 360;
    const scalarMean = (scalarA + scalarB) / 2;
    // Convert that scalar mean back to compass for display
    const scalarMeanCompass = ((scalarMean + zero) + 360) % 360;
    const vectorMeanCompass = geomMean(A, B); // always 0

    outS.textContent = scalarMeanCompass.toFixed(0) + '°';
    outV.textContent = vectorMeanCompass.toFixed(0) + '°';

    // ---- redraw line layer ----
    lineDyn.selectAll('*').remove();

    // points on the line
    const xA = (scalarA / 360) * lineW;
    const xB = (scalarB / 360) * lineW;
    const xM = (scalarMean / 360) * lineW;

    // connecting bracket between A and B
    lineDyn.append('line').attr('x1', xA).attr('y1', 44).attr('x2', xB).attr('y2', 44)
      .attr('stroke', ink3).attr('stroke-dasharray', '2 2');

    [['a', xA, scalarA], ['b', xB, scalarB]].forEach(([lab, x, val]) => {
      lineDyn.append('circle').attr('cx', x).attr('cy', 60).attr('r', 4.5)
        .attr('fill', ink).attr('stroke', 'var(--paper)').attr('stroke-width', 2);
      lineDyn.append('text').attr('x', x).attr('y', 38)
        .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
        .attr('font-size', 10).attr('fill', ink).text(val.toFixed(0) + '°');
    });

    // scalar mean (wrong)
    lineDyn.append('line').attr('x1', xM).attr('y1', 50).attr('x2', xM).attr('y2', 78)
      .attr('stroke', scalar).attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 3');
    lineDyn.append('circle').attr('cx', xM).attr('cy', 60).attr('r', 5)
      .attr('fill', 'var(--paper)').attr('stroke', scalar).attr('stroke-width', 2);
    lineDyn.append('text').attr('x', xM).attr('y', 100)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 11).attr('font-weight', 600).attr('fill', scalar)
      .text('scalar mean');

    // ---- redraw dial layer ----
    dialDyn.selectAll('*').remove();

    // Show seam location on dial as a faint cut
    const [sx1, sy1] = pt(zero, R + 8);
    const [sx2, sy2] = pt(zero, R - 14);
    dialDyn.append('line').attr('x1', sx1).attr('y1', sy1).attr('x2', sx2).attr('y2', sy2)
      .attr('stroke', ink3).attr('stroke-dasharray', '3 3').attr('stroke-width', 1);
    dialDyn.append('text')
      .attr('x', sx1 + (sx1 > 0 ? 6 : -6)).attr('y', sy1 + (sy1 > 0 ? 12 : -4))
      .attr('text-anchor', sx1 > 0 ? 'start' : 'end')
      .attr('font-family', 'Inter,sans-serif').attr('font-size', 9)
      .attr('letter-spacing', '0.1em').attr('fill', ink3).text('seam');

    // The two angles (fixed)
    [A, B].forEach(d => {
      const [x, y] = pt(d, R - 14);
      dialDyn.append('line').attr('x1', 0).attr('y1', 0).attr('x2', x).attr('y2', y)
        .attr('stroke', ink).attr('stroke-width', 1.4).attr('stroke-linecap', 'round');
      dialDyn.append('circle').attr('cx', x).attr('cy', y).attr('r', 3.5).attr('fill', ink);
    });

    // Scalar mean projected to dial (dashed coral) — moves with seam
    const [smx, smy] = pt(scalarMeanCompass, R - 24);
    dialDyn.append('line').attr('x1', 0).attr('y1', 0).attr('x2', smx).attr('y2', smy)
      .attr('stroke', scalar).attr('stroke-width', 2).attr('stroke-dasharray', '5 4')
      .attr('stroke-linecap', 'round');

    // Geometric mean (vector blue) — fixed at 0°
    const [vmx, vmy] = pt(vectorMeanCompass, R - 32);
    dialDyn.append('line').attr('x1', 0).attr('y1', 0).attr('x2', vmx).attr('y2', vmy)
      .attr('stroke', vector).attr('stroke-width', 2.4).attr('stroke-linecap', 'round');
    dialDyn.append('circle').attr('cx', vmx).attr('cy', vmy).attr('r', 4).attr('fill', vector);

    dialDyn.append('circle').attr('r', 2.5).attr('fill', ink);
  }

  input.addEventListener('input', render);
  render();
})();
