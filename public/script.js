/* ===========================================================
   Malagha — belated birthday · angel theme
   =========================================================== */

/* ---------------- scroll reveal ---------------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------------- starfield ---------------- */
const sky = document.getElementById("sky");
const sctx = sky.getContext("2d");
let stars = [];

function sizeSky() {
  sky.width = innerWidth;
  sky.height = innerHeight;
  const count = Math.round((innerWidth * innerHeight) / 9000);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * sky.width,
    y: Math.random() * sky.height,
    r: Math.random() * 1.5 + 0.3,
    a: Math.random(),
    sp: Math.random() * 0.012 + 0.003,
  }));
}
sizeSky();
addEventListener("resize", sizeSky);

(function twinkle() {
  sctx.clearRect(0, 0, sky.width, sky.height);
  stars.forEach((s) => {
    s.a += s.sp;
    const o = 0.25 + Math.abs(Math.sin(s.a)) * 0.75;
    sctx.beginPath();
    sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    sctx.fillStyle = `rgba(255,248,230,${o})`;
    sctx.fill();
  });
  requestAnimationFrame(twinkle);
})();

/* ---------------- drifting feathers ---------------- */
const field = document.getElementById("feathers");
const SVG_OPEN = '<svg viewBox="0 0 24 24" style="width:1em;height:1em;display:block" aria-hidden="true"';
/* drawn marks, not emoji: a feather, a quill-feather, a gold mote */
const GLYPHS = [
  SVG_OPEN + ' fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M19.4 4.6c.3 6.3-4.4 11.1-10.7 11.1H5.1S4.6 8.9 11 6.2c2.9-1.2 6.3-1.9 8.4-1.6z"/><path d="M14.8 9.2 4.8 19.2"/></svg>',
  SVG_OPEN + ' fill="currentColor"><path d="M12 2.4c1.1 4.3 2.2 7.4 4.6 9.6-2.4 2.2-3.5 5.3-4.6 9.6-1.1-4.3-2.2-7.4-4.6-9.6C9.8 9.8 10.9 6.7 12 2.4z" opacity=".85"/></svg>',
  SVG_OPEN + ' fill="currentColor"><path d="M12 3.2l1.7 5.4 5.4 1.7-5.4 1.7L12 17.4l-1.7-5.4L4.9 10.3l5.4-1.7z" opacity=".8"/></svg>',
  SVG_OPEN + ' fill="currentColor"><circle cx="12" cy="12" r="3" opacity=".7"/></svg>',
];

function dropFeather(x, y, strong) {
  const el = document.createElement("span");
  el.className = "feather";
  el.innerHTML = GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const startX = x ?? Math.random() * innerWidth;
  const startY = y ?? -40;
  const dur = strong ? 2600 + Math.random() * 1800 : 9000 + Math.random() * 7000;
  const driftX = (Math.random() - 0.5) * (strong ? 420 : 220);
  const fall = strong ? 260 + Math.random() * 320 : innerHeight + 120;
  const spin = (Math.random() - 0.5) * 900;
  const scale = 0.6 + Math.random() * 0.9;

  el.style.left = startX + "px";
  el.style.top = startY + "px";
  el.style.fontSize = 14 + Math.random() * 16 + "px";
  field.append(el);

  el.animate(
    [
      { transform: `translate(0,0) rotate(0deg) scale(${scale})`, opacity: 0 },
      { opacity: strong ? 1 : 0.85, offset: 0.12 },
      { transform: `translate(${driftX * 0.5}px, ${fall * 0.55}px) rotate(${spin * 0.6}deg) scale(${scale})`, offset: 0.6 },
      { transform: `translate(${driftX}px, ${fall}px) rotate(${spin}deg) scale(${scale * 0.85})`, opacity: 0 },
    ],
    { duration: dur, easing: "cubic-bezier(.33,.1,.5,1)" }
  ).onfinish = () => el.remove();
}

/* a gentle, constant snowfall of feathers */
setInterval(() => { if (document.visibilityState === "visible") dropFeather(); }, 1100);
for (let i = 0; i < 10; i++) setTimeout(() => dropFeather(null, Math.random() * innerHeight), i * 260);

function burst(x, y, n = 36) {
  for (let i = 0; i < n; i++) setTimeout(() => dropFeather(x, y, true), i * 14);
}

/* ---------------- the letter ---------------- */
const envelope = document.getElementById("envelope");
const paper = document.getElementById("paper");

function openLetter() {
  if (envelope.classList.contains("open")) {
    paper.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const r = envelope.getBoundingClientRect();
  envelope.classList.add("open");
  burst(r.left + r.width / 2, r.top + r.height / 2, 30);
  setTimeout(() => {
    paper.hidden = false;
    envelope.classList.add("gone");
    paper.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => envelope.classList.add("hidden-done"), 560);
  }, 700);
}

envelope.addEventListener("click", openLetter);
envelope.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLetter(); }
});

document.getElementById("openLetter").addEventListener("click", () => {
  if (window.__scrollTo) window.__scrollTo("#letter");
  else document.getElementById("letter").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(openLetter, 700);
});

