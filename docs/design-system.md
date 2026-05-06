# Family Ledger Design System

Last updated: 2026-05-06

## 1. System Purpose

Family Ledger is a private web app for family wealth tracking, monthly balance review, asset/liability management, refresh monitoring, and account settings. This design system defines the target UI standard for the product, not just the current implementation.

The product should feel:

- Trustworthy enough for financial records.
- Calm enough for repeated personal use.
- Dense enough for real portfolio review.
- Clear enough that one person can maintain it without visual drift.

This is a web-app system first. Marketing pages, if added later, must follow the same token and component language but may use a more spacious page composition.

## 2. Design Philosophy

### North Star

Family Ledger is a finance operations cockpit for a household. The UI should make financial status, month-to-month movement, data freshness, and correction workflows obvious.

### Principles

- **Trust over decoration:** use restrained surfaces, clear hierarchy, stable controls, and no ornamental effects.
- **Dashboard first:** prioritize scanning, comparing, filtering, and correcting data over broad explanatory copy.
- **Data confidence:** always show whether values are fresh, estimated, failed, manually edited, or pending refresh.
- **Progressive density:** desktop can be dense; mobile should convert dense tables into readable records without losing key actions.
- **Consistency by tokens:** colors, radii, shadows, type, spacing, and chart colors come from this system, not one-off page styling.
- **Accessible by default:** keyboard, screen reader, contrast, and reduced-motion needs are design requirements, not cleanup tasks.

## 3. Source Of Truth

Design rules live here:

- Design system: `docs/design-system.md`
- Design conflict backlog: `docs/design/design-consistency-conflicts.md`
- OpenSpec enforcement: `openspec/config.yaml`

Implementation sources:

- Tokens: `app/globals.css`
- Tailwind mapping: `tailwind.config.ts`
- shadcn config: `components.json`
- UI primitives: `components/ui/*`
- App surfaces: `app/*`, `components/dashboard/*`, `components/balance/*`, `components/layouts/*`

Conflict rule:

1. Follow this document for target product design.
2. Follow shadcn/Tailwind tokens for implementation mechanics.
3. If existing code conflicts with the target system, record it in `docs/design/design-consistency-conflicts.md` and fix it in a deliberate change.

## 4. Brand And Product Personality

### Brand Attributes

| Attribute | Meaning In UI |
| --- | --- |
| Private | Avoid loud marketing visuals inside the app; keep the interface focused and secure-feeling. |
| Financial | Use precise labels, aligned numbers, clear statuses, and conservative colors. |
| Family-scale | Avoid enterprise complexity; workflows should feel lightweight and understandable. |
| Monthly | Treat month navigation and period context as first-class UI elements. |
| Correctable | Make edits, retries, imports, and refresh states visible and recoverable. |

### Voice

Use short, direct product language:

- Prefer: `Create balance`, `Refresh failed`, `Estimated price`, `No balances found`.
- Avoid: vague encouragement, playful phrasing, and long instructional copy inside core screens.

Tone should be calm and factual. Error text should explain what happened and what the user can do next.

## 5. Visual Direction

### Target Style

Use **flat, professional finance minimalism**:

- Mostly flat surfaces.
- Subtle borders.
- Minimal shadows.
- Monochrome/slate foundation.
- Blue primary action.
- Status colors only where they carry meaning.
- No decorative gradients in authenticated app screens.

The `ui-ux-pro-max` recommendation for this product type maps to:

- Pattern: web-app / SaaS dashboard, not an app-store landing page inside authenticated UI.
- Style: flat design with excellent performance and accessibility.
- Palette: monochrome + blue accent.
- Typography: modern SaaS sans-serif, with Plus Jakarta Sans as the preferred future font.
- Motion: quick color/opacity transitions, no layout-shifting animation.

### Anti-Patterns

Do not use:

- AI purple/pink gradients.
- Decorative blobs, bokeh, or floating orbs.
- Glassmorphism for core finance cards.
- Oversized editorial typography inside dashboard pages.
- Emoji as icons.
- Layout-shifting hover transforms.
- Color-only status communication.
- Marketing hero composition for authenticated workflows.

## 6. Token System

### Token Layers

Use three token layers:

```text
(primitive color values)
  -> (semantic CSS variables in app/globals.css)
    -> (Tailwind semantic classes in components)
```

