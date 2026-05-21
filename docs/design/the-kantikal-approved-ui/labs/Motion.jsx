// labs/Motion.jsx — Motion Studies artboard.
//
// Every transition the design implies, shown as a labelled looping cell.
// All motion is functional (per spec: "no playful bounces, no decorative
// motion"). Pure CSS keyframes so it's reliable across browsers.

const MotionKeyframes = () => (
  <style>{`
    /* line selection scan */
    @keyframes m-line-active {
      0%, 8% { background: transparent; box-shadow: none; }
      14%, 76% {
        background: linear-gradient(90deg, color-mix(in oklab, var(--kk-blue) 14%, transparent), transparent 75%);
        box-shadow: inset 2px 0 0 var(--kk-blue);
      }
      88%, 100% { background: transparent; box-shadow: none; }
    }

    /* take card filter from full list to scope-matched list */
    @keyframes m-take-fade-out { 0% { opacity: 1; transform: translateY(0) scale(1); } 70% { opacity: 0; transform: translateY(-4px) scale(0.96); } 100% { opacity: 0; transform: translateY(-4px) scale(0.96); } }
    @keyframes m-take-pop-in   { 0% { opacity: 0; transform: translateY(8px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }

    /* persistent taste marker — appears once, stays */
    @keyframes m-marker-in { 0%, 30% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.5); opacity: 1; } 65%, 100% { transform: scale(1); opacity: 1; } }

    /* generation — branch creation (NOT generic spinner). A short
       lineage draw + a glow pulse on the new node. Cycles every 4s. */
    @keyframes m-edge-draw {
      0%, 10% { stroke-dashoffset: 80; opacity: 0.4; }
      55% { stroke-dashoffset: 0; opacity: 1; }
      85% { stroke-dashoffset: 0; opacity: 1; }
      100% { stroke-dashoffset: 80; opacity: 0.4; }
    }
    @keyframes m-node-glow {
      0%, 50% { box-shadow: 0 0 0 0 rgba(116,167,255,0); transform: scale(0.85); opacity: 0.4; }
      62% { box-shadow: 0 0 0 6px rgba(116,167,255,0.25); transform: scale(1.08); opacity: 1; }
      82%, 100% { box-shadow: 0 0 0 2px rgba(116,167,255,0.15); transform: scale(1); opacity: 1; }
    }

    /* archive — branch drops to the dead-branch lane */
    @keyframes m-archive {
      0%, 12% { transform: translateY(0) scale(1); opacity: 1; filter: none; }
      45% { transform: translateY(46px) scale(0.92); opacity: 0.7; filter: saturate(0.4) brightness(0.7); }
      75%, 100% { transform: translateY(46px) scale(0.92); opacity: 0.45; filter: saturate(0.3) brightness(0.6); border-style: dashed !important; }
    }

    /* liquid surface — hover press, refraction breath */
    @keyframes m-liquid-hover {
      0%, 30% { transform: translateY(0); }
      55%     { transform: translateY(-2px); }
      80%, 100% { transform: translateY(0); }
    }
    @keyframes m-liquid-refract {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    /* inspector slide-in when selection changes */
    @keyframes m-insp-in {
      0%, 8% { transform: translateX(8px); opacity: 0; }
      30%, 100% { transform: translateX(0); opacity: 1; }
    }

    .m-loop-4 { animation-duration: 4.2s; animation-iteration-count: infinite; animation-timing-function: cubic-bezier(0.2,0.7,0.2,1); }
    .m-loop-3 { animation-duration: 3.2s; animation-iteration-count: infinite; animation-timing-function: cubic-bezier(0.2,0.7,0.2,1); }
    .m-loop-5 { animation-duration: 5.0s; animation-iteration-count: infinite; animation-timing-function: cubic-bezier(0.2,0.7,0.2,1); }
  `}</style>
);

