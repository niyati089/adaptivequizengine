/**
 * faceWorker.ts — Face presence detection Web Worker
 *
 * Runs the skin-tone + brightness heuristic off the main thread so canvas
 * pixel analysis never blocks UI rendering.
 *
 * Message in:  { imageData: ImageData }
 * Message out: { hasFace: boolean, skinRatio: number, avgBrightness: number }
 */

self.onmessage = (event: MessageEvent<{ imageData: ImageData }>) => {
  const { imageData } = event.data;
  const data = imageData.data;
  const totalPixels = data.length / 4;

  let skinPixels = 0;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    totalBrightness += r * 0.299 + g * 0.587 + b * 0.114;

    // Skin-tone heuristic: warm, reddish pixels with enough saturation
    if (
      r > 60 && g > 35 && b > 20 &&
      r > g && r > b &&
      (r - Math.min(g, b)) > 15 &&
      Math.abs(r - g) > 10
    ) {
      skinPixels++;
    }
  }

  const avgBrightness = totalBrightness / totalPixels;
  const skinRatio = skinPixels / totalPixels;

  // Covered camera = very dark frame; no person = low skin ratio
  const isTooDark = avgBrightness < 15;
  const noSkin = skinRatio < 0.03;
  const hasFace = !isTooDark && !noSkin;

  (self as unknown as Worker).postMessage({ hasFace, skinRatio, avgBrightness });
};
