// screens/Picker.jsx — Remix Picker.
//
// The key "I like this part from this and that part from that" surface.
// Picks are TasteSignals; the assembled set is a LineageRule that becomes
// the next branch's brief. Liquid surface on the picker container + the
// preview slab (the spec'd application of Liquid DOM).

function PickerScreen({ theme = "crypt", proof = false }) {
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"}>
      <TopBar screen="picker" proof={proof} />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 380px" }}>
        <LeftRail />
        <main className="kk-center">
          <PickerHeader />
          <PickerGrid />
          <PickerFooter />
        </main>
        <PickerPreview />
      </div>
    </div>
  );
}

function PickerHeader() {
  return (
    <div style={{ padding: "16px 24px 12px", borderBottom: "1px solid var(--kk-rule-soft)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>
          Remix Picker
        </h1>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)", letterSpacing: "0.08em" }}>
          building branch <b style={{ color: "var(--kk-blue)" }}>B9 / chorus-trim+ar-bridge</b>
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted-2)" }}>
          parent · B / chorus-trim
        </span>
      </div>
      <div style={{ marginTop: 8, fontFamily: "var(--kk-f-lyric)", color: "var(--kk-ink-dim)", fontSize: 14, lineHeight: 1.5, maxWidth: 720 }}>
        "I called it almost love · you called it timing" — keep the hook, swap the mix, restate the bridge in arabic.
      </div>
    </div>
  );
}

// Picker grid: 5 columns, each is a "source slot" you can fill with one
// pick from any take. Liquid surface wraps the grid container.
function PickerGrid() {
  return (
    <div style={{
      flex: 1, padding: "16px 24px 8px",
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, minHeight: 0,
    }}>
      <PickerCol
        verb="hook"
        sub="from"
        picked={{ src: "T-03 · chorus", what: "hook · vocal delivery", why: "title lands; payoff held", note: "preserve" }}
        candidates={[
          { src: "T-07 · chorus", what: "softer payoff" },
          { src: "T-12 · chorus", what: "oud color tail" },
        ]}
      />
      <PickerCol
        verb="vocal texture"
        sub="from"
        picked={{ src: "T-07 · v2",     what: "close · controlled fem", why: "control held to end", note: "preserve" }}
        candidates={[
          { src: "T-03 · v1", what: "drier · less air" },
          { src: "T-12 · br", what: "ar pivot texture" },
        ]}
      />
      <PickerCol
        verb="mix pressure"
        sub="from"
        picked={{ src: "T-07 · whole", what: "low-end present, no club", why: "better low-end", note: "preserve" }}
        candidates={[
          { src: "T-03 · whole", what: "drier vocal bus" },
          { src: "ref · ammar",  what: "restraint draft" },
        ]}
      />
      <PickerCol
        verb="language mix"
        sub="from"
        picked={{ src: "T-12 · bridge", what: "arabic pivot audible", why: "carry al-hamdu lillah", note: "preserve" }}
        candidates={[
          { src: "lyric · outro", what: "single line · ar 1 word" },
        ]}
      />
      <PickerCol
        verb="avoid"
        sub="from"
        avoid
        picked={{ src: "T-05 · archived", what: "bright vocal stack", why: "cheesy · drowns rhyme", note: "anti-signal" }}
        candidates={[
          { src: "T-09 · archived", what: "genre slip · edm pulse" },
          { src: "dna · anti",      what: "inspirational lift" },
        ]}
      />
    </div>
  );
}

function PickerCol({ verb, sub, picked, candidates, avoid = false }) {
  return (
    <LiquidSurface real className="kk-rp-col" style={{ padding: 12 }}>
      <div className="kk-rp-col-h">
        <span><span className="verb" style={{ color: avoid ? "var(--kk-red)" : "var(--kk-blue)" }}>{verb}</span> <span style={{ opacity: 0.55 }}>{sub}</span></span>
        <span style={{ color: "var(--kk-muted-2)" }}>·</span>
      </div>
      <div className={"kk-rp-tile is-picked" + (avoid ? " is-avoid" : "")}>
        <div className="src">{picked.src}</div>
        <div className="what">{picked.what}</div>
        <div className="why">{picked.why}</div>
        <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, letterSpacing: "0.12em", color: avoid ? "var(--kk-red)" : "var(--kk-blue)", textTransform: "uppercase" }}>
            {picked.note}
          </span>
          <span style={{ display: "flex", gap: 4 }}>
            <button className="kk-iconbtn" title="swap">{Icon.layers()}</button>
            <button className="kk-iconbtn" title="remove">{Icon.cross()}</button>
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, opacity: 0.85 }}>
        <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--kk-muted-2)" }}>
          candidates
        </div>
        {candidates.map((c, i) => (
          <div className="kk-rp-tile" key={i} style={{ padding: "7px 9px" }}>
            <div className="src">{c.src}</div>
            <div className="what" style={{ fontSize: 11.5 }}>{c.what}</div>
          </div>
        ))}
        <button className="kk-btn ghost" style={{ marginTop: 2, justifyContent: "center" }}>
          {Icon.plus()} add from compare
        </button>
      </div>
    </LiquidSurface>
  );
}

