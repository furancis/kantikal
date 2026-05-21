// screens/SongLab.jsx — Song Lab.
//
// Post-promising-take repair. The selected take (T-03 here, our anchor)
// goes through targeted operations: section repair, stem edit, lyric
// revision, extension, cover/remix, mix direction. The center shows the
// take as a section timeline you can scrub and target.

function SongLabScreen({ theme = "crypt", proof = false }) {
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"}>
      <TopBar screen="lab" proof={proof} />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 380px" }}>
        <LeftRail />
        <main className="kk-center" style={{ overflow: "auto" }}>
          <LabHeader />
          <LabTimeline />
          <LabOperations />
        </main>
        <LabInspector />
      </div>
    </div>
  );
}

function LabHeader() {
  return (
    <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid var(--kk-rule-soft)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>
          Song Lab
        </h1>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
          editing · <b style={{ color: "var(--kk-blue)" }}>T-03 · restraint · low piano</b>
        </span>
        <span style={{ flex: 1 }} />
        <span className="kk-btn">{Icon.play()} preview</span>
        <span className="kk-btn ghost">{Icon.layers()} compare to parent</span>
      </div>
    </div>
  );
}

// timeline: section bars, waveform underneath, scrubber, selection range.
function LabTimeline() {
  const sections = [
    { id: "intro", label: "intro",  span: 1, t: "0:00" },
    { id: "v1",    label: "verse 1", span: 2, t: "0:18" },
    { id: "pre",   label: "pre",     span: 1, t: "0:48" },
    { id: "ch",    label: "chorus",  span: 2, t: "1:06", hook: true, sel: true },
    { id: "v2",    label: "verse 2", span: 2, t: "1:38" },
    { id: "br",    label: "bridge",  span: 1, t: "2:36" },
    { id: "out",   label: "outro",   span: 1, t: "3:10" },
  ];
  const total = sections.reduce((s, x) => s + x.span, 0);
  return (
    <div style={{ padding: "16px 28px 8px" }}>
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${total}, 1fr)`,
        gap: 2, marginBottom: 6,
      }}>
        {sections.map((s) => (
          <div key={s.id} style={{
            gridColumn: "span " + s.span,
            padding: "8px 10px", borderRadius: "var(--kk-r-2)",
            background: s.sel ? "var(--kk-blue-wash)" : s.hook ? "color-mix(in oklab, var(--kk-blue) 6%, transparent)" : "var(--kk-raised)",
            border: "1px solid " + (s.sel ? "var(--kk-blue)" : "var(--kk-rule)"),
            cursor: "pointer", position: "relative",
          }}>
            <div style={{
              fontFamily: "var(--kk-f-mono)", fontSize: 9.5,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: s.sel ? "var(--kk-ink)" : "var(--kk-muted)"
            }}>{s.label}</div>
            <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, color: "var(--kk-muted-2)", marginTop: 2 }}>{s.t}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 56, background: "color-mix(in oklab, var(--kk-base) 90%, #000)", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-2)", position: "relative", overflow: "hidden" }}>
        <WaveSVG seed={3} accent />
        {/* selection range on chorus */}
        <div style={{
          position: "absolute", left: "calc(50% / 10 * 4)", top: 0, bottom: 0, width: "calc(100% / 10 * 2)",
          background: "color-mix(in oklab, var(--kk-blue) 18%, transparent)",
          borderLeft: "1px solid var(--kk-blue)", borderRight: "1px solid var(--kk-blue)",
        }} />
        {/* playhead */}
        <div style={{ position: "absolute", left: "52%", top: 0, bottom: 0, width: 2, background: "var(--kk-amber)", boxShadow: "0 0 8px var(--kk-amber)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>
          selection · <b style={{ color: "var(--kk-ink-dim)" }}>chorus · 1:06 → 1:38</b>
        </span>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>
          playhead · 1:18 / 3:24
        </span>
      </div>
    </div>
  );
}

function LabOperations() {
  return (
    <div style={{ padding: "16px 28px 28px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      <OpCard
        title="section repair"
        verb="regenerate · chorus"
        body={
          <>
            <KV k="preserve" v="hook · vocal delivery" />
            <KV k="mutate"   v="length −2 bars" />
            <KV k="cost"     v="~3 cr · 2 takes" />
          </>
        }
        primary
      />
      <OpCard
        title="stem edit"
        verb="route · vocal bus"
        body={
          <>
            <KV k="bus"      v="vocal" />
            <KV k="treatment" v="dry · −2 dB plate" />
            <KV k="affects"   v="chorus + bridge only" />
          </>
        }
      />
      <OpCard
        title="lyric revision"
        verb="rewrite · verse 2 · l27"
        body={
          <div style={{ fontFamily: "var(--kk-f-lyric)", fontSize: 13, color: "var(--kk-ink-dim)", lineHeight: 1.5 }}>
            <div style={{ textDecoration: "line-through", opacity: 0.5 }}>Private was cheaper than public</div>
            <div>Private was a tariff we both paid</div>
          </div>
        }
      />
      <OpCard
        title="extension"
        verb="extend · outro"
        body={
          <>
            <KV k="from"    v="3:24" />
            <KV k="length"  v="+0:14 of breath" />
            <KV k="instruct" v="hold ar phrase, fade unison" />
          </>
        }
      />
      <OpCard
        title="cover / remix"
        verb="cover · alternate vocal"
        body={
          <>
            <KV k="voice"   v="cracked tenor (v03)" />
            <KV k="keep"    v="lyric · structure · key" />
            <KV k="cost"    v="~4 cr · 2 takes" />
          </>
        }
      />
      <OpCard
        title="mix direction"
        verb="re-mix · whole song"
        body={
          <>
            <KV k="vocal"   v="dry · close mic" />
            <KV k="low end" v="present · no club" />
            <KV k="hi"      v="restrained · no shelf" />
          </>
        }
      />
    </div>
  );
}

function OpCard({ title, verb, body, primary }) {
  return (
    <div style={{
      background: "var(--kk-surface)",
      border: "1px solid " + (primary ? "color-mix(in oklab, var(--kk-blue) 45%, transparent)" : "var(--kk-rule)"),
      borderRadius: "var(--kk-r-3)",
      padding: 14,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 13.5 }}>{title}</span>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, color: "var(--kk-muted-2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>op</span>
      </div>
      <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: primary ? "var(--kk-blue)" : "var(--kk-muted)", letterSpacing: "0.06em" }}>{verb}</div>
      <div style={{ fontSize: 12.5, color: "var(--kk-text)" }}>{body}</div>
      <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
        <button className="kk-btn ghost" style={{ flex: 1, justifyContent: "center" }}>preview</button>
        <button className={"kk-btn" + (primary ? " primary" : "")} style={{ flex: 1, justifyContent: "center" }}>queue</button>
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: 8, padding: "2px 0", fontFamily: "var(--kk-f-mono)", fontSize: 11 }}>
      <span style={{ color: "var(--kk-muted-2)" }}>{k}</span>
      <span style={{ color: "var(--kk-ink-dim)" }}>{v}</span>
    </div>
  );
}

function LabInspector() {
  return (
    <aside className="kk-inspector" style={{ background: "var(--kk-surface)" }}>
      <div className="kk-insp-h">
        <div className="scope">queued ops · 02</div>
        <div className="target">T-03 · revision draft</div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">queue</div>
        <div style={{ display: "grid", gap: 8 }}>
          <QueuedOp n="01" verb="section repair" what="chorus · trim −2 bars" cost="3 cr" />
          <QueuedOp n="02" verb="lyric revision" what="v2 · l27 rewrite" cost="0 cr" />
        </div>
        <button className="kk-btn primary" style={{ width: "100%", marginTop: 12 }}>
          {Icon.spark()} run queue · 3 cr
        </button>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">fit projection</div>
        <FitRow label="lyric fit"      pct={94} kind="ok"  ev="manual"   note="after l27 rewrite" />
        <FitRow label="hook integrity" pct={86} kind="ok"  ev="manual"   note="chorus tightens; payoff still lands" />
        <FitRow label="sound fit"      pct={null} kind="warn" ev="unverified" note="depends on regen; not knowable yet" />
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">what's not editable here</div>
        <div style={{ fontSize: 12, color: "var(--kk-muted)", lineHeight: 1.6 }}>
          tempo · key · structure (verse count) — change at Generation Desk, not Song Lab.
        </div>
      </div>
    </aside>
  );
}

function QueuedOp({ n, verb, what, cost }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center", padding: "8px 10px", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-2)", background: "var(--kk-raised)" }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted-2)" }}>{n}</span>
      <div>
        <div style={{ fontSize: 12.5, color: "var(--kk-ink)" }}>{verb}</div>
        <div style={{ fontSize: 11, color: "var(--kk-muted)" }}>{what}</div>
      </div>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-amber)" }}>{cost}</span>
    </div>
  );
}

window.SongLabScreen = SongLabScreen;
