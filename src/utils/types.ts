export type DeviceMode = 'iphone' | 'ipad';
export type Orientation = 'portrait' | 'landscape';

export interface AlternateSize {
  width: number;
  height: number;
}

export interface ScreenshotSize {
  id: string;
  device: DeviceMode;
  displayName: string;
  width: number;
  height: number;
  description?: string;
  alternates?: AlternateSize[];
}

export interface AppState {
  uploadedFile: File | null;
  uploadedImageUrl: string | null;
  deviceMode: DeviceMode;
  orientation: Orientation;
  selectedSizes: Set<string>;
  availableSizes: ScreenshotSize[];
  error: string | null;
  isProcessing: boolean;
}
