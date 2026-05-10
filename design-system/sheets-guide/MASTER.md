# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/sheets-guide/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Sheets Guide
**Generated:** 2026-05-09 (synthesized from ui-ux-pro-max + project-specific overrides)
**Category:** Productivity / Educational Tool (desktop-first web app, paired with Google Sheets)

---

## Global Rules

### Mode

Dark-first, with a fully supported light mode. Reason: the user runs this app side-by-side with Google Sheets (bright white). A dark workspace reduces eye fatigue during long study sessions and creates clear visual separation between the teaching surface and the practice surface.

### Color Palette

All colors are exposed as CSS variables and Tailwind tokens. Component code never references raw hex.

| Role | Dark | Light | CSS Variable |
|------|------|-------|--------------|
| Background | `#0a0a0c` | `#ffffff` | `--color-bg` |
| Surface | `#111114` | `#fafafa` | `--color-surface` |
| Surface Elevated | `#17171b` | `#ffffff` | `--color-surface-elevated` |
| Foreground | `#ededef` | `#0f172a` | `--color-fg` |
| Foreground Muted | `#8a8f98` | `#64748b` | `--color-fg-muted` |
| Border | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | `--color-border` |
| Accent | `#5e6ad2` | `#4f46e5` | `--color-accent` |
| On Accent | `#ffffff` | `#ffffff` | `--color-on-accent` |
| Success | `#10b981` | `#059669` | `--color-success` |
| Warning | `#f59e0b` | `#d97706` | `--color-warning` |
| Danger | `#ef4444` | `#dc2626` | `--color-danger` |
| Ring (focus) | `#5e6ad2` | `#4f46e5` | `--color-ring` |

**Color rules:**
- All foreground/background pairs verified to meet WCAG AA 4.5:1.
- Status colors (success/warning/danger) must always be paired with an icon or text label. Never convey meaning by color alone.
- Avoid pure `#000000` backgrounds (smear/glare on OLED).
- No gradients on functional surfaces. Solid fills only.

### Typography

Two-font system: a humanist sans for all UI and lesson body, a monospace for formulas, cell references, and Apps Script code.

- **Sans (UI + body):** Inter
- **Mono (formulas + code):** JetBrains Mono

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

**Type scale (rem, 16px root):**

| Token | Size | Line height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px (0.75rem) | 1.4 | Labels, metadata |
| `text-sm` | 14px (0.875rem) | 1.5 | Secondary text, table cells |
| `text-base` | 16px (1rem) | 1.6 | Body text, lesson content |
| `text-lg` | 18px (1.125rem) | 1.5 | Lesson lead, callouts |
| `text-xl` | 24px (1.5rem) | 1.3 | Section headings |
| `text-2xl` | 32px (2rem) | 1.2 | Page titles |

**Typography rules:**
- Tabular figures enabled (`font-variant-numeric: tabular-nums`) for cell coordinates, scores, and any aligned numeric data.
- Letter-spacing left at platform defaults. Tight tracking (-0.5 or lower) only on `text-2xl`.
- Body reading width capped at 70 characters (`max-w-prose` or equivalent).
- Mono used for: cell refs (`B5`), formulas (`=VLOOKUP(A2, $D$2:$E$100, 2, FALSE)`), Apps Script blocks, error messages from Sheets.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps inside controls |
| `--space-sm` | `8px` | Icon-to-text gaps, inline spacing |
| `--space-md` | `16px` | Standard padding, form gaps |
| `--space-lg` | `24px` | Card padding, section internal spacing |
| `--space-xl` | `32px` | Section gaps |
| `--space-2xl` | `48px` | Page section margins |
| `--space-3xl` | `64px` | Page top/bottom padding |

Strict 4/8 grid. Never use arbitrary values (`p-[13px]`, etc.) outside design tokens.

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Inputs, small buttons, badges |
| `--radius-md` | `10px` | Cards, primary buttons |
| `--radius-lg` | `14px` | Modals, elevated panels |

### Elevation

Single elevation step. Avoid stacking arbitrary shadows.

| Token | Dark | Light |
|-------|------|-------|
| `--elevation-1` | `0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06)` | `0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)` |

Modals get the same `--elevation-1` plus a backdrop scrim of `rgba(0,0,0,0.5)`.

---

## Component Specs

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 120ms ease, transform 120ms ease;
}
.btn-primary:hover { opacity: 0.92; }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Secondary */
.btn-secondary {
  background: transparent;
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.btn-secondary:hover { background: var(--color-surface-elevated); }
.btn-secondary:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }

/* Destructive */
.btn-destructive {
  background: var(--color-danger);
  color: white;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-weight: 600;
}
```

Touch targets: minimum 44px hit area. If the visual button is shorter, expand the hit area with padding.

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}
.card-elevated {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--elevation-1);
}
```

No hover lift on static cards. Lift only on cards that act as links or buttons.

### Inputs

```css
.input {
  background: var(--color-surface-elevated);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.input:focus-visible {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.25);
}
.input[aria-invalid="true"] { border-color: var(--color-danger); }
```

Label always visible above the input, never placeholder-only. Error message appears below the input, with `role="alert"`.

### Code Block (formulas, Apps Script)

```css
.code-block {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-md);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  position: relative;
}
.code-block .copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}
```

Every code block gets a one-click copy button (cell references, formulas, Apps Script samples).

### Modals

```css
.modal-scrim {
  background: rgba(0, 0, 0, 0.5);
}
.modal {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  max-width: 560px;
  width: 90%;
  box-shadow: var(--elevation-1);
}
```

