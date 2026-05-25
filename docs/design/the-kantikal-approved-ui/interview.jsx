// interview.jsx — visual aesthetic interview.
// Step-by-step: each step shows 3-5 small previews where ONE visual
// property differs. Pick one, advance. The accumulated aesthetic is
// reflected in the live preview at the top of every step and at the
// finale, ready to roll out to every artboard.

// ---------- ATTRIBUTE OPTIONS ----------
// Each attribute step gives 3-5 options. Each option is a partial of
// CSS variables that gets applied to the preview root. Picking one
// merges its vars into the running aesthetic.

const STEPS = [
  {
    id: "palette", title: "1 · Palette mood",
    blurb: "What room is this song made in?",
    options: [
      {
        id: "crypt", name: "Crypt", sub: "dark, cream lyric ink",
        swatches: ["#0f1114", "#f4ead9", "#74a7ff"],
        vars: {
          "--kk-base": "#0f1114", "--kk-surface": "#17191d", "--kk-raised": "#202329", "--kk-raised-2": "#272a31",
          "--kk-ink": "#f4ead9", "--kk-ink-dim": "#d8cdb9", "--kk-text": "#c9c3b6",
          "--kk-muted": "#aaa094", "--kk-muted-2": "#7a7367",
          "--kk-rule": "#34302a", "--kk-rule-soft": "#25221d",
          "--kk-glass-tint": "rgba(255,255,255,0.06)", "--kk-glass-tint-2": "rgba(255,255,255,0.015)",
          "--kk-glass-edge": "rgba(244,234,217,0.10)", "--kk-glass-hi": "rgba(255,255,255,0.06)",
          "--kk-glass-lo": "rgba(0,0,0,0.5)", "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.55)",
        },
      },
      {
        id: "nocturne", name: "Nocturne", sub: "near-black, cool ink",
        swatches: ["#070809", "#dbe1ec", "#d4a256"],
        vars: {
          "--kk-base": "#070809", "--kk-surface": "#0f1115", "--kk-raised": "#181b21", "--kk-raised-2": "#1e2229",
          "--kk-ink": "#dbe1ec", "--kk-ink-dim": "#b6becc", "--kk-text": "#a7b0bf",
          "--kk-muted": "#7e8694", "--kk-muted-2": "#586172",
          "--kk-rule": "#22272f", "--kk-rule-soft": "#161a20",
          "--kk-glass-tint": "rgba(220,228,240,0.06)", "--kk-glass-tint-2": "rgba(220,228,240,0.015)",
          "--kk-glass-edge": "rgba(220,228,240,0.10)", "--kk-glass-hi": "rgba(255,255,255,0.04)",
          "--kk-glass-lo": "rgba(0,0,0,0.6)", "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.7)",
        },
      },
      {
        id: "plate", name: "Plate", sub: "cool dark slate",
        swatches: ["#13161a", "#e1e6ee", "#c97a4a"],
        vars: {
          "--kk-base": "#13161a", "--kk-surface": "#1a1e23", "--kk-raised": "#22272d", "--kk-raised-2": "#2a3038",
          "--kk-ink": "#e1e6ee", "--kk-ink-dim": "#c1c8d2", "--kk-text": "#a8b0bc",
          "--kk-muted": "#7c8593", "--kk-muted-2": "#535b67",
          "--kk-rule": "#2c333c", "--kk-rule-soft": "#1f242a",
          "--kk-glass-tint": "rgba(225,230,238,0.05)", "--kk-glass-tint-2": "rgba(225,230,238,0.012)",
          "--kk-glass-edge": "rgba(225,230,238,0.12)", "--kk-glass-hi": "rgba(255,255,255,0.05)",
          "--kk-glass-lo": "rgba(0,0,0,0.55)", "--kk-glass-shadow": "0 24px 60px rgba(0,0,0,0.55)",
        },
      },
      {
        id: "bone", name: "Bone", sub: "warm light, oxblood ink",
        swatches: ["#ece1c8", "#2b1d18", "#2c4ea8"],
        vars: {
          "--kk-base": "#ece1c8", "--kk-surface": "#e3d6b8", "--kk-raised": "#d9c9a6", "--kk-raised-2": "#cebc95",
          "--kk-ink": "#2b1d18", "--kk-ink-dim": "#3d2a22", "--kk-text": "#3e302a",
          "--kk-muted": "#7a6a5e", "--kk-muted-2": "#a89683",
          "--kk-rule": "#b9a884", "--kk-rule-soft": "#c9b994",
          "--kk-glass-tint": "rgba(255,250,235,0.40)", "--kk-glass-tint-2": "rgba(255,250,235,0.18)",
          "--kk-glass-edge": "rgba(43,29,24,0.18)",   "--kk-glass-hi": "rgba(255,255,255,0.55)",
          "--kk-glass-lo": "rgba(43,29,24,0.10)",     "--kk-glass-shadow": "0 24px 60px rgba(70,45,30,0.18)",
        },
      },
      {
        id: "vellum", name: "Vellum", sub: "parchment + sepia",
        swatches: ["#f0e6d0", "#3a2418", "#9c3a26"],
        vars: {
          "--kk-base": "#f0e6d0", "--kk-surface": "#ebdfc4", "--kk-raised": "#e3d4b2", "--kk-raised-2": "#dac99e",
          "--kk-ink": "#3a2418", "--kk-ink-dim": "#5a3a2a", "--kk-text": "#4a3527",
          "--kk-muted": "#856a52", "--kk-muted-2": "#a89072",
          "--kk-rule": "#c9b48a", "--kk-rule-soft": "#d4c19a",
          "--kk-glass-tint": "rgba(255,252,240,0.50)", "--kk-glass-tint-2": "rgba(255,252,240,0.22)",
          "--kk-glass-edge": "rgba(58,36,24,0.20)",   "--kk-glass-hi": "rgba(255,252,240,0.65)",
          "--kk-glass-lo": "rgba(58,36,24,0.08)",     "--kk-glass-shadow": "0 24px 60px rgba(90,50,20,0.18)",
        },
      },
      {
        id: "atelier", name: "Atelier", sub: "mid-grey paper, ink black",
        swatches: ["#d2cec3", "#1a1814", "#b04a28"],
        vars: {
          "--kk-base": "#d2cec3", "--kk-surface": "#c9c4b6", "--kk-raised": "#beb9a8", "--kk-raised-2": "#b3ad99",
          "--kk-ink": "#1a1814", "--kk-ink-dim": "#322e26", "--kk-text": "#2e2a22",
          "--kk-muted": "#6a6555", "--kk-muted-2": "#8e8775",
          "--kk-rule": "#a59f8b", "--kk-rule-soft": "#b3ad99",
          "--kk-glass-tint": "rgba(255,253,245,0.42)", "--kk-glass-tint-2": "rgba(255,253,245,0.18)",
          "--kk-glass-edge": "rgba(26,24,20,0.20)",   "--kk-glass-hi": "rgba(255,253,245,0.55)",
          "--kk-glass-lo": "rgba(26,24,20,0.10)",     "--kk-glass-shadow": "0 24px 60px rgba(60,50,30,0.15)",
        },
      },
    ],
  },

  {
    id: "accent", title: "2 · Accent color",
    blurb: "What does 'this is active / lineage / selected' look like?",
    options: [
      { id: "blue",    name: "Cool blue",     sub: "the spec accent",
        vars: { "--kk-blue": "#74a7ff", "--kk-blue-deep": "#3a6fd6", "--kk-blue-wash": "rgba(116,167,255,0.10)",
                "--kk-amber": "#e0a84a", "--kk-amber-wash": "rgba(224,168,74,0.10)",
                "--kk-green": "#70d38e", "--kk-green-wash": "rgba(112,211,142,0.10)",
                "--kk-red":   "#e06f5b", "--kk-red-wash":   "rgba(224,111,91,0.10)" } },
      { id: "indigo",  name: "Deep indigo",   sub: "saturated, restrained",
        vars: { "--kk-blue": "#3a4ea8", "--kk-blue-deep": "#27387a", "--kk-blue-wash": "rgba(58,78,168,0.12)" } },
      { id: "oxblood", name: "Oxblood",       sub: "no blue at all",
        vars: { "--kk-blue": "#9c3a26", "--kk-blue-deep": "#7a2a18", "--kk-blue-wash": "rgba(156,58,38,0.10)",
                "--kk-amber": "#a35f0c", "--kk-green": "#5a7a40", "--kk-red": "#a83820" } },
      { id: "gold",    name: "Gold leaf",     sub: "warm, monastic",
        vars: { "--kk-blue": "#d4a256", "--kk-blue-deep": "#9c7430", "--kk-blue-wash": "rgba(212,162,86,0.10)",
                "--kk-amber": "#c4863a", "--kk-green": "#7ea273", "--kk-red": "#b95a48" } },
      { id: "rust",    name: "Rust",          sub: "architect's red",
        vars: { "--kk-blue": "#b04a28", "--kk-blue-deep": "#883618", "--kk-blue-wash": "rgba(176,74,40,0.10)",
                "--kk-amber": "#a36210", "--kk-green": "#5d7e42", "--kk-red": "#a83820" } },
    ],
  },

  {
    id: "borders", title: "3 · Border language",
    blurb: "How loud are the dividers and outlines?",
    options: [
      { id: "invisible", name: "Invisible",  sub: "surfaces only · no lines",
        vars: { "--kk-border-w": "0px", "--kk-border-style": "solid", "--kk-rule-opacity": "0.0" } },
      { id: "hairline",  name: "Hairline",    sub: "0.5px · just barely",
        vars: { "--kk-border-w": "0.5px", "--kk-border-style": "solid", "--kk-rule-opacity": "0.7" } },
      { id: "standard",  name: "Standard",    sub: "1px · the default",
        vars: { "--kk-border-w": "1px", "--kk-border-style": "solid", "--kk-rule-opacity": "1" } },
      { id: "heavy",     name: "Heavy",       sub: "1.5px · contoured",
        vars: { "--kk-border-w": "1.5px", "--kk-border-style": "solid", "--kk-rule-opacity": "1" } },
      { id: "dashed",    name: "Dashed",      sub: "1px dash · drafting",
        vars: { "--kk-border-w": "1px", "--kk-border-style": "dashed", "--kk-rule-opacity": "1" } },
    ],
  },

  {
    id: "radii", title: "4 · Corner radii",
    blurb: "How sharp or soft are the boxes?",
    options: [
      { id: "sharp",  name: "Sharp",  sub: "0px · letterpress",
        vars: { "--kk-r-1": "0px", "--kk-r-2": "0px", "--kk-r-3": "0px", "--kk-r-4": "0px" } },
      { id: "tight",  name: "Tight",  sub: "2/3/4 · barely",
        vars: { "--kk-r-1": "2px", "--kk-r-2": "3px", "--kk-r-3": "4px", "--kk-r-4": "6px" } },
      { id: "soft",   name: "Soft",   sub: "3/6/10/14 · current",
        vars: { "--kk-r-1": "3px", "--kk-r-2": "6px", "--kk-r-3": "10px", "--kk-r-4": "14px" } },
      { id: "round",  name: "Round",  sub: "4/10/16/20 · pillowy",
        vars: { "--kk-r-1": "4px", "--kk-r-2": "10px", "--kk-r-3": "16px", "--kk-r-4": "20px" } },
    ],
  },

  {
    id: "surface", title: "5 · Surface depth",
    blurb: "Do the panels read flat, tiered, or refractive?",
    options: [
      { id: "flat",   name: "Flat",       sub: "one plane · readable",
        vars: { "--kk-surface-mode": "flat", "--kk-elev-shadow": "none" } },
      { id: "tiered", name: "Tiered",     sub: "raised + raised-2 · paper stack",
        vars: { "--kk-surface-mode": "tiered", "--kk-elev-shadow": "0 1px 0 var(--kk-rule-soft), 0 2px 8px rgba(0,0,0,0.18)" } },
      { id: "soft",   name: "Soft shadow", sub: "subtle drop · ambient",
        vars: { "--kk-surface-mode": "tiered", "--kk-elev-shadow": "0 8px 24px rgba(0,0,0,0.22)" } },
      { id: "liquid", name: "Liquid glass", sub: "refractive · uses Liquid DOM",
        vars: { "--kk-surface-mode": "liquid", "--kk-elev-shadow": "0 24px 60px rgba(0,0,0,0.45)" } },
    ],
  },

  {
    id: "lyric", title: "6 · Lyric weight",
    blurb: "How heavy does the master object read?",
    options: [
      { id: "regular", name: "Regular",  sub: "Fraunces 400 · light",
        vars: { "--kk-lyric-weight": "400", "--kk-s-lyric": "19px" } },
      { id: "book",    name: "Book",     sub: "Fraunces 450 · current",
        vars: { "--kk-lyric-weight": "450", "--kk-s-lyric": "19px" } },
      { id: "display", name: "Display",  sub: "Fraunces 650 · spec",
        vars: { "--kk-lyric-weight": "650", "--kk-s-lyric": "20px" } },
      { id: "bold",    name: "Bold",     sub: "Fraunces 700 · loud",
        vars: { "--kk-lyric-weight": "700", "--kk-s-lyric": "20px" } },
    ],
  },

  {
    id: "section", title: "7 · Section markers",
    blurb: "How do INTRO / VERSE / CHORUS announce themselves?",
    options: [
      { id: "boxed",   name: "Boxed caps",   sub: "current · plex mono, ruled box" },
      { id: "uppercase", name: "Spaced caps",  sub: "no box, wide letterspacing" },
      { id: "serif",   name: "Serif title",  sub: "Fraunces 500, italic" },
      { id: "numbered", name: "Numbered",    sub: "01 / 02 / 03 · numeric only" },
    ],
    // each option swaps the section-marker render mode via a data attribute
    apply: { dataAttr: "kk-section-style", values: ["boxed", "uppercase", "serif", "numbered"] },
  },
];

