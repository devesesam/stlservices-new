// Srcset widths for an image, capped at the source photo's real width.
// Astro 4 labels oversize requests with the requested width while serving
// the original, so uncapped lists tell the browser an image is bigger than it is.
export function fitWidths(image: ImageMetadata, widths: number[]): number[] {
  const smaller = widths.filter(w => w < image.width);
  return smaller.length === widths.length ? widths : [...smaller, image.width];
}

export const cardWidths = [400, 800];
export const heroWidths = [640, 960, 1280, 1600];
export const cardSizes = '(max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(50vw - 36px), 368px';
