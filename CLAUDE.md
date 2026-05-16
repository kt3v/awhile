# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Vite)
npm run build    # tsc + vite build → dist/
npm run preview  # preview the production build
```

There is no test suite.

## Architecture

**Life in Months** — a React app that renders a person's life as a scrollable grid of month cells, one row per year. All data is persisted server-side via a `/api/data` endpoint (GET/PUT JSON file) using Zustand's `persist` middleware with a custom `apiStorage` adapter (`src/lib/apiStorage.ts`). There is no localStorage usage.

### State (`src/store/useStore.ts`)

Single Zustand store, persisted. Key slices:
- `settings` (`Settings | null`) — birthDate (YYYY-MM-DD) + totalYears; `null` until the user completes first-run setup.
- `notes` (`Record<string, Note>`) — keyed by `cellKey(year, month)` → `"YYYY-M"`.
- `selectedCell` / `selectedTagId` — mutually exclusive; selecting one clears the other.
- `rangeTags` (`RangeTag[]`) — user-drawn year-range annotations with a label, color, and freeform note.
- `theme` — `'light' | 'dark'`; applied by toggling `.dark` on `<html>` in `App.tsx`.

Store schema migrations live at the bottom of `useStore.ts`; bump `version` and add a migration case whenever the persisted shape changes. Current schema version: 3.

### Component tree

```
App
├── Grid            — scrollable year×month matrix; handles drag-to-select range
│   ├── MonthCell   — single cell; visual state derived from dates.ts helpers
│   └── TagsSidebar — absolutely-positioned sidebar left of the grid; tag chips + add-tag form
├── NotePanel       — slide-in panel (right); shows note for selected cell or selected tag
├── Legend          — color key shown in header
└── SettingsModal   — first-run + re-configurable settings overlay
```

### Styling system

Styling is a mix of **Tailwind utility classes** and **inline `style` props using CSS custom properties**. All design tokens are defined as CSS variables in `src/index.css` under `:root` (light) and `.dark` overrides. The Tailwind config (`tailwind.config.js`) mirrors the same palette as named tokens (`lvl-*`, `paper-*`, `ink-*`) for use in class names.

**Always use the CSS variable tokens** (e.g. `var(--bg-primary)`, `var(--text-2)`, `var(--border)`) for any color or shadow that needs to respond to theme. Raw hex values are only acceptable for fixed-color content (e.g. white text on a colored tag chip).

Cell visual states are driven by CSS classes defined in `index.css`: `cell-past`, `cell-future`, `cell-note-past`, `cell-note-future`, `cell-inactive`.

### TagsSidebar layout

`TagsSidebar` is positioned absolutely to the left of the grid using pixel math. The constants `ROW_PITCH`, `DECADE_EXTRA`, `CELL_HEIGHT`, and `CHIP_HEIGHT` in `TagsSidebar.tsx` **must stay in sync** with the actual rendered dimensions in `Grid.tsx` (row height is `h-5` = 20 px, gap is `gap-1` = 4 px, decade dividers add 17 px). If Grid layout changes, update these constants together.

### Key utilities

- `src/utils/dates.ts` — `parseBirthDate` splits `"YYYY-MM-DD"` manually (no `new Date()`) to avoid timezone shifts. `isBeforeBirth` marks months before the birth month in the birth year as inactive.
- `src/utils/tagColors.ts` — maps `TagColor` to CSS variable strings and contrasting label colors.
