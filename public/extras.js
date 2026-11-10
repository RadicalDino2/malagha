/* ===========================================================
   Malagha — extras
   Intro, cursor, magnetics, tilt, confetti, counter,
   music, mic-blow, easter egg, drifting photographs.
   =========================================================== */

/* ---------- EDIT ME -------------------------------------------------------
   birthDate: her date of birth, "YYYY-MM-DD" (add "T14:30" for the hour).
              Leave null and the live counter stays hidden.
   nickname : type this anywhere on the page to unlock the secret note.
   -------------------------------------------------------------------------- */
const CONFIG = {
  birthDate: null,
  nickname: "malagha",
  music: "audio/music.mp3",   // drop a file at public/audio/music.mp3
  musicVolume: 0.55,          // 0 to 1
};

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);

/* ---------------- 1. cinematic intro ---------------- */
(function intro() {
  const box = $("intro"), line = $("introLine"), name = $("introName"), skip = $("introSkip");
  if (!box) return;

  const TEXT = "Some dates matter more than others…";
  const NAME = "Malagha";
  let finished = false;

  NAME.split("").forEach((ch) => {
    const s = document.createElement("span");
    s.textContent = ch;
    name.append(s);
  });

  function end(fast) {
    if (finished) return;
    finished = true;
    box.classList.add("done");
    document.body.classList.remove("intro-running");
    sessionStorage.setItem("malagha-intro", "1");
    const go = () => { box.remove(); window.__introDone = true;
                       document.dispatchEvent(new Event("intro:done")); };
    if (fast || !window.gsap) { box.style.opacity = "0"; setTimeout(go, 220); }
    else gsap.to(box, { opacity: 0, duration: .8, ease: "power2.inOut", onComplete: go });
  }
  skip.addEventListener("click", () => end(true));
  addEventListener("keydown", (e) => { if (e.key === "Escape") end(true); }, { once: true });

  // already seen this tab, reduced motion, or GSAP blocked -> straight to the page
  if (sessionStorage.getItem("malagha-intro") || reduce) { end(true); return; }
  document.body.classList.add("intro-running");
  const guard = setTimeout(() => end(true), 9000);   // never trap the visitor

  addEventListener("load", () => {
    if (!window.gsap) { clearTimeout(guard); end(true); return; }

    let i = 0;
    (function type() {
      if (finished) return;
      line.textContent = TEXT.slice(0, ++i);
      if (i < TEXT.length) return setTimeout(type, 42);
      line.classList.add("typed");
      setTimeout(reveal, 620);
    })();

    function reveal() {
      if (finished) return;
      const tl = gsap.timeline({ onComplete: () => { clearTimeout(guard); setTimeout(() => end(false), 900); } });
      tl.to(line, { opacity: 0, y: -18, duration: .5, ease: "power2.in" })
        .fromTo(name.children,
          { opacity: 0, y: 70, rotateX: -70, filter: "blur(12px)" },
          { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)",
            duration: .85, ease: "back.out(1.6)", stagger: .055 }, "-=.15")
        .add(() => burst(), "-=.35");
    }
    function burst() {
      if (!window.confetti) return;
      confetti({ particleCount: 70, spread: 95, startVelocity: 42, ticks: 190, origin: { y: .52 },
                 colors: ["#e3c389", "#f7ead0", "#8f6fcb", "#b9914e"], scalar: .95, disableForReducedMotion: true });
    }
  });
})();

/* ---------------- 2. smooth scrolling ---------------- */
let lenis = null;
addEventListener("load", () => {
  if (reduce || !window.Lenis) return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, anchors: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
});
/* script.js calls this instead of scrollIntoView, so the two don't fight */
window.__scrollTo = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 });
  else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
};

