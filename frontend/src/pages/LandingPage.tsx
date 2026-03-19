import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── CSS ─────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');

  html, body { margin: 0; padding: 0; overflow-x: hidden; }

  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }

  .lp {
    --black:      #06070d;
    --card:       #0f1020;
    --card2:      #13152a;
    --border:     rgba(245,158,11,0.10);
    --border2:    rgba(245,158,11,0.18);
    --gold:       #f59e0b;
    --gold-lt:    #fcd34d;
    --gold-dk:    #b45309;
    --gold-dim:   rgba(245,158,11,0.06);
    --off:        #ede8d8;
    --muted:      #6b6a5e;
    --dim:        #3a3828;
    --ff-display: 'Cormorant Garamond', Georgia, serif;
    --ff-body:    'Outfit', sans-serif;

    font-family: var(--ff-body);
    background: var(--black);
    color: var(--off);
    overflow-x: hidden;
    overflow-y: auto;
    cursor: none;
    width: 100%;
  }

  /* Noise overlay — pointer-events none so it never blocks scroll */
  .lp-noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E");
    opacity: .5;
  }

  /* ── CURSOR ── */
  .lp-cur {
    position: fixed; width: 10px; height: 10px; border-radius: 50%;
    background: var(--gold); pointer-events: none; z-index: 9999;
    mix-blend-mode: screen; transition: transform .15s;
  }
  .lp-cur-ring {
    position: fixed; width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid rgba(245,158,11,.4); pointer-events: none;
    z-index: 9998; transition: border-color .2s;
  }
  /* Hide custom cursor on touch devices */
  @media (hover: none) {
    .lp { cursor: auto; }
    .lp-cur, .lp-cur-ring { display: none !important; }
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    padding: 22px 64px;
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(180deg, rgba(6,7,13,.97) 0%, transparent 100%);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }
  .lp-nav-logo {
    font-family: var(--ff-display);
    font-size: 24px; font-weight: 700; letter-spacing: .5px;
    color: var(--gold-lt);
    display: flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .lp-nav-bolt { font-style: normal; color: var(--gold); }
  .lp-nav-links { display: flex; gap: 40px; list-style: none; margin: 0; padding: 0; }
  .lp-nav-links a {
    font-size: 13px; font-weight: 400; color: var(--muted);
    text-decoration: none; letter-spacing: .5px; transition: color .2s;
  }
  .lp-nav-links a:hover { color: var(--gold-lt); }
  .lp-nav-btn {
    border: 1px solid var(--border2);
    background: var(--gold-dim);
    color: var(--gold-lt);
    padding: 10px 26px; border-radius: 6px;
    font-family: var(--ff-body); font-size: 13px; font-weight: 500;
    cursor: pointer; letter-spacing: .5px;
    text-decoration: none; display: inline-block;
    transition: background .2s, border-color .2s;
  }
  .lp-nav-btn:hover { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.4); }

  /* ── HERO ── */
  .lp-hero {
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 140px 40px 100px;
    position: relative; overflow: hidden;
  }
  .lp-hero-light {
    position: absolute; width: 900px; height: 900px;
    background: radial-gradient(ellipse at 50% 40%, rgba(245,158,11,.18) 0%, rgba(245,158,11,.06) 30%, transparent 70%);
    top: -100px; left: 50%; transform: translateX(-50%);
    pointer-events: none;
    animation: lp-breathe 6s ease-in-out infinite;
  }
  @keyframes lp-breathe {
    0%,100% { opacity:1; transform:translateX(-50%) scale(1); }
    50%      { opacity:.7; transform:translateX(-50%) scale(1.08); }
  }
  .lp-hero-band {
    position: absolute; width: 100%; height: 1px; top: 42%;
    background: linear-gradient(90deg, transparent 0%, rgba(245,158,11,.15) 20%, rgba(245,158,11,.35) 50%, rgba(245,158,11,.15) 80%, transparent 100%);
    pointer-events: none;
  }
  .lp-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(245,158,11,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,158,11,.03) 1px, transparent 1px);
    background-size: 72px 72px;
    -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%);
    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%);
    pointer-events: none;
  }
  .lp-corner { position: absolute; width: 100px; height: 100px; pointer-events: none; }
  .lp-corner-tl { top:80px; left:40px; border-top:1px solid rgba(245,158,11,.2); border-left:1px solid rgba(245,158,11,.2); }
  .lp-corner-tr { top:80px; right:40px; border-top:1px solid rgba(245,158,11,.2); border-right:1px solid rgba(245,158,11,.2); }
  .lp-corner-bl { bottom:60px; left:40px; border-bottom:1px solid rgba(245,158,11,.2); border-left:1px solid rgba(245,158,11,.2); }
  .lp-corner-br { bottom:60px; right:40px; border-bottom:1px solid rgba(245,158,11,.2); border-right:1px solid rgba(245,158,11,.2); }

  .lp-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(245,158,11,.07); border: 1px solid rgba(245,158,11,.2);
    padding: 6px 18px; border-radius: 100px;
    font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;
    color: var(--gold); margin-bottom: 36px;
    animation: lp-fadeUp .9s ease both;
  }
  .lp-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--gold);
    animation: lp-blink 2s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  .lp-h1 {
    font-family: var(--ff-display);
    font-size: clamp(58px, 8.5vw, 112px);
    font-weight: 700; letter-spacing: -1px; line-height: .95;
    color: var(--gold-lt);
    text-shadow: 0 0 80px rgba(245,158,11,.25), 0 0 160px rgba(245,158,11,.10);
    animation: lp-fadeUp .9s .1s ease both;
    max-width: 1000px; margin: 0;
  }
  .lp-h1 em { font-style: italic; color: #fff; text-shadow: 0 0 40px rgba(255,255,255,.15); }
  .lp-dim-word { color: rgba(245,158,11,.35); font-style: italic; }

  .lp-hero-sub {
    margin-top: 28px; font-size: 17px; font-weight: 300;
    color: var(--muted); max-width: 500px; line-height: 1.75;
    animation: lp-fadeUp .9s .2s ease both;
  }
  .lp-hero-actions {
    margin-top: 44px; display: flex; gap: 16px; align-items: center;
    animation: lp-fadeUp .9s .3s ease both;
  }
  .lp-btn-gold {
    background: linear-gradient(135deg, var(--gold-dk) 0%, var(--gold) 50%, var(--gold-lt) 100%);
    color: var(--black); border: none; padding: 15px 40px; border-radius: 6px;
    font-family: var(--ff-body); font-size: 14px; font-weight: 600;
    cursor: pointer; letter-spacing: .5px;
    text-decoration: none; display: inline-block;
    position: relative; overflow: hidden;
    transition: transform .2s, box-shadow .2s;
    box-shadow: 0 4px 24px rgba(245,158,11,.3);
  }
  .lp-btn-gold::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%);
    animation: lp-btn-sweep 3.5s ease-in-out infinite;
    background-size: 200% 100%;
  }
  @keyframes lp-btn-sweep {
    0%   { transform: translateX(-100%); }
    40%  { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }
  .lp-btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(245,158,11,.45); }
  .lp-btn-ghost {
    color: var(--muted); font-size: 14px; font-weight: 400;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: color .2s; letter-spacing: .3px;
    background: none; border: none; text-decoration: none;
  }
  .lp-btn-ghost:hover { color: var(--gold-lt); }
  .lp-btn-ghost:hover .lp-arr { transform: translateX(4px); }
  .lp-arr { transition: transform .2s; display: inline-block; }

  .lp-price-row {
    margin-top: 48px; display: flex; align-items: center; gap: 12px;
    animation: lp-fadeUp .9s .4s ease both;
  }
  .lp-price-badge {
    background: var(--gold-dim); border: 1px solid var(--border2);
    padding: 9px 24px; border-radius: 6px;
    font-family: var(--ff-display); font-size: 26px; font-weight: 700;
    color: var(--gold-lt); letter-spacing: -.5px;
    text-shadow: 0 0 20px rgba(245,158,11,.3);
  }
  .lp-price-label { font-size: 13px; color: var(--muted); letter-spacing: .3px; }
  .lp-price-label strong { color: var(--gold); font-weight: 500; }

  @keyframes lp-fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* ── SCREEN PREVIEW ── */
  .lp-screen-wrap {
    margin-top: 80px; width: 100%; max-width: 960px;
    position: relative; animation: lp-fadeUp .9s .5s ease both;
  }
  .lp-screen-wrap::before {
    content: ''; position: absolute; bottom: -40px; left: 10%; right: 10%; height: 100px;
    background: radial-gradient(ellipse, rgba(245,158,11,.18) 0%, transparent 70%);
    filter: blur(20px); pointer-events: none;
  }
  .lp-screen {
    background: var(--card); border: 1px solid var(--border2); border-radius: 14px; overflow: hidden;
    box-shadow: 0 0 0 1px rgba(245,158,11,.06), 0 40px 100px rgba(0,0,0,.7), 0 0 80px rgba(245,158,11,.06);
  }
  .lp-screen-bar {
    background: var(--card2); padding: 12px 18px;
    display: flex; align-items: center; gap: 7px;
    border-bottom: 1px solid var(--border);
  }
  .lp-d-r { width:10px;height:10px;border-radius:50%;background:#ef4444;flex-shrink:0; }
  .lp-d-y { width:10px;height:10px;border-radius:50%;background:var(--gold);flex-shrink:0; }
  .lp-d-g { width:10px;height:10px;border-radius:50%;background:#10b981;flex-shrink:0; }
  .lp-url {
    flex:1; margin:0 16px;
    background: rgba(245,158,11,.04); border: 1px solid var(--border);
    border-radius:5px; padding:4px 12px;
    font-size:11px; color:var(--muted); text-align:center;
  }
  .lp-dash { display:grid; grid-template-columns:190px 1fr; height:400px; }
  .lp-dash-side {
    background: rgba(0,0,0,.35); border-right:1px solid var(--border);
    padding:20px 14px; display:flex; flex-direction:column; gap:3px;
  }
  .lp-dash-logo {
    font-family:var(--ff-display); font-size:18px; font-weight:700;
    color:var(--gold-lt); margin-bottom:22px; padding:0 6px;
    text-shadow:0 0 12px rgba(245,158,11,.3);
  }
  .lp-dash-item {
    padding:8px 12px; border-radius:7px;
    font-size:11.5px; color:var(--muted);
    display:flex; align-items:center; gap:10px;
  }
  .lp-dash-item.on {
    background:rgba(245,158,11,.08); border:1px solid rgba(245,158,11,.15); color:var(--gold-lt);
  }
  .lp-dash-main { padding:24px 26px; overflow:hidden; }
  .lp-dash-welcome {
    font-family:var(--ff-display); font-size:20px; font-weight:700;
    margin-bottom:4px; letter-spacing:-.3px;
  }
  .lp-dash-welcome .name { color:var(--gold); }
  .lp-dash-tagline { font-size:11px; color:var(--muted); margin-bottom:18px; }
  .lp-dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:18px; }
  .lp-ds {
    background:var(--card2); border:1px solid var(--border);
    border-radius:8px; padding:12px; position:relative; overflow:hidden;
  }
  .lp-ds::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1.5px;
    background:linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .lp-ds-lbl { font-size:9px; color:var(--muted); letter-spacing:.5px; text-transform:uppercase; }
  .lp-ds-val { font-family:var(--ff-display); font-size:24px; font-weight:700; margin-top:3px; color:var(--gold-lt); }
  .lp-ds-val.g { color:#10b981; }
  .lp-dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .lp-dg { background:var(--card2); border:1px solid var(--border); border-radius:8px; padding:13px; }
  .lp-dg-title { font-size:10.5px; font-weight:600; color:var(--off); margin-bottom:9px; }
  .lp-dg-row {
    padding:6px 9px; background:rgba(245,158,11,.04); border:1px solid rgba(245,158,11,.08);
    border-radius:5px; font-size:10px; color:var(--muted); margin-bottom:5px;
    display:flex; justify-content:space-between; align-items:center;
  }
  .lp-dg-tag { font-size:9px; padding:2px 6px; border-radius:3px; background:rgba(16,185,129,.12); color:#10b981; }
  .lp-dg-act {
    display:flex; align-items:center; gap:8px; padding:5px 0;
    border-bottom:1px solid var(--border); font-size:10px; color:var(--muted);
  }
  .lp-dg-icon {
    width:22px; height:22px; border-radius:5px; background:rgba(245,158,11,.1);
    display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0;
  }

  /* ── MARQUEE ── */
  .lp-marquee-wrap {
    border-top:1px solid var(--border); border-bottom:1px solid var(--border);
    padding:28px 0; overflow:hidden; position:relative;
  }
  .lp-marquee-wrap::before, .lp-marquee-wrap::after {
    content:''; position:absolute; top:0; bottom:0; width:120px; z-index:1;
  }
  .lp-marquee-wrap::before { left:0; background:linear-gradient(90deg, var(--black), transparent); }
  .lp-marquee-wrap::after  { right:0; background:linear-gradient(270deg, var(--black), transparent); }
  .lp-marquee-track {
    display:flex; gap:0; animation:lp-marquee 28s linear infinite; width:max-content;
  }
  @keyframes lp-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .lp-mq {
    font-size:12px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase;
    color:var(--muted); white-space:nowrap; padding:0 40px;
    display:flex; align-items:center; gap:40px;
  }
  .lp-mq::after { content:'✦'; color:var(--gold); font-size:9px; }

  /* ── STATS BAR ── */
  .lp-stats-bar { border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .lp-stats-inner {
    max-width:1200px; margin:0 auto;
    display:grid; grid-template-columns:repeat(4,1fr);
    background:var(--border); gap:1px;
  }
  .lp-stat-b { background:var(--black); padding:44px 40px; text-align:center; }
  .lp-stat-n {
    font-family:var(--ff-display); font-size:56px; font-weight:700;
    letter-spacing:-3px; color:var(--gold-lt);
    text-shadow:0 0 40px rgba(245,158,11,.25); line-height:1;
  }
  .lp-stat-d { margin-top:10px; font-size:13px; color:var(--muted); line-height:1.5; }

  /* ── SECTION SHARED ── */
  .lp-sec { padding:110px 64px; max-width:1200px; margin:0 auto; }
  .lp-sec-label {
    font-size:10px; font-weight:600; letter-spacing:3px; text-transform:uppercase;
    color:var(--gold); margin-bottom:14px;
  }
  .lp-sec-h {
    font-family:var(--ff-display); font-size:clamp(38px,4.5vw,62px);
    font-weight:700; letter-spacing:-1.5px; line-height:1.0;
    color:var(--gold-lt); text-shadow:0 0 60px rgba(245,158,11,.12); margin:0;
  }
  .lp-sec-h .dim { color:var(--muted); font-style:italic; }

  /* ── FEATURES ── */
  .lp-feat-grid {
    display:grid; grid-template-columns:repeat(3,1fr);
    gap:1px; background:var(--border);
    border:1px solid var(--border); border-radius:16px; overflow:hidden;
    margin-top:56px;
  }
  .lp-feat {
    background:var(--card); padding:40px 34px;
    transition:background .3s; position:relative; overflow:hidden;
  }
  .lp-feat:hover { background:var(--card2); }
  .lp-feat::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg, transparent, var(--gold), transparent);
    opacity:0; transition:opacity .3s;
  }
  .lp-feat:hover::after { opacity:.6; }
  .lp-feat-icon { font-size:26px; margin-bottom:18px; display:block; }
  .lp-feat-name {
    font-family:var(--ff-display); font-size:20px; font-weight:700;
    letter-spacing:-.3px; margin-bottom:10px; color:var(--gold-lt);
  }
  .lp-feat-desc { font-size:13.5px; color:var(--muted); line-height:1.7; }
  .lp-feat-chip {
    display:inline-block; margin-top:18px;
    font-size:10px; font-weight:500; letter-spacing:.5px;
    color:var(--gold); background:rgba(245,158,11,.06);
    border:1px solid rgba(245,158,11,.15);
    padding:4px 10px; border-radius:4px;
  }

  /* ── QUOTE ── */
  .lp-quote-sec { padding:110px 64px; text-align:center; max-width:860px; margin:0 auto; }
  .lp-qmark {
    font-family:var(--ff-display); font-size:100px; color:rgba(245,158,11,.12);
    line-height:.4; display:block; margin-bottom:40px;
  }
  .lp-qtext {
    font-family:var(--ff-display); font-size:clamp(26px,3.2vw,40px);
    font-weight:600; letter-spacing:-1px; line-height:1.25; color:var(--off);
  }
  .lp-qtext em { color:var(--gold); font-style:italic; }

  /* ── HOW IT WORKS ── */
  .lp-steps {
    display:grid; grid-template-columns:repeat(4,1fr);
    gap:1px; background:var(--border);
    border:1px solid var(--border); border-radius:16px; overflow:hidden; margin-top:56px;
  }
  .lp-step-c { background:var(--card); padding:38px 30px; position:relative; }
  .lp-step-n {
    font-family:var(--ff-display); font-size:56px; font-weight:700;
    color:rgba(245,158,11,.1); letter-spacing:-3px; line-height:1; margin-bottom:20px;
  }
  .lp-step-t { font-family:var(--ff-display); font-size:17px; font-weight:700; color:var(--gold-lt); margin-bottom:9px; }
  .lp-step-d { font-size:13px; color:var(--muted); line-height:1.65; }

  /* ── PRICING ── */
  .lp-price-sec { padding:110px 64px; text-align:center; position:relative; overflow:hidden; }
  .lp-price-glow {
    position:absolute; width:700px; height:500px;
    background:radial-gradient(ellipse, rgba(245,158,11,.1) 0%, transparent 70%);
    top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;
  }
  .lp-price-cards {
    display:flex; max-width:840px; margin:56px auto 0;
    border:1px solid var(--border2); border-radius:16px; overflow:hidden;
  }
  .lp-pc { flex:1; padding:36px 24px; text-align:center; border-right:1px solid var(--border); }
  .lp-pc:last-child { border-right:none; }
  .lp-pc.hero-pc {
    background:linear-gradient(180deg, rgba(245,158,11,.1) 0%, rgba(245,158,11,.04) 100%);
    position:relative;
  }
  .lp-pc.hero-pc::before { content:''; position:absolute; inset:0; border:1px solid rgba(245,158,11,.35); pointer-events:none; }
  .lp-pc-label { font-size:11px; color:var(--muted); letter-spacing:.5px; margin-bottom:10px; }
  .lp-pc-amt { font-family:var(--ff-display); font-size:46px; font-weight:700; letter-spacing:-2px; color:var(--muted); }
  .lp-pc.hero-pc .lp-pc-amt { color:var(--gold-lt); text-shadow:0 0 30px rgba(245,158,11,.3); }
  .lp-pc-note { margin-top:8px; font-size:12px; color:var(--muted); font-style:italic; }
  .lp-pc.hero-pc .lp-pc-note { color:var(--gold); }
  .lp-pc-best {
    display:inline-block; margin-bottom:12px;
    background:linear-gradient(135deg,var(--gold-dk),var(--gold));
    color:var(--black); font-size:9px; font-weight:700;
    letter-spacing:1.5px; text-transform:uppercase;
    padding:3px 10px; border-radius:3px;
  }

  /* ── CTA ── */
  .lp-cta-sec { padding:140px 64px; text-align:center; position:relative; overflow:hidden; }
  .lp-cta-light {
    position:absolute; width:1000px; height:700px;
    background:radial-gradient(ellipse at 50% 60%, rgba(245,158,11,.14) 0%, rgba(245,158,11,.04) 40%, transparent 70%);
    top:0; left:50%; transform:translateX(-50%); pointer-events:none;
  }
  .lp-cta-h {
    font-family:var(--ff-display); font-size:clamp(48px,7vw,88px);
    font-weight:700; letter-spacing:-3px; line-height:.95;
    color:var(--gold-lt); text-shadow:0 0 80px rgba(245,158,11,.2);
    max-width:860px; margin:0 auto 28px;
  }
  .lp-italic-dim { font-style:italic; color:rgba(245,158,11,.45); }
  .lp-cta-sub { font-size:16px; color:var(--muted); margin-bottom:48px; font-weight:300; }
  .lp-cta-note { margin-top:28px; font-size:12px; color:var(--muted); }
  .lp-cta-note strong { color:var(--gold); font-weight:500; }
  .lp-cta-actions { display:flex; gap:16px; justify-content:center; align-items:center; flex-wrap:wrap; }

  /* ── FOOTER ── */
  .lp-footer {
    padding:52px 64px; border-top:1px solid var(--border);
    display:flex; justify-content:space-between; align-items:center;
    max-width:1400px; margin:0 auto;
  }
  .lp-ft-logo { font-family:var(--ff-display); font-size:20px; font-weight:700; color:var(--gold-lt); }
  .lp-ft-links { display:flex; gap:32px; list-style:none; margin:0; padding:0; }
  .lp-ft-links a { font-size:12px; color:var(--muted); text-decoration:none; transition:color .2s; }
  .lp-ft-links a:hover { color:var(--gold-lt); }
  .lp-ft-copy { font-size:11px; color:var(--dim); }

  /* ── REVEAL ── */
  .lp-r { opacity:0; transform:translateY(28px); transition:opacity .75s ease, transform .75s ease; }
  .lp-r.v { opacity:1; transform:translateY(0); }
  .lp-r1 { transition-delay:.1s; }
  .lp-r2 { transition-delay:.2s; }
  .lp-r3 { transition-delay:.3s; }

  /* ── RESPONSIVE ── */
  @media(max-width:900px){
    .lp-nav { padding:16px 24px; }
    .lp-nav-links { display:none; }
    .lp-sec { padding:70px 24px; }
    .lp-feat-grid { grid-template-columns:1fr; }
    .lp-stats-inner { grid-template-columns:repeat(2,1fr); }
    .lp-steps { grid-template-columns:1fr 1fr; }
    .lp-price-cards { flex-direction:column; }
    .lp-pc { border-right:none; border-bottom:1px solid var(--border); }
    .lp-cta-sec, .lp-price-sec { padding:80px 24px; }
    .lp-footer { flex-direction:column; gap:24px; padding:40px 24px; text-align:center; }
    .lp-dash-side { display:none; }
    .lp-dash { grid-template-columns:1fr; }
    .lp-corner { display:none; }
  }
`;

// ─── Static data ──────────────────────────────────────────────────────────────

const marqueeItems = [
  'AI Learning Roadmaps', 'Coding Practice', 'Portfolio Builder', 'Opportunities',
  'AI Tutor', 'LeetCode Sync', 'GitHub Deploy', 'XP & Streaks',
];

const stats = [
  { n: '3M+', d: 'CS graduates in India every year — most without a clear path forward' },
  { n: '₹200', d: 'Per student per month — less than a recharge, less than a canteen week' },
  { n: '24/7', d: 'AI tutor always available — at 11 PM, on weekends, whenever you need it' },
  { n: '5-in-1', d: 'Roadmaps, practice, portfolio, jobs, AI tutor — one login, zero switching' },
];

const features = [
  { icon: '🗺️', name: 'AI Learning Roadmaps', chip: 'Powered by Claude Sonnet', desc: "Tell EduAi your goal. It generates a personalised week-by-week plan with daily tasks, XP rewards, quizzes, and free verified resources — curated, not generic." },
  { icon: '💻', name: 'Coding Practice', chip: 'LeetCode Synced', desc: '3,800+ problems across easy, medium, and hard. Full LeetCode integration with auto-sync — solve anywhere, track everything here.' },
  { icon: '🌐', name: 'Portfolio Builder', chip: 'GitHub Pages Deploy', desc: 'Six beautiful themes, AI-written bio, project showcase, and one-click deploy to GitHub Pages. Live on the internet in under five minutes.' },
  { icon: '💼', name: 'Opportunities', chip: 'Updated Daily', desc: 'Real jobs, internships, and apprenticeships — filtered for India, updated daily. Track every application in one place with the built-in tracker.' },
  { icon: '🤖', name: 'AI Tutor', chip: 'Always Available', desc: 'A 24/7 mentor that explains any concept, helps debug code, and guides students through their roadmap. Available at 11 PM when no one else is.' },
  { icon: '📊', name: 'XP & Progress Tracking', chip: 'Gamified Learning', desc: "Gamified learning with XP, daily streaks, levels, and milestones. Students see exactly how far they've come — and exactly what's next." },
];

const steps = [
  { n: '01', t: 'Sign up', d: "Create your account in under 2 minutes. Just your email and you're in." },
  { n: '02', t: 'Set your goal', d: 'Tell EduAi what you want to achieve. AI generates a personalised roadmap instantly.' },
  { n: '03', t: 'Learn & practice', d: "Follow your roadmap, solve problems, get AI help whenever you're stuck — day or night." },
  { n: '04', t: 'Get hired', d: 'Apply to curated jobs, deploy your portfolio, walk into interviews prepared.' },
];

const priceCompare = [
  { label: 'Jio Recharge', amt: '₹299', note: '28 days of data', hero: false },
  { label: 'Canteen Week', amt: '₹300', note: 'Gone by Friday', hero: false },
  { label: 'Evening Mandi', amt: '₹250', note: 'Gone by morning', hero: false },
  { label: 'EduAi', amt: '₹200', note: 'Builds your career', hero: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const styleInjected = useRef(false);
  const curRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Inject CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  }, []);

  // Custom cursor
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0, raf: number;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (curRef.current) {
        curRef.current.style.left = mx - 5 + 'px';
        curRef.current.style.top = my - 5 + 'px';
      }
    };
    document.addEventListener('mousemove', onMove);
    const loop = () => {
      rx += (mx - rx) * .11; ry += (my - ry) * .11;
      if (ringRef.current) {
        ringRef.current.style.left = rx - 19 + 'px';
        ringRef.current.style.top = ry - 19 + 'px';
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    const addHover = () => {
      document.querySelectorAll<HTMLElement>('button,a,.lp-feat,.lp-stat-b,.lp-pc').forEach(el => {
        el.addEventListener('mouseenter', () => {
          if (curRef.current) curRef.current.style.transform = 'scale(2.5)';
          if (ringRef.current) { ringRef.current.style.transform = 'scale(1.6)'; ringRef.current.style.borderColor = 'rgba(245,158,11,.8)'; }
        });
        el.addEventListener('mouseleave', () => {
          if (curRef.current) curRef.current.style.transform = 'scale(1)';
          if (ringRef.current) { ringRef.current.style.transform = 'scale(1)'; ringRef.current.style.borderColor = 'rgba(245,158,11,.4)'; }
        });
      });
    };
    addHover();
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('v'); });
    }, { threshold: 0.08 });
    document.querySelectorAll('.lp-r').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Parallax hero light
  useEffect(() => {
    const container = document.querySelector<HTMLElement>('.lp');
    const onScroll = () => {
      const scrollY = container?.scrollTop ?? window.scrollY;
      const el = document.querySelector<HTMLElement>('.lp-hero-light');
      if (el) el.style.transform = `translateX(-50%) translateY(${scrollY * .12}px)`;
    };
    container?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="lp">
      <div className="lp-noise" />
      <div className="lp-cur" ref={curRef} />
      <div className="lp-cur-ring" ref={ringRef} />
      <div className="lp-corner lp-corner-tl" />
      <div className="lp-corner lp-corner-tr" />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <em className="lp-nav-bolt">⚡</em> EduAi
        </div>
        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#how">How it works</a></li>
        </ul>
        <a href="/login" className="lp-nav-btn">Get Started →</a>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-light" />
        <div className="lp-hero-band" />
        <div className="lp-hero-grid" />
        <div className="lp-corner lp-corner-bl" />
        <div className="lp-corner lp-corner-br" />

        <div className="lp-eyebrow">
          <span className="lp-eyebrow-dot" /> Now live across India
        </div>

        <h1 className="lp-h1">
          Every student<br />deserves <em>a mentor.</em><br />
          <span className="lp-dim-word">We built one.</span>
        </h1>

        <p className="lp-hero-sub">
          AI-powered career intelligence for BSc CS, BCA, and engineering students —
          roadmaps, practice, portfolio, jobs, and a 24/7 tutor.
        </p>

        <div className="lp-hero-actions">
          <button className="lp-btn-gold" onClick={() => navigate('/register')}>
            Get Started →
          </button>
          <a className="lp-btn-ghost" href="#features">
            See features <span className="lp-arr">→</span>
          </a>
        </div>

        <div className="lp-price-row">
          <div className="lp-price-badge">₹200</div>
          <span className="lp-price-label">
            per student / month &nbsp;·&nbsp; <strong>cheaper than a Jio recharge</strong>
          </span>
        </div>

        {/* Dashboard mockup */}
        <div className="lp-screen-wrap">
          <div className="lp-screen">
            <div className="lp-screen-bar">
              <div className="lp-d-r" /><div className="lp-d-y" /><div className="lp-d-g" />
              <div className="lp-url">🔒 eduaiajk.in/dashboard</div>
            </div>
            <div className="lp-dash">
              <div className="lp-dash-side">
                <div className="lp-dash-logo">⚡ EduAi</div>
                <div className="lp-dash-item on">⊞&nbsp; Dashboard</div>
                <div className="lp-dash-item">🗺&nbsp; Roadmaps</div>
                <div className="lp-dash-item">&lt;/&gt;&nbsp; Practice</div>
                <div className="lp-dash-item">◈&nbsp; Opportunities</div>
                <div className="lp-dash-item">⬡&nbsp; Portfolio</div>
                <div className="lp-dash-item">✦&nbsp; AI Tutor</div>
              </div>
              <div className="lp-dash-main">
                <div className="lp-dash-welcome">
                  Welcome back, <span className="name">Mohamed Rizwan Ansaari M</span> 👋
                </div>
                <div className="lp-dash-tagline">Ready to continue your learning journey?</div>
                <div className="lp-dash-stats">
                  <div className="lp-ds"><div className="lp-ds-lbl">Current Streak</div><div className="lp-ds-val">🔥 12</div></div>
                  <div className="lp-ds"><div className="lp-ds-lbl">Total XP</div><div className="lp-ds-val">2,450</div></div>
                  <div className="lp-ds"><div className="lp-ds-lbl">Problems Solved</div><div className="lp-ds-val g">48</div></div>
                  <div className="lp-ds"><div className="lp-ds-lbl">Roadmaps</div><div className="lp-ds-val">3</div></div>
                </div>
                <div className="lp-dash-grid">
                  <div className="lp-dg">
                    <div className="lp-dg-title">Continue Learning · 3 active</div>
                    <div className="lp-dg-row">Flask Development Beginner Roadmap <span className="lp-dg-tag">easy</span></div>
                    <div className="lp-dg-row">Java Backend Developer Learning <span className="lp-dg-tag">easy</span></div>
                    <div className="lp-dg-row">ML with Python Roadmap <span className="lp-dg-tag">medium</span></div>
                  </div>
                  <div className="lp-dg">
                    <div className="lp-dg-title">Recent Activity</div>
                    <div className="lp-dg-act"><div className="lp-dg-icon">⊙</div>Solved Recyclable and Low Fat Products · 6d ago</div>
                    <div className="lp-dg-act"><div className="lp-dg-icon">⊙</div>Solved Invalid Tweets · 6d ago</div>
                    <div className="lp-dg-act"><div className="lp-dg-icon">⊙</div>Solved Replace Employee ID · 6d ago</div>
                    <div className="lp-dg-act"><div className="lp-dg-icon">⊙</div>Deployed Portfolio to GitHub · 2d ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div className="lp-mq" key={i}>{item}</div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="lp-stats-bar">
        <div className="lp-stats-inner">
          {stats.map((s, i) => (
            <div className={`lp-stat-b lp-r${i > 0 ? ` lp-r${i}` : ''}`} key={s.n}>
              <div className="lp-stat-n">{s.n}</div>
              <div className="lp-stat-d">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div id="features">
        <div className="lp-sec">
          <p className="lp-sec-label lp-r">Platform Features</p>
          <h2 className="lp-sec-h lp-r">
            Everything a student needs<br /><span className="dim">to get hired.</span>
          </h2>
          <div className="lp-feat-grid">
            {features.map((f, i) => (
              <div className={`lp-feat lp-r${i % 3 !== 0 ? ` lp-r${i % 3}` : ''}`} key={f.name}>
                <span className="lp-feat-icon">{f.icon}</span>
                <div className="lp-feat-name">{f.name}</div>
                <div className="lp-feat-desc">{f.desc}</div>
                <span className="lp-feat-chip">{f.chip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUOTE ── */}
      <div className="lp-quote-sec lp-r">
        <span className="lp-qmark">"</span>
        <p className="lp-qtext">
          The gap isn't talent. It's <em>access.</em> A student in Coimbatore has the same
          potential as one in Bangalore. They just don't have the same ecosystem. EduAi is that ecosystem.
        </p>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how">
        <div className="lp-sec">
          <p className="lp-sec-label lp-r">How it works</p>
          <h2 className="lp-sec-h lp-r">
            Zero friction.<br /><span className="dim">You're live in minutes.</span>
          </h2>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div className={`lp-step-c lp-r${i > 0 ? ` lp-r${i}` : ''}`} key={s.n}>
                <div className="lp-step-n">{s.n}</div>
                <div className="lp-step-t">{s.t}</div>
                <div className="lp-step-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" className="lp-price-sec">
        <div className="lp-price-glow" />
        <p className="lp-sec-label lp-r">Pricing</p>
        <h2 className="lp-sec-h lp-r" style={{ margin: '0 auto', textAlign: 'center' }}>
          Less than what you<br /><span className="dim">already spend every month.</span>
        </h2>
        <div className="lp-price-cards lp-r">
          {priceCompare.map(pc => (
            <div className={`lp-pc${pc.hero ? ' hero-pc' : ''}`} key={pc.label}>
              {pc.hero && <div className="lp-pc-best">Best Value</div>}
              <div className="lp-pc-label">{pc.label}</div>
              <div className="lp-pc-amt">{pc.amt}</div>
              <div className="lp-pc-note">{pc.note}</div>
            </div>
          ))}
        </div>
        <p className="lp-r" style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)' }}>
          ₹200 / month &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; No setup cost
        </p>
      </div>

      {/* ── CTA ── */}
      <div className="lp-cta-sec">
        <div className="lp-cta-light" />
        <h2 className="lp-cta-h lp-r">
          The ecosystem<br />you <span className="lp-italic-dim">deserve.</span>
        </h2>
        <p className="lp-cta-sub lp-r">
          Join thousands of students already building careers with EduAi.
        </p>
        <div className="lp-cta-actions lp-r">
          <a href="/register" className="lp-btn-gold" style={{ fontSize: 15, padding: '17px 48px' }}>
            Get Started →
          </a>
          <a href="/login" className="lp-btn-ghost" style={{ fontSize: 15 }}>
            Already have an account? Log in <span className="lp-arr">→</span>
          </a>
        </div>
        <p className="lp-cta-note lp-r" style={{ marginTop: 32 }}>
          ₹200 / month &nbsp;·&nbsp; No setup cost &nbsp;·&nbsp; <strong>eduaiajk.in</strong>
        </p>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-ft-logo">⚡ EduAi</div>
        <ul className="lp-ft-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="https://eduaiajk.in" target="_blank" rel="noreferrer">eduaiajk.in ↗</a></li>
        </ul>
        <span className="lp-ft-copy">© {new Date().getFullYear()} EduAi · Coimbatore, India</span>
      </footer>
    </div>
  );
};

export default LandingPage;
