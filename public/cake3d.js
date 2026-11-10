/* ===========================================================
   Malagha — the 3D cake
   Replaces the CSS cake when WebGL is available; if anything
   here fails, the CSS cake stays exactly as it was.
   =========================================================== */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("cake3d");
if (canvas) init().catch((e) => { console.warn("3D cake unavailable:", e); canvas.hidden = true; });

async function init() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, 2.45, 7.2);
  camera.lookAt(0, 1.15, 0);

  const GOLD = 0xe3c389, VIOLET = 0x8f6fcb, ICING = 0xece4ee;

  /* ---- light: mostly the candle itself ---- */
  scene.add(new THREE.AmbientLight(0x7d5cb8, 0.7));
  const key = new THREE.DirectionalLight(0xd9c9ff, 0.5);
  key.position.set(3, 6, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(VIOLET, 0.65);
  rim.position.set(-4, 2, -4); scene.add(rim);

  const candleLight = new THREE.PointLight(0xffb347, 9.5, 13, 2);
  candleLight.position.set(0, 2.35, 0);
  candleLight.castShadow = true;
  scene.add(candleLight);

  /* ---- the cake ---- */
  const cake = new THREE.Group();
  scene.add(cake);

  const icing = new THREE.MeshStandardMaterial({ color: ICING, roughness: .72, metalness: .04 });
  const goldM = new THREE.MeshStandardMaterial({ color: GOLD, roughness: .28, metalness: .85 });

  function tier(r, h, y) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, h, 72), icing);
    m.position.y = y; m.castShadow = true; m.receiveShadow = true; cake.add(m);
    const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.005, .035, 12, 80), goldM);
    band.rotation.x = Math.PI / 2; band.position.y = y - h * .18; cake.add(band);
    return m;
  }
  tier(1.62, .72, .36);        // bottom
  tier(1.12, .62, 1.03);       // top

  // a ring of gold dots around the top edge
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const d = new THREE.Mesh(new THREE.SphereGeometry(.052, 12, 12), goldM);
    d.position.set(Math.cos(a) * 1.08, 1.345, Math.sin(a) * 1.08);
    d.castShadow = true; cake.add(d);
  }

  /* ---- candle ---- */
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(.088, .088, .78, 28),
    new THREE.MeshStandardMaterial({ color: 0xfbf7ee, roughness: .5,
      emissive: 0x6a5234, emissiveIntensity: .55 }));
  candle.position.y = 1.73; candle.castShadow = true; cake.add(candle);

  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(.091, .091, .78, 28, 1, true),
    new THREE.MeshStandardMaterial({
      color: GOLD, roughness: .4, metalness: .5,
      transparent: true, opacity: .85, side: THREE.DoubleSide,
      alphaMap: stripeTexture(),
    }));
  stripe.position.y = 1.73; cake.add(stripe);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(.015, .015, .1, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a2320 }));
  wick.position.y = 2.16; cake.add(wick);

  /* ---- flame: two nested cones, lit from inside ---- */
  const flame = new THREE.Group();
  flame.position.y = 2.26; cake.add(flame);
  const outer = new THREE.Mesh(new THREE.ConeGeometry(.098, .34, 22),
    new THREE.MeshBasicMaterial({ color: 0xffa132, transparent: true, opacity: .62, depthWrite: false }));
  const inner = new THREE.Mesh(new THREE.ConeGeometry(.05, .19, 18),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: .95, depthWrite: false }));
  inner.position.y = -.05;
  flame.add(outer, inner);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: 0xffbe5c, transparent: true, opacity: .55,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(2.3, 2.3, 1); halo.position.y = 2.3; cake.add(halo);

  /* ---- smoke, released on blow-out ---- */
  const smokeMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xbdb2d4,
    transparent: true, opacity: 0, blending: THREE.NormalBlending, depthWrite: false });
  const smoke = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(smokeMat.clone());
    s.visible = false; cake.add(s); smoke.push({ s, t: 0, sp: 0, dx: 0, dz: 0 });
  }

  /* ---- interaction ---- */
  let out = false, pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };

  function blow() {
    if (out) return;
    out = true;
    smoke.forEach((p, i) => {
      p.s.visible = true; p.t = -i * 0.055; p.sp = .006 + Math.random() * .008;
      p.dx = (Math.random() - .5) * .011; p.dz = (Math.random() - .5) * .011;
      p.s.position.set(0, 2.26, 0); p.s.scale.setScalar(.18);
    });
    window.__wishReceived?.();
  }
  canvas.addEventListener("click", blow);
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blow(); }
  });
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "button");
  window.__blowFromMic = blow;              // the mic listener aims at the 3D cake now

  addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    target.x = ((e.clientX - (r.left + r.width / 2)) / r.width) * 2;
    target.y = ((e.clientY - (r.top + r.height / 2)) / r.height) * 2;
  });

  /* ---- size ---- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);

  /* ---- go ---- */
  canvas.hidden = false;
  document.body.classList.add("cake-3d");
  resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime(), dt = clock.getDelta();

    if (!reduce) {
      pointer.x += (target.x - pointer.x) * .05;
      pointer.y += (target.y - pointer.y) * .05;
    }
    cake.rotation.y = (reduce ? 0 : t * .16) + pointer.x * .34;
    cake.rotation.x = pointer.y * .1;

    if (!out) {
      const f = .88 + Math.sin(t * 11) * .07 + Math.sin(t * 23.7) * .045;
      flame.scale.set(.93 + Math.sin(t * 17) * .05, f, .93);
      flame.position.x = Math.sin(t * 7.3) * .012;
      flame.rotation.z = Math.sin(t * 5.1) * .07;
      halo.material.opacity = .46 + Math.sin(t * 13) * .1;
      halo.scale.setScalar(2.2 + Math.sin(t * 9) * .12);
      candleLight.intensity = 8.8 + Math.sin(t * 15) * 1.5;
    } else {
      flame.visible = false; halo.visible = false;
      candleLight.intensity += (0.25 - candleLight.intensity) * .05;
      smoke.forEach((p) => {
        if (!p.s.visible) return;
        p.t += dt;
        if (p.t < 0) return;
        p.s.position.y += p.sp;
        p.s.position.x += p.dx; p.s.position.z += p.dz;
        p.s.scale.setScalar(.18 + p.t * .5);
        p.s.material.opacity = Math.max(0, .3 - p.t * .12);
        if (p.s.material.opacity <= 0) p.s.visible = false;
      });
    }
    renderer.render(scene, camera);
  });

  /* ---- generated textures, so there are no image files ---- */
  function glowTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(.35, "rgba(255,255,255,.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }
  function stripeTexture() {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "#fff"; g.lineWidth = 11;
    for (let i = -64; i < 128; i += 26) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 1); return tex;
  }
}
