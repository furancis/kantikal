// lib/chrome.jsx — shared app chrome: TopBar, LeftRail, RightInspector, Workbench.
// Each accepts a `screen` prop so nav highlight + minor copy can vary per artboard.

function Brand() {
  return (
    <div className="kk-brand">
      <div className="kk-brand-mark">
        {/* a small cross-hatch glyph evoking a signet stamp — not an ai-purple sparkle */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M9 2v14M2 9h14M4.5 4.5l9 9M13.5 4.5l-9 9" opacity="0.55" />
          <circle cx="9" cy="9" r="2.6" />
        </svg>
      </div>
      <div className="kk-brand-text">
        <div className="kk-brand-name">The Kantikal</div>
        <div className="kk-brand-sub">sealf'salve · songbook</div>
      </div>
    </div>
  );
}

const NAV = [
  { id: "console", label: "Console",  full: "Lyric Console" },
  { id: "compare", label: "Compare",  full: "Taste Compare" },
  { id: "picker",  label: "Picker",   full: "Remix Picker" },
  { id: "dna",     label: "DNA",      full: "Sound DNA" },
  { id: "desk",    label: "Desk",     full: "Generation Desk" },
  { id: "tree",    label: "Tree",     full: "Track Genealogy" },
  { id: "lab",     label: "Lab",      full: "Song Lab" },
  { id: "release", label: "Release",  full: "Release Pack" },
];

function TopBar({ screen = "console", credits = "428", branch = "B / chorus-trim", provider = { state: "ok", label: "suno" }, proof = false }) {
  return (
    <div className="kk-topbar">
      <Brand />
      <nav className="kk-nav">
        {NAV.map((n) => {
          const active = n.id === screen;
          return (
            <div key={n.id}
                 className={"kk-nav-item" + (active ? " is-active" : "")}
                 title={n.full}>
              {active ? <span className="dot" /> : null}
              {n.label}
            </div>
          );
        })}
      </nav>
      <div className="kk-top-right">
        <div className="kk-top-meta kk-branch" title="current branch">
          <span className="branch-tag">{branch}</span>
        </div>
        <div className={"kk-provider-pill" + (provider.state === "warn" ? " is-warn" : provider.state === "down" ? " is-down" : "")}
             title={"provider · " + (provider.label || "")}>
          <span className="pdot" />
        </div>
        <button className="kk-iconbtn-bare" title="proof mode — reveal provenance labels"
                style={{ color: proof ? "var(--kk-blue)" : "var(--kk-muted-2)" }}>
          {Icon.lock()}
        </button>
        <div className="kk-top-meta kk-credits" title="credits">
          <b>{credits}</b><span className="cr">cr</span>
        </div>
      </div>
    </div>
  );
}

// ===================== LEFT RAIL =====================

function LeftRail({ activeRefId = "ref-2", showVoices = true }) {
  return (
    <aside className="kk-rail">
      <div className="kk-rail-section">
        <div className="kk-project-card">
          <div className="pname">Almost Love</div>
          <div className="pmeta">
            <span><b>v3.4</b> draft</span>
            <span>92 bpm</span>
            <span>A min</span>
          </div>
        </div>
      </div>

      <div className="kk-rail-section">
        <div className="kk-rail-h">references <span className="count">04</span></div>
        <div className="kk-rail-list">
          <div className="kk-rail-row"><span className="swatch k-ref" /><span className="label">field — bedroom guitar</span><span className="tag">04:12</span></div>
          <div className={"kk-rail-row" + (activeRefId === "ref-2" ? " is-active" : "")}><span className="swatch k-ref" /><span className="label">ammar — restraint draft</span><span className="tag">02:08</span></div>
          <div className="kk-rail-row"><span className="swatch k-ref" /><span className="label">muqaam · oud loop</span><span className="tag">00:48</span></div>
          <div className="kk-rail-row"><span className="swatch k-ref" /><span className="label">stipulated low end</span><span className="tag">00:22</span></div>
        </div>
      </div>

      {showVoices && (
        <div className="kk-rail-section">
          <div className="kk-rail-h">voices <span className="count">03</span></div>
          <div className="kk-rail-list">
            <div className="kk-rail-row is-active"><span className="swatch k-vocal" /><span className="label">close · controlled fem</span><span className="tag">v07</span></div>
            <div className="kk-rail-row"><span className="swatch k-vocal" /><span className="label">cracked tenor</span><span className="tag">v03</span></div>
            <div className="kk-rail-row"><span className="swatch k-vocal" /><span className="label">stacked chorus alt</span><span className="tag">alt</span></div>
          </div>
        </div>
      )}

      <div className="kk-rail-section">
        <div className="kk-rail-h">sound dna <span className="count">12</span></div>
        <div className="kk-rail-list">
          <div className="kk-rail-row"><span className="swatch k-vocal" /><span className="label">intimate, dry vocal</span><span className="tag">trait</span></div>
          <div className="kk-rail-row"><span className="swatch k-rhythm" /><span className="label">half-time pulse</span><span className="tag">trait</span></div>
          <div className="kk-rail-row"><span className="swatch k-mix" /><span className="label">low-end present, no club</span><span className="tag">trait</span></div>
          <div className="kk-rail-row"><span className="swatch k-rhythm" /><span className="label">language pivot audible</span><span className="tag">trait</span></div>
          <div className="kk-rail-row"><span className="swatch" style={{ background: "repeating-linear-gradient(45deg,#3a2a2a 0 3px,#241818 3px 6px)" }} /><span className="label" style={{ color: "var(--kk-red)" }}>avoid · cheesy ad-lib</span><span className="tag">anti</span></div>
        </div>
      </div>

      <div className="kk-rail-section">
        <div className="kk-rail-h">taste profile</div>
        <div className="kk-receipt">
          <div>likes <b>14</b> · keeps <b>06</b> · mutates <b>03</b></div>
          <div>archived branches <b>02</b></div>
          <div style={{ marginTop: 4 }} className="ok">last receipt · gen <b>G-0117</b> · ok</div>
        </div>
      </div>
    </aside>
  );
}

// ===================== RIGHT INSPECTOR =====================
//
// Default inspector shape (used on Console). Other screens pass a custom
// `blocks` array to render their own contents.

function RightInspector({
  scope = "selected line · 21",
  target = "I called it almost love",
  blocks,
}) {
  if (!blocks) blocks = defaultInspectorBlocks();
  return (
    <aside className="kk-inspector">
      <div className="kk-insp-h">
        <div className="scope">{scope}</div>
        <div className="target">
          <span style={{ fontFamily: "var(--kk-f-lyric)", fontWeight: 650, fontSize: 18 }}>"{target}"</span>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className="kk-tag role-payoff">payoff</span>
          <span className="kk-tag">central rhyme</span>
          <span className="kk-tag">title</span>
        </div>
      </div>
      {blocks.map((b, i) => <div className="kk-insp-block" key={i}>{b}</div>)}
    </aside>
  );
}

function defaultInspectorBlocks() {
  return [
    <>
      <div className="kk-insp-h2">intent</div>
      <div style={{ fontSize: 12.5, color: "var(--kk-text)", lineHeight: 1.55 }}>
        Lyric thesis. Functions as the song's title within the verse rhyme — emotional weight must land before
        "timing" inverts it. Voice should hold; do not stack here.
      </div>
      <div className="kk-chip-row" style={{ marginTop: 10 }}>
        <span className="kk-chip is-keep"><span className="icon">{Icon.keep()}</span> keep vocal</span>
        <span className="kk-chip is-keep"><span className="icon">{Icon.keep()}</span> keep tempo</span>
        <span className="kk-chip is-avoid"><span className="icon">{Icon.avoid()}</span> avoid stack</span>
      </div>
    </>,
    <>
      <div className="kk-insp-h2">fit <span className="meta">per current scope</span></div>
      <div style={{ display: "grid", gap: 8 }}>
        <FitRow label="lyric fit"      pct={92} kind="ok"   ev="manual"   note="payoff lands; rhyme audible" />
        <FitRow label="sound fit"      pct={71} kind="mid"  ev="provider" note="vocal intimate but reverb wet" />
        <FitRow label="language mix"   pct={88} kind="ok"   ev="text"     note="single english chorus — fine" />
        <FitRow label="hook integrity" pct={64} kind="mid"  ev="manual"   note="branch B trims chorus by 2 bars" />
        <FitRow label="audio causality" pct={null} kind="warn" ev="unverified" note="no computed-audio analysis yet — score withheld" />
      </div>
    </>,
    <>
      <div className="kk-insp-h2">suggested sound dna</div>
      <div className="kk-chip-row">
        <span className="kk-chip">controlled intimate vocal</span>
        <span className="kk-chip">half-time pulse</span>
        <span className="kk-chip is-avoid">no bright vocal stack</span>
      </div>
      <div className="kk-receipt" style={{ marginTop: 8 }}>derived from <b>04 likes</b> · <b>02 keeps</b> on this section</div>
    </>,
    <>
      <div className="kk-insp-h2">branch suggestions</div>
      <div style={{ display: "grid", gap: 6 }}>
        <BranchSugg id="B7"  text="combine hook from B / vocal from D"  fit="0.86" />
        <BranchSugg id="B8"  text="trim chorus 2 bars · keep pre"      fit="0.74" />
        <BranchSugg id="B9"  text="restate verse 2 in arabic"           fit="0.58" warn />
      </div>
    </>,
  ];
}

// FitRow shows the creative judgment. Provenance is recorded in `ev` but only
// surfaced when the score is `unverified` (i.e. an audit-relevant blocker)
// or when proof mode is on (rendered by an ancestor that flips on a class).
// `note` is the human reason — that's what the creator should read.
function FitRow({ label, pct, kind, ev, note }) {
  const cls = "kk-fitbar " + (kind === "low" ? "is-low" : kind === "mid" ? "is-mid" : "");
  const isBlocker = ev === "unverified" || kind === "warn";
  return (
    <div
      data-ev={ev}
      title={"evidence · " + ev}
      style={{ position: "relative" }}
    >
      <div className={cls}>
        <span className="lbl">{label}</span>
        <span className="track">
          {pct == null
            ? <span className="fill" style={{ background: "repeating-linear-gradient(90deg,var(--kk-muted-2) 0 4px,transparent 4px 8px)", width: "100%" }} />
            : <span className="fill" style={{ width: pct + "%" }} />
          }
        </span>
        <span className="val">{pct == null ? "—" : pct}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
        <span style={{ fontSize: 11, color: "var(--kk-muted)" }}>{note}</span>
        {isBlocker ? (
          <span className="kk-evidence unverified">{ev}</span>
        ) : (
          <span className="kk-ev-on-demand kk-evidence" data-ev={ev}>{ev}</span>
        )}
      </div>
    </div>
  );
}

function BranchSugg({ id, text, fit, warn }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto",
      gap: 10, alignItems: "center",
      padding: "8px 10px",
      border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-2)",
      background: "var(--kk-raised)", cursor: "pointer",
    }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.06em", color: warn ? "var(--kk-amber)" : "var(--kk-blue)" }}>{id}</span>
      <span style={{ fontSize: 12, color: "var(--kk-ink)" }}>{text}</span>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>fit · {fit}</span>
    </div>
  );
}