// ---------- WIZARD ----------

function Interview() {
  const [step, setStep] = React.useState(0);
  const [choices, setChoices] = React.useState({}); // {stepId: optionId}
  const totalSteps = STEPS.length;
  const done = step >= totalSteps;

  // accumulate vars from all picked options
  const aestheticVars = React.useMemo(() => {
    const out = {};
    let sectionStyle = "boxed";
    STEPS.forEach((s) => {
      const picked = s.options.find((o) => o.id === choices[s.id]);
      if (picked?.vars) Object.assign(out, picked.vars);
      if (s.id === "section" && picked) sectionStyle = picked.id;
    });
    return { vars: out, sectionStyle };
  }, [choices]);

  // apply to live preview via a style tag
  React.useEffect(() => {
    let el = document.getElementById("kk-interview-vars");
    if (!el) { el = document.createElement("style"); el.id = "kk-interview-vars"; document.head.appendChild(el); }
    el.textContent = `.kk-interview-live {\n${Object.entries(aestheticVars.vars).map(([k,v])=>`  ${k}: ${v};`).join("\n")}\n}`;
  }, [aestheticVars]);

  const pick = (stepId, optionId) => {
    setChoices((c) => ({ ...c, [stepId]: optionId }));
    setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps)), 380);
  };

  const goto = (i) => setStep(Math.max(0, Math.min(i, totalSteps)));

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#0a0b0d", display: "flex", flexDirection: "column" }}>
      <InterviewBar step={step} totalSteps={totalSteps} choices={choices} goto={goto} done={done} />
      <div className="kk-interview-live" style={{ display: "contents" }}>
        {done
          ? <FinaleStage choices={choices} sectionStyle={aestheticVars.sectionStyle} onReset={() => { setChoices({}); setStep(0); }} />
          : <StepStage step={STEPS[step]} pick={pick} chosen={choices[STEPS[step].id]} sectionStyle={aestheticVars.sectionStyle} runningChoices={choices} />
        }
      </div>
    </div>
  );
}