Components should use semantic classes such as `bg-background`, `text-foreground`, `border-border`, and `bg-primary`. Direct palette utilities such as `text-slate-500` or `bg-amber-50` are allowed only for documented status or transitional legacy use.

### Core Semantic Tokens

| Role | Tailwind Token | Target Meaning |
| --- | --- | --- |
| App background | `bg-background` | Main page background and authenticated shell |
| Primary foreground | `text-foreground` | Main text, values, labels, headings |
| Card surface | `bg-card` | Cards, chart containers, form panels |
| Card foreground | `text-card-foreground` | Text inside card surfaces |
| Popover surface | `bg-popover` | Dropdowns, command menus, date/month pickers |
| Primary | `bg-primary` | Main call to action and selected controls |
| Primary foreground | `text-primary-foreground` | Text/icons on primary controls |
| Secondary | `bg-secondary` | Lower-emphasis buttons and soft panels |
| Muted | `bg-muted` | Table header bands, empty states, secondary surfaces |
| Muted foreground | `text-muted-foreground` | Help text, metadata, supporting labels |
| Accent | `bg-accent` | Hover, active menu item, subtle selected surface |
| Destructive | `bg-destructive`, `text-destructive` | Delete, irreversible actions, validation errors |
| Border | `border-border` | Card and table boundaries |
| Input | `border-input` | Form field boundary |
| Ring | `ring-ring` | Focus and active input feedback |

### Recommended Light Theme Values

These values should guide future token tuning:

| Role | Hex | Reason |
| --- | --- | --- |
| Background | `#FAFAFA` | Softer than pure white for app surfaces |
| Card | `#FFFFFF` | Clean finance content surface |
| Foreground | `#09090B` | High-contrast zinc/slate text |
| Muted | `#F4F4F5` | Subtle section/table background |
| Muted foreground | `#52525B` | Accessible supporting text |
| Primary | `#2563EB` | Clear blue action and focus color |
| Primary hover | `#1D4ED8` | Accessible hover state |
| Border | `#E4E4E7` | Visible but quiet boundaries |
| Ring | `#2563EB` | Consistent focus signal |

### Recommended Dark Theme Values

| Role | Hex |
| --- | --- |
| Background | `#09090B` |
| Card | `#18181B` |
| Foreground | `#FAFAFA` |
| Muted | `#27272A` |
| Muted foreground | `#A1A1AA` |
| Primary | `#3B82F6` |
| Primary hover | `#60A5FA` |
| Border | `#27272A` |
| Ring | `#60A5FA` |

## 7. Color Semantics

### Action Colors

| Meaning | Color Role | Usage |
| --- | --- | --- |
| Primary action | Blue primary | Create, submit, selected view, confirm non-destructive action |
| Secondary action | Secondary surface | Create helper action, low-risk utility |
| Neutral action | Outline/ghost | Menus, filters, sort, month navigation |
| Destructive action | Destructive red | Delete, irreversible reset, critical failure acknowledgement |

### Financial And Operational Status

| Status | Target Classes | Usage |
| --- | --- | --- |
| Fresh / completed / success | `text-emerald-600`, `bg-emerald-50`, `border-emerald-200` | Successful price refresh, completed job |
| Estimated / pending / caution | `text-amber-600`, `bg-amber-50`, `border-amber-200` | Estimated price, pending refresh, partial data |
| Failed / liability / destructive | `text-rose-600`, `bg-rose-50`, `border-rose-200` | Failed refresh, liabilities, error state |
| Running / info | `text-sky-700`, `bg-sky-50`, `border-sky-200` | In-progress refresh, informational alerts |
| Disabled / unavailable | `text-muted-foreground`, `bg-muted` | Disabled controls, unavailable data |

Rules:

- Pair status color with text, icon, tooltip, or `aria-label`.
- Do not use green/red alone for asset/liability meaning.
- Do not use status colors for decoration.
- Do not use blue for both primary action and passive information in the same component without a label.

## 8. Typography

### Target Typeface

Preferred future font:

- **Plus Jakarta Sans** for headings and body.
- Load with `next/font/google`.
- Use weights 400, 500, 600, and 700.

Current system font is acceptable until a typography implementation change is scheduled. Do not use CSS `@import` for fonts in a Next.js app.

### Type Scale

