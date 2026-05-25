// night.jsx — your picked aesthetic with a Day / Night palette toggle.
// All non-color choices (borders, radii, surface, lyric weight, section
// markers) are locked to what you picked in the interview. Only the
// palette flips between Vellum (day) and Midnight Vellum (night).

// Your day picks — recovered from the interview state
const DAY_VARS = {
  // Vellum palette
  "--kk-base": "#f0e6d0", "--kk-surface": "#ebdfc4", "--kk-raised": "#e3d4b2", "--kk-raised-2": "#dac99e",
  "--kk-ink": "#3a2418", "--kk-ink-dim": "#5a3a2a", "--kk-text": "#3a2a1f",
  "--kk-muted": "#5d4e3f", "--kk-muted-2": "#8a7a64",
  "--kk-rule": "#c9b48a", "--kk-rule-soft": "#d4c19a",
  "--kk-glass-tint": "rgba(255,252,240,0.50)", "--kk-glass-tint-2": "rgba(255,252,240,0.22)",
  "--kk-glass-edge": "rgba(58,36,24,0.20)", "--kk-glass-hi": "rgba(255,252,240,0.65)",
  "--kk-glass-lo": "rgba(58,36,24,0.08)", "--kk-glass-shadow": "0 24px 60px rgba(90,50,20,0.18)",
  // Deep indigo accent (your pick)
  "--kk-blue": "#3a4ea8", "--kk-blue-deep": "#27387a", "--kk-blue-wash": "rgba(58,78,168,0.12)",
  // amber/green/red follow Vellum tonality
  "--kk-amber": "#a36210", "--kk-amber-wash": "rgba(163,98,16,0.10)",
  "--kk-green": "#5a7a40", "--kk-green-wash": "rgba(90,122,64,0.10)",
  "--kk-red":   "#a83820", "--kk-red-wash":   "rgba(168,56,32,0.10)",
};

// Faery Vellum — cyberpunk year 900.
// Deep ink-stained vellum, cream parchment ink, faery mint-cyan accent
// replacing the deep indigo. Candle-gold as the secondary glow (amber).
// Greens/reds re-tuned so the accent stays unique.
const NIGHT_VARS = {
  // Faery Vellum base — ink-stained parchment at night
  "--kk-base":      "#0d0c08",
  "--kk-surface":   "#14110b",
  "--kk-raised":    "#1c1810",
  "--kk-raised-2":  "#262116",
  "--kk-ink":       "#ede0bf",
  "--kk-ink-dim":   "#cdb88e",
  "--kk-text":      "#ad9876",
  "--kk-muted":     "#6e5b42",
  "--kk-muted-2":   "#4a3d2c",
  "--kk-rule":      "#2a2418",
  "--kk-rule-soft": "#1a160e",

  // Liquid surfaces — warm with a faint cyan-green undertone
  "--kk-glass-tint":   "rgba(156,231,180,0.06)",
  "--kk-glass-tint-2": "rgba(237,224,191,0.02)",
  "--kk-glass-edge":   "rgba(237,224,191,0.12)",
  "--kk-glass-hi":     "rgba(156,231,180,0.10)",
  "--kk-glass-lo":     "rgba(0,0,0,0.6)",
  "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.7), 0 0 80px rgba(156,231,180,0.05)",

  // Faery accent — replaces blue. Mint-cyan, glows when active.
  "--kk-blue":      "#9ce7b4",
  "--kk-blue-deep": "#5cb87e",
  "--kk-blue-wash": "rgba(156,231,180,0.12)",

  // Candle gold for amber/spend
  "--kk-amber":      "#f0c25c",
  "--kk-amber-wash": "rgba(240,194,92,0.10)",

  // Sage green for state-fit — distinct from the faery accent
  "--kk-green":      "#5f8a5a",
  "--kk-green-wash": "rgba(95,138,90,0.10)",

  // Coral red for drift — warm to match the palette
  "--kk-red":      "#e07c6a",
  "--kk-red-wash": "rgba(224,124,106,0.10)",
};

