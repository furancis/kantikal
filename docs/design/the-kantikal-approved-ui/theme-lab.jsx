// theme-lab.jsx — live theme explorer.
// One page: Lyric Console at full size + a floating picker that swaps
// every --kk-* variable in place. Pick a direction, I'll roll it everywhere.

// 6 directions. Each is a full palette (background → ink → semantic).
// Type is locked (Fraunces · Cabinet Grotesk · Source Sans 3 · IBM Plex Mono).
const THEMES = [
  {
    id: "crypt",
    name: "Crypt",
    blurb: "Dark base, cream lyric ink, blue accent. The spec direction.",
    swatches: ["#0f1114", "#f4ead9", "#74a7ff"],
    vars: {
      "--kk-base": "#0f1114", "--kk-surface": "#17191d", "--kk-raised": "#202329", "--kk-raised-2": "#272a31",
      "--kk-ink": "#f4ead9", "--kk-ink-dim": "#d8cdb9", "--kk-text": "#c9c3b6",
      "--kk-muted": "#aaa094", "--kk-muted-2": "#7a7367",
      "--kk-rule": "#34302a", "--kk-rule-soft": "#25221d",
      "--kk-blue": "#74a7ff", "--kk-blue-deep": "#3a6fd6", "--kk-blue-wash": "rgba(116,167,255,0.10)",
      "--kk-amber": "#e0a84a", "--kk-amber-wash": "rgba(224,168,74,0.10)",
      "--kk-green": "#70d38e", "--kk-green-wash": "rgba(112,211,142,0.10)",
      "--kk-red":   "#e06f5b", "--kk-red-wash":   "rgba(224,111,91,0.10)",
      "--kk-glass-tint": "rgba(255,255,255,0.06)", "--kk-glass-tint-2": "rgba(255,255,255,0.015)",
      "--kk-glass-edge": "rgba(244,234,217,0.10)", "--kk-glass-hi": "rgba(255,255,255,0.06)",
      "--kk-glass-lo": "rgba(0,0,0,0.5)", "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.55)",
    },
  },
  {
    id: "nocturne",
    name: "Nocturne",
    blurb: "Deepest near-black, blue-tinted ink, gold accent. Most monastic.",
    swatches: ["#070809", "#dbe1ec", "#d4a256"],
    vars: {
      "--kk-base": "#070809", "--kk-surface": "#0f1115", "--kk-raised": "#181b21", "--kk-raised-2": "#1e2229",
      "--kk-ink": "#dbe1ec", "--kk-ink-dim": "#b6becc", "--kk-text": "#a7b0bf",
      "--kk-muted": "#7e8694", "--kk-muted-2": "#586172",
      "--kk-rule": "#22272f", "--kk-rule-soft": "#161a20",
      "--kk-blue": "#d4a256", "--kk-blue-deep": "#9f7430", "--kk-blue-wash": "rgba(212,162,86,0.10)",
      "--kk-amber": "#d4a256", "--kk-amber-wash": "rgba(212,162,86,0.10)",
      "--kk-green": "#8eba88", "--kk-green-wash": "rgba(142,186,136,0.10)",
      "--kk-red":   "#c4715f", "--kk-red-wash":   "rgba(196,113,95,0.10)",
      "--kk-glass-tint": "rgba(220,228,240,0.06)", "--kk-glass-tint-2": "rgba(220,228,240,0.015)",
      "--kk-glass-edge": "rgba(220,228,240,0.10)", "--kk-glass-hi": "rgba(255,255,255,0.04)",
      "--kk-glass-lo": "rgba(0,0,0,0.6)", "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.7)",
    },
  },
  {
    id: "plate",
    name: "Plate",
    blurb: "Cool dark, slate-grey lyric ink, copper accent. Reads like film stock.",
    swatches: ["#13161a", "#e1e6ee", "#c97a4a"],
    vars: {
      "--kk-base": "#13161a", "--kk-surface": "#1a1e23", "--kk-raised": "#22272d", "--kk-raised-2": "#2a3038",
      "--kk-ink": "#e1e6ee", "--kk-ink-dim": "#c1c8d2", "--kk-text": "#a8b0bc",
      "--kk-muted": "#7c8593", "--kk-muted-2": "#535b67",
      "--kk-rule": "#2c333c", "--kk-rule-soft": "#1f242a",
      "--kk-blue": "#c97a4a", "--kk-blue-deep": "#9c5a30", "--kk-blue-wash": "rgba(201,122,74,0.10)",
      "--kk-amber": "#d99a52", "--kk-amber-wash": "rgba(217,154,82,0.10)",
      "--kk-green": "#7eae8c", "--kk-green-wash": "rgba(126,174,140,0.10)",
      "--kk-red":   "#cd6852", "--kk-red-wash":   "rgba(205,104,82,0.10)",
      "--kk-glass-tint": "rgba(225,230,238,0.05)", "--kk-glass-tint-2": "rgba(225,230,238,0.012)",
      "--kk-glass-edge": "rgba(225,230,238,0.12)", "--kk-glass-hi": "rgba(255,255,255,0.05)",
      "--kk-glass-lo": "rgba(0,0,0,0.55)", "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.55)",
    },
  },
  {
    id: "bone",
    name: "Bone",
    blurb: "Warm bone surface, oxblood ink, deep indigo accent. Day mode without going clinical.",
    swatches: ["#ece1c8", "#2b1d18", "#2c4ea8"],
    vars: {
      "--kk-base": "#ece1c8", "--kk-surface": "#e3d6b8", "--kk-raised": "#d9c9a6", "--kk-raised-2": "#cebc95",
      "--kk-ink": "#2b1d18", "--kk-ink-dim": "#3d2a22", "--kk-text": "#3e302a",
      "--kk-muted": "#7a6a5e", "--kk-muted-2": "#a89683",
      "--kk-rule": "#b9a884", "--kk-rule-soft": "#c9b994",
      "--kk-blue": "#2c4ea8", "--kk-blue-deep": "#1f3a85", "--kk-blue-wash": "rgba(44,78,168,0.10)",
      "--kk-amber": "#a35f0c", "--kk-amber-wash": "rgba(163,95,12,0.10)",
      "--kk-green": "#2f7a4d", "--kk-green-wash": "rgba(47,122,77,0.10)",
      "--kk-red":   "#a83f30", "--kk-red-wash":   "rgba(168,63,48,0.10)",
      "--kk-glass-tint": "rgba(255,250,235,0.40)", "--kk-glass-tint-2": "rgba(255,250,235,0.18)",
      "--kk-glass-edge": "rgba(43,29,24,0.18)",   "--kk-glass-hi": "rgba(255,255,255,0.55)",
      "--kk-glass-lo": "rgba(43,29,24,0.10)",     "--kk-glass-shadow": "0 24px 60px rgba(70,45,30,0.18)",
    },
  },
  {
    id: "vellum",
    name: "Vellum",
    blurb: "Parchment + sepia. Single oxblood accent, no blue anywhere. Most editorial.",
    swatches: ["#f0e6d0", "#3a2418", "#9c3a26"],
    vars: {
      "--kk-base": "#f0e6d0", "--kk-surface": "#ebdfc4", "--kk-raised": "#e3d4b2", "--kk-raised-2": "#dac99e",
      "--kk-ink": "#3a2418", "--kk-ink-dim": "#5a3a2a", "--kk-text": "#4a3527",
      "--kk-muted": "#856a52", "--kk-muted-2": "#a89072",
      "--kk-rule": "#c9b48a", "--kk-rule-soft": "#d4c19a",
      "--kk-blue": "#9c3a26", "--kk-blue-deep": "#7a2a18", "--kk-blue-wash": "rgba(156,58,38,0.10)",
      "--kk-amber": "#a06010", "--kk-amber-wash": "rgba(160,96,16,0.10)",
      "--kk-green": "#5a7a40", "--kk-green-wash": "rgba(90,122,64,0.10)",
      "--kk-red":   "#a83820", "--kk-red-wash":   "rgba(168,56,32,0.10)",
      "--kk-glass-tint": "rgba(255,252,240,0.50)", "--kk-glass-tint-2": "rgba(255,252,240,0.22)",
      "--kk-glass-edge": "rgba(58,36,24,0.20)",   "--kk-glass-hi": "rgba(255,252,240,0.65)",
      "--kk-glass-lo": "rgba(58,36,24,0.08)",     "--kk-glass-shadow": "0 24px 60px rgba(90,50,20,0.18)",
    },
  },
  {
    id: "atelier",
    name: "Atelier",
    blurb: "Mid-grey paper, ink black, single rust accent. Architect's drawing.",
    swatches: ["#d2cec3", "#1a1814", "#b04a28"],
    vars: {
      "--kk-base": "#d2cec3", "--kk-surface": "#c9c4b6", "--kk-raised": "#beb9a8", "--kk-raised-2": "#b3ad99",
      "--kk-ink": "#1a1814", "--kk-ink-dim": "#322e26", "--kk-text": "#2e2a22",
      "--kk-muted": "#6a6555", "--kk-muted-2": "#8e8775",
      "--kk-rule": "#a59f8b", "--kk-rule-soft": "#b3ad99",
      "--kk-blue": "#b04a28", "--kk-blue-deep": "#883618", "--kk-blue-wash": "rgba(176,74,40,0.10)",
      "--kk-amber": "#9c6010", "--kk-amber-wash": "rgba(156,96,16,0.10)",
      "--kk-green": "#4f6e36", "--kk-green-wash": "rgba(79,110,54,0.10)",
      "--kk-red":   "#a83a20", "--kk-red-wash":   "rgba(168,58,32,0.10)",
      "--kk-glass-tint": "rgba(255,253,245,0.42)", "--kk-glass-tint-2": "rgba(255,253,245,0.18)",
      "--kk-glass-edge": "rgba(26,24,20,0.20)",   "--kk-glass-hi": "rgba(255,253,245,0.55)",
      "--kk-glass-lo": "rgba(26,24,20,0.10)",     "--kk-glass-shadow": "0 24px 60px rgba(60,50,30,0.15)",
    },
  },
];

