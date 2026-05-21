// screens/Genealogy.jsx — Track Genealogy.
//
// Layout decision: time-lane tree, not a free-floating node board.
// Branches are LANES (horizontal rows). Time flows left → right.
// Each generation event is a labelled node. Edges are short, only between
// adjacent generations. Mutations live on the edge label. Dead branches
// drop to a muted "archive" lane at the bottom with the archive reason
// inline. Selected branch lights up across all lanes (highlighted edge
// path). No floating bubbles, no force layout, no decorative orbs.
//
// Right inspector explains the selected node: what caused it, what
// changed, what stayed stable, why it matters or was archived.

function GenealogyScreen({ theme = "crypt", proof = false }) {
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"}>
      <TopBar screen="tree" proof={proof} />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 380px" }}>
        <LeftRail />
        <main className="kk-center kk-tree-bg" style={{ overflow: "auto" }}>
          <GeneHeader />
          <GeneTree />
        </main>
        <GeneInspector />
      </div>
    </div>
  );
}

function GeneHeader() {
  return (
    <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid var(--kk-rule-soft)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>
          Track Genealogy
        </h1>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
          09 generations · 04 branches · 02 archived
        </span>
        <span style={{ flex: 1 }} />
        <span className="kk-doc-tool is-on">branches</span>
        <span className="kk-doc-tool">mutations</span>
        <span className="kk-doc-tool">inherited traits</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--kk-muted)", maxWidth: 720 }}>
        Time flows left → right. Each lane is a branch. Hover an edge for the mutation; click a node for the full explanation.
      </div>
    </div>
  );
}

// The tree itself is rendered with absolutely-positioned nodes + SVG edges.
// 6 columns × 4 lanes + 1 archive lane.

