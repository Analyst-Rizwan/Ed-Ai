// frontend/src/lib/portfolioPreview.ts
// Generates a complete standalone HTML document for the portfolio preview iframe.

import type { PortfolioState } from "@/hooks/usePortfolioState";
import { THEMES } from "@/hooks/usePortfolioState";

export function generatePortfolioHTML(state: PortfolioState): string {
    const name = state.name || "Your Name";
    const title = state.title || "Developer";
    const bio = state.bio || "";
    const location = state.location || "";
    const email = state.email || "";
    const github = state.github || "";
    const linkedin = state.linkedin || "";
    const tagline = state.tagline || "";

    const t = THEMES[state.theme] || THEMES.dark;
    const accentColor = state.accent || t.accent;
    const fontName = state.font || t.font;
    const fontUrl =
        fontName === "Space Mono" ? "Space+Mono:wght@400;700" :
            fontName === "Playfair Display" ? "Playfair+Display:wght@400;700" :
                fontName === "Sora" ? "Sora:wght@400;600;700" :
                    "DM+Sans:wght@400;500;600";

    const allSkills = Object.values(state.skills).flat().filter(Boolean);

    const fontStack = fontName === "Space Mono" ? "monospace" :
        fontName === "Playfair Display" ? "serif" : "sans-serif";

    const animCSS = state.animation !== "None" ? `
@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
.animate{animation:fadeUp .5s ease both;}
.a1{animation-delay:.1s;} .a2{animation-delay:.2s;} .a3{animation-delay:.3s;} .a4{animation-delay:.4s;} .a5{animation-delay:.5s;}
` : "";

    const animClass = state.animation !== "None" ? "animate" : "";

    // ── Projects HTML ──
    const projectsHTML = state.sections.projects && state.projects.length > 0 ? `
<section id="projects">
  <div class="container">
    <div class="section-header">
      <div class="section-label">Work</div>
      <h2>Featured Projects</h2>
    </div>
    <div class="projects-grid">
      ${state.projects.map((p, i) => `
      <div class="project-card-p ${animClass ? `${animClass} a${(i % 5) + 1}` : ""}">
        ${p.featured ? `<div class="featured-badge">★ Featured</div>` : ""}
        <div class="project-emoji">${p.emoji}</div>
        <div class="project-name">${p.name}</div>
        <div class="project-desc">${p.desc}</div>
        ${p.impact ? `<div class="project-impact">✦ ${p.impact}</div>` : ""}
        <div class="project-tech">${p.tech.map(t => `<span>${t}</span>`).join("")}</div>
        <div class="project-links">
          ${p.url ? `<a href="${p.url}" target="_blank">↗ Live</a>` : ""}
          ${p.github ? `<a href="${p.github}" target="_blank">⬡ Code</a>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>` : "";

    // ── Skills HTML ──
    const skillsHTML = state.sections.skills && allSkills.length > 0 ? `
<section id="skills">
  <div class="container">
    <div class="section-header">
      <div class="section-label">Arsenal</div>
      <h2>Skills & Technologies</h2>
    </div>
    <div class="skills-grid">
      ${Object.entries(state.skills).filter(([, v]) => v.length > 0).map(([group, skills]) => `
      <div>
        <div class="skill-group-name">${group}</div>
        <div class="skill-tags">${skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}</div>
      </div>`).join("")}
    </div>
  </div>
</section>` : "";

    // ── Experience HTML ──
    const experienceHTML = state.sections.experience && state.experience.length > 0 ? `
<section id="experience">
  <div class="container">
    <div class="section-header">
      <div class="section-label">Journey</div>
      <h2>Experience & Education</h2>
    </div>
    <div class="timeline">
      ${state.experience.map((e, i) => `
      <div class="timeline-item ${animClass ? `${animClass} a${(i % 5) + 1}` : ""}">
        <div class="timeline-icon">${e.emoji}</div>
        <div class="timeline-content">
          <div class="timeline-role">${e.role}</div>
          <div class="timeline-org">${e.org}</div>
          <div class="timeline-period">${e.period}</div>
          <div class="timeline-desc">${e.desc}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>` : "";

    // ── Contact HTML ──
    const contactHTML = state.sections.contact ? `
<section id="contact">
  <div class="container">
    <div class="section-header">
      <div class="section-label">Connect</div>
      <h2>Get In Touch</h2>
    </div>
    <div class="contact-grid">
      ${email ? `<a href="mailto:${email}" class="contact-item"><div class="contact-icon">✉</div><div><div class="contact-label">Email</div><div class="contact-value">${email}</div></div></a>` : ""}
      ${github ? `<a href="https://github.com/${github}" target="_blank" class="contact-item"><div class="contact-icon">⬡</div><div><div class="contact-label">GitHub</div><div class="contact-value">@${github}</div></div></a>` : ""}
      ${linkedin ? `<a href="${linkedin}" target="_blank" class="contact-item"><div class="contact-icon">in</div><div><div class="contact-label">LinkedIn</div><div class="contact-value">View Profile →</div></div></a>` : ""}
      ${location ? `<div class="contact-item" style="cursor:default;"><div class="contact-icon">📍</div><div><div class="contact-label">Location</div><div class="contact-value">${location}</div></div></div>` : ""}
    </div>
  </div>
</section>` : "";

    // ── Hero HTML ──
    const heroHTML = state.sections.hero ? `
<div class="container">
  <div class="hero ${animClass ? `${animClass} a1` : ""}">
    <div class="hero-avatar">${state.avatar}</div>
    <h1>Hi, I'm <span>${name.split(" ")[0]}</span> 👋</h1>
    <div class="hero-title">${title}</div>
    <div class="hero-bio">${bio}</div>
    ${tagline ? `<div class="hero-tagline">${tagline}</div>` : ""}
    <div class="hero-links">
      ${email ? `<a href="mailto:${email}" class="hero-btn hero-btn-primary">✉ Get in touch</a>` : ""}
      ${github ? `<a href="https://github.com/${github}" target="_blank" class="hero-btn hero-btn-ghost">⬡ GitHub</a>` : ""}
      ${linkedin ? `<a href="${linkedin}" target="_blank" class="hero-btn hero-btn-ghost">in LinkedIn</a>` : ""}
    </div>
    ${location ? `<div style="margin-top:16px;font-size:12px;color:var(--muted);">📍 ${location}</div>` : ""}
  </div>
</div>` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=${fontUrl}&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:${t.bg};--surface:${t.surface};--card:${t.card};
  --text:${t.text};--muted:${t.muted};--border:${t.border};
  --accent:${accentColor};
  --font:'${fontName}',${fontStack};
}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:var(--font);line-height:1.6;}
a{color:var(--accent);text-decoration:none;}
a:hover{text-decoration:underline;}
.container{max-width:860px;margin:0 auto;padding:0 24px;}
nav{position:sticky;top:0;z-index:100;background:var(--surface);border-bottom:1px solid var(--border);backdrop-filter:blur(12px);}
.nav-inner{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;max-width:860px;margin:0 auto;}
.nav-logo{font-weight:700;font-size:16px;color:var(--accent);font-family:var(--font);}
.nav-links{display:flex;gap:24px;}
.nav-links a{font-size:13px;color:var(--muted);transition:color .15s;}
.nav-links a:hover{color:var(--text);text-decoration:none;}
.hero{padding:80px 0 60px;text-align:center;}
.hero-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${accentColor}44,${accentColor}22);border:2px solid ${accentColor}44;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 20px;}
.hero h1{font-size:clamp(28px,5vw,44px);font-weight:700;margin-bottom:10px;line-height:1.2;}
.hero h1 span{color:var(--accent);}
.hero-title{font-size:16px;color:var(--muted);margin-bottom:16px;}
.hero-bio{font-size:15px;color:var(--muted);max-width:540px;margin:0 auto 24px;line-height:1.75;}
.hero-tagline{font-size:13px;color:var(--muted);margin-bottom:28px;opacity:.8;}
.hero-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.hero-btn{padding:10px 20px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;}
.hero-btn-primary{background:var(--accent);color:#fff;box-shadow:0 4px 20px ${accentColor}44;}
.hero-btn-primary:hover{opacity:.9;transform:translateY(-1px);text-decoration:none;}
.hero-btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border);}
.hero-btn-ghost:hover{border-color:var(--accent);color:var(--accent);text-decoration:none;}
section{padding:60px 0;border-top:1px solid var(--border);}
.section-header{display:flex;align-items:center;gap:12px;margin-bottom:32px;}
.section-label{font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.12em;}
h2{font-size:24px;font-weight:700;}
.projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
.project-card-p{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;transition:all .2s;position:relative;overflow:hidden;}
.project-card-p::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,${accentColor}08,transparent);opacity:0;transition:opacity .2s;}
.project-card-p:hover{border-color:${accentColor}44;transform:translateY(-3px);box-shadow:0 8px 32px ${accentColor}22;}
.project-card-p:hover::before{opacity:1;}
.project-emoji{font-size:28px;margin-bottom:12px;}
.project-name{font-size:16px;font-weight:700;margin-bottom:8px;}
.project-desc{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:12px;}
.project-impact{font-size:12px;color:var(--accent);margin-bottom:12px;font-weight:500;}
.project-tech{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.project-tech span{padding:3px 9px;border-radius:100px;font-size:11px;background:${accentColor}18;color:var(--accent);border:1px solid ${accentColor}33;}
.project-links{display:flex;gap:8px;}
.project-links a{font-size:12px;padding:5px 12px;border-radius:8px;border:1px solid var(--border);color:var(--muted);transition:all .15s;}
.project-links a:hover{border-color:var(--accent);color:var(--accent);text-decoration:none;}
.featured-badge{position:absolute;top:14px;right:14px;font-size:10px;padding:2px 8px;border-radius:100px;background:${accentColor}22;color:var(--accent);border:1px solid ${accentColor}44;}
.skills-grid{display:flex;flex-direction:column;gap:16px;}
.skill-group-name{font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;}
.skill-tags{display:flex;flex-wrap:wrap;gap:8px;}
.skill-tag{padding:6px 14px;border-radius:100px;font-size:13px;background:var(--card);border:1px solid var(--border);color:var(--muted);transition:all .15s;}
.skill-tag:hover{border-color:${accentColor}44;color:var(--text);}
.timeline{display:flex;flex-direction:column;gap:24px;}
.timeline-item{display:flex;gap:20px;}
.timeline-icon{width:40px;height:40px;border-radius:50%;background:${accentColor}18;border:1px solid ${accentColor}33;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;margin-top:4px;}
.timeline-content{flex:1;}
.timeline-role{font-size:16px;font-weight:700;margin-bottom:3px;}
.timeline-org{font-size:14px;color:var(--accent);margin-bottom:3px;}
.timeline-period{font-size:12px;color:var(--muted);margin-bottom:8px;font-family:${fontName === "Space Mono" ? "Space Mono" : "inherit"},monospace;}
.timeline-desc{font-size:13px;color:var(--muted);line-height:1.65;}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
.contact-item{display:flex;align-items:center;gap:12px;padding:16px;border-radius:14px;background:var(--card);border:1px solid var(--border);transition:all .15s;text-decoration:none;}
.contact-item:hover{border-color:${accentColor}44;transform:translateY(-2px);text-decoration:none;}
.contact-icon{font-size:20px;}
.contact-label{font-size:11px;color:var(--muted);}
.contact-value{font-size:13px;font-weight:500;color:var(--text);}
footer{padding:32px 0;text-align:center;border-top:1px solid var(--border);font-size:12px;color:var(--muted);}
footer span{color:var(--accent);}
${animCSS}
${state.customCSS}
</style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <div class="nav-logo">${name.split(" ")[0].toLowerCase()}.<span style="color:var(--muted);">dev</span></div>
    <div class="nav-links">
      ${state.sections.projects ? `<a href="#projects">Projects</a>` : ""}
      ${state.sections.skills ? `<a href="#skills">Skills</a>` : ""}
      ${state.sections.experience ? `<a href="#experience">Experience</a>` : ""}
      ${state.sections.contact ? `<a href="#contact">Contact</a>` : ""}
    </div>
  </div>
</nav>

${heroHTML}
${projectsHTML}
${skillsHTML}
${experienceHTML}
${contactHTML}

<footer>
  <div class="container">
    Built with <span>♥</span> by ${name} · Deployed via <span>GitHub Actions</span>
  </div>
</footer>

</body></html>`;
}

export function generateDeployWorkflow(): string {
    return `name: Deploy Portfolio

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;
}
