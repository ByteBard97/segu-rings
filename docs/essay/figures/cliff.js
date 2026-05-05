/* Fig: cliff over the disk (3D).
   The unit disk in the (x,y) plane. Height z(x,y) = angular distance from a fixed reference angle.
   The surface is smooth on the unit circle but has a radial cliff from the disk's center to the
   antipode of the reference. Slider rotates the reference; cliff rotates with it.
   Two draggable angles on the circle (sliders); chord drawn underneath; chord midpoint with
   a vertical line going up to the surface — its height is the wrong scalar answer.
*/
(function () {
  const fig = document.getElementById('fig-cliff');
  if (!fig || typeof THREE === 'undefined') return;
  const mount = fig.querySelector('.cliff-mount');
  const inRef = fig.querySelector('[data-input="ref"]');
  const inA = fig.querySelector('[data-input="ca"]');
  const inB = fig.querySelector('[data-input="cb"]');
  const outRef = fig.querySelector('[data-out="ref"]');
  const outA = fig.querySelector('[data-out="ca"]');
  const outB = fig.querySelector('[data-out="cb"]');
  const outScalar = fig.querySelector('[data-out="cliff-scalar"]');
  const outVec = fig.querySelector('[data-out="cliff-vec"]');
  const resetBtn = fig.querySelector('[data-action="reset-view"]');

  const W = mount.clientWidth || 1100, H = 520;

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
  const cInk = cssHex('--ink'), cInk3 = cssHex('--ink-3'), cRule = cssHex('--rule');
  const cScalar = cssHex('--scalar'), cVector = cssHex('--vector'), cPaper = cssHex('--paper');

  const COLOR_A = cScalar, COLOR_B = cVector;
  const hexA = '#' + COLOR_A.getHexString();
  const hexB = '#' + COLOR_B.getHexString();

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    [data-input="ca"]::-webkit-slider-thumb { background: ${hexA} !important; border-color: ${hexA} !important; }
    [data-input="ca"]::-moz-range-thumb     { background: ${hexA} !important; border-color: ${hexA} !important; }
    [data-input="cb"]::-webkit-slider-thumb { background: ${hexB} !important; border-color: ${hexB} !important; }
    [data-input="cb"]::-moz-range-thumb     { background: ${hexB} !important; border-color: ${hexB} !important; }
  `;
  document.head.appendChild(styleEl);

  const scene = new THREE.Scene();
  scene.background = cPaper;
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
  const DEFAULT_CAM = new THREE.Vector3(3.4, 3.6, 3.4);
  camera.position.copy(DEFAULT_CAM);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(5, 8, 3); scene.add(dirLight);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  // --- height field ---
  // height(x, y; ref) = angular distance from ref, clamped, scaled.
  // angular distance in [0, 2π]; height = ang_dist (scaled to ~π for visual).
  const HEIGHT_SCALE = 0.5;
  function angularDist(theta, ref) {
    // raw |theta - ref| in [0, 2π], no wrapping → produces the cliff at theta = ref + 2π
    let d = theta - ref;
    // if we want a single cliff at antipode, use atan2-style branch: wrap into [-π, π], then take abs
    // But the brief wants a cliff at the antipode growing from center outward —
    // i.e., the function (theta - ref) mod 2π ∈ [0, 2π) — this jumps from 2π to 0 across the seam.
    // Height = that. Cliff is from 0 to 2π at ref + 2π (antipode crossing on the outer ring,
    // and along the radial cut to the center).
    return ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  // Build the surface as a parametric mesh on (r, theta) grid.
  const RR = 1.0;
  const RR_SEG = 50, TT_SEG = 200;
  const positions = [];
  const indices = [];
  const colors = [];
  // We rebuild the surface per render (cliff rotates with ref).
  let surfaceMesh = null;

  function buildSurface(ref) {
    const pos = new Float32Array((RR_SEG + 1) * (TT_SEG + 1) * 3);
    const col = new Float32Array((RR_SEG + 1) * (TT_SEG + 1) * 3);
    const idx = [];
    const tmpColor = new THREE.Color();
    for (let i = 0; i <= RR_SEG; i++) {
      const r = (i / RR_SEG) * RR;
      for (let j = 0; j <= TT_SEG; j++) {
        const theta = (j / TT_SEG) * 2 * Math.PI;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const h = angularDist(theta, ref) * HEIGHT_SCALE;
        const k = (i * (TT_SEG + 1) + j) * 3;
        pos[k] = x; pos[k + 1] = h; pos[k + 2] = y;
        // colormap: viridis-ish (blue → green → yellow), with cliff face flagged
        // The cliff face spans a tiny azimuth wedge across (ref + 2π). We detect cliff by
        // local angular distance to that seam.
        const seamTheta = ((ref + 2 * Math.PI) % (2 * Math.PI));
        const dToSeam = Math.min(Math.abs(theta - seamTheta), 2 * Math.PI - Math.abs(theta - seamTheta));
        const isCliff = dToSeam < 0.04 && r > 0.0;
        if (isCliff) {
          tmpColor.copy(cScalar);
        } else {
          // viridis-like via interpolating ink ↔ vector
          const t = h / (2 * Math.PI * HEIGHT_SCALE); // 0..1
          // simple two-stop blend: deep navy → vector blue → soft yellow
          const a = new THREE.Color(0.18, 0.20, 0.36);
          const b = new THREE.Color(0.30, 0.55, 0.78);
          const c = new THREE.Color(0.85, 0.82, 0.45);
          if (t < 0.5) tmpColor.copy(a).lerp(b, t / 0.5);
          else tmpColor.copy(b).lerp(c, (t - 0.5) / 0.5);
        }
        col[k] = tmpColor.r; col[k + 1] = tmpColor.g; col[k + 2] = tmpColor.b;
      }
    }
    for (let i = 0; i < RR_SEG; i++) {
      for (let j = 0; j < TT_SEG; j++) {
        const a = i * (TT_SEG + 1) + j;
        const b = a + 1;
        const c = a + (TT_SEG + 1);
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function rebuildSurface(ref) {
    if (surfaceMesh) {
      surfaceMesh.geometry.dispose();
      scene.remove(surfaceMesh);
    }
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.7, metalness: 0.05,
      side: THREE.DoubleSide, flatShading: false,
      transparent: true, opacity: 0.5, depthWrite: false,
    });
    surfaceMesh = new THREE.Mesh(buildSurface(ref), mat);
    scene.add(surfaceMesh);
  }

  // unit circle at the base of the surface
  const basePts = [];
  for (let i = 0; i <= 128; i++) {
    const t = (i / 128) * 2 * Math.PI;
    basePts.push(new THREE.Vector3(Math.cos(t) * RR, 0.001, Math.sin(t) * RR));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(basePts),
    new THREE.LineBasicMaterial({ color: cInk })));

  // axes
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0)]),
    new THREE.LineBasicMaterial({ color: cRule })));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -1.3), new THREE.Vector3(0, 0, 1.3)]),
    new THREE.LineBasicMaterial({ color: cRule })));

  // reference marker (small triangle on the rim)
  const refMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: cInk })
  );
  scene.add(refMarker);

  // input dots & chord
  const SPH = new THREE.SphereGeometry(0.06, 16, 16);
  const dotA = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: COLOR_A }));
  const dotB = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: COLOR_B }));
  scene.add(dotA, dotB);

  // HTML labels
  mount.style.position = 'relative';
  const labelStyle = `position:absolute;pointer-events:none;font-family:Inter,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.05em;white-space:nowrap;`;
  const labelA = Object.assign(document.createElement('div'), { textContent: 'a' });
  const labelB = Object.assign(document.createElement('div'), { textContent: 'b' });
  labelA.style.cssText = labelStyle + `color:${hexA};`;
  labelB.style.cssText = labelStyle + `color:${hexB};`;
  mount.appendChild(labelA);
  mount.appendChild(labelB);

  function updateLabel(label, mesh) {
    const v = mesh.position.clone().project(camera);
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    label.style.left = ((v.x + 1) / 2 * w + 10) + 'px';
    label.style.top  = (-(v.y - 1) / 2 * h - 6) + 'px';
  }

  let chord = null, midRiser = null, midDot = null, midDotTop = null;

  function clearChord() {
    [chord, midRiser, midDot, midDotTop].forEach(o => { if (o) { scene.remove(o); o.geometry.dispose(); } });
    chord = midRiser = midDot = midDotTop = null;
  }

  function update() {
    const ref = +inRef.value, aDeg = +inA.value, bDeg = +inB.value;
    outRef.textContent = ref + '°';
    outA.textContent = aDeg + '°';
    outB.textContent = bDeg + '°';

    const refRad = ref * Math.PI / 180;
    const aRad = aDeg * Math.PI / 180;
    const bRad = bDeg * Math.PI / 180;

    rebuildSurface(refRad);

    // marker on rim at ref
    refMarker.position.set(Math.cos(refRad) * (RR + 0.08), 0.07, Math.sin(refRad) * (RR + 0.08));
    refMarker.lookAt(0, 0.07, 0);
    refMarker.rotateX(Math.PI / 2);

    const ax = Math.cos(aRad) * RR, az = Math.sin(aRad) * RR;
    const bx = Math.cos(bRad) * RR, bz = Math.sin(bRad) * RR;
    dotA.position.set(ax, 0.01, az);
    dotB.position.set(bx, 0.01, bz);

    clearChord();
    chord = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ax, 0.005, az),
        new THREE.Vector3(bx, 0.005, bz),
      ]),
      new THREE.LineBasicMaterial({ color: cInk })
    );
    scene.add(chord);

    // midpoint
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    // scalar (degree-space) average heading
    const scalarMidDeg = ((aDeg + bDeg) / 2 + 360) % 360;
    const scalarMidRad = scalarMidDeg * Math.PI / 180;
    // height at the midpoint: scalar approach evaluates angularDist(scalarMidRad - ref) in degree space.
    // But the bug is more vivid via: height(scalar mid in θ-space) — i.e., the vertical riser goes up
    // from the chord's midpoint to where the surface is at angle scalarMidRad (project onto the ring).
    // We'll show two things: the chord midpoint inside the disk, and a riser to the surface point at scalarMidRad.
    const surfX = Math.cos(scalarMidRad) * RR, surfZ = Math.sin(scalarMidRad) * RR;
    const surfH = angularDist(scalarMidRad, refRad) * HEIGHT_SCALE;

    // chord midpoint dot
    midDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 14, 14),
      new THREE.MeshStandardMaterial({ color: cScalar })
    );
    midDot.position.set(mx, 0.01, mz);
    scene.add(midDot);

    // riser from surface ring at scalarMid up to its surface height
    midRiser = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(surfX, 0.005, surfZ),
        new THREE.Vector3(surfX, surfH, surfZ),
      ]),
      new THREE.LineBasicMaterial({ color: cScalar })
    );
    scene.add(midRiser);

    midDotTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 14, 14),
      new THREE.MeshStandardMaterial({ color: cScalar })
    );
    midDotTop.position.set(surfX, surfH, surfZ);
    scene.add(midDotTop);

    // readouts
    outScalar.textContent = (((scalarMidDeg - ref) % 360 + 360) % 360).toFixed(0) + '°';
    // geometric (vector) midpoint angle
    const ar = aDeg * Math.PI / 180, br = bDeg * Math.PI / 180;
    const gx = (Math.cos(ar) + Math.cos(br)) / 2;
    const gy = (Math.sin(ar) + Math.sin(br)) / 2;
    const geomDeg = ((Math.atan2(gy, gx) * 180 / Math.PI) + 360) % 360;
    outVec.textContent = (((geomDeg - ref) % 360 + 360) % 360).toFixed(0) + '°';
  }

  // orbit controls (same as helix)
  let isDragging = false, lastX = 0, lastY = 0;
  const target = new THREE.Vector3(0, 0.4, 0);
  let radius = camera.position.distanceTo(target);
  let azimuth = Math.atan2(camera.position.x, camera.position.z);
  let elevation = Math.asin((camera.position.y - target.y) / radius);
  function applyCamera() {
    camera.position.set(
      target.x + radius * Math.cos(elevation) * Math.sin(azimuth),
      target.y + radius * Math.sin(elevation),
      target.z + radius * Math.cos(elevation) * Math.cos(azimuth)
    );
    camera.lookAt(target);
  }
  applyCamera();
  renderer.domElement.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    azimuth -= dx * 0.006;
    elevation = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, elevation + dy * 0.006));
    applyCamera();
  });
  renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();
    radius = Math.max(2, Math.min(15, radius * (1 + e.deltaY * 0.001)));
    applyCamera();
  }, { passive: false });

  resetBtn.addEventListener('click', () => {
    camera.position.copy(DEFAULT_CAM);
    radius = camera.position.distanceTo(target);
    azimuth = Math.atan2(camera.position.x, camera.position.z);
    elevation = Math.asin((camera.position.y - target.y) / radius);
    applyCamera();
  });

  [inRef, inA, inB].forEach(i => i.addEventListener('input', update));
  update();

  function loop() {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
    updateLabel(labelA, dotA);
    updateLabel(labelB, dotB);
  }
  loop();
  window.addEventListener('resize', () => {
    const w = mount.clientWidth || W;
    renderer.setSize(w, H);
    camera.aspect = w / H;
    camera.updateProjectionMatrix();
  });
})();
