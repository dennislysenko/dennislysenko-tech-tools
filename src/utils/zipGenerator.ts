import JSZip from 'jszip';
import { resizeImage } from './imageResize';
import { getDimensionsForOrientation } from '../data/screenshotSizes';
import type { ScreenshotSize, Orientation } from './types';

/**
 * Create a ZIP file containing resized screenshots
 * @param file The original image file
 * @param sizes Array of screenshot sizes to generate
 * @param orientation Portrait or landscape orientation
 * @param onProgress Optional callback for progress updates
 * @returns A blob containing the ZIP file
 */
export async function createScreenshotZip(
  file: File,
  sizes: ScreenshotSize[],
  orientation: Orientation,
  onProgress?: (current: number, total: number, sizeName: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const { width, height } = getDimensionsForOrientation(size, orientation);

    // Notify progress if callback provided
    if (onProgress) {
      onProgress(i + 1, sizes.length, size.displayName);
    }

    // Resize the image
    const resizedBlob = await resizeImage(file, width, height);

    // Filename format: "iphone_6_9_1320x2868.png"
    const filename = `${size.id}_${width}x${height}.png`;

    // Add to ZIP
    zip.file(filename, resizedBlob);
  }

  // Generate the ZIP file
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}

/**
 * Trigger download of a blob with a given filename
 * @param blob The blob to download
 * @param filename The filename to use
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate a timestamped filename for the ZIP
 * @returns Filename in format: screenshots_YYYY-MM-DD_HHmmss.zip
 */
export function generateZipFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `screenshots_${year}-${month}-${day}_${hours}${minutes}${seconds}.zip`;
}
