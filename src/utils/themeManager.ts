/**
 * Zypsomart Dynamic Banner Theme Manager
 * Automatically extracts dominant colors from the active seasonal banner
 * and provides responsive CSS variables and presets so the entire app UI
 * dynamically synchronizes with the banner theme.
 */

export interface BannerThemePalette {
  id?: string;
  name?: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  primaryText: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  shadow: string;
}

export const DEFAULT_PALETTE: BannerThemePalette = {
  id: 'farm_green',
  name: 'Farm Fresh Green',
  primary: '#16a34a',
  primaryHover: '#15803d',
  primaryLight: '#f0fdf4',
  primaryBorder: '#bbf7d0',
  primaryText: '#166534',
  gradientFrom: '#16a34a',
  gradientTo: '#15803d',
  accent: '#f59e0b',
  shadow: 'rgba(22, 163, 74, 0.25)'
};

export const THEME_PRESETS: Record<string, BannerThemePalette> = {
  auto: {
    id: 'auto',
    name: 'Auto (From Banner)',
    primary: '#16a34a',
    primaryHover: '#15803d',
    primaryLight: '#f0fdf4',
    primaryBorder: '#bbf7d0',
    primaryText: '#166534',
    gradientFrom: '#16a34a',
    gradientTo: '#15803d',
    accent: '#f59e0b',
    shadow: 'rgba(22, 163, 74, 0.25)'
  },
  festive_red: {
    id: 'festive_red',
    name: 'Durga Puja & Festive Crimson',
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    primaryLight: '#fef2f2',
    primaryBorder: '#fecaca',
    primaryText: '#991b1b',
    gradientFrom: '#ef4444',
    gradientTo: '#b91c1c',
    accent: '#facc15',
    shadow: 'rgba(220, 38, 38, 0.25)'
  },
  diwali_gold: {
    id: 'diwali_gold',
    name: 'Diwali & Golden Glow',
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    primaryText: '#92400e',
    gradientFrom: '#f59e0b',
    gradientTo: '#b45309',
    accent: '#dc2626',
    shadow: 'rgba(217, 119, 6, 0.25)'
  },
  farm_green: DEFAULT_PALETTE,
  royal_violet: {
    id: 'royal_violet',
    name: 'Holi & Royal Violet',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ddd6fe',
    primaryText: '#5b21b6',
    gradientFrom: '#8b5cf6',
    gradientTo: '#6d28d9',
    accent: '#ec4899',
    shadow: 'rgba(124, 58, 237, 0.25)'
  },
  sunset_orange: {
    id: 'sunset_orange',
    name: 'Navratri & Sunset Saffron',
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#fff7ed',
    primaryBorder: '#fed7aa',
    primaryText: '#9a3412',
    gradientFrom: '#f97316',
    gradientTo: '#c2410c',
    accent: '#fbbf24',
    shadow: 'rgba(234, 88, 12, 0.25)'
  },
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Summer Chill Ocean',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryLight: '#f0f9ff',
    primaryBorder: '#bae6fd',
    primaryText: '#075985',
    gradientFrom: '#0ea5e9',
    gradientTo: '#0369a1',
    accent: '#38bdf8',
    shadow: 'rgba(2, 132, 199, 0.25)'
  }
};

/** Convert RGB to HSL */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), s, l];
}

