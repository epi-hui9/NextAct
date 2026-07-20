# ADR 002: iOS keyboard mitigation

## Decision

Hide app-owned bottom navigation when the Visual Viewport reports keyboard occlusion. Do not attempt to remove the WebKit input accessory bar in a pure PWA.

## Why

The accessory bar is not DOM. Unsupported hacks are fragile. Reducing app chrome is the production-grade mitigation.
