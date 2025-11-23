/**
 * Google Stitch Engine
 * Phase 68: Compositional flow engine inspired by Google's Stitch approach
 */

export interface StitchLayer {
  id: string;
  name: string;
  type: 'base' | 'element' | 'text' | 'effect' | 'overlay';
  source: StitchSource;
  position: Position;
  size: Size;
  transform: Transform;
  blend_mode: BlendMode;
  opacity: number;
  mask?: StitchMask;
  effects: LayerEffect[];
  z_index: number;
}

export interface StitchSource {
  type: 'generated' | 'uploaded' | 'library' | 'text' | 'shape';
  url?: string;
  prompt?: string;
  provider?: string;
  text_content?: string;
  shape_type?: string;
}

export interface Position {
  x: number;
  y: number;
  anchor: 'top-left' | 'center' | 'bottom-right';
}

export interface Size {
  width: number;
  height: number;
  unit: 'px' | '%' | 'auto';
}

export interface Transform {
  rotation: number;
  scale_x: number;
  scale_y: number;
  skew_x: number;
  skew_y: number;
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'soft-light'
  | 'hard-light';

export interface StitchMask {
  type: 'shape' | 'gradient' | 'image';
  data: string;
  inverted: boolean;
}

export interface LayerEffect {
  type: 'blur' | 'shadow' | 'glow' | 'outline' | 'color-adjust';
  params: Record<string, unknown>;
  enabled: boolean;
}

export interface StitchComposition {
  id: string;
  name: string;
  workspace_id: string;
  canvas: CanvasSettings;
  layers: StitchLayer[];
  global_effects: LayerEffect[];
  metadata: CompositionMetadata;
  created_at: Date;
  updated_at: Date;
}

export interface CanvasSettings {
  width: number;
  height: number;
  background_color: string;
  background_image?: string;
  guides: Guide[];
}

export interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
}

export interface CompositionMetadata {
  description?: string;
  tags: string[];
  client_id?: string;
  campaign_id?: string;
  platform?: string;
  version: number;
}

export interface StitchOperation {
  type: 'add_layer' | 'remove_layer' | 'update_layer' | 'reorder' | 'merge' | 'duplicate';
  layer_id?: string;
  data?: Partial<StitchLayer>;
  target_index?: number;
}

export interface StitchPreset {
  id: string;
  name: string;
  category: string;
  canvas: CanvasSettings;
  layers: Partial<StitchLayer>[];
  description: string;
}

// Common presets
const STITCH_PRESETS: StitchPreset[] = [
  {
    id: 'social_post_square',
    name: 'Social Post Square',
    category: 'social',
    canvas: {
      width: 1080,
      height: 1080,
      background_color: '#ffffff',
      guides: [],
    },
    layers: [
      {
        name: 'Background',
        type: 'base',
        z_index: 0,
      },
      {
        name: 'Main Visual',
        type: 'element',
        z_index: 1,
      },
      {
        name: 'Headline',
        type: 'text',
        z_index: 2,
      },
      {
        name: 'Logo',
        type: 'element',
        z_index: 3,
      },
    ],
    description: 'Standard square social media post layout',
  },
  {
    id: 'story_vertical',
    name: 'Story Vertical',
    category: 'social',
    canvas: {
      width: 1080,
      height: 1920,
      background_color: '#000000',
      guides: [
        { type: 'horizontal', position: 200 },
        { type: 'horizontal', position: 1720 },
      ],
    },
    layers: [
      {
        name: 'Background',
        type: 'base',
        z_index: 0,
      },
      {
        name: 'Hero Image',
        type: 'element',
        z_index: 1,
      },
      {
        name: 'Text Overlay',
        type: 'text',
        z_index: 2,
      },
      {
        name: 'CTA Button',
        type: 'element',
        z_index: 3,
      },
    ],
    description: 'Vertical story format for Instagram/TikTok',
  },
  {
    id: 'banner_landscape',
    name: 'Banner Landscape',
    category: 'advertising',
    canvas: {
      width: 1200,
      height: 628,
      background_color: '#f0f0f0',
      guides: [],
    },
    layers: [
      {
        name: 'Background',
        type: 'base',
        z_index: 0,
      },
      {
        name: 'Product Image',
        type: 'element',
        z_index: 1,
      },
      {
        name: 'Headline',
        type: 'text',
        z_index: 2,
      },
      {
        name: 'Subhead',
        type: 'text',
        z_index: 3,
      },
      {
        name: 'Logo',
        type: 'element',
        z_index: 4,
      },
    ],
    description: 'Standard landscape banner for web ads',
  },
];

export class GoogleStitchEngine {
  private compositions: Map<string, StitchComposition> = new Map();

