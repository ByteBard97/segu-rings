/* Fig 7 — small diagrammatic sketches for the four pattern vignettes.
   Hand-rolled SVG. Tiny, glyph-like. */
(function () {
  const svgs = document.querySelectorAll('.pat-svg');
  const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
  const vector = 'var(--vector)', scalar = 'var(--scalar)';

  svgs.forEach(svg => {
    const sv = d3.select(svg);
    const kind = svg.dataset.pat;
    const W = 200, H = 120;

    if (kind === 'homog') {
      // 2D plane → 3D plane stacked, with a vector projecting down (divide by w)
      // Bottom plane (2D)
      sv.append('path').attr('d', 'M20,90 L80,75 L130,90 L70,105 Z')
        .attr('fill', 'var(--paper-2)').attr('stroke', rule);
      // Top plane (3D embed at w=1)
      sv.append('path').attr('d', 'M40,40 L100,25 L150,40 L90,55 Z')
        .attr('fill', 'var(--paper)').attr('stroke', ink3);
      // Lift arrow
      sv.append('line').attr('x1', 75).attr('y1', 90).attr('x2', 95).attr('y2', 50)
        .attr('stroke', vector).attr('stroke-width', 1.6);
      sv.append('circle').attr('cx', 95).attr('cy', 50).attr('r', 3.5).attr('fill', vector);
      sv.append('circle').attr('cx', 75).attr('cy', 90).attr('r', 3).attr('fill', ink);
      // dotted projection back
      sv.append('line').attr('x1', 95).attr('y1', 50).attr('x2', 75).attr('y2', 90)
        .attr('stroke', ink3).attr('stroke-dasharray', '2 2');
      sv.append('text').attr('x', 165).attr('y', 35).attr('font-family', 'JetBrains Mono,monospace')
        .attr('font-size', 9).attr('fill', ink3).text('w=1');
      sv.append('text').attr('x', 145).attr('y', 105).attr('font-family', 'JetBrains Mono,monospace')
        .attr('font-size', 9).attr('fill', ink3).text('w=0');
    } else if (kind === 'complex') {
      // line → plane with a rotation arc
      sv.append('line').attr('x1', 20).attr('y1', 80).attr('x2', 100).attr('y2', 80)
        .attr('stroke', ink).attr('stroke-width', 1);
      // dot on the line
      sv.append('circle').attr('cx', 80).attr('cy', 80).attr('r', 3.5).attr('fill', ink);
      // rotated up into the plane
      sv.append('line').attr('x1', 130).attr('y1', 80).attr('x2', 175).attr('y2', 80)
        .attr('stroke', rule);
      sv.append('line').attr('x1', 152).attr('y1', 35).attr('x2', 152).attr('y2', 105)
        .attr('stroke', rule);
      // unit circle
      sv.append('circle').attr('cx', 152).attr('cy', 70).attr('r', 22)
        .attr('fill', 'none').attr('stroke', ink3);
      // angle vector
      sv.append('line').attr('x1', 152).attr('y1', 70).attr('x2', 167).attr('y2', 55)
        .attr('stroke', vector).attr('stroke-width', 1.6);
      sv.append('circle').attr('cx', 167).attr('cy', 55).attr('r', 3.5).attr('fill', vector);
      // arc (rotation)
      sv.append('path').attr('d', 'M170,70 A18,18 0 0 0 167,55')
        .attr('fill', 'none').attr('stroke', vector).attr('stroke-width', 1)
        .attr('stroke-dasharray', '2 2');
      // bridge arrow
      sv.append('path').attr('d', 'M105,80 C115,80 115,80 125,80')
        .attr('fill', 'none').attr('stroke', ink3).attr('stroke-width', 1)
        .attr('marker-end', null);
      sv.append('polygon').attr('points', '125,80 119,77 119,83')
        .attr('fill', ink3);
    } else if (kind === 'onehot') {
      // categories on a line vs. as separate axes
      // left: labels on a number line (wrong)
      ['cat', 'dog', 'fox'].forEach((lab, i) => {
        const x = 25 + i * 25;
        sv.append('circle').attr('cx', x).attr('cy', 88).attr('r', 3).attr('fill', scalar);
        sv.append('text').attr('x', x).attr('y', 105).attr('text-anchor', 'middle')
          .attr('font-family', 'JetBrains Mono,monospace').attr('font-size', 9).attr('fill', ink3)
          .text(lab);
      });
      sv.append('line').attr('x1', 15).attr('y1', 88).attr('x2', 85).attr('y2', 88)
        .attr('stroke', scalar).attr('stroke-width', 1.2).attr('stroke-dasharray', '3 2');
      // right: three orthogonal axes (each a unit vector)
      const ox = 145, oy = 70;
      [[0, -25, 'cat'], [-22, 12, 'dog'], [22, 12, 'fox']].forEach(([dx, dy, lab]) => {
        sv.append('line').attr('x1', ox).attr('y1', oy).attr('x2', ox + dx).attr('y2', oy + dy)
          .attr('stroke', vector).attr('stroke-width', 1.4);
        sv.append('circle').attr('cx', ox + dx).attr('cy', oy + dy).attr('r', 3).attr('fill', vector);
      });
      sv.append('circle').attr('cx', ox).attr('cy', oy).attr('r', 1.8).attr('fill', ink);
    } else if (kind === 'codepoints') {
      // bytes (boxes) → codepoint (one glyph above)
      for (let i = 0; i < 4; i++) {
        sv.append('rect').attr('x', 20 + i * 18).attr('y', 70).attr('width', 16).attr('height', 22)
          .attr('fill', 'var(--paper-2)').attr('stroke', ink3);
        sv.append('text').attr('x', 28 + i * 18).attr('y', 85)
          .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
          .attr('font-size', 8).attr('fill', ink3).text('F0');
      }
      // bracket grouping
      sv.append('path').attr('d', 'M18,68 L18,62 L94,62 L94,68').attr('fill', 'none').attr('stroke', vector);
      // codepoint above
      sv.append('circle').attr('cx', 56).attr('cy', 38).attr('r', 12).attr('fill', 'none').attr('stroke', vector).attr('stroke-width', 1.6);
      sv.append('text').attr('x', 56).attr('y', 42).attr('text-anchor', 'middle')
        .attr('font-family', 'JetBrains Mono,monospace').attr('font-size', 11)
        .attr('fill', vector).text('U+');
      // arrow
      sv.append('line').attr('x1', 56).attr('y1', 50).attr('x2', 56).attr('y2', 60)
        .attr('stroke', vector).attr('stroke-width', 1);
      // right-side legend
      sv.append('text').attr('x', 115).attr('y', 45).attr('font-family', 'Inter,sans-serif')
        .attr('font-size', 10).attr('fill', vector).text('codepoint');
      sv.append('text').attr('x', 115).attr('y', 88).attr('font-family', 'Inter,sans-serif')
        .attr('font-size', 10).attr('fill', ink3).text('bytes');
    }
  });
})();
