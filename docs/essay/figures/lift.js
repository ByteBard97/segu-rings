/* Fig 5 — The lift (centerpiece).
   Arc-length-preserving bend: a line of length L wraps around an arc of total angle θ ∈ [0, 2π].
   Radius r = L / θ. Each point at signed offset u ∈ [-L/2, L/2] from the line's center maps to
   angle a = u / r on the circle (a=0 = top, ±θ/2 at the ends).

   Layout strategy:
     - Line maps degrees so that 180° sits at the LINE CENTER (u=0) and 0°/360° sit at the ENDS (u=±L/2).
       Therefore the seam (0/360) sits at the top of the circle when fully wrapped, and the wrong
       scalar midpoint (180°) sits at the bottom.
     - As θ varies, we re-pick the line length L so the bounding box of the resulting curve fits a
       fixed render box. At θ=0, line length is L0 (wide, short). At θ=2π, the circle's diameter
       must fit our render box. Since arc length is preserved, L = θ * r, and we cap r so the
       full circle fits the available height. We let L scale slightly with θ so the curve doesn't
       look like it's shrinking weirdly. Concretely: pick r = R_max for θ near 2π and shrink L when
       needed.
     - We CENTER the curve's bounding box vertically and horizontally inside a fixed RENDER frame.
*/
(function () {
  const fig = document.getElementById('fig-lift');
  if (!fig) return;
  const svg = d3.select(fig.querySelector('.lift-svg'));
  const input = fig.querySelector('[data-input="bend"]');

  const W = 1200, H = 560;
  svg.attr('viewBox', `0 0 ${W} ${H}`).attr('preserveAspectRatio', 'xMidYMid meet');
  const ink = 'var(--ink)', ink3 = 'var(--ink-3)', rule = 'var(--rule)';
  const scalar = 'var(--scalar)', vector = 'var(--vector)';

  // Render frame inside the SVG (leave room for labels + caption space)
  const FRAME = { x: 60, y: 110, w: W - 120, h: 380 };
  const cxF = FRAME.x + FRAME.w / 2;
  const cyF = FRAME.y + FRAME.h / 2;

  // Maximum radius so the full circle fits the frame
  const R_MAX = Math.min(FRAME.w, FRAME.h) / 2 - 20; // leave a small margin for ticks/labels

  // Choose a line length for θ=0 that uses most of the frame width
  const L_LINE = FRAME.w - 60;

  function radiusForTheta(theta) {
    // For θ near 2π we want r = R_MAX. For small θ, line dominates and r is huge — we just clamp.
    // r = L / θ; we'll pick L so that r = min(R_MAX, L_LINE / max(theta, ε))
    // Strategy: blend L from L_LINE down to 2π*R_MAX (full circumference) as theta grows.
    if (theta < 1e-3) return Infinity;
    const L_FULL = 2 * Math.PI * R_MAX;
    const blend = Math.min(1, theta / (2 * Math.PI));
    const L = L_LINE * (1 - blend) + L_FULL * blend;
    return L / theta;
  }
  function lengthForTheta(theta) {
    if (theta < 1e-3) return L_LINE;
    const L_FULL = 2 * Math.PI * R_MAX;
    const blend = Math.min(1, theta / (2 * Math.PI));
    return L_LINE * (1 - blend) + L_FULL * blend;
  }

  // u maps [-L/2, +L/2] over degrees [0, 360], with u=0 at degree 180 (the WRONG scalar midpoint).
  // degree d → u = ((d - 180 + 540) % 360 - 180) * (L / 360)
  function uOfDeg(deg, L) {
    const wrapped = ((deg - 180) % 360 + 540) % 360 - 180;
    return wrapped * (L / 360);
  }

  // Map u ∈ [-L/2, L/2] to (x, y) given theta.
  // The curve's bounding box is centered at (cxF, cyF).
  // At θ=0: curve is a horizontal line of length L through (cxF, cyF).
  // At θ>0: curve is an arc on a circle of radius r = L/θ. The arc spans angles [-θ/2, +θ/2].
  // We compute the bounding box of that arc and shift so its center sits at (cxF, cyF).
  function bendMap(u, theta, L) {
    if (theta < 1e-3) {
      return [cxF + u, cyF];
    }
    const r = L / theta;
    const a = u / r; // signed angle from "bottom-anchor" of curve
    // Local coordinates: BOTTOM of curve at (0, 0), the curve grows UPWARD (negative y).
    // u=0 (line center, scalar 180°) is the lowest point of the curve.
    // u=±L/2 (the seam, 0°/360°) wraps UP and meets at the TOP.
    // Point: (r*sin a, -r*(1 - cos a))
    const lx = r * Math.sin(a);
    const ly = -r * (1 - Math.cos(a));

    // Bounding box (y is negative going up):
    const half = theta / 2;
    let xMin, xMax, yMin, yMax;
    if (half <= Math.PI / 2) {
      xMin = -r * Math.sin(half); xMax = r * Math.sin(half);
      yMin = -r * (1 - Math.cos(half)); yMax = 0;
    } else if (half <= Math.PI) {
      xMin = -r;                  xMax = r;
      yMin = -r * (1 - Math.cos(half)); yMax = 0;
    } else {
      xMin = -r;                  xMax = r;
      yMin = -2 * r;              yMax = 0;
    }
    const bbCx = (xMin + xMax) / 2;
    const bbCy = (yMin + yMax) / 2;
    // Shift so bbCenter → (cxF, cyF)
    return [cxF + (lx - bbCx), cyF + (ly - bbCy)];
  }

  // ---- chrome / labels ----
  svg.append('text').attr('x', cxF).attr('y', 50)
    .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
    .attr('font-size', 11).attr('letter-spacing', '0.18em')
    .attr('fill', ink3).text('THE LIFT');
  svg.append('text').attr('x', cxF).attr('y', 78)
    .attr('text-anchor', 'middle').attr('font-family', 'Source Serif 4,serif')
    .attr('font-style', 'italic').attr('font-size', 18).attr('fill', 'var(--ink-2)')
    .text('the line bends — same math, true geometry');

  // ---- layers ----
  const curvePath = svg.append('path')
    .attr('fill', 'none').attr('stroke', ink).attr('stroke-width', 1.6)
    .attr('stroke-linecap', 'round');
  const tickLayer = svg.append('g');
  const hlLayer = svg.append('g');

  function render() {
    const t = +input.value / 1000;
    const theta = t * 2 * Math.PI;
    const L = lengthForTheta(theta);

    // sample curve
    const N = 280;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const u = -L / 2 + (L * i) / N;
      const [x, y] = bendMap(u, theta, L);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    curvePath.attr('d', d);

    // ticks every 30° (cardinals get longer ticks + labels)
    tickLayer.selectAll('*').remove();
    for (let deg = 0; deg <= 360; deg += 30) {
      const u = uOfDeg(deg, L);
      const [x, y] = bendMap(u, theta, L);
      const eps = Math.min(L * 0.003, 1.5);
      const [xa, ya] = bendMap(u - eps, theta, L);
      const [xb, yb] = bendMap(u + eps, theta, L);
      const dx = xb - xa, dy = yb - ya;
      const len = Math.hypot(dx, dy) || 1;
      // Outward normal: points away from the center of curvature.
      // The circle's center sits ABOVE the bottom of the curve (smaller y), so outward = downward
      // at the bottom and upward at the top. We compute a normal and pick the sign that
      // points outward.
      let nx = -dy / len, ny = dx / len;
      // Outward test: vector from approximate center to the point should align with normal.
      // Center is roughly at (cxF, cyF) for full bend, and "above" (smaller y) for partial bend.
      // For our anchored mapping, the center of the circle in screen space is (cxF + offsetX, ?).
      // Easier heuristic: outward is the direction AWAY from the chord midpoint between the
      // two seam endpoints. At θ=0 (line), force ABOVE (ny<0). At θ>0, outward = away from
      // the curve's vertical center.
      if (theta < 1e-3) {
        if (ny > 0) { nx = -nx; ny = -ny; }
      } else {
        // Sign so that the tick points away from cyF
        const dyFromCenter = y - cyF;
        if (dyFromCenter * ny < 0) { nx = -nx; ny = -ny; }
      }
      const isCardinal = (deg % 90 === 0) || deg === 360;
      const tlen = isCardinal ? 9 : 5;
      tickLayer.append('line')
        .attr('x1', x).attr('y1', y)
        .attr('x2', x + nx * tlen).attr('y2', y + ny * tlen)
        .attr('stroke', isCardinal ? ink3 : rule).attr('stroke-width', 1);
      // Suppress tick labels that would collide with the centerpiece labels:
      // - 180° tick collides with "scalar mean = 180°"
      // - 0° and 360° ticks collide with the 350°/10° highlights at high bend
      const suppressLabel =
        (deg === 180) ||
        ((deg === 0 || deg === 360) && theta > Math.PI * 0.7);
      if (isCardinal && !suppressLabel) {
        tickLayer.append('text')
          .attr('x', x + nx * (tlen + 14))
          .attr('y', y + ny * (tlen + 14) + 4)
          .attr('text-anchor', 'middle')
          .attr('font-family', 'JetBrains Mono,monospace')
          .attr('font-size', 11).attr('fill', ink3)
          .text(deg + '°');
      }
    }

    // highlight 350° and 10° + the two midpoints
    hlLayer.selectAll('*').remove();
    const HIGHLIGHTS = [350, 10];
    const pts = HIGHLIGHTS.map(deg => bendMap(uOfDeg(deg, L), theta, L));

    // chord between the two highlighted points (always shown — shows the geometric midpoint)
    hlLayer.append('line')
      .attr('x1', pts[0][0]).attr('y1', pts[0][1])
      .attr('x2', pts[1][0]).attr('y2', pts[1][1])
      .attr('stroke', vector).attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3').attr('opacity', 0.55);

    // scalar midpoint = u=0 (represents 180°) — sits at BOTTOM of the curve now.
    const [sx, sy] = bendMap(0, theta, L);
    // geometric midpoint = chord midpoint between 350° and 10° — sits near the TOP of the circle.
    const gx = (pts[0][0] + pts[1][0]) / 2;
    const gy = (pts[0][1] + pts[1][1]) / 2;

    // Draw the two midpoint dots
    hlLayer.append('circle').attr('cx', sx).attr('cy', sy).attr('r', 7)
      .attr('fill', 'var(--paper)').attr('stroke', scalar).attr('stroke-width', 2.4)
      .attr('stroke-dasharray', '3 2');
    hlLayer.append('circle').attr('cx', gx).attr('cy', gy).attr('r', 6).attr('fill', vector);

    // Label placement: scalar label BELOW its dot (curve grows up, so 180° is at the bottom);
    // geometric label ABOVE its dot. At low θ the two midpoints overlap, so we widen the offset.
    const sep = Math.max(0, 1 - theta / Math.PI);
    const sLabY = sy + 36 + sep * 22;
    const gLabY = gy - 26 - sep * 26;

    hlLayer.append('line').attr('x1', sx).attr('y1', sy + 9).attr('x2', sx).attr('y2', sLabY - 14)
      .attr('stroke', scalar).attr('stroke-width', 0.8).attr('stroke-dasharray', '2 2').attr('opacity', 0.6);
    hlLayer.append('text')
      .attr('x', sx).attr('y', sLabY)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 12).attr('font-weight', 600).attr('fill', scalar)
      .text('scalar mean = 180°');

    hlLayer.append('line').attr('x1', gx).attr('y1', gy - 8).attr('x2', gx).attr('y2', gLabY + 4)
      .attr('stroke', vector).attr('stroke-width', 0.8).attr('stroke-dasharray', '2 2').attr('opacity', 0.6);
    hlLayer.append('text')
      .attr('x', gx).attr('y', gLabY)
      .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
      .attr('font-size', 12).attr('font-weight', 600).attr('fill', vector)
      .text('geometric mean = 0°');

    // The two angle dots — drawn last so they sit on top
    pts.forEach(([x, y], i) => {
      hlLayer.append('circle').attr('cx', x).attr('cy', y).attr('r', 6)
        .attr('fill', ink).attr('stroke', 'var(--paper)').attr('stroke-width', 2);
      const eps = Math.min(L * 0.003, 1.5);
      const u = uOfDeg(HIGHLIGHTS[i], L);
      const [xa, ya] = bendMap(u - eps, theta, L);
      const [xb, yb] = bendMap(u + eps, theta, L);
      const dx = xb - xa, dy = yb - ya;
      const len = Math.hypot(dx, dy) || 1;
      // outward normal — same sign convention as ticks
      let nx = -dy / len, ny = dx / len;
      if (theta < 1e-3) {
        if (ny > 0) { nx = -nx; ny = -ny; } // above the line
      } else {
        const dyFromCenter = y - cyF;
        if (dyFromCenter * ny < 0) { nx = -nx; ny = -ny; }
      }
      hlLayer.append('text')
        .attr('x', x + nx * 24).attr('y', y + ny * 24 + 4)
        .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
        .attr('font-size', 12).attr('font-weight', 500).attr('fill', ink)
        .text(HIGHLIGHTS[i] + '°');
    });
  }

  input.addEventListener('input', render);
  render();
})();
