# MindTrace Phase 1: Recon findings and design/build plan

## Context

The brief assumes a prepared Next.js 16 repo with shadcn (Base UI), Magic UI and Aceternity components, dashboard-01 leftovers and a green lint/build baseline.

The user named the target repo: **github.com/godtier812/hackathon-taksh-shaunak-ashrith**, cloned locally at `C:\Users\udaym\hackathon-taksh-shaunak-ashrith`. `git ls-remote` shows the local clone matches GitHub exactly:
- `main` and `base44/setup-741da7ec` both point to `3f59637 Initial commit`.
- That commit contains only `.gitignore`, `calculator.py`, `passgen.py` and `Test_Vault/`.
- **There is no Next.js app on any branch.**

The user also said to **"make everything I don't have already."**

So the plan adds a **Phase 0: scaffold** step. It builds the app in a `mindtrace/` subfolder of that repo at the exact versions the brief verified, freezes the dependency set, and then runs Phases A–E as written. The existing Python files and `Test_Vault/` are left untouched. After approval, this plan is copied to `mindtrace/docs/phase1-plan.md`; plan mode currently blocks writing it there.

## Phase A findings (what could be checked without a repo)

- **Toolchain:** Node 24.14.0, npm 11.9.0, git 2.53.
- **Registry versions match the brief:** next **16.3.6**, motion **13.4.4**, lenis **1.3.26**, recharts **3.10.1**, tailwindcss **4.3.3**, shadcn CLI **4.21.0**.
- **CLI options:**
  - `create-next-app@16.3.6` supports `--ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`, and generates `AGENTS.md` by default.
  - `shadcn@4.21.0 init` supports `-b base` (Base UI) and `-p base-nova`.
- **Browser automation:** no Playwright, Chrome DevTools or Claude-in-Chrome MCP is connected. **Chrome and Edge are installed.** QA plan:
  - A zero-dependency Node script in the scratchpad drives system Chrome headless over the **Chrome DevTools Protocol**, using Node 24's built-in `WebSocket` and `fetch`. It covers viewport emulation, `prefers-reduced-motion` emulation, scrolling, clicks and hovers, Tab key events, console and hydration-error capture, overflow checks and PNG screenshots, which I review with Read.
  - Nothing gets installed, and Playwright and Puppeteer stay out.
- **Not checkable until Phase 0 runs:** `AGENTS.md`, the Next 16 docs in `node_modules/next/dist/docs/`, the generated `globals.css`, `button.tsx`/`tabs.tsx`/`chart.tsx` APIs, Motion/Lenis/Recharts exports, and the lint/build baseline. These form **Phase A′** below, before any app code.
- **Brief items that don't apply:**
  - There are no dashboard-01 leftovers to preserve or list.
  - There are no pre-copied Magic UI or Aceternity files. See §6: none are needed.

## Phase 0: scaffold (the only step that changes dependencies)

