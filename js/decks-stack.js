/**
 * Goodform — Deck stack for the Our work / portfolio hero.
 * Drop-in: requires vendor/three.min.js. Mounts on #decks-canvas.
 * No frame. Three grid plates, poles, cube. Always-on motion + mouse + scroll.
 */
(function () {
  if (typeof THREE === "undefined") return;
  var canvas = document.getElementById("decks-canvas");
  if (!canvas) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointer = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var hover = 0;
  var hoverT = 0;
  var drive = 0.35;
  var driveT = 0.35;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 2.35, 6.4);
  camera.lookAt(0, 0.15, 0);

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  if (renderer.outputColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;

  var CYAN = 0x7ee8e0;
  var CYAN_HOT = 0xc8fff8;
  var PURPLE = 0x9b7bff;
  var EMBER = 0xff6b4a;
  var WHITE = 0xe8f4f4;

  function gridGeo(w, d, nx, nz) {
    var pts = [];
    var i, x, z;
    for (i = 0; i <= nx; i++) {
      x = -w / 2 + (i / nx) * w;
      pts.push(x, 0, -d / 2, x, 0, d / 2);
    }
    for (i = 0; i <= nz; i++) {
      z = -d / 2 + (i / nz) * d;
      pts.push(-w / 2, 0, z, w / 2, 0, z);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }

  var PLATES = [
    { y: 1.18, color: CYAN, fill: 0x133a38, w: 4.35, d: 2.35, nx: 10, nz: 6 },
    { y: 0.08, color: PURPLE, fill: 0x1a1438, w: 4.35, d: 2.35, nx: 10, nz: 6 },
    { y: -1.02, color: EMBER, fill: 0x3a1812, w: 4.35, d: 2.35, nx: 10, nz: 6 },
  ];

  var root = new THREE.Group();
  scene.add(root);

  var plates = [];
  PLATES.forEach(function (spec, idx) {
    var g = new THREE.Group();
    var lines = new THREE.LineSegments(
      gridGeo(spec.w, spec.d, spec.nx, spec.nz),
      new THREE.LineBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
      })
    );
    var glow = lines.clone();
    glow.material = lines.material.clone();
    glow.material.opacity = 0.22;
    glow.scale.set(1.01, 1, 1.01);
    var fill = new THREE.Mesh(
      new THREE.PlaneGeometry(spec.w, spec.d),
      new THREE.MeshBasicMaterial({
        color: spec.fill,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = -0.01;
    var rim = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-spec.w / 2, 0, -spec.d / 2),
        new THREE.Vector3(spec.w / 2, 0, -spec.d / 2),
        new THREE.Vector3(spec.w / 2, 0, spec.d / 2),
        new THREE.Vector3(-spec.w / 2, 0, spec.d / 2),
      ]),
      new THREE.LineBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.95,
        toneMapped: false,
      })
    );
    var scan = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.02, spec.d * 0.96),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.7,
        toneMapped: false,
      })
    );
    scan.position.y = 0.02;
    g.add(fill, lines, glow, rim, scan);
    g.position.y = spec.y;
    g.userData = { spec: spec, idx: idx, scan: scan };
    root.add(g);
    plates.push(g);
  });

  var POSTS = [
    { x: -1.55, z: -0.72 },
    { x: -0.52, z: -0.88 },
    { x: 0.62, z: -0.7 },
    { x: 1.52, z: -0.82 },
  ];
  var posts = [];
  POSTS.forEach(function (p) {
    var g = new THREE.Group();
    var h = 2.42;
    var pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, h, 0.028),
      new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.72, toneMapped: false })
    );
    pole.position.y = h / 2 - 1.08;
    var cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.95, toneMapped: false })
    );
    cap.position.y = h - 1.08;
    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshBasicMaterial({
        color: CYAN_HOT,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        toneMapped: false,
      })
    );
    halo.position.copy(cap.position);
    g.add(pole, cap, halo);
    g.position.set(p.x, 0, p.z);
    g.userData.halo = halo;
    g.userData.cap = cap;
    root.add(g);
    posts.push(g);
  });

  var cube = new THREE.Group();
  var cubeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.38, 0.38),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.88, toneMapped: false })
  );
  var cubeGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.62, 0.62),
    new THREE.MeshBasicMaterial({
      color: CYAN_HOT,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      toneMapped: false,
    })
  );
  cube.add(cubeBody, cubeGlow);
  root.add(cube);

  var dustN = 42;
  var dust = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.04, 0.04, 0.04),
    new THREE.MeshBasicMaterial({ toneMapped: false }),
    dustN
  );
  var dummy = new THREE.Object3D();
  var col = new THREE.Color();
  var dustCols = [CYAN, PURPLE, EMBER, 0xf0c96a, 0x8ec8c4];
  var dustSeeds = [];
  for (var di = 0; di < dustN; di++) {
    var hx = Math.sin(di * 12.7) * 43758.5;
    var hy = Math.sin(di * 19.3) * 23421.1;
    var hz = Math.sin(di * 7.1) * 9123.4;
    var seed = {
      x: (hx - Math.floor(hx) - 0.5) * 7.2,
      y: (hy - Math.floor(hy) - 0.5) * 3.4,
      z: (hz - Math.floor(hz) - 0.5) * 4.2,
      ph: di * 0.41,
    };
    dummy.position.set(seed.x, seed.y, seed.z);
    dummy.updateMatrix();
    dust.setMatrixAt(di, dummy.matrix);
    col.setHex(dustCols[di % dustCols.length]);
    dust.setColorAt(di, col);
    dustSeeds.push(seed);
  }
  dust.instanceMatrix.needsUpdate = true;
  if (dust.instanceColor) dust.instanceColor.needsUpdate = true;
  root.add(dust);

  function smooth(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t);
    return a + (b - a) * t;
  }
  function seqY(cycle) {
    // looping choreography: rest → fan → cube up → cube down → rest
    if (cycle < 0.22) return smooth(0, 1, cycle / 0.22);
    if (cycle < 0.42) return 1;
    if (cycle < 0.62) return smooth(1, 0.15, (cycle - 0.42) / 0.2);
    if (cycle < 0.82) return smooth(0.15, 0, (cycle - 0.62) / 0.2);
    return 0;
  }
  function seqCube(cycle) {
    if (cycle < 0.22) return 0;
    if (cycle < 0.4) return smooth(0, 1, (cycle - 0.22) / 0.18);
    if (cycle < 0.55) return 1;
    if (cycle < 0.78) return smooth(1, -0.85, (cycle - 0.55) / 0.23);
    if (cycle < 0.92) return smooth(-0.85, 0, (cycle - 0.78) / 0.14);
    return 0;
  }

  function resize() {
    var w = canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || 520;
    var h = canvas.clientHeight || (canvas.parentElement && canvas.parentElement.clientHeight) || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  canvas.parentElement && (canvas.parentElement.style.pointerEvents = "auto");
  window.addEventListener(
    "pointermove",
    function (e) {
      var rect = canvas.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      target.x = (e.clientX - cx) / Math.max(1, rect.width * 0.5);
      target.y = -((e.clientY - cy) / Math.max(1, rect.height * 0.5));
      hoverT =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
          ? 1
          : 0;
    },
    { passive: true }
  );

  function updateDriveFromScroll() {
    var rect = canvas.getBoundingClientRect();
    var mid = rect.top + rect.height / 2;
    var view = window.innerHeight / 2;
    var dist = (mid - view) / Math.max(1, window.innerHeight);
    driveT = 0.32 + Math.max(-0.25, Math.min(0.55, -dist * 0.7));
  }
  window.addEventListener("scroll", updateDriveFromScroll, { passive: true });
  updateDriveFromScroll();

  var clock = new THREE.Clock();
  function tick() {
    var t = clock.getElapsedTime();
    var k = reduce ? 0.28 : 1;
    pointer.x += (target.x - pointer.x) * 0.07;
    pointer.y += (target.y - pointer.y) * 0.07;
    hover += (hoverT - hover) * 0.08;
    drive += (driveT - drive) * 0.06;

    var cycle = ((t * 0.12 * k) % 1 + 1) % 1;
    var fan = seqY(cycle) * 0.55 + hover * 0.35 + (drive - 0.32) * 0.9;
    var hop = seqCube(cycle) * 0.95 + hover * 0.18;

    root.rotation.y = Math.sin(t * 0.16 * k) * 0.18 + pointer.x * 0.32;
    root.rotation.x = 0.18 + Math.sin(t * 0.11 * k) * 0.05 - pointer.y * 0.22;

    plates.forEach(function (g) {
      var i = g.userData.idx;
      var base = g.userData.spec.y;
      var sign = i - 1;
      g.position.y = base + fan * sign * 0.42 + Math.sin(t * 0.7 * k + i) * 0.04;
      g.position.x = pointer.x * (0.18 + (2 - i) * 0.07);
      g.position.z = pointer.y * (0.08 + i * 0.03);
      g.rotation.z = pointer.x * (0.05 - i * 0.02);
      g.rotation.y = Math.sin(t * 0.2 * k + i) * 0.03;
      var scan = g.userData.scan;
      var u = (t * (0.22 + i * 0.05) * k + i * 0.33) % 1;
      scan.position.x = -2.05 + u * 4.1;
      scan.material.opacity = 0.35 + 0.4 * Math.sin(u * Math.PI);
    });

    cube.position.x = Math.sin(t * 0.55 * k) * 0.62 + pointer.x * 0.7;
    cube.position.z = Math.cos(t * 0.42 * k) * 0.38 + pointer.y * 0.35;
    cube.position.y = 0.32 + hop * 0.95 + Math.sin(t * 1.4 * k) * 0.06;
    cube.rotation.x = t * 0.65 * k;
    cube.rotation.y = t * 0.85 * k + pointer.x * 0.4;
    var cs = 1 + hover * 0.12 + Math.sin(t * 2.1 * k) * 0.04;
    cube.scale.setScalar(cs);

    posts.forEach(function (g, i) {
      g.rotation.z = pointer.x * 0.06;
      g.rotation.x = -pointer.y * 0.05;
      var pulse = 0.85 + Math.sin(t * 2.2 * k + i) * 0.15 + hover * 0.1;
      g.userData.halo.scale.setScalar(pulse);
      g.userData.cap.scale.setScalar(0.9 + Math.sin(t * 2.2 * k + i) * 0.12);
    });

    for (var j = 0; j < dustSeeds.length; j++) {
      var s = dustSeeds[j];
      dummy.position.set(
        s.x + Math.sin(t * 0.14 * k + s.ph) * 0.32,
        s.y + Math.cos(t * 0.11 * k + s.ph) * 0.22,
        s.z + Math.sin(t * 0.09 * k + s.ph) * 0.2
      );
      dummy.rotation.set(t * 0.2 + s.ph, t * 0.14, 0);
      dummy.scale.setScalar(0.65 + Math.sin(t * 0.9 + s.ph) * 0.25);
      dummy.updateMatrix();
      dust.setMatrixAt(j, dummy.matrix);
    }
    dust.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
