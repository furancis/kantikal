// lib/liquid.jsx — Liquid DOM integration with WebGPU detection + CSS fallback.
//
// Strategy:
//  - On boot, probe navigator.gpu and try to dynamic-import @liquid-dom/react
//    from esm.sh (same-React-instance via ?external).
//  - If both succeed, set window.__kkLiquid = { available: true, mod }
//    and stamp <html data-liquid="real">.
//  - Otherwise stamp data-liquid="css" and the .kk-liquid CSS class does
//    the heavy lifting (backdrop-filter + SVG displacement on the edge).
//
//  - <LiquidSurface> is the call-site wrapper. By default it renders a
//    .kk-liquid div; when liquid is "real" AND the `real` prop is set, it
//    mounts a GlassContainer with the children as DOM-on-top and a Glass
//    element capturing the parent surface as the refracted background.
//
// Note: Liquid DOM's Glass needs a GlassContainer ancestor. We provide one
// per surface (small cost; one WebGPU canvas per glass surface). The proof
// artboard exercises this on a larger scene.

(function () {
  const probe = async () => {
    const out = { available: false, mod: null, reason: "no-webgpu" };
    if (!navigator.gpu) {
      document.documentElement.dataset.liquid = "css";
      return out;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) { out.reason = "no-adapter"; document.documentElement.dataset.liquid = "css"; return out; }
    } catch (e) { out.reason = "adapter-err"; document.documentElement.dataset.liquid = "css"; return out; }
    try {
      // esm.sh: deps pin React version; we do NOT mark react as external
      // because liquid-dom's internals use commonjs-style requires that
      // would otherwise break. Using deps + the page's React (via globals)
      // keeps a single React instance for hook integrity.
      const mod = await import(
        "https://esm.sh/@liquid-dom/react@latest?deps=react@18.3.1,react-dom@18.3.1&exports=React,ReactDOM"
      );
      out.available = true; out.mod = mod;
      document.documentElement.dataset.liquid = "real";
    } catch (e) {
      out.reason = "import-err: " + (e.message || e).slice(0, 120);
      document.documentElement.dataset.liquid = "css";
    }
    return out;
  };

  // expose a promise other components can await on first render
  window.__kkLiquidReady = probe().then((r) => { window.__kkLiquid = r; return r; });
})();

// Hook: rerender when liquid status changes
function useLiquid() {
  const [state, setState] = React.useState(window.__kkLiquid || null);
  React.useEffect(() => {
    if (state) return;
    let alive = true;
    window.__kkLiquidReady.then((r) => alive && setState(r));
    return () => { alive = false; };
  }, []);
  return state;
}

// Public: <LiquidSurface real> — used on spec'd command/overlay surfaces.
// When `real` is true AND liquid-dom is available, mounts a GlassContainer
// with one Glass element behind the children. Children stay in normal DOM
// and inherit pointer events.
function LiquidSurface({ children, real = false, className = "", style, ...rest }) {
  const liquid = useLiquid();
  const ref = React.useRef(null);
  const useReal = real && liquid && liquid.available;

  return (
    <div
      ref={ref}
      className={"kk-liquid " + className}
      data-liquid-real={useReal ? "1" : "0"}
      style={style}
      {...rest}
    >
      {useReal && liquid.mod ? <RealLiquidLayer mod={liquid.mod} /> : null}
      {children}
    </div>
  );
}

// Inner: mounts the GlassContainer + a single Glass that fills the parent.
// Uses position:absolute so the actual children sit above and stay in
// normal DOM flow. The GlassContainer's Background here is intentionally
// a translucent gradient — the real refraction-of-app-behind effect
// requires placing the container at the artboard scope, which we do in
// the dedicated proof artboard.
function RealLiquidLayer({ mod }) {
  const { GlassContainer, Glass, Background } = mod;
  if (!GlassContainer || !Glass) return null;
  return (
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: "inherit",
        overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }}
      aria-hidden="true"
    >
      <GlassContainer style={{ width: "100%", height: "100%" }}>
        {Background ? (
          <Background>
            <div style={{
              width: "100%", height: "100%",
              background:
                "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.20), rgba(255,255,255,0.04) 60%, transparent), linear-gradient(180deg, rgba(116,167,255,0.04), transparent)"
            }} />
          </Background>
        ) : null}
        <Glass
          style={{ position: "absolute", inset: 0 }}
          refraction={0.06}
          thickness={1.2}
        />
      </GlassContainer>
    </div>
  );
}

