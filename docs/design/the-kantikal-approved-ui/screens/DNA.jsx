// screens/DNA.jsx — Sound DNA Library.
//
// Reusable traits and anti-signals derived from taste decisions. Each card
// shows the trait + the reason it exists + source evidence chips. The
// evidence here is shown by default because this surface IS the audit
// surface — the user came here specifically to look at what's recorded.

function DNAScreen({ theme = "crypt", proof = false }) {
  return (
    <div className="kk" data-theme={theme} data-proof="1">
      <TopBar screen="dna" proof={true} />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 380px" }}>
        <LeftRail showVoices={false} />
        <main className="kk-center" style={{ overflow: "auto" }}>
          <DNAHeader />

          <DNASection title="vocal" sub="texture · delivery · presence">
            <DNACard
              trait="close, controlled fem vocal"
              why="repeats across T-03, T-07; user kept it on this section twice."
              sources={["from T-03 chorus", "from T-07 v2", "ref · ammar restraint"]}
              evidence="manual"
            />
            <DNACard
              trait="dry vocal bus"
              why="user mutated wetter takes; restraint draft as reference."
              sources={["mutate · T-07", "ref · ammar"]}
              evidence="manual"
            />
            <DNACard
              trait="bright vocal stack"
              why="every take using this drifted into cheesy territory."
              sources={["T-05 archived", "T-09 archived"]}
              anti
              evidence="manual"
            />
          </DNASection>

          <DNASection title="rhythm + low end" sub="pulse · pressure · floor">
            <DNACard
              trait="half-time pulse"
              why="kept under all chorus iterations; lyric breath sits on the 1."
              sources={["across 03 takes"]}
              evidence="text"
            />
            <DNACard
              trait="low-end present, no club"
              why="user picked T-07's mix specifically for this combination."
              sources={["from T-07 mix", "user note · 'no club'"]}
              evidence="manual"
            />
            <DNACard
              trait="club low-end pulse"
              why="genre slip — kicks out of the half-time read."
              sources={["T-09 archived"]}
              anti
              evidence="manual"
            />
          </DNASection>

          <DNASection title="hook + language" sub="payoff · pivot · identity">
            <DNACard
              trait="title hook holds payoff line"
              why='"I called it almost love" is the song. Voice cannot stack here.'
              sources={["lyric line 21", "preserve across 04 picks"]}
              evidence="manual"
              keep
            />
            <DNACard
              trait="arabic pivot in bridge tail"
              why="al-hamdu lillah moment carries the resolution; must stay audible."
              sources={["lyric line 43", "ref · muqaam oud"]}
              evidence="manual"
              keep
            />
            <DNACard
              trait="generic inspirational lift"
              why="reads as generic AI pop; user has never kept a take that did this."
              sources={["text · prompt drift", "across 04 archived"]}
              anti
              evidence="text"
            />
          </DNASection>
        </main>

        <DNAInspector />
      </div>
    </div>
  );
}

