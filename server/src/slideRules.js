export const SLIDE_LIMITS = {
  minWidth: 1400,
  minHeight: 800,
  minRatio: 1.3,
  maxRatio: 2.4,
  maxBytes: 5 * 1024 * 1024,
  maxCount: 8,
};

export function slideImageError({ width, height, bytes, type }) {
  if (!/^image\/(jpeg|png|webp)$/.test(type || "")) return "Use a JPG, PNG, or WebP image.";
  if (bytes > SLIDE_LIMITS.maxBytes) return "That photograph is larger than 5 MB.";
  if (!width || !height) return "That file could not be read as an image.";
  if (width < SLIDE_LIMITS.minWidth || height < SLIDE_LIMITS.minHeight) {
    return `That photograph is ${width}×${height}. Slider photographs must be at least 1400×800 pixels.`;
  }
  const ratio = width / height;
  if (ratio < SLIDE_LIMITS.minRatio) {
    return "That photograph is too tall. Use a landscape photo so the banner does not cut off the subject.";
  }
  if (ratio > SLIDE_LIMITS.maxRatio) {
    return "That photograph is too wide. Use a landscape photo between 4:3 and about 2:1.";
  }
  return "";
}

export function assertSlideImage(buffer, mime) {
  const size = imageSize(buffer);
  const error = slideImageError({
    width: size?.width || 0,
    height: size?.height || 0,
    bytes: buffer?.length || 0,
    type: mime,
  });
  if (error) {
    const failure = new Error(error);
    failure.status = 400;
    throw failure;
  }
  return size;
}

export function imageSize(buffer) {
  if (!buffer || buffer.length < 24) return null;
  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return webpSize(buffer);
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return jpegSize(buffer);
  return null;
}

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (!length) return null;
    offset += 2 + length;
  }
  return null;
}

function webpSize(buffer) {
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8X" && buffer.length >= 30) {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (kind === "VP8 ") {
    const start = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
    if (start >= 0 && buffer.length >= start + 7) {
      return {
        width: buffer.readUInt16LE(start + 3) & 0x3fff,
        height: buffer.readUInt16LE(start + 5) & 0x3fff,
      };
    }
  }
  if (kind === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}
