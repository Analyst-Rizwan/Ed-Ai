/* ═══════════════════════════════════════════════
   DSA Visualizer — Design Tokens & Global CSS
═══════════════════════════════════════════════ */
export const T = {
  bg:"#141414", surface:"#1e1e1e", surface2:"#252525", surface3:"#2c2c2c",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.14)",
  text:"#e8e8e8", muted:"#666", muted2:"#888",
  accent:"#7c5cfc", accentSoft:"rgba(124,92,252,0.13)",
  yellow:"#f5c842", yellowSoft:"rgba(245,200,66,0.13)",
  green:"#4acf82", greenSoft:"rgba(74,207,130,0.13)",
  red:"#e85d4a", redSoft:"rgba(232,93,74,0.13)",
  orange:"#f4924a", orangeSoft:"rgba(244,146,74,0.13)",
  teal:"#3ec6c6", tealSoft:"rgba(62,198,198,0.13)",
  blue:"#5b8df0", blueSoft:"rgba(91,141,240,0.13)",
  purple:"#b46ef5",
};

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:${T.surface3};border-radius:99px}
  @keyframes popIn{0%{opacity:0;transform:scale(0.4)}70%{transform:scale(1.14)}100%{opacity:1;transform:scale(1)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes swapBounce{0%{transform:translateY(0)}40%{transform:translateY(-18px)}100%{transform:translateY(0)}}
  @keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.6) drop-shadow(0 0 8px currentColor)}}
  @keyframes logIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
  @keyframes barGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
  @keyframes mergeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  @keyframes drawIn{to{stroke-dashoffset:0}}
  @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(124,92,252,0.5)}100%{box-shadow:0 0 0 10px rgba(124,92,252,0)}}
  .pop{animation:popIn .36s cubic-bezier(.34,1.56,.64,1) both}
  .sup{animation:slideUp .28s ease both}
  .fin{animation:fadeIn .22s ease both}
  .swp{animation:swapBounce .35s ease both}
  .glw{animation:glow .6s ease}
  .log{animation:logIn .18s ease both}
  .mgr{animation:mergeSlide .3s ease both}
  .prg{animation:pulseRing .8s ease}
`;

/** Shared sleep utility */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
