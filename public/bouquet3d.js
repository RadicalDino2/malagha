/* ===========================================================
   Malagha — the 3D bouquet
   Red and white roses, built out of maths rather than a model
   file, so there is nothing to download but this script.
   If WebGL isn't available the whole section hides itself.
   =========================================================== */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("bouquet3d");
const sec = document.querySelector(".bouquet-sec");

if (canvas) {
  /* Build the scene -- and take a WebGL context -- only once this is
     nearly in view. The cake holds a context of its own further down
     the page, and two live ones at once is a cost worth avoiding on
     weaker hardware. Driven by scroll rather than an observer so it
     cannot be left waiting on a callback that needs a frame.        */
  const start = () => init().catch((e) => {
    console.warn("3D bouquet unavailable:", e);
    if (sec) sec.hidden = true;
  });

  const near = () => {
    const r = canvas.getBoundingClientRect();
    return r.top < innerHeight * 1.8 && r.bottom > -innerHeight * 0.8;
  };
  const maybe = () => {
    if (!near()) return;
    removeEventListener("scroll", maybe);
    removeEventListener("resize", maybe);
    start();
  };
  addEventListener("scroll", maybe, { passive: true });
  addEventListener("resize", maybe);
  maybe();
}

async function init() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, 1.58, 4.45);
  camera.lookAt(0, .48, 0);

  const RED = 0x8f1326, RED_2 = 0x5c0a18;
  const WHITE = 0xeee5d2, WHITE_2 = 0xd8cbb2;
  const GOLD = 0xe3c389, VIOLET = 0x8f6fcb, LEAF = 0x2f5d3a;

  /* ---- light: warm from the front, violet from behind, like the page ---- */
  scene.add(new THREE.AmbientLight(0x7d63b4, .70));
  const key = new THREE.DirectionalLight(0xfff4e2, 1.15);
  key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(VIOLET, .62);
  rim.position.set(-4, 1.5, -3.5); scene.add(rim);
  const fill = new THREE.PointLight(GOLD, 5.5, 12, 2);
  fill.position.set(0, 1.3, 2.7); scene.add(fill);

  /* =========================================================
     A petal. A grid, bent twice: cupped across its width so it
     wraps the middle of the flower, and leaning back at the
     tip so the outer rows open up.
     ========================================================= */
  function petalGeometry(seg = 12) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;                               // 0 at the base, 1 at the tip
      const w = Math.sin(Math.pow(u, .62) * Math.PI) * .62 + .02;
      for (let j = 0; j <= seg; j++) {
        const v = (j / seg) * 2 - 1;                   // -1 .. 1 across
        const cup = -(v * v) * .52 * (1 - u * .30);    // hollow faces the centre
        const back = Math.pow(u, 3.0) * .22;           // only the very tip turns out
        pos.push(v * w, u, cup + back);
        uv.push((v + 1) / 2, u);
      }
    }
    for (let i = 0; i < seg; i++)
      for (let j = 0; j < seg; j++) {
        const a = i * (seg + 1) + j, b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* rings of petals, tightest in the middle, flattest on the outside */
  const RINGS = [
    { n: 5, r: .028, s: .30, pitch: -.62, y: .150, jit: .04 },   // furled core
    { n: 5, r: .080, s: .40, pitch: -.16, y: .105, jit: .05 },
    { n: 6, r: .142, s: .50, pitch:  .26, y: .065, jit: .07 },
    { n: 7, r: .202, s: .60, pitch:  .64, y: .032, jit: .08 },
    { n: 8, r: .262, s: .68, pitch: 1.02, y: .010, jit: .10 },
    { n: 9, r: .312, s: .72, pitch: 1.40, y: 0,    jit: .12 },   // outer, drooping
  ];

  /* a tiny deterministic generator, so the bouquet is the same every visit */
  let seed = 0x5eed;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  /* Where every rose sits: one in the middle, then two rings falling away
     into a dome, each flower leaning out from the centre.                */
  const PLACES = [{ r: .05, a: .9, y: 1.20, tilt: .08, s: .46 }];
  for (let i = 0; i < 6; i++)
    PLACES.push({ r: .54, a: (i / 6) * Math.PI * 2 + .35, y: 1.02, tilt: .56, s: .44 });
  for (let i = 0; i < 8; i++)
    PLACES.push({ r: 1.00, a: (i / 8) * Math.PI * 2 - .22, y: .74, tilt: 1.00, s: .41 });

  /* Red and white alternate round each ring rather than clumping. */
  const isRed = PLACES.map((_, i) => (i === 0 ? true : i % 2 === 1));
  /* rings of 6 and 8 mean red and white truly alternate round each one */

  /* ---- work out every petal's final transform ---------------------- */
  const root = new THREE.Object3D();          // scratch graph, never rendered
  const redMats = [], whiteMats = [];
  const heads = [];                            // where each stem has to reach

  PLACES.forEach((p, ri) => {
    const rose = new THREE.Object3D();
    rose.position.set(Math.cos(p.a) * p.r, p.y, Math.sin(p.a) * p.r);
    rose.rotation.order = "YXZ";
    rose.rotation.y = p.a + Math.PI / 2;
    rose.rotation.x = -p.tilt;                 // lean outward, away from the middle
    rose.scale.setScalar(p.s * (.92 + rnd() * .18));
    const openness = .86 + rnd() * .30;        // some further along than others
    root.add(rose);
    heads.push(rose);

    RINGS.forEach((ring, k) => {
      for (let i = 0; i < ring.n; i++) {
        const yaw = new THREE.Object3D();
        yaw.rotation.y = (i / ring.n) * Math.PI * 2 + k * .7 + rnd() * .12;
        rose.add(yaw);

        const petal = new THREE.Object3D();
        petal.position.set(0, ring.y, ring.r);
        petal.rotation.x = ring.pitch * openness + (rnd() - .5) * ring.jit;
        petal.rotation.z = (rnd() - .5) * .17;             // a little twist
        petal.scale.setScalar(ring.s * (.9 + rnd() * .2));
        yaw.add(petal);
      }
    });
  });

  root.updateMatrixWorld(true);
  PLACES.forEach((p, ri) => {
    const bucket = isRed[ri] ? redMats : whiteMats;
    heads[ri].traverse((o) => {
      if (o.children.length === 0 && o !== heads[ri]) bucket.push(o.matrixWorld.clone());
    });
  });

  /* ---- the petals themselves, one draw call per colour ---- */
  const petalGeo = petalGeometry(10);

  function petalMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,          /* white: instanceColor multiplies this, and a
                                   tinted material would square every shade */
      roughness: .58, metalness: .02,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(color).multiplyScalar(.10),
    });
  }

  const bouquet = new THREE.Group();
  scene.add(bouquet);

  function petalCloud(mats, a, b) {
    const mesh = new THREE.InstancedMesh(petalGeo, petalMaterial(a), mats.length);
    const ca = new THREE.Color(a), cb = new THREE.Color(b), c = new THREE.Color();
    mats.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      c.copy(ca).lerp(cb, rnd() * .75);          // no two petals quite alike
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    bouquet.add(mesh);
    return mesh;
  }
  petalCloud(redMats, RED, RED_2);
  petalCloud(whiteMats, WHITE, WHITE_2);


  /* ---- stems, curving down into one gathered point ---- */
  const tie = new THREE.Vector3(0, -.88, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: LEAF, roughness: .82 });
  heads.forEach((h) => {
    const top = h.position.clone();
    const mid = top.clone().lerp(tie, .5);
    mid.x *= 1.22; mid.z *= 1.22;               // bow outward on the way down
    const curve = new THREE.QuadraticBezierCurve3(top, mid, tie);
    bouquet.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .021, 6, false), stemMat));
  });

  /* ---- leaves, tucked under the rim ---- */
  const leafGeo = petalGeometry(6);
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x254b2e, roughness: .78, side: THREE.DoubleSide,
    emissive: new THREE.Color(0x0d1f13),
  });
  const LEAVES = 11;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, LEAVES);
  const d = new THREE.Object3D();
  for (let i = 0; i < LEAVES; i++) {
    const a = (i / LEAVES) * Math.PI * 2 + .4;
    d.position.set(Math.cos(a) * .96, .40 - rnd() * .22, Math.sin(a) * .96);
    d.rotation.set(1.45 + rnd() * .45, -a + Math.PI / 2, (rnd() - .5) * .6);
    d.scale.set(.24, .50, .24);
    d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
  }
  leaves.instanceMatrix.needsUpdate = true;
  bouquet.add(leaves);

  /* ---- gypsophila: the little white filler ---- */
  const BUDS = 44;
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(.019, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0xfbf6ea, roughness: .9, emissive: 0x2a2336 }),
    BUDS
  );
  for (let i = 0; i < BUDS; i++) {
    const a = rnd() * Math.PI * 2, r = .30 + rnd() * .92;
    d.position.set(Math.cos(a) * r, .70 + rnd() * .46, Math.sin(a) * r);
    d.rotation.set(0, 0, 0);
    d.scale.setScalar(.7 + rnd() * .8);
    d.updateMatrix();
    buds.setMatrixAt(i, d.matrix);
  }
  buds.instanceMatrix.needsUpdate = true;
  bouquet.add(buds);

  /* ---- the gold ribbon holding it all together ---- */
  const goldM = new THREE.MeshStandardMaterial({ color: GOLD, roughness: .3, metalness: .8 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(.115, .034, 10, 44), goldM);
  band.rotation.x = Math.PI / 2; band.position.y = -.52;
  bouquet.add(band);
  for (const s of [-1, 1]) {                    // two loops of a bow
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.085, .019, 8, 28), goldM);
    loop.position.set(s * .15, -.48, .06);
    loop.rotation.set(.5, 0, s * .7);
    bouquet.add(loop);
  }

  bouquet.position.y = -.1;

  /* ---- turn it with the pointer, drift when left alone ---- */
  let spin = 0, vel = 0, dragging = false, lastX = 0, idle = 0;
  const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; idle = 0;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.classList.add("grabbing");
  });
  addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    target.x = ((e.clientX - (r.left + r.width / 2)) / r.width) * 2;
    target.y = ((e.clientY - (r.top + r.height / 2)) / r.height) * 2;
    if (!dragging) return;
    vel += (e.clientX - lastX) * .00042;
    lastX = e.clientX;
  });
  const release = () => { dragging = false; idle = 0; canvas.classList.remove("grabbing"); };
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);

  /* ---- size ----
     The canvas has to be shown before anything measures it: while it
     still carries [hidden] its rect is 0x0, resize() bails out and the
     renderer keeps its default 300x150 buffer.                        */
  canvas.hidden = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  addEventListener("resize", resize);

  /* ---- don't burn a frame while it is off screen ----
     Worked out from the rect rather than an IntersectionObserver: the
     observer's callback needs a frame to be delivered, so if frames are
     ever starved it can leave a stale "off screen" and the canvas stays
     blank. One rect read per frame costs nothing next to 500 petals
     and cannot get stuck.                                            */
  let onScreen = true;
  function visible() {
    const r = canvas.getBoundingClientRect();
    return r.bottom > -160 && r.top < innerHeight + 160;
  }

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    onScreen = visible();
    if (!onScreen || document.hidden) return;

    if (!reduce) {
      pointer.x += (target.x - pointer.x) * .05;
      pointer.y += (target.y - pointer.y) * .05;
      if (!dragging) {
        idle = Math.min(idle + .016, 2);
        vel += (0.0022 - vel) * .004 * idle;     // ease back into a slow turn
      }
      spin += vel;
      vel *= .94;
      bouquet.rotation.y = spin + pointer.x * .22;
      bouquet.rotation.x = pointer.y * .07;
      bouquet.position.y = -.1 + Math.sin(t * .8) * .022;   // breathing
    }
    renderer.render(scene, camera);
  });
}
