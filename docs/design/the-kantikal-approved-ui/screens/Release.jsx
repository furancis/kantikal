// screens/Release.jsx — Release Pack.
//
// Final QA + export. Tabs: Audio · Lyrics · Metadata · Cover · MV (only
// shown when MV assets exist) · Receipts. Gates are explicit and must
// all pass before export. MV/lipsync is subordinate — its own tab and
// gate, but does NOT block audio release. It only blocks an MV variant.

function ReleaseScreen({ theme = "crypt", proof = false, tab = "audio", hasMV = true }) {
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"}>
      <TopBar screen="release" proof={proof} />
      <div className="kk-body is-full" style={{ gridTemplateColumns: "240px 1fr 380px" }}>
        <LeftRail />
        <main className="kk-center" style={{ overflow: "auto" }}>
          <ReleaseHeader />
          <ReleaseTabs current={tab} hasMV={hasMV} />
          <ReleaseAudio />
        </main>
        <ReleaseInspector hasMV={hasMV} />
      </div>
    </div>
  );
}

function ReleaseHeader() {
  return (
    <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid var(--kk-rule-soft)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>
          Release Pack
        </h1>
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
          <b style={{ color: "var(--kk-blue)" }}>Almost Love · B9 final</b> · ready for review
        </span>
        <span style={{ flex: 1 }} />
        <span className="kk-receipt"><span className="ok">●</span> 03 gates pass · <span className="sp">●</span> 01 awaiting</span>
      </div>
    </div>
  );
}

