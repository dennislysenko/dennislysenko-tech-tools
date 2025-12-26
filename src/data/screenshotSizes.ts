import type { ScreenshotSize, DeviceMode, Orientation } from '../utils/types';

export const SCREENSHOT_SIZES: ScreenshotSize[] = [
  // iPhone sizes (13 total)
  {
    id: 'iphone_6_9',
    device: 'iphone',
    displayName: '6.9" Display',
    width: 1320,
    height: 2868,
    description: 'iPhone 16 Pro Max'
  },
  {
    id: 'iphone_6_7_new',
    device: 'iphone',
    displayName: '6.7" Display',
    width: 1290,
    height: 2796,
    description: 'iPhone 14/15/16 Plus & Pro Max'
  },
  {
    id: 'iphone_6_7',
    device: 'iphone',
    displayName: '6.7" Display (12/13)',
    width: 1284,
    height: 2778,
    description: 'iPhone 12/13 Pro Max'
  },
  {
    id: 'iphone_6_5',
    device: 'iphone',
    displayName: '6.5" Display',
    width: 1242,
    height: 2688,
    description: 'iPhone XS Max, 11 Pro Max'
  },
  {
    id: 'iphone_6_3',
    device: 'iphone',
    displayName: '6.3" Display',
    width: 1206,
    height: 2622,
    description: 'iPhone 16 Pro'
  },
  {
    id: 'iphone_6_1_pro',
    device: 'iphone',
    displayName: '6.1" Display (Pro)',
    width: 1179,
    height: 2556,
    description: 'iPhone 14/15/16 Pro'
  },
  {
    id: 'iphone_6_1',
    device: 'iphone',
    displayName: '6.1" Display',
    width: 1170,
    height: 2532,
    description: 'iPhone 12/13/14'
  },
  {
    id: 'iphone_5_8',
    device: 'iphone',
    displayName: '5.8" Display',
    width: 1125,
    height: 2436,
    description: 'iPhone X/XS/11 Pro'
  },
  {
    id: 'iphone_5_5',
    device: 'iphone',
    displayName: '5.5" Display',
    width: 1242,
    height: 2208,
    description: 'iPhone 6/7/8 Plus'
  },
  {
    id: 'iphone_4_7',
    device: 'iphone',
    displayName: '4.7" Display',
    width: 750,
    height: 1334,
    description: 'iPhone 6/7/8/SE'
  },
  {
    id: 'iphone_4_0',
    device: 'iphone',
    displayName: '4" Display',
    width: 640,
    height: 1136,
    description: 'iPhone 5/5S/SE 1st gen'
  },
  {
    id: 'iphone_4_0_alt',
    device: 'iphone',
    displayName: '4" Display (Alt)',
    width: 640,
    height: 1096,
    description: 'Alternate 4" format'
  },
  {
    id: 'iphone_legacy',
    device: 'iphone',
    displayName: 'Legacy',
    width: 540,
    height: 960,
    description: 'Legacy iPhone size'
  },
  // iPad sizes (7 total)
  {
    id: 'ipad_12_9',
    device: 'ipad',
    displayName: '12.9" Display',
    width: 2048,
    height: 2732,
    description: 'iPad Pro 12.9"'
  },
  {
    id: 'ipad_13',
    device: 'ipad',
    displayName: '13" Display',
    width: 2064,
    height: 2752,
    description: 'iPad Pro/Air 13" M2'
  },
  {
    id: 'ipad_11',
    device: 'ipad',
    displayName: '11" Display',
    width: 1668,
    height: 2388,
    description: 'iPad Pro 11"'
  },
  {
    id: 'ipad_10_5',
    device: 'ipad',
    displayName: '10.5" Display',
    width: 1668,
    height: 2224,
    description: 'iPad Pro/Air 10.5"'
  },
  {
    id: 'ipad_10_9',
    device: 'ipad',
    displayName: '10.9" Display',
    width: 1640,
    height: 2360,
    description: 'iPad Air/10th gen 10.9"'
  },
  {
    id: 'ipad_10_2',
    device: 'ipad',
    displayName: '10.2" Display',
    width: 1620,
    height: 2160,
    description: 'iPad 10.2"'
  },
  {
    id: 'ipad_9_7',
    device: 'ipad',
    displayName: '9.7" Display',
    width: 1536,
    height: 2048,
    description: 'iPad 9.7"'
  },
];

export function getSizesByDevice(device: DeviceMode): ScreenshotSize[] {
  return SCREENSHOT_SIZES.filter(s => s.device === device);
}

export function getSizeById(id: string): ScreenshotSize | undefined {
  return SCREENSHOT_SIZES.find(s => s.id === id);
}

export function getDimensionsForOrientation(
  size: ScreenshotSize,
  orientation: Orientation
): { width: number; height: number } {
  if (orientation === 'landscape') {
    return { width: size.height, height: size.width };
  }
  return { width: size.width, height: size.height };
}

// Common sizes that cover most current App Store requirements
export const COMMON_SIZES: Record<DeviceMode, string[]> = {
  iphone: [
    'iphone_6_9',      // iPhone 16 Pro Max
    'iphone_6_7_new',  // iPhone 14/15/16 Plus & Pro Max
    'iphone_6_3',      // iPhone 16 Pro
    'iphone_6_1',      // iPhone 12/13/14
    'iphone_5_5',      // Legacy Plus models
  ],
  ipad: [
    'ipad_13',         // Latest iPad Pro/Air
    'ipad_12_9',       // iPad Pro 12.9"
    'ipad_11',         // iPad Pro 11"
  ],
};

export function getCommonSizeIds(device: DeviceMode): string[] {
  return COMMON_SIZES[device];
}
