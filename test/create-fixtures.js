import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
fs.mkdirSync(fixturesDir, { recursive: true });

function createPng(width, height, filepath) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  Buffer.from('IHDR').copy(ihdr, 4);
  ihdrData.copy(ihdr, 8);
  ihdr.writeInt32BE(ihdrCrc, 21);
  const rawData = Buffer.alloc((width * 3 + 1) * height, 0);
  const compressed = deflateSync(rawData);
  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, compressed]));
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idatType.copy(idat, 4);
  compressed.copy(idat, 8);
  idat.writeInt32BE(idatCrc, 8 + compressed.length);
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 0xAE, 0x42, 0x60, 0x82]);
  fs.writeFileSync(filepath, Buffer.concat([signature, ihdr, idat, iend]));
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) | 0;
}

createPng(256, 256, path.join(fixturesDir, 'valid-icon.png'));
createPng(64, 64, path.join(fixturesDir, 'small-icon.png'));
console.log('Test fixtures created.');