// Locked non-color choices from your interview
const LOCKED_VARS = {
  "--kk-border-w": "0px",
  "--kk-border-style": "solid",
  "--kk-r-1": "2px", "--kk-r-2": "3px", "--kk-r-3": "4px", "--kk-r-4": "6px",
  "--kk-lyric-weight": "450",
  "--kk-s-lyric": "19px",
  "--kk-surface-mode": "liquid",
  "--kk-elev-shadow": "0 24px 60px rgba(0,0,0,0.45)",
};

function NightLab() {
  const [mode, setMode] = React.useState("night"); // 'day' | 'night'
  const palette = mode === "night" ? NIGHT_VARS : DAY_VARS;
  const allVars = { ...LOCKED_VARS, ...palette };

  // apply
  const styleId = "kk-night-vars";
  React.useEffect(() => {
    let el = document.getElementById(styleId);
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }
    el.textContent = `.kk-night-live {\n${Object.entries(allVars).map(([k,v])=>`  ${k}: ${v};`).join("\n")}\n}`;
  }, [mode]);

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: mode === "night" ? "#070605" : "#1a1610", color: "#c9c3b6", display: "flex", flexDirection: "column" }}>
      <NightBar mode={mode} setMode={setMode} />
      <div className="kk-night-live" style={{ display: "contents" }}>
        <div style={{ padding: "20px 24px 40px", maxWidth: 1480, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: mode === "night" ? "#6e5b42" : "#856a52",
              }}>your aesthetic · locked picks</div>
              <h2 style={{
                fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 700,
                color: mode === "night" ? "#ede0bf" : "#3a2418", fontSize: 22, margin: "4px 0 0",
              }}>{mode === "night" ? "Faery Vellum" : "Vellum"}</h2>
            </div>
            <PickSummary mode={mode} />
          </div>

          <div style={{
            borderRadius: 4, overflow: "hidden", position: "relative",
            boxShadow: mode === "night"
              ? "0 24px 80px rgba(0,0,0,0.7), 0 0 120px rgba(156,231,180,0.06)"
              : "0 24px 60px rgba(70,45,30,0.25)",
          }}>
            <ConsoleScreen theme="night" />
          </div>

          <ApprovalRow mode={mode} />
        </div>
      </div>
    </div>
  );
}

