# PWA and iPhone

## Install

Safari → Share → Add to Home Screen. Standalone display is required for Web Push.

## Launch

Manifest and layout use Brand Color 3 ivory (`#FAFAF8`) so the launch surface is not black. Service worker cache `nextact-shell-v2` precaches the shell and offline page.

## Keyboard

While the composer is focused and the software keyboard is open, the app hides the bottom navigation using the Visual Viewport API and keeps the composer above the keyboard.

### System keyboard accessory bar

Previous / Next / Done above the iOS keyboard are WebKit controls. A pure PWA cannot reliably remove them. Full removal requires a native wrapper. This is an honest platform constraint, not an unfinished CSS task.

## Web Push

Permission is requested only from a direct tap on “Enable my 10:00 AM reminder”. Denial does not break the product. Delivery can be delayed by iOS and the push network even when scheduled for 10:00 local time.
