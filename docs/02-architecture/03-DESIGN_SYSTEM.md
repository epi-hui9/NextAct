# Design system

NextAct uses CSS design tokens in `app/globals.css`. Do not introduce MUI, Ant Design, or default shadcn skins.

## Brand Color 3

| Token | Hex |
| --- | --- |
| Navy | `#0B1F3A` |
| Mist | `#B7C4D6` |
| Ivory | `#FAFAF8` |
| Slate | `#7C8798` |

## Spacing (4pt grid)

- Page x padding: `20px` (`--page-x`)
- Section gap: `32px`
- Tap target: `44px`
- List row: `56px`

## Type

System stack (SF Pro / -apple-system). Scale: 13 / 15 / 17 / 22 / 30. Body 17px, line-height 1.45. Tabular nums for percentages.

## Materials

Glass (`backdrop-filter`) only on bottom nav, sheets, and floating chrome. Content surfaces stay solid ivory/white. Two shadow levels only.

## Motion

- Press: scale 0.97, 80ms
- Enter: fade + 8px rise, 220ms
- Respect `prefers-reduced-motion`

## App shell

All primary screens render inside `components/AppShell.tsx`: safe areas, scroll region, bottom nav, update banner, account sheet.
