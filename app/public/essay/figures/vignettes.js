/* Vignette icons (section 2 — bytes / gimbal / DST) — small SVG glyphs.
   Each icon is hand-drawn into a div via inner SVG. */
(function () {
  const icons = document.querySelectorAll('.v-icon');
  icons.forEach(el => {
    const kind = el.dataset.icon;
    const ink = 'var(--ink)', ink3 = 'var(--ink-3)', scalar = 'var(--scalar)', vector = 'var(--vector)';
    const svg = d3.select(el).append('svg').attr('viewBox', '0 0 56 56').attr('width', '100%').attr('height', '100%');

    if (kind === 'bytes') {
      // four byte cells, with a slash cutting through one (where it splits)
      for (let i = 0; i < 4; i++) {
        svg.append('rect').attr('x', 8 + i * 10).attr('y', 18).attr('width', 9).attr('height', 16)
          .attr('fill', 'none').attr('stroke', ink).attr('stroke-width', 1);
      }
      // cut through middle two
      svg.append('line').attr('x1', 22).attr('y1', 14).attr('x2', 30).attr('y2', 38)
        .attr('stroke', scalar).attr('stroke-width', 1.5).attr('stroke-dasharray', '2 2');
      svg.append('text').attr('x', 28).attr('y', 48).attr('text-anchor', 'middle')
        .attr('font-family', 'JetBrains Mono,monospace').attr('font-size', 8).attr('fill', ink3).text('UTF-8');
    } else if (kind === 'gimbal') {
      // three concentric ellipses (gimbals)
      svg.append('ellipse').attr('cx', 28).attr('cy', 28).attr('rx', 18).attr('ry', 8)
        .attr('fill', 'none').attr('stroke', ink).attr('stroke-width', 1);
      svg.append('ellipse').attr('cx', 28).attr('cy', 28).attr('rx', 18).attr('ry', 8)
        .attr('fill', 'none').attr('stroke', ink).attr('stroke-width', 1)
        .attr('transform', 'rotate(60 28 28)');
      svg.append('ellipse').attr('cx', 28).attr('cy', 28).attr('rx', 18).attr('ry', 8)
        .attr('fill', 'none').attr('stroke', scalar).attr('stroke-width', 1.5)
        .attr('transform', 'rotate(120 28 28)');
      svg.append('circle').attr('cx', 28).attr('cy', 28).attr('r', 2.5).attr('fill', ink);
    } else if (kind === 'dst') {
      // clock with a tiny gap on the dial
      svg.append('circle').attr('cx', 28).attr('cy', 28).attr('r', 16)
        .attr('fill', 'none').attr('stroke', ink).attr('stroke-width', 1);
      // hour hand
      svg.append('line').attr('x1', 28).attr('y1', 28).attr('x2', 28).attr('y2', 18)
        .attr('stroke', ink).attr('stroke-width', 1.4).attr('stroke-linecap', 'round');
      svg.append('line').attr('x1', 28).attr('y1', 28).attr('x2', 36).attr('y2', 28)
        .attr('stroke', ink).attr('stroke-width', 1).attr('stroke-linecap', 'round');
      // gap (DST seam)
      svg.append('path').attr('d', 'M44,28 A16,16 0 0 1 41,38').attr('fill', 'none')
        .attr('stroke', scalar).attr('stroke-width', 2).attr('stroke-dasharray', '2 2');
      svg.append('circle').attr('cx', 28).attr('cy', 28).attr('r', 1.6).attr('fill', ink);
    }
  });
})();
