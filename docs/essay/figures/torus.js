/* Fig: torus (3D, small).
   Auto-rotating torus colored by a smooth bivariate field f(θ, φ).
   Beside it, the same field shown as a 2D rectangle with discontinuities along all four edges
   (just SVG; we render the same field in [0, 2π]² mapped to a rect, then highlight the seams).
*/
(function () {
  const fig = document.getElementById('fig-torus');
  if (!fig || typeof THREE === 'undefined') return;
  const mount = fig.querySelector('.torus-mount');
  const flatSvg = d3.select(fig.querySelector('.torus-flat'));

  const W = mount.clientWidth || 380, H = 300;
  function cssHex(varName) {
    const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return new THREE.Color(d[0] / 255, d[1] / 255, d[2] / 255);
  }
  const cPaper = cssHex('--paper'), cScalar = cssHex('--scalar');

  // Field f(θ, φ) — smooth on the torus, made of low-frequency cyclic functions
  function field(theta, phi) {
    return 0.5 + 0.5 * Math.sin(2 * theta) * Math.cos(3 * phi - 0.7);
  }
  function fieldColor(t, target) {
    // viridis-ish two-stop
    const a = new THREE.Color(0.18, 0.20, 0.40);
    const b = new THREE.Color(0.32, 0.62, 0.78);
    const c = new THREE.Color(0.92, 0.85, 0.40);
    const out = target || new THREE.Color();
    if (t < 0.5) out.copy(a).lerp(b, t / 0.5);
    else out.copy(b).lerp(c, (t - 0.5) / 0.5);
    return out;
  }

  // ---- Three.js torus ----
  const scene = new THREE.Scene();
  scene.background = cPaper;
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
  camera.position.set(2.6, 1.6, 3);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dl = new THREE.DirectionalLight(0xffffff, 0.6);
  dl.position.set(3, 5, 2); scene.add(dl);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  const TUBE = 0.32, RAD = 0.9;
  const TS = 80, PS = 32;
  const pos = new Float32Array((TS + 1) * (PS + 1) * 3);
  const col = new Float32Array((TS + 1) * (PS + 1) * 3);
  const idx = [];
  const tmpColor = new THREE.Color();
  for (let i = 0; i <= TS; i++) {
    const theta = (i / TS) * 2 * Math.PI;
    for (let j = 0; j <= PS; j++) {
      const phi = (j / PS) * 2 * Math.PI;
      const cx = (RAD + TUBE * Math.cos(phi)) * Math.cos(theta);
      const cy = TUBE * Math.sin(phi);
      const cz = (RAD + TUBE * Math.cos(phi)) * Math.sin(theta);
      const k = (i * (PS + 1) + j) * 3;
      pos[k] = cx; pos[k + 1] = cy; pos[k + 2] = cz;
      fieldColor(field(theta, phi), tmpColor);
      col[k] = tmpColor.r; col[k + 1] = tmpColor.g; col[k + 2] = tmpColor.b;
    }
  }
  for (let i = 0; i < TS; i++) {
    for (let j = 0; j < PS; j++) {
      const a = i * (PS + 1) + j;
      const b = a + 1;
      const c = a + (PS + 1);
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
  const torus = new THREE.Mesh(geo, mat);
  scene.add(torus);

  function loop() {
    requestAnimationFrame(loop);
    torus.rotation.y += 0.004;
    torus.rotation.x = 0.4;
    renderer.render(scene, camera);
  }
  loop();

  // ---- Flat unrolled SVG ----
  const FW = 220, FH = 160;
  flatSvg.attr('viewBox', `0 0 ${FW + 60} ${FH + 60}`);
  // raster the field into a small image (data URL of canvas)
  const PX = 90, PY = 60;
  const canvas = document.createElement('canvas');
  canvas.width = PX; canvas.height = PY;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(PX, PY);
  for (let j = 0; j < PY; j++) {
    for (let i = 0; i < PX; i++) {
      const theta = (i / PX) * 2 * Math.PI;
      const phi = (j / PY) * 2 * Math.PI;
      fieldColor(field(theta, phi), tmpColor);
      const k = (j * PX + i) * 4;
      img.data[k] = tmpColor.r * 255;
      img.data[k + 1] = tmpColor.g * 255;
      img.data[k + 2] = tmpColor.b * 255;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  flatSvg.append('image')
    .attr('x', 30).attr('y', 30).attr('width', FW).attr('height', FH)
    .attr('href', canvas.toDataURL());

  // seam highlights — all four edges
  flatSvg.append('rect').attr('x', 30).attr('y', 30).attr('width', FW).attr('height', FH)
    .attr('fill', 'none').attr('stroke', 'var(--scalar)').attr('stroke-width', 2)
    .attr('stroke-dasharray', '4 3');

  // axis labels
  flatSvg.append('text').attr('x', 30 + FW / 2).attr('y', 22)
    .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
    .attr('font-size', 10).attr('fill', 'var(--ink-3)').text('θ → 2π');
  flatSvg.append('text').attr('x', 14).attr('y', 30 + FH / 2)
    .attr('text-anchor', 'middle').attr('font-family', 'JetBrains Mono,monospace')
    .attr('font-size', 10).attr('fill', 'var(--ink-3)')
    .attr('transform', `rotate(-90 14 ${30 + FH / 2})`).text('φ → 2π');
  flatSvg.append('text').attr('x', 30 + FW / 2).attr('y', 30 + FH + 22)
    .attr('text-anchor', 'middle').attr('font-family', 'Inter,sans-serif')
    .attr('font-size', 10).attr('fill', 'var(--scalar)').attr('font-weight', 600)
    .text('four seams from one flatten');

  window.addEventListener('resize', () => {
    const w = mount.clientWidth || W;
    renderer.setSize(w, H);
    camera.aspect = w / H;
    camera.updateProjectionMatrix();
  });
})();