| Token | Size | Tailwind | Usage |
| --- | --- | --- | --- |
| Display | 36/40 | `text-4xl leading-10` | Public/marketing hero only |
| Page title | 24/32 | `text-2xl leading-8 font-semibold` | Main page heading |
| Section title | 20/28 | `text-xl leading-7 font-semibold` | Card group or page section |
| Card title | 16/24 | `text-base leading-6 font-semibold` | Summary/chart/table panels |
| Body | 14/20 | `text-sm leading-5` | Default app text and tables |
| Small | 12/16 | `text-xs leading-4` | Metadata, labels, compact badges |
| Numeric emphasis | 20/28 | `text-xl leading-7 font-semibold tabular-nums` | Summary metrics |

Rules:

- Use `font-medium` or `font-semibold` for structure; avoid `font-extralight` for important finance text.
- Use `tabular-nums` for money, quantities, percentages, and month comparisons.
- Letter spacing should stay normal except for tiny uppercase labels, where `tracking-wide` is acceptable.
- Avoid viewport-scaled type inside the web app.

## 9. Spacing And Layout Tokens

### Spacing Scale

Use Tailwind spacing consistently:

| Token | Size | Usage |
| --- | --- | --- |
| `gap-1` | 4px | Icon/text pairs, tight inline controls |
| `gap-2` | 8px | Toolbar controls, compact stacks |
| `gap-3` | 12px | Dashboard cards and chart grids |
| `gap-4` | 16px | Page sections, form groups |
| `gap-6` | 24px | Larger sections or modal content |
| `p-2` | 8px | Table cells, compact cards |
| `p-3` | 12px | Status panels, mobile records |
| `p-4` | 16px | Mobile page padding, cards |
| `p-6` | 24px | Standard card content |
| `p-8` | 32px | Desktop page padding |

### Page Widths

| Surface | Rule |
| --- | --- |
| Authenticated app shell | Full width |
| Main content | `p-4 sm:p-8`, no marketing max-width by default |
| Dashboard chart grid | Full available width |
| Forms | `w-full max-w-sm` for narrow auth forms; `w-full sm:w-80` for fields |
| Tables | Full width on desktop, card layout or controlled overflow on mobile |

## 10. Shape, Border, Shadow

### Radius

| Element | Radius |
| --- | --- |
| Buttons, inputs, selects | `rounded-md` |
| Menus, popovers | `rounded-md` |
| Cards | target `rounded-lg`; current `rounded-xl` is a tracked consistency decision |
| Badges, pills | `rounded-full` only for small status/count pills |
| Tables | outer wrapper `rounded-md` or `rounded-lg` |

### Borders

- Use `border-border` for card/table boundaries.
- Use `border-input` for form controls.
- Use border + background for status panels.
- Avoid invisible borders such as low-opacity white on light mode.

### Shadows

Use minimal shadows:

- Default app cards: `shadow-sm` or no shadow.
- Popovers/dropdowns/dialogs: `shadow-md`.
- Avoid heavy shadows for dashboard cards.

## 11. App Structure

### Global Shell

```text
(family-ledger
  (root providers)
  (auth shell
    (top navigation
      (brand)
      (primary nav)
      (account/settings menu))
    (page content)))
```

Rules:

- Top navigation is persistent for authenticated pages.
- Month context should appear close to dashboard/balance content, not hidden in settings.
- Account, theme, currency, and sign-out belong in an account/menu control.

### Core Routes

| Route | Primary Job | Design Priority |
| --- | --- | --- |
| `/login` | Authenticate or demo login | Focused, simple, secure-feeling |
| `/dashboard` | Review monthly net worth and asset composition | Fast scan, clear trend, chart readability |
| `/balance` | Inspect and maintain holdings | Dense table, filters, edit/retry actions |
| `/balance/create` | Add a monthly balance item | Clear form, safe defaults, feedback |
| `/balance/[id]/edit` | Correct an existing holding value | Clear edit form, preserve context |
| `/setting` | Account, password, operational tools | Separated sections, caution for test/cron tools |

## 12. Navigation System

### Desktop Navigation

Use a horizontal top nav:

```text
(nav
  Family Ledger
  [Dashboard] [Balance]
  [Menu])
```

Rules:

- Active nav item uses `bg-accent text-accent-foreground` or equivalent.
- Hover state uses background or border change, not text opacity only.
- Primary nav should stay short. Move secondary actions into Menu or page toolbars.

### Mobile Navigation

Rules:

- Keep brand visible.
- Put route links in the Menu dropdown or a future bottom nav.
- Keep primary page action available on mobile if it exists on desktop.
- Icon-only navigation must have labels for assistive tech.

## 13. Component Standards

### Buttons

| Variant | Usage |
| --- | --- |
| `default` | Primary submit, selected segmented option, main create action |
| `secondary` | Helpful but not primary action |
| `outline` | Month picker, filters, neutral menu trigger |
| `ghost` | Table sort/header actions, icon-only row actions |
| `destructive` | Delete and irreversible actions |
| `link` | Inline navigation only |

Rules:

- Minimum height: `h-9`; touch-target controls should be at least 40px where practical.
- Icon spacing: `gap-2`.
- Icon-only controls: `size="icon"` plus `sr-only` or `aria-label`.
- Use `cursor-pointer` for custom clickable non-button surfaces.

### Inputs And Selects

Rules:

- Always show a label.
- Use placeholder as an example, not as a label.
- Use `type="number"` for numeric finance input.
- Use `autocomplete` for login/account fields where applicable.
- Use `w-full sm:w-80` for narrow forms.
- Show validation on blur or submit; do not wait silently after failed submit.

### Forms

Standard form structure:

```text
(form
  (field label)
  (control)
  (description optional)
  (message/error)
  (actions))
```

Rules:

- Use `react-hook-form`, Zod schemas, and shadcn `FormField`.
- Show loading on submit.
- Show success, redirect, or error feedback.
- Preserve user-entered values after validation errors.
- Dangerous form actions require explicit labels and confirmation.

### Cards

Use cards for:

- Summary metrics.
- Charts.
- Focused forms.
- Status panels.
- Mobile data records.

Do not use cards for:

- Entire page sections that do not need framing.
- Nested decorative layout shells.
- Marketing-style feature blocks inside the app.

### Tables

Rules:

- Desktop tables use full width.
- Mobile tables convert to cards unless horizontal comparison is essential.
- Header sort controls are buttons with icon + text.
- Money and percentage columns align right.
- Use `tabular-nums`.
- Empty state includes what is missing and, when useful, the next action.

### Menus And Popovers

Rules:

- Use Radix/shadcn menu primitives.
- Keep menus short and grouped with separators.
- Destructive menu items must be visually and textually clear.
- Avoid putting complex workflows in nested menus.

### Dialogs

Use dialogs for:

- Confirming destructive actions.
- Short focused workflows that should not navigate away.
- Explaining a blocking state.

Rules:

- Include title, description, primary action, cancel action.
- Initial focus must land on a safe control unless the action is non-destructive.
- Escape and outside click behavior should not lose unsaved critical input without confirmation.

### Alerts And Status Panels

Rules:

- Use status color + icon + label.
- Include a short message and recommended action when recovery is possible.
- Use `role="status"` for passive updates and `role="alert"` for urgent errors.

### Badges

Use badges for compact metadata:

- `Fresh`
- `Estimated`
- `Failed`
- `Pending`
- `Running`
- `Demo`

Badges must not replace full explanations where a user needs to act.

### Reusable Component Catalog

Purpose: reusable components are part of the design system, not just code convenience. A component belongs in this catalog when it is used by more than one screen, encodes a durable financial/status/accessibility pattern, or is intended to be reused by future UI work.

Catalog maintenance rules:

- New reusable components must be documented here and mirrored in `docs/design-system.html`.
- If a one-off component becomes reused, promote it into this catalog in the same change.
- If a reusable component intentionally diverges from the design system, record the conflict in `docs/design/design-consistency-conflicts.md`.
- OpenSpec UI proposals should state whether they reuse, extend, add, or intentionally avoid a reusable component.
- Product-level reusable components should wrap or compose `components/ui/*` primitives instead of replacing their accessibility behavior.
- `npm run docs:check` verifies that managed reusable component file paths stay listed in both the Markdown and HTML design-system references.

Layering:

```text
components/ui/*
  shadcn/Radix primitives and generic visual primitives

components/dashboard/*, components/balance/*, components/layouts/*, components/search.tsx
  Family Ledger product components and reusable app patterns

app/*
  route composition, data loading, and screen-specific assembly
```

Current managed component inventory:

| Component | File | Design-system role | Allowed use |
| --- | --- | --- | --- |
| Button | `components/ui/button.tsx` | Standard action primitive and variant API. | All buttons, including icon-only actions with labels. |
| Card | `components/ui/card.tsx` | Standard framed surface primitive. | Metrics, charts, forms, status panels, and mobile records. |
| Table | `components/ui/table.tsx` | Standard tabular primitive. | Desktop financial and operational data tables. |
| Form primitives | `components/ui/form.tsx` | Form field accessibility and validation structure. | Data entry and account forms using `react-hook-form`. |
| Input | `components/ui/input.tsx` | Text and numeric field primitive. | Labeled finance/account inputs. |
| Label | `components/ui/label.tsx` | Accessible label primitive. | Form labels and labeled controls. |
| Select | `components/ui/select.tsx` | Option selection primitive. | Filters, categories, and bounded setting choices. |
| Dialog | `components/ui/dialog.tsx` | Modal workflow primitive. | Destructive confirmations and focused short workflows. |
| Dropdown menu | `components/ui/dropdown-menu.tsx` | Menu primitive. | Row actions, account menus, and compact command groups. |
| Popover | `components/ui/popover.tsx` | Anchored overlay primitive. | Month pickers, filters, and compact contextual panels. |
| Command | `components/ui/command.tsx` | Searchable command/list primitive. | Search-like menus and bounded picker workflows. |
| Calendar | `components/ui/calendar.tsx` | Date selection primitive. | Date picking when month-level selection is not enough. |
| Month picker | `components/ui/month-picker.tsx` | Month-context control primitive. | Month navigation and period selection. |
| Chart primitives | `components/ui/chart.tsx` | Token-backed chart container and tooltip layer. | Recharts surfaces that use `--chart-*` variables. |
| Navigation menu | `components/ui/navigation-menu.tsx` | Accessible navigation primitive. | Authenticated shell navigation surfaces. |
| Scroll area | `components/ui/scroll-area.tsx` | Scroll container primitive. | Menus and panels that need stable contained scrolling. |
| Separator | `components/ui/separator.tsx` | Visual grouping primitive. | Menu, panel, and form section separation. |
| Skeleton | `components/ui/skeleton.tsx` | Loading placeholder primitive. | Loading states shaped like the final content. |
| Tabs | `components/ui/tabs.tsx` | Segmented view primitive. | Bounded mode/view switching. |
| Textarea | `components/ui/textarea.tsx` | Multi-line field primitive. | Notes and longer text input. |
| Loading spinner | `components/ui/loading-spinner.tsx` | Compact loading indicator. | Inline async actions where skeletons are too large. |
| Dashboard summary card | `components/dashboard/summary-card.tsx` | Finance metric card pattern. | Net worth, assets, liabilities, and other top-level metrics. |
| Dashboard summary section | `components/dashboard/summary-section.tsx` | Metric group layout pattern. | Dashboard metric rows and responsive summary groups. |
| Chart section | `components/dashboard/chart-section.tsx` | Framed chart panel pattern. | Dashboard chart groupings with titles and supporting context. |
| Dashboard line chart | `components/dashboard/dashboard-line-chart.tsx` | Time-series finance chart pattern. | Net worth and category trend charts. |
| Dashboard pie chart | `components/dashboard/dashboard-pie-chart.tsx` | Simple composition chart pattern. | Small allocation/composition views only. |
| Category selector | `components/dashboard/category-selector.tsx` | Chart/filter segmentation pattern. | Category filtering where options are bounded. |
| Balance table | `components/balance/balance-table.tsx` | Balance review table pattern. | Desktop balance review and correction workflow. |
| Balance table toolbar | `components/balance/balance-table-toolbar.tsx` | Financial table toolbar pattern. | Month, filter, and table-level action groups. |
| Retry failed button | `components/balance/retry-failed-button.tsx` | Recoverable failure action pattern. | Refresh retry flows and similar recoverable operations. |
| Monthly refresh status | `components/monthly-refresh-status.tsx` | Data confidence/status panel pattern. | Monthly refresh progress, success, failure, and pending states. |
| Cron health alert | `components/cron-health-alert.tsx` | Operational alert pattern. | Background job health and recovery messaging. |
| Search/month navigation | `components/search.tsx` | Month navigation and compact search control pattern. | Dashboard/balance period navigation. |
| Navigation links | `components/layouts/nav-links.tsx` | Primary route navigation pattern. | Authenticated shell navigation. |
| Navigation menu | `components/layouts/nav-menu.tsx` | Account/settings menu pattern. | Authenticated shell menu actions. |

