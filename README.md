# Screenshot Resizer - iOS App Store Tool

Stop fighting App Store screenshot requirements. Resize your screenshots for every iPhone and iPad size in seconds.

## Features

- **Upload Screenshots**: Drag & drop or click to upload
- **All iOS Sizes**: Supports all 20 required App Store screenshot sizes
  - 13 iPhone sizes (from 6.9" to legacy 4" displays)
  - 7 iPad sizes (from 13" to 9.7" displays)
- **Portrait & Landscape**: Toggle between orientations to get exact dimensions
- **Batch Download**: Select multiple sizes and download as a ZIP file
- **Client-Side Processing**: Everything runs in your browser - no server uploads
- **Apple-Inspired Design**: Clean, minimalist UI that feels native

## Screenshot Sizes Supported

### iPhone
- 1320 x 2868 (6.9" - iPhone 16 Pro Max)
- 1290 x 2796 (6.7" - iPhone 14/15/16 Plus & Pro Max)
- 1284 x 2778 (6.7" - iPhone 12/13 Pro Max)
- 1242 x 2688 (6.5" - iPhone XS Max, 11 Pro Max)
- 1206 x 2622 (6.3" - iPhone 16 Pro)
- 1179 x 2556 (6.1" - iPhone 14/15/16 Pro)
- 1170 x 2532 (6.1" - iPhone 12/13/14)
- 1125 x 2436 (5.8" - iPhone X/XS/11 Pro)
- 1242 x 2208 (5.5" - iPhone 6/7/8 Plus)
- 750 x 1334 (4.7" - iPhone 6/7/8/SE)
- 640 x 1136 (4" - iPhone 5/5S/SE 1st gen)
- 640 x 1096 (4" - alternate)
- 540 x 960 (legacy)

### iPad
- 2048 x 2732 (12.9" iPad Pro)
- 2064 x 2752 (13" iPad Pro/Air M2)
- 1668 x 2388 (11" iPad Pro)
- 1668 x 2224 (10.5" iPad Pro/Air)
- 1640 x 2360 (10.9" iPad Air/10th gen)
- 1620 x 2160 (10.2" iPad)
- 1536 x 2048 (9.7" iPad)

## Tech Stack

- **Astro 5.16.5** - Static site generator
- **Tailwind CSS v4** - Styling
- **TypeScript** - Type safety
- **JSZip** - ZIP file generation
- **Canvas API** - High-quality image resizing

## Development

### Prerequisites
- Node.js 18+ and npm

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure
```
src/
├── components/       # Reusable Astro components
│   ├── FileUpload.astro
│   ├── ImagePreview.astro
│   ├── DeviceToggle.astro
│   ├── OrientationToggle.astro
│   ├── SizeList.astro
│   └── Footer.astro
├── layouts/          # Page layouts
│   └── Layout.astro
├── pages/            # Routes
│   └── index.astro   # Main page with state management
├── data/             # Data files
│   └── screenshotSizes.ts
├── utils/            # Utilities
│   ├── imageResize.ts
│   ├── zipGenerator.ts
│   └── types.ts
└── styles/
    └── global.css    # Apple-inspired design system
```

## How It Works

1. **Upload**: User uploads a screenshot via drag & drop or file picker
2. **Select**: Choose device type (iPhone/iPad) and orientation (Portrait/Landscape)
3. **Choose Sizes**: Select which screenshot sizes to generate (or select all)
4. **Process**:
   - Images are resized using Canvas API with high-quality smoothing
   - Aspect ratio is maintained with white letterboxing if needed
   - All processing happens client-side (no server uploads)
5. **Download**: All selected sizes are packaged into a ZIP file and downloaded

## Deployment

The app is deployed to Vercel at `tools.dennislysenko.tech`.

To deploy your own instance:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Performance

- **Bundle Size**: ~107 KB (gzipped: ~33 KB)
- **Initial Load**: < 2s on 3G
- **Single Resize**: < 100ms per image
- **Full ZIP (20 images)**: < 5s

## Browser Support

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

## Privacy

All image processing happens entirely in your browser. No images are uploaded to any server.

## License

MIT

## Credits

Built by [Dennis Lysenko](https://dennislysenko.tech)
