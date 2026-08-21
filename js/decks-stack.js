/**
 * Goodform — Deck stack for the Our work / portfolio hero.
 * Smaller plates (no edge clip) + breathing layers + ping-pong scan rays.
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
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0, 2.95, 8.85);
  camera.lookAt(0, 0.06, 0);

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

  var PW = 2.22;
  var PD = 1.18;
  var PLATES = [
    { y: 0.64, color: CYAN, fill: 0x133a38 },
    { y: 0.03, color: PURPLE, fill: 0x1a1438 },
    { y: -0.58, color: EMBER, fill: 0x3a1812 },
  ];

  var root = new THREE.Group();
  scene.add(root);

  var plates = [];
  PLATES.forEach(function (spec, idx) {
    var g = new THREE.Group();
    var lines = new THREE.LineSegments(
      gridGeo(PW, PD, 8, 5),
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
      new THREE.PlaneGeometry(PW, PD),
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
        new THREE.Vector3(-PW / 2, 0, -PD / 2),
        new THREE.Vector3(PW / 2, 0, -PD / 2),
        new THREE.Vector3(PW / 2, 0, PD / 2),
        new THREE.Vector3(-PW / 2, 0, PD / 2),
      ]),
      new THREE.LineBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.95,
        toneMapped: false,
      })
    );
    var scanX = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.022, PD * 0.96),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.78,
        toneMapped: false,
      })
    );
    scanX.position.y = 0.02;
    var scanZ = new THREE.Mesh(
      new THREE.BoxGeometry(PW * 0.96, 0.018, 0.04),
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.55,
        toneMapped: false,
      })
    );
    scanZ.position.y = 0.025;
    g.add(fill, lines, glow, rim, scanX, scanZ);
    g.position.y = spec.y;
    g.userData = { spec: spec, idx: idx, scanX: scanX, scanZ: scanZ };
    root.add(g);
    plates.push(g);
  });

  var POSTS = [
    { x: -0.76, z: -0.36 },
    { x: -0.26, z: -0.44 },
    { x: 0.32, z: -0.34 },
    { x: 0.76, z: -0.4 },
  ];
  var posts = [];
  POSTS.forEach(function (p) {
    var g = new THREE.Group();
    var h = 1.42;
    var pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, h, 0.024),
      new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.72, toneMapped: false })
    );
    pole.position.y = h / 2 - 0.64;
    var cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 12, 12),
      new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0.95, toneMapped: false })
    );
    cap.position.y = h - 0.64;
    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
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
    g.userData.pole = pole;
    root.add(g);
    posts.push(g);
  });

  var cube = new THREE.Group();
  cube.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.32, 0.32),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.88, toneMapped: false })
    ),
    new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.52, 0.52),
      new THREE.MeshBasicMaterial({
        color: CYAN_HOT,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        toneMapped: false,
      })
    )
  );
  root.add(cube);

  var dustN = 36;
  var dust = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.035, 0.035, 0.035),
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
      x: (hx - Math.floor(hx) - 0.5) * 5.8,
      y: (hy - Math.floor(hy) - 0.5) * 2.8,
      z: (hz - Math.floor(hz) - 0.5) * 3.4,
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

  function pingpong(u) {
    u = ((u % 1) + 1) % 1;
    return u < 0.5 ? u * 2 : 2 - u * 2;
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
      target.x = Math.max(-0.45, Math.min(0.45, (e.clientX - cx) / Math.max(1, rect.width * 0.5)));
      target.y = Math.max(-0.45, Math.min(0.45, -((e.clientY - cy) / Math.max(1, rect.height * 0.5))));
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
    driveT = 0.32 + Math.max(-0.2, Math.min(0.4, -dist * 0.55));
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

    var breath = Math.sin(t * 0.52 * k);
    var spread = 0.78 + breath * 0.32 + hover * 0.12 + (drive - 0.32) * 0.22;

    root.rotation.y = Math.sin(t * 0.12 * k) * 0.04 + pointer.x * 0.06;
    root.rotation.x = 0.32 + Math.sin(t * 0.08 * k) * 0.015 - pointer.y * 0.04;

    plates.forEach(function (g) {
      var i = g.userData.idx;
      var sign = i - 1;
      g.position.y = g.userData.spec.y * spread + Math.sin(t * 0.7 * k + i) * 0.02;
      g.position.x = pointer.x * (0.06 + (2 - i) * 0.025);
      g.position.z = pointer.y * 0.035;
      g.rotation.z = pointer.x * 0.018;
      g.rotation.y = Math.sin(t * 0.18 * k + i) * 0.015;

      var sx = g.userData.scanX;
      var sz = g.userData.scanZ;
      var ux = pingpong(t * (0.16 + i * 0.045) * k + i * 0.28);
      var uz = pingpong(t * (0.12 + i * 0.03) * k + 0.42 + i * 0.2);
      sx.position.x = -PW * 0.46 + ux * PW * 0.92;
      sx.position.z = Math.sin(t * 0.9 * k + i) * 0.12;
      sx.scale.x = 1 + Math.sin(t * 2.4 * k + i) * 0.35;
      sx.material.opacity = 0.38 + 0.42 * Math.sin(ux * Math.PI);
      sz.position.z = -PD * 0.46 + uz * PD * 0.92;
      sz.position.x = Math.sin(t * 0.75 * k + i * 1.3) * 0.18;
      sz.scale.z = 1 + Math.sin(t * 1.8 * k + i) * 0.28;
      sz.material.opacity = 0.28 + 0.38 * Math.sin(uz * Math.PI);
    });

    var hop = Math.sin(t * 0.52 * k) * 0.42;
    cube.position.x = Math.sin(t * 0.48 * k) * 0.32 + pointer.x * 0.28;
    cube.position.z = Math.cos(t * 0.38 * k) * 0.2 + pointer.y * 0.14;
    cube.position.y = 0.22 + hop * spread + Math.sin(t * 1.3 * k) * 0.04;
    cube.rotation.x = t * 0.62 * k;
    cube.rotation.y = t * 0.8 * k + pointer.x * 0.3;
    cube.scale.setScalar(1 + hover * 0.1 + Math.sin(t * 2.0 * k) * 0.04);

    var poleH = 1.18 + spread * 0.38;
    posts.forEach(function (g, i) {
      g.rotation.z = pointer.x * 0.04;
      g.rotation.x = -pointer.y * 0.03;
      g.userData.pole.scale.y = poleH / 1.42;
      var pulse = 0.85 + Math.sin(t * 2.1 * k + i) * 0.16 + hover * 0.08;
      g.userData.halo.scale.setScalar(pulse);
      g.userData.cap.scale.setScalar(0.9 + Math.sin(t * 2.1 * k + i) * 0.1);
    });

    for (var j = 0; j < dustSeeds.length; j++) {
      var s = dustSeeds[j];
      dummy.position.set(
        s.x + Math.sin(t * 0.14 * k + s.ph) * 0.28,
        s.y + Math.cos(t * 0.11 * k + s.ph) * 0.18,
        s.z + Math.sin(t * 0.09 * k + s.ph) * 0.16
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
