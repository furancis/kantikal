// screens/Desk.jsx — Generation Desk.
//
// Composes the next Suno brief from lyric intent + Sound DNA + taste signals
// + lineage rules. Shows EXACTLY what is preserved, mutated, avoided before
// any spend. The receipt log on the right records every action.

function DeskScreen({ theme = "crypt", proof = false }) {
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"}>
      <TopBar screen="desk" proof={proof} branch="B9 / chorus-trim+ar-bridge" />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 380px" }}>
        <LeftRail />
        <main className="kk-center" style={{ overflow: "auto" }}>
          <DeskHeader />
          <DeskBody />
        </main>
        <DeskReceipts />
      </div>
    </div>
  );
}

function DeskHeader() {
  return (
    <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid var(--kk-rule-soft)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>
          Generation Desk
        </h1>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
          next run · <b style={{ color: "var(--kk-blue)" }}>B9</b> · from Remix picks
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
          target provider · <b style={{ color: "var(--kk-ink-dim)" }}>suno v4.5</b> · browser auth
        </span>
      </div>
      <div style={{ marginTop: 8, fontFamily: "var(--kk-f-lyric)", color: "var(--kk-ink-dim)", fontSize: 15, lineHeight: 1.55, maxWidth: 820 }}>
        "Not enough, not nothing · We were something · I called it almost love · You called it timing"
      </div>
    </div>
  );
}

function DeskBody() {
  return (
    <div style={{ padding: "18px 28px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* preserve / mutate / avoid diff against parent */}
      <section>
        <SectHead title="brief diff" sub="against parent · B / chorus-trim" />
        <LiquidSurface real style={{ padding: "8px 18px" }}>
          <Diff verb="preserve" what="hook vocal delivery"             src='from T-03 chorus · "I called it almost love"' />
          <Diff verb="preserve" what="close, controlled female vocal"  src="from T-07 · texture" />
          <Diff verb="preserve" what="low-end present, no club"        src="from T-07 · mix pressure" />
          <Diff verb="preserve" what="half-time pulse"                  src="from Sound DNA · 03 takes" />
          <Diff verb="mutate"   what="chorus length — trim 2 bars"     src="parent rule · keep payoff" />
          <Diff verb="mutate"   what="bridge — restate in arabic"      src='lyric line 43 · "Al-hamdu lillah"' />
          <Diff verb="avoid"    what="bright vocal stack"               src="anti-signal from T-05" />
          <Diff verb="avoid"    what="generic inspirational lift"       src="Sound DNA · anti" />
          <Diff verb="add"      what="oud color in bridge tail"         src="reference · muqaam · oud loop" />
        </LiquidSurface>
      </section>

      {/* what becomes the prompt */}
      <section>
        <SectHead title="prompt assembly" sub="lyric · style · constraints" />
        <div style={{
          background: "var(--kk-raised)", border: "1px solid var(--kk-rule)",
          borderRadius: "var(--kk-r-3)", padding: 16,
          fontFamily: "var(--kk-f-mono)", fontSize: 11.5, lineHeight: 1.6,
          color: "var(--kk-text)"
        }}>
          <PromptLine k="lyric scope"     v="full song · v3.4 · 44 lines" />
          <PromptLine k="section trims"   v="chorus −2 bars · bridge restated AR" />
          <PromptLine k="voice"           v="close · controlled fem · v07" />
          <PromptLine k="instrument"      v="low piano · half-time · oud (bridge tail)" />
          <PromptLine k="mix"             v="dry vocal bus · low-end present · no club" />
          <PromptLine k="tempo / key"     v="92 bpm · A min · keep" />
          <PromptLine k="language"        v="english + ar pivot (bridge → outro)" />
          <PromptLine k="avoid"           v={<span style={{ color: "var(--kk-red)" }}>bright stack, inspirational lift, club low-end</span>} />
          <PromptLine k="lineage"         v="parent B / chorus-trim · preserve hook · mutate length, bridge" />
          <PromptLine k="seed strategy"   v="fresh seeds × 4 (no inheritance for diversity)" />
        </div>
        <div className="kk-receipt" style={{ marginTop: 10, lineHeight: 1.7 }}>
          full prompt text is composed at submit time · receipt will pin the exact bytes for audit
        </div>
      </section>

      <section style={{ gridColumn: "1 / 3" }}>
        <SectHead title="lyric alignment" sub="per section · how the run will be guided" />
        <div style={{
          display: "grid", gridTemplateColumns: "100px 1fr 1fr 1fr", gap: 0,
          border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-3)",
          overflow: "hidden", background: "var(--kk-surface)"
        }}>
          <AlignHead />
          <AlignRow section="intro" preserve="setup tone · soft" mutate="—" avoid="—" />
          <AlignRow section="v1"    preserve="role tags from lyric · keep parking lot image" mutate="—" avoid="bright vocal" />
          <AlignRow section="pre"   preserve='"you dissolved into your day" lands' mutate="—" avoid="—" />
          <AlignRow section="chorus" preserve='"I called it almost love" — held' mutate="length −2 bars" avoid="bright stack" highlight />
          <AlignRow section="v2"    preserve="lyric pacing" mutate="—" avoid="—" />
          <AlignRow section="bridge" preserve="image density" mutate="restate AR · al-hamdu lillah motif" avoid="—" highlight />
          <AlignRow section="outro" preserve="single-syllable resolution" mutate="—" avoid="bright synth pad" />
        </div>
      </section>
    </div>
  );
}

function SectHead({ title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
      <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 14, letterSpacing: "0.01em" }}>{title}</span>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)", letterSpacing: "0.06em" }}>{sub}</span>
    </div>
  );
}

