/**
 * Goodform — Dryf cluster for the "No tech stress" section.
 * Drop-in: requires vendor/three.min.js already on the page.
 * Mounts on #drift-canvas inside .story-accent
 */
(function () {
  if (typeof THREE === "undefined") return;
  var canvas = document.getElementById("drift-canvas");
  if (!canvas) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointer = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0.06, 6.9);

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;

  var CYAN = 0x7ee8e0;
  var PURPLE = 0x9b7bff;
  var EMBER = 0xff6b4a;
  var GOLD = 0xf0c96a;
  var WHITE = 0xd8e8ea;

  function cubeGeos(size) {
    var s = size / 2;
    var c = [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
    ];
    function segs(idx) {
      var pts = [];
      for (var i = 0; i < idx.length; i++) {
        var a = c[idx[i][0]];
        var b = c[idx[i][1]];
        pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      return g;
    }
    var edges = segs([
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ]);
    var diags = segs([
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 5], [1, 4], [3, 6], [2, 7],
      [0, 7], [3, 4], [1, 6], [2, 5],
    ]);
    return { edges: edges, diags: diags };
  }

  function wireBox(size, edge, diag, fill) {
    var geos = cubeGeos(size);
    var g = new THREE.Group();
    var eMat = new THREE.LineBasicMaterial({
      color: edge, transparent: true, opacity: 0.95, toneMapped: false,
    });
    var dMat = new THREE.LineBasicMaterial({
      color: diag, transparent: true, opacity: 0.9, toneMapped: false,
    });
    g.add(new THREE.LineSegments(geos.edges, eMat));
    var glow = new THREE.LineSegments(geos.edges, eMat.clone());
    glow.scale.setScalar(1.04);
    glow.material.opacity = 0.22;
    g.add(glow);
    g.add(new THREE.LineSegments(geos.diags, dMat));
    if (fill > 0) {
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size * 0.92, size * 0.92, size * 0.92),
        new THREE.MeshBasicMaterial({
          color: edge, transparent: true, opacity: fill, depthWrite: false, toneMapped: false,
        })
      );
      g.add(mesh);
    }
    return g;
  }

  var CLUSTER = [
    { x: -1.22, y: -0.14, z: 0.22, size: 0.88, diag: PURPLE, rx: 0.18, ry: 0.12, rz: 0.07 },
    { x: -0.18, y: 0.42, z: -0.14, size: 1.32, diag: CYAN, rx: 0.1, ry: 0.16, rz: 0.05, nested: true },
    { x: 1.28, y: 0.42, z: 0.26, size: 0.56, diag: CYAN, rx: 0.22, ry: -0.14, rz: 0.09 },
    { x: 1.56, y: 0.7, z: -0.18, size: 0.38, diag: CYAN, rx: -0.16, ry: 0.2, rz: 0.08 },
    { x: 0.9, y: -0.9, z: 0.14, size: 0.82, diag: EMBER, rx: 0.14, ry: -0.18, rz: 0.06 },
    { x: 1.78, y: 1.02, z: 0.44, size: 0.16, diag: PURPLE, rx: 0.4, ry: 0.35, rz: 0.2, fill: 0.55 },
  ];

  var root = new THREE.Group();
  scene.add(root);

  var cubes = new THREE.Group();
  root.add(cubes);
  CLUSTER.forEach(function (spec) {
    var box = wireBox(spec.size, CYAN, spec.diag, spec.fill || 0.05);
    box.position.set(spec.x, spec.y, spec.z);
    box.userData = spec;
    if (spec.nested) {
      var inner = wireBox(spec.size, CYAN, CYAN, 0.04);
      inner.scale.setScalar(0.68);
      inner.rotation.set(0.4, 0.3, 0.1);
      box.add(inner);
    }
    cubes.add(box);
  });

  function ellipsePts(rx, ry, n) {
    var e = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    return e.getPoints(n).map(function (p) { return new THREE.Vector3(p.x, p.y, 0); });
  }
  var ringPts = ellipsePts(2.08, 1.12, 128);
  var ring = new THREE.Group();
  ring.rotation.set(0.42, 0.22, 0.1);
  var ringLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.85, toneMapped: false })
  );
  var ringGlow = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ellipsePts(2.08, 1.12, 64)),
    new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.28, toneMapped: false })
  );
  ring.add(ringLine, ringGlow);
  var sat = wireBox(0.18, CYAN, CYAN, 0.55);
  ring.add(sat);
  root.add(ring);

  var webPts = [];
  for (var i = 0; i < 26; i++) {
    var a = Math.sin(i * 17.1) * 43758.5;
    var b = Math.sin(i * 9.3) * 9123.2;
    var c = Math.sin(i * 31.7) * 2341.8;
    var d = Math.sin(i * 5.9) * 7712.4;
    webPts.push(
      (a - Math.floor(a) - 0.5) * 9,
      (b - Math.floor(b) - 0.5) * 6,
      (c - Math.floor(c) - 0.5) * 5,
      (d - Math.floor(d) - 0.5) * 9,
      (Math.sin(i * 13.3) * 5112 - Math.floor(Math.sin(i * 13.3) * 5112) - 0.5) * 6,
      (Math.sin(i * 21.1) * 3331 - Math.floor(Math.sin(i * 21.1) * 3331) - 0.5) * 5
    );
  }
  var webGeo = new THREE.BufferGeometry();
  webGeo.setAttribute("position", new THREE.Float32BufferAttribute(webPts, 3));
  var web = new THREE.LineSegments(
    webGeo,
    new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.12, toneMapped: false })
  );
  root.add(web);

  var dustN = 80;
  var dustColors = [CYAN, PURPLE, EMBER, GOLD, 0x8ec8c4, 0xc9b6ff];
  var dust = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.045),
    new THREE.MeshBasicMaterial({ toneMapped: false }),
    dustN
  );
  var dummy = new THREE.Object3D();
  var col = new THREE.Color();
  var dustSeeds = [];
  for (var di = 0; di < dustN; di++) {
    var hx = Math.sin(di * 12.7) * 43758.5;
    var hy = Math.sin(di * 19.3) * 23421.1;
    var hz = Math.sin(di * 7.1) * 9123.4;
    var seed = {
      x: (hx - Math.floor(hx) - 0.5) * 8.5,
      y: (hy - Math.floor(hy) - 0.5) * 5.2,
      z: (hz - Math.floor(hz) - 0.5) * 5.4,
      ph: di * 0.37,
    };
    dummy.position.set(seed.x, seed.y, seed.z);
    dummy.scale.setScalar(0.7);
    dummy.updateMatrix();
    dust.setMatrixAt(di, dummy.matrix);
    col.setHex(dustColors[di % dustColors.length]);
    dust.setColorAt(di, col);
    dustSeeds.push(seed);
  }
  dust.instanceMatrix.needsUpdate = true;
  if (dust.instanceColor) dust.instanceColor.needsUpdate = true;
  root.add(dust);

  function resize() {
    var w = canvas.clientWidth || canvas.parentElement.clientWidth || 460;
    var h = canvas.clientHeight || canvas.parentElement.clientHeight || 360;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    target.x = Math.max(-0.65, Math.min(0.65, (e.clientX - cx) / Math.max(1, rect.width)));
    target.y = Math.max(-0.65, Math.min(0.65, -((e.clientY - cy) / Math.max(1, rect.height))));
  }, { passive: true });

  var clock = new THREE.Clock();
  function tick() {
    var t = clock.getElapsedTime();
    var k = reduce ? 0.28 : 1;
    pointer.x += (target.x - pointer.x) * 0.06;
    pointer.y += (target.y - pointer.y) * 0.06;

    root.rotation.y = Math.sin(t * 0.08 * k) * 0.07 + pointer.x * 0.12;
    root.rotation.x = Math.sin(t * 0.06 * k) * 0.035 - pointer.y * 0.08;

    cubes.children.forEach(function (child) {
      var spec = child.userData;
      if (!spec || spec.rx == null) return;
      child.rotation.x = t * spec.rx * k;
      child.rotation.y = t * spec.ry * k;
      child.rotation.z = t * spec.rz * k;
    });

    ring.rotation.z = t * 0.14 * k;
    ring.rotation.x = 0.42 + Math.sin(t * 0.11 * k) * 0.06;
    ring.rotation.y = 0.22 + Math.sin(t * 0.09 * k) * 0.08;

    var u = ((t * 0.08 * k) % 1 + 1) % 1;
    var idx = u * (ringPts.length - 1);
    var i0 = Math.floor(idx);
    var i1 = (i0 + 1) % ringPts.length;
    var f = idx - i0;
    var a = ringPts[i0];
    var b = ringPts[i1];
    sat.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f);

    web.rotation.z = t * 0.015 * k;
    web.rotation.y = t * 0.01 * k;

    for (var j = 0; j < dustSeeds.length; j++) {
      var s = dustSeeds[j];
      dummy.position.set(
        s.x + Math.sin(t * 0.12 * k + s.ph) * 0.35,
        s.y + Math.cos(t * 0.09 * k + s.ph) * 0.28,
        s.z + Math.sin(t * 0.07 * k + s.ph * 1.4) * 0.22
      );
      dummy.rotation.set(t * 0.2 + s.ph, t * 0.14, 0);
      dummy.scale.setScalar(0.7 + Math.sin(t * 0.8 + s.ph) * 0.25);
      dummy.updateMatrix();
      dust.setMatrixAt(j, dummy.matrix);
    }
    dust.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();
