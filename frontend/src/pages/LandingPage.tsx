import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── CSS ─────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Cormorant+Garamond:wght@600;700&display=swap');

  :root {
    --purple: #7C3AED;
    --gold: #F59E0B;
    --navy: #0D0F1A;
    --navy2: #13162A;
    --navy3: #1A1E35;
    --white: #F0F2FF;
    --muted: #8891C4;
    --border: rgba(124,58,237,0.2);
  }

  .lp4 *, .lp4 *::before, .lp4 *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp4 {
    font-family: 'Syne', sans-serif;
    background: var(--navy);
    color: var(--white);
    overflow-x: hidden;
    width: 100%;
  }

  /* --- NOISE OVERLAY --- */
  .lp4::before {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  }

  /* --- GRID BG --- */
  .lp4 .grid-bg {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  /* --- NAV --- */
  .lp4 nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 60px;
    background: linear-gradient(to bottom, rgba(13,15,26,0.95), transparent);
    backdrop-filter: blur(10px);
  }

  .lp4 .logo {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #fcd34d;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 0 20px rgba(245,158,11,0.35);
  }
  .lp4 .logo-bolt {
    font-style: normal;
    color: var(--gold);
    font-size: 1.2rem;
    filter: drop-shadow(0 0 8px rgba(245,158,11,0.7));
    animation: lp4-bolt-pulse 3s ease-in-out infinite;
  }
  @keyframes lp4-bolt-pulse {
    0%, 100% { filter: drop-shadow(0 0 6px rgba(245,158,11,0.6)); }
    50%       { filter: drop-shadow(0 0 16px rgba(245,158,11,1)); }
  }

  .lp4 .nav-links {
    display: flex; gap: 36px;
    list-style: none;
  }
  .lp4 .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 0.2s;
  }
  .lp4 .nav-links a:hover { color: var(--white); }

  .lp4 .nav-cta {
    background: var(--purple);
    color: var(--white) !important;
    padding: 10px 22px;
    border-radius: 6px;
    transition: background 0.2s, transform 0.2s !important;
    cursor: pointer;
    border: none;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
  }
  .lp4 .nav-cta:hover { background: #6D28D9 !important; transform: translateY(-1px); }

  /* --- HERO --- */
  .lp4 .hero {
    position: relative;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 120px 40px 80px;
    z-index: 1;
  }

  .lp4 .hero-glow {
    position: absolute;
    width: 900px; height: 600px;
    background: radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, transparent 70%);
    top: 10%; left: 50%; transform: translateX(-50%);
    pointer-events: none;
  }

  .lp4 .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    border: 1px solid var(--border);
    background: rgba(124,58,237,0.08);
    color: var(--gold);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 8px 18px;
    border-radius: 100px;
    margin-bottom: 36px;
    opacity: 0;
    animation: lp4-fadeUp 0.6s 0.1s forwards;
  }

  .lp4 .hero-badge::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--gold);
    display: inline-block;
    animation: lp4-pulse 2s infinite;
  }

  @keyframes lp4-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .lp4 .hero h1 {
    font-size: clamp(3rem, 7vw, 6rem);
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.03em;
    max-width: 900px;
    opacity: 0;
    animation: lp4-fadeUp 0.7s 0.25s forwards;
  }

  .lp4 .hero h1 .accent { color: var(--purple); }
  .lp4 .hero h1 .gold { color: var(--gold); }

  .lp4 .hero-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(0.85rem, 1.5vw, 1rem);
    color: var(--muted);
    max-width: 560px;
    line-height: 1.8;
    margin: 28px auto 48px;
    font-weight: 300;
    opacity: 0;
    animation: lp4-fadeUp 0.7s 0.4s forwards;
  }

  .lp4 .hero-cta {
    display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
    opacity: 0;
    animation: lp4-fadeUp 0.7s 0.55s forwards;
  }

  .lp4 .btn-primary {
    background: var(--purple);
    color: var(--white);
    border: none;
    padding: 16px 36px;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: all 0.25s;
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }
  .lp4 .btn-primary::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  }
  .lp4 .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.5); }

  .lp4 .btn-ghost {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--border);
    padding: 16px 36px;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: all 0.25s;
    text-decoration: none;
  }
  .lp4 .btn-ghost:hover { border-color: var(--purple); color: var(--white); }

  /* --- METRICS STRIP --- */
  .lp4 .metrics {
    position: relative; z-index: 1;
    display: flex; justify-content: center;
    gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: rgba(19,22,42,0.6);
    backdrop-filter: blur(10px);
    opacity: 0;
    animation: lp4-fadeUp 0.7s 0.7s forwards;
  }

  .lp4 .metric-item {
    flex: 1; max-width: 220px;
    padding: 32px 24px;
    text-align: center;
    border-right: 1px solid var(--border);
  }
  .lp4 .metric-item:last-child { border-right: none; }

  .lp4 .metric-num {
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--white);
    letter-spacing: -0.03em;
  }
  .lp4 .metric-num span { color: var(--gold); }

  .lp4 .metric-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* --- TERMINAL CODE BLOCK --- */
  .lp4 .terminal-section {
    position: relative; z-index: 1;
    padding: 100px 40px;
    display: flex; align-items: center; justify-content: center;
    gap: 80px;
    max-width: 1200px;
    margin: 0 auto;
    flex-wrap: wrap;
  }

  .lp4 .terminal-text { flex: 1; min-width: 300px; }

  .lp4 .section-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--purple);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
  }
  .lp4 .section-eyebrow::after {
    content: '';
    height: 1px; flex: 1; max-width: 60px;
    background: var(--purple);
    opacity: 0.5;
  }

  .lp4 h2 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 20px;
  }

  .lp4 .section-body {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.9;
    font-weight: 300;
    max-width: 440px;
  }

  .lp4 .terminal-window {
    flex: 1; min-width: 320px; max-width: 520px;
    background: var(--navy2);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1);
  }

  .lp4 .terminal-bar {
    background: var(--navy3);
    padding: 12px 16px;
    display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid var(--border);
  }

  .lp4 .dot { width: 10px; height: 10px; border-radius: 50%; }
  .lp4 .dot-r { background: #FF5F57; }
  .lp4 .dot-y { background: #FEBC2E; }
  .lp4 .dot-g { background: #28C840; }

  .lp4 .terminal-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    margin-left: 8px;
  }

  .lp4 .terminal-body {
    padding: 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    line-height: 2;
  }

  .lp4 .t-comment { color: #4A527A; }
  .lp4 .t-keyword { color: #C084FC; }
  .lp4 .t-string { color: #86EFAC; }
  .lp4 .t-fn { color: #60A5FA; }
  .lp4 .t-var { color: var(--gold); }
  .lp4 .t-prompt { color: var(--purple); margin-right: 8px; }
  .lp4 .t-response { color: var(--muted); display: block; padding-left: 16px; margin-top: -4px; }
  .lp4 .t-cursor {
    display: inline-block;
    width: 8px; height: 14px;
    background: var(--purple);
    vertical-align: middle;
    animation: lp4-blink 1s step-end infinite;
  }

  @keyframes lp4-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

  /* --- FEATURES GRID --- */
  .lp4 .features {
    position: relative; z-index: 1;
    padding: 60px 40px 100px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .lp4 .features-header { text-align: center; margin-bottom: 64px; }

  .lp4 .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  .lp4 .feature-card {
    background: var(--navy);
    padding: 36px 32px;
    position: relative;
    transition: background 0.3s;
    cursor: default;
  }
  .lp4 .feature-card:hover { background: var(--navy2); }

  .lp4 .feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 0;
    background: var(--purple);
    transition: height 0.4s ease;
  }
  .lp4 .feature-card:hover::before { height: 100%; }

  .lp4 .feature-icon {
    font-size: 1.8rem;
    margin-bottom: 20px;
    display: block;
  }

  .lp4 .feature-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }

  .lp4 .feature-desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.8;
    font-weight: 300;
  }

  .lp4 .feature-tag {
    display: inline-block;
    margin-top: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--purple);
    background: rgba(124,58,237,0.1);
    padding: 4px 10px;
    border-radius: 4px;
  }

  /* --- BEFORE / AFTER --- */
  .lp4 .before-after-section {
    position: relative; z-index: 1;
    padding: 100px 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .lp4 .ba-header {
    text-align: center;
    margin-bottom: 64px;
  }

  .lp4 .ba-grid {
    display: grid;
    grid-template-columns: 1fr 60px 1fr;
    gap: 0;
    align-items: start;
  }

  .lp4 .ba-card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 36px 32px;
    background: var(--navy2);
  }

  .lp4 .ba-before {
    border-color: rgba(255,255,255,0.06);
    opacity: 0.75;
    background: linear-gradient(160deg, rgba(255,80,80,0.04), var(--navy2));
  }

  .lp4 .ba-after {
    border-color: rgba(124,58,237,0.4);
    background: linear-gradient(160deg, rgba(124,58,237,0.08), var(--navy2));
    box-shadow: 0 0 60px rgba(124,58,237,0.1);
  }

  .lp4 .ba-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    display: inline-block;
    margin-bottom: 28px;
  }

  .lp4 .ba-label-before {
    background: rgba(255,80,80,0.1);
    color: #f87171;
    border: 1px solid rgba(255,80,80,0.2);
  }

  .lp4 .ba-label-after {
    background: rgba(124,58,237,0.15);
    color: var(--gold);
    border: 1px solid rgba(245,158,11,0.25);
  }

  .lp4 .ba-items {
    display: flex; flex-direction: column; gap: 24px;
  }

  .lp4 .ba-item {
    display: flex; align-items: flex-start; gap: 16px;
  }

  .lp4 .ba-icon {
    font-size: 1.4rem;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .lp4 .ba-item-title {
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .lp4 .ba-item-desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.7;
    font-weight: 300;
  }

  .lp4 .ba-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding-top: 60px;
  }

  .lp4 .ba-divider-line {
    width: 1px;
    flex: 1;
    background: var(--border);
  }

  .lp4 .ba-divider-icon {
    font-size: 1.4rem;
    color: var(--gold);
    filter: drop-shadow(0 0 10px rgba(245,158,11,0.7));
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .lp4 .ba-grid { grid-template-columns: 1fr; }
    .lp4 .ba-divider { flex-direction: row; padding-top: 0; padding: 20px 0; }
    .lp4 .ba-divider-line { width: auto; height: 1px; flex: 1; }
  }

  /* --- LIVE PROGRESS TICKER --- */
  .lp4 .progress-section {
    position: relative; z-index: 1;
    padding: 80px 40px 100px;
    background: var(--navy2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .lp4 .progress-header {
    text-align: center;
    margin-bottom: 64px;
  }

  .lp4 .dashboard-mock {
    max-width: 720px;
    margin: 0 auto;
    background: var(--navy);
    border: 1px solid rgba(124,58,237,0.3);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1), 0 0 80px rgba(124,58,237,0.08);
    position: relative;
  }

  .lp4 .dash-topbar {
    padding: 20px 28px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: var(--navy2);
  }

  .lp4 .dash-user { display: flex; align-items: center; gap: 12px; }

  .lp4 .dash-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--purple), #9f67fa);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
  }

  .lp4 .dash-name {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .lp4 .dash-college {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--muted);
    margin-top: 2px;
  }

  .lp4 .dash-streak {
    display: flex; align-items: center; gap: 6px;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 100px;
    padding: 6px 16px;
  }

  .lp4 .streak-fire { font-size: 1rem; }
  .lp4 .streak-num {
    font-size: 1.1rem; font-weight: 800;
    color: var(--gold);
  }
  .lp4 .streak-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem; color: var(--muted);
  }

  .lp4 .dash-xp-section {
    padding: 20px 28px;
    border-bottom: 1px solid var(--border);
  }

  .lp4 .dash-xp-label {
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .lp4 .xp-title { color: var(--purple); font-weight: 600; }
  .lp4 .xp-points { color: var(--gold); }

  .lp4 .dash-xp-track {
    width: 100%; height: 8px;
    background: rgba(255,255,255,0.05);
    border-radius: 100px;
    overflow: hidden;
    position: relative;
  }

  .lp4 .dash-xp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--purple), #9f67fa, var(--gold));
    border-radius: 100px;
    transition: width 1.5s cubic-bezier(0.4,0,0.2,1);
    position: relative;
  }

  .lp4 .dash-xp-fill::after {
    content: '';
    position: absolute; right: 0; top: 50%;
    transform: translateY(-50%);
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 10px rgba(245,158,11,0.8);
  }

  .lp4 .dash-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid var(--border);
  }

  .lp4 .dash-stat {
    padding: 20px 24px;
    text-align: center;
    border-right: 1px solid var(--border);
  }
  .lp4 .dash-stat:last-child { border-right: none; }

  .lp4 .dash-stat-num {
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--white);
  }

  .lp4 .dash-stat-num span {
    font-size: 1rem;
    color: var(--muted);
    font-weight: 400;
  }

  .lp4 .gold-text { color: var(--gold) !important; }

  .lp4 .dash-stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 4px;
  }

  .lp4 .dash-feed-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 16px 28px 8px;
  }

  .lp4 .dash-feed {
    padding: 0 28px 24px;
    display: flex; flex-direction: column; gap: 4px;
  }

  .lp4 .feed-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted);
    opacity: 0;
    transform: translateX(-10px);
    transition: opacity 0.5s ease, transform 0.5s ease, background 0.2s;
  }

  .lp4 .feed-item:hover { background: rgba(255,255,255,0.03); }
  .lp4 .feed-item strong { color: var(--white); font-weight: 600; }

  .lp4 .feed-item.feed-visible {
    opacity: 1;
    transform: none;
  }

  .lp4 .feed-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lp4 .feed-gold { background: var(--gold); box-shadow: 0 0 6px rgba(245,158,11,0.7); }
  .lp4 .feed-purple { background: var(--purple); box-shadow: 0 0 6px rgba(124,58,237,0.7); }
  .lp4 .feed-green { background: #34d399; box-shadow: 0 0 6px rgba(52,211,153,0.7); }

  .lp4 .feed-time {
    margin-left: auto;
    font-size: 0.6rem;
    color: rgba(136,145,196,0.5);
    flex-shrink: 0;
  }

  .lp4 .dash-notif {
    position: absolute;
    bottom: 24px; right: 24px;
    background: linear-gradient(135deg, rgba(19,22,42,0.98), rgba(26,30,53,0.98));
    border: 1px solid rgba(245,158,11,0.4);
    border-radius: 12px;
    padding: 14px 18px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(245,158,11,0.1);
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    max-width: 260px;
  }

  .lp4 .dash-notif.notif-show {
    opacity: 1;
    transform: none;
  }

  .lp4 .notif-icon { font-size: 1.4rem; flex-shrink: 0; }

  .lp4 .notif-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--gold);
    margin-bottom: 2px;
  }

  .lp4 .notif-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    color: var(--muted);
  }

  @media (max-width: 768px) {
    .lp4 .dash-stats { grid-template-columns: repeat(2, 1fr); }
    .lp4 .dash-stat:nth-child(2) { border-right: none; }
    .lp4 .dash-notif { display: none; }
  }

  /* --- CTA BANNER --- */
  .lp4 .cta-banner {
    position: relative; z-index: 1;
    margin: 0 40px 80px;
    max-width: 1120px;
    margin-left: auto; margin-right: auto;
    background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(245,158,11,0.1));
    border: 1px solid rgba(124,58,237,0.4);
    border-radius: 20px;
    padding: 80px 60px;
    text-align: center;
    overflow: hidden;
  }

  .lp4 .cta-banner::before {
    content: '';
    position: absolute;
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .lp4 .cta-banner h2 { position: relative; }
  .lp4 .cta-banner p {
    position: relative;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: var(--muted);
    margin: 16px 0 40px;
  }

  /* --- FOOTER --- */
  .lp4 footer {
    position: relative; z-index: 1;
    border-top: 1px solid var(--border);
    padding: 40px 60px;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 20px;
  }

  .lp4 .footer-brand {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fcd34d;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 0 16px rgba(245,158,11,0.35);
  }

  .lp4 .footer-brand em {
    font-style: normal;
    color: var(--gold);
    filter: drop-shadow(0 0 8px rgba(245,158,11,0.7));
  }

  .lp4 .footer-links {
    display: flex; gap: 32px; list-style: none;
  }
  .lp4 .footer-links a {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--muted);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: color 0.2s;
  }
  .lp4 .footer-links a:hover { color: var(--white); }

  .lp4 .footer-copy {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* --- ANIMATIONS --- */
  @keyframes lp4-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lp4 .reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .lp4 .reveal.visible {
    opacity: 1;
    transform: none;
  }

  /* --- RESPONSIVE --- */
  @media (max-width: 768px) {
    .lp4 nav { padding: 16px 24px; }
    .lp4 .nav-links { display: none; }
    .lp4 .terminal-section { gap: 40px; padding: 60px 24px; }
    .lp4 .features { padding: 40px 24px 60px; }
    .lp4 .cta-banner { padding: 50px 28px; }
    .lp4 footer { flex-direction: column; padding: 32px 24px; }
    .lp4 .metric-item { padding: 20px 14px; }
    .lp4 .metric-num { font-size: 1.8rem; }
  }
`;

// ─── Static data ──────────────────────────────────────────────────────────────

const features = [
  { icon: '🧠', title: 'Conversational AI Tutor', desc: 'Context-aware hints and step-by-step debugging right inside the editor. Never stuck for more than a minute.', tag: 'Gemini 2.5 Flash' },
  { icon: '🗺️', title: 'Personalised Roadmaps', desc: 'Frontend Mastery, Backend Engineer, DSA Basics — curated learning paths with milestone tracking.', tag: 'AI-Generated' },
  { icon: '💻', title: 'Coding Practice', desc: 'Hands-on challenges at every skill level. LeetCode stats sync, granular progress tracking, time analytics.', tag: 'LeetCode Sync' },
  { icon: '🔬', title: 'DSA Visualizer', desc: 'Watch BFS, DFS, Dijkstra, and sorting algorithms animate live. Play, pause, step-through at your own pace.', tag: 'Interactive' },
  { icon: '🎙️', title: 'Mock Interviews', desc: 'AI-assessed technical and behavioral simulations. Real feedback on communication, correctness, and system design.', tag: 'AI-Assessed' },
  { icon: '💼', title: 'Job Board', desc: 'Live entry-level roles, internships, and junior positions scraped from Adzuna, LinkedIn, Reed, and Indeed.', tag: 'Live Scraping' },
  { icon: '🖼️', title: 'Portfolio Builder', desc: 'Auto-generated developer portfolios from your platform stats. Shareable link, dark/light themes, resume-ready.', tag: 'Auto-Generated' },
  { icon: '🔒', title: 'GitHub + Auth', desc: 'GitHub OAuth for seamless sign-in and project showcasing. JWT-secured sessions with RBAC built in.', tag: 'GitHub OAuth' },
];

const beforeItems = [
  { icon: '😵', title: 'No structure', desc: 'Jumping between random YouTube tutorials, no idea what to learn next.' },
  { icon: '🕳️', title: 'Stuck for hours', desc: 'One bug kills an entire evening. Stack Overflow gives answers, not understanding.' },
  { icon: '📄', title: 'Empty portfolio', desc: '"I know the concepts" doesn\'t land a job. Nothing to show recruiters.' },
  { icon: '😶', title: 'Interview panic', desc: 'Never practiced under pressure. Blanks out the moment the camera turns on.' },
  { icon: '📬', title: '200 applications. Silence.', desc: 'Applying blindly to jobs without knowing what skill gap is causing rejections.' },
];

const afterItems = [
  { icon: '🗺️', title: 'Clear roadmap', desc: 'AI-generated learning path tailored to your goal — frontend, backend, or DSA mastery.' },
  { icon: '🤖', title: 'Unstuck in minutes', desc: 'AI tutor gives you the hint, not the answer. You understand it, not just copy it.' },
  { icon: '🖼️', title: 'Auto-built portfolio', desc: 'Platform stats, projects, and progress auto-generate a shareable developer profile.' },
  { icon: '🎙️', title: 'Interview-ready', desc: 'Practiced 30+ mock sessions. AI feedback on tone, correctness, and system design.' },
  { icon: '✅', title: 'Targeted applications', desc: 'Live job board surfacing roles that match your current skill level. No more guessing.' },
];

const feedItems = [
  { dot: 'feed-gold', text: 'Completed <strong>Binary Search</strong> — solved in 12 min ⚡', time: '2m ago' },
  { dot: 'feed-purple', text: 'AI Tutor session — <strong>Recursion base case</strong> explained', time: '1h ago' },
  { dot: 'feed-green', text: '🎉 Mock Interview #8 — <strong>Score: 82/100</strong>', time: '3h ago' },
  { dot: 'feed-gold', text: 'Portfolio updated — <strong>3 new skills</strong> added automatically', time: 'Yesterday' },
];

const newActivities = [
  { dot: 'feed-purple', text: 'AI Tutor — <strong>Two Sum</strong> walkthrough completed', time: 'Just now' },
  { dot: 'feed-green', text: '🔥 <strong>Day 13 streak!</strong> Keep it up', time: 'Just now' },
  { dot: 'feed-gold', text: 'New job: <strong>React Intern @ Freshworks</strong> · Chennai', time: 'Just now' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const styleInjected = useRef(false);
  const dashRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const xpBarRef = useRef<HTMLDivElement>(null);
  const statProblemsRef = useRef<HTMLDivElement>(null);
  const streakNumRef = useRef<HTMLSpanElement>(null);
  const actIdxRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // Inject CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 60);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.lp4 .reveal').forEach((el) => obs.observe(el));

    // Stagger feature cards
    document.querySelectorAll('.lp4 .feature-card').forEach((card, i) => {
      (card as HTMLElement).style.transitionDelay = i * 60 + 'ms';
    });

    return () => obs.disconnect();
  }, []);

  // Dashboard animations
  const animateCount = useCallback((el: HTMLElement | null, target: number, suffix = '') => {
    if (!el) return;
    let start = 0;
    const duration = 1200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const dashEl = dashRef.current;
    if (!dashEl) return;

    const dashObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate XP bar
            setTimeout(() => {
              if (xpBarRef.current) xpBarRef.current.style.width = '78%';
            }, 300);

            // Stagger feed items
            dashEl.querySelectorAll('.feed-item').forEach((item, i) => {
              const el = item as HTMLElement;
              el.style.opacity = '0';
              el.style.transform = 'translateX(-10px)';
              setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'none';
              }, 500 + i * 200);
            });

            // Animate stats counting up
            setTimeout(() => {
              animateCount(statProblemsRef.current, 47);
              animateCount(streakNumRef.current, 12);
            }, 400);

            // Show notification after delay
            setTimeout(() => {
              notifRef.current?.classList.add('notif-show');
            }, 2200);

            dashObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    dashObserver.observe(dashEl);
    return () => dashObserver.disconnect();
  }, [animateCount]);

  // Periodic new feed item pop-in
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      const feed = feedRef.current;
      if (!feed) return;
      const data = newActivities[actIdxRef.current % newActivities.length];
      actIdxRef.current++;
      const item = document.createElement('div');
      item.className = 'feed-item';
      item.innerHTML = `<span class="feed-dot ${data.dot}"></span><span class="feed-text">${data.text}</span><span class="feed-time">${data.time}</span>`;
      feed.insertBefore(item, feed.firstChild);
      setTimeout(() => item.classList.add('feed-visible'), 50);
      // Remove last item if too many
      const items = feed.querySelectorAll('.feed-item');
      if (items.length > 5) {
        const last = items[items.length - 1] as HTMLElement;
        last.style.opacity = '0';
        setTimeout(() => last.remove(), 500);
      }
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="lp4">
      <div className="grid-bg" />

      {/* NAV */}
      <nav>
        <div className="logo">
          <em className="logo-bolt">⚡</em> EduAI
        </div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#transformation">Compare</a></li>
          <li><a href="#progress">Progress</a></li>
          <li>
            <button className="nav-cta" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />

        <div className="hero-badge">
          ✦ Adaptive · AI-Powered · Career-Ready
        </div>

        <h1>
          From <span className="accent">Zero</span> to<br />
          Hired Engineer<span className="gold">.</span>
        </h1>

        <p className="hero-sub">
          An end-to-end intelligent tutor that teaches DSA, prepares you for interviews,
          surfaces real jobs, and builds your portfolio — all in one platform.
        </p>

        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate('/register')}>
            Start Learning Free
          </button>
          <a href="#features" className="btn-ghost">Explore Features →</a>
        </div>
      </section>

      {/* METRICS */}
      <div className="metrics">
        <div className="metric-item">
          <div className="metric-num">2K<span>+</span></div>
          <div className="metric-label">Concurrent Users</div>
        </div>
        <div className="metric-item">
          <div className="metric-num">8<span>+</span></div>
          <div className="metric-label">Core Modules</div>
        </div>
        <div className="metric-item">
          <div className="metric-num"><span>∞</span></div>
          <div className="metric-label">AI Conversations</div>
        </div>
        <div className="metric-item">
          <div className="metric-num">0<span>→1</span></div>
          <div className="metric-label">Career Progression</div>
        </div>
      </div>

      {/* TERMINAL SECTION */}
      <section className="terminal-section" id="about">
        <div className="terminal-text reveal">
          <div className="section-eyebrow">AI Tutor</div>
          <h2>Your personal mentor,<br />always on.</h2>
          <p className="section-body">
            Ask anything. The AI tutor lives inside your coding environment — offering subtle hints,
            walking you through bugs step-by-step, and generating personalized learning paths.
            Powered by Gemini 2.5 Flash and GPT-4o-mini.
          </p>
        </div>

        <div className="terminal-window reveal">
          <div className="terminal-bar">
            <div className="dot dot-r" />
            <div className="dot dot-y" />
            <div className="dot dot-g" />
            <span className="terminal-title">ed-ai / tutor</span>
          </div>
          <div className="terminal-body">
            <div><span className="t-comment">// Struggling with recursion?</span></div>
            <br />
            <div>
              <span className="t-prompt">›</span>
              <span className="t-keyword">ask</span>
              <span className="t-fn">(</span>
              <span className="t-string">"Why is my DFS infinite?"</span>
              <span className="t-fn">)</span>
            </div>
            <span className="t-response">
              Looks like your base case is missing. When<br />
              &nbsp;&nbsp;node === null, you need to return early.
            </span>
            <br />
            <div>
              <span className="t-prompt">›</span>
              <span className="t-var">hint</span>{' '}
              <span className="t-fn">--step</span>
            </div>
            <span className="t-response">
              Try: <span className="t-string">if (!node) return [];</span><br />
              &nbsp;&nbsp;before the recursive call.
            </span>
            <br />
            <div>
              <span className="t-prompt">›</span>
              <span className="t-fn">generateRoadmap</span>
              <span className="t-fn">(</span>
              <span className="t-string">"DSA Basics"</span>
              <span className="t-fn">)</span>
            </div>
            <span className="t-response">
              Creating your 8-week roadmap... <span className="t-cursor" />
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="features" id="features">
        <div className="features-header reveal">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Platform Modules</div>
          <h2>Everything you need,<br />nothing you don't.</h2>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card reveal" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="before-after-section" id="transformation">
        <div className="ba-header reveal">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>The Difference</div>
          <h2>Two students. Same degree.<br />Very different outcomes.</h2>
        </div>

        <div className="ba-grid reveal">
          {/* BEFORE */}
          <div className="ba-card ba-before">
            <div className="ba-label ba-label-before">Without EduAI</div>
            <div className="ba-items">
              {beforeItems.map((item) => (
                <div className="ba-item" key={item.title}>
                  <span className="ba-icon">{item.icon}</span>
                  <div>
                    <div className="ba-item-title">{item.title}</div>
                    <div className="ba-item-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="ba-divider">
            <div className="ba-divider-line" />
            <div className="ba-divider-icon">⚡</div>
            <div className="ba-divider-line" />
          </div>

          {/* AFTER */}
          <div className="ba-card ba-after">
            <div className="ba-label ba-label-after">With EduAI</div>
            <div className="ba-items">
              {afterItems.map((item) => (
                <div className="ba-item" key={item.title}>
                  <span className="ba-icon">{item.icon}</span>
                  <div>
                    <div className="ba-item-title">{item.title}</div>
                    <div className="ba-item-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PROGRESS TICKER */}
      <section className="progress-section" id="progress">
        <div className="progress-header reveal">
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Real Progress</div>
          <h2>Watch yourself level up.<br />In real time.</h2>
          <p className="section-body" style={{ textAlign: 'center', margin: '16px auto 0', maxWidth: 480 }}>
            This is what your first 30 days on EduAI looks like.
          </p>
        </div>

        <div className="dashboard-mock reveal" ref={dashRef}>
          {/* TOP BAR */}
          <div className="dash-topbar">
            <div className="dash-user">
              <div className="dash-avatar">R</div>
              <div>
                <div className="dash-name">Rahul S.</div>
                <div className="dash-college">PSG College of Technology</div>
              </div>
            </div>
            <div className="dash-streak">
              <span className="streak-fire">🔥</span>
              <span className="streak-num" ref={streakNumRef}>12</span>
              <span className="streak-label">day streak</span>
            </div>
          </div>

          {/* XP BAR */}
          <div className="dash-xp-section">
            <div className="dash-xp-label">
              <span>Level 4 — <span className="xp-title">DSA Explorer</span></span>
              <span className="xp-points">2,340 / 3,000 XP</span>
            </div>
            <div className="dash-xp-track">
              <div className="dash-xp-fill" ref={xpBarRef} style={{ width: '0%' }} />
            </div>
          </div>

          {/* STATS ROW */}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-num" ref={statProblemsRef}>47</div>
              <div className="dash-stat-label">Problems Solved</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num">63<span>%</span></div>
              <div className="dash-stat-label">Roadmap Done</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num">8</div>
              <div className="dash-stat-label">Mock Interviews</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num gold-text">₹0</div>
              <div className="dash-stat-label">Spent on Coaching</div>
            </div>
          </div>

          {/* ACTIVITY FEED */}
          <div className="dash-feed-label">Recent Activity</div>
          <div className="dash-feed" ref={feedRef}>
            {feedItems.map((item, i) => (
              <div className="feed-item feed-visible" key={i}>
                <span className={`feed-dot ${item.dot}`} />
                <span className="feed-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                <span className="feed-time">{item.time}</span>
              </div>
            ))}
          </div>

          {/* NOTIFICATION POP */}
          <div className="dash-notif" ref={notifRef}>
            <span className="notif-icon">🎉</span>
            <div>
              <div className="notif-title">New job match!</div>
              <div className="notif-sub">Junior Dev @ Zoho · Chennai · Entry Level</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner reveal">
        <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Start Today</div>
        <h2>Land your first dev job.<br />We'll help you get there.</h2>
        <p>Join thousands of students already levelling up with Ed-AI.</p>
        <button className="btn-primary" onClick={() => navigate('/register')}>
          Begin Your Journey →
        </button>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-brand">
          <em>⚡</em> EduAI
        </div>
        <ul className="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#transformation">Compare</a></li>
          <li><a href="#progress">Progress</a></li>
          <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
        </ul>
        <div className="footer-copy">© {new Date().getFullYear()} Ed-AI · Built for developers</div>
      </footer>
    </div>
  );
};

export default LandingPage;