## 14. Data Visualization

### Chart Types

| Data Need | Primary Chart | Secondary Chart |
| --- | --- | --- |
| Net worth over time | Line chart | Area chart |
| Asset category trend | Multi-series line chart | Stacked area chart |
| Asset category comparison | Bar chart | Pie/donut chart for simple composition |
| Current asset allocation | Donut or pie chart | Treemap only with table alternative |
| Price refresh status | Status list/table | Small segmented count cards |
| Asset/liability comparison | Grouped bar | Summary cards |

Rules from `ui-ux-pro-max`:

- Trend over time: line chart is best.
- Category comparison: bar chart is easier to compare than pie when precision matters.
- Pie/donut should be limited to simple composition views.
- Complex charts need table alternatives.

### Chart Accessibility

- Keep Recharts `accessibilityLayer` where supported.
- Provide tooltip values in readable currency/percentage format.
- Do not rely only on color. Use labels, legends, line thickness, or table alternatives.
- Limit simultaneous line series; if many categories exist, add toggles or filtering.

### Chart Visual Rules

- Use `--chart-1` through `--chart-5`.
- Main series uses strongest stroke.
- Secondary series use thinner strokes or muted opacity.
- Use consistent category color mapping within a chart.
- Add chart titles that describe the data, not the chart type.

## 15. State Design

Every interactive surface needs defined states:

| State | Required UI |
| --- | --- |
| Default | Clear label, normal contrast |
| Hover | Color/background/border feedback |
| Focus | Visible `focus-visible:ring-*` |
| Active/selected | Persistent selected styling |
| Disabled | Lower opacity plus disabled semantics |
| Loading | Spinner/skeleton/progress text |
| Empty | Message and optional next action |
| Error | Explanation plus recovery action |
| Success | Confirmation or reflected data update |
| Pending | Pending label and stable layout |

Rules:

- Loading must not cause major layout shift.
- Skeletons should match the final content shape.
- Empty states should not look like errors.
- Errors must be recoverable when possible.

## 16. Responsive System

### Breakpoints To Validate

- 320px: minimum small phone stress check.
- 375px: default mobile target.
- 414px: large phone target.
- 768px: tablet.
- 1024px: small desktop.
- 1440px: desktop.

### Responsive Patterns

| Surface | Mobile | Desktop |
| --- | --- | --- |
| Navigation | Brand + menu | Brand + nav links + menu |
| Summary metrics | Single stacked card or compact list | Three or more cards |
| Balance table | Stacked records | Data table |
| Toolbar | Wrapped vertical groups | Horizontal/wrapped controls |
| Forms | Full width controls | Constrained controls |
| Charts | One column, fixed readable height | Grid layout |

Rules:

- No horizontal page scroll.
- Controls must not overflow their parent.
- Use `min-w-0` in flex/grid children that contain long text.
- Long account IDs, holding names, and symbols must wrap or truncate deliberately.

## 17. Accessibility Requirements

### Keyboard

- All actions reachable by keyboard.
- Focus order follows visual order.
- Focus ring visible on all interactive controls.
- Dropdowns, popovers, and dialogs use shadcn/Radix semantics.

### Screen Readers

- Icon-only actions include `aria-label` or `sr-only` text.
- Status icons include `title`, `aria-label`, or adjacent visible text.
- Form errors use accessible message elements.
- Loading and async result messages use `role="status"` or `aria-live` where useful.

### Contrast

- Body text must meet WCAG AA.
- Muted text must remain readable on light and dark backgrounds.
- Status text on tinted backgrounds must remain readable.
- Charts need labels/tooltips/table alternatives when color contrast is not enough.

### Motion

- Respect `prefers-reduced-motion`.
- Keep transitions 150-300ms.
- Avoid movement that shifts layout or hides financial values.

## 18. Content Guidelines

### Labels

Use nouns for data and verbs for actions:

- Data: `Net value`, `Assets`, `Liabilities`, `Currency`, `Quantity`, `Price`, `Value`.
- Actions: `Create balance`, `Edit`, `Delete`, `Retry failed`, `Sign out`.

### Dates And Money

- Show month context as `MMM yyyy` in controls.
- Use localized currency formatting for displayed monetary values.
- Show currency code when ambiguity is possible.
- Use clear signs for month-over-month deltas: `+1,200 from last month`.

