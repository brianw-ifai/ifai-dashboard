# intofocus.ai — Design Scrape

Scraped 2026-09-14 from the live site. Astro build, no inline styles, no Google Fonts.

Sources (all values below are copied from these files, not estimated):

| File | Loaded on |
|---|---|
| `/_astro/BaseLayout.D2lCn8KL.css` (47 KB) | every page |
| `/_astro/index.CCM4AXRX.css` (20 KB) | `/` |
| `/_astro/index.DQHYjKW1.css` (14 KB) | `/ai-project-desk/` |
| `/_astro/index.CDXOxFSE.css` (33 KB) | `/modules/aeo-consensus-control/` |

Pages crawled: `/`, `/ai-project-desk/`, `/contact/`, `/faq/`, `/modules/`, `/modules/aeo-consensus-control/`, `/privacy/`.
`<meta name="theme-color" content="#0B1220">` on every page.

---

## 1. Fonts

| Role | Stack | Where |
|---|---|---|
| **Everything** | `Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif` | `body`; buttons/inputs use `font: inherit` |
| **Monospace accents** | `ui-monospace, SFMono-Regular, Menlo, monospace` | AEO module page only: `.aeo-eyebrow`, `.proof-tag`, `.proof-plate em`, `.proof-pips small` |

- Inter is **self-hosted** via `@font-face` (`/_astro/inter-latin-400-normal.*.woff2` + `.woff`), `font-display: swap`.
- Weights shipped: **400, 500, 600, 700, 800** (each with latin, latin-ext, cyrillic, cyrillic-ext, greek, vietnamese, and a symbols subset).
- Weights used in CSS (count): 700 ×39 · 800 ×27 · 600 ×12 · 500 ×12 · 400 ×10 · 900 ×7 · 650 ×7 · 850 ×1 · 750 ×1
  (900/850/750/650 aren't shipped; the browser picks the nearest shipped weight.)
- Body: `line-height: 1.6`, `text-rendering: optimizeLegibility`.

---

## 2. Design tokens (`:root`, BaseLayout.css)

### Brand colors
| Token | Value | Use |
|---|---|---|
| `--color-midnight` | `#0b1220` | dark bands, primary text on sky buttons, theme color |
| `--color-sky` | `#38bdf8` | primary CTA bg, accents on dark, eyebrows on dark |
| `--color-indigo` | `#4f46e5` | eyebrows on light, links/CTAs in header, table highlight, focus |
| `--color-amber` | `#f59e0b` | rare accent (AEO monospace eyebrow, warning chip) |
| `--color-ink` | `#111827` | primary text on light |
| `--color-gray` | `#6b7280` | secondary text / card body |
| `--color-fog` | `#f9fafb` | page background |
| `--color-white` | `#fff` | cards |
| `--color-line` | `#0f172a1a` | default hairline border (slate-900 @ 10%) |

### Light surfaces
| Token | Value |
|---|---|
| `--light-0` | `#fff` |
| `--light-1` | `#f9fafb` |
| `--light-2` | `#f3f4f6` |
| `--light-card` | `#fff` |
| `--light-line` | `#0f172a14` (slate-900 @ 8%) |
| `--light-line-strong` | `#0f172a24` (slate-900 @ 14%) |

### Dark surfaces
| Token | Value |
|---|---|
| `--surface-0` | `#070d18` (footer, proof stage) |
| `--surface-1` | `#101b2e` |
| `--surface-1-hover` | `#152238` |
| `--surface-2` | `#1a2942` (inputs on dark, step cards) |

### Radius
| Token | Value |
|---|---|
| `--radius-card` | `16px` (first `:root`) → **overridden to `22px`** (second `:root`) |
| `--radius-md` / `--radius-lg` | `var(--radius-card)` |
| `--radius-button` | `999px` (pill) |

### Shadows / glows
| Token | Value |
|---|---|
| `--shadow-soft` | `0 24px 70px #0b122024` |
| `--shadow-strong` | `0 36px 110px #0b122047` |
| `--shadow-light-card` | `0 1px 2px #0f172a0a, 0 12px 32px #0f172a0f` |
| `--glow-accent` | `0 0 0 1px #38bdf838, 0 18px 48px #38bdf82e` |
| `--glow-light` | `0 1px 2px #0f172a0a, 0 10px 24px #4f46e512, 0 24px 56px #4f46e517` |
| `--glow-ambient` | `radial-gradient(46% 38% at 62% 32%, #38bdf81f, transparent 70%)` |
| `--atmos-light` | `radial-gradient(54% 44% at 70% 30%, #4f46e50e, transparent 70%), radial-gradient(46% 40% at 12% 78%, #38bdf809, transparent 70%)` |

### Layout
| Token / rule | Value |
|---|---|
| `--container` | `1120px`; `.container { width: min(100% - 40px, 1120px) }` (28px gutter ≤620px) |
| Alt wrappers | `.wrap` 1200px / 1120px / 900px with 24px or 1.25rem padding |
| `.section` | `padding: 112px 0` (82px on mobile) |
| `.section-tight` | `padding: 96px 0` |
| Breakpoints | `≤900px` (main, ×16) · `≤620px` · `≤520px` · `≤800px` · `≤700px` · `≤1000px` · `≤1100px` · `≥901px` |
| Motion | nearly everything `.18s` (transform, bg, border-color, box-shadow); reveal: `opacity .7s, transform .9s`; `prefers-reduced-motion` respected |

---

## 3. Typography scale

### Headings
| Element | Size | Weight | Line-height | Letter-spacing | Color |
|---|---|---|---|---|---|
| Home hero `h1` | `clamp(2.95rem, 6.5vw, 5.75rem)` (later `clamp(2.7rem,5.9vw,5.25rem)`; mobile `clamp(2.35rem,14vw,3.4rem)`) | inherit (700–800) | `.93` | `-.075em` | white on dark |
| Page `h1` (home content / desk / module) | `clamp(40px, 5vw, 64px)` · module `clamp(40px,4.6vw,58px)`; mobile 40px → 34–36px | 700 (desk hero 800) | `1.08`–`1.1` | `-.03em` / `-.02em` | `#111827` light · `#fff` dark |
| Privacy `h1` | `clamp(2.2rem, 5vw, 4rem)` | — | `1` | `-.06em` | ink |
| Section `h2` | `clamp(32px, 3.2vw, 40px)` → `clamp(34px, 3.8vw, 48px)` | **800** | `1.15` | `-.02em` / `-.03em` | `#111827` light · `#fff` dark |
| Drawer `h2` | `clamp(40px, 4.6vw, 56px)` (34px mobile) | 800 | `1.06` | `-.03em` | `#fff` |
| Small section `h2` (desk) | `clamp(22px, 2.4vw, 28px)` | 800 | — | `-.03em` | — |
| Card `h3` | `1.18rem` | inherit | — | `-.03em` | ink |
| Step / node `h3` | `18px`–`23px`; `1.15rem`; `1.25rem` (tier, indigo) | 600–800 | `1.35` | `-.02em` | `#111827` / `#fff` / `#dcebfa` |
| Footer column `h3` | `.7rem`, **uppercase** | 700 | — | `.12em` | `#7dd3fc`, with `border-bottom: 1px solid #ffffff1a` |

### Labels, body, small text
| Style | Size | Weight | Letter-spacing | Transform | Color |
|---|---|---|---|---|---|
| `.eyebrow` | `.78rem` | **800** | `.09em` | uppercase | indigo `#4f46e5` on light · sky `#38bdf8` on dark |
| `.aeo-eyebrow` (mono) | `12px` | 600 | `.1em` | uppercase | amber `#f59e0b` |
| `.lede` | `1.15rem` | — | — | — | `#6b7280` light · `#b8c7d9` dark |
| Hero `.sub` | `clamp(1.18rem, 1.85vw, 1.55rem)` | — | — | — | `#dcebfa` |
| Hero `.support` | `1.05rem` | — | — | — | `#afc0d4` |
| Body copy | `15px`–`17px` (`16px` most common) | 400 | — | — | `#6b7280` / `#374151` / `#4b5563` |
| Nav links | `.94rem` (`.9rem` 901–1180px) | 650 | — | — | `#334155` |
| Logo text | `1.28rem` | 900 | `-.045em` | — | — |
| Tags / step numbers | `11px`–`13px` | 700 | `.04em`–`.08em` | uppercase | indigo `#4338ca` / sky |
| Field labels | `14px` | 700 | — | — | `#111827` |
| Footer links | `.88rem` | — | — | — | `#d1d9e4` → `#fff` + underline on hover |
| Footer small / bottom | `.8rem`–`.9rem` | — | — | — | `#9ca3af` / `#94a3b8` |

**Recurring values**
- Sizes: 16px ×12 · 12px ×10 · 15px ×9 · 14px ×9 · 11px ×8 · 17px ×7 · 13px ×7 · 1.05rem ×7 · .9rem ×7 · 10px ×6
- Letter-spacing: tight headings `-.03em` ×11 / `-.02em` ×10; uppercase labels `.08em` ×7 / `.04em` ×7 / `.1em` / `.12em` / `.14em` / `.16em`
- Line-height: `1.55` ×13 · `1.6` ×6 · `1.45` ×6 · `1.5` ×5 · `1.15` ×5 (headings)

---

## 4. Text colors (full palette in use)

**On light backgrounds**
| Color | Role |
|---|---|
| `#111827` (ink) | headings, strong text, table first column |
| `#374151` | body (desk forms, consent) |
| `#334155` | nav links, responsible-AI copy |
| `#4b5563` | tab text, secondary body |
| `#6b7280` (gray) | card body, lede, table "typical" column, captions — **most used text color on module page (×15)** |
| `#9ca3af` | inactive tabs, muted |
| `#4f46e5` (indigo) | eyebrows, links, tier titles, icons |
| `#4338ca` | indigo-dark (tag text, hover bg) |
| `#b91c1c` | validation error |

**On dark backgrounds**
| Color | Role |
|---|---|
| `#fff` | headings |
| `#dcebfa` | hero sub, status copy, proof headings (also at 80/8c/b3 alpha) |
| `#dde7f4` / `#e5e7eb` | footer base text |
| `#d1d9e4` | footer links |
| `#b8c7d9` | lede/card body on dark |
| `#afc0d4` | hero support text |
| `#94a3b8` / `#9ca3af` | footer bottom, placeholders |
| `#7dd3fc` / `#bae6fd` | light-sky accents (footer headings, hover) |
| `#38bdf8` (sky) | eyebrows, step numbers |
| `#ffffffd1` / `b8` / `ad` / `8f` / `8c` | white at 82% / 72% / 68% / 56% / 55% |

---

## 5. Backgrounds & gradients

| Surface | Value |
|---|---|
| Page (`body`) | `radial-gradient(circle at 8% 8%, #38bdf814, transparent 24rem), radial-gradient(circle at 92% 24%, #4f46e514, transparent 26rem), #f9fafb` |
| Card | `#fff` |
| Header | `#fff`, `border-bottom: 1px solid #0f172a14`, sticky; on scroll adds `0 1px 2px #0f172a0a, 0 8px 16px #0f172a0f` |
| Home hero (dark) | `radial-gradient(circle at 78% 24%, #38bdf84d, transparent 28rem), radial-gradient(circle at 60% 85%, #4f46e53d, transparent 30rem), linear-gradient(135deg, #070d18 0%, #0b1220 54%, #111a32 100%)` |
| `.dark-band` | `#0b1220`, or `radial-gradient(circle at 15% 20%, #38bdf82e, transparent 24rem), linear-gradient(135deg, #07111f 0%, #0b1220 100%)` |
| Module hero | `linear-gradient(135deg, #070d18 0%, #0b1220 60%, #111a32 100%)` |
| Status CTA band | `linear-gradient(135deg, #0b1220, #4f46e5)` |
| Light section washes | `radial-gradient(circle at 85–90% 18–20%, #38bdf829 / #4f46e51a, #0000 22–24rem), linear-gradient(#fff 0%, #f2f7fc / #f4f8fc / #f9fafb 100%)` |
| Accent bars | `linear-gradient(90deg, #38bdf8, #4f46e5)` (form card top, 8px) |
| Footer rule | `linear-gradient(90deg, #38bdf8 0%, #38bdf859 42%, #4f46e559 72%, #4f46e500 100%)`, 3px tall |
| Icon tile | `linear-gradient(135deg, #38bdf8, #4f46e5)`, 34×34, radius 12px |
| Tint fills | `#eef2ff` (indigo-50) · `#4f46e50f` / `#4f46e514` (indigo 6–8%) · `#38bdf81a` (sky 10%) · `#f59e0b24` (amber) · `#f8fafc` / `#f1f5f9` (slate-50/100) |
| Glass on dark | `#ffffff0f`–`#ffffff14` with border `#ffffff1f`–`#ffffff2e` |
| Scanlines (proof stage) | `repeating-linear-gradient(#0000 0 3px, #ffffff05 3px 4px)` |

---

## 6. Borders

**Widths:** almost always `1px`; exceptions `1.5px` (outline button, form checks), `2px` (tab underline), `2.5px`, `3px` inset highlight, `4px` left accent, `5px` top accent.

| Border | Use |
|---|---|
| `1px solid #0f172a14` (`--light-line`) | **default** — cards, table rows, header, dividers (most common) |
| `1px solid #0f172a24` (`--light-line-strong`) | form controls, consent box |
| `1px solid #0f172a1a` (`--color-line`) | base `.card` |
| `1px solid #cbd5e1` | base inputs/textarea/select |
| `1px solid #4f46e524` / `2e` / `29` | FAQ items, indigo-tinted cards |
| `1px solid #38bdf829` → `#38bdf857` | sky-tinted cards on dark / form card (hover up to `#38bdf8ad`) |
| `1px solid #ffffff1a` / `1f` / `26` / `#fff3` | borders on dark (footer, subscribe, glass cards) |
| `border-left: 4px solid #4f46e566` | problem cards |
| `border-top: 5px solid #38bdf8bf` | accent top edge |
| `border-bottom: 2px solid transparent` → indigo | active intake tab |
| `box-shadow: inset 3px 0 0 #4f46e5` | "ours" table column highlight (left rule without a border) |
| Error | `border-color: #b91c1c` |

**Radius:** pills `999px` (buttons, inputs on dark, tags) · cards `22px` (token) · also `16px` ×9, `8px` ×6, `14px` (inputs), `18px` (mobile nav), `28px`, `34px` (form card), `38px`, `42px`, `50%` (circles/glows).

**Shadows (most used):** `0 2px 10px #0000000f` (flat card/table/chip) · `--glow-accent` · `--shadow-strong` · `--shadow-soft` · `--glow-light` · `0 22px 60px #0f172a14` (feature cards, hover `0 30px 70px #0f172a21`) · `0 16px 42px #38bdf84d` (primary button glow). No backdrop blur anywhere (explicitly `none`).

**Focus:** `outline: 3px solid #0b1220; outline-offset: 3px` on light; `outline-color: #fff` on dark; header/drawer variant `2px solid #4f46e5, offset 2px`.

---

## 7. Tables

Only one on the site: **"This is not another SEO tool."** comparison on `/modules/aeo-consensus-control/`.

Markup: `<table>` → `thead` (`th.col-cap`, `th.col-typical`, `th.col-ours`) → `tbody` rows with `th[scope=row].col-cap` + `td[data-label]`.

| Part | Style |
|---|---|
| `table` | `border-collapse: separate; border-spacing: 0; border-radius: 22px; background: #fff; width: 100%; overflow: hidden; box-shadow: 0 2px 10px #0000000f` |
| `th, td` | `border-bottom: 1px solid #0f172a14; text-align: left; vertical-align: top; padding: 22px 24px; font-size: 16px; line-height: 1.45` |
| `thead th` | `padding: 18px 24px; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase` |
| `thead .col-cap, .col-typical` | `color: #6b7280; background: #f8fafc` |
| `thead .col-ours` | `background: #0b1220; color: #fff` (dark header cell for the highlighted column) |
| `tbody .col-cap` | `color: #111827; width: 26%; font-size: 15px; font-weight: 700` |
| `tbody .col-typical` | `color: #6b7280` |
| `tbody .col-ours` | `color: #111827; width: 40%; font-weight: 650; background: #4f46e50f; box-shadow: inset 3px 0 0 #4f46e5` |
| last row | `border-bottom: 0` |

**Mobile (stacked cards):** table/rows become `display: block`; `thead` visually hidden; `tbody { display: grid; gap: 16px }`; each `tr` is a card (`border: 1px solid #0f172a14; border-radius: 22px; background: #fff; padding: 20px; box-shadow: 0 2px 10px #0000000f`); each `td` gets `border-top: 1px solid #0f172a14; padding-top: 14px` and a `::before { content: attr(data-label) }` label (`11px / 700 / .04em / uppercase / #6b7280`, indigo for `.col-ours`); `.col-ours` becomes a tinted inset box (`padding: 14px 16px; radius 22px`).

---

## 8. Components

### Buttons
| Variant | Style |
|---|---|
| `.btn` base | pill (`999px`), `min-height: 48px`, `padding: 0 20px`, `font-weight: 800`, `gap: 10px`, `border: 1px solid transparent`, hover `translateY(-1px)`, `.18s` transitions; full-width ≤900px |
| `.btn-primary` | bg `#38bdf8`, text `#0b1220`, `box-shadow: 0 16px 42px #38bdf84d` |
| `.btn-secondary` (on dark) | bg `#ffffff14`, text `#fff`, border `#ffffff2e` |
| `.btn-outline` (on light) | transparent, text `#0b1220`, border `#0b12202e` |
| Header `.cta-button` | bg `#4f46e5`, text `#fff`, pill, `padding: .5rem 1rem`, `.875rem / 700` |
| Subscribe button | bg `#38bdf8` → hover `#7dd3fc`, text `#0b1220`, `.875rem / 700`, `padding: .7rem 1.35rem` |

### Cards
| Variant | Style |
|---|---|
| `.card` | `#fff`, `1px solid #0f172a1a`, radius 22px, `padding: 28px`, `box-shadow: 0 10px 30px #0f172a0a`; `h3` 1.18rem/-.03em; `p` gray |
| Feature card (`#what-we-do`) | border `#38bdf833`, `padding: 74px 30px 30px`, shadow `0 22px 60px #0f172a14`, gradient icon tile top-left, sky radial glow top-right; hover lift `-5px` |
| Card on dark | `#ffffff0f` bg, `#ffffff1f` border, body `#b8c7d9` |
| Mechanism step | `#fff`, `1px solid #0f172a14`, radius 16px, `padding: 32px`, `0 2px 10px #0000000f`; small label indigo 13px/700 |
| Step card on dark | `#1a2942`, border `#38bdf838`, radius 22px |
| Form card | `linear-gradient(180deg, #fff, #fbfdff)`, border `#38bdf857`, radius 34px, `padding: 38px`, `--shadow-strong`, 8px sky→indigo top bar |
| Chip (floating) | `#fff`, radius 16px, `padding: 16px 24px`, `0 2px 10px #0000000f`; `small` 10px uppercase gray, `b` 13px |

### Tags, tabs, pills
- `.panel-tag`: pill, bg `#eef2ff`, text `#4338ca`, `11px / 700 / .04em / uppercase`, `padding: 6px 12px`
- Drawer tabs: bg `#f3f4f6`, text `#4b5563`, `13px / 700`; selected → bg `#0b1220`, text `#fff`, larger padding
- Intake tabs: text `#9ca3af` `14px / 650`; active → indigo text + 2px indigo underline; done → `#111827` + checkmark

### Forms
- Inputs (light): `#fff`, `1px solid #cbd5e1`, radius 14px, `padding: 13px 14px`, text ink; `textarea min-height: 118px`
- Inputs (dark / subscribe): pill, bg `#1a2942`, text `#fff`, border `#fff3` → hover `#ffffff57`, placeholder `#94a3b8`
- Labels `14px / 700 / #111827`; checkbox `accent-color: #4f46e5`
- Consent box: `#f9fafb`, `1px solid #0f172a24`, radius 16px, `14px / 500 / #374151`

### Header / nav
- Sticky, `#fff`, `1px solid #0f172a14` bottom, height 64px (older rule 82px), max-width 1200px, `padding: 0 24px`
- Logo image 56px tall (46px mobile), `drop-shadow(0 8px 14px #0b12201a)`
- Links `#334155`, `.94rem / 650`, gap 24px; mobile menu = white card, radius 18px, `--shadow-soft`

### FAQ accordion
- `.faq-item`: `#fff`, `1px solid #4f46e524`, radius 22px, `box-shadow: 0 14px 36px #0f172a0e`
- `summary`: `font-weight: 850`, `letter-spacing: -.025em`, `padding: 21px 56px 21px 24px`; indicator `+` / `–` in indigo, 1.35rem
- Answer `p`: gray, `padding: 0 24px 24px`

### Footer
- bg `#070d18`, text `#e5e7eb`, top rule 3px sky→indigo fade
- Grid `1.05fr 1.9fr 1.25fr`, gap 3.5rem, `padding: 6rem 1.5rem 3.5rem`
- Column headings `.7rem / 700 / .12em / uppercase / #7dd3fc` with `#ffffff1a` underline
- Subscribe panel: `#101b2e`, `1px solid #ffffff1a`, radius 22px, `--glow-accent`, `padding: 1.75rem`
- Bottom bar: `#9ca3af`, `.8rem`, `border-top: 1px solid #ffffff1a`