Location: `C:\Users\udaym\hackathon-taksh-shaunak-ashrith\mindtrace\`, a subfolder of the existing repo.

Git handling:
- Create a local branch `mindtrace-phase1` off `main` first.
- **No commits or pushes** unless you ask.
- The app's files show up as untracked in the existing repo; no nested git repo is created.

1. Create the app: `npx create-next-app@16.3.6 mindtrace --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git`. This yields `AGENTS.md`, the ESLint config, Tailwind v4 CSS-first setup and Geist fonts in `layout.tsx`. Its own `.gitignore` keeps `node_modules` and `.next` out of the repo.
2. Set up shadcn: `npx shadcn@4.21.0 init -b base -p base-nova`, which adds Base UI, cva, clsx, tailwind-merge, lucide-react and tw-animate-css.
3. Add only the shadcn components Phase 1 uses: `npx shadcn@4.21.0 add button card badge tabs chart tooltip separator avatar`. The chart component pulls in recharts.
4. Install the remaining libraries: `npm i motion@13.4.4 lenis@1.3.26 sonner`.
5. Freeze the dependency set:
   - Run `npm run lint` and `npm run build`, and record the output as the baseline.
   - Record `sha256sum package.json package-lock.json` in `docs/phase1-plan.md`.
   - From here on, **§0 hard constraints apply in full**: no dependency changes, no ESLint config edits, no `eslint-disable`, and no edits to `src/components/ui/*`.

**Deliberately not installed:** wavesurfer.js, dnd-kit, tanstack-table, zod, next-themes, and all Magic UI and Aceternity components. None are used in Phase 1. Unused copies would only add lint risk.

The shadcn `sonner` wrapper imports `next-themes`, which the brief forbids. I use `Toaster` from `sonner` directly in a small styled wrapper instead.

## Phase A′: post-scaffold reconnaissance (read-only)

- Read `AGENTS.md`, then the Next docs on layouts/templates, metadata, `next/font`, the client boundary, and `Link`.
- Read `globals.css`, `button.tsx` (confirm `render` works and whether `nativeButton={false}` is needed for `<Link>`), `tabs.tsx`, `tooltip.tsx`, `chart.tsx` (confirm Recharts v3 compatibility) and `avatar.tsx`.
- Confirm the Motion 13 exports: `useScroll`, `useTransform`, `useMotionValue`, `useInView`, `useReducedMotion`, `animate`, `MotionConfig`, and rendering a motion value as a child.
- Confirm the `lenis` class supports `autoRaf`.
- Confirm these lucide icon names exist: `ArrowRight`, `AudioLines`, `Pause`, `Repeat2`, `BookOpenText`, `Gauge`, `Waypoints`, `NotebookPen`, `Info`, `TrendingUp`, `Minus`, `TrendingDown`.
- Record the findings in the plan doc.

---

## 1. Design system

Colors are hex values on `:root`. They are mapped onto the shadcn variables (`--background`=canvas, `--foreground`=ink, `--card`=surface, `--primary`=brand, `--muted`=surface-muted, `--muted-foreground`=ink-secondary, `--border`/`--input`=line, `--ring`=accent, `--chart-1`=brand, `--chart-2`=signal-mark, `--chart-3`=neutral-trend). The `.dark` block is left as generated.

| Token | Value | Note |
|---|---|---|
| canvas | `#F8F6F1` | |
| surface | `#FFFFFF` | |
| surface-muted | `#F2EFE8` | |
| ink | `#0F1115` | |
| ink-secondary | `#5A606B` | |
| ink-tertiary | **`#666B76`** | The brief's `#6F7480` measures about **4.34:1 on canvas, which fails AA**. `#666B76` gives about 4.95 on canvas and 4.6 on surface-muted. |
| line / line-strong | `#E7E3DB` / `#D8D3C9` | |
| brand / brand-hover | `#14213D` / `#0C1630` | |
| accent / accent-soft | `#3D5AD6` / `#E9EDFB` | About 5.8:1 on white |
| signal-text / signal / signal-soft | `#A45A0C` / `#D98A1C` / `#FBF1E1` | Text about 5.2 on white and 4.8 on canvas |
| neutral-trend | `#6B7280` | Used for text **only on white surfaces**, where it reaches about 4.8. It is about 4.46 on canvas. |

- **Type:** `@utility` classes `text-display`, `text-page`, `text-section`, `text-body-lg`, `text-body`, `text-label`, `text-eyebrow`, `text-metric`, `text-caption` (+ `font-mono` variant). Values follow §5.2, with `clamp()` for fluid sizes.
  - **One deviation:** the display size is `clamp(44px, 6.2vw, 84px)` with a measure of about 17ch instead of 12–14ch. This lets the headline set in 3 lines so the waveform stays inside the first viewport at 1280×800, which matters more.
  - Headings get `text-wrap: balance`, paragraphs get `text-wrap: pretty`, and every number gets `tabular-nums`.
- **Space:**
  - 4px grid.
  - Utility `section-y`: 144px on desktop, 88px on mobile.
  - `container-page`: max-width 1200px with 20px gutters on mobile and 32px on desktop.
  - `measure`: 680px for text.
- **Radius:** `--radius-card` 20px, `--radius-inner` 12px, `--radius-chip` 8px; buttons are `rounded-full`.
- **Shadows:** `--shadow-rest` and `--shadow-raised` exactly as §5.3.
- **Motion:** in `src/lib/motion.ts`:
  - Easing: `easeOut [0.16,1,0.3,1]` and `easeInOut [0.65,0,0.35,1]`.
  - Durations: `hover .15`, `ui .22`, `enter .55`, `draw 1.1`.
  - Springs: `soft {260,30}` and `snappy {420,34}`.
  - `stagger .06`.
  - Shared variants: `fadeRise`, `fadeIn`.

## 2. Typography decision

**Geist and Geist Mono only; no serif.** One family with a mono accent is the more restrained, instrument-like choice. It also avoids the editorial-serif-headline look many AI startup pages now share. Hierarchy comes from size, weight and tracking.

## 3. Wireframes

**Hero, desktop (1280×800):**
```
[◠• MindTrace]                    How it works  The science  View demo  (View Margaret's Journey →)
────────────────────────────────────────────────────────────────────────────── (hairline after 24px scroll)
  LONGITUDINAL COMMUNICATION RECORD                    ← mono eyebrow
  The earliest changes
  can be the hardest                                   ← Display, 3 lines, left
  to notice.
  MindTrace turns everyday conversations into a longitudinal…   (≤560px, ink-secondary)
  (View Margaret's Journey →)  ( Start a Session )
  Conversation · Jun 2, 2026                                               0:07 / 0:16
  ▁▂▅▇▅▃▂▆▇▅▂▁ ────── ▂▄▆▇▆▄▂▁▃▅ ── ▂▅▇▆▄… (navy up to playhead | line-strong after)
```
**Hero, mobile (390):** the wordmark and a small CTA pill share the nav row; the other links are hidden. The headline sets in 4–5 lines at 44px, with the copy and a full-width primary CTA below; the secondary CTA sits under it. The waveform uses 80 bars at full width, with its captions beneath.

**Scroll-story stage (sticky 100svh):**
```
 DAY 30                                   ┌ Avg pause 0.8s ┐ ┌ Repeated phrases 1 ┐   ← chips (top-right; below waveform on mobile)
 Small changes begin to appear.           
      ┌──repeated──┐        ┌──repeated──┐   ← amber bracket over the two identical envelopes
 ▂▅▇▅▂▁──────▃▆▇▆▃▂────────▂▅▇▅▂▁ …        ← live morphing waveform; Day-1 ghost at 12% behind
 ●━━━━━━━━━━━━━━━━━━━━━━━━○───────────────────○   timeline rail
 Day 1                    Day 30              Day 90
```
- **Day 1:** fluent phrases and neutral chips.
- **Day 90:** amber hairline pause markers labeled `1.6s` and `2.1s`, three repeat brackets, and two amber chips.
- **Resolution:** the waveform dims to 30%. The centered lines read "Changes happen gradually." and then "MindTrace makes them visible.", revealed word by word.

**Transition:** in the last part of the story the waveform compresses horizontally into a single navy dot (●). The stage then releases, and the preview frame rises from below (scale .94→1, y 40→0, radius 28→20). Its chart's latest-point dot pulses once when revealed: the one dot becomes the latest data point.

**Dashboard, desktop (≥1280):**
```
[◠• MindTrace]                                                          [Demo data ⓘ]
 (MR)  Margaret Reynolds                                      (🎙 Analyze New Conversation)
       Age 72 · Monitoring since June 2026   ● Active monitoring
┌ Communication over time                         [30D|90D|All]   Demo index · not a clinical measure ┐
│ Composite of five indicators, relative to Margaret's June baseline.                               │
│  ░░░░░░░ baseline range ░░░░░░░ - - - - 100 - - - - -                                             │
│  ‾‾‾‾‾‾‾‾‾‾‾‾‾\___________‾‾\______________________● Sep 24 · 91                                  │
│  Jun          Jul           Aug           Sep                                                     │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
[Pause freq +18% ↗][Repetition +12% ↗][Vocab −6% ↘•][Speech rate Stable —][Coherence Slight decline ↘•]
Demo indicators, not clinical thresholds. Changes are measured against Margaret's own June baseline.
┌ 📝 90-Day Summary  (full width, accent-soft tint ≈40%) ─────────────────────────────────────────┐
│ Over the past 90 days, Margaret's conversations show a gradual increase …                       │
│ ─────────────────────────────────────────────────────────────────────────────────────────────── │
│ ⓘ This is not a diagnosis. Persistent or concerning changes should be discussed with …          │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **1024–1279px:** metric cards 3 + 2.
- **Tablet (768):** header and CTA stay in one row; cards in 2 columns (the 5th card spans both); chart 300px tall.
- **Mobile:** single column; the CTA becomes a full-width pill under the header, and the tabs sit above the chart.

## 4. Waveform plan (`src/lib/waveform.ts`)

- **Generation:** seeded `mulberry32`. Each state is a *script*: an ordered list of phrases (base lengths and seeds) and pauses. It renders to exactly **N=160 samples at 0.1s each** (a 16s excerpt, caption `0:16`).
  - Each phrase sample: `taper(i/L) × (0.35 + 0.65·syllable)`.
    - `taper` is a sin^0.6 arch, loudest mid-phrase.
    - `syllable = |sin(2π·4.5Hz·t + φ)|`, with seeded jitter of ±15% and a slow stress contour.
  - Pauses are exactly 0, drawn as the 1px baseline.
  - Phrase lengths absorb pause growth, so N stays fixed.
  - Mobile uses the same arrays max-pooled 2:1 to 80 bars.
- **States (numerical differences):**

  | | Pauses (s) | Avg pause | Repeats | Amplitude spread |
  |---|---|---|---|---|
  | Day 1 (Jun 2) | 0.3–0.5 | 0.4s | 0 | 1.0 |
  | Day 30 (Jul 2) | 2 widen to 0.9–1.1 | 0.8s | 1 (phrase 5 reuses phrase 2's envelope) | 0.95 |
  | Day 90 (Aug 29) | 4 pauses 1.2–2.1 | 1.3s | 3 | 0.8 (compressed toward mean) |

  The chip values are **computed from the scripts**, so they always match what is drawn. They are a little gentler than the brief's example 0.4→0.9→1.6s, for restraint.
- **Rendering:** one SVG `<path>` of vertical segments (`M x y1 V y2`) with `stroke-linecap: round`, mirrored around the center, plus a 1px baseline `<line>`.
  - Bar width is 50% of pitch, clamped to 1.5–3px.
  - Geometry uses real pixel width from `ResizeObserver`, so round caps never distort. A resize is the only React re-render.
- **Hero playhead:**
  - Two copies of the path: navy, clipped by a `clipPath` rect whose width is a motion value, over a line-strong copy.
  - `animate(head, 1, {duration: 9, ease: 'linear', repeat: Infinity})` drives it. Controls pause when `useInView` is false and freeze under reduced motion.
  - The timestamp is a `useTransform` motion value rendered as text, so it causes no re-render.
- **Entrance:** a `grow` motion value runs 0→1 over 650ms. Path amplitude = `a_i × clamp(grow·1.5 − (i/N)·0.5)`, which gives a left-to-right stagger from one path.
- **Scroll drive:**
  - `useScroll({target, offset: ['start start','end end']})` feeds `useTransform(progress, p => buildPath(mix(p)))`, bound to `motion.path d`.
  - `mix` lerps sample-by-sample: Day1→30 over p .24–.36 and 30→90 over .56–.68, holding between.
  - Overlays are absolutely positioned SVG elements whose opacity is transformed from `progress`: the Day 1 ghost path (0→.12), amber pause markers and repeat brackets (fixed sample ranges from the Day 30/90 scripts), and chips (text and color).
  - **No React state per frame.**

## 5. Transition plan

- **Choice: a robust version of the primary.** Collapse the waveform to a dot, then raise the frame. The waveform group's `scaleX` 1→0.015 runs over story p .94–1.0 (transform-origin center). A navy dot fades in as the scale nears zero. The preview section's own `useScroll` (`['start end','start 0.35']`) drives the frame: scale .94→1, y 40→0, borderRadius 28→20. The total is under one viewport.
- **Not doing:** flying the DOM dot to the Recharts point's exact pixel coordinates. The metaphor is carried by the dot, the sub-line ("Every conversation adds a data point.") and the chart's latest-point halo pulse on reveal.
- **Fallback:** if the collapse janks, just scale and fade the waveform. No Aceternity component either way.

## 6. Component usage decision

- **shadcn:**
  - `button`: all CTAs, with `render={<Link/>}` for links; the exact props are verified in A′.
  - `card`: dashboard cards, restyled through className.
  - `badge`: Demo data.
  - `tooltip`: the Demo data explainer.
  - `tabs`: range 30D/90D/All.
  - `chart`: `ChartContainer` and `ChartTooltip`, with custom tooltip content composed around it.
  - `separator`: summary divider.
  - `avatar`: MR initials.
  - Mobile nav hides the secondary links, so no `sheet` or `dropdown`.
- **Magic UI, none used:**
  - `number-ticker`: replaced by a 25-line `MetricValue` that uses Motion `animate` and writes `textContent`, with tabular nums and no re-renders.
  - `blur-fade`: shared Motion variants are enough.
  - `text-reveal`: it owns its own tall scroll container, which can't live inside our sticky stage. Replaced by per-word `useTransform`.
  - `dot-pattern`: the plain canvas is calmer.
- **Aceternity, none used:** `container-scroll-animation` is unnecessary given §5. Everything else is rejected per §10.

## 7. Demo data spec (`src/lib/demo/margaret.ts`)

- **Profile:** Margaret Reynolds, 72; `monitoringSince` is derived from the first session.
- **Sessions:** every Tue/Thu/Sat from **Tue Jun 2 to Thu Sep 24, 2026**, minus 3 fixed skipped dates, which gives **48 sessions**. Dates are built from UTC constants and formatted with `Intl.DateTimeFormat('en-US', {timeZone:'UTC'})`.
- **Per-session indicators:**

  | Indicator | Baseline | Target change |
  |---|---|---|
  | pausesPerMin | 9.5 | **+18%** |
  | repeatedPhrases | 1.25 | **+12%** |
  | vocabDiversity (TTR) | 0.62 | **−6%** |
  | speechRateWpm | 138 | ±1.5% (**Stable**) |
  | coherence | 0.84 | **−4%** ("Slight decline") |

  - Each series is `baseline × (1 + target·ramp(t)) + noise`. `ramp` is a smooth ease-in with no cliffs.
  - Seeded noise is **de-meaned within the first-2-week and last-2-week windows**, so the computed percentages hit the targets exactly.
- **Composite index:** `100 − Σ wᵢ·(signed concerning deviation of indicator i, %)`, normalized so the mean of the first two weeks is exactly 100. Weights are tuned so the Sep 24 value is about 91, with about ±1.5 noise.
- **Derived exports (all computed from the sessions, never hard-coded):**
  - `metricSummaries`: the percentages (baseline window vs last two weeks), descriptor and tone.
  - `weeklyAggregates`: the last 13 weekly means per indicator, used by the sparklines.
  - `chartSeries(range)`.
  - `latestPoint`.
  - `summaryCopy`: the corrected sentence.
  - `storyStates`: session dates for Day 1/30/90 plus waveform seeds.
- **Consistency:** chart, cards, sparklines and summary share one source, so the story always agrees with itself. The story chips come from the waveform scripts and describe single conversations. The metric cards describe frequency trends, so the two never contradict each other.

## 8. File plan (all under `hackathon-taksh-shaunak-ashrith/mindtrace/`; nothing outside that folder is touched)

- **Created by tooling:** Next scaffold, `components.json`, `src/lib/utils.ts`, and `src/components/ui/{button,card,badge,tabs,chart,tooltip,separator,avatar}.tsx`.
- **Modified:**
  - `src/app/globals.css`: tokens, shadcn mapping, `@utility` type/space classes, and pulse keyframes.
  - `src/app/layout.tsx`: metadata "MindTrace: Communication, over time", `MotionConfig reducedMotion="user"`, `SmoothScroll`, `AppToaster`.
  - `src/app/page.tsx`: replaced.
- **Created:**
  - `docs/phase1-plan.md`
  - `src/app/template.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/lib/{motion,waveform,format,use-reduced-motion-safe,placeholder-action}.ts` and `src/lib/demo/margaret.ts`
  - `src/components/providers/smooth-scroll.tsx`
  - `src/components/brand/wordmark.tsx`
  - `src/components/shared/{app-toaster,phase2-button}.tsx`: one handler, toast `id` dedupe.
  - `src/components/landing/{site-nav,hero,speech-waveform,scroll-story,story-overlays,resolution-line,product-preview,science,site-footer}.tsx`
  - `src/components/dashboard/{dashboard-view,top-bar,patient-header,trend-chart,trend-tooltip,metric-card,metric-value,sparkline,summary-card}.tsx`
- **`dashboard-view`:** a server component that composes the client leaves. It takes `variant: 'page' | 'preview'` and uses `h1` on the page and `h2`/`p` in the preview. The preview variant is non-interactive and has no tooltip. `/dashboard` renders it directly. `product-preview` wraps it in a frame with a fixed 1200px inner width, scaled to fit via `ResizeObserver` with height reserved. Below 768px it is unscaled, clipped to about 560px, with a bottom fade mask and `inert`.

## 9. Motion inventory

| # | Element | Trigger | Property / technique | Timing | Reduced motion |
|---|---|---|---|---|---|
| 1 | Route enter (`template.tsx`) | navigation | opacity 0→1, y 8→0 | 350ms easeOut | opacity only (MotionConfig) |
| 2 | Nav background | scroll > 24px | CSS bg, blur, border | 200ms | instant |
| 3 | Hero headline | load | per-word mask, translateY 100%→0 | 550ms, 25ms stagger, done by about 0.8s | fade |
| 4 | Hero copy, CTAs | load | fade + y 8 | 450ms at 250/350ms delay | fade |
| 5 | Hero bars grow | load (0.35s) | `grow` motion value → path d | 650ms | static full |
| 6 | Hero playhead | in view | clip width + timestamp | 9s linear loop, paused offscreen | frozen at 45% |
| 7 | Button hover/press | pointer | bg darken, icon x+2, scale .98 | 150ms / snappy | colors only |
| 8 | Story morph | scroll | path d lerp | scroll-linked | three stacked static paths, opacity crossfade |
| 9 | Story text/chips/rail | scroll | opacity + y 8, color, scaleX (rail) | scroll-linked | opacity only |
| 10 | Resolution words | scroll | per-word opacity .15→1 | p .88–.96 | same (opacity) |
| 11 | Waveform collapse | scroll | scaleX → dot | p .94–1 | fade instead |
| 12 | Preview frame | scroll | scale, y, radius | ≤1 viewport | opacity only |
| 13 | Dashboard header | mount | fade | 0–250ms | same |
| 14 | Chart card | in view | y 12 soft spring, 150ms delay | ~500ms | fade |
| 15 | Chart line draw | in view (once) | Recharts Area mount animation | 1100ms ease-out | none (static) |
| 16 | Latest dot + halo | after draw | fade in; halo scale 1→2.4, opacity .4→0 once | 600ms | static dot |
| 17 | Range switch | tab | Recharts data transition | 450ms | instant |
| 18 | Metric cards | in view | fade + y 6, 60ms stagger | 450ms | fade |
| 19 | Metric values | card in view | `animate` 0→value → textContent | 900ms easeOut | final value |
| 20 | Card hover | pointer | y −2, shadow rest→raised | 180ms | shadow only |
| 21 | Status dot | always | CSS halo pulse | 2.8s slow loop | static (`motion-reduce`) |
| 22 | Summary card | in view | fade, last | 450ms | same |

The whole dashboard sequence settles in about 1.4s. Every reveal runs `once: true`.

## 10. Risk register

| Risk | Mitigation |
|---|---|
| Lenis vs `useScroll` double smoothing | Plain Lenis (`lerp .1`, `autoRaf`, native touch) created imperatively in `useEffect` with no `useSpring` on progress; verify in the browser. |
| Lenis disabled under reduced motion causing a remount | No conditional wrapper: the effect simply doesn't construct Lenis. Anchor links go through a context `scrollTo` with fallback `scrollIntoView` + `scroll-margin-top`. |
| Sticky breaking | No `overflow:hidden` on any ancestor (the page uses `overflow-x: clip` on `main` only if needed). Nav is `position: sticky`, so the transient template transform is harmless; Motion resets the transform to `none` at rest. |
| Hydration mismatch | Seeded PRNG only, fixed UTC dates, and SSR geometry at a fixed width. Reduced-motion reads go through `useSyncExternalStore` (server snapshot `false`), so markup matches on the first client render. |
| Recharts `width(-1)` / zero height | Explicit `h-[300px] md:h-[340px]` on `ChartContainer`; in the scaled preview the inner width is fixed at 1200px. |
| Recharts v3 vs the generated `chart.tsx` | Verify in A′. If the generated file mismatches v3 types, stop and report rather than edit `ui/*` silently. |
| Base UI API differences (`render`, `nativeButton`, Tabs `onValueChange`, Tooltip trigger) | Read the sources in A′; type-check each use. |
| Per-frame cost of 160-bar path strings | About 160 string segments per frame is trivial. Mobile uses 80. Profile with CDP. |
| Line-draw re-animating on range change feels busy | Use a short 450ms data transition; fall back to a crossfade if it looks wrong. |
| Headline too tall for 1280×800 | Tuned display clamp; verify with the first-viewport screenshot. |
| No MCP browser tool | CDP script against system Chrome; be explicit in the report about anything that couldn't be checked. |

## Execution order after approval

Phase 0 scaffold → A′ recon and baseline lint/build, with checksums → write `docs/phase1-plan.md` → C1 through C6, running `npm run lint` and a CDP screenshot check after each → Phase D full QA at 1440×900, **1280×800**, 768×1024 and 390×844, on `/` and `/dashboard` (story stages forward and backward, clicks, toasts, tab order, console and hydration, overflow, reduced motion) → Phase E final lint, build and checksum comparison, then the §14 report. **STOP.**

## Verification

- `npm run lint`: 0 errors and 0 warnings.
- `npm run build`: succeeds, with both routes static.
- `sha256sum package.json package-lock.json` matches the value recorded after Phase 0.
- CDP QA script screenshots are reviewed, and the checks are logged in the final report.

---

## Phase 0 / A′ results (recorded after approval, 2026-09-26)

**Scaffold:** create-next-app 16.3.6 (`--disable-git`, no React Compiler), shadcn 4.21.0 `init -b base -p nova` → `components.json` style **`base-nova`**. shadcn preset installs `cn` (shadcn's own clsx+tailwind-merge replacement, `github.com/shadcn-ui/cn`) instead of clsx/tailwind-merge; `src/lib/utils.ts` re-exports it. Recharts resolved to **3.8.0** (pinned by shadcn chart; still v3).

**Frozen dependency checksums (sha256):**
- `package.json` `703d3a269435d057113ece97d922545505a67b4a83cf7253023666a37fdd9584`
- `package-lock.json` `0d0bd8091e077b30fee15c0445991807701b77e9a1231e8bb639037c54c87fba`

**Baseline:** `npm run lint` → exit 0, no output. `npm run build` → compiled, TypeScript OK, routes `/` and `/_not-found` static. One warning: Next detected an unrelated `C:\Users\udaym\package-lock.json` (user's own, left untouched) → fix with `turbopack.root` in `next.config.ts`.

**API findings / gotchas**
- Next 16: `template.tsx` gets a unique key per segment and remounts on navigation (default Server Component; ours is client). Cache Components is off, so no Activity-preserved routes. `LayoutProps<"/">` global helper type is used by the generated layout. Link scrolls to top on navigation; sticky headers are skipped when finding the scroll target → use `scroll-padding-top`.
- `globals.css` generated `--font-sans: var(--font-sans)` inside `@theme inline` (self-reference) → must point at `--font-geist-sans`.
- Base UI `Button`: `render` prop + `nativeButton` (default `true`) → links need `render={<Link …/>} nativeButton={false}`. `cn` merge means className overrides win.
- Base UI `Tabs`: `value` / `onValueChange(value, details)`, active tab is `data-active`.
- Base UI `TooltipTrigger` renders a `<button>` (keyboard-focusable), needs `TooltipProvider`; popup animates via `data-open`/`data-closed`.
- shadcn `Card` uses `ring-1 ring-foreground/10` and `rounded-xl` → restyle via className (`ring-0 border border-line rounded-[20px]`).
- shadcn `ChartContainer` has default `aspect-video` + `ResponsiveContainer initialDimension` → pass explicit height class and `aspect-auto`.
- motion 13 (`motion/react` re-exports framer-motion): `useScroll`, `useTransform` (incl. multi-input and function forms), `useMotionValue`, `useInView({once, amount, margin})`, `useReducedMotion`, `useMotionValueEvent`, `MotionConfig`, `animate`, `useSpring` all present.
- lenis 1.3.26: `autoRaf`, `lerp`, `syncTouch`, `anchors`, `prevent`; `scrollTo(target, {offset, immediate, duration, lock})`; `lenis/react` also exists (not used — imperative instance chosen to avoid remounting under reduced motion).
- Recharts 3.8 Area: `isAnimationActive` (`'auto'` default), `animationBegin/Duration/Easing`, `onAnimationEnd`.
- lucide-react 1.48: ArrowRight, AudioLines, Pause, Repeat2, BookOpenText, Gauge, Waypoints, NotebookPen, Info, TrendingUp, TrendingDown, Minus all exist.
- Browser tool: no MCP browser automation; system Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` via a minimal CDP script (kept lightweight per user instruction; fall back to plain headless screenshots if it becomes costly).
