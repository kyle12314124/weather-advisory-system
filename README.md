# Weather Advisory System

A premium dark-themed weather dashboard for the Philippines, built with **React 19 + TypeScript + Vite 8 + Tailwind CSS v4**.

Weather data is provided by [Open-Meteo](https://open-meteo.com/) (no API key required). The app also links to [PAGASA](https://www.pagasa.dost.gov.ph/) for official Philippine government weather bulletins.

## Features

- **Current weather hero** — temperature, condition imagery, feels-like, humidity, wind, precipitation, visibility, pressure, and a UV index meter with exposure guidance
- **Hourly forecast** — next 24 hours in a horizontally scrollable strip with precipitation probability bars
- **7-day forecast** — temperature range bars scaled to the week's min/max, sunrise/sunset times
- **Charts** (lazy-loaded) — hourly temperature, hourly precipitation, 7-day temperature range, and 7-day precipitation totals via Recharts
- **Rule-based advisories** — generated locally from forecast thresholds (heat, cold, wind, precipitation, UV, visibility, thunderstorm preparedness). Visually distinct from official PAGASA warnings, which always require visiting the PAGASA website
- **Saved locations** — favorites persisted in localStorage with a "Current" indicator
- **Settings** — temperature/wind/precipitation units, light/dark/system theme, 24-hour time toggle, UV display, auto-refresh interval, device geolocation
- **Location search** — accessible combobox autocomplete against the Open-Meteo geocoding API
- **States** — loading skeletons, error + retry, offline detection, empty states

## Getting started

```bash
npm install
npm run dev      # start dev server (http://localhost:3000)
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm test` | Run the Vitest suite (unit + jsdom smoke tests) |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview the production build |

## Design system

The visual language lives in `src/index.css` as Tailwind v4 design tokens:

- **Surfaces**: `bg-canvas`, `bg-card`, `bg-raised`, `bg-muted`
- **Borders**: `border-line`, `border-line-strong`
- **Text**: `text-ink`, `text-ink-secondary`, `text-ink-muted`
- **Accent**: `text-accent`, `bg-accent-soft` (subtle blue/cyan)
- **Elevation**: `shadow-card`, `shadow-pop`

Tokens are CSS variables flipped by a `.dark` class on `<html>` (applied by the theme effect in `src/App.tsx`, respecting the `dark`/`light`/`system` setting). Charts read `--chart-*` variables so they stay theme-aware. Animations are restrained (fade/slide entrances, skeleton shimmer) and fully disabled under `prefers-reduced-motion`.

Weather code → icon/color mapping is centralized in `src/services/weatherTheme.ts`.

## Project structure

```
src/
├── api/openMeteo.ts        # Open-Meteo API client (geocoding + forecast)
├── components/             # UI components (primitives + feature panels)
├── hooks/                  # useSettings, useLocations, useGeocoding, useWeather, useAdvisory
├── services/               # weatherCodes, weatherTheme, advisoryEngine, storage
├── types/                  # Shared TypeScript types
├── utils/                  # Unit conversion and date formatting
├── App.tsx                 # Layout, theme, tabs, search dialog
└── index.css               # Tailwind v4 + design tokens
tests/                      # Vitest unit and jsdom smoke tests
```

## Accessibility

- Semantic landmarks (`header`/`main`/`footer`/`section`), a skip link, and a roving-tabindex tab strip with arrow-key navigation
- ARIA-compliant combobox search, switches (`role="switch"`), tab panels, and live-region alerts for advisories
- Visible focus rings, 44px-class touch targets, and high-contrast/reduced-motion support

## Disclaimer

Advisories shown in the app are **auto-generated from Open-Meteo forecast data** and are not official warnings. For official Philippine weather information, visit [PAGASA](https://www.pagasa.dost.gov.ph/).
