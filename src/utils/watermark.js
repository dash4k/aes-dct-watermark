import dct from './dct.js';

const { dct2d, idct2d } = dct();

const STEP = 24;
const IDX = 3 * 8 + 4;
const REPEAT = 5;

const mod2 = (n) => ((n % 2) + 2) % 2;
const clamp = (v) => Math.max(0, Math.min(255, v));


const bytesToBits = (bytes) => {
  if (bytes.length > 0xffff) throw new Error('Message too long');
  const all = new Uint8Array(bytes.length + 2);
  all[0] = bytes.length >> 8;
  all[1] = bytes.length & 0xff;
  all.set(bytes, 2);

  const bits = [];
  for (const byte of all) for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  return bits;
};


const bitsToBytes = (bits) => {
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    out[i] = b;
  }
  return out;
};


const embedBit = (coeffs, bit) => {
  const v = coeffs[IDX] / STEP;
  let q = Math.round(v);
  if (mod2(q) !== bit) q += v > q ? 1 : -1;
  coeffs[IDX] = q * STEP;
};


const extractBit = (coeffs) => mod2(Math.round(coeffs[IDX] / STEP));


const loadImageData = async (file) => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return { canvas, ctx, imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) };
};


const computeLuma = (data, width, height) => {
  const y = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    y[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return y;
};


const geometry = (width, height) => {
  const bw = Math.floor(width / 8);
  const bh = Math.floor(height / 8);
  const blocks = bw * bh;
  const slots = Math.floor(blocks / REPEAT);
  return { bw, blocks, slots };
};


const readBlock = (luma, width, bx, by) => {
  const block = new Float64Array(64);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) block[y * 8 + x] = luma[(by + y) * width + (bx + x)];
  return block;
};


const watermark = () => {
    const embed = async (file, bytes) => {
      const { canvas, ctx, imageData } = await loadImageData(file);
      const { data, width, height } = imageData;
      const luma = computeLuma(data, width, height);
      const { bw, blocks, slots } = geometry(width, height);
    
      const bits = bytesToBits(bytes);
      if (bits.length > slots) {
        throw new Error(`Image too small: need ${bits.length} bits, capacity is ${slots}`);
      }
    
      for (let i = 0; i < blocks; i++) {
        const bx = (i % bw) * 8;
        const by = Math.floor(i / bw) * 8;
        const bit = bits[i % slots] ?? 0;
    
        const block = readBlock(luma, width, bx, by);
        const coeffs = dct2d(block);
        embedBit(coeffs, bit);
        const rec = idct2d(coeffs);
    
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const d = Math.round(rec[y * 8 + x] - block[y * 8 + x]);
            const p = ((by + y) * width + (bx + x)) * 4;
            data[p] = clamp(data[p] + d);
            data[p + 1] = clamp(data[p + 1] + d);
            data[p + 2] = clamp(data[p + 2] + d);
          }
        }
      }
    
      ctx.putImageData(imageData, 0, 0);
      return new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png')
      );
    };
    
    
    const extract = async (file) => {
      const { imageData } = await loadImageData(file);
      const { data, width, height } = imageData;
      const luma = computeLuma(data, width, height);
      const { bw, blocks, slots } = geometry(width, height);
    
      const ones = new Uint32Array(slots);
      const counts = new Uint32Array(slots);
    
      for (let i = 0; i < blocks; i++) {
        const bx = (i % bw) * 8;
        const by = Math.floor(i / bw) * 8;
        const coeffs = dct2d(readBlock(luma, width, bx, by));
        const slot = i % slots;
        ones[slot] += extractBit(coeffs);
        counts[slot]++;
      }
    
      const bits = Array.from(ones, (o, s) => (o * 2 > counts[s] ? 1 : 0));
    
      const header = bitsToBytes(bits.slice(0, 16));
      const length = (header[0] << 8) | header[1];
      if (16 + length * 8 > slots) return null;
    
      return bitsToBytes(bits.slice(16, 16 + length * 8));
    };


    return {
        embed,
        extract,
    }
}


export default watermark;