/* ---------------- the candle ---------------- */
const cake = document.getElementById("cake");
const flame = document.getElementById("flame");
const wished = document.getElementById("wished");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* a wisp of smoke rising off the wick */
function puff() {
  const el = document.createElement("span");
  el.className = "smoke";
  const size = 9 + Math.random() * 15;
  el.style.width = el.style.height = size + "px";
  cake.append(el);

  const dx = (Math.random() - 0.5) * 70;
  const lift = 120 + Math.random() * 90;
  el.animate(
    [
      { transform: "translate(-50%, 0) scale(.45)", opacity: 0 },
      { opacity: 0.5, offset: 0.18 },
      { transform: `translate(calc(-50% + ${dx * 0.45}px), ${-lift * 0.5}px) scale(1.7)`, opacity: 0.3, offset: 0.6 },
      { transform: `translate(calc(-50% + ${dx}px), ${-lift}px) scale(2.8)`, opacity: 0 },
    ],
    { duration: 2200 + Math.random() * 1500, easing: "cubic-bezier(.25,.6,.3,1)" }
  ).onfinish = () => el.remove();
}

/* little orange embers knocked off the wick */
function ember() {
  const el = document.createElement("span");
  el.className = "ember";
  cake.append(el);
  const dx = (Math.random() - 0.5) * 120;
  const up = 30 + Math.random() * 70;
  el.animate(
    [
      { transform: "translate(-50%, 0) scale(1)", opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.6}px), ${-up}px) scale(.9)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${dx}px), ${-up + 60}px) scale(.3)`, opacity: 0 },
    ],
    { duration: 900 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.4,1)" }
  ).onfinish = () => el.remove();
}

/* the wish itself, drifting up off the page */
function riseWish(x, y) {
  const el = document.createElement("span");
  el.className = "feather";
  el.innerHTML = GLYPHS[(Math.random() * GLYPHS.length) | 0];
  el.style.left = x + (Math.random() - 0.5) * 90 + "px";
  el.style.top = y + "px";
  el.style.fontSize = 12 + Math.random() * 14 + "px";
  field.append(el);

  const dx = (Math.random() - 0.5) * 220;
  const up = 260 + Math.random() * 320;
  el.animate(
    [
      { transform: "translate(0,0) scale(.4)", opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { transform: `translate(${dx * 0.5}px, ${-up * 0.55}px) rotate(${dx}deg) scale(1)`, opacity: .9, offset: 0.6 },
      { transform: `translate(${dx}px, ${-up}px) rotate(${dx * 1.6}deg) scale(.5)`, opacity: 0 },
    ],
    { duration: 2600 + Math.random() * 1600, easing: "cubic-bezier(.2,.5,.3,1)" }
  ).onfinish = () => el.remove();
}

function blowOut() {
  if (cake.classList.contains("out")) return;

  if (reduceMotion) {
    cake.classList.add("out");
    flame.style.opacity = "0";
    wished.hidden = false;
    window.__candleOut?.();
    return;
  }

  cake.classList.add("blowing");

  /* the gust: flame leans, stretches thin, snaps out */
  const gust = flame.animate(
    [
      { transform: "translateX(-50%) rotate(0deg) scale(1,1)", opacity: 1, offset: 0 },
      { transform: "translateX(-50%) rotate(-26deg) scale(.72,1.3)", opacity: 1, offset: 0.22 },
      { transform: "translateX(-50%) rotate(20deg) scale(1.35,.62)", opacity: .95, offset: 0.46 },
      { transform: "translateX(-50%) rotate(-38deg) scale(.42,.48)", opacity: .55, offset: 0.76 },
      { transform: "translateX(-50%) rotate(-62deg) scale(.08,.18)", opacity: 0, offset: 1 },
    ],
    { duration: 640, easing: "cubic-bezier(.4,0,.5,1)", fill: "forwards" }
  );
  /* Commit the "out" state to the element rather than trusting the animation to
     hold it: a filling animation can be dropped, and onfinish is not guaranteed to
     land if the animation clock stalls. Cancelling first lets the inline style win. */
  const snuff = () => { try { gust.cancel(); } catch (e) {} flame.style.opacity = "0"; };
  gust.onfinish = snuff;
  setTimeout(snuff, 700);

  /* embers fly off as it goes */
  for (let i = 0; i < 14; i++) setTimeout(ember, 180 + i * 28);

  /* smoke keeps curling for a few seconds after */
  setTimeout(() => { for (let i = 0; i < 9; i++) setTimeout(puff, i * 230); }, 520);

  /* light dies */
  setTimeout(() => cake.classList.add("out"), 600);

  /* and the wish goes up */
  setTimeout(() => {
    const r = cake.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + 40;
    for (let i = 0; i < 26; i++) setTimeout(() => riseWish(x, y), i * 70);
    wished.hidden = false;
    window.__candleOut?.();
  }, 900);
}

/* the mic listener in extras.js blows this one out too */
window.__blowFromMic = blowOut;

cake.addEventListener("click", blowOut);
cake.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); blowOut(); }
});

/* ---------------- arrival ---------------- */
addEventListener("load", () => setTimeout(() => burst(innerWidth / 2, innerHeight * 0.35, 40), 600));
