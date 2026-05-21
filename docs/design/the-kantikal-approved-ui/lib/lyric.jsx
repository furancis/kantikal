// lib/lyric.jsx — The lyric document: data + LyricDocument component.
//
// Source: user-supplied lyrics. The lyric IS the master object; the rest
// of the app aligns to its sections, lines, and intent tags.

// Each line: { n: line number, text, section, role, intent, lang, taste }
// Sections appear inline as { kind: "section", section, meta }.
// `taste` is the persistent marker color (like / keep / mutate / dislike / avoid).
// `active` is set on the currently-selected line for the screenshot.

const ALMOST_LOVE = {
  title: "Almost Love",
  v: "v3.4 · draft",
  by: "sealf'salve",
  meta: "92 BPM · A minor · 3:24",
  doc: [
    { kind: "section", section: "intro",   meta: "0:00 · 0:18" },
    { n:  1, text: "It was November, I think",                                  role: "setup",  intent: "memory ground · soft" },
    { n:  2, text: "You smelled like lime soap, lemon going warm",              role: "image",  intent: "sensory anchor",       taste: "like" },
    { n:  3, text: "We were close enough to lose the outline of the room",      role: "image",  intent: "intimacy · spatial" },
    { n:  4, text: "Close enough to make it ours",                              role: "turn",   intent: "claim · ownership" },

    { kind: "section", section: "verse 1", meta: "0:18 · 0:48" },
    { n:  5, text: "You said I looked well",                                    role: "setup",  intent: "false comfort" },
    { n:  6, text: "And everything shifted",                                    role: "turn",   intent: "tension pivot" },
    { n:  7, text: "They never get it",                                         role: "setup" },
    { n:  8, text: "But you know I still live in it",                           role: "payoff", intent: "addressed second person", taste: "keep" },
    { n:  9, text: "Parking lot texts",                                         role: "image",  intent: "compressed image" },
    { n: 10, text: "Three month gaps",                                          role: "image" },
    { n: 11, text: "Same pattern",                                              role: "image" },
    { n: 12, text: "Same map",                                                  role: "image" },

    { kind: "section", section: "pre-chorus", meta: "0:48 · 1:06" },
    { n: 13, text: "Just enough to keep it burning",                            role: "setup",   intent: "title premise" },
    { n: 14, text: "Never enough to let it stay",                               role: "setup" },
    { n: 15, text: "Every time I almost had you",                               role: "turn",    intent: "central rhyme · payoff lift" },
    { n: 16, text: "You dissolved into your day",                               role: "payoff",  intent: "release into chorus", taste: "like" },

    { kind: "section", section: "chorus", meta: "1:06 · 1:38", hook: true },
    { n: 17, text: "Not enough, not nothing",                                   role: "hook",    intent: "title hook · pressure",        taste: "keep" },
    { n: 18, text: "Not enough, not nothing",                                   role: "hook" },
    { n: 19, text: "We were something",                                         role: "hook",    intent: "resolution" },
    { n: 20, text: "We were something",                                         role: "hook" },
    { n: 21, text: "I called it almost love",                                   role: "payoff",  intent: "lyric thesis", taste: "keep", active: true },
    { n: 22, text: "You called it timing",                                      role: "turn",    intent: "counter framing" },
    { n: 23, text: "You kept me in the private lane",                           role: "image",   intent: "private/public split" },
    { n: 24, text: "I made a myth from it",                                     role: "payoff",  intent: "self-aware close" },

    { kind: "section", section: "verse 2", meta: "1:38 · 2:08" },
    { n: 25, text: "You came out to me first",                                  role: "setup",   intent: "biography · trust" },
    { n: 26, text: "I still hold that",                                         role: "payoff" },
    { n: 27, text: "Private was cheaper than public",                           role: "turn",    intent: "social cost",        taste: "mutate" },
    { n: 28, text: "I still know that",                                         role: "payoff" },
    { n: 29, text: "You wanted me",                                             role: "setup" },
    { n: 30, text: "But never enough to change it",                             role: "turn" },
    { n: 31, text: "Felt enough",                                               role: "image" },
    { n: 32, text: "Still managed",                                             role: "image" },

    { kind: "section", section: "bridge", meta: "2:36 · 2:54", bridge: true },
    { n: 33, text: "You said sorry",                                            role: "image" },
    { n: 34, text: "I said nothing",                                            role: "image",  taste: "dislike" },
    { n: 35, text: "Truth broke",                                               role: "turn" },
    { n: 36, text: "For a second",                                              role: "image" },
    { n: 37, text: "I was smaller",                                             role: "image" },
    { n: 38, text: "You were laughing",                                         role: "image" },
    { n: 39, text: "AC low",                                                    role: "image",  intent: "sensory drop · humid" },
    { n: 40, text: "We were sweating",                                          role: "image" },

    { kind: "section", section: "outro", meta: "3:10 · 3:24" },
    { n: 41, text: "The room changed",                                          role: "turn" },
    { n: 42, text: "I stay",                                                    role: "payoff" },
    { n: 43, text: "Al-hamdu lillah",                                           role: "payoff", intent: "language pivot · gratitude", lang: "AR", taste: "keep" },
    { n: 44, text: "I stay",                                                    role: "payoff" },
  ],
};

// Render the lyric document.
// `range` controls which lines/sections to show (start..end inclusive by line number).
// `dense` shrinks line height for the responsive lab.
function LyricDocument({ doc = ALMOST_LOVE, range = null, dense = false }) {
  const visible = range
    ? doc.doc.filter((row) =>
        row.kind === "section"
          ? true // we'll prune sections later based on adjacent lines
          : row.n >= range[0] && row.n <= range[1]
      )
    : doc.doc;

  // when range filters, drop section markers that have no following visible line
  const pruned = [];
  for (let i = 0; i < visible.length; i++) {
    const row = visible[i];
    if (row.kind === "section") {
      // find next non-section row
      const next = visible.slice(i + 1).find((r) => r.kind !== "section");
      if (!next) continue;
      pruned.push(row);
    } else pruned.push(row);
  }

  return (
    <div className="kk-doc" style={dense ? { padding: "12px 18px" } : null}>
      {pruned.map((row, i) => {
        if (row.kind === "section") {
          const cls =
            "label" +
            (row.hook ? " is-hook" : "") +
            (row.bridge ? " is-bridge" : "");
          return (
            <div className="kk-section-mark" key={"s" + i}>
              <span className={cls}>{row.section}</span>
              <span className="rule" />
              <span className="meta">{row.meta}</span>
            </div>
          );
        }
        const cls =
          "kk-line" +
          (row.active ? " is-active" : "") +
          (row.taste === "keep"   ? " is-keep"   : "") +
          (row.taste === "mutate" ? " is-mutate" : "") +
          (row.taste === "avoid"  ? " is-avoid"  : "");
        return (
          <div className={cls} key={row.n}>
            <div className="kk-lineno">{String(row.n).padStart(2, "0")}</div>
            <div className="kk-linebody">
              {row.taste ? <div className={"kk-marker " + row.taste} /> : null}
              <div className="text">{row.text}</div>
              <div className="gutter-tags">
                {row.role ? <span className={"kk-tag role-" + row.role}>{row.role}</span> : null}
                {row.lang ? <span className="kk-tag lang">{row.lang}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.ALMOST_LOVE = ALMOST_LOVE;
window.LyricDocument = LyricDocument;
