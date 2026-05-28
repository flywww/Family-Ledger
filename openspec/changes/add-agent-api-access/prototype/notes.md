# Agent API access prototype notes

Status: reference only

Implementation starts after this prototype is reviewed against the Family Ledger design system, the OpenSpec tasks are approved, and the Settings user-flow validation path is confirmed.

## Prototype

- Reference HTML: `docs/prototypes/agent-api-key-management.html`

## Purpose

This prototype explores the Agent Access Settings experience for creating and revoking agent API keys, showing one-time tokens, selecting fixed presets, and reviewing recent agent activity.

## Visual Decisions

- Place Agent Access inside the existing Settings area rather than introducing a new primary navigation item.
- Use fixed presets instead of custom scope checkboxes in v1.
- Keep destructive actions visibly separate from normal key management.
- Show recent activity as a compact panel, not a full audit-log browser.

## Responsive Review Notes

- Desktop should keep the Settings navigation beside the active panel.
- Mobile should stack the Settings navigation above the active panel without horizontal page overflow.
- API-key tables may use controlled overflow or responsive record cards, but key actions must remain visible and reachable.