  /**
   * Create new composition
   */
  createComposition(
    name: string,
    workspaceId: string,
    canvas: Partial<CanvasSettings> = {}
  ): StitchComposition {
    const defaultCanvas: CanvasSettings = {
      width: 1080,
      height: 1080,
      background_color: '#ffffff',
      guides: [],
      ...canvas,
    };

    const composition: StitchComposition = {
      id: `stitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      workspace_id: workspaceId,
      canvas: defaultCanvas,
      layers: [],
      global_effects: [],
      metadata: {
        tags: [],
        version: 1,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.compositions.set(composition.id, composition);
    return composition;
  }

  /**
   * Create from preset
   */
  createFromPreset(
    presetId: string,
    name: string,
    workspaceId: string
  ): StitchComposition {
    const preset = STITCH_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const composition = this.createComposition(name, workspaceId, preset.canvas);

    // Add preset layers
    for (const layerTemplate of preset.layers) {
      this.addLayer(composition.id, layerTemplate);
    }

    return composition;
  }

  /**
   * Add layer to composition
   */
  addLayer(compositionId: string, layerData: Partial<StitchLayer>): StitchLayer {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const layer: StitchLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: layerData.name || `Layer ${composition.layers.length + 1}`,
      type: layerData.type || 'element',
      source: layerData.source || { type: 'library' },
      position: layerData.position || { x: 50, y: 50, anchor: 'center' },
      size: layerData.size || { width: 100, height: 100, unit: '%' },
      transform: layerData.transform || {
        rotation: 0,
        scale_x: 1,
        scale_y: 1,
        skew_x: 0,
        skew_y: 0,
      },
      blend_mode: layerData.blend_mode || 'normal',
      opacity: layerData.opacity ?? 100,
      effects: layerData.effects || [],
      z_index: layerData.z_index ?? composition.layers.length,
    };

    composition.layers.push(layer);
    composition.updated_at = new Date();

    return layer;
  }

  /**
   * Update layer
   */
  updateLayer(
    compositionId: string,
    layerId: string,
    updates: Partial<StitchLayer>
  ): StitchLayer {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const layer = composition.layers.find(l => l.id === layerId);
    if (!layer) {
      throw new Error(`Layer not found: ${layerId}`);
    }

    Object.assign(layer, updates);
    composition.updated_at = new Date();

    return layer;
  }

  /**
   * Remove layer
   */
  removeLayer(compositionId: string, layerId: string): void {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    composition.layers = composition.layers.filter(l => l.id !== layerId);
    composition.updated_at = new Date();
  }

  /**
   * Reorder layers
   */
  reorderLayers(compositionId: string, layerIds: string[]): void {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const reordered: StitchLayer[] = [];
    for (let i = 0; i < layerIds.length; i++) {
      const layer = composition.layers.find(l => l.id === layerIds[i]);
      if (layer) {
        layer.z_index = i;
        reordered.push(layer);
      }
    }

    composition.layers = reordered;
    composition.updated_at = new Date();
  }

  /**
   * Duplicate layer
   */
  duplicateLayer(compositionId: string, layerId: string): StitchLayer {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const original = composition.layers.find(l => l.id === layerId);
    if (!original) {
      throw new Error(`Layer not found: ${layerId}`);
    }

    const duplicate: StitchLayer = {
      ...JSON.parse(JSON.stringify(original)),
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (copy)`,
      z_index: composition.layers.length,
    };

    // Offset position slightly
    duplicate.position.x += 10;
    duplicate.position.y += 10;

    composition.layers.push(duplicate);
    composition.updated_at = new Date();

    return duplicate;
  }

  /**
   * Merge visible layers
   */
  mergeVisibleLayers(compositionId: string): StitchLayer {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const visibleLayers = composition.layers.filter(l => l.opacity > 0);

    const merged: StitchLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Merged Layer',
      type: 'element',
      source: { type: 'generated', prompt: 'Merged composition' },
      position: { x: 50, y: 50, anchor: 'center' },
      size: { width: 100, height: 100, unit: '%' },
      transform: { rotation: 0, scale_x: 1, scale_y: 1, skew_x: 0, skew_y: 0 },
      blend_mode: 'normal',
      opacity: 100,
      effects: [],
      z_index: 0,
    };

    // Replace all layers with merged
    composition.layers = [merged];
    composition.updated_at = new Date();

    return merged;
  }

  /**
   * Apply global effect
   */
  addGlobalEffect(compositionId: string, effect: LayerEffect): void {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    composition.global_effects.push(effect);
    composition.updated_at = new Date();
  }

  /**
   * Get composition
   */
  getComposition(compositionId: string): StitchComposition | undefined {
    return this.compositions.get(compositionId);
  }

  /**
   * Get available presets
   */
  getPresets(category?: string): StitchPreset[] {
    if (category) {
      return STITCH_PRESETS.filter(p => p.category === category);
    }
    return STITCH_PRESETS;
  }

  /**
   * Export composition spec
   */
  exportSpec(compositionId: string): string {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    return JSON.stringify(composition, null, 2);
  }

  /**
   * Import composition spec
   */
  importSpec(spec: string, workspaceId: string): StitchComposition {
    const data = JSON.parse(spec);
    const composition: StitchComposition = {
      ...data,
      id: `stitch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspace_id: workspaceId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.compositions.set(composition.id, composition);
    return composition;
  }
}

export default GoogleStitchEngine;
