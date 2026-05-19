# ADR-007: Board and Piece Visual Representation

**Status:** Accepted
**Date:** 2025-01-19

## Context

Chinese Chess has a distinctive visual style: a 9×10 grid with a river, palace diagonal lines, point dots, and pieces with Chinese characters. The visual design must be authentic yet simple to implement.

## Decision

- Board: flat colors (no wood texture), simple grid lines.
- River: text "楚河漢界" rendered between rank 4 and rank 5.
- Palace: diagonal lines in the 3×3 areas on each side.
- Point dots: traditional star points at all standard positions (8 per half).
- Pieces: Unicode Chinese characters rendered inside circular backgrounds with an inner ring.
- Red pieces: red text on cream background.
- Black pieces: black text on cream background.
- No piece shadows, no animations beyond highlight/glow effects.
- No wood texture, no images, no external assets.

## Consequences

- No external assets to manage — everything rendered with CSS and Unicode.
- Traditional board elements (river, palace, dots) provide authenticity.
- Circular pieces with inner rings match the traditional Chinese Chess aesthetic.
- Flat colors keep the implementation simple and fast.
- Unicode characters render consistently across platforms.
