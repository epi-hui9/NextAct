// Dependency-free PWA icon generator.
// Draws a calm "aperture" mark (a cashmere ring on brand navy) and encodes it
// as a real PNG using Node's built-in zlib. No native deps, no network.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public");
mkdirSync(outDir, { recursive: true });

const NAVY = [0x10, 0x19, 0x2b];
const CASHMERE = [0xfa, 0xf9, 0xf7];
const MIST = [0xa9, 0xaf, 0xb8];

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// Coverage of a disc of radius r at (cx,cy) for pixel center (x,y), 3x3 sampled.
function discCoverage(x, y, cx, cy, r) {
  let hits = 0;
  const S = 3;
  for (let sy = 0; sy < S; sy++) {
    for (let sx = 0; sx < S; sx++) {
      const px = x + (sx + 0.5) / S;
      const py = y + (sy + 0.5) / S;
      const d = Math.hypot(px - cx, py - cy);
      if (d <= r) hits++;
    }
  }
  return hits / (S * S);
}

function render(size) {
  const buf = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const rOuter = size * 0.31; // outer edge of the ring
  const rInner = size * 0.17; // inner edge of the ring
  const rSeed = size * 0.055; // center seed dot

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = NAVY;
      // Ring = outer disc minus inner disc (cashmere).
      const outer = discCoverage(x, y, c, c, rOuter);
      const inner = discCoverage(x, y, c, c, rInner);
      const ring = Math.max(0, outer - inner);
      if (ring > 0) color = mix(color, CASHMERE, ring);
      // A faint mist halo just outside the ring for softness.
      const halo = Math.max(0, discCoverage(x, y, c, c, rOuter * 1.14) - outer);
      if (halo > 0) color = mix(color, MIST, halo * 0.18);
      // Center seed.
      const seed = discCoverage(x, y, c, c, rSeed);
      if (seed > 0) color = mix(color, CASHMERE, seed);

      const i = (y * size + x) * 4;
      buf[i] = color[0];
      buf[i + 1] = color[1];
      buf[i + 2] = color[2];
      buf[i + 3] = 255;
    }
  }
  return buf;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rest zero (compression, filter, interlace)
  // Add filter byte (0) per scanline.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  const png = encodePng(size, render(size));
  writeFileSync(join(outDir, name), png);
  console.log(`wrote public/${name} (${png.length} bytes)`);
}
