// lib/fabric.jsx — LyricFabric: the song itself rendered as a breathing
// background fabric behind the active lyric document.
//
// Technique adapted from the ascii-orb shader: a grid of characters with
// per-cell opacity modulated by fbm noise, animating slowly so depth
// emerges as a wave through the text. No GLSL, no WebGL — just a 2D
// canvas with a noise field. Theme-aware (reads --kk-ink at runtime).
//
// Mounts as <LyricFabric/> inside any positioned container (e.g.
// <main className="kk-center">). Sits at z-index 0; foreground content
// must be z-index >= 1.

const FBM = (() => {
  // tiny deterministic noise — value noise + 3 octaves of fbm
  const hash2 = (x, y) => {
    let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const valueNoise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const a = hash2(ix, iy);
    const b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1);
    const d = hash2(ix + 1, iy + 1);
    const ux = smooth(fx), uy = smooth(fy);
    return a + (b - a) * ux + (c - a) * uy * (1 - ux) + (d - b) * ux * uy;
  };
  const fbm = (x, y) => {
    let v = 0, amp = 0.5;
    for (let i = 0; i < 3; i++) { v += amp * valueNoise(x, y); x *= 2.02; y *= 2.02; amp *= 0.5; }
    return v; // ~0..0.9
  };
  return { fbm };
})();

// Convert "rgb(r, g, b)" or "#hex" → [r, g, b]
function parseColor(str) {
  if (!str) return [240, 224, 191];
  str = str.trim();
  if (str.startsWith("#")) {
    const h = str.slice(1);
    const v = h.length === 3
      ? h.split("").map((c) => parseInt(c + c, 16))
      : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return v;
  }
  const m = str.match(/(\d+)[^\d]+(\d+)[^\d]+(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [240, 224, 191];
}

function LyricFabric({
  // Build a short alphabet from the song's text so the fabric still IS
  // the lyrics — just remixed by the noise field instead of read linearly.
  // Each cell picks a char from this ramp based on noise; as the field
  // flows, adjacent frames produce neighboring ramp indices, so chars
  // shift CONTINUOUSLY rather than ticking.
  text = (window.ALMOST_LOVE ? window.ALMOST_LOVE.doc : [])
    .map((r) => r.kind === "section" ? "" : r.text)
    .join(" "),
  opacity = 0.16,
  fontSize = 13,
  speed = 0.18,
}) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let cellW = 0, cellH = 0, cols = 0, rows = 0;
    let raf = 0;
    let stopped = false;

    // resolve theme ink from CSS at the parent
    const inkColor = () => {
      const v = getComputedStyle(canvas.parentElement || canvas).getPropertyValue("--kk-ink").trim();
      return parseColor(v) || [240, 224, 191];
    };

    const sizeFor = () => {
      const parent = canvas.parentElement;
      if (!parent) return { w: 800, h: 600 };
      const r = parent.getBoundingClientRect();
      return { w: Math.max(200, r.width), h: Math.max(200, r.height) };
    };

    const layout = () => {
      const { w, h } = sizeFor();
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // measure cell w/h with current font
      ctx.font = `${fontSize}px "Fraunces", Georgia, serif`;
      ctx.textBaseline = "top";
      const probe = ctx.measureText("M");
      cellW = Math.max(7, probe.width * 0.95);
      cellH = fontSize * 1.25;
      cols = Math.floor(w / cellW);
      rows = Math.floor(h / cellH);
    };

    // Build a ramp of unique characters from the song, in order of
    // first-appearance. The ramp drives the continuous flow: with the
    // fbm field shifting smoothly, indices into this ramp shift by ±1
    // each frame, so characters morph as the noise wave passes.
    const seen = new Set();
    let ramp = "";
    for (const ch of text) {
      const c = ch.toLowerCase();
      if (c === " " || c === "\n") continue;
      if (!seen.has(c)) { seen.add(c); ramp += c; }
    }
    if (ramp.length < 4) ramp = "almostlve"; // safety fallback
    const rampLen = ramp.length;

    const tick = (t0) => {
      if (stopped) return;
      const t = t0 * 0.001 * speed;
      const { w, h } = { w: canvas.width / dpr, h: canvas.height / dpr };
      ctx.clearRect(0, 0, w, h);

      const [ir, ig, ib] = inkColor();

      ctx.font = `${fontSize}px "Fraunces", Georgia, serif`;
      ctx.textBaseline = "top";

      // Orb-style: per cell, sample a flowing fbm field and map the
      // result through a small ramp of song letters. Two octaves drift
      // in different directions so the field doesn't have one axis
      // of motion. Density gates which cells get drawn this frame and
      // controls per-cell opacity bucket.
      const buckets = [[], [], [], [], [], []];
      const tt = t;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // smooth flowing noise (the orb's cellular term)
          const cellular = FBM.fbm(c * 0.09 + tt * 1.4, r * 0.09 + tt * 0.8);
          // a slow wave that adds direction (like the orb's swirl + waves)
          const waves = 0.5 + 0.5 * Math.sin(c * 0.18 + r * 0.07 + tt * 3.2 + cellular * 3.6);
          // density: how present this cell is. Falls off slightly toward edges
          // so the fabric breathes thicker in the middle.
          const ny = (r - rows * 0.5) / (rows * 0.5);
          const nx = (c - cols * 0.5) / (cols * 0.5);
          const dist = Math.min(1, nx * nx * 0.35 + ny * ny * 0.55);
          const density = cellular * 0.85 + waves * 0.20 - dist * 0.20;
          if (density < 0.18) continue;

          // continuous char index — with noise drifting smoothly, this
          // moves by ±1 per frame, producing the orb's character flow.
          const idx = Math.floor((cellular + waves) * rampLen * 1.7) % rampLen;
          const ch = ramp[(idx + rampLen) % rampLen];

          // bucket by density for fillStyle batching
          const a = Math.min(0.9, opacity * (0.4 + density * 1.6));
          const tier = Math.min(5, Math.floor((density - 0.18) / 0.14));
          buckets[tier].push([c * cellW, r * cellH, ch, a]);
        }
      }

      for (let t2 = 0; t2 < 6; t2++) {
        const list = buckets[t2];
        if (!list.length) continue;
        // one alpha per bucket, averaged from contributions
        const a = Math.min(0.85, opacity * (0.35 + t2 * 0.28));
        ctx.fillStyle = `rgba(${ir},${ig},${ib},${a.toFixed(3)})`;
        for (let i = 0; i < list.length; i++) {
          ctx.fillText(list[i][2], list[i][0], list[i][1]);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    layout();
    raf = requestAnimationFrame(tick);

    let resizeQueued = false;
    const onResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => { resizeQueued = false; layout(); });
    };
    window.addEventListener("resize", onResize);
    // re-layout on parent size changes
    const ro = new ResizeObserver(onResize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [text, opacity, fontSize, speed]);

  return (
    <canvas ref={canvasRef} aria-hidden="true"
      style={{
        position: "absolute", inset: 0, zIndex: 0,
        pointerEvents: "none",
        // a touch of mix so it never punches through readable text
        mixBlendMode: "normal",
      }}
    />
  );
}

window.LyricFabric = LyricFabric;
