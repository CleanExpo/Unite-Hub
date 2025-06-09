# Unite Group Logo Implementation Guide

## Logo Details
The Unite Group logo has been provided and features:
- A gear symbol with a handshake icon in the center
- Gradient colors from teal (#4ECDC4) to blue (#1976D2)
- Text: "UNITE Group"
- Tagline: "United in vision. Independent in spirit."
- Dark background (#0F1923)

## Implementation Steps

### 1. Save the Logo Files
Since I cannot directly save image files, please:

1. Save the logo image as:
   - `public/unite-group-logo.png` (main logo)
   - `public/unite-group-logo.svg` (if you have SVG version)
   - `public/logo-192.png` (192x192 for PWA)
   - `public/logo-512.png` (512x512 for PWA)

2. Create a favicon:
   - `public/favicon.ico` (16x16, 32x32, 48x48)
   - `public/favicon-16x16.png`
   - `public/favicon-32x32.png`

### 2. Update Manifest.json
The manifest.json already references the logo files, so once you add them, the PWA will use them.

### 3. Update Components Using Logo

#### Navigation Component
Replace placeholder logo references in `src/components/Navigation.tsx` with:
```tsx
<Image
  src="/unite-group-logo.png"
  alt="Unite Group"
  width={150}
  height={50}
  className="h-10 w-auto"
/>
```

#### Footer Component
Update logo in `src/components/Footer.tsx` similarly.

### 4. Update Favicon References
In `src/app/[locale]/layout.tsx`, ensure these are in the head:
```html
<link rel="icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
```

### 5. Logo Color Scheme
Based on the logo, update your theme colors to match:
- Primary: #4ECDC4 (Teal)
- Secondary: #1976D2 (Blue)
- Background Dark: #0F1923

## File Checklist
- [ ] `/public/unite-group-logo.png` - Main logo
- [ ] `/public/logo-192.png` - PWA icon
- [ ] `/public/logo-512.png` - PWA icon
- [ ] `/public/favicon.ico` - Browser favicon
- [ ] `/public/favicon-16x16.png` - Small favicon
- [ ] `/public/favicon-32x32.png` - Medium favicon

Once these files are added, your website will have the official Unite Group branding throughout!
