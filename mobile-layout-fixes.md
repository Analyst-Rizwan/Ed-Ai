# EduAI Mobile Layout Fixes

## Bug 1: EduAI Top Banner Overlapping Portfolio Content

**Symptom:** The `⚡ EduAI` bar and action buttons float over form content in the portfolio builder.

**Fix:** Make the top bar `position: fixed` and push content down with matching `padding-top`.

```css
/* Portfolio top bar */
.portfolio-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 56px;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

/* Push content below the fixed bar */
.portfolio-builder-content {
  padding-top: 56px; /* must match top bar height */
  padding-bottom: 80px; /* space for bottom button */
}
```

---

## Bug 2: "Next: Projects →" Button Floating Over Content

**Symptom:** The next step button overlaps form fields instead of sitting anchored at the bottom.

**Fix:** Remove any `absolute`/`fixed` positioning from the button itself, and place it inside a dedicated fixed footer outside the scrollable content.

```css
.next-step-button {
  width: 100%;
  /* Remove any: position: absolute / position: fixed */
}

.portfolio-footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 12px 16px;
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
```

```jsx
// Restructure your JSX like this:
<div className="portfolio-builder-content">
  {/* All form fields go here */}
</div>

{/* Fixed footer — OUTSIDE the scrollable content div */}
<div className="portfolio-footer-bar">
  <button className="next-step-button">Next: Projects →</button>
</div>
```

---

## Bug 3: No Exit / Close Button on Portfolio Builder

**Symptom:** There is no visible back arrow or ✕ button to exit the portfolio builder flow.

**Fix:** Add a back button to the left side of the top bar.

```jsx
<div className="portfolio-top-bar">
  <button
    onClick={() => router.back()}
    className="back-btn"
    aria-label="Exit portfolio builder"
  >
    ←
  </button>

  <span className="logo">⚡ EduAI</span>

  <div className="top-bar-actions">
    <span>● Saved</span>
    {/* other icons */}
  </div>
</div>
```

```css
.back-btn {
  margin-right: 12px;
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
}
```

---

## Bug 4: AI Tutor Split Panel Broken on Mobile

**Symptom:** The conversation sidebar and chat panel render side-by-side on mobile, making both columns too narrow to use.

**Fix:** Hide the sidebar by default on mobile and add a hamburger toggle to show it as an overlay.

```css
.ai-tutor-container {
  display: flex;
  height: 100vh;
}

.ai-tutor-sidebar {
  width: 200px;
  min-width: 200px;
  overflow-y: auto;
}

.ai-tutor-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Mobile: hide sidebar by default */
@media (max-width: 640px) {
  .ai-tutor-sidebar {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 80%;
    z-index: 100;
    background: #1a1a2e;
  }

  .ai-tutor-sidebar.open {
    display: block;
  }

  .ai-tutor-chat {
    width: 100%;
  }
}
```

```jsx
// Add a toggle button in the chat header
const [sidebarOpen, setSidebarOpen] = useState(false);

<div className="ai-tutor-container">
  <div className={`ai-tutor-sidebar ${sidebarOpen ? 'open' : ''}`}>
    {/* Chat history list */}
  </div>

  <div className="ai-tutor-chat">
    <div className="chat-header">
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
      <span>AI Tutor</span>
    </div>
    {/* Chat content */}
  </div>
</div>
```

---

## Bug 5: Bottom Navigation Covering Page Content

**Symptom:** The fixed bottom nav bar sits on top of the last elements on every page, cutting off content.

**Fix:** Add `padding-bottom` to the main content wrapper equal to the bottom nav height. Apply this globally in your layout component so every page benefits automatically.

```css
/* Global fix in your main layout stylesheet */
.main-content {
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
  /* env(safe-area-inset-bottom) handles notched/gesture-bar phones */
}
```

```jsx
// In Layout.jsx or _app.jsx — apply once, fixes all pages
<main className="main-content">
  {children}
</main>
```

If using Tailwind, use `pb-20` (80px) as a starting point and adjust to match your nav's exact height:

```jsx
<main className="pb-20">
  {children}
</main>
```

> **Tip:** Open Chrome DevTools on mobile emulation, inspect your bottom nav, and note its exact `height` value. Use that number for `padding-bottom` to get a pixel-perfect fit.

---

## Summary Table

| # | Issue | Where to Fix | Fix Type |
|---|-------|-------------|----------|
| 1 | EduAI banner overlapping content | Portfolio page CSS | `position: fixed` + `padding-top` on content |
| 2 | "Next: Projects" button floating | Portfolio page JSX + CSS | Move to fixed `bottom: 0` footer div |
| 3 | No exit button on portfolio builder | Portfolio page JSX | Add `←` back button in top bar |
| 4 | AI Tutor sidebar broken on mobile | AI Tutor CSS + JSX | Hide sidebar, add hamburger toggle |
| 5 | Bottom nav covering page content | Global layout CSS | Add `padding-bottom` equal to nav height |
