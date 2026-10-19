export const SLIDE_LIMITS = {
  minWidth: 1400,
  minHeight: 800,
  minRatio: 1.3,
  maxRatio: 2.4,
  maxBytes: 5 * 1024 * 1024,
  maxCount: 8,
};

export const SLIDE_HINT = "Landscape only, at least 1400×800 pixels, JPG, PNG or WebP, and no larger than 5 MB. Portrait and square photos are refused because the banner would cut them off.";

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

export function measureImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    image.src = url;
  });
}

export async function checkSlideFile(file) {
  if (!file) return "Choose an image to upload.";
  const size = await measureImage(file);
  return slideImageError({ width: size.width, height: size.height, bytes: file.size, type: file.type });
}