function PickerFooter() {
  return (
    <div style={{ padding: "10px 24px 16px", borderTop: "1px solid var(--kk-rule-soft)", display: "flex", gap: 10, alignItems: "center" }}>
      <span className="kk-receipt"><b>05 picks</b> queued · 04 preserve · 01 anti-signal</span>
      <span className="kk-receipt"><b>lineage</b> · parent B / chorus-trim · adds 02 traits, removes 01</span>
      <span style={{ flex: 1 }} />
      <span className="kk-btn ghost">save as draft</span>
      <span className="kk-btn primary">{Icon.chevron()} send to Generation Desk</span>
    </div>
  );
}

function PickerPreview() {
  return (
    <aside className="kk-inspector" style={{ background: "var(--kk-surface)" }}>
      <div className="kk-insp-h">
        <div className="scope">resulting branch</div>
        <div className="target">B9 · chorus-trim + ar-bridge</div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">what's preserved <span className="meta">04</span></div>
        <div style={{ display: "grid", gap: 6 }}>
          <DiffMini verb="preserve" what="hook vocal delivery" src="from T-03" />
          <DiffMini verb="preserve" what="close, controlled fem vocal" src="from T-07" />
          <DiffMini verb="preserve" what="low-end present, no club mix" src="from T-07" />
          <DiffMini verb="preserve" what="arabic pivot audible" src="from T-12 bridge" />
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">what's removed</div>
        <DiffMini verb="avoid" what="bright vocal stack" src="anti-signal from T-05" />
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">section coverage</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, height: 16 }}>
          {["in","v1","pre","hook","v2","br","out"].map((s, i) => (
            <div key={i} style={{
              background: i === 3 || i === 5 ? "var(--kk-blue)" : i === 1 || i === 2 || i === 6 ? "var(--kk-blue-wash)" : "var(--kk-rule)",
              borderRadius: 2,
              display: "grid", placeItems: "center",
              fontFamily: "var(--kk-f-mono)", fontSize: 9, color: i === 3 || i === 5 ? "var(--kk-base)" : "var(--kk-muted)"
            }}>{s}</div>
          ))}
        </div>
        <div className="kk-receipt" style={{ marginTop: 8 }}>
          hook + bridge are picked exactly · verses inherit from parent · intro/outro untouched
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">expected drift</div>
        <div style={{ display: "grid", gap: 6, fontSize: 12.5, color: "var(--kk-text)" }}>
          <div>arabic pivot may need a tempo nudge to land cleanly with the trimmed chorus.</div>
          <div style={{ color: "var(--kk-amber)", display: "flex", alignItems: "center", gap: 6 }}>
            {Icon.warn()} flagged: T-07 mix was rated wetter than target — apply restraint pass before play.
          </div>
        </div>
      </div>

      <div className="kk-insp-block">
        <button className="kk-btn primary" style={{ width: "100%" }}>
          {Icon.spark()} send to Generation Desk
        </button>
        <div className="kk-receipt" style={{ marginTop: 6 }}>
          no spend until you confirm at desk · receipt will read <b>G-0118</b>
        </div>
      </div>
    </aside>
  );
}

function DiffMini({ verb, what, src }) {
  const c = verb === "avoid" ? "var(--kk-red)" : verb === "mutate" ? "var(--kk-amber)" : "var(--kk-green)";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 10, alignItems: "start" }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c }}>{verb}</span>
      <div>
        <div style={{ fontSize: 12.5, color: "var(--kk-ink)" }}>{what}</div>
        <div style={{ fontSize: 11, color: "var(--kk-muted)" }}>{src}</div>
      </div>
    </div>
  );
}

window.PickerScreen = PickerScreen;
