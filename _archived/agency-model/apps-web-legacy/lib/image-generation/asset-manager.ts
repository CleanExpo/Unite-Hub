import type {
  GeneratedImage,
  GeneratedIcon,
  BrandAsset,
  AssetManifest,
  ImageCategory,
  ImageGenerationConfig,
  IconGenerationConfig,
} from './types';

/* ----------------------------------------
   Asset Manager Configuration
   ---------------------------------------- */
const _MANIFEST_PATH = 'public/images/asset-manifest.json';
const _BASE_IMAGE_PATH = 'public/images';

/* ----------------------------------------
   In-Memory Manifest (for client-side)
   ---------------------------------------- */
let manifestCache: AssetManifest | null = null;

/* ----------------------------------------
   Helper Functions
   ---------------------------------------- */
function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return mimeToExt[mimeType] || 'png';
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ----------------------------------------
   Manifest Management
   ---------------------------------------- */
export function createEmptyManifest(): AssetManifest {
  return {
    version: '1.0.0',
    lastUpdated: new Date(),
    assets: [],
  };
}

export async function loadManifest(): Promise<AssetManifest> {
  if (manifestCache) {
    return manifestCache;
  }

  // In a real implementation, this would read from the file system
  // For now, return an empty manifest
  manifestCache = createEmptyManifest();
  return manifestCache;
}

export async function saveManifest(manifest: AssetManifest): Promise<void> {
  manifest.lastUpdated = new Date();
  manifestCache = manifest;

  // In a real implementation, this would write to the file system
  // This is a placeholder for the API route implementation
  console.log('[AssetManager] Manifest updated:', manifest.assets.length, 'assets');
}

/* ----------------------------------------
   Asset Registration
   ---------------------------------------- */
export async function registerImageAsset(
  image: GeneratedImage,
  options: {
    filename?: string;
    subdirectory?: string;
    tags?: string[];
  } = {}
): Promise<BrandAsset> {
  const manifest = await loadManifest();

  const filename = options.filename || sanitizeFilename(image.config.context) || image.id;
  const extension = getFileExtension(image.mimeType);
  const subdirectory = options.subdirectory || image.config.category;
  const relativePath = `/images/${subdirectory}/${filename}.${extension}`;

  const asset: BrandAsset = {
    id: generateAssetId(),
    type: 'image',
    path: relativePath,
    altText: image.altText,
    category: image.config.category,
    tags: options.tags || extractTags(image.config),
    config: image.config,
    createdAt: new Date(),
  };

  manifest.assets.push(asset);
  await saveManifest(manifest);

  return asset;
}

export async function registerIconAsset(
  icon: GeneratedIcon,
  options: {
    filename?: string;
    subdirectory?: string;
    tags?: string[];
  } = {}
): Promise<BrandAsset> {
  const manifest = await loadManifest();

  const filename = options.filename || sanitizeFilename(icon.name) || icon.id;
  const extension = icon.format;
  const subdirectory = options.subdirectory || 'icons';
  const relativePath = `/images/${subdirectory}/${filename}.${extension}`;

  const asset: BrandAsset = {
    id: generateAssetId(),
    type: 'icon',
    path: relativePath,
    altText: icon.name,
    category: 'icon',
    tags: options.tags || [icon.config.style, icon.config.description],
    config: icon.config,
    createdAt: new Date(),
  };

  manifest.assets.push(asset);
  await saveManifest(manifest);

  return asset;
}

/* ----------------------------------------
   Asset Retrieval
   ---------------------------------------- */
export async function getAssetById(id: string): Promise<BrandAsset | null> {
  const manifest = await loadManifest();
  return manifest.assets.find((asset) => asset.id === id) || null;
}

export async function getAssetsByCategory(category: ImageCategory): Promise<BrandAsset[]> {
  const manifest = await loadManifest();
  return manifest.assets.filter((asset) => asset.category === category);
}

export async function getAssetsByTag(tag: string): Promise<BrandAsset[]> {
  const manifest = await loadManifest();
  return manifest.assets.filter((asset) =>
    asset.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

export async function searchAssets(query: string): Promise<BrandAsset[]> {
  const manifest = await loadManifest();
  const lowerQuery = query.toLowerCase();

  return manifest.assets.filter(
    (asset) =>
      asset.altText.toLowerCase().includes(lowerQuery) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      asset.path.toLowerCase().includes(lowerQuery)
  );
}

/* ----------------------------------------
   Asset Deletion
   ---------------------------------------- */
export async function deleteAsset(id: string): Promise<boolean> {
  const manifest = await loadManifest();
  const index = manifest.assets.findIndex((asset) => asset.id === id);

  if (index === -1) {
    return false;
  }

  manifest.assets.splice(index, 1);
  await saveManifest(manifest);

  // In a real implementation, also delete the file from the file system
  return true;
}

/* ----------------------------------------
   Tag Extraction
   ---------------------------------------- */
function extractTags(config: ImageGenerationConfig | IconGenerationConfig): string[] {
  const tags: string[] = [];

  if ('style' in config && typeof config.style === 'string') {
    tags.push(config.style);
  }

  if ('category' in config) {
    tags.push((config as ImageGenerationConfig).category);
  }

  if ('context' in config) {
    // Extract keywords from context
    const contextWords = (config as ImageGenerationConfig).context
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    tags.push(...contextWords.slice(0, 5));
  }

  if ('description' in config) {
    tags.push((config as IconGenerationConfig).description);
  }

  return [...new Set(tags)]; // Remove duplicates
}

/* ----------------------------------------
   Usage Tracking
   ---------------------------------------- */
export async function trackAssetUsage(assetId: string, filePath: string): Promise<void> {
  const manifest = await loadManifest();
  const asset = manifest.assets.find((a) => a.id === assetId);

  if (asset) {
    asset.usedIn = asset.usedIn || [];
    if (!asset.usedIn.includes(filePath)) {
      asset.usedIn.push(filePath);
    }
    await saveManifest(manifest);
  }
}

export async function getUnusedAssets(): Promise<BrandAsset[]> {
  const manifest = await loadManifest();
  return manifest.assets.filter((asset) => !asset.usedIn || asset.usedIn.length === 0);
}

/* ----------------------------------------
   Statistics
   ---------------------------------------- */
export async function getAssetStats(): Promise<{
  total: number;
  byCategory: Record<ImageCategory, number>;
  byType: Record<string, number>;
  unused: number;
}> {
  const manifest = await loadManifest();

  const byCategory = manifest.assets.reduce(
    (acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    },
    {} as Record<ImageCategory, number>
  );

  const byType = manifest.assets.reduce(
    (acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const unused = manifest.assets.filter(
    (asset) => !asset.usedIn || asset.usedIn.length === 0
  ).length;

  return {
    total: manifest.assets.length,
    byCategory,
    byType,
    unused,
  };
}

/* ----------------------------------------
   Export Functions
   ---------------------------------------- */
export async function exportManifest(): Promise<string> {
  const manifest = await loadManifest();
  return JSON.stringify(manifest, null, 2);
}

export async function importManifest(jsonString: string): Promise<void> {
  try {
    const manifest = JSON.parse(jsonString) as AssetManifest;
    manifest.lastUpdated = new Date();
    await saveManifest(manifest);
  } catch (_error) {
    throw new Error('Invalid manifest JSON');
  }
}
