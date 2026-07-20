/**
 * Eight interlocking jigsaw pieces that tile into one 4×2 rectangle.
 * ViewBox: 400×200. Adjacent edges use complementary tabs / blanks.
 */

export interface PuzzlePieceDef {
  id: number;
  d: string;
  cx: number;
  cy: number;
}

type Kind = -1 | 0 | 1;

function hKind(col: number, row: number, side: "top" | "bottom"): Kind {
  if (side === "top" && row === 0) return 0;
  if (side === "bottom" && row === 1) return 0;
  const seed: Kind = col % 2 === 0 ? 1 : -1;
  return side === "bottom" ? seed : ((-seed) as Kind);
}

function vKind(col: number, row: number, side: "left" | "right"): Kind {
  if (side === "left" && col === 0) return 0;
  if (side === "right" && col === 3) return 0;
  const seed: Kind = (col + row) % 2 === 0 ? 1 : -1;
  return side === "right" ? seed : ((-seed) as Kind);
}

/** Classic jigsaw tab along an axis-aligned edge. */
function tabbed(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  kind: Kind,
): string {
  if (kind === 0) return `L ${x1} ${y1}`;

  const horizontal = Math.abs(y1 - y0) < 0.01;
  const forward = horizontal ? x1 > x0 : y1 > y0;
  const sign = kind; // +1 outward relative to piece interior for CW winding

  if (horizontal) {
    const y = y0;
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const mid = (left + right) / 2;
    const dir = forward ? 1 : -1;
    // Outward for top edge of piece (travel L→R) is up (−y); for bottom (R→L) is down (+y)
    const out = (forward ? -1 : 1) * sign;
    const neck = 12;
    const bump = 16 * out;
    const a = mid - neck * dir;
    const b = mid + neck * dir;
    return [
      `L ${a} ${y}`,
      `C ${a} ${y + bump * 0.2} ${mid - 10 * dir} ${y + bump} ${mid} ${y + bump}`,
      `C ${mid + 10 * dir} ${y + bump} ${b} ${y + bump * 0.2} ${b} ${y}`,
      `L ${x1} ${y1}`,
    ].join(" ");
  }

  const x = x0;
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  const mid = (top + bottom) / 2;
  const dir = forward ? 1 : -1;
  // Outward for right edge (travel T→B) is right (+x); for left (B→T) is left (−x)
  const out = (forward ? 1 : -1) * sign;
  const neck = 12;
  const bump = 16 * out;
  const a = mid - neck * dir;
  const b = mid + neck * dir;
  return [
    `L ${x} ${a}`,
    `C ${x + bump * 0.2} ${a} ${x + bump} ${mid - 10 * dir} ${x + bump} ${mid}`,
    `C ${x + bump} ${mid + 10 * dir} ${x + bump * 0.2} ${b} ${x} ${b}`,
    `L ${x1} ${y1}`,
  ].join(" ");
}

function piecePath(col: number, row: number): string {
  const w = 100;
  const h = 100;
  const x = col * w;
  const y = row * h;
  return [
    `M ${x} ${y}`,
    tabbed(x, y, x + w, y, hKind(col, row, "top")),
    tabbed(x + w, y, x + w, y + h, vKind(col, row, "right")),
    tabbed(x + w, y + h, x, y + h, hKind(col, row, "bottom")),
    tabbed(x, y + h, x, y, vKind(col, row, "left")),
    "Z",
  ].join(" ");
}

export const LEGACY_PUZZLE_PIECES: PuzzlePieceDef[] = Array.from(
  { length: 8 },
  (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return {
      id: i,
      d: piecePath(col, row),
      cx: col * 100 + 50,
      cy: row * 100 + 50,
    };
  },
);

export const PUZZLE_VIEWBOX = "0 0 400 200";