// ===================== WORKBENCH =====================

function Workbench({ scope = "scope · chorus", takes }) {
  if (!takes) takes = DEMO_TAKES;
  return (
    <section className="kk-workbench">
      <div className="kk-wb-h">
        <div className="title">
          generated takes <b>· 07</b>
          <span className="scope-pill">{scope}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="kk-btn ghost">{Icon.layers()} group by branch</span>
          <span className="kk-btn ghost">{Icon.scissor()} compare 03</span>
          <span className="kk-btn primary">{Icon.spark()} new generation</span>
        </div>
      </div>
      <div className="kk-takes">
        {takes.map((t) => <Take key={t.id} t={t} />)}
      </div>
    </section>
  );
}

function Take({ t }) {
  const cls = "kk-take" + (t.active ? " is-active" : "") + (t.archived ? " is-archived" : "");
  return (
    <div className={cls}>
      <div className="kk-take-h">
        <div className="vname">{t.name}</div>
        <div className="vid">{t.id}</div>
      </div>
      {/* provider/seed line — useful operationally, not provenance-as-clutter.
         The data-ev tag below preserves provenance internally. */}
      <div className="prov" data-ev="provider">
        suno · v4.5 · seed {t.seed}
      </div>
      <Fit label="lyric"   pct={t.fitL} ev="manual" />
      <Fit label="sound"   pct={t.fitS} ev="provider" mid={t.fitS < 80} />
      <Fit label="hook"    pct={t.fitH} ev="manual"  mid={t.fitH < 80} low={t.fitH < 60} />
      <div className="kk-wave"><WaveSVG seed={t.seed} accent={t.active} /></div>
      <div className="kk-section-strip">
        {t.sections.map((s, i) => (
          <div key={i} className={"seg" + (s.hook ? " is-hook" : "") + (s.sel ? " is-sel" : "")} style={{ gridColumn: "span " + s.span }}>
            {s.label}
          </div>
        ))}
      </div>
      <div className="kk-take-actions">
        <button className={"kk-iconbtn like" + (t.taste === "like" ? " is-on" : "")}>{Icon.like()}</button>
        <button className={"kk-iconbtn dislike" + (t.taste === "dislike" ? " is-on" : "")}>{Icon.dislike()}</button>
        <button className={"kk-iconbtn keep" + (t.taste === "keep" ? " is-on" : "")}>{Icon.keep()}</button>
        <div className="grow"></div>
        <button className="kk-take-btn">{Icon.combine()} breed</button>
        <button className="kk-take-btn primary">{Icon.play()} play</button>
      </div>
    </div>
  );
}

