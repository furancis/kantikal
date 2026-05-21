// lib/icons.jsx — inline SVG icon set used across the app.
// Tiny, monoline, geometric. Exported to window for cross-file use.
const kkIconBase = (path, props = {}) => (
  <svg className="kk-icn" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path}
  </svg>
);

const Icon = {
  // semantic actions
  like:    () => kkIconBase(<><path d="M3 7.5l3.5 3.5L13 4.5"/></>),
  dislike: () => kkIconBase(<><path d="M4 4l8 8M12 4l-8 8"/></>),
  keep:    () => kkIconBase(<><path d="M4 3h8v10l-4-2.5L4 13z"/></>),
  mutate:  () => kkIconBase(<><path d="M4 6h6M4 10h8M11 4l2 2-2 2M13 8l-2 2 2 2"/></>),
  avoid:   () => kkIconBase(<><circle cx="8" cy="8" r="5"/><path d="M5 11l6-6"/></>),
  combine: () => kkIconBase(<><circle cx="5.5" cy="8" r="3"/><circle cx="10.5" cy="8" r="3"/></>),
  breed:   () => kkIconBase(<><path d="M5 13c0-3 2-5 3-5s3 2 3 5"/><circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/></>),
  archive: () => kkIconBase(<><rect x="2.5" y="4" width="11" height="9" rx="1"/><path d="M2.5 6.5h11M6 9h4"/></>),

  // play / wave
  play:    () => kkIconBase(<><path d="M5 3l8 5-8 5z" fill="currentColor"/></>),
  pause:   () => kkIconBase(<><path d="M5 3v10M11 3v10"/></>),
  wave:    () => kkIconBase(<><path d="M2 8h2l1-3 1 6 1-4 1 2 1-1 1 3 1-5 1 4 1-1 1 0"/></>),

  // surfaces / nav
  doc:     () => kkIconBase(<><path d="M4 2h6l2 2v10H4z"/><path d="M10 2v2h2"/><path d="M6 7h4M6 9h4M6 11h3"/></>),
  layers:  () => kkIconBase(<><path d="M2 5l6-3 6 3-6 3z"/><path d="M2 8l6 3 6-3M2 11l6 3 6-3"/></>),
  dna:     () => kkIconBase(<><path d="M4 2c0 6 8 4 8 10M12 2c0 6-8 4-8 10"/><path d="M5 4h6M5 12h6M6 7h4M6 9h4"/></>),
  tree:    () => kkIconBase(<><circle cx="8" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/><circle cx="13" cy="13" r="1.5"/><path d="M8 4.5L4.8 6.7M8 4.5l3.2 2.2M4 9.3v2M12 9.3l-4.6 2.4M12 9.3l.7 2.4"/></>),
  desk:    () => kkIconBase(<><rect x="2" y="3" width="12" height="9" rx="1"/><path d="M2 6h12M5 9h6M5 11h3"/></>),
  lab:     () => kkIconBase(<><path d="M6 2v4l-3 7c0 .5.4 1 1 1h8c.6 0 1-.5 1-1l-3-7V2"/><path d="M6 2h4"/></>),
  release: () => kkIconBase(<><path d="M3 8l5-5 5 5-5 5z"/><circle cx="8" cy="8" r="1.5"/></>),

  // controls
  plus:    () => kkIconBase(<><path d="M8 3v10M3 8h10"/></>),
  chevron: () => kkIconBase(<><path d="M6 4l4 4-4 4"/></>),
  ellipsis:() => kkIconBase(<><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></>),
  spark:   () => kkIconBase(<><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M4 12l2-2M10 6l2-2"/></>),
  link:    () => kkIconBase(<><path d="M6 10l-2 2a2.8 2.8 0 11-4-4l2-2"/><path d="M10 6l2-2a2.8 2.8 0 114 4l-2 2"/><path d="M5 11l6-6"/></>),
  lock:    () => kkIconBase(<><rect x="3.5" y="7" width="9" height="6" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></>),
  warn:    () => kkIconBase(<><path d="M8 2l6 11H2z"/><path d="M8 6v3M8 11v.5"/></>),
  check:   () => kkIconBase(<><path d="M3 8l3 3 7-7"/></>),
  cross:   () => kkIconBase(<><path d="M4 4l8 8M12 4l-8 8"/></>),
  scissor: () => kkIconBase(<><circle cx="4" cy="5" r="1.6"/><circle cx="4" cy="11" r="1.6"/><path d="M5.5 5.5l8 5.5M5.5 10.5l8-5.5"/></>),
  upload:  () => kkIconBase(<><path d="M8 11V3M5 6l3-3 3 3"/><path d="M3 12v1h10v-1"/></>),
};

window.Icon = Icon;
