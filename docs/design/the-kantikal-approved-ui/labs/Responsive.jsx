// labs/Responsive.jsx — Responsive Studies.
//
// The Kantikal is a desktop studio. Tablet folds the rail to icons + makes
// the inspector an overlay drawer. Phone is read-only review: lyric scroll
// + take cards with like/keep/breed; no Generation Desk, no Genealogy.
//
// Shown side-by-side at scale so the user can confirm the system holds.

function ResponsiveScreen({ theme = "crypt" }) {
  return (
    <div className="kk" data-theme={theme} style={{ width: 1480, height: 940, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid var(--kk-rule-soft)", background: "var(--kk-surface)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>Responsive Studies</h1>
          <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
            desktop · tablet · phone — same lyric, three densities. Mobile is read-only review.
          </span>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.4fr",
        gap: 24, padding: 24, height: "calc(100% - 80px)",
      }}>
        <DeviceFrame label="desktop · 1440+" sub="full shell · all 4 quadrants visible" w={780} h={520}>
          <DesktopMini />
        </DeviceFrame>

        <DeviceFrame label="tablet · 820w" sub="rail folds to icons · inspector overlays on demand" w={420} h={620}>
          <TabletMini />
        </DeviceFrame>

        <DeviceFrame label="phone · 390w" sub="review-only · lyric scroll + chips · no desk/tree" w={220} h={460}>
          <PhoneMini />
        </DeviceFrame>
      </div>
    </div>
  );
}

