// screens/Compare.jsx — Taste Compare.
//
// Center: a comparison grid where rows are axes (whole / section / line /
// vocal / hook / mix / stem) and columns are takes. Each cell shows the
// creative judgment (chip + short reason). Evidence is silent by default.

function CompareScreen({ theme = "crypt", proof = false }) {
  const cols = [
    { id: "T-03", name: "restraint · low piano",  active: true },
    { id: "T-07", name: "close · controlled fem", active: false },
    { id: "T-12", name: "bilingual · oud bridge", active: false },
    { id: "T-05", name: "bright stack drift",     active: false },
  ];
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"}>
      <TopBar screen="compare" proof={proof} />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 360px" }}>
        <LeftRail />
        <main className="kk-center">
          <div className="kk-doc-h">
            <div className="kk-doc-title">
              <h1 style={{ fontFamily: "var(--kk-f-display)", fontWeight: 700, fontSize: 18 }}>Taste Compare</h1>
              <span className="vtag">04 takes · 7 axes</span>
            </div>
            <div className="kk-doc-tools">
              <span className="kk-doc-tool is-on">section · chorus</span>
              <span className="kk-doc-tool">whole</span>
              <span className="kk-doc-tool">line</span>
              <span className="kk-doc-tool">vocal</span>
              <span className="kk-doc-tool">hook</span>
              <span className="kk-doc-tool">mix</span>
              <span className="kk-doc-tool">stem</span>
            </div>
          </div>

          <div className="kk-cmp">
            <div className="row head">
              <div className="cell" style={{ background: "transparent" }}>
                <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.18em", color: "var(--kk-muted)" }}>AXIS · TAKE</span>
              </div>
              {cols.map((c) => (
                <div key={c.id} className="cell" style={c.active ? { boxShadow: "inset 0 -2px 0 var(--kk-blue)", color: "var(--kk-ink)" } : null}>
                  <span>{c.name}</span>
                  <span className="vid">{c.id}</span>
                </div>
              ))}
            </div>

            <CmpRow axis="whole take"  cells={[
              <Judg sentiment="keep" text="restraint reads · 88" />,
              <Judg sentiment="like" text="vocal close · 84" />,
              <Judg sentiment="like" text="curious branch · 76" />,
              <Judg sentiment="dislike" text="genre slip · 48" />,
            ]} />

            <CmpRow axis="hook" cells={[
              <Judg sentiment="keep" text={<>title lands<br /><span style={{ color: "var(--kk-muted)", fontSize: 11 }}>"I called it almost love" — held</span></>} />,
              <Judg sentiment="like" text="payoff softer · 78" />,
              <Judg sentiment="combine" text={<>combine w/ T-07 mix<br /><span style={{ color: "var(--kk-muted)", fontSize: 11 }}>better low-end</span></>} />,
              <Judg sentiment="avoid" text="stack drowns rhyme" />,
            ]} />

            <CmpRow axis="vocal moment" cells={[
              <Judg sentiment="keep" text="intimate · dry" />,
              <Judg sentiment="like" text="control held to end" />,
              <Judg sentiment="like" text="oud color in tail" />,
              <Judg sentiment="dislike" text="bright stack · cheesy" />,
            ]} />

            <CmpRow axis="mix pressure" cells={[
              <Judg sentiment="keep" text="low-end present" />,
              <Judg sentiment="mutate" text="vocal too reverb-wet" />,
              <Judg sentiment="like" text="warm · 74" />,
              <Judg sentiment="avoid" text="hi-shelf brittle" />,
            ]} />

            <CmpRow axis="language mix" cells={[
              <Judg sentiment="keep" text="english · clean" />,
              <Judg sentiment="keep" text="english · clean" />,
              <Judg sentiment="like" text="ar pivot audible · 88" />,
              <Judg sentiment="dislike" text="lost ar entirely" />,
            ]} />

            <CmpRow axis="branch role" cells={[
              <Judg sentiment="keep" text="lineage anchor" />,
              <Judg sentiment="like" text="sibling · alt vox" />,
              <Judg sentiment="combine" text="breed source" />,
              <Judg sentiment="archive" text={<>dead branch<br /><span style={{ color: "var(--kk-muted)", fontSize: 11 }}>genre slip — archived</span></>} />,
            ]} />
          </div>

          <div style={{ padding: "0 20px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <span className="kk-receipt">14 judgments on this scope · all manual</span>
            <span style={{ flex: 1 }} />
            <span className="kk-btn">{Icon.archive()} archive losers</span>
            <span className="kk-btn primary">{Icon.combine()} send picks to Remix</span>
          </div>
        </main>

        <CompareInspector />
      </div>
    </div>
  );
}

function CmpRow({ axis, cells }) {
  return (
    <div className="row">
      <div className="cell axis">{axis}</div>
      {cells.map((c, i) => <div key={i} className="cell"><div className="judgment">{c}</div></div>)}
    </div>
  );
}

function Judg({ sentiment, text }) {
  const cls = "kk-chip is-" + sentiment;
  return (
    <>
      <span className={cls} style={{ flexShrink: 0 }}>
        <span className="icon">{Icon[sentiment] ? Icon[sentiment]() : Icon.like()}</span>
        {sentiment}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--kk-ink)" }}>{text}</span>
    </>
  );
}

function CompareInspector() {
  return (
    <aside className="kk-inspector">
      <div className="kk-insp-h">
        <div className="scope">comparison scope</div>
        <div className="target">chorus · all 4 takes</div>
        <div className="lyric-quote">"I called it almost love" → "you called it timing"</div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">picks queued for remix <span className="meta">04</span></div>
        <div style={{ display: "grid", gap: 6 }}>
          <RemixPick from="T-03" what="hook · vocal delivery" />
          <RemixPick from="T-12" what="bridge · arabic pivot" />
          <RemixPick from="T-07" what="mix · low end present" />
          <RemixPick from="T-05" what="avoid · bright stack" avoid />
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">consensus signals</div>
        <div className="kk-chip-row">
          <span className="kk-chip is-keep"><span className="icon">{Icon.keep()}</span> intimate vocal</span>
          <span className="kk-chip is-keep"><span className="icon">{Icon.keep()}</span> low-end present</span>
          <span className="kk-chip is-avoid"><span className="icon">{Icon.avoid()}</span> bright stack</span>
          <span className="kk-chip is-avoid"><span className="icon">{Icon.avoid()}</span> hi-shelf brittle</span>
        </div>
        <div className="kk-receipt" style={{ marginTop: 10 }}>↳ 03 takes agree on intimate vocal · all manual</div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">divergence</div>
        <div style={{ fontSize: 12.5, color: "var(--kk-text)", lineHeight: 1.55 }}>
          T-12 is the only branch carrying the arabic pivot. T-07 has the most controlled vocal but its mix is wettest.
          T-03 is the anchor — most judgments preserve it.
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">next action</div>
        <button className="kk-btn primary" style={{ width: "100%" }}>
          {Icon.combine()} build branch B9 from these picks
        </button>
        <div className="kk-receipt" style={{ marginTop: 8 }}>routes to Remix Picker · no spend yet</div>
      </div>
    </aside>
  );
}

function RemixPick({ from, what, avoid }) {
  return (
    <div className={"kk-rp-tile" + (avoid ? " is-avoid" : "")} style={{ padding: "8px 10px" }}>
      <div className="src">from {from}</div>
      <div className="what" style={{ fontSize: 12 }}>{what}</div>
    </div>
  );
}

window.CompareScreen = CompareScreen;