function GeneTree() {
  // node grid
  const COLS = 6;
  const COL_W = 168;
  const LANE_H = 92;
  const LEFT = 64;
  const TOP  = 28;

  // lanes
  const lanes = [
    { id: "A", title: "Branch A · reference draft", color: "var(--kk-muted)",  archived: false, lane: 0 },
    { id: "B", title: "Branch B · chorus-trim",     color: "var(--kk-blue)",   archived: false, lane: 1, active: true },
    { id: "C", title: "Branch C · ar-bridge",       color: "var(--kk-ink-dim)",archived: false, lane: 2 },
    { id: "D", title: "Branch D · mix experiment",  color: "var(--kk-ink-dim)",archived: false, lane: 3 },
    { id: "X", title: "Archived",                   color: "var(--kk-muted-2)",archived: true,  lane: 4 },
  ];

  // nodes per lane: { col, kind, label, sublabel, current? }
  const nodes = {
    A: [
      { col: 0, kind: "seed",   label: "reference draft",  sub: "from ammar restraint draft" },
      { col: 1, kind: "gen",    label: "G-110",            sub: "4 takes" },
      { col: 2, kind: "gen",    label: "G-112",            sub: "2 takes" },
    ],
    B: [
      { col: 1, kind: "branch", label: "fork → B",         sub: "from A · trim chorus" },
      { col: 2, kind: "gen",    label: "G-114",            sub: "T-03 lineage anchor", keep: true },
      { col: 3, kind: "gen",    label: "G-117",            sub: "4 takes" },
      { col: 4, kind: "gen",    label: "G-118",            sub: "current · B9 pending", current: true },
    ],
    C: [
      { col: 2, kind: "branch", label: "fork → C",         sub: "from B · restate AR" },
      { col: 3, kind: "gen",    label: "G-116",            sub: "T-12 bridge color" },
      { col: 5, kind: "merge",  label: "merges → B9",      sub: "ar pivot inherited" },
    ],
    D: [
      { col: 3, kind: "branch", label: "fork → D",         sub: "from B · mix pressure" },
      { col: 4, kind: "gen",    label: "G-119",            sub: "T-07 low-end keeper" },
      { col: 5, kind: "merge",  label: "merges → B9",      sub: "mix pressure inherited" },
    ],
    X: [
      { col: 3, kind: "archive", label: "T-05 archived",   sub: "drift · bright vocal stack" },
      { col: 4, kind: "archive", label: "T-09 archived",   sub: "drift · genre slip into edm" },
    ],
  };

  // edges: from {lane, col} to {lane, col}, label for mutation
  const edges = [
    { from: ["A", 0], to: ["A", 1], label: "first run" },
    { from: ["A", 1], to: ["A", 2], label: "rerun · 2 takes" },
    { from: ["A", 1], to: ["B", 1], label: "fork · trim chorus", branch: true },
    { from: ["B", 1], to: ["B", 2], label: "first run", active: true },
    { from: ["B", 2], to: ["B", 3], label: "rerun", active: true },
    { from: ["B", 3], to: ["B", 4], label: "rerun · 4 takes", active: true, current: true },
    { from: ["B", 2], to: ["C", 2], label: "fork · restate AR", branch: true },
    { from: ["C", 2], to: ["C", 3], label: "first run · 2 takes" },
    { from: ["B", 3], to: ["D", 3], label: "fork · mix swap", branch: true },
    { from: ["D", 3], to: ["D", 4], label: "first run · 4 takes" },
    { from: ["C", 3], to: ["C", 5], label: "ar pivot → B9", merge: true },
    { from: ["D", 4], to: ["D", 5], label: "mix → B9",      merge: true },
    { from: ["B", 3], to: ["X", 3], label: "archive · T-05", archive: true },
    { from: ["D", 4], to: ["X", 4], label: "archive · T-09", archive: true },
  ];

  const lanePos = (l) => TOP + l * LANE_H + 42;
  const colPos = (c) => LEFT + c * COL_W;
  const laneByid = Object.fromEntries(lanes.map((l) => [l.id, l]));

  const totalW = LEFT + COLS * COL_W + 60;
  const totalH = TOP + lanes.length * LANE_H + 40;

  return (
    <div style={{ position: "relative", padding: "18px 24px 32px", minHeight: totalH, minWidth: totalW }}>
      {/* lane backgrounds + labels */}
      {lanes.map((l) => (
        <div key={l.id} style={{
          position: "absolute",
          left: 0, right: 0,
          top: TOP + l.lane * LANE_H + 4,
          height: LANE_H - 14,
          padding: "0 24px",
          borderTop: l.archived ? "1px dashed var(--kk-rule)" : "1px solid var(--kk-rule-soft)",
          background: l.active ? "linear-gradient(180deg, var(--kk-blue-wash), transparent)" :
                       l.archived ? "linear-gradient(180deg, color-mix(in oklab, var(--kk-red) 4%, transparent), transparent)" : "transparent",
        }}>
          <div style={{
            position: "absolute", left: 24, top: 8,
            fontFamily: "var(--kk-f-mono)", fontSize: 9.5, letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: l.archived ? "var(--kk-red)" : (l.active ? "var(--kk-blue)" : "var(--kk-muted-2)"),
          }}>{l.title}</div>
        </div>
      ))}

      {/* edges as SVG behind nodes */}
      <svg style={{ position: "absolute", left: 24, top: 0, width: totalW - 24, height: totalH, pointerEvents: "none" }}>
        {edges.map((e, i) => {
          const [fl, fc] = e.from; const [tl, tc] = e.to;
          const x1 = colPos(fc) + 48 - 24; const y1 = lanePos(laneByid[fl].lane);
          const x2 = colPos(tc) - 24;      const y2 = lanePos(laneByid[tl].lane);
          const color = e.archive ? "var(--kk-red)" : e.merge ? "var(--kk-green)" : e.branch ? "var(--kk-amber)" : e.active ? "var(--kk-blue)" : "var(--kk-muted-2)";
          const d = `M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`;
          const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
          return (
            <g key={i} opacity={e.active || e.current ? 1 : 0.65}>
              <path d={d} stroke={color} strokeWidth={e.current ? 2 : 1.4} fill="none"
                strokeDasharray={e.archive ? "4 3" : null} />
              <g transform={`translate(${mx}, ${my})`}>
                <rect x={-Math.max(46, e.label.length * 3.2)} y={-8} width={Math.max(92, e.label.length * 6.4)} height={16} rx={3}
                  fill="var(--kk-base)" stroke={color} strokeWidth={0.7} opacity={0.9} />
                <text x={0} y={3} textAnchor="middle"
                  style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, fill: color, letterSpacing: "0.04em" }}>
                  {e.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* nodes */}
      {lanes.map((l) =>
        nodes[l.id].map((n, i) => (
          <GeneNode key={l.id + "-" + i} n={n} l={l}
            x={colPos(n.col)} y={lanePos(l.lane)} />
        ))
      )}

      {/* column ruler */}
      <div style={{
        position: "absolute", left: LEFT, top: TOP - 22,
        width: COLS * COL_W, height: 20,
        display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        fontFamily: "var(--kk-f-mono)", fontSize: 9.5, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--kk-muted-2)",
      }}>
        {["may 18", "may 19", "may 20", "may 20", "may 21", "may 21 · now"].map((t, i) => (
          <div key={i} style={{ borderLeft: "1px solid var(--kk-rule-soft)", paddingLeft: 10 }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

function GeneNode({ n, l, x, y }) {
  const color =
    n.kind === "archive" ? "var(--kk-red)" :
    n.kind === "branch"  ? "var(--kk-amber)" :
    n.kind === "merge"   ? "var(--kk-green)" :
    n.current ? "var(--kk-blue)" :
    l.active ? "var(--kk-blue)" :
    "var(--kk-ink-dim)";
  return (
    <div style={{
      position: "absolute", left: x - 24, top: y - 26,
      width: 132,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 8px", borderRadius: "var(--kk-r-2)",
        background: n.current ? "var(--kk-blue-wash)" : "var(--kk-raised)",
        border: "1px solid " + (n.current ? color : "var(--kk-rule)"),
        boxShadow: n.current ? "0 0 0 1px var(--kk-blue) inset, 0 6px 16px var(--kk-blue-wash)" : null,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: n.kind === "branch" || n.kind === "merge" ? 2 : "50%",
          background: color, transform: n.kind === "merge" ? "rotate(45deg)" : null,
          flex: "0 0 auto",
        }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: color,
            letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>{n.label}</div>
          <div style={{
            fontSize: 10, color: "var(--kk-muted)", marginTop: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>{n.sub}</div>
        </div>
      </div>
    </div>
  );
}

function GeneInspector() {
  return (
    <aside className="kk-inspector" style={{ background: "var(--kk-surface)" }}>
      <div className="kk-insp-h">
        <div className="scope">selected · G-118</div>
        <div className="target">B9 · chorus-trim + ar-bridge</div>
        <div style={{ marginTop: 8, fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-blue)" }}>
          status · pending · suno acked · 4 takes expected
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">why this branch exists</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--kk-text)" }}>
          Branch B trimmed the chorus to keep the payoff line tight. C and D explored arabic bridge and mix pressure
          in parallel. B9 merges those two findings back into B with no other mutations.
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">what stayed stable</div>
        <div className="kk-chip-row">
          <span className="kk-chip is-keep">close vocal</span>
          <span className="kk-chip is-keep">half-time pulse</span>
          <span className="kk-chip is-keep">title hook</span>
          <span className="kk-chip is-keep">A min · 92 bpm</span>
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">what changed</div>
        <div className="kk-chip-row">
          <span className="kk-chip is-mutate">chorus length −2 bars</span>
          <span className="kk-chip is-mutate">restate bridge in AR</span>
          <span className="kk-chip is-keep">mix · low-end forward</span>
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">archive context</div>
        <div style={{ display: "grid", gap: 8 }}>
          <ArchEntry id="T-05" reason="bright vocal stack drowned rhyme" parent="B" />
          <ArchEntry id="T-09" reason="genre slip into edm pulse"        parent="D" />
        </div>
      </div>

      <div className="kk-insp-block" style={{ display: "flex", gap: 8 }}>
        <button className="kk-btn">{Icon.tree()} focus lineage</button>
        <button className="kk-btn primary" style={{ flex: 1 }}>{Icon.spark()} continue B9</button>
      </div>
    </aside>
  );
}

function ArchEntry({ id, reason, parent }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, padding: "8px 10px", border: "1px dashed var(--kk-rule)", borderRadius: "var(--kk-r-2)" }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-red)" }}>{id}</span>
      <div>
        <div style={{ fontSize: 12.5, color: "var(--kk-ink)" }}>{reason}</div>
        <div style={{ fontSize: 11, color: "var(--kk-muted)" }}>from parent {parent}</div>
      </div>
    </div>
  );
}

window.GenealogyScreen = GenealogyScreen;