// Inline fit bar inside the take card. Default view shows only the creative
// judgment — no provenance dots, no evidence labels. `ev` is recorded in a
// data attribute so audit/hover/proof-mode tooling can read it.
function Fit({ label, pct, ev = "manual", mid, low }) {
  const cls = "kk-fitbar" + (low ? " is-low" : mid ? " is-mid" : "");
  return (
    <div className={cls} data-ev={ev} title={"evidence · " + ev}>
      <span className="lbl">{label}</span>
      <span className="track"><span className="fill" style={{ width: pct + "%" }} /></span>
      <span className="val">{pct}</span>
    </div>
  );
}

// Waveform SVG — deterministic pseudo-random based on seed.
// Visual only; never use this as "audio analysis."
function WaveSVG({ seed = 1, accent = false }) {
  const bars = 96;
  const w = 280; const h = 36; const bw = w / bars;
  let s = seed * 1.7 + 1.1;
  const heights = [];
  for (let i = 0; i < bars; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    // shape: low-energy intro, rise, hook peak around 60%, decline
    const env = 0.35 + 0.6 * Math.sin((i / bars) * Math.PI);
    heights.push(Math.max(2, env * (h - 6) * (0.45 + r * 0.7)));
  }
  return (
    <svg className="kk-wave-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {heights.map((bh, i) => (
        <rect key={i} x={i * bw + 0.4} y={(h - bh) / 2} width={bw - 0.8} height={bh}
          fill={accent ? "var(--kk-blue)" : "var(--kk-muted-2)"} opacity={accent ? 0.9 : 0.6} />
      ))}
    </svg>
  );
}