function ThemeLab() {
  const [themeId, setThemeId] = React.useState("crypt");
  const [proof, setProof] = React.useState(false);
  const [picker, setPicker] = React.useState({ open: true });
  const theme = THEMES.find((t) => t.id === themeId);

  // apply theme vars onto a scoped element by injecting into a style tag.
  // We use a class .kk-theme-live and assign vars there.
  const styleId = "kk-theme-live-vars";
  React.useEffect(() => {
    let el = document.getElementById(styleId);
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }
    const v = theme.vars;
    el.textContent = `.kk-theme-live {\n${Object.entries(v).map(([k,val])=>`  ${k}: ${val};`).join("\n")}\n}`;
  }, [themeId]);

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#0a0b0d", display: "flex", flexDirection: "column" }}>
      <ThemeBar themeId={themeId} setThemeId={setThemeId} proof={proof} setProof={setProof} theme={theme} />
      <div style={{ flex: 1, padding: "16px 24px 32px", overflow: "auto" }}>
        <div className="kk-theme-live" style={{ width: 1480, height: 940, margin: "0 auto", borderRadius: 6, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
          <ConsoleScreen theme="live" proof={proof} />
        </div>
        <div style={{ marginTop: 24, maxWidth: 1480, marginLeft: "auto", marginRight: "auto", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {THEMES.map((t) => (
            <ThemeCard key={t.id} t={t} active={t.id === themeId} onClick={() => setThemeId(t.id)} />
          ))}
        </div>
        <ApprovalBar themeId={themeId} themeName={theme.name} />
      </div>
    </div>
  );
}

function ThemeBar({ themeId, setThemeId, proof, setProof, theme }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 20px",
      background: "linear-gradient(180deg, #14171b, #0a0b0d)",
      borderBottom: "1px solid #1f242b",
      color: "#c9c3b6",
      fontFamily: '"Source Sans 3", system-ui, sans-serif',
    }}>
      <div style={{ fontFamily: '"Cabinet Grotesk", "Helvetica Neue", sans-serif', fontWeight: 700, color: "#f4ead9", fontSize: 15 }}>
        Theme Lab
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#7a7367", letterSpacing: "0.12em" }}>
        live theming · type locked
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 4, padding: 3, background: "#0f1216", border: "1px solid #1f242b", borderRadius: 8 }}>
        {THEMES.map((t) => (
          <button key={t.id}
            onClick={() => setThemeId(t.id)}
            style={{
              padding: "6px 12px",
              fontFamily: '"Cabinet Grotesk", "Helvetica Neue", sans-serif',
              fontWeight: 500, fontSize: 12, letterSpacing: "0.01em",
              borderRadius: 5,
              border: "1px solid " + (t.id === themeId ? "rgba(116,167,255,0.5)" : "transparent"),
              background: t.id === themeId ? "rgba(116,167,255,0.10)" : "transparent",
              color: t.id === themeId ? "#f4ead9" : "#aaa094",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            <span style={{ display: "inline-flex", gap: 2 }}>
              {t.swatches.map((s, i) => (
                <span key={i} style={{ width: 9, height: 9, borderRadius: 2, background: s, border: "0.5px solid rgba(0,0,0,0.2)" }} />
              ))}
            </span>
            {t.name}
          </button>
        ))}
      </div>

      <button onClick={() => setProof((p) => !p)}
        style={{
          padding: "6px 10px", fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10, letterSpacing: "0.08em",
          background: proof ? "rgba(116,167,255,0.12)" : "transparent",
          color: proof ? "#74a7ff" : "#7a7367",
          border: "1px solid " + (proof ? "rgba(116,167,255,0.4)" : "#1f242b"),
          borderRadius: 5, cursor: "pointer",
        }}>
        proof {proof ? "on" : "off"}
      </button>

      <a href="index.html" style={{
        padding: "6px 12px", fontFamily: '"Cabinet Grotesk", sans-serif',
        fontSize: 12, color: "#aaa094", textDecoration: "none",
        border: "1px solid #1f242b", borderRadius: 5,
      }}>← all artboards</a>
    </div>
  );
}