Close affordance always visible (X in top-right plus `Esc` shortcut). Confirm before dismissing if unsaved changes exist.

---

## Style Guidelines

**Style:** Modern Dark Workspace (synthesized from "Modern Dark Cinema" + "Dark Mode (OLED)" with desktop-web adaptations)

**Keywords:** minimal, professional, content-rich, dark-first, hairline borders, single elevation step, indigo accent, no glassmorphism, no gradients on functional surfaces.

**Best For:** desktop productivity tools, learning workspaces, code-adjacent interfaces.

**Key Effects:** subtle press feedback (`scale(0.98)` 120ms), opacity dip on hover (0.92), focus rings always visible, skeleton loaders for >300ms operations.

### Page Pattern

**Pattern Name:** App Shell (workspace, not landing)

Three-zone layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Bar: lesson title │ progress │ open sheet │ theme │ menu    │
├──────────────┬──────────────────────────────┬──────────────────┤
│              │                              │                  │
│  Left        │  Main Content                │  Right Rail      │
│  Sidebar     │                              │  (optional)      │
│              │  - Lesson body               │                  │
│  Curriculum  │  - Assignment description    │  - Formula ref   │
│  tree +      │  - Open in Sheets button     │  - Hint history  │
│  progress    │  - Grade my work panel       │  - AI tutor chat │
│              │  - Feedback                  │    (later)       │
│              │                              │                  │
└──────────────┴──────────────────────────────┴──────────────────┘
```

- One primary CTA per screen, styled with `--color-accent`. Secondary actions visually subordinate.
- Sidebar can collapse to icon-only on viewports below 1024px.
- Right rail is hidden by default and toggled by the user.

### Layout Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `sm` | 640px | Single-column, sidebar becomes drawer |
| `md` | 768px | Sidebar collapsible to icons |
| `lg` | 1024px | Sidebar fixed, main content full |
| `xl` | 1280px | Right rail can open alongside main |
| `2xl` | 1536px | Comfortable max content width (~960px main) |

This is a desktop-first app, but should remain usable down to 768px (tablet) for occasional phone reading. Active assignments expect a real keyboard.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Newsletter / Feature-Rich Showcase / landing-page patterns** — wrong shape for a working app.
- ❌ **Comic Neue / Baloo 2 / kids-education fonts** — wrong tone for a working professional.
- ❌ **Flat Mobile (Touch-First) style** — wrong platform, wrong density.
- ❌ **Cyberpunk / neon dark** — accessibility-limited, tonally wrong.
- ❌ **Glassmorphism / heavy blur effects** — generic-AI design tell, hurts perf, loses focus on content.
- ❌ **Gradient-and-glow accents on functional surfaces** — flagged by user CLAUDE.md as the AI-design giveaway.
- ❌ **Emojis as icons** — use Lucide or Heroicons SVGs.
- ❌ **Layout-shifting hovers** (animating width/height/top/left).
- ❌ **Placeholder-only labels.**
- ❌ **Color-only meaning** for status (always pair with icon or text).
- ❌ **Random per-screen hex values** — only semantic tokens.
- ❌ **Decorative-only animation** — every motion must convey cause and effect.
- ❌ **Confirmation dialogs that read "Are you sure?"** — state what will happen and what to type to confirm.
- ❌ **Toasts that steal focus.**

---

## Pre-Delivery Checklist

Before merging any UI code, verify:

### Visual Quality
- [ ] No emojis used as icons (Lucide or Heroicons only)
- [ ] All icons from the same family, consistent stroke weight (1.5px default)
- [ ] No raw hex values in component code; only semantic tokens
- [ ] No glassmorphism, no gradients on functional surfaces
- [ ] Pressed states use opacity or `scale(0.98)`, no layout shift

### Interaction
- [ ] All interactive elements provide hover, focus, and active feedback
- [ ] Touch targets ≥44×44px (use padding or `hitSlop`-equivalent)
- [ ] Micro-interactions in 120–300ms range
- [ ] Disabled states visually clear (opacity 0.4, `cursor: not-allowed`)
- [ ] Focus rings visible and use `--color-ring`
- [ ] Tab order matches visual order
- [ ] After grading, focus auto-moves to first incorrect cell reference in feedback

### Forms & Feedback
- [ ] Every input has a visible label (not placeholder-only)
- [ ] Errors shown inline below the field with `role="alert"`
- [ ] Loading >300ms uses skeleton, not spinner
- [ ] Toasts use `aria-live="polite"`, do not steal focus
- [ ] Destructive actions confirmed; confirmation states the action explicitly

### Light/Dark Mode
- [ ] Both themes designed and tested
- [ ] Primary text contrast ≥4.5:1 in both modes
- [ ] Secondary text contrast ≥3:1 in both modes
- [ ] Borders, dividers, and state colors readable in both modes
- [ ] Theme toggle persists per user

### Layout
- [ ] Verified at 768px, 1024px, 1280px, 1440px
- [ ] No horizontal scroll
- [ ] Body text reading width capped at ~70 characters
- [ ] Sidebar/right rail collapse logic works at all breakpoints
- [ ] Fixed elements reserve safe padding for underlying content

### Accessibility
- [ ] All meaningful images/icons have descriptive `alt` or `aria-label`
- [ ] Form fields have labels, hints, and clear recovery paths on errors
- [ ] Color is not the only indicator for status, validation, or hierarchy
- [ ] `prefers-reduced-motion` respected (disable scale/opacity animations)
- [ ] Keyboard shortcuts documented and discoverable
- [ ] Code blocks readable by screen readers (proper `<pre><code>` semantics)