/* ---------------- 3. custom cursor ---------------- */
(function cursor() {
  const dot = $("cursor");
  if (!dot || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    dot.classList.add("ready");
    // hide the native cursor only once ours is genuinely following the mouse
    document.body.classList.add("has-cursor");
  });
  addEventListener("mousedown", () => dot.classList.add("press"));
  addEventListener("mouseup", () => dot.classList.remove("press"));
  (function loop() {
    cx += (x - cx) * .18; cy += (y - cy) * .18;
    dot.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();

  const GROW = "a, button, .card, .cake, #cake3d, .envelope, .tile";
  addEventListener("mouseover", (e) => { if (e.target.closest(GROW)) dot.classList.add("grow"); });
  addEventListener("mouseout",  (e) => { if (e.target.closest(GROW)) dot.classList.remove("grow"); });
})();

/* ---------------- 4. magnetic buttons ---------------- */
addEventListener("load", () => {
  if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll("button.primary, .ghost, .miclisten, .audio-toggle").forEach((el) => {
    el.classList.add("magnetic");
    const strength = 0.34;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
});

/* ---------------- 5. tilting wish cards ---------------- */
addEventListener("load", () => {
  if (reduce || !window.VanillaTilt) return;
  VanillaTilt.init(document.querySelectorAll(".wishes .card"), {
    max: 9, speed: 500, glare: true, "max-glare": .18, scale: 1.03, perspective: 900,
  });
});

/* ---------------- 6. confetti when the candle goes out ---------------- */
window.__candleOut = function () {
  if (!window.confetti || reduce) return;
  const el = $("cake3d")?.hidden === false ? $("cake3d") : $("cake");
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const origin = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 3) / innerHeight };
  const gold = ["#e3c389", "#f7ead0", "#b9914e"], violet = ["#8f6fcb", "#6b4a9e", "#c6a6ea"];
  confetti({ particleCount: 90, spread: 70, startVelocity: 46, origin, colors: gold, ticks: 220, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 60, spread: 110, startVelocity: 34, origin, colors: violet, ticks: 200, scalar: .9, disableForReducedMotion: true }), 140);
  setTimeout(() => confetti({ particleCount: 40, spread: 140, startVelocity: 26, origin, colors: gold.concat(violet), ticks: 260, scalar: .7, disableForReducedMotion: true }), 320);
};
/* the 3D cake uses this to land on the same ending as the CSS one */
window.__wishReceived = function () {
  const w = $("wished"); if (w) w.hidden = false;
  const m = $("micListen"); if (m) m.hidden = true;
  const st = $("micState"); if (st) st.hidden = true;
  window.__candleOut();
};

