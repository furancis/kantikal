// canvas.jsx — final design canvas with the locked aesthetic.
// Faery Vellum (night) is the locked direction; Vellum (day) is the
// secondary mode. All locked interview picks (invisible borders,
// tight radii, liquid surfaces, Fraunces 450, deep indigo→faery cyan)
// are applied to every artboard via data-theme.

function FinalizationNote() {
  return (
    <div className="kk-final">
      <div className="eyebrow">The Kantikal · UI/UX finalization · v1 · LOCKED</div>
      <h2>A private songbook with the lyrics breathing through every surface.</h2>
      <p>
        <b>Aesthetic.</b> Faery Vellum (night) is the locked direction. Cyberpunk year 900 — ink-stained
        vellum, cream parchment ink, mint-cyan faery accent where blue used to be, candle-gold for spend.
        Vellum (day) is the warm-light counterpart; same locked picks, only the palette flips.
      </p>
      <p>
        <b>Material.</b> Every panel is glass. CSS <code>backdrop-filter</code> here, real
        <code>@liquid-dom/react</code> at production per <code>wire-map.md</code> — pattern 2 (one root
        GlassContainer, fabric as Background, Glass slabs at every panel) so the lyrics warp under each
        surface as the cursor moves. Spec'd command surfaces (Remix Picker columns, Generation Desk diff
        slab) already mount real Liquid DOM when WebGPU is available.
      </p>
      <p>
        <b>Depth.</b> The song itself runs as the artboard background — a canvas of the lyric's letters
        drifting in two octaves of flowing fbm noise, indices remapped continuously so characters morph
        instead of tick. The active lyric stays sharp on top.
      </p>
      <p>
        <b>Evidence.</b> Provenance lives in the data model (every score is <code>manual</code> /
        <code>text-derived</code> / <code>provider-derived</code> / <code>computed-audio</code>). The UI
        keeps it quiet by default; labels surface on hover, in the Sound DNA audit, when a gate is
        unverified, or globally via proof mode in the top bar. Nothing is ever labelled <code>computed-audio</code>
        without real audio analysis behind it.
      </p>
      <p>
        <b>Locked picks (from interview).</b> Palette · Faery Vellum &nbsp;/&nbsp; Accent · faery cyan
        (deep indigo for day) &nbsp;/&nbsp; Borders · invisible (0px) &nbsp;/&nbsp; Radii · tight (2/3/4/6)
        &nbsp;/&nbsp; Surface · liquid glass &nbsp;/&nbsp; Lyric · Fraunces 450 &nbsp;/&nbsp; Section markers · boxed caps.
      </p>
      <ul>
        <li><b>Type</b> — Fraunces (lyric only) · Cabinet Grotesk uppercase (UI display) · Source Sans 3 (body) · IBM Plex Mono (data)</li>
        <li><b>Color rules honoured</b> — no AI-purple, no blue-purple gradients, no pure black, no Inter, no card wall, no node-board theater</li>
        <li><b>Music video</b> — its own tab inside Release Pack, only when assets exist, lipsync gate is hard only for MV exports — never blocks audio</li>
        <li><b>Hand-off artifacts</b> for Codex sit alongside: <code>tokens.css</code>, <code>motion-spec.json</code>, <code>state-matrix.md</code>, <code>wire-map.md</code>, <code>asset-notes.md</code>, <code>design-manifest.json</code></li>
      </ul>
    </div>
  );
}

function App() {
  const { DesignCanvas, DCSection, DCArtboard } = window;
  return (
    <DesignCanvas>
      <DCSection id="finalization" title="Read me first" subtitle="UI/UX finalization — locked direction · Faery Vellum">
        <DCArtboard id="note" label="Finalization note" width={1100} height={600}>
          <FinalizationNote />
        </DCArtboard>
        <DCArtboard id="pivot" label="Lyric Console · locked direction" width={1480} height={940}>
          <ConsoleScreen theme="faery" />
        </DCArtboard>
      </DCSection>

      <DCSection id="locked" title="Faery Vellum · Night" subtitle="The locked direction · 8 screens · all interview picks applied">
        <DCArtboard id="f-console"   label="01 · Lyric Console"   width={1480} height={940}><ConsoleScreen   theme="faery" /></DCArtboard>
        <DCArtboard id="f-compare"   label="02 · Taste Compare"   width={1480} height={940}><CompareScreen   theme="faery" /></DCArtboard>
        <DCArtboard id="f-picker"    label="03 · Remix Picker"    width={1480} height={940}><PickerScreen    theme="faery" /></DCArtboard>
        <DCArtboard id="f-dna"       label="04 · Sound DNA"       width={1480} height={940}><DNAScreen       theme="faery" /></DCArtboard>
        <DCArtboard id="f-desk"      label="05 · Generation Desk" width={1480} height={940}><DeskScreen      theme="faery" /></DCArtboard>
        <DCArtboard id="f-tree"      label="06 · Track Genealogy" width={1480} height={940}><GenealogyScreen theme="faery" /></DCArtboard>
        <DCArtboard id="f-lab"       label="07 · Song Lab"        width={1480} height={940}><SongLabScreen   theme="faery" /></DCArtboard>
        <DCArtboard id="f-release"   label="08 · Release Pack"    width={1480} height={940}><ReleaseScreen   theme="faery" /></DCArtboard>
      </DCSection>

      <DCSection id="day" title="Vellum · Day" subtitle="Same picks, warm-light palette · for daytime / printed reference">
        <DCArtboard id="d-console" label="01 · Lyric Console · Day"   width={1480} height={940}><ConsoleScreen theme="vellum" /></DCArtboard>
        <DCArtboard id="d-picker"  label="03 · Remix Picker · Day"    width={1480} height={940}><PickerScreen  theme="vellum" /></DCArtboard>
        <DCArtboard id="d-desk"    label="05 · Generation Desk · Day" width={1480} height={940}><DeskScreen    theme="vellum" /></DCArtboard>
      </DCSection>

      <DCSection id="motion" title="Motion studies" subtitle="Every transition the design implies — functional only, no decorative motion">
        <DCArtboard id="motion-faery" label="Motion · all transitions"  width={1480} height={940}><MotionScreen theme="faery" /></DCArtboard>
      </DCSection>

      <DCSection id="responsive" title="Responsive studies" subtitle="Desktop · tablet · phone — phone is review-only">
        <DCArtboard id="resp" label="Three densities"  width={1480} height={940}><ResponsiveScreen theme="faery" /></DCArtboard>
      </DCSection>

      <DCSection id="liquid" title="Liquid DOM · live proof" subtitle="Real WebGPU glass when navigator.gpu is present · CSS fallback otherwise">
        <DCArtboard id="liquid-proof" label="Liquid DOM scene" width={1200} height={620}>
          <div className="kk" data-theme="faery" style={{ width: 1200, height: 620, padding: 24 }}>
            <LiquidProof width={1100} height={520} />
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById("mount"));
root.render(<App />);