function DNAHeader() {
  return (
    <div style={{ padding: "18px 24px 12px", borderBottom: "1px solid var(--kk-rule-soft)", display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>Sound DNA</h1>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
          12 traits · 03 anti-signals · evidence shown by default on this surface
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <span className="kk-doc-tool is-on">all</span>
        <span className="kk-doc-tool">vocal</span>
        <span className="kk-doc-tool">rhythm</span>
        <span className="kk-doc-tool">mix</span>
        <span className="kk-doc-tool">language</span>
        <span className="kk-doc-tool">anti</span>
      </div>
    </div>
  );
}

function DNASection({ title, sub, children }) {
  return (
    <section style={{ padding: "18px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 14, letterSpacing: "0.01em" }}>{title}</span>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)", letterSpacing: "0.06em" }}>{sub}</span>
      </div>
      <div className="kk-dna-grid" style={{ padding: 0 }}>{children}</div>
    </section>
  );
}

function DNACard({ trait, why, sources, evidence, anti, keep }) {
  return (
    <div className={"kk-dna-card" + (anti ? " is-anti" : "")} style={keep ? { borderColor: "color-mix(in oklab, var(--kk-blue) 35%, transparent)" } : null}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className={"label" + (anti ? " is-anti" : "")}>
          {anti ? "anti-signal" : keep ? "kept · current" : "trait"}
        </div>
        <span className="kk-evidence" data-ev={evidence}>{evidence}</span>
      </div>
      <div className="trait">{trait}</div>
      <div className="why">{why}</div>
      <div className="src">
        {sources.map((s, i) => (
          <span key={i} style={{
            fontFamily: "var(--kk-f-mono)", fontSize: 9.5, letterSpacing: "0.04em",
            color: "var(--kk-muted)", padding: "2px 6px",
            border: "1px dashed var(--kk-rule)", borderRadius: 3,
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function DNAInspector() {
  return (
    <aside className="kk-inspector" style={{ background: "var(--kk-surface)" }}>
      <div className="kk-insp-h">
        <div className="scope">library audit</div>
        <div className="target">12 traits · 03 anti</div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">evidence mix</div>
        <div style={{ display: "grid", gap: 6 }}>
          <EvBar label="manual"          n={9} of={15} color="var(--kk-ink-dim)" />
          <EvBar label="text-derived"    n={4} of={15} color="#c8b48a" />
          <EvBar label="provider-derived" n={2} of={15} color="var(--kk-blue)" />
          <EvBar label="computed-audio"  n={0} of={15} color="var(--kk-green)" warn />
        </div>
        <div className="kk-receipt" style={{ marginTop: 10, color: "var(--kk-amber)" }}>
          ⚠ no computed-audio evidence yet — taste claims may not be audio-causal
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">most-used in lineage</div>
        <div style={{ display: "grid", gap: 6, fontSize: 12.5 }}>
          <UsedRow trait="close, controlled fem vocal" branches={["A", "B", "B9", "C"]} />
          <UsedRow trait="half-time pulse"              branches={["A", "B", "B9", "C", "D"]} />
          <UsedRow trait="low-end present, no club"     branches={["B", "B9", "D"]} />
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">recent additions</div>
        <div style={{ fontSize: 12.5, color: "var(--kk-text)", lineHeight: 1.6 }}>
          <div>• <b>arabic pivot in bridge tail</b> — added from T-12 (manual)</div>
          <div>• <b>generic inspirational lift</b> — added as anti (text)</div>
        </div>
      </div>

      <div className="kk-insp-block">
        <button className="kk-btn primary" style={{ width: "100%" }}>
          {Icon.upload()} import provenance audit
        </button>
        <div className="kk-receipt" style={{ marginTop: 6 }}>full evidence log · json export for receipts</div>
      </div>
    </aside>
  );
}

function EvBar({ label, n, of, color, warn }) {
  const pct = (n / of) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: warn && n === 0 ? "var(--kk-amber)" : "var(--kk-text)" }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10 }}>{n}/{of}</span>
      </div>
      <div style={{ height: 3, background: "var(--kk-rule)", borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
        <div style={{ height: "100%", width: pct + "%", background: color }} />
      </div>
    </div>
  );
}

function UsedRow({ trait, branches }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
      <span style={{ color: "var(--kk-ink)" }}>{trait}</span>
      <span style={{ display: "flex", gap: 3 }}>
        {branches.map((b) => (
          <span key={b} style={{
            fontFamily: "var(--kk-f-mono)", fontSize: 9, color: "var(--kk-blue)",
            border: "1px solid color-mix(in oklab, var(--kk-blue) 35%, transparent)",
            borderRadius: 3, padding: "0 4px",
          }}>{b}</span>
        ))}
      </span>
    </div>
  );
}

window.DNAScreen = DNAScreen;
