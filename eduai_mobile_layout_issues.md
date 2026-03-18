# EduAI DSA Visualizer — Mobile Layout Issues

> Audit based on 9 mobile screenshots (192.168.0.104:8080/ds)  
> Device: Android mobile browser | Time of capture: ~01:49–01:52

---

## 🔴 Critical

### 1. Full-Page Horizontal Overflow (All Screens)
The entire app viewport is wider than the device screen. Users can scroll right to reveal hidden content — unintended on a mobile app.

**Root causes:**
- Missing or incorrect viewport meta tag
- Hardcoded `width` in `px` on visualization containers
- SVG/canvas elements with fixed dimensions

**Fix:**
```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
```css
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

---

### 2. Horizontal Tab Bar Overflow (All Screens)
The top tab row clips tab labels mid-text (`"Dynam..."`, `"KMP Searc..."`). No scroll indicator is shown, so users won't know more tabs exist beyond the visible area.

**Fix:**
```css
.tab-bar {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* hide scrollbar visually */
}
```

---

### 3. Graph Controls Panel Cut Off on Left Edge (Images 4, 5 — Graph Tab)
Labels like `"GORITHM"`, `"ART NODE"`, `"ID NODE (TARGET)"`, `"SPEED"` are all clipped on the left. The entire controls panel is shifted off-screen to the left.

**Fix:** Check for negative `margin-left`, `translateX`, or `left` offset on the panel container. Ensure `padding-left` accounts for safe area insets.

---

## 🟠 Major

### 4. SVG/Canvas ViewBox Not Responsive (Images 1, 2, 4, 5)
Graph canvas and sorting bar chart have hardcoded dimensions. The SVG viewBox is wider than the screen; bars and nodes are clipped at the right edge.

**Fix:**
```css
svg, canvas {
  width: 100%;
  max-width: 100%;
  height: auto;
}
```
```html
<svg
  viewBox="0 0 800 400"
  preserveAspectRatio="xMidYMid meet"
  style="width: 100%; height: auto;"
>
```

---

### 5. LOG Section Too Small / Barely Visible (Images 1, 2, 6, 7, 8, 9)
The LOG area renders as a very thin, nearly invisible strip. On mobile it needs more height or a proper expandable/scrollable panel.

**Fix:**
```css
.log-panel {
  min-height: 48px;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px 12px;
}
```

---

### 6. KMP / LPS Table Overflows Page Width (Images 8, 9)
The LPS failure table and TEXT character rows have fixed-width cells. Collectively they overflow the screen and push the **entire page** wider instead of scrolling within the component.

**Fix:**
```css
.lps-table-container,
.kmp-text-row {
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}
```

---

### 7. KMP Pattern Row Misaligned with Text Row (Images 8, 9)
The sliding pattern row doesn't stay visually anchored below its corresponding text index — alignment breaks when the view is scrolled or when the pattern shifts position.

**Fix:** Use a shared grid or `position: relative` container so both rows share the same cell width and stay in sync horizontally.

---

### 8. Merge Step Card Overlaps Footer Controls (Image 3)
The "Merge Step" modal/card stacks on top of the Back/Next controls, which in turn overlap the bottom nav bar — three layers competing for the same vertical space at the bottom.

**Fix:** Give the modal a `max-height` with scroll, and add `padding-bottom` equal to the combined height of the step controls + bottom nav bar.

---

## 🟡 Moderate

### 9. Bottom Nav Bar Has No Safe-Area Inset (Multiple Screens)
The fixed bottom nav (Roadmaps / Practice / Code Viz / Jobs / Portfolio) has no safe-area padding. Content scrolls behind it without a proper inset.

**Fix:**
```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}

.main-content {
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 16px));
}
```

---

### 10. Sorting Visualization Has Excessive Dead Space (Images 1, 2)
The bar chart floats in a large black void with no defined container height — the area above the bars is unnecessarily large on mobile.

**Fix:** Set an explicit `height` or `aspect-ratio` on the visualization container so it doesn't expand to fill unused vertical space.

---

### 11. Hash Table Index Badges Inconsistent Size (Images 6, 7)
The index badge squares (0–7) are visually smaller than the adjacent "empty" content cells, making the table look misaligned.

**Fix:**
```css
.hash-index-badge,
.hash-cell {
  height: 48px;
  line-height: 48px;
  display: flex;
  align-items: center;
}
```

---

### 12. Speed Selector Buttons Uneven Width (Image 8)
In the KMP screen, "Fast" appears selected but the three speed buttons (Slow / Normal / Fast) have unequal widths, making the group look unbalanced.

**Fix:**
```css
.speed-btn-group button {
  flex: 1;
}
```

---

## 🟢 Minor / Polish

### 13. "Learn [X]" Gold Button Bottom Margin Too Tight (Images 1, 3, 7)
The gold CTA button touches the next section label with insufficient spacing — needs consistent `margin-bottom`.

---

### 14. Graph Node Labels Obscured (Images 4, 5)
Node labels inside circles appear slightly clipped — circle radius may be too small for the font size at mobile scale.

---

### 15. Status Bar Text Low Contrast (Images 1, 2)
The bottom status text (`"Pick an algorithm and press Run — 0 compares : 0 swaps n=16"`) is very small and low-contrast against the dark background — fails mobile readability standards (WCAG AA requires 4.5:1 contrast ratio for small text).

---

### 16. Notification Bell Conflicts with Tab Row (All Screens)
The bell icon with red dot floats over the top-right and visually overlaps the scrollable tab row, creating an unintended z-index conflict.

---

## 📋 Recommended Fix Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| 🔴 P0 | Viewport meta tag | 1 line |
| 🔴 P0 | `overflow-x: hidden` on body | 2 lines |
| 🔴 P0 | SVG responsive viewBox | Low |
| 🔴 P0 | Graph controls left clip | Low |
| 🔴 P0 | Tab bar horizontal scroll | Low |
| 🟠 P1 | KMP table component scroll | Low |
| 🟠 P1 | LOG panel min-height | Low |
| 🟠 P1 | Bottom nav safe-area inset | Low |
| 🟠 P1 | Merge step card overlap | Medium |
| 🟡 P2 | Sorting dead space | Low |
| 🟡 P2 | Hash table badge sizing | Low |
| 🟡 P2 | Speed button equal width | 1 line |
| 🟢 P3 | Polish items (13–16) | Low |