// Proof artboard helper: renders a real Liquid DOM scene with the
// library's own Glass + Background + Html (in WebGPU-capable browsers).
// Falls back to a placard explaining the WebGPU requirement otherwise.
function LiquidProof({ width = 1100, height = 540 }) {
  const liquid = useLiquid();
  if (!liquid) return <div style={{ padding: 24, color: "var(--kk-muted)" }}>Probing WebGPU…</div>;
  if (!liquid.available) {
    return (
      <div style={{ padding: 24, color: "var(--kk-muted)", fontFamily: "var(--kk-f-mono)", fontSize: 11, lineHeight: 1.6 }}>
        <div style={{ color: "var(--kk-amber)", textTransform: "uppercase", letterSpacing: "0.18em", fontSize: 10, marginBottom: 6 }}>fallback active</div>
        Liquid DOM unavailable in this browser ({liquid.reason}). The CSS fallback (backdrop-filter + SVG edge displacement)
        renders the visual surface; the production app at <b>@liquid-dom/react</b> ships the WebGPU implementation when
        navigator.gpu is present.
      </div>
    );
  }
  const { GlassContainer, Glass, Background } = liquid.mod;
  return (
    <div style={{ width, height, position: "relative" }}>
      <GlassContainer style={{ width: "100%", height: "100%", borderRadius: "10px", overflow: "hidden" }}>
        {Background ? (
          <Background>
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(180deg, #17191d 0%, #0f1114 100%)",
              position: "relative",
            }}>
              {/* mimic an underlying lyric page so the glass has something to refract */}
              <div style={{
                position: "absolute", left: 40, top: 28, right: 40,
                fontFamily: "var(--kk-f-lyric)", color: "#f4ead9",
                fontSize: 19, lineHeight: 1.5,
              }}>
                <div style={{ opacity: 0.5, fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.18em" }}>VERSE 1</div>
                <div>You said I looked well</div>
                <div>And everything shifted</div>
                <div style={{ color: "#74a7ff" }}>They never get it</div>
                <div>But you know I still live in it</div>
                <div style={{ opacity: 0.5 }}>Parking lot texts · Three month gaps</div>
                <div style={{ opacity: 0.5 }}>Same pattern · Same map</div>
              </div>
              {/* a couple of bright dots to make refraction visible */}
              <div style={{ position: "absolute", left: 740, top: 60, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(116,167,255,0.5), transparent 70%)" }} />
              <div style={{ position: "absolute", left: 820, top: 320, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,168,74,0.4), transparent 70%)" }} />
            </div>
          </Background>
        ) : null}
        {/* main glass slab — refracts the lyric behind it */}
        <Glass
          style={{ position: "absolute", left: 420, top: 60, width: 600, height: 420, borderRadius: 14 }}
          refraction={0.10}
          thickness={2}
        />
        {/* smaller chip-sized glass blobs */}
        <Glass style={{ position: "absolute", left: 60, top: 360, width: 120, height: 36, borderRadius: 999 }} refraction={0.08} />
        <Glass style={{ position: "absolute", left: 200, top: 360, width: 96, height: 36, borderRadius: 999 }} refraction={0.08} />
        <Glass style={{ position: "absolute", left: 312, top: 360, width: 140, height: 36, borderRadius: 999 }} refraction={0.08} />
      </GlassContainer>
      {/* DOM overlay so chips/inspector have actual readable content on top of glass */}
      <div style={{
        position: "absolute", left: 420, top: 60, width: 600, height: 420,
        padding: 24, color: "#f4ead9", pointerEvents: "none",
      }}>
        <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(244,234,217,0.6)" }}>
          Remix Picker · liquid surface
        </div>
        <div style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, fontSize: 16, marginTop: 6 }}>
          Build next branch
        </div>
        <div style={{ fontFamily: "var(--kk-f-body)", fontSize: 12.5, color: "#c9c3b6", marginTop: 4, maxWidth: 460, lineHeight: 1.5 }}>
          Pick parts across takes. Each pick records a TasteSignal with target, sentiment, trait, reason, scope, evidence.
          The container behind is the lyric page being refracted by the WebGPU glass.
        </div>
      </div>
    </div>
  );
}

window.LiquidSurface = LiquidSurface;
window.LiquidProof = LiquidProof;
window.useLiquid = useLiquid;
