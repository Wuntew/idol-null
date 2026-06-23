# Idol.Null Design System

## Direction

Idol.Null uses a **Signal Operations** interface: a restrained simulation console for monitoring a reality-survival game. Gameplay language stays explicit; `signal` and `noise` are secondary flavor.

- Incoming information: `Feed // incoming signal`
- Player intervention: `Influence // inject noise`
- Primary navigation: Today, Feed, Cast, Markets, Influence
- Secondary navigation: archive, leaderboard, account, and help live in Menu

## Foundations

- Interface type uses `--font-interface`; narrative/log copy uses `--font-narrative`.
- Normal text is at least 14px on mobile with generous narrative line-height.
- Cyan is informational, amber is decisional, green is confirmed, red is destructive, and violet is anomalous.
- Glow is reserved for urgent or supernatural states. Ordinary surfaces use quiet borders.

## Primitives

- `.ds-surface`: standard operational surface
- `.section-header`: title, optional flavor subtitle, and compact status/action area
- `.status-chip`: short state or count
- `.segmented-control`: switches views within one task
- `.terminal-card`: compact repeated decision or result item
- `.queue-receipt`: confirmed queued action

## Responsive Rules

### Mobile

- Show one task surface at a time.
- Keep five persistent bottom destinations.
- Use sheets for secondary navigation and overlays for maps/dossiers.
- Keep touch targets at least 44px and scroll within the active task panel.

### Desktop

- Use the three-zone command board: Decisions, Live Activity, Intelligence.
- Keep side rails independently scrollable.
- Use segmented Feed/Map views instead of stacking both.
- Keep narrative text constrained and internally scrollable.
