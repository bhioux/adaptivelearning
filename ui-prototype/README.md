# Adaptive Learning Platform — UI/UX Prototype

Interactive web UI/UX mockup built to the **EdX + Coursera aesthetic standard**.

## Design system

| Token | Value | Source |
| --- | --- | --- |
| Primary (dark) | `#EB7441` | EdX v2 live stylesheet |
| Primary (dark fallback) | `#D74000` | EdX |
| Primary (light) | `#F5BCA4` | EdX |
| Secondary | `#0056D2` | Coursera brand blue |
| Success | `#28A745` | Common LMS accent |
| Danger | `#DC3545` | Standard |
| Canvas (light) | `#F9F8F6` | EdX cream |
| Text (light) | `#1C1E21` | EdX neutral-900 |
| Font | **Inter** (fallback: Source Sans Pro, system) | EdX = Inter; Coursera = Source Sans Pro |
| Radius | 2–16 px, pill | Modern LMS cards |
| Shadow | 4–5 subtle, no borders on some panels | Coursera-style cards |

Light + dark modes. Spacing 4px base. Token source: `design-tokens.css`.

## Files

- `design-tokens.css` — design tokens (colors, type, spacing, radius, shadow, breakpoints, animation)
- `styles.css` — component library: buttons, inputs, toasts, modals, skeletons, badges, chips, cards, course cards, tables, chat, video player, wizard steps, etc.
- `shell.js` — shared header (brand, role nav, search, theme toggle, drawer), SVG icon library, toast helper
- `index.html` — hub linking all prototypes
- Role prototypes (web): `student-dashboard.html`, `course-player.html`, `live-class.html`, `adaptive-quiz.html`, `social-feed.html`, `tutor-onboarding.html`, `tutor-grading.html`, `parent-sneak-peek.html`, `admin-console.html`
- **Mobile screens** (`mobile/` — phone-framed interactive prototypes for the same flows; verified in-browser): `mobile/index.html` hub + 9 screens: `mobile/student-dashboard.html`, `mobile/course-player.html`, `mobile/live-class.html` (with chat drawer), `mobile/adaptive-quiz.html`, `mobile/social-feed.html`, `mobile/tutor-onboarding.html` (wizard), `mobile/tutor-grading.html`, `mobile/parent-sneak-peek.html`, `mobile/admin-console.html`. Style: `mobile/styles.css`; shared shell: `../shell.js`.
- `mobile/flutter-theme.dart` — **Flutter theme generated from the design tokens** (`AlTokens` constants, mobile-style theme), for the real Flutter app (Phase 0 "token export").

## Accessibility & verification

- All 19 pages pass **Lighthouse** with **Accessibility 100**, **SEO 100**, **Best Practices 100** (axe WCAG rules).
- Run locally: `python -m http.server` from `ui-prototype/` (or any static server), then open `http://localhost:8000/index.html`.

## How to run

Open `index.html` in a desktop browser:

```bash
xdg-open ui-prototype/index.html        # Linux
open ui-prototype/index.html            # macOS
```

On Windows, double-click `ui-prototype/index.html`. Dark mode via the moon icon in the header or the button at the bottom of the hub.

## Verification notes

- CSS variables are shared across all pages — overrides live in each page's `<style>`.
- No build step; everything is static HTML/CSS/JS (except Google Fonts, optional).
- Flutter mobile screens are **not** included; the web shell is responsive-first (media queries included).
