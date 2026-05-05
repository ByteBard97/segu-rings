/* Fig 1 — Opening bug. Two compass dials.
   Left: scalar (a+b)/2 = 180° — the wrong arrow.
   Right: geometric mean = 0° — the right arrow.
   Hand-rolled SVG via D3. */
(function () {
  const svgs = document.querySelectorAll('#fig-bug .fig-bug-svg');
  svgs.forEach(svg => {
    const sv = d3.select(svg);
    const W = 220, H = 220, cx = W / 2, cy = H / 2, R = 78;
    const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
    const mode = svg.dataset.bug; // "wrong" | "right"
    const accent = mode === 'wrong' ? 'var(--scalar)' : 'var(--vector)';

    // Outer dial ring
    sv.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', R)
      .attr('fill', 'none').attr('stroke', rule).attr('stroke-width', 1);

    // Tick marks (every 30°)
    const ticks = sv.append('g');
    for (let d = 0; d < 360; d += 30) {
      const isCardinal = d % 90 === 0;
      const a = (d - 90) * Math.PI / 180;
      const r1 = R, r2 = R - (isCardinal ? 9 : 5);
      ticks.append('line')
        .attr('x1', cx + Math.cos(a) * r1).attr('y1', cy + Math.sin(a) * r1)
        .attr('x2', cx + Math.cos(a) * r2).attr('y2', cy + Math.sin(a) * r2)
        .attr('stroke', isCardinal ? ink3 : rule).attr('stroke-width', 1);
    }

    // Cardinal labels
    const cardinals = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
    cardinals.forEach(([l, d]) => {
      const a = (d - 90) * Math.PI / 180;
      sv.append('text')
        .attr('x', cx + Math.cos(a) * (R + 14))
        .attr('y', cy + Math.sin(a) * (R + 14) + 4)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-size', 10).attr('font-weight', 500)
        .attr('fill', ink3).attr('letter-spacing', '0.08em')
        .text(l);
    });

    // Two faint input arrows at 350° and 10°
    function arrow(deg, color, opacity, dashed, length) {
      const a = (deg - 90) * Math.PI / 180;
      const x = cx + Math.cos(a) * length;
      const y = cy + Math.sin(a) * length;
      const g = sv.append('g').attr('opacity', opacity);
      g.append('line')
        .attr('x1', cx).attr('y1', cy).attr('x2', x).attr('y2', y)
        .attr('stroke', color).attr('stroke-width', 1.6)
        .attr('stroke-dasharray', dashed ? '3 3' : null)
        .attr('stroke-linecap', 'round');
      g.append('circle').attr('cx', x).attr('cy', y).attr('r', 3).attr('fill', color);
    }
    arrow(350, ink, 0.4, false, R - 16);
    arrow(10,  ink, 0.4, false, R - 16);

    // Result arrow
    const resultDeg = mode === 'wrong' ? 180 : 0;
    const a = (resultDeg - 90) * Math.PI / 180;
    const tipX = cx + Math.cos(a) * (R - 8);
    const tipY = cy + Math.sin(a) * (R - 8);

    sv.append('line')
      .attr('x1', cx).attr('y1', cy).attr('x2', tipX).attr('y2', tipY)
      .attr('stroke', accent).attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', mode === 'wrong' ? '5 4' : null);

    // Arrowhead
    const ahLen = 9, ahWid = 6;
    const back = (resultDeg - 90) * Math.PI / 180;
    const px = -Math.sin(back), py = Math.cos(back);
    const baseX = tipX - Math.cos(back) * ahLen;
    const baseY = tipY - Math.sin(back) * ahLen;
    sv.append('path')
      .attr('d', `M${tipX},${tipY} L${baseX + px * ahWid},${baseY + py * ahWid} L${baseX - px * ahWid},${baseY - py * ahWid} Z`)
      .attr('fill', accent);

    // Center dot
    sv.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 2.5).attr('fill', ink);

    // Small angle labels — placed just outside the dots, anchored away from the line
    const lab = (deg, txt, anchor) => {
      const a2 = (deg - 90) * Math.PI / 180;
      sv.append('text')
        .attr('x', cx + Math.cos(a2) * (R - 10))
        .attr('y', cy + Math.sin(a2) * (R - 10) + 3)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', 9).attr('fill', ink3)
        .attr('text-anchor', anchor).text(txt);
    };
    lab(350, '350°', 'end');
    lab(10,  '10°',  'start');
  });
})();
