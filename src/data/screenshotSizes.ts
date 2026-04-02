import type { ScreenshotSize, DeviceMode, Orientation } from '../utils/types';

export const SCREENSHOT_SIZES: ScreenshotSize[] = [
  // iPhone sizes — from Apple App Store Connect screenshot specifications
  {
    id: 'iphone_6_9',
    device: 'iphone',
    displayName: '6.9" Display',
    width: 1260,
    height: 2736,
    description: 'iPhone Air, 17 Pro Max, 16 Pro Max, 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max',
    alternates: [
      { width: 1290, height: 2796 },
      { width: 1320, height: 2868 },
    ]
  },
  {
    id: 'iphone_6_5',
    device: 'iphone',
    displayName: '6.5" Display',
    width: 1284,
    height: 2778,
    description: 'iPhone 14 Plus, 13 Pro Max, 12 Pro Max, 11 Pro Max, 11, XS Max, XR',
    alternates: [
      { width: 1242, height: 2688 },
    ]
  },
  {
    id: 'iphone_6_3',
    device: 'iphone',
    displayName: '6.3" Display',
    width: 1179,
    height: 2556,
    description: 'iPhone 17 Pro, 17, 16 Pro, 16, 15 Pro, 15, 14 Pro',
    alternates: [
      { width: 1206, height: 2622 },
    ]
  },
  {
    id: 'iphone_6_1',
    device: 'iphone',
    displayName: '6.1" Display',
    width: 1170,
    height: 2532,
    description: 'iPhone 17e, 16e, 14, 13, 12, 11 Pro, XS, X',
    alternates: [
      { width: 1125, height: 2436 },
      { width: 1080, height: 2340 },
    ]
  },
  {
    id: 'iphone_5_5',
    device: 'iphone',
    displayName: '5.5" Display',
    width: 1242,
    height: 2208,
    description: 'iPhone 8 Plus, 7 Plus, 6S Plus, 6 Plus'
  },
  {
    id: 'iphone_4_7',
    device: 'iphone',
    displayName: '4.7" Display',
    width: 750,
    height: 1334,
    description: 'iPhone SE (3rd/2nd gen), 8, 7, 6S, 6'
  },
  {
    id: 'iphone_4_0',
    device: 'iphone',
    displayName: '4" Display',
    width: 640,
    height: 1136,
    description: 'iPhone SE (1st gen), 5S, 5C, 5'
  },
  {
    id: 'iphone_3_5',
    device: 'iphone',
    displayName: '3.5" Display',
    width: 640,
    height: 960,
    description: 'iPhone 4S, 4'
  },
  // iPad sizes — from Apple App Store Connect screenshot specifications
  {
    id: 'ipad_13',
    device: 'ipad',
    displayName: '13" Display',
    width: 2064,
    height: 2752,
    description: 'iPad Pro M5/M4, iPad Pro 6th–1st gen, iPad Air M4/M3/M2',
    alternates: [
      { width: 2048, height: 2732 },
    ]
  },
  {
    id: 'ipad_12_9',
    device: 'ipad',
    displayName: '12.9" Display',
    width: 2048,
    height: 2732,
    description: 'iPad Pro (2nd gen)'
  },
  {
    id: 'ipad_11',
    device: 'ipad',
    displayName: '11" Display',
    width: 1488,
    height: 2266,
    description: 'iPad Pro M5/M4, iPad Air M4/M3/M2, iPad Air 5th/4th, iPad A16/10th gen, iPad mini A17 Pro/6th gen',
    alternates: [
      { width: 1668, height: 2420 },
      { width: 1668, height: 2388 },
      { width: 1640, height: 2360 },
    ]
  },
  {
    id: 'ipad_10_5',
    device: 'ipad',
    displayName: '10.5" Display',
    width: 1668,
    height: 2224,
    description: 'iPad Pro, iPad Air (3rd gen), iPad 9th–7th gen'
  },
  {
    id: 'ipad_9_7',
    device: 'ipad',
    displayName: '9.7" Display',
    width: 1536,
    height: 2048,
    description: 'iPad Pro, iPad Air/Air 2, iPad 2–6th gen, iPad mini 2–5th gen'
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
    'iphone_6_9',      // iPhone Air, 16/17 Pro Max
    'iphone_6_5',      // iPhone 14 Plus, 13/12 Pro Max
    'iphone_6_3',      // iPhone 17/16 Pro, 16, 15
    'iphone_6_1',      // iPhone 17e/16e, 14, 13, 12
    'iphone_5_5',      // iPhone 8/7/6 Plus
  ],
  ipad: [
    'ipad_13',         // Latest iPad Pro/Air
    'ipad_12_9',       // iPad Pro 12.9"
    'ipad_11',         // iPad Pro 11" / iPad mini
  ],
};

export function getCommonSizeIds(device: DeviceMode): string[] {
  return COMMON_SIZES[device];
}
