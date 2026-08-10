const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const publicDir = path.join(__dirname, '..', 'frontend', 'public');

// Generate valid PNG buffer or fetch via high quality SVG canvas / placeholder
// 192x192 valid PNG base64 string (purplish icon with transparent background)
// Or write SVG data URI in manifest
const valid192PngBase64 = "iVBORw0KGgoAAAANSU5EUgAAAMAAAADACAYAAABS3GwHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAD31JREFUeJzt3X9sVNWdB/Dve+fNzFDaoVhaClg31qX8sMVSl/0DggXW0t34A9ZutxvaRZM1xmr8USM21i+W7ab7g0RjjDEmMd0S0d2uN1t1Wf9I";

// Let's create proper PNG files using Node's zlib module so they are 100% valid PNG files
const zlib = require('zlib');

function createPngBuffer(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT (Raw image data)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter type 0
    for (let x = 0; x < width; x++) {
      // Create subtle gradient or solid branding color #6366f1 (99, 102, 241)
      rawData.push(r, g, b);
    }
  }
  const idatData = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', idatData);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const buf = Buffer.concat([typeBuf, data]);

  // CRC32 computation
  const crc = crc32(buf);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, buf, crcBuf]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate valid 192x192 and 512x512 PNG icons
const png192 = createPngBuffer(192, 192, 99, 102, 241);
const png512 = createPngBuffer(512, 512, 79, 70, 229);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'icon-maskable.png'), png512);

console.log('✅ Generated 100% valid PNG icons for PWA');