function InterviewBar({ step, totalSteps, choices, goto, done }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      display: "flex", alignItems: "center", gap: 14,
      padding: "10px 20px",
      background: "linear-gradient(180deg, #14171b, #0a0b0d)",
      borderBottom: "1px solid #1f242b",
      color: "#c9c3b6",
      fontFamily: '"Source Sans 3", system-ui, sans-serif',
    }}>
      <div style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 700, color: "#f4ead9", fontSize: 15 }}>
        Aesthetic Interview
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#7a7367", letterSpacing: "0.12em" }}>
        {done ? "all picked · review below" : `step ${step + 1} of ${totalSteps}`}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 4 }}>
        {STEPS.map((s, i) => {
          const picked = !!choices[s.id];
          const here = step === i && !done;
          return (
            <button key={s.id} onClick={() => goto(i)}
              title={s.title}
              style={{
                width: 28, height: 8, borderRadius: 4,
                border: "1px solid " + (here ? "#74a7ff" : "#1f242b"),
                background: picked ? "#74a7ff" : here ? "rgba(116,167,255,0.2)" : "#0f1216",
                cursor: "pointer", padding: 0,
              }}/>
          );
        })}
        <button onClick={() => goto(totalSteps)}
          style={{
            width: 28, height: 8, borderRadius: 4,
            border: "1px solid " + (done ? "#70d38e" : "#1f242b"),
            background: done ? "#70d38e" : "#0f1216", cursor: "pointer", padding: 0,
          }}/>
      </div>

      <a href="theme-lab.html" style={{
        padding: "5px 10px", fontFamily: '"Cabinet Grotesk", sans-serif',
        fontSize: 11, color: "#aaa094", textDecoration: "none",
        border: "1px solid #1f242b", borderRadius: 5,
      }}>palette only →</a>
      <a href="index.html" style={{
        padding: "5px 10px", fontFamily: '"Cabinet Grotesk", sans-serif',
        fontSize: 11, color: "#aaa094", textDecoration: "none",
        border: "1px solid #1f242b", borderRadius: 5,
      }}>← canvas</a>
    </div>
  );
}

