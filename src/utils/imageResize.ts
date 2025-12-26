/**
 * Loads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate dimensions to fit the source image into target dimensions while maintaining aspect ratio
 */
function calculateFitDimensions(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { width: number; height: number; offsetX: number; offsetY: number } {
  // Calculate scale to fit (maintain aspect ratio)
  const scale = Math.min(targetWidth / srcWidth, targetHeight / srcHeight);

  const width = srcWidth * scale;
  const height = srcHeight * scale;

  // Calculate offset to center the image
  const offsetX = (targetWidth - width) / 2;
  const offsetY = (targetHeight - height) / 2;

  return { width, height, offsetX, offsetY };
}

/**
 * Resize an image to the specified dimensions
 * @param file The image file to resize
 * @param targetWidth Target width in pixels
 * @param targetHeight Target height in pixels
 * @param format Output format (default: png)
 * @returns A blob containing the resized image
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  format: 'png' | 'jpeg' = 'png'
): Promise<Blob> {
  // Load the image
  const img = await loadImage(file);

  // Calculate scale to fit within target dimensions while preserving aspect ratio
  const scale = Math.min(targetWidth / img.width, targetHeight / img.height);

  // Calculate actual output dimensions (preserves aspect ratio)
  const outputWidth = Math.round(img.width * scale);
  const outputHeight = Math.round(img.height * scale);

  // Create canvas with scaled dimensions (no letterboxing)
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the image to fill the entire canvas
  ctx.drawImage(img, 0, 0, outputWidth, outputHeight);

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      format === 'jpeg' ? 0.95 : undefined
    );
  });
}

/**
 * Validate if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