// FaeryLights — scattered tiny glow points overlaid on the artboard.
// Pure decorative motif (the only place in the design we allow this),
// it sells the "cyberpunk year 900" feel without becoming neon haze.
function FaeryLights() {
  // deterministic seed so the dots don't shuffle every render
  const dots = React.useMemo(() => {
    const out = [];
    let s = 42;
    for (let i = 0; i < 22; i++) {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      s = (s * 9301 + 49297) % 233280; const r2 = s / 233280;
      s = (s * 9301 + 49297) % 233280; const r3 = s / 233280;
      out.push({
        left: 4 + r * 92,
        top:  4 + r2 * 92,
        size: 2 + r3 * 4,
        hue:  r > 0.7 ? "#f0c25c" : r > 0.4 ? "#9ce7b4" : "#cdf5d8",
        opacity: 0.55 + r2 * 0.35,
        delay: r3 * 4,
      });
    }
    return out;
  }, []);
  return (
    <>
      <style>{`
        @keyframes faery-breath {
          0%, 100% { opacity: var(--o, 0.7); transform: scale(1); }
          50%      { opacity: calc(var(--o, 0.7) * 0.4); transform: scale(0.85); }
        }
      `}</style>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        mixBlendMode: "screen",
      }}>
        {dots.map((d, i) => (
          <span key={i} style={{
            position: "absolute",
            left: d.left + "%", top: d.top + "%",
            width: d.size, height: d.size, borderRadius: "50%",
            background: d.hue,
            boxShadow: `0 0 ${d.size * 4}px ${d.size}px ${d.hue}40`,
            "--o": d.opacity,
            opacity: d.opacity,
            animation: `faery-breath ${4 + d.delay}s ${d.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </>
  );
}

function NightBar({ mode, setMode }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", gap: 14,
      padding: "10px 20px",
      background: mode === "night"
        ? "linear-gradient(180deg, #14110b, #070605)"
        : "linear-gradient(180deg, #2b2218, #1a1610)",
      borderBottom: "1px solid " + (mode === "night" ? "#1a160e" : "#3a2e1f"),
      color: mode === "night" ? "#ad9876" : "#a89072",
      fontFamily: '"Source Sans 3", system-ui, sans-serif',
    }}>
      <div style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 700, color: mode === "night" ? "#ede0bf" : "#f4ead9", fontSize: 15 }}>
        Day · Night
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#6e5b42", letterSpacing: "0.12em" }}>
        your interview picks · palette flips, picks hold
      </div>
      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", padding: 3, background: mode === "night" ? "#070605" : "#1a1610", border: "1px solid " + (mode === "night" ? "#1a160e" : "#3a2e1f"), borderRadius: 999 }}>
        <button onClick={() => setMode("day")}
          style={{
            padding: "6px 16px", borderRadius: 999,
            border: "1px solid " + (mode === "day" ? "#a36210" : "transparent"),
            background: mode === "day" ? "rgba(163,98,16,0.15)" : "transparent",
            color: mode === "day" ? "#f4ead9" : "#6e5b42",
            fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 500, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
          ☀ Day · Vellum
        </button>
        <button onClick={() => setMode("night")}
          style={{
            padding: "6px 16px", borderRadius: 999,
            border: "1px solid " + (mode === "night" ? "#9ce7b4" : "transparent"),
            background: mode === "night" ? "rgba(156,231,180,0.12)" : "transparent",
            color: mode === "night" ? "#ede0bf" : "#6e5b42",
            fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 500, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: mode === "night" ? "0 0 12px rgba(156,231,180,0.25)" : "none",
          }}>
          ✨ Night · Faery Vellum
        </button>
      </div>

      <a href="interview.html" style={{
        padding: "5px 10px", fontFamily: '"Cabinet Grotesk", sans-serif',
        fontSize: 11, color: "#6e5b42", textDecoration: "none",
        border: "1px solid " + (mode === "night" ? "#1a160e" : "#3a2e1f"), borderRadius: 5,
      }}>← interview</a>
    </div>
  );
}

function PickSummary({ mode }) {
  const c = mode === "night" ? "#b8a285" : "#7a6a5e";
  const k = mode === "night" ? "#806b50" : "#a89072";
  const Item = ({ label, val }) => (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: k, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ color: c, fontSize: 12 }}>{val}</span>
    </span>
  );
  return (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
      <Item label="palette" val={mode === "night" ? "faery vellum" : "vellum"} />
      <Item label="accent" val={mode === "night" ? "faery cyan" : "deep indigo"} />
      <Item label="borders" val="invisible · 0px" />
      <Item label="radii" val="tight · 2/3/4/6" />
      <Item label="surface" val="liquid glass" />
      <Item label="lyric" val="Fraunces 450" />
    </div>
  );
}

function ApprovalRow({ mode }) {
  return (
    <div style={{
      marginTop: 20, padding: "14px 18px",
      background: mode === "night" ? "rgba(126,144,216,0.06)" : "rgba(58,78,168,0.08)",
      border: "1px solid " + (mode === "night" ? "rgba(126,144,216,0.25)" : "rgba(58,78,168,0.25)"),
      borderRadius: 6,
      display: "flex", alignItems: "center", gap: 14,
      fontFamily: '"Source Sans 3", sans-serif',
      color: mode === "night" ? "#d8c5a0" : "#4a3527",
    }}>
      <div style={{ fontSize: 13.5, flex: 1 }}>
        {mode === "night" ? (
          <>
            <b style={{ color: "#ede0bf" }}>Faery Vellum.</b> Cyberpunk year 900 — ink-stained vellum at midnight,
            mint-cyan accent where indigo used to be, candle-gold secondary, scattered faery lights you can see drifting
            across the room. All non-color picks are held: invisible borders, tight radii, liquid glass, Fraunces 450.
          </>
        ) : (
          <>
            <b style={{ color: "#3a2418" }}>Vellum (day).</b> Your day pick exactly as the interview locked it.
          </>
        )}
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: mode === "night" ? "#6e5b42" : "#7a6a5e" }}>
        tell me <span style={{ color: mode === "night" ? "#9ce7b4" : "#3a4ea8" }}>"approve faery"</span> or <span style={{ color: mode === "night" ? "#9ce7b4" : "#3a4ea8" }}>"approve day"</span> to roll
      </div>
    </div>
  );
}

window.NightLab = NightLab;
const nRoot = ReactDOM.createRoot(document.getElementById("mount"));
nRoot.render(<NightLab />);
