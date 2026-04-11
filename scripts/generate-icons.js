/**
 * Generates minimal PNG icons for the extension using only Node.js built-ins.
 * Creates a purple square with a lightning bolt "⚡" feel.
 */
import { writeFileSync } from "fs";
import { createHash } from "crypto";
import zlib from "zlib";

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function makePNG(size) {
  // Purple background: #7c3aed = rgb(124, 58, 237)
  const R = 124, G = 58, B = 237;

  // Build raw image data: each row = filter byte (0) + RGBA pixels
  const rowSize = size * 4;
  const raw = Buffer.alloc((rowSize + 1) * size);

  for (let y = 0; y < size; y++) {
    raw[y * (rowSize + 1)] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const offset = y * (rowSize + 1) + 1 + x * 4;
      // Draw a simple lightning bolt shape in white
      const cx = size / 2, cy = size / 2;
      const dx = x - cx, dy = y - cy;
      const norm = size / 16;

      // Lightning bolt: upper-right triangle + lower-left triangle
      const inBolt =
        (dx > -norm && dx < norm * 3 && dy > -norm * 4 && dy < 0 && dx > dy * -0.5) ||
        (dx > -norm * 3 && dx < norm && dy > 0 && dy < norm * 4 && dx < dy * 0.5);

      if (inBolt) {
        raw[offset] = 255; raw[offset + 1] = 255; raw[offset + 2] = 255; raw[offset + 3] = 255;
      } else {
        raw[offset] = R; raw[offset + 1] = G; raw[offset + 2] = B; raw[offset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [16, 48, 128]) {
  const png = makePNG(size);
  writeFileSync(`assets/icons/icon${size}.png`, png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
}