function StepStage({ step, pick, chosen, sectionStyle, runningChoices }) {
  return (
    <div style={{ padding: "28px 24px 60px", maxWidth: 1480, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase", color: "#7a7367",
        }}>{step.title.split("·")[0].trim()}</div>
        <h2 style={{
          fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 700,
          color: "#f4ead9", fontSize: 26, margin: "8px 0 4px",
        }}>{step.title.split("·")[1]?.trim() || step.title}</h2>
        <div style={{ color: "#aaa094", fontSize: 14, fontStyle: "italic" }}>{step.blurb}</div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(step.options.length, 5)}, 1fr)`,
        gap: 14, alignItems: "stretch",
      }}>
        {step.options.map((o) => (
          <OptionCard key={o.id} step={step} option={o}
            chosen={chosen === o.id}
            onPick={() => pick(step.id, o.id)}
            sectionStyle={step.id === "section" ? o.id : sectionStyle}
            runningChoices={runningChoices} />
        ))}
      </div>
    </div>
  );
}

function OptionCard({ step, option, chosen, onPick, sectionStyle, runningChoices }) {
  // For step-specific previews, we build a small scene that shows the
  // attribute change clearly: section marker + 2 lyric lines + a take card
  // + chips. The CSS variables for this option are scoped to this card.
  const scopedVars = { ...option.vars };
  // merge already-picked steps so the preview is correct
  STEPS.forEach((s) => {
    if (s.id === step.id) return;
    const p = s.options.find((o) => o.id === runningChoices[s.id]);
    if (p?.vars) Object.assign(scopedVars, p.vars);
  });

  return (
    <div onClick={onPick} style={{
      ...scopedVars,
      cursor: "pointer",
      padding: 14,
      border: "1.5px solid " + (chosen ? "#74a7ff" : "#1f242b"),
      background: chosen ? "rgba(116,167,255,0.06)" : "#0f1216",
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 10,
      minHeight: 320,
      transition: "border-color 120ms, transform 120ms",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 600, color: "#f4ead9", fontSize: 14 }}>{option.name}</span>
        {option.swatches && (
          <span style={{ display: "inline-flex", gap: 3 }}>
            {option.swatches.map((s, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 2, background: s, border: "0.5px solid rgba(0,0,0,0.2)" }} />)}
          </span>
        )}
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#7a7367", letterSpacing: "0.06em" }}>
        {option.sub}
      </div>

      {/* The actual visual preview */}
      <MiniPreview sectionStyle={sectionStyle} />
    </div>
  );
}

// MiniPreview — shows a section marker + two lyric lines + a take card +
// two chips, all using the current scoped CSS variables. Renders the same
// shape so the user only sees the ONE attribute that's different.
function MiniPreview({ sectionStyle = "boxed" }) {
  return (
    <div style={{
      flex: 1,
      background: "var(--kk-base)",
      color: "var(--kk-text)",
      padding: 12,
      borderRadius: "var(--kk-r-3)",
      border: "var(--kk-border-w, 1px) var(--kk-border-style, solid) var(--kk-rule)",
      boxShadow: "var(--kk-elev-shadow, none)",
      display: "flex", flexDirection: "column", gap: 8,
      fontFamily: '"Source Sans 3", sans-serif',
    }}>
      {/* section marker variants */}
      <SectionMarker mode={sectionStyle} />

      <div style={{
        fontFamily: '"Fraunces", Georgia, serif',
        fontSize: "var(--kk-s-lyric, 17px)",
        fontWeight: "var(--kk-lyric-weight, 450)",
        color: "var(--kk-ink)", lineHeight: 1.3,
      }}>
        <div style={{
          background: "color-mix(in oklab, var(--kk-blue) 12%, transparent)",
          borderLeft: "2px solid var(--kk-blue)",
          paddingLeft: 6, marginLeft: -6,
        }}>
          I called it almost love
        </div>
        <div style={{ color: "var(--kk-muted)" }}>You called it timing</div>
      </div>

      {/* take card */}
      <div style={{
        background: "var(--kk-raised)",
        border: "var(--kk-border-w, 1px) var(--kk-border-style, solid) var(--kk-rule)",
        borderRadius: "var(--kk-r-2)",
        padding: "7px 9px",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 600, color: "var(--kk-ink)", fontSize: 11 }}>T-03 · restraint</span>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "var(--kk-muted-2)" }}>seed 03</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 20px", gap: 6, fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "var(--kk-muted)", alignItems: "center" }}>
          <span>lyric</span>
          <span style={{ height: 3, background: "var(--kk-rule)", borderRadius: 2, overflow: "hidden" }}>
            <span style={{ display: "block", width: "92%", height: "100%", background: "var(--kk-green)" }} />
          </span>
          <span style={{ color: "var(--kk-ink-dim)" }}>92</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 20px", gap: 6, fontFamily: '"IBM Plex Mono", monospace', fontSize: 9, color: "var(--kk-muted)", alignItems: "center" }}>
          <span>hook</span>
          <span style={{ height: 3, background: "var(--kk-rule)", borderRadius: 2, overflow: "hidden" }}>
            <span style={{ display: "block", width: "74%", height: "100%", background: "var(--kk-amber)" }} />
          </span>
          <span style={{ color: "var(--kk-ink-dim)" }}>74</span>
        </div>
      </div>

      {/* chips */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: '"Source Sans 3", sans-serif', fontSize: 10, fontWeight: 500,
          padding: "3px 8px", borderRadius: 999,
          background: "color-mix(in oklab, var(--kk-blue) 12%, transparent)",
          color: "var(--kk-blue)",
          border: "var(--kk-border-w, 1px) var(--kk-border-style, solid) color-mix(in oklab, var(--kk-blue) 35%, transparent)",
        }}>keep vocal</span>
        <span style={{
          fontFamily: '"Source Sans 3", sans-serif', fontSize: 10, fontWeight: 500,
          padding: "3px 8px", borderRadius: 999,
          background: "color-mix(in oklab, var(--kk-green) 12%, transparent)",
          color: "var(--kk-green)",
          border: "var(--kk-border-w, 1px) var(--kk-border-style, solid) color-mix(in oklab, var(--kk-green) 35%, transparent)",
        }}>like</span>
        <span style={{
          fontFamily: '"Source Sans 3", sans-serif', fontSize: 10, fontWeight: 500,
          padding: "3px 8px", borderRadius: 999,
          background: "color-mix(in oklab, var(--kk-red) 12%, transparent)",
          color: "var(--kk-red)",
          border: "var(--kk-border-w, 1px) var(--kk-border-style, solid) color-mix(in oklab, var(--kk-red) 35%, transparent)",
        }}>avoid</span>
      </div>
    </div>
  );
}

function SectionMarker({ mode }) {
  if (mode === "uppercase") {
    return (
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5,
        letterSpacing: "0.34em", textTransform: "uppercase",
        color: "var(--kk-muted)",
      }}>chorus</div>
    );
  }
  if (mode === "serif") {
    return (
      <div style={{
        fontFamily: '"Fraunces", serif', fontStyle: "italic", fontWeight: 500,
        fontSize: 13, color: "var(--kk-ink-dim)",
      }}>chorus</div>
    );
  }
  if (mode === "numbered") {
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: "var(--kk-blue)", letterSpacing: "0.06em" }}>04</span>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, color: "var(--kk-muted-2)", letterSpacing: "0.2em", textTransform: "uppercase" }}>section</span>
      </div>
    );
  }
  // boxed (default)
  return (
    <div style={{
      display: "inline-block", padding: "2px 7px",
      fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5,
      letterSpacing: "0.22em", textTransform: "uppercase",
      color: "var(--kk-muted)",
      border: "var(--kk-border-w, 1px) var(--kk-border-style, solid) var(--kk-rule)",
      borderRadius: 3,
      alignSelf: "flex-start",
    }}>chorus</div>
  );
}

// ---------- FINALE ----------

function FinaleStage({ choices, sectionStyle, onReset }) {
  const summary = STEPS.map((s) => {
    const o = s.options.find((opt) => opt.id === choices[s.id]);
    return { step: s.title, choice: o?.name || "—", id: o?.id };
  });

  // Generate the artifact (CSS) the user can hand to me to lock.
  const finalCSS = generateFinalCSS(choices);

  return (
    <div style={{ padding: "28px 24px 60px", maxWidth: 1480, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase", color: "#70d38e",
        }}>aesthetic locked · ready to roll</div>
        <h2 style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 700, color: "#f4ead9", fontSize: 26, margin: "8px 0 4px" }}>
          This is your room.
        </h2>
        <div style={{ color: "#aaa094", fontSize: 14, fontStyle: "italic" }}>Tell me <code style={{ color: "#74a7ff", background: "transparent" }}>"approve interview"</code> and I'll roll it across every artboard.</div>
      </div>

      {/* full-size lyric console preview using the assembled aesthetic */}
      <div style={{ borderRadius: 6, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", marginBottom: 24 }}>
        <ConsoleScreen theme="live" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{
          padding: 16, background: "#0f1216", border: "1px solid #1f242b",
          borderRadius: 8, color: "#c9c3b6",
        }}>
          <div style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 600, color: "#f4ead9", fontSize: 14, marginBottom: 10 }}>
            What you picked
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 13 }}>
            {summary.map((s, i) => (
              <React.Fragment key={i}>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10, color: "#7a7367", letterSpacing: "0.08em" }}>{s.step.split("·")[0].trim()}</span>
                <span style={{ color: "#f4ead9" }}>{s.choice} <span style={{ color: "#7a7367", fontFamily: '"IBM Plex Mono", monospace', fontSize: 10 }}>· {s.id}</span></span>
              </React.Fragment>
            ))}
          </div>
          <button onClick={onReset} style={{
            marginTop: 14, padding: "6px 12px", background: "transparent",
            color: "#aaa094", border: "1px solid #1f242b", borderRadius: 5,
            fontFamily: '"Cabinet Grotesk", sans-serif', fontSize: 12, cursor: "pointer",
          }}>start over</button>
        </div>

        <div style={{
          padding: 16, background: "#0f1216", border: "1px solid #1f242b",
          borderRadius: 8, color: "#c9c3b6",
        }}>
          <div style={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 600, color: "#f4ead9", fontSize: 14, marginBottom: 10 }}>
            Token diff · what changes vs spec
          </div>
          <pre style={{
            background: "transparent", margin: 0, fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10, color: "#c9c3b6", lineHeight: 1.5, maxHeight: 240, overflow: "auto",
          }}>{finalCSS}</pre>
        </div>
      </div>
    </div>
  );
}

function generateFinalCSS(choices) {
  const lines = [":root, [data-theme=\"approved\"] {"];
  STEPS.forEach((s) => {
    const o = s.options.find((opt) => opt.id === choices[s.id]);
    if (!o?.vars) return;
    lines.push(`  /* ${s.title} → ${o.name} */`);
    Object.entries(o.vars).forEach(([k, v]) => lines.push(`  ${k}: ${v};`));
  });
  lines.push("}");
  return lines.join("\n");
}

window.Interview = Interview;
const ivRoot = ReactDOM.createRoot(document.getElementById("mount"));
ivRoot.render(<Interview />);