function ThemeCard({ t, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: 12,
      border: "1px solid " + (active ? "rgba(116,167,255,0.6)" : "#1f242b"),
      background: active ? "rgba(116,167,255,0.06)" : "#0f1216",
      borderRadius: 8, cursor: "pointer",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 600, color: "#f4ead9", fontSize: 13 }}>{t.name}</span>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: active ? "#74a7ff" : "#7a7367", letterSpacing: "0.06em" }}>
          {active ? "active" : t.id}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, height: 36 }}>
        {t.swatches.map((s, i) => (
          <div key={i} style={{ flex: 1, background: s, borderRadius: 3, border: "1px solid rgba(0,0,0,0.15)" }} />
        ))}
      </div>
      {/* preview of two lines and a chip in the theme palette */}
      <div style={{
        background: t.vars["--kk-base"], padding: "10px 12px",
        borderRadius: 5, border: "1px solid " + t.vars["--kk-rule"],
        minHeight: 70, display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", color: t.vars["--kk-ink"], fontSize: 14, lineHeight: 1.3 }}>
          I called it almost love
        </div>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", color: t.vars["--kk-muted"], fontSize: 12, lineHeight: 1.3 }}>
          You called it timing
        </div>
        <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
          <span style={{
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.1em",
            padding: "2px 6px", borderRadius: 99,
            background: t.vars["--kk-blue-wash"], color: t.vars["--kk-blue"],
            border: "1px solid " + t.vars["--kk-blue"],
          }}>keep</span>
          <span style={{
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: "0.1em",
            padding: "2px 6px", borderRadius: 99,
            background: t.vars["--kk-green-wash"], color: t.vars["--kk-green"],
            border: "1px solid " + t.vars["--kk-green"],
          }}>fit · 92</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#aaa094", lineHeight: 1.4 }}>{t.blurb}</div>
    </div>
  );
}

