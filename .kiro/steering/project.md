# Expense & Budget Visualizer — Project Steering

## Application Purpose

A client-side expense tracking and budget visualization web app. Users can log daily spending transactions, view a doughnut chart breakdown by category, set a monthly spending limit with a progress indicator, and persist all data in the browser via Local Storage — no server required.

---

## Technology Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Markup      | HTML5 (semantic elements, ARIA attributes)       |
| Styling     | CSS3 (custom properties, flexbox, media queries) |
| Logic       | Vanilla JavaScript (ES6+), no frameworks         |
| Chart       | Chart.js 4.4.4 via jsDelivr CDN                  |
| Fonts       | Inter (Google Fonts CDN)                         |
| Persistence | Browser `localStorage` only                      |
| Hosting     | Static — GitHub Pages compatible                 |

**No React, Vue, Angular, or any frontend framework.**  
**No backend server, no API endpoints, no build tools.**

---

## Project Structure

```
project-ccse - Copy/
├── index.html          ← Single entry point
├── css/
│   └── style.css       ← One CSS file (do not split)
├── js/
│   └── script.js       ← One JS file (do not split)
└── .kiro/
    └── steering/
        └── project.md  ← This file
```

- `index.html` loads `css/style.css` and `js/script.js` via relative paths.
- Chart.js and Inter are loaded via CDN `<script>`/`<link>` tags in `index.html`.

---

## Features Implemented

### MVP
- **Add Transaction** — Item Name, Amount (Rp), Category (Food / Transport / Fun)
- **Transaction List** — scrollable, with category color dot, formatted Rupiah amount
- **Delete Transaction** — per-item delete button (event delegation)
- **Total Spending** — auto-calculated and displayed prominently
- **Spending Distribution Chart** — doughnut chart (Chart.js), updates on every change
- **Local Storage** — transactions, theme preference, and spending limit all persisted

### Optional / Extended Features
- **Monthly Spending Limit** — editable, stored in `localStorage`, progress bar with color states (green/warning/danger)
- **Dark / Light Theme Toggle** — `data-theme` attribute on `<html>`, persisted
- **Sort Transactions** — newest / oldest / highest / lowest
- **Toast Notifications** — brief feedback on add/delete/limit actions
- **Form Validation** — inline field errors with visual error state
- **XSS Protection** — `escapeHtml()` used on all user-provided strings before DOM insertion
- **Responsive Design** — mobile-first, breakpoints at 768 px and 1024 px, edge case at 360 px
- **Accessibility** — ARIA labels, `role="list"`, `.sr-only`, `focus-visible` outlines, `aria-live` toast

---

## Local Storage Keys

| Key                    | Type    | Content                        |
|------------------------|---------|--------------------------------|
| `expenseTransactions`  | JSON    | Array of transaction objects   |
| `expenseTheme`         | string  | `"light"` or `"dark"`          |
| `expenseLimit`         | string  | Numeric string (Rupiah amount) |

Transaction object shape:
```json
{
  "id": "string (Date.now().toString(36) + random)",
  "itemName": "string",
  "amount": "number (positive integer)",
  "category": "Food | Transport | Fun",
  "date": "ISO 8601 string"
}
```

---

## Coding Conventions

- **No build step** — all code is plain HTML/CSS/JS, runs directly in-browser.
- **DOM references** — collected once in the `dom` object at file top; never re-queried.
- **Single responsibility** — each function handles one concern (load, save, render, validate, etc.).
- **Event delegation** — delete buttons use a single listener on `#transactionList`, not per-item.
- **Error-safe localStorage** — all reads/writes wrapped in try/catch with `isLocalStorageAvailable()` guard.
- **Formatting** — Rupiah via `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.
- **CSS variables** — all colors and spacing via `:root` custom properties; dark theme overrides in `[data-theme="dark"]`.
- **No inline styles** in HTML — all visual state driven by class toggles (`.hidden`, `.input-error`, `.warning`, `.danger`).

---

## Assignment Constraints

- One CSS file: `css/style.css`
- One JS file: `js/script.js`
- No external CSS framework (Bootstrap, Tailwind, etc.)
- No JavaScript framework or library except Chart.js (via CDN)
- No backend, no Node.js server, no build pipeline
- Must work as a fully static site on GitHub Pages
- Entry point must be `index.html` at the repository root

---

## Deployment Checklist

- [x] `index.html` at repository root
- [x] All asset paths are relative (no `localhost`, no absolute filesystem paths)
- [x] CSS loaded via `<link rel="stylesheet" href="css/style.css">`
- [x] JS loaded via `<script src="js/script.js">` (deferred by placement before `</body>`)
- [x] Chart.js loaded from jsDelivr CDN (no self-hosted copy needed)
- [x] No secrets, API keys, or credentials in any file
- [x] No server-side code or build artifacts
- [x] Compatible with GitHub Pages static hosting

---

## Kiro Session Notes

- Project was developed outside Kiro IDE and opened as an existing project.
- Source code is preserved as-is; Kiro is used for maintenance, audit, and incremental improvement only.
- Do not restructure files, rename folders, or split CSS/JS without an explicit assignment requirement change.
- Do not add frameworks, package managers, or build tools.