function DeviceFrame({ label, sub, w, h, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--kk-muted)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--kk-muted)" }}>{sub}</div>
      </div>
      <div style={{
        width: "100%", flex: 1,
        background: "var(--kk-base)", border: "1px solid var(--kk-rule)",
        borderRadius: "var(--kk-r-3)", overflow: "hidden",
        display: "grid", placeItems: "center",
      }}>
        <div style={{ width: w, height: h, position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", borderRadius: 12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DesktopMini() {
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateRows: "26px 1fr", background: "var(--kk-base)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", borderBottom: "1px solid var(--kk-rule)", background: "var(--kk-surface)", gap: 6, fontFamily: "var(--kk-f-display)", fontSize: 9 }}>
        <span style={{ fontWeight: 700, color: "var(--kk-ink)" }}>Kantikal</span>
        <span style={{ color: "var(--kk-blue)" }}>· Lyric Console</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 8, color: "var(--kk-muted)" }}>B / chorus-trim</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 160px", gridTemplateRows: "1fr 110px", overflow: "hidden" }}>
        <div style={{ gridRow: "1 / 3", padding: 8, borderRight: "1px solid var(--kk-rule)", background: "var(--kk-surface)", fontSize: 9 }}>
          <div style={{ padding: 6, border: "1px solid var(--kk-rule)", borderRadius: 4, marginBottom: 6, color: "var(--kk-ink)", fontFamily: "var(--kk-f-display)", fontWeight: 600 }}>Almost Love</div>
          <Tiny label="REFERENCES" rows={["field guitar", "ammar draft", "muqaam oud"]} />
          <Tiny label="VOICES" rows={["controlled fem", "cracked tenor"]} />
          <Tiny label="SOUND DNA" rows={["intimate vocal", "half-time", "low-end"]} />
        </div>
        <div style={{ padding: 8, borderRight: "1px solid var(--kk-rule)", overflow: "hidden" }}>
          <div style={{ fontFamily: "var(--kk-f-lyric)", color: "var(--kk-ink)", fontSize: 11, lineHeight: 1.4 }}>
            <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 7, letterSpacing: "0.18em", color: "var(--kk-muted)" }}>CHORUS</div>
            <div>Not enough, not nothing</div>
            <div>Not enough, not nothing</div>
            <div>We were something</div>
            <div style={{ background: "rgba(116,167,255,0.12)", borderLeft: "2px solid var(--kk-blue)", paddingLeft: 6, marginLeft: -6 }}>I called it almost love</div>
            <div>You called it timing</div>
          </div>
        </div>
        <div style={{ gridRow: "1 / 3", padding: 8, background: "var(--kk-surface)", overflow: "hidden", fontSize: 9 }}>
          <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 7, letterSpacing: "0.18em", color: "var(--kk-muted)" }}>SELECTED</div>
          <div style={{ fontFamily: "var(--kk-f-lyric)", color: "var(--kk-ink)", fontSize: 11, marginTop: 2 }}>"almost love"</div>
          <Tiny label="FIT" rows={["lyric · 92", "sound · 71"]} />
          <Tiny label="KEEP" rows={["vocal", "tempo"]} chip />
        </div>
        <div style={{ padding: 8, background: "color-mix(in oklab, var(--kk-base) 92%, #000)", display: "flex", gap: 6 }}>
          {[1,2,3].map((i) => (
            <div key={i} style={{ flex: 1, padding: 6, background: "var(--kk-raised)", border: "1px solid var(--kk-rule)", borderRadius: 4, fontSize: 8 }}>
              <div style={{ color: "var(--kk-ink)", fontWeight: 600 }}>T-0{i+2}</div>
              <div style={{ height: 3, background: "var(--kk-rule)", marginTop: 4 }}><div style={{ width: `${70+i*5}%`, height: "100%", background: "var(--kk-green)" }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabletMini() {
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateRows: "28px 1fr", background: "var(--kk-base)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px", borderBottom: "1px solid var(--kk-rule)", background: "var(--kk-surface)", gap: 8, fontFamily: "var(--kk-f-display)", fontSize: 10 }}>
        <span style={{ fontWeight: 700, color: "var(--kk-ink)" }}>Kantikal</span>
        <span style={{ color: "var(--kk-blue)" }}>· Lyric</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 14, height: 14, border: "1px solid var(--kk-muted)", borderRadius: 3 }} />
        <span style={{ width: 14, height: 14, border: "1px solid var(--kk-muted)", borderRadius: 3 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", overflow: "hidden" }}>
        {/* folded rail */}
        <div style={{ borderRight: "1px solid var(--kk-rule)", background: "var(--kk-surface)", padding: 6, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {["doc", "layers", "dna", "tree"].map((k) => (
            <div key={k} style={{ width: 24, height: 24, border: "1px solid var(--kk-rule)", borderRadius: 4, display: "grid", placeItems: "center", color: k === "doc" ? "var(--kk-blue)" : "var(--kk-muted)" }}>
              {Icon[k]()}
            </div>
          ))}
        </div>
        <div style={{ padding: 12, overflow: "auto" }}>
          <div style={{ fontFamily: "var(--kk-f-display)", fontWeight: 700, color: "var(--kk-ink)", fontSize: 16 }}>Almost Love</div>
          <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 8.5, color: "var(--kk-muted)" }}>v3.4 · 92 bpm · A min</div>

          <div style={{ marginTop: 12, fontFamily: "var(--kk-f-lyric)", fontSize: 13, color: "var(--kk-ink)", lineHeight: 1.5 }}>
            <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 8, letterSpacing: "0.18em", color: "var(--kk-muted)" }}>CHORUS</div>
            <div>Not enough, not nothing</div>
            <div>We were something</div>
            <div style={{ background: "rgba(116,167,255,0.12)", borderLeft: "2px solid var(--kk-blue)", paddingLeft: 8, marginLeft: -8 }}>
              I called it almost love
            </div>
            <div>You called it timing</div>
            <div>You kept me in the private lane</div>
          </div>

          <div style={{ marginTop: 12, padding: 10, background: "var(--kk-surface)", border: "1px solid var(--kk-rule)", borderRadius: 6 }}>
            <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 8, letterSpacing: "0.18em", color: "var(--kk-muted)" }}>SELECTED · LINE 21</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span className="kk-chip is-keep" style={{ fontSize: 9.5, padding: "3px 7px" }}>keep vocal</span>
              <span className="kk-chip is-keep" style={{ fontSize: 9.5, padding: "3px 7px" }}>keep tempo</span>
              <span className="kk-chip is-avoid" style={{ fontSize: 9.5, padding: "3px 7px" }}>avoid stack</span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ padding: 8, background: "var(--kk-raised)", border: "1px solid var(--kk-rule)", borderRadius: 6, fontSize: 9 }}>
                <div style={{ color: "var(--kk-ink)", fontWeight: 600 }}>T-0{i+2} · restraint</div>
                <div style={{ height: 24, background: "color-mix(in oklab, var(--kk-base) 90%, #000)", marginTop: 6, borderRadius: 3, overflow: "hidden" }}>
                  <WaveSVG seed={i+2} accent={i===1} />
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  <span style={{ width: 16, height: 16, border: "1px solid var(--kk-rule)", borderRadius: 3, display: "grid", placeItems: "center", color: "var(--kk-muted)" }}>{Icon.like()}</span>
                  <span style={{ width: 16, height: 16, border: "1px solid var(--kk-rule)", borderRadius: 3, display: "grid", placeItems: "center", color: "var(--kk-muted)" }}>{Icon.keep()}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 8, color: "var(--kk-green)" }}>fit · 88</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMini() {
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateRows: "26px 1fr 40px", background: "var(--kk-base)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 8px", borderBottom: "1px solid var(--kk-rule)", background: "var(--kk-surface)", fontFamily: "var(--kk-f-display)", fontSize: 9, gap: 4 }}>
        <span style={{ width: 12, color: "var(--kk-muted)" }}>‹</span>
        <span style={{ flex: 1, color: "var(--kk-ink)", fontWeight: 600, textAlign: "center" }}>Almost Love</span>
        <span style={{ width: 12, color: "var(--kk-muted)" }}>⋯</span>
      </div>
      <div style={{ padding: "10px 12px", overflow: "auto" }}>
        <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 7, letterSpacing: "0.2em", color: "var(--kk-muted)" }}>CHORUS</div>
        <div style={{ fontFamily: "var(--kk-f-lyric)", fontSize: 12, color: "var(--kk-ink)", lineHeight: 1.5, marginTop: 4 }}>
          <div>Not enough, not nothing</div>
          <div>We were something</div>
          <div style={{ background: "rgba(116,167,255,0.14)", borderLeft: "2px solid var(--kk-blue)", paddingLeft: 6, marginLeft: -6 }}>
            I called it almost love
          </div>
          <div>You called it timing</div>
        </div>
        <div style={{ marginTop: 10, padding: 8, background: "var(--kk-surface)", border: "1px solid var(--kk-rule)", borderRadius: 5 }}>
          <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 7, color: "var(--kk-muted)" }}>T-03 · restraint</div>
          <div style={{ height: 18, background: "color-mix(in oklab, var(--kk-base) 90%, #000)", marginTop: 4, borderRadius: 2, overflow: "hidden" }}>
            <WaveSVG seed={3} accent />
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            <span style={{ width: 18, height: 18, border: "1px solid var(--kk-green)", borderRadius: 3, color: "var(--kk-green)", background: "var(--kk-green-wash)", display: "grid", placeItems: "center" }}>{Icon.like()}</span>
            <span style={{ width: 18, height: 18, border: "1px solid var(--kk-rule)", borderRadius: 3, color: "var(--kk-muted)", display: "grid", placeItems: "center" }}>{Icon.keep()}</span>
            <span style={{ flex: 1 }} />
            <span style={{ width: 18, height: 18, border: "1px solid var(--kk-rule)", borderRadius: 3, color: "var(--kk-muted)", display: "grid", placeItems: "center" }}>{Icon.combine()}</span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--kk-rule)", background: "var(--kk-surface)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", placeItems: "center", color: "var(--kk-muted)" }}>
        {["doc", "layers", "dna", "release"].map((k, i) => (
          <span key={k} style={{ color: i === 0 ? "var(--kk-blue)" : "var(--kk-muted)" }}>{Icon[k] ? Icon[k]() : null}</span>
        ))}
      </div>
    </div>
  );
}

function Tiny({ label, rows, chip }) {
  return (
    <>
      <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 7, letterSpacing: "0.18em", color: "var(--kk-muted)", marginTop: 8, marginBottom: 4 }}>{label}</div>
      {rows.map((r, i) => (
        chip
          ? <span key={i} className="kk-chip is-keep" style={{ fontSize: 8, padding: "1px 5px", marginRight: 3, marginBottom: 3, display: "inline-flex" }}>{r}</span>
          : <div key={i} style={{ fontSize: 8.5, color: "var(--kk-ink-dim)", padding: "1px 0" }}>{r}</div>
      ))}
    </>
  );
}

window.ResponsiveScreen = ResponsiveScreen;