/* ---------------- 7. live counter ---------------- */
(function alive() {
  const sec = $("alive");
  if (!sec || !CONFIG.birthDate) return;
  const born = new Date(CONFIG.birthDate);
  if (isNaN(born)) { console.warn("extras.js: CONFIG.birthDate is not a valid date"); return; }
  sec.hidden = false;
  const d = $("aDays"), h = $("aHours"), m = $("aMins"), s = $("aSecs");
  const pad = (n) => String(n).padStart(2, "0");
  (function tick() {
    const ms = Date.now() - born.getTime();
    d.textContent = Math.floor(ms / 864e5).toLocaleString();
    h.textContent = pad(Math.floor(ms / 36e5) % 24);
    m.textContent = pad(Math.floor(ms / 6e4) % 60);
    s.textContent = pad(Math.floor(ms / 1e3) % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  })();
})();

/* ---------------- 8. music ----------------
   Plays CONFIG.music if that file is there, and falls back to a pad
   synthesised on the spot if it isn't -- so the page works with an
   empty audio folder and starts using a real track the moment one
   is dropped in.                                                    */
(function music() {
  const btn = $("audioToggle");
  if (!btn) return;
  let ctx = null, master = null, voices = [], bell = null, on = false;
  let audio = null, useFile = !!CONFIG.music;

  const CHORD = [110, 164.81, 220, 329.63];          // A2 E3 A3 E4
  const BELLS = [440, 493.88, 554.37, 659.25, 739.99];

  function startSynth() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(.075, ctx.currentTime + 3.5);

    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = 620; filt.Q.value = .6;
    filt.connect(master); master.connect(ctx.destination);

    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = .045; lfoGain.gain.value = 260;
    lfo.connect(lfoGain); lfoGain.connect(filt.frequency); lfo.start();
    voices.push(lfo);

    CHORD.forEach((f, i) => {
      [0, 1].forEach((d) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i > 1 ? "sine" : "triangle";
        o.frequency.value = f * (d ? 1.004 : 0.997);
        g.gain.value = .3 / CHORD.length;
        o.connect(g); g.connect(filt); o.start();
        voices.push(o);
      });
    });

    const ring = () => {
      if (!on) return;
      const f = BELLS[(Math.random() * BELLS.length) | 0];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(.05, ctx.currentTime + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 4.5);
      o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 4.6);
      bell = setTimeout(ring, 6000 + Math.random() * 7000);
    };
    bell = setTimeout(ring, 2500);
  }

  function stopSynth() {
    clearTimeout(bell);
    if (!ctx) return;
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
    const dying = ctx;
    setTimeout(() => { voices.forEach((v) => { try { v.stop(); } catch {} }); dying.close(); }, 1300);
    ctx = null; voices = [];
  }

  /* ---- a real file, if there is one ---- */
  function ramp(el, to, ms, then) {
    const from = el.volume, t0 = performance.now();
    clearInterval(el.__ramp);
    el.__ramp = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k === 1) { clearInterval(el.__ramp); then && then(); }
    }, 40);
  }

  function toSynth() {
    if (!useFile) return;
    useFile = false;
    console.warn("No music file at " + CONFIG.music + " - using the synthesised pad.");
    if (audio) { try { audio.pause(); } catch {} audio = null; }
    if (on) startSynth();
  }

  function startFile() {
    if (!audio) {
      audio = new Audio(CONFIG.music);
      audio.loop = false;              /* plays once, it isn't a loop */
      audio.preload = "none";
      audio.addEventListener("error", toSynth, { once: true });
      /* when it finishes, put the button back so it doesn't sit there
         glowing as though something were still playing */
      audio.addEventListener("ended", () => {
        clearInterval(audio.__ramp);
        audio.currentTime = 0;
        setState(false);
      });
    }
    audio.volume = 0;
    const p = audio.play();
    if (p && p.catch) p.then(() => ramp(audio, CONFIG.musicVolume, 900)).catch(toSynth);
    else ramp(audio, CONFIG.musicVolume, 900);
  }

  function stopFile() {
    if (audio) ramp(audio, 0, 900, () => { try { audio.pause(); } catch {} });
  }

  function setState(playing) {
    on = playing;
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }

  btn.addEventListener("click", () => {
    setState(!on);
    if (on) useFile ? startFile() : startSynth();
    else useFile ? stopFile() : stopSynth();
  });
})();

/* ---------------- 9. blow into the mic ---------------- */
(function mic() {
  const btn = $("micListen"), state = $("micState");
  if (!btn) return;
  if (!navigator.mediaDevices?.getUserMedia) { btn.hidden = true; return; }

  const say = (t) => { state.hidden = false; state.textContent = t; };
  let stream = null, ctx = null, raf = 0;

  function cleanup() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close().catch(() => {});
    stream = ctx = null;
    btn.classList.remove("listening");
  }

  btn.addEventListener("click", async () => {
    if (stream) { cleanup(); btn.textContent = "let the mic listen"; say("stopped listening"); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      say("mic blocked — just click the cake instead");
      btn.hidden = true;
      return;
    }
    btn.classList.add("listening");
    say("listening… now blow");

    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 1024; an.smoothingTimeConstant = .55;
    src.connect(an);

    const bins = new Uint8Array(an.frequencyBinCount);
    const hz = ctx.sampleRate / an.fftSize;
    const lo = Math.max(1, Math.round(60 / hz)), loEnd = Math.round(420 / hz);
    const hiStart = Math.round(1400 / hz), hiEnd = Math.min(bins.length - 1, Math.round(6000 / hz));
    const mean = (a, b) => { let s = 0; for (let i = a; i <= b; i++) s += bins[i]; return s / (b - a + 1); };

    let held = 0;
    (function listen() {
      raf = requestAnimationFrame(listen);
      an.getByteFrequencyData(bins);
      const low = mean(lo, loEnd), high = mean(hiStart, hiEnd);
      // a blow is loud, broadband and bottom-heavy; speech is not
      held = (low > 108 && low > high * 1.55) ? held + 1 : 0;
      if (held > 4) {
        cleanup();
        say("caught it — nicely blown");
        document.getElementById("cake")?.dispatchEvent(new Event("blow"));
        window.__blowFromMic?.();
      }
    })();
  });
})();

