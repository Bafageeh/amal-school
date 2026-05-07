const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, 'assets');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function mix(a, b, t) { return a + (b - a) * t; }
function color(a, b, t) { return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t), 255]; }
function insideRound(x, y, w, h, r) {
  const dx = x < r ? r - x : x >= w - r ? x - (w - r - 1) : 0;
  const dy = y < r ? r - y : y >= h - r ? y - (h - r - 1) : 0;
  return dx * dx + dy * dy <= r * r;
}
function blend(buf, w, x, y, c, a = 1) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (Math.floor(y) * w + Math.floor(x)) * 4;
  const alpha = Math.max(0, Math.min(1, (c[3] / 255) * a));
  buf[i] = clamp(buf[i] * (1 - alpha) + c[0] * alpha);
  buf[i + 1] = clamp(buf[i + 1] * (1 - alpha) + c[1] * alpha);
  buf[i + 2] = clamp(buf[i + 2] * (1 - alpha) + c[2] * alpha);
  buf[i + 3] = 255;
}
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    const intersect = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function poly(buf, w, pts, c, a = 1) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs))), maxX = Math.min(w - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys))), maxY = Math.min(w - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y += 1) for (let x = minX; x <= maxX; x += 1) if (pointInPoly(x + 0.5, y + 0.5, pts)) blend(buf, w, x, y, c, a);
}
function circle(buf, w, cx, cy, r, c, a = 1) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(w - 1, Math.ceil(cy + r)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) blend(buf, w, x, y, c, a * Math.min(1, r - d + 1));
    }
  }
}
function line(buf, w, x1, y1, x2, y2, thick, c, a = 1) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= steps; i += 1) circle(buf, w, x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps, thick / 2, c, a);
}
function check(buf, w, x, y, s, c) {
  line(buf, w, x, y + s * 0.55, x + s * 0.28, y + s * 0.82, s * 0.12, [71, 40, 0, 255], 0.28);
  line(buf, w, x + s * 0.28, y + s * 0.82, x + s, y, s * 0.12, [71, 40, 0, 255], 0.28);
  line(buf, w, x, y + s * 0.55, x + s * 0.28, y + s * 0.82, s * 0.09, c, 1);
  line(buf, w, x + s * 0.28, y + s * 0.82, x + s, y, s * 0.09, c, 1);
}
function rect(buf, w, x, y, rw, rh, c, a = 1, r = 0) {
  for (let yy = Math.max(0, y | 0); yy < Math.min(w, y + rh); yy += 1) {
    for (let xx = Math.max(0, x | 0); xx < Math.min(w, x + rw); xx += 1) {
      if (!r || insideRound(xx - x, yy - y, rw, rh, r)) blend(buf, w, xx, yy, c, a);
    }
  }
}
function makeIcon(size = 1024) {
  const w = size, buf = Buffer.alloc(w * w * 4);
  for (let y = 0; y < w; y += 1) for (let x = 0; x < w; x += 1) {
    const t = (x * 0.35 + y * 0.65) / w;
    const c = color([5, 23, 65], [15, 111, 184], t);
    const i = (y * w + x) * 4;
    const inside = insideRound(x, y, w, w, w * 0.13);
    buf[i] = inside ? clamp(c[0]) : 0;
    buf[i + 1] = inside ? clamp(c[1]) : 0;
    buf[i + 2] = inside ? clamp(c[2]) : 0;
    buf[i + 3] = inside ? 255 : 0;
  }
  for (let y = 0; y < w; y += 1) for (let x = 0; x < w; x += 1) {
    const d = Math.hypot(x - w / 2, y - w * 0.25);
    if (d < w * 0.34) blend(buf, w, x, y, [255, 205, 80, 255], (1 - d / (w * 0.34)) * 0.35);
    const edge = Math.min(x, y, w - 1 - x, w - 1 - y);
    if (edge < w * 0.035 && insideRound(x, y, w, w, w * 0.13)) blend(buf, w, x, y, [17, 210, 225, 255], (1 - edge / (w * 0.035)) * 0.55);
  }
  const gold = [245, 180, 48, 255], teal = [29, 197, 205, 255], navy = [2, 39, 96, 255], white = [247, 246, 237, 255];
  for (let a = -55; a <= 55; a += 18) line(buf, w, w / 2, w * 0.18, w / 2 + Math.sin(a * Math.PI / 180) * w * 0.38, w * 0.18 + Math.cos(a * Math.PI / 180) * w * 0.18, 4, [255, 220, 120, 255], 0.22);
  circle(buf, w, w / 2, w * 0.17, w * 0.035, [255, 255, 245, 255], 1);
  line(buf, w, w / 2 - w * 0.08, w * 0.17, w / 2 + w * 0.08, w * 0.17, 9, [255, 255, 245, 255], 0.75);
  line(buf, w, w / 2, w * 0.09, w / 2, w * 0.25, 9, [255, 255, 245, 255], 0.75);
  poly(buf, w, [[w*.18,w*.49],[w*.5,w*.29],[w*.82,w*.49],[w*.79,w*.53],[w*.5,w*.38],[w*.21,w*.53]], [74,42,0,255], .35);
  poly(buf, w, [[w*.18,w*.47],[w*.5,w*.27],[w*.82,w*.47],[w*.79,w*.50],[w*.5,w*.34],[w*.21,w*.50]], gold, 1);
  rect(buf, w, w*.47, w*.22, w*.06, w*.11, navy, 1, 6);
  poly(buf, w, [[w*.53,w*.21],[w*.62,w*.235],[w*.58,w*.265],[w*.53,w*.255]], gold, 1);
  line(buf, w, w*.53, w*.18, w*.53, w*.29, 5, [255,221,130,255], 1);
  circle(buf, w, w*.5, w*.45, w*.04, white, 1);
  circle(buf, w, w*.41, w*.49, w*.032, teal, 1);
  circle(buf, w, w*.59, w*.49, w*.032, teal, 1);
  circle(buf, w, w*.5, w*.56, w*.075, white, 1);
  circle(buf, w, w*.41, w*.57, w*.055, teal, .9);
  circle(buf, w, w*.59, w*.57, w*.055, teal, .9);
  poly(buf, w, [[w*.12,w*.62],[w*.49,w*.56],[w*.50,w*.84],[w*.14,w*.77]], white, 1);
  poly(buf, w, [[w*.50,w*.56],[w*.88,w*.62],[w*.86,w*.77],[w*.50,w*.84]], teal, 1);
  poly(buf, w, [[w*.12,w*.78],[w*.50,w*.84],[w*.88,w*.78],[w*.84,w*.85],[w*.5,w*.91],[w*.16,w*.85]], [5,91,148,255], 1);
  line(buf, w, w*.12, w*.78, w*.50, w*.86, 14, gold, .85);
  line(buf, w, w*.50, w*.86, w*.88, w*.78, 14, gold, .85);
  line(buf, w, w*.50, w*.56, w*.50, w*.86, 5, [238,238,231,255], .9);
  for (let i = 0; i < 3; i += 1) {
    const yy = w * (0.62 + i * 0.08);
    check(buf, w, w*.58, yy - w*.035, w*.045, gold);
    line(buf, w, w*.65, yy, w*.77, yy, 12, [234,250,255,255], 1);
  }
  check(buf, w, w*.70, w*.55, w*.17, gold);
  return png(w, w, buf);
}
function ensureIcons() {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const icon = makeIcon(1024);
  for (const name of ['icon.png', 'adaptive-icon.png', 'splash-icon.png']) {
    const target = path.join(ASSETS_DIR, name);
    if (!fs.existsSync(target) || fs.readFileSync(target).length !== icon.length) fs.writeFileSync(target, icon);
  }
}

ensureIcons();
const app = require('./app.json');
module.exports = app;
