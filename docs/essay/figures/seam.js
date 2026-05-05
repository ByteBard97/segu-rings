/* Fig 4 — "The seam is a choice."
   Two static number lines, same data, two conventions:
     A: angles in [0°, 360°)        → 350° and 10° at the two ends, mean = 180° (south, wrong)
     B: angles in [-180°, 180°)     → -10° and 10° near the middle, mean = 0° (north, right)
   The formula (a + b) / 2 is identical; only the seam moved. */
(function () {
  const fig = document.getElementById('fig-seam');
  if (!fig) return;
  const svg = d3.select(fig.querySelector('.seam-svg'));

  const W = 720, H = 380;
  svg.attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
  const ink = 'var(--ink)', ink3 = 'var(--ink-3)';
  const scalar = 'var(--scalar)', vector = 'var(--vector)';

  const X0 = 80, X1 = 640, lineW = X1 - X0;

  function drawLine(opts) {
    const {
      yBase, kicker, eqText, eqColor,
      min, max, dots, mean, meanLabel, meanColor,
      endpointLeftCompass, endpointRightCompass,
    } = opts;
    const g = svg.append('g').attr('transform', `translate(0, ${yBase})`);
    const range = max - min;
    const xOf = v => X0 + ((v - min) / range) * lineW;

    // Section kicker
    g.append('text').attr('x', X0).attr('y', -56)
      .attr('font-family', 'Inter,sans-serif').attr('font-size', 11)
      .attr('letter-spacing', '0.16em').attr('fill', ink3).text(kicker);

    // Formula label, color-coded right/wrong
    g.append('text').attr('x', X0).attr('y', -36)
      .attr('font-family', 'JetBrains Mono,monospace').attr('font-size', 13)
      .attr('fill', eqColor).text(eqText);

    // Baseline
    g.append('line').attr('x1', X0).attr('y1', 0).attr('x2', X1).attr('y2', 0)
      .attr('stroke', ink).attr('stroke-width', 1);

    // Tick marks every 30°
    for (let v = min; v <= max; v += 30) {
      const x = xOf(v);
      const isMajor = (v === min || v === max || v === 0);
      g.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', isMajor ? 9 : 5)
        .attr('stroke', ink3);
    }

    // Endpoint numeric + compass labels (showing both ends are the same point on the circle)
    g.append('text').attr('x', X0).attr('y', 26)
      .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
      .attr('font-size', 11).attr('fill', ink3).text(min + '°');
    g.append('text').attr('x', X1).attr('y', 26)
      .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
      .attr('font-size', 11).attr('fill', ink3).text(max + '°');
    g.append('text').attr('x', X0).attr('y', 42)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 9).attr('letter-spacing', '0.1em')
      .attr('fill', ink3).text(endpointLeftCompass);
    g.append('text').attr('x', X1).attr('y', 42)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 9).attr('letter-spacing', '0.1em')
      .attr('fill', ink3).text(endpointRightCompass);

    // "seam" markers — the endpoints meet on the circle
    [X0, X1].forEach(x => {
      g.append('path')
        .attr('d', `M${x - 3},-10 L${x},-3 L${x + 3},-10`)
        .attr('fill', 'none').attr('stroke', ink3).attr('stroke-width', 1.2);
    });
    g.append('text').attr('x', (X0 + X1) / 2).attr('y', -68)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 9).attr('letter-spacing', '0.1em')
      .attr('fill', ink3).attr('opacity', 0).text(''); // reserved spacer

    // Data dots + numeric labels
    dots.forEach(({ value, label }) => {
      const x = xOf(value);
      g.append('circle').attr('cx', x).attr('cy', 0).attr('r', 5)
        .attr('fill', ink).attr('stroke', 'var(--paper)').attr('stroke-width', 2);
      g.append('text').attr('x', x).attr('y', -14)
        .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
        .attr('font-size', 11).attr('fill', ink).text(label);
    });

    // Bracket connecting the two data points (visual "(a + b) / 2 lives between these")
    const xs = dots.map(d => xOf(d.value)).sort((a, b) => a - b);
    g.append('path')
      .attr('d', `M${xs[0]},10 L${xs[0]},14 L${xs[1]},14 L${xs[1]},10`)
      .attr('fill', 'none').attr('stroke', ink3).attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2');

    // Mean marker
    const meanX = xOf(mean);
    g.append('line').attr('x1', meanX).attr('y1', -12).attr('x2', meanX).attr('y2', 18)
      .attr('stroke', meanColor).attr('stroke-width', 2).attr('stroke-dasharray', '4 3');
    g.append('circle').attr('cx', meanX).attr('cy', 0).attr('r', 6.5)
      .attr('fill', 'var(--paper)').attr('stroke', meanColor).attr('stroke-width', 2.5);
    g.append('text').attr('x', meanX).attr('y', 56)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 12).attr('font-weight', 600).attr('fill', meanColor)
      .text(meanLabel);
  }

  // Convention A: [0°, 360°) — wraps at the seam between the two angles → wrong answer
  drawLine({
    yBase: 130,
    kicker: 'CONVENTION A — angles in [0°, 360°)',
    eqText: '(350 + 10) / 2  =  180°',
    eqColor: scalar,
    min: 0, max: 360,
    dots: [{ value: 350, label: '350°' }, { value: 10, label: '10°' }],
    mean: 180,
    meanLabel: '180°  (south)',
    meanColor: scalar,
    endpointLeftCompass: 'NORTH',
    endpointRightCompass: 'NORTH',
  });

  // Convention B: [-180°, 180°) — same data, seam at south → right answer
  drawLine({
    yBase: 290,
    kicker: 'CONVENTION B — angles in [−180°, 180°)',
    eqText: '(−10 + 10) / 2  =  0°',
    eqColor: vector,
    min: -180, max: 180,
    dots: [{ value: -10, label: '−10°' }, { value: 10, label: '10°' }],
    mean: 0,
    meanLabel: '0°  (north)',
    meanColor: vector,
    endpointLeftCompass: 'SOUTH',
    endpointRightCompass: 'SOUTH',
  });
})();