### Errors

Error format:

```text
What happened. What to do next.
```

Examples:

- `Price refresh failed. Retry this holding or enter a price manually.`
- `Balance could not be saved. Check required fields and try again.`

## 19. Page Patterns

### Login

Target:

```text
(login page
  (centered auth panel
    (brand)
    (short instruction)
    (account field)
    (password field)
    (submit)
    (demo credentials optional)))
```

Rules:

- Use a focused panel with tokenized background.
- Avoid loud gradients unless a separate public identity system is defined.
- Support password manager autofill.
- Show loading and invalid credentials clearly.

### Dashboard

Target:

```text
(dashboard
  (month controls)
  (summary metrics)
  (net worth trend)
  (asset allocation)
  (refresh/data confidence status optional))
```

Rules:

- Most important number appears first.
- Month controls remain visible near the top.
- Charts include clear titles, tooltips, and legends.
- Data confidence status should be visible when data is estimated/failed.

### Balance

Target:

```text
(balance page
  (toolbar: month, filter, view, actions)
  (status/refresh alert optional)
  (desktop table / mobile records))
```

Rules:

- Filter and month navigation are primary controls.
- Create action must be reachable on mobile and desktop.
- Inline edits need saving/loading/error feedback.
- Destructive row actions require confirmation or clear recovery design.

### Settings

Rules:

- Separate account settings from operational/testing tools.
- Use section headings and supporting copy sparingly.
- Risky operational controls need warning styling and explicit labels.

## 20. Implementation Standards

### Tailwind

- Use semantic Tailwind token classes first.
- Keep layout utilities in components.
- Avoid arbitrary values unless they encode a stable component dimension.
- Do not introduce a new color directly in a component unless it becomes a documented token or status color.

### shadcn

- Prefer shadcn primitives for buttons, forms, menus, dialogs, tables, cards, popovers, selects, and tabs.
- Do not replace built-in ARIA behavior.
- For new common layout patterns, consider shadcn blocks as scaffolding but adapt them to this design system.

### Next.js

- Use `next/font/google` for any font adoption.
- Keep server/client boundaries explicit.
- Use Server Actions for form mutations when practical.
- Use loading states for route segments and async actions.

## 21. Governance

### When To Update This Document

Update this document when a change introduces or alters:

- Global tokens.
- Typography.
- Navigation structure.
- Card/table/form/button patterns.
- Chart palette or chart rules.
- Accessibility policy.
- Responsive layout rules.
- Page pattern standards.

### When To Update The Conflict Backlog

Update `docs/design/design-consistency-conflicts.md` when:

- Existing code violates this system.
- A proposed UI needs to diverge temporarily.
- A design decision is unresolved.
- A one-off implementation starts to look reusable.

### OpenSpec Usage

Any UI-related OpenSpec change should include:

- Design-system compliance acceptance criteria.
- Accessibility acceptance criteria.
- Visual impact classification: none, small, medium, or large.
- A Visual Review section in `design.md` with the smallest useful visual artifact: UI tree, ASCII wireframe, Mermaid flow, or numbered flow.
- For medium or large visual impact, a reference-only prototype checkpoint inside the OpenSpec change before implementation.
- Mobile and desktop verification tasks.
- A note about whether conflict backlog updates are needed.
- For complex work that uses the Superpowers development process, an implementation task to build against this design system and a review task to run the checklist below before completion.

## 22. Design Review Checklist

Use this before finishing UI work:

- [ ] Uses semantic tokens for color and surfaces.
- [ ] Follows the target flat finance web-app style.
- [ ] Keeps dashboard/balance workflows compact and scannable.
- [ ] Uses shadcn primitives before custom components.
- [ ] Has visible hover, focus, selected, disabled, loading, empty, and error states where relevant.
- [ ] Uses Lucide/Radix icons, not emoji icons.
- [ ] Icon-only controls have accessible labels.
- [ ] Forms have labels, validation, loading, and result feedback.
- [ ] Status is not communicated by color alone.
- [ ] Numbers use clear formatting and `tabular-nums` where useful.
- [ ] Charts use approved chart types and token colors.
- [ ] Mobile works at 320px and 375px without horizontal page scroll.
- [ ] Desktop works at 1024px and 1440px.
- [ ] Any intentional inconsistency is recorded in the design conflict backlog.
