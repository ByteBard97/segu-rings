/* Fig: helix (3D). The line θ→z is the projection of the helix θ→(cos θ, sin θ, θ) along z.
   - Helix tube, several turns, colored by θ mod 2π (cyclic colormap)
   - Right: projection onto (x, y) — a unit circle catching all colors
   - Left/side: projection onto z — a vertical degree-marked line, monochrome
   - Two draggable points (slider for each θ) at compass-350 and compass-10
   - Live readouts: circle distance vs line distance
*/
(function () {
  const fig = document.getElementById('fig-helix');
  if (!fig || typeof THREE === 'undefined') return;
  const mount = fig.querySelector('.helix-mount');
  const inA = fig.querySelector('[data-input="ha"]');
  const inB = fig.querySelector('[data-input="hb"]');
  const outA = fig.querySelector('[data-out="ha"]');
  const outB = fig.querySelector('[data-out="hb"]');
  const outCircleD = fig.querySelector('[data-out="cd"]');
  const outLineD = fig.querySelector('[data-out="ld"]');
  const resetBtn = fig.querySelector('[data-action="reset-view"]');

  const W = mount.clientWidth || 1100;
  const H = 520;

  // CSS-var colors → hex strings for Three.js
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
  const cInk = cssHex('--ink');
  const cInk3 = cssHex('--ink-3');
  const cRule = cssHex('--rule');
  const cScalar = cssHex('--scalar');
  const cVector = cssHex('--vector');
  const cPaper = cssHex('--paper');

  const scene = new THREE.Scene();
  scene.background = cPaper;
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  const DEFAULT_CAM = new THREE.Vector3(8, 5, 9);
  camera.position.copy(DEFAULT_CAM);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(5, 8, 4);
  scene.add(dirLight);

  // --- helix tube, colored by θ mod 2π using cyclic HSL ---
  const TURNS = 3;
  const Z_PER_TURN = 2; // vertical separation per full revolution (in helix units)
  const RADIUS = 1;
  const SEGMENTS = 480;

  // Curve class for tube geometry
  class HelixCurve extends THREE.Curve {
    constructor() { super(); this.tMin = 0; this.tMax = TURNS * 2 * Math.PI; }
    getPoint(t, target) {
      const theta = this.tMin + (this.tMax - this.tMin) * t;
      const x = Math.cos(theta) * RADIUS;
      const y = Math.sin(theta) * RADIUS;
      const z = (theta / (2 * Math.PI)) * Z_PER_TURN - (TURNS / 2) * Z_PER_TURN;
      return (target || new THREE.Vector3()).set(x, z, y); // y/z swap so axis is vertical
    }
  }
  const curve = new HelixCurve();
  const tubeGeo = new THREE.TubeGeometry(curve, SEGMENTS, 0.04, 12, false);
  // assign vertex colors by θ mod 2π
  const colors = new Float32Array(tubeGeo.attributes.position.count * 3);
  const tmpColor = new THREE.Color();
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const theta = curve.tMin + (curve.tMax - curve.tMin) * t;
    const hue = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI);
    tmpColor.setHSL(hue, 0.55, 0.55);
    // each ring has 13 vertices (radialSegments+1)
    for (let j = 0; j <= 12; j++) {
      const idx = (i * 13 + j) * 3;
      if (idx + 2 < colors.length) {
        colors[idx] = tmpColor.r; colors[idx + 1] = tmpColor.g; colors[idx + 2] = tmpColor.b;
      }
    }
  }
  tubeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const tubeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);

  // --- ground unit circle (x,y projection) at z = -TURNS/2 * Z_PER_TURN - 0.5 ---
  const Z_BOTTOM = -(TURNS / 2) * Z_PER_TURN - 0.5;
  const Z_TOP = (TURNS / 2) * Z_PER_TURN + 0.5;

  // unit circle on the ground, colored
  const circlePts = [], circleColors = [];
  const N = 256;
  for (let i = 0; i <= N; i++) {
    const theta = (i / N) * 2 * Math.PI;
    circlePts.push(Math.cos(theta) * RADIUS, Z_BOTTOM, Math.sin(theta) * RADIUS);
    tmpColor.setHSL(theta / (2 * Math.PI), 0.55, 0.55);
    circleColors.push(tmpColor.r, tmpColor.g, tmpColor.b);
  }
  const circleGeo = new THREE.BufferGeometry();
  circleGeo.setAttribute('position', new THREE.Float32BufferAttribute(circlePts, 3));
  circleGeo.setAttribute('color', new THREE.Float32BufferAttribute(circleColors, 3));
  const circleMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 });
  scene.add(new THREE.Line(circleGeo, circleMat));

  // ground disc (faint paper)
  const discGeo = new THREE.CircleGeometry(RADIUS, 64);
  const discMat = new THREE.MeshBasicMaterial({ color: cPaper, transparent: true, opacity: 0.6 });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = Z_BOTTOM - 0.001;
  scene.add(disc);

  // --- vertical number line (z axis) at x = -1.8 ---
  const X_LINE = -1.8;
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(X_LINE, Z_BOTTOM, 0),
    new THREE.Vector3(X_LINE, Z_TOP, 0),
  ]);
  scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: cInk })));

  // tick marks every 90° on the line (just visual rhythm)
  for (let theta = -TURNS * Math.PI; theta <= TURNS * Math.PI; theta += Math.PI / 2) {
    const z = (theta / (2 * Math.PI)) * Z_PER_TURN;
    if (z < Z_BOTTOM || z > Z_TOP) continue;
    const isFull = Math.abs(((theta + 1e-6) % (2 * Math.PI))) < 1e-3 || Math.abs(((theta + 1e-6) % (2 * Math.PI)) - 2 * Math.PI) < 1e-3;
    const len = isFull ? 0.18 : 0.08;
    const t = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(X_LINE - len, z, 0),
      new THREE.Vector3(X_LINE, z, 0),
    ]);
    scene.add(new THREE.Line(t, new THREE.LineBasicMaterial({ color: isFull ? cInk3 : cRule })));
  }

  // --- two draggable points + their projections + projection lines ---
  const SPHERE_GEO = new THREE.SphereGeometry(0.08, 18, 18);
  const sphereMatA = new THREE.MeshStandardMaterial({ color: cInk });
  const sphereMatB = new THREE.MeshStandardMaterial({ color: cInk });
  const ptA = new THREE.Mesh(SPHERE_GEO, sphereMatA);
  const ptB = new THREE.Mesh(SPHERE_GEO, sphereMatB);
  scene.add(ptA, ptB);

  const projGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const projAcircle = new THREE.Mesh(projGeo, new THREE.MeshStandardMaterial({ color: cVector }));
  const projBcircle = new THREE.Mesh(projGeo, new THREE.MeshStandardMaterial({ color: cVector }));
  const projAline = new THREE.Mesh(projGeo, new THREE.MeshStandardMaterial({ color: cScalar }));
  const projBline = new THREE.Mesh(projGeo, new THREE.MeshStandardMaterial({ color: cScalar }));
  scene.add(projAcircle, projBcircle, projAline, projBline);

  // dashed projection lines (recreated per frame to update endpoints)
  let projLines = [];
  function addProjLine(a, b, color) {
    const g = new THREE.BufferGeometry().setFromPoints([a, b]);
    const m = new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06, opacity: 0.5, transparent: true });
    const line = new THREE.Line(g, m);
    line.computeLineDistances();
    scene.add(line); projLines.push(line);
  }
  function clearProjLines() { projLines.forEach(l => scene.remove(l)); projLines = []; }

  // helix-position helper, given thetaOnLine in radians (can be any z; cyclic via mod for the circle)
  function helixPos(theta) {
    return new THREE.Vector3(
      Math.cos(theta) * RADIUS,
      (theta / (2 * Math.PI)) * Z_PER_TURN,
      Math.sin(theta) * RADIUS
    );
  }
  function circlePos(theta) {
    return new THREE.Vector3(Math.cos(theta) * RADIUS, Z_BOTTOM, Math.sin(theta) * RADIUS);
  }
  function linePos(theta) {
    return new THREE.Vector3(X_LINE, (theta / (2 * Math.PI)) * Z_PER_TURN, 0);
  }

  function shortArcDeg(a, b) {
    return Math.abs(((b - a) % 360 + 540) % 360 - 180);
  }

  function updatePoints() {
    // slider values: -1080 .. +1080 (degrees on the line; cyclic on the circle)
    const aDeg = +inA.value;
    const bDeg = +inB.value;
    outA.textContent = aDeg + '°';
    outB.textContent = bDeg + '°';

    const aRad = aDeg * Math.PI / 180;
    const bRad = bDeg * Math.PI / 180;

    // clamp z to visible range (helix only renders ±TURNS turns)
    function clampZ(z) { return Math.max(Z_BOTTOM + 0.05, Math.min(Z_TOP - 0.05, z)); }

    const pA = helixPos(aRad); pA.y = clampZ(pA.y);
    const pB = helixPos(bRad); pB.y = clampZ(pB.y);
    ptA.position.copy(pA); ptB.position.copy(pB);

    const cA = circlePos(aRad), cB = circlePos(bRad);
    const lA = linePos(aRad); lA.y = clampZ(lA.y);
    const lB = linePos(bRad); lB.y = clampZ(lB.y);
    projAcircle.position.copy(cA); projBcircle.position.copy(cB);
    projAline.position.copy(lA); projBline.position.copy(lB);

    clearProjLines();
    addProjLine(pA, cA, cVector);
    addProjLine(pB, cB, cVector);
    addProjLine(pA, lA, cScalar);
    addProjLine(pB, lB, cScalar);

    // readouts
    const aCompass = ((aDeg % 360) + 360) % 360;
    const bCompass = ((bDeg % 360) + 360) % 360;
    outCircleD.textContent = shortArcDeg(aCompass, bCompass).toFixed(0) + '°';
    outLineD.textContent = Math.abs(aDeg - bDeg).toFixed(0) + '°';
  }

  // --- minimal orbit controls (no OrbitControls dep — small hand-rolled version) ---
  let isDragging = false, lastX = 0, lastY = 0;
  const target = new THREE.Vector3(0, 0, 0);
  let radius = camera.position.distanceTo(target);
  let azimuth = Math.atan2(camera.position.x, camera.position.z);
  let elevation = Math.asin(camera.position.y / radius);

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
    radius = Math.max(4, Math.min(30, radius * (1 + e.deltaY * 0.001)));
    applyCamera();
  }, { passive: false });

  resetBtn.addEventListener('click', () => {
    camera.position.copy(DEFAULT_CAM);
    radius = camera.position.distanceTo(target);
    azimuth = Math.atan2(camera.position.x, camera.position.z);
    elevation = Math.asin(camera.position.y / radius);
    applyCamera();
  });

  inA.addEventListener('input', updatePoints);
  inB.addEventListener('input', updatePoints);
  updatePoints();

  function loop() {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
  }
  loop();

  // Resize
  window.addEventListener('resize', () => {
    const w = mount.clientWidth || W;
    renderer.setSize(w, H);
    camera.aspect = w / H;
    camera.updateProjectionMatrix();
  });
})();