function ApprovalBar({ themeId, themeName }) {
  return (
    <div style={{
      marginTop: 24, maxWidth: 1480, marginLeft: "auto", marginRight: "auto",
      padding: "16px 20px", background: "#0f1216",
      border: "1px solid #1f242b", borderRadius: 8,
      display: "flex", alignItems: "center", gap: 14, color: "#c9c3b6",
      fontFamily: '"Source Sans 3", sans-serif',
    }}>
      <div style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 600, color: "#f4ead9", fontSize: 13 }}>
        Currently previewing · <span style={{ color: "#74a7ff" }}>{themeName}</span>
      </div>
      <div style={{ flex: 1, fontSize: 12, color: "#aaa094" }}>
        When you've locked one, tell me <code style={{ color: "#74a7ff", background: "transparent" }}>"approve {themeId}"</code>{" "}
        and I'll roll it to every artboard in <code>index.html</code> (including Aesthetic B if you pick it).
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#7a7367", letterSpacing: "0.06em" }}>
        type locked · IA locked · only color/material varies
      </div>
    </div>
  );
}

// Patch the ConsoleScreen wrapper so theme="live" doesn't override the
// scoped class on the parent. The parent .kk-theme-live carries the vars.
window.ThemeLab = ThemeLab;

const tlRoot = ReactDOM.createRoot(document.getElementById("mount"));
tlRoot.render(<ThemeLab />);