function MotionScreen({ theme = "crypt" }) {
  return (
    <div className="kk" data-theme={theme} style={{ width: 1480, height: 940, padding: 0 }}>
      <MotionKeyframes />
      <div style={{ padding: "20px 28px 12px", borderBottom: "1px solid var(--kk-rule-soft)", background: "var(--kk-surface)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h1 style={{ fontFamily: "var(--kk-f-display)", fontSize: 20, fontWeight: 700, color: "var(--kk-ink)", margin: 0 }}>Motion Studies</h1>
          <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10.5, color: "var(--kk-muted)" }}>
            every transition the design implies · functional only · no decorative motion
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--kk-muted)", maxWidth: 880 }}>
          Each cell loops the same beat. Confirm the feel; production uses framer-motion sequences derived from motion-spec.json.
        </div>
      </div>

      <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, height: "calc(100% - 88px)", overflow: "auto" }}>

        <MCell title="01 · line selection" sub="lyric scope filter">
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "30px 1fr", columnGap: 14 }}>
            {[
              { n: 17, text: "Not enough, not nothing" },
              { n: 21, text: "I called it almost love", active: true },
              { n: 22, text: "You called it timing" },
            ].map((l) => (
              <React.Fragment key={l.n}>
                <div className="kk-lineno">{l.n}</div>
                <div className="kk-linebody"
                  style={l.active ? { animation: "m-line-active 4.2s infinite cubic-bezier(0.2,0.7,0.2,1)" } : null}>
                  <div className="text" style={{ fontSize: 16 }}>{l.text}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </MCell>

        <MCell title="02 · workbench filter" sub="takes re-scope to selection">
          <div style={{ display: "flex", gap: 6, padding: 14, overflow: "hidden" }}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{
                flex: 1, minWidth: 0, height: 86, borderRadius: "var(--kk-r-2)",
                background: "var(--kk-raised)", border: "1px solid var(--kk-rule)",
                animation: `m-take-pop-in 1.4s ${i * 0.12}s both, m-take-fade-out 4.2s ${1.5 + i*0.06}s infinite`,
                padding: 8,
              }}>
                <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9, color: "var(--kk-muted-2)" }}>T-0{i+2}</div>
                <div style={{ marginTop: 6, height: 4, background: "var(--kk-rule)", borderRadius: 2 }}>
                  <div style={{ width: `${60 + i*8}%`, height: "100%", background: "var(--kk-blue)" }} />
                </div>
              </div>
            ))}
          </div>
        </MCell>

        <MCell title="03 · taste marker persist" sub="ink dot stays after action">
          <div style={{ padding: "14px 18px" }}>
            {[
              { n: 17, text: "Not enough, not nothing", marker: "keep" },
              { n: 21, text: "I called it almost love", marker: "keep" },
              { n: 43, text: "Al-hamdu lillah",         marker: "like", animate: true },
            ].map((l) => (
              <div key={l.n} style={{ display: "grid", gridTemplateColumns: "30px 1fr", columnGap: 14, marginBottom: 4 }}>
                <div className="kk-lineno">{l.n}</div>
                <div className="kk-linebody" style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: -10, top: 12,
                    width: 5, height: 5, borderRadius: "50%",
                    background: l.marker === "like" ? "var(--kk-green)" : "var(--kk-blue)",
                    animation: l.animate ? "m-marker-in 4.2s infinite cubic-bezier(0.34,1.45,0.55,1)" : null,
                  }} />
                  <div className="text" style={{ fontSize: 15 }}>{l.text}</div>
                </div>
              </div>
            ))}
          </div>
        </MCell>

        <MCell title="04 · branch creation" sub="not a generic spinner">
          <svg viewBox="0 0 240 130" style={{ width: "100%", height: "100%" }}>
            <line x1={30} y1={40} x2={130} y2={40} stroke="var(--kk-muted-2)" strokeWidth={1.4} />
            <circle cx={30} cy={40} r={5} fill="var(--kk-muted-2)" />
            <circle cx={130} cy={40} r={5} fill="var(--kk-muted-2)" />
            <path d="M 130 40 C 165 40, 165 90, 200 90" stroke="var(--kk-blue)" strokeWidth={1.6}
              fill="none" strokeDasharray="80"
              style={{ animation: "m-edge-draw 4.2s infinite cubic-bezier(0.2,0.7,0.2,1)" }} />
            <circle cx={200} cy={90} r={6} fill="var(--kk-blue)"
              style={{ animation: "m-node-glow 4.2s infinite cubic-bezier(0.2,0.7,0.2,1)", transformOrigin: "200px 90px" }} />
            <text x={134} y={68} fontFamily="var(--kk-f-mono)" fontSize="9" fill="var(--kk-blue)" letterSpacing="0.06em">
              fork · trim chorus
            </text>
          </svg>
        </MCell>

        <MCell title="05 · archive → dead lane" sub="branch drops, dims, dashes">
          <div style={{ padding: "14px 18px", position: "relative" }}>
            <div style={{
              padding: "10px 12px", borderRadius: "var(--kk-r-2)",
              background: "var(--kk-raised)", border: "1px solid var(--kk-rule)",
              animation: "m-archive 4.2s infinite cubic-bezier(0.2,0.7,0.2,1)",
              width: 200,
            }}>
              <div style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, fontSize: 12, color: "var(--kk-ink)" }}>
                T-09 · genre slip
              </div>
              <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, color: "var(--kk-muted)" }}>
                drift · edm pulse
              </div>
            </div>
            <div style={{
              position: "absolute", bottom: 8, left: 18, right: 18,
              borderTop: "1px dashed var(--kk-red)",
              padding: "4px 0", fontFamily: "var(--kk-f-mono)", fontSize: 9, color: "var(--kk-red)",
              letterSpacing: "0.18em", textTransform: "uppercase"
            }}>archive lane</div>
          </div>
        </MCell>

        <MCell title="06 · liquid surface · hover" sub="WebGPU when available">
          <div style={{ padding: 16, display: "grid", placeItems: "center" }}>
            <LiquidSurface real className="" style={{
              width: 200, height: 80, padding: 14,
              animation: "m-liquid-hover 4.2s infinite cubic-bezier(0.2,0.7,0.2,1)"
            }}>
              <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 10, color: "var(--kk-muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>taste signal</div>
              <div style={{ fontFamily: "var(--kk-f-display)", fontWeight: 600, fontSize: 13, color: "var(--kk-ink)", marginTop: 4 }}>keep · intimate vocal</div>
            </LiquidSurface>
          </div>
        </MCell>

        <MCell title="07 · inspector reveal" sub="selection change slides content">
          <div style={{ padding: 14 }}>
            <div style={{
              background: "var(--kk-surface)", border: "1px solid var(--kk-rule)",
              borderRadius: "var(--kk-r-2)", padding: "10px 12px",
              animation: "m-insp-in 4.2s infinite cubic-bezier(0.2,0.7,0.2,1)",
            }}>
              <div style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--kk-muted-2)" }}>selected · line 21</div>
              <div style={{ fontFamily: "var(--kk-f-lyric)", fontSize: 16, color: "var(--kk-ink)", marginTop: 4 }}>"I called it almost love"</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="kk-chip is-keep" style={{ fontSize: 10.5 }}>keep vocal</span>
                <span className="kk-chip is-keep" style={{ fontSize: 10.5 }}>keep tempo</span>
                <span className="kk-chip is-avoid" style={{ fontSize: 10.5 }}>avoid stack</span>
              </div>
            </div>
          </div>
        </MCell>

        <MCell title="08 · chip apply" sub="ink stamp, not a confetti burst">
          <div style={{ padding: 14, display: "grid", placeItems: "center", height: "100%" }}>
            <span className="kk-chip is-like" style={{
              fontSize: 13, padding: "7px 14px",
              animation: "m-marker-in 4.2s infinite cubic-bezier(0.34,1.45,0.55,1)",
              transformOrigin: "left center"
            }}>
              <span className="icon">{Icon.like()}</span> like · vocal delivery
            </span>
          </div>
        </MCell>

        <MCell title="09 · generation receipt" sub="status moves pending → ok">
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <ReceiptStep label="brief composed"  state="ok"   delay="0s" />
            <ReceiptStep label="provider ack'd"  state="ok"   delay="0.5s" />
            <ReceiptStep label="4 takes received" state="ok"  delay="1.0s" />
            <ReceiptStep label="taste signals indexed" state="ok" delay="1.5s" />
            <ReceiptStep label="G-0118 closed" state="ok" delay="2.0s" />
          </div>
        </MCell>
      </div>
    </div>
  );
}

function MCell({ title, sub, children }) {
  return (
    <div className="kk-mcell">
      <div className="m-h">{title}</div>
      <div className="m-sub">{sub}</div>
      <div className="m-stage">{children}</div>
    </div>
  );
}

function ReceiptStep({ label, state, delay }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center",
      padding: "5px 8px", border: "1px solid var(--kk-rule-soft)", borderRadius: "var(--kk-r-2)",
      animation: `m-insp-in 4.2s ${delay} infinite cubic-bezier(0.2,0.7,0.2,1)`,
      opacity: 0.9,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--kk-green)" }} />
      <span style={{ fontSize: 12, color: "var(--kk-ink)" }}>{label}</span>
      <span style={{ fontFamily: "var(--kk-f-mono)", fontSize: 9.5, color: "var(--kk-green)" }}>ok</span>
    </div>
  );
}

window.MotionScreen = MotionScreen;
