/**
 * OGImageGenerator
 * Phase 13 Week 1-2: Generate randomized OG images (1200x630)
 */

// Types
export interface OGImageOptions {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  pattern?: 'dots' | 'lines' | 'waves' | 'grid' | 'none';
  logo?: string;
  seed?: number;
}

export interface OGImageResult {
  svg: string;
  width: number;
  height: number;
  seed: number;
  metadata: {
    generatedAt: string;
    colors: {
      background: string;
      text: string;
      accent: string;
    };
  };
}

export class OGImageGenerator {
  private readonly width = 1200;
  private readonly height = 630;

  // Color palettes for random selection
  private readonly palettes = [
    { bg: '#1a1a2e', text: '#ffffff', accent: '#0f3460' },
    { bg: '#16213e', text: '#e4e4e4', accent: '#0f3460' },
    { bg: '#1b262c', text: '#bbe1fa', accent: '#3282b8' },
    { bg: '#2c3e50', text: '#ecf0f1', accent: '#3498db' },
    { bg: '#1e3a5f', text: '#ffffff', accent: '#5dade2' },
    { bg: '#0d1b2a', text: '#e0e1dd', accent: '#415a77' },
    { bg: '#212529', text: '#f8f9fa', accent: '#6c757d' },
    { bg: '#2b2d42', text: '#edf2f4', accent: '#8d99ae' },
  ];

  /**
   * Generate OG image as SVG
   */
  generate(options: OGImageOptions): OGImageResult {
    const seed = options.seed || Math.floor(Math.random() * 1000000);

    // Select colors
    const palette = options.backgroundColor
      ? { bg: options.backgroundColor, text: options.textColor || '#ffffff', accent: options.accentColor || '#3498db' }
      : this.palettes[seed % this.palettes.length];

    // Generate SVG
    const svg = this.buildSVG(options, palette, seed);

    return {
      svg,
      width: this.width,
      height: this.height,
      seed,
      metadata: {
        generatedAt: new Date().toISOString(),
        colors: {
          background: palette.bg,
          text: palette.text,
          accent: palette.accent,
        },
      },
    };
  }

  /**
   * Build SVG content
   */
  private buildSVG(
    options: OGImageOptions,
    palette: { bg: string; text: string; accent: string },
    seed: number
  ): string {
    const pattern = options.pattern || this.getRandomPattern(seed);

    return `
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${this.getPatternDef(pattern, palette.accent, seed)}
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${this.darken(palette.bg, 20)};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>

  <!-- Pattern overlay -->
  ${pattern !== 'none' ? `<rect width="100%" height="100%" fill="url(#pattern)" opacity="0.1"/>` : ''}

  <!-- Decorative elements -->
  ${this.getDecorativeElements(seed, palette.accent)}

  <!-- Content container -->
  <g transform="translate(80, 120)">
    ${options.logo ? this.getLogo(options.logo) : ''}

    <!-- Title -->
    <text
      x="0"
      y="${options.logo ? 180 : 120}"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="56"
      font-weight="700"
      fill="${palette.text}"
    >
      ${this.wrapText(options.title, 48, 56)}
    </text>

    <!-- Subtitle -->
    ${options.subtitle ? `
    <text
      x="0"
      y="${options.logo ? 260 : 200}"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="24"
      fill="${palette.text}"
      opacity="0.8"
    >
      ${this.escapeXml(options.subtitle.substring(0, 100))}
    </text>` : ''}
  </g>

  <!-- Bottom accent bar -->
  <rect x="0" y="${this.height - 8}" width="100%" height="8" fill="${palette.accent}"/>
</svg>`.trim();
  }

  /**
   * Get pattern definition
   */
  private getPatternDef(
    pattern: string,
    color: string,
    seed: number
  ): string {
    switch (pattern) {
      case 'dots':
        return `
          <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill="${color}"/>
          </pattern>`;

      case 'lines':
        const angle = (seed % 4) * 45;
        return `
          <pattern id="pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
            <line x1="0" y1="5" x2="10" y2="5" stroke="${color}" stroke-width="1"/>
          </pattern>`;

      case 'waves':
        return `
          <pattern id="pattern" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q10 0 20 10 Q30 20 40 10" stroke="${color}" fill="none" stroke-width="1"/>
          </pattern>`;

      case 'grid':
        return `
          <pattern id="pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="30" height="30" fill="none" stroke="${color}" stroke-width="0.5"/>
          </pattern>`;

      default:
        return '';
    }
  }

  /**
   * Get decorative elements based on seed
   */
  private getDecorativeElements(seed: number, color: string): string {
    const elements: string[] = [];

    // Add some geometric shapes
    const numShapes = 3 + (seed % 3);

    for (let i = 0; i < numShapes; i++) {
      const x = 800 + ((seed * (i + 1)) % 300);
      const y = 100 + ((seed * (i + 2)) % 400);
      const size = 20 + ((seed * (i + 3)) % 60);
      const opacity = 0.1 + ((seed % 10) / 100);

      const shapeType = (seed + i) % 3;

      if (shapeType === 0) {
        // Circle
        elements.push(
          `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="${opacity}"/>`
        );
      } else if (shapeType === 1) {
        // Square
        elements.push(
          `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${color}" opacity="${opacity}" transform="rotate(${(seed * i) % 45}, ${x}, ${y})"/>`
        );
      } else {
        // Triangle
        const points = `${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}`;
        elements.push(
          `<polygon points="${points}" fill="${color}" opacity="${opacity}"/>`
        );
      }
    }

    return elements.join('\n  ');
  }

  /**
   * Get logo placeholder
   */
  private getLogo(logoUrl: string): string {
    // For now, create a placeholder circle
    // In production, this would embed the actual image
    return `
    <circle cx="40" cy="40" r="40" fill="#ffffff" opacity="0.9"/>
    <text x="40" y="50" font-size="30" text-anchor="middle" fill="#333">
      ${logoUrl.substring(0, 1).toUpperCase()}
    </text>`;
  }

  /**
   * Wrap text into multiple tspan elements
   */
  private wrapText(text: string, maxChars: number, fontSize: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) {
lines.push(currentLine);
}
        currentLine = word;
      }
    }
    if (currentLine) {
lines.push(currentLine);
}

    // Limit to 2 lines
    const displayLines = lines.slice(0, 2);
    if (lines.length > 2) {
      displayLines[1] = displayLines[1].substring(0, maxChars - 3) + '...';
    }

    return displayLines
      .map((line, i) => {
        const escapedLine = this.escapeXml(line);
        if (i === 0) {
          return escapedLine;
        }
        return `<tspan x="0" dy="${fontSize * 1.2}">${escapedLine}</tspan>`;
      })
      .join('');
  }

  /**
   * Get random pattern based on seed
   */
  private getRandomPattern(seed: number): string {
    const patterns: ('dots' | 'lines' | 'waves' | 'grid' | 'none')[] = [
      'dots', 'lines', 'waves', 'grid', 'none'
    ];
    return patterns[seed % patterns.length];
  }

  /**
   * Darken a hex color
   */
  private darken(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;

    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  /**
   * Escape XML entities
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate unique hash for OG image
   */
  generateHash(options: OGImageOptions): string {
    const str = JSON.stringify({
      title: options.title,
      subtitle: options.subtitle,
      seed: options.seed,
    });

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }
}

// Export singleton
export const ogImageGenerator = new OGImageGenerator();