function Diff({ verb, what, src }) {
  return (
    <div className="kk-diff">
      <span className={"verb " + verb}>{verb}</span>
      <div>
        <div className="what">{what}</div>
        <div className="src">{src}</div>
      </div>
      <span className="kk-ev-on-demand kk-evidence">manual</span>
    </div>
  );
}

function PromptLine({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, padding: "3px 0", borderBottom: "1px dashed var(--kk-rule-soft)" }}>
      <span style={{ color: "var(--kk-muted-2)", letterSpacing: "0.06em" }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}

function AlignHead() {
  return (
    <>
      <div style={{ padding: "10px 12px", fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--kk-muted)", borderRight: "1px solid var(--kk-rule-soft)", borderBottom: "1px solid var(--kk-rule-soft)", background: "color-mix(in oklab, var(--kk-surface) 80%, var(--kk-base))" }}>section</div>
      {["preserve", "mutate", "avoid"].map((v) => (
        <div key={v} style={{
          padding: "10px 12px", fontFamily: "var(--kk-f-mono)", fontSize: 10,
          letterSpacing: "0.18em", textTransform: "uppercase",
          color: v === "preserve" ? "var(--kk-green)" : v === "mutate" ? "var(--kk-amber)" : "var(--kk-red)",
          borderRight: "1px solid var(--kk-rule-soft)", borderBottom: "1px solid var(--kk-rule-soft)",
          background: "color-mix(in oklab, var(--kk-surface) 80%, var(--kk-base))"
        }}>{v}</div>
      ))}
    </>
  );
}

function AlignRow({ section, preserve, mutate, avoid, highlight }) {
  const bg = highlight ? "var(--kk-blue-wash)" : "transparent";
  const cell = { padding: "10px 12px", borderRight: "1px solid var(--kk-rule-soft)", borderBottom: "1px solid var(--kk-rule-soft)", fontSize: 12.5, color: "var(--kk-text)", background: bg };
  return (
    <>
      <div style={{ ...cell, fontFamily: "var(--kk-f-mono)", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 10, color: "var(--kk-ink-dim)" }}>{section}</div>
      <div style={cell}>{preserve}</div>
      <div style={cell}>{mutate}</div>
      <div style={cell}>{avoid}</div>
    </>
  );
}

function DeskReceipts() {
  return (
    <aside className="kk-inspector" style={{ background: "var(--kk-surface)" }}>
      <div className="kk-insp-h">
        <div className="scope">spend preview</div>
        <div className="target" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>4 takes</span>
          <span style={{ color: "var(--kk-amber)", fontFamily: "var(--kk-f-mono)", fontSize: 14 }}>~12 cr</span>
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">policy</div>
        <div style={{ display: "grid", gap: 8 }}>
          <PolicyRow ok label="lyrics signed off"           note="v3.4 draft locked" />
          <PolicyRow ok label="taste authority"             note="04 keeps, 01 anti — recorded" />
          <PolicyRow ok label="lineage parent set"          note="parent · B" />
          <PolicyRow warn label="audio causality"            note="no computed-audio proof; score withheld" />
          <PolicyRow ok label="provider · suno · browser"   note="auth ok · receipts on" />
          <PolicyRow ok label="no credit cap"               note="user policy · spend allowed" />
        </div>
      </div>

      <div className="kk-insp-block">
        <button className="kk-btn primary" style={{ width: "100%", padding: "10px 12px", fontSize: 13 }}>
          {Icon.spark()} run B9 · 4 takes · ~12 cr
        </button>
        <div className="kk-receipt" style={{ marginTop: 8 }}>
          receipt <b>G-0118</b> opens on click · status <span className="sp">pending</span> until provider acks
        </div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">recent receipts</div>
        <ReceiptLine id="G-0117" state="ok"  what="4 takes · B / chorus-trim" cost="12 cr" />
        <ReceiptLine id="G-0116" state="ok"  what="2 takes · A / ar-bridge"   cost="6 cr" />
        <ReceiptLine id="G-0115" state="err" what="1 take · A · auth blip"    cost="0 cr" />
        <ReceiptLine id="G-0114" state="ok"  what="4 takes · A"               cost="12 cr" />
        <div className="kk-receipt" style={{ marginTop: 8 }}>spent today · <b>30 cr</b> · cap · none</div>
      </div>
    </aside>
  );
}

function PolicyRow({ ok, warn, label, note }) {
  const color = warn ? "var(--kk-amber)" : ok ? "var(--kk-green)" : "var(--kk-red)";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 8, alignItems: "start" }}>
      <span style={{ color, paddingTop: 1 }}>{warn ? Icon.warn() : Icon.check()}</span>
      <div>
        <div style={{ fontSize: 12.5, color: "var(--kk-ink)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--kk-muted)" }}>{note}</div>
      </div>
    </div>
  );
}

function ReceiptLine({ id, state, what, cost }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px dashed var(--kk-rule-soft)" }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: state === "err" ? "var(--kk-red)" : state === "warn" ? "var(--kk-amber)" : "var(--kk-green)" }}>{id}</span>
      <span style={{ fontSize: 11.5, color: "var(--kk-text)" }}>{what}</span>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>{cost}</span>
    </div>
  );
}

window.DeskScreen = DeskScreen;