/** Convert HSL to Hex */
export function hslToHex(h: number, s: number, l: number): string {
  l = Math.max(0, Math.min(1, l));
  s = Math.max(0, Math.min(1, s));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Generate a harmonious UI palette from a base Hex color */
export function generatePaletteFromHex(hex: string, name = 'Custom Theme'): BannerThemePalette {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 22;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 163;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 74;

  const [h, s] = rgbToHsl(r, g, b);
  const targetSat = Math.max(s, 0.65);

  const primary = hslToHex(h, targetSat, 0.44);
  const primaryHover = hslToHex(h, targetSat, 0.36);
  const primaryLight = hslToHex(h, Math.min(targetSat, 0.75), 0.96);
  const primaryBorder = hslToHex(h, Math.min(targetSat, 0.6), 0.84);
  const primaryText = hslToHex(h, targetSat, 0.28);
  const gradientFrom = hslToHex(h, targetSat, 0.48);
  const gradientTo = hslToHex((h + 15) % 360, targetSat, 0.36);
  const accent = hslToHex((h + 45) % 360, 0.9, 0.5);

  return {
    id: `custom_${cleanHex}`,
    name,
    primary,
    primaryHover,
    primaryLight,
    primaryBorder,
    primaryText,
    gradientFrom,
    gradientTo,
    accent,
    shadow: `rgba(${r}, ${g}, ${b}, 0.25)`
  };
}

/** Extract prominent vibrant theme colors directly from an HTML Image Element */
export function extractColorsFromImage(img: HTMLImageElement): BannerThemePalette | null {
  try {
    const canvas = document.createElement('canvas');
    const width = 80;
    const height = 45;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Bucket vibrant colors by hue (12 buckets of 30 degrees each)
    const hueBuckets: { [bucket: number]: { count: number; r: number; g: number; b: number; weight: number } } = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // Skip transparent pixels

      const [h, s, l] = rgbToHsl(r, g, b);

      // Skip near-black, near-white, or washed-out grays
      if (l < 0.12 || l > 0.92 || s < 0.22) continue;

      // Weight vibrant saturated pixels higher
      const vibrancy = s * (1 - Math.abs(l - 0.5) * 1.5);
      const bucket = Math.floor(h / 30);

      if (!hueBuckets[bucket]) {
        hueBuckets[bucket] = { count: 0, r: 0, g: 0, b: 0, weight: 0 };
      }
      hueBuckets[bucket].count++;
      hueBuckets[bucket].r += r;
      hueBuckets[bucket].g += g;
      hueBuckets[bucket].b += b;
      hueBuckets[bucket].weight += vibrancy;
    }

    // Find bucket with highest vibrancy weight
    let bestBucket: any = null;
    let maxWeight = 0;
    for (const b in hueBuckets) {
      if (hueBuckets[b].weight > maxWeight) {
        maxWeight = hueBuckets[b].weight;
        bestBucket = hueBuckets[b];
      }
    }

    if (!bestBucket || bestBucket.count === 0) {
      return null;
    }

    const avgR = Math.round(bestBucket.r / bestBucket.count);
    const avgG = Math.round(bestBucket.g / bestBucket.count);
    const avgB = Math.round(bestBucket.b / bestBucket.count);

    const [h, s] = rgbToHsl(avgR, avgG, avgB);
    const targetSat = Math.max(s, 0.65);

    const primary = hslToHex(h, targetSat, 0.44);
    const primaryHover = hslToHex(h, targetSat, 0.36);
    const primaryLight = hslToHex(h, Math.min(targetSat, 0.75), 0.96);
    const primaryBorder = hslToHex(h, Math.min(targetSat, 0.6), 0.84);
    const primaryText = hslToHex(h, targetSat, 0.28);
    const gradientFrom = hslToHex(h, targetSat, 0.48);
    const gradientTo = hslToHex((h + 15) % 360, targetSat, 0.36);
    const accent = hslToHex((h + 45) % 360, 0.9, 0.5);

    return {
      id: 'auto_banner',
      name: 'Banner Theme',
      primary,
      primaryHover,
      primaryLight,
      primaryBorder,
      primaryText,
      gradientFrom,
      gradientTo,
      accent,
      shadow: `rgba(${avgR}, ${avgG}, ${avgB}, 0.25)`
    };
  } catch (e) {
    console.warn('[Banner Theme Extraction Note]:', e);
    return null;
  }
}

/** Apply palette CSS variables to the document element and mobile meta theme-color */
export function applyThemeToDocument(palette: BannerThemePalette) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', palette.primary);
  root.style.setProperty('--theme-primary-hover', palette.primaryHover);
  root.style.setProperty('--theme-primary-light', palette.primaryLight);
  root.style.setProperty('--theme-primary-border', palette.primaryBorder);
  root.style.setProperty('--theme-primary-text', palette.primaryText);
  root.style.setProperty('--theme-gradient-from', palette.gradientFrom);
  root.style.setProperty('--theme-gradient-to', palette.gradientTo);
  root.style.setProperty('--theme-accent', palette.accent);
  root.style.setProperty('--theme-shadow', palette.shadow);

  // Set RGB values for variable alpha transparency
  try {
    const cleanHex = palette.primary.replace('#', '').trim();
    const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
    const r = parseInt(fullHex.substring(0, 2), 16) || 22;
    const g = parseInt(fullHex.substring(2, 4), 16) || 163;
    const b = parseInt(fullHex.substring(4, 6), 16) || 74;
    root.style.setProperty('--theme-primary-rgb', `${r}, ${g}, ${b}`);
  } catch (e) {
    root.style.setProperty('--theme-primary-rgb', '22, 163, 74');
  }

  // Update meta theme-color for mobile header & browser bar
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', palette.primary);
  }
}

/**
 * Resolve theme palette from key or custom hex string
 */
export function resolveThemePalette(
  themeKeyOrHex: string,
  bannerPalette?: BannerThemePalette | null
): BannerThemePalette {
  if (!themeKeyOrHex || themeKeyOrHex === 'auto') {
    if (bannerPalette) return bannerPalette;
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('zypsomart_banner_extracted_palette');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          // ignore error
        }
      }
    }
    return DEFAULT_PALETTE;
  }

  if (THEME_PRESETS[themeKeyOrHex]) {
    return THEME_PRESETS[themeKeyOrHex];
  }

  if (themeKeyOrHex.startsWith('#')) {
    return generatePaletteFromHex(themeKeyOrHex);
  }

  return DEFAULT_PALETTE;
}