/* ---------------- 10. easter egg ---------------- */
(function egg() {
  const panel = $("secret"), close = $("secretClose");
  if (!panel) return;
  let buf = "";
  addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-40);
    if (buf.includes(CONFIG.nickname.toLowerCase())) {
      buf = "";
      panel.hidden = false;
      window.__candleOut?.();
    }
  });
  close.addEventListener("click", () => { panel.hidden = true; });
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.hidden = true; });
})();

/* ---------------- 11. the drifting ribbon + lightbox ----------------
   memories.json is loaded once. The photographs are split into two
   lanes that travel in opposite directions for ever; each lane's
   contents are duplicated so the -50% loop is seamless.               */
(() => {
  const sec = $("memories");
  const ribbon = $("ribbon");
  if (!sec || !ribbon) return;

  const lanes = [...ribbon.querySelectorAll(".lane")];
  const runs = lanes.map((l) => l.querySelector(".run"));
  let MEDIA = [];

  const PLAY =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';

  /* a stable shuffle, so the order is the same on every load */
  function mix(list) {
    const a = [...list];
    let seed = 0x9e37;
    for (let i = a.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const j = seed % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function tile(m, i) {
    const el = document.createElement("div");
    el.className = "tile";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", m.caption || "Open photograph");
    el.style.setProperty("--tilt", (((i * 37) % 9) - 4) * 0.38 + "deg");
    el.dataset.i = m.index;

    if (m.type === "video") {
      const v = document.createElement("video");
      v.src = m.src;
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "metadata";
      v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
      v.play().catch(() => {});
      const tag = document.createElement("span");
      tag.className = "vtag"; tag.innerHTML = PLAY;
      el.append(v, tag);
    } else {
      const img = document.createElement("img");
      img.src = m.thumb || m.src;
      img.alt = m.caption || "A photograph";
      if (m.w && m.h) { img.width = m.w; img.height = m.h; }  /* reserve the gap */
      img.loading = i > 5 ? "lazy" : "eager";
      img.decoding = "async";
      img.draggable = false;
      el.append(img);
    }
    return el;
  }

  function build(list) {
    MEDIA = list.map((m, index) => ({ ...m, index }));
    sec.hidden = false;

    const shuffled = mix(MEDIA);
    const half = Math.ceil(shuffled.length / 2);
    const split = [shuffled.slice(0, half), shuffled.slice(half)];

    split.forEach((group, n) => {
      if (!group.length) { lanes[n].hidden = true; return; }
      /* twice through, so translateX(-50%) lands exactly on a repeat */
      const frag = document.createDocumentFragment();
      for (let pass = 0; pass < 2; pass++) {
        group.forEach((m, i) => {
          const t = tile(m, i + pass * group.length);
          if (pass === 1) t.setAttribute("aria-hidden", "true");
          frag.append(t);
        });
      }
      runs[n].append(frag);
    });

    pace();
  }

  /* One lane-length should take about the same time whatever is in it,
     so the duration comes from the measured width, not the tile count.
     ~34 px/s reads as "drifting" rather than "scrolling past".        */
  function pace() {
    runs.forEach((run, n) => {
      if (!run.children.length) return;
      const w = run.scrollWidth / 2;           /* one pass, before the repeat */
      if (!w) return;
      run.style.setProperty("--dur", Math.round(w / (34 - n * 3)) + "s");
    });
  }
  addEventListener("resize", () => clearTimeout(pace.t) || (pace.t = setTimeout(pace, 250)));
  addEventListener("load", pace);

  /* ---- click / keyboard anywhere in the ribbon opens the lightbox ---- */
  let byKey = false;            /* was the lightbox opened from the keyboard? */
  ribbon.addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (t) { byKey = false; open(+t.dataset.i, t); }
  });
  ribbon.addEventListener("keydown", (e) => {
    const t = e.target.closest(".tile");
    if (t && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault(); byKey = true; open(+t.dataset.i, t);
    }
  });

  /* ---------------- lightbox ---------------- */
  const box = $("lightbox");
  const media = $("lbMedia");
  const cap = $("lbCap");
  const count = $("lbCount");
  let at = -1, lastFocus = null, fromRect = null;

  function render(i) {
    const m = MEDIA[i];
    if (!m) return;
    at = i;
    media.textContent = "";
    if (m.type === "video") {
      const v = document.createElement("video");
      v.src = m.src; v.controls = true; v.autoplay = true; v.loop = true;
      v.playsInline = true; v.setAttribute("playsinline", "");
      media.append(v);
    } else {
      const img = document.createElement("img");
      img.alt = m.caption || "A photograph";
      img.draggable = false;
      if (m.w && m.h) { img.width = m.w; img.height = m.h; }
      if (m.thumb && m.thumb !== m.src) {
        img.src = m.thumb;                 /* already cached: opens instantly */
        img.classList.add("soft");
        const full = new Image();
        full.decoding = "async";
        full.onload = () => {
          if (media.firstElementChild !== img) return;   /* moved on already */
          img.src = m.src;
          img.classList.remove("soft");
        };
        full.src = m.src;
      } else {
        img.src = m.src;
      }
      media.append(img);
    }
    cap.textContent = m.caption || "";
    if (count) count.textContent = i + 1 + " / " + MEDIA.length;
  }

  /* The frame starts life exactly where the thing you touched is, then
     grows into place — so the photograph looks like it flew out of it. */
  function flyFrom(rect, back) {
    const frame = $("lbFrame");
    if (!frame || !rect || reduce) return false;
    const to = frame.getBoundingClientRect();   /* exact, because the <img> */
    if (!to.width || !to.height) return false;  /* carries w/h from the JSON */
    const t = "translate(" +
      (rect.left + rect.width / 2 - (to.left + to.width / 2)) + "px," +
      (rect.top + rect.height / 2 - (to.top + to.height / 2)) + "px) scale(" +
      rect.width / to.width + "," + rect.height / to.height + ")";
    if (!back) frame.style.transition = "none";
    frame.style.transform = t;
    return true;
  }

  function open(i, from) {
    if (!box || i < 0) return;
    lastFocus = from || document.activeElement;
    render(i);
    box.hidden = false;
    ribbon.classList.add("held");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    fromRect = from ? from.getBoundingClientRect() : null;
    const frame = $("lbFrame");
    const flew = flyFrom(fromRect, false);      /* start life on the thumbnail */
    requestAnimationFrame(() => {
      box.classList.add("on");
      if (flew) { frame.style.transition = ""; frame.style.transform = ""; }
    });
    $("lbClose")?.focus({ preventScroll: true });
  }

  function close() {
    if (!box || box.hidden) return;
    box.classList.remove("on");
    flyFrom(fromRect, true);            /* and back into the photograph */
    ribbon.classList.remove("held");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    setTimeout(() => {
      box.hidden = true;
      $("lbFrame").style.transform = "";
      media.textContent = "";          /* stops any playing video */
      /* Hand focus back only to someone who was using the keyboard. Doing
         it after a mouse click would leave the tile focused, and a focused
         tile holds its lane still -- the ribbon would stop for good.     */
      if (byKey) lastFocus?.focus?.({ preventScroll: true });
      else if (lastFocus && lastFocus.blur) lastFocus.blur();
    }, 320);
  }

  const step = (d) => render((at + d + MEDIA.length) % MEDIA.length);

  $("lbClose")?.addEventListener("click", close);
  $("lbPrev")?.addEventListener("click", () => step(-1));
  $("lbNext")?.addEventListener("click", () => step(1));
  box?.addEventListener("click", (e) => { if (e.target === box) close(); });
  addEventListener("keydown", (e) => {
    if (!box || box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });

  /* swipe, on a phone */
  let sx = 0;
  box?.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  box?.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 55) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  fetch("memories.json")
    .then((r) => (r.ok ? r.json() : []))
    .then((list) => { if (Array.isArray(list) && list.length) build(list); })
    .catch(() => {});
})();
