// screens/Console.jsx — Lyric Console (default screen).
// Layout: TopBar + LeftRail + Lyric center + Inspector + Workbench.

function ConsoleScreen({ theme = "crypt", proof = false }) {
  return (
    <div className="kk" data-theme={theme} data-proof={proof ? "1" : "0"} style={{ position: "relative" }}>
      <LyricFabric />
      <TopBar screen="console" proof={proof} />
      <div className="kk-body">
        <LeftRail />
        <main className="kk-center" style={{ position: "relative" }}>
          <div className="kk-doc-h" style={{ position: "relative", zIndex: 1 }}>
            <div className="kk-doc-title">
              <h1>Almost Love</h1>
              <span className="vtag">v3.4 · draft</span>
              <span className="by">by sealf'salve · 92 bpm · A minor</span>
            </div>
            <div className="kk-doc-tools">
              <span className="kk-doc-tool is-on">lyric</span>
              <span className="kk-doc-tool">intent</span>
              <span className="kk-doc-tool">taste</span>
              <span className="kk-doc-tool">lineage</span>
              <span className="kk-btn ghost" style={{ marginLeft: 6 }}>{Icon.spark()} suggest</span>
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1, position: "relative", zIndex: 1 }}>
            <LyricDocument doc={ALMOST_LOVE} range={[1, 32]} />
          </div>
        </main>
        <RightInspector />
        <Workbench />
      </div>
    </div>
  );
}

window.ConsoleScreen = ConsoleScreen;