const DEMO_TAKES = [
  {
    id: "T-03", name: "restraint · low piano",  seed: 3, taste: "keep", active: true,
    fitL: 91, fitS: 82, fitH: 88,
    sections: [
      { label: "in",  span: 1 }, { label: "v1", span: 2 }, { label: "pre", span: 1 },
      { label: "hook", span: 2, hook: true, sel: true }, { label: "v2", span: 2 }, { label: "br", span: 1 }, { label: "out", span: 1 },
    ],
  },
  {
    id: "T-07", name: "close · controlled fem", seed: 7, taste: "like",
    fitL: 88, fitS: 74, fitH: 79,
    sections: [
      { label: "in",  span: 1 }, { label: "v1", span: 2 }, { label: "pre", span: 1 },
      { label: "hook", span: 2, hook: true }, { label: "v2", span: 2 }, { label: "br", span: 1 }, { label: "out", span: 1 },
    ],
  },
  {
    id: "T-12", name: "bilingual · oud bridge", seed: 12, taste: null,
    fitL: 76, fitS: 81, fitH: 71,
    sections: [
      { label: "in",  span: 1 }, { label: "v1", span: 2 }, { label: "pre", span: 1 },
      { label: "hook", span: 2, hook: true }, { label: "v2", span: 2 }, { label: "br · ar", span: 1 }, { label: "out", span: 1 },
    ],
  },
  {
    id: "T-05", name: "bright stack drift", seed: 5, taste: "dislike",
    fitL: 64, fitS: 51, fitH: 42,
    sections: [
      { label: "in",  span: 1 }, { label: "v1", span: 2 }, { label: "pre", span: 1 },
      { label: "hook", span: 2, hook: true }, { label: "v2", span: 2 }, { label: "br", span: 1 }, { label: "out", span: 1 },
    ],
  },
  {
    id: "T-09", name: "archived · genre slip", seed: 9, archived: true, taste: null,
    fitL: 58, fitS: 44, fitH: 38,
    sections: [
      { label: "in",  span: 1 }, { label: "v1", span: 2 }, { label: "pre", span: 1 },
      { label: "hook", span: 2, hook: true }, { label: "v2", span: 2 }, { label: "br", span: 1 }, { label: "out", span: 1 },
    ],
  },
];

Object.assign(window, {
  TopBar, LeftRail, RightInspector, defaultInspectorBlocks,
  Workbench, Take, WaveSVG, Fit, FitRow, BranchSugg, DEMO_TAKES,
});