function ReleaseTabs({ current, hasMV }) {
  const tabs = [
    { id: "audio",    label: "Audio" },
    { id: "lyrics",   label: "Lyrics" },
    { id: "metadata", label: "Metadata" },
    { id: "cover",    label: "Cover" },
    ...(hasMV ? [{ id: "mv", label: "Music Video", subordinate: true }] : []),
    { id: "receipts", label: "Receipts" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 28px 0", borderBottom: "1px solid var(--kk-rule)" }}>
      {tabs.map((t) => (
        <div key={t.id} style={{
          padding: "8px 12px",
          fontFamily: "var(--kk-f-display)", fontSize: 12, fontWeight: 500,
          color: t.id === current ? "var(--kk-ink)" : "var(--kk-muted)",
          borderBottom: "2px solid " + (t.id === current ? "var(--kk-blue)" : "transparent"),
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          opacity: t.subordinate ? 0.85 : 1,
        }}>
          {t.label}
          {t.subordinate && (
            <span style={{
              fontFamily: "var(--kk-f-mono)", fontSize: 9, color: "var(--kk-muted-2)",
              border: "1px solid var(--kk-rule)", padding: "0 4px", borderRadius: 3,
              letterSpacing: "0.06em",
            }}>subordinate</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ReleaseAudio() {
  return (
    <div style={{ padding: "18px 28px 28px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
      <section>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 14 }}>master</span>
          <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>
            T-03 · final · 3:24 · 24-bit wav · 192 kbps mp3 · master receipt G-final-04
          </span>
        </div>
        <div style={{ background: "var(--kk-surface)", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-3)", padding: 14 }}>
          <div style={{ height: 88, background: "color-mix(in oklab, var(--kk-base) 92%, #000)", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-2)", position: "relative", overflow: "hidden" }}>
            <WaveSVG seed={3} accent />
            <div style={{ position: "absolute", left: "32%", top: 0, bottom: 0, width: 2, background: "var(--kk-amber)" }} />
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginTop: 6, height: 14,
            fontFamily: "var(--kk-f-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            {["intro","v1","pre","chorus","v2","bridge","outro"].map((s, i) => (
              <div key={i} style={{
                background: i === 3 ? "var(--kk-blue-wash)" : "var(--kk-raised)",
                color: i === 3 ? "var(--kk-blue)" : "var(--kk-muted)",
                borderRadius: 2, display: "grid", placeItems: "center"
              }}>{s}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <button className="kk-btn primary">{Icon.play()} play master</button>
            <button className="kk-btn">{Icon.scissor()} stems · 04</button>
            <button className="kk-btn">{Icon.upload()} export · wav</button>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>
              loudness · −14 LUFS · peak −1 dBTP
            </span>
          </div>
        </div>

        <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 14 }}>release gates</span>
          <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>all must pass · MV gate is subordinate (does not block audio)</span>
        </div>
        <div style={{ background: "var(--kk-surface)", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-3)" }}>
          <Gate state="pass" name="lyric fit"
            why='thesis line "I called it almost love" lands · v3.4 locked'
            ev="manual"
          />
          <Gate state="pass" name="audio · mix"
            why="dry vocal · low end present · no club · −14 LUFS"
            ev="manual"
          />
          <Gate state="pass" name="taste authority"
            why="14 manual judgments · 04 keeps recorded on this branch"
            ev="manual"
          />
          <Gate state="warn" name="audio causality"
            why="no computed-audio analysis yet — claim withheld (not blocking)"
            ev="unverified"
          />
          <Gate state="pass" name="provenance · receipts"
            why="generation chain G-110 → G-118 → final-04 · receipts intact"
            ev="provider"
          />
        </div>
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 14 }}>metadata · summary</span>
        </div>
        <div style={{ background: "var(--kk-surface)", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-3)", padding: 14 }}>
          <MetaRow k="title"     v="Almost Love" />
          <MetaRow k="artist"    v="sealf'salve" />
          <MetaRow k="duration"  v="3:24" />
          <MetaRow k="key · bpm" v="A min · 92" />
          <MetaRow k="language"  v="English · Arabic (single phrase)" />
          <MetaRow k="ISRC"      v={<span style={{ color: "var(--kk-muted)" }}>not yet assigned</span>} />
          <MetaRow k="written"   v="Issa · sealf'salve" />
          <MetaRow k="produced"  v="The Kantikal · Suno v4.5 · authored ops" />
          <MetaRow k="provenance" v="generation chain receipts attached" />
        </div>

        <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, color: "var(--kk-ink)", fontSize: 14 }}>cover</span>
        </div>
        <div style={{
          background: "var(--kk-raised)", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-3)",
          aspectRatio: "1 / 1", display: "grid", placeItems: "center",
          backgroundImage: "repeating-linear-gradient(45deg, color-mix(in oklab, var(--kk-base) 86%, var(--kk-amber)) 0 12px, transparent 12px 24px)",
        }}>
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontFamily: "var(--kk-f-lyric)", fontSize: 36, color: "var(--kk-ink)" }}>Almost Love</div>
            <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 6 }}>
              sealf'salve · The Kantikal
            </div>
            <div style={{ marginTop: 18, fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted-2)" }}>
              [cover art placeholder · drop image to replace]
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Gate({ state, name, why, ev }) {
  const cls = "kk-gate is-" + (state === "warn" ? "warn" : state === "fail" ? "fail" : "pass");
  return (
    <div className={cls}>
      <span className="stat">{state === "warn" ? Icon.warn() : Icon.check()}</span>
      <div>
        <div className="name">{name}</div>
        <div className="why">{why}</div>
      </div>
      <span className={"kk-ev-on-demand kk-evidence " + (state === "warn" ? "unverified" : "")} data-ev={ev}>
        {state === "warn" ? "unverified" : ev}
      </span>
    </div>
  );
}

function MetaRow({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, padding: "5px 0", borderBottom: "1px dashed var(--kk-rule-soft)", fontSize: 12.5 }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted-2)", letterSpacing: "0.06em" }}>{k}</span>
      <span style={{ color: "var(--kk-ink)" }}>{v}</span>
    </div>
  );
}

function ReleaseInspector({ hasMV }) {
  return (
    <aside className="kk-inspector" style={{ background: "var(--kk-surface)" }}>
      <div className="kk-insp-h">
        <div className="scope">export</div>
        <div className="target">audio first · MV optional</div>
      </div>

      <div className="kk-insp-block">
        <div className="kk-insp-h2">audio release</div>
        <div style={{ display: "grid", gap: 8, fontSize: 12.5 }}>
          <ExportRow label="wav · 24-bit master" size="42 MB" />
          <ExportRow label="mp3 · 192 kbps"      size="4.8 MB" />
          <ExportRow label="stems · 04"          size="156 MB" />
          <ExportRow label="lyrics · txt + srt"  size="2 KB" />
          <ExportRow label="receipts bundle · json" size="18 KB" />
        </div>
        <button className="kk-btn primary" style={{ width: "100%", marginTop: 12 }}>
          {Icon.upload()} export release pack
        </button>
      </div>

      {hasMV && (
        <div className="kk-insp-block">
          <div className="kk-insp-h2">music video <span className="meta">subordinate</span></div>
          <div style={{ fontSize: 12.5, color: "var(--kk-text)", lineHeight: 1.55, marginBottom: 10 }}>
            03 MV variants attached. Lipsync gate is a hard export blocker for MV files, but does not block audio.
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <MVRow id="MV-01" name="lyric cards · still"    state="pass" />
            <MVRow id="MV-02" name="performance · close-up" state="warn" />
            <MVRow id="MV-03" name="abstract · oud bridge"  state="pass" />
          </div>
          <button className="kk-btn" style={{ width: "100%", marginTop: 10 }}>
            review MV tab
          </button>
        </div>
      )}

      <div className="kk-insp-block">
        <div className="kk-insp-h2">distribution</div>
        <div style={{ fontSize: 12.5, color: "var(--kk-muted)", lineHeight: 1.55 }}>
          this surface does not push to distributors. it produces a sealed pack you upload manually with receipts attached.
        </div>
      </div>
    </aside>
  );
}

function ExportRow({ label, size }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 8, alignItems: "center" }}>
      <span style={{ color: "var(--kk-green)" }}>{Icon.check()}</span>
      <span style={{ color: "var(--kk-ink)" }}>{label}</span>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)" }}>{size}</span>
    </div>
  );
}

function MVRow({ id, name, state }) {
  const color = state === "warn" ? "var(--kk-amber)" : state === "fail" ? "var(--kk-red)" : "var(--kk-green)";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center", padding: "7px 9px", border: "1px solid var(--kk-rule)", borderRadius: "var(--kk-r-2)", background: "var(--kk-raised)" }}>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted-2)" }}>{id}</span>
      <span style={{ fontSize: 12, color: "var(--kk-ink)" }}>{name}</span>
      <span style={{ color, fontFamily: "var(--kk-f-mono)", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
        {state === "warn" ? Icon.warn() : Icon.check()} lipsync
      </span>
    </div>
  );
}

window.ReleaseScreen = ReleaseScreen;
