import * as Cesium from 'cesium';
import { governorRequestRender } from './renderGovernor.js';

export const OSM_BUILDINGS_ASSET_ID = 96188;
export const GOOGLE_LABELS_ASSET_ID = 3830185;

/**
 * Controller for Cesium OSM Buildings 3D extrusion (Asset 96188)
 * and Google 2D Map Labels overlay (Asset 3830185).
 */
export class OsmBuildingsController {
  constructor(viewer, {
    cesiumToken = '',
    mapStackController = null,
    onStateChange = null,
    onToast = null,
  } = {}) {
    this.viewer = viewer;
    this.cesiumToken = String(cesiumToken || '').trim();
    this.mapStackController = mapStackController;
    this._onStateChange = onStateChange;
    this._onToast = onToast;

    this._enabled = false;
    this._styleMode = 'adaptive'; // 'adaptive' | 'realistic' | 'height' | 'cyber'
    this._activePreset = 'normal'; // 'normal' | 'surveillance' | 'thermal' | 'snow'
    this._tileset = null;
    this._loadingPromise = null;

    this._labelsEnabled = false;
    this._labelsLayer = null;
    this._loadingLabelsPromise = null;
  }

  isEnabled() {
    return this._enabled;
  }

  isLabelsEnabled() {
    return this._labelsEnabled;
  }

  getStyleMode() {
    return this._styleMode;
  }

  async setBuildingsEnabled(enabled) {
    const next = Boolean(enabled);
    if (this._enabled === next && this._tileset) return;
    this._enabled = next;

    if (this._enabled) {
      this._onToast?.('3D Building Extrusion active (Cesium OSM Buildings)');

      await this._ensureTileset();
      if (this._tileset) {
        this._tileset.show = this._shouldShowTileset();
        this._applyCurrentStyle();
      }
    } else {
      if (this._tileset) {
        this._tileset.show = false;
      }
      this._onToast?.('3D Building Extrusion disabled');
    }

    governorRequestRender('osm-buildings-toggle');
    this._notifyStateChange();
  }

  async toggleBuildings() {
    return this.setBuildingsEnabled(!this._enabled);
  }

  async setLabelsEnabled(enabled) {
    const next = Boolean(enabled);
    if (this._labelsEnabled === next && this._labelsLayer) return;
    this._labelsEnabled = next;

    if (this._labelsEnabled) {
      await this._ensureLabelsLayer();
      if (this._labelsLayer) {
        this._labelsLayer.show = true;
      }
      this._onToast?.('Map Labels overlay enabled (Google 2D Labels)');
    } else {
      if (this._labelsLayer) {
        this._labelsLayer.show = false;
      }
      this._onToast?.('Map Labels overlay disabled');
    }

    governorRequestRender('map-labels-toggle');
    this._notifyStateChange();
  }

  async toggleLabels() {
    return this.setLabelsEnabled(!this._labelsEnabled);
  }

  setStyleMode(mode) {
    if (!['adaptive', 'realistic', 'height', 'cyber'].includes(mode)) return;
    this._styleMode = mode;
    this._applyCurrentStyle();
    this._notifyStateChange();
  }

  onVisualPresetChange(presetName) {
    this._activePreset = presetName || 'normal';
    if (this._styleMode === 'adaptive') {
      this._applyCurrentStyle();
    }
  }

  onMapStackChange(stackId) {
    if (!this._tileset) return;
    this._tileset.show = this._shouldShowTileset(stackId);
    governorRequestRender('osm-buildings-stack-sync');
  }

  _shouldShowTileset(_stackId = this.mapStackController?.getActiveId()) {
    return this._enabled;
  }

  async _ensureTileset() {
    if (this._tileset) return this._tileset;
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = (async () => {
      try {
        let tileset;
        if (typeof Cesium.createOsmBuildingsAsync === 'function') {
          tileset = await Cesium.createOsmBuildingsAsync();
        } else {
          tileset = await Cesium.Cesium3DTileset.fromIonAssetId(OSM_BUILDINGS_ASSET_ID);
        }
        this._tileset = tileset;
        this.viewer.scene.primitives.add(this._tileset);
        return this._tileset;
      } catch (err) {
        console.error('[OsmBuildings] Failed to load Cesium OSM Buildings:', err);
        this._onToast?.('Failed to load 3D OSM Buildings');
        this._enabled = false;
        return null;
      } finally {
        this._loadingPromise = null;
      }
    })();

    return this._loadingPromise;
  }

  async _ensureLabelsLayer() {
    if (this._labelsLayer) return this._labelsLayer;
    if (this._loadingLabelsPromise) return this._loadingLabelsPromise;

    this._loadingLabelsPromise = (async () => {
      try {
        const provider = await Cesium.IonImageryProvider.fromAssetId(GOOGLE_LABELS_ASSET_ID);
        this._labelsLayer = new Cesium.ImageryLayer(provider);
        this.viewer.imageryLayers.add(this._labelsLayer);
        return this._labelsLayer;
      } catch (err) {
        console.error('[OsmBuildings] Failed to load Google Labels asset 3830185:', err);
        this._onToast?.('Failed to load Google Map Labels');
        this._labelsEnabled = false;
        return null;
      } finally {
        this._loadingLabelsPromise = null;
      }
    })();

    return this._loadingLabelsPromise;
  }

  _applyCurrentStyle() {
    if (!this._tileset) return;
    try {
      this._tileset.style = this._createTileStyle();
      governorRequestRender('osm-buildings-style');
    } catch (err) {
      console.warn('[OsmBuildings] Error applying style:', err);
    }
  }

  _createTileStyle() {
    const effectiveMode = this._styleMode === 'adaptive' ? this._activePreset : this._styleMode;

    switch (effectiveMode) {
      case 'surveillance': // NVG Tactical Green Matrix
        return new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['cesium#estimatedHeight']} >= 140", "color('#86efac', 0.9)"],
              ["${feature['cesium#estimatedHeight']} >= 60", "color('#22c55e', 0.85)"],
              ["${feature['cesium#estimatedHeight']} >= 25", "color('#16a34a', 0.8)"],
              ["true", "color('#15803d', 0.75)"]
            ]
          }
        });

      case 'thermal': // FLIR Heatmap Gradient
        return new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['cesium#estimatedHeight']} >= 180", "color('#ffffff', 0.98)"],
              ["${feature['cesium#estimatedHeight']} >= 100", "color('#ffea00', 0.95)"],
              ["${feature['cesium#estimatedHeight']} >= 50", "color('#ff3d00', 0.9)"],
              ["${feature['cesium#estimatedHeight']} >= 20", "color('#dd0077', 0.85)"],
              ["true", "color('#311042', 0.8)"]
            ]
          }
        });

      case 'snow': // Frosted Ice Blue Architecture
        return new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['cesium#estimatedHeight']} >= 120", "color('#f8fafc', 0.96)"],
              ["${feature['cesium#estimatedHeight']} >= 50", "color('#e2e8f0', 0.92)"],
              ["true", "color('#cbd5e1', 0.88)"]
            ]
          }
        });

      case 'height': // High-contrast Height Heatmap
        return new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['cesium#estimatedHeight']} >= 250", "color('#ffffff', 0.98)"],
              ["${feature['cesium#estimatedHeight']} >= 180", "color('#ff0055', 0.95)"],
              ["${feature['cesium#estimatedHeight']} >= 120", "color('#ff6600', 0.92)"],
              ["${feature['cesium#estimatedHeight']} >= 70", "color('#ffcc00', 0.90)"],
              ["${feature['cesium#estimatedHeight']} >= 30", "color('#00ffcc', 0.88)"],
              ["${feature['cesium#estimatedHeight']} >= 15", "color('#0088ff', 0.85)"],
              ["true", "color('#4a5568', 0.8)"]
            ]
          }
        });

      case 'cyber': // Glowing Blueprint Wireframe
        return new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['cesium#estimatedHeight']} >= 150", "color('#38bdf8', 0.85)"],
              ["${feature['cesium#estimatedHeight']} >= 60", "color('#0284c7', 0.8)"],
              ["true", "color('#0369a1', 0.72)"]
            ]
          }
        });

      case 'realistic':
      case 'normal':
      default: // Realistic Architectural Grayscale
        return new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${feature['cesium#estimatedHeight']} >= 160", "color('#e2e8f0', 0.96)"],
              ["${feature['cesium#estimatedHeight']} >= 80", "color('#cbd5e1', 0.94)"],
              ["${feature['cesium#estimatedHeight']} >= 30", "color('#94a3b8', 0.92)"],
              ["true", "color('#64748b', 0.9)"]
            ]
          }
        });
    }
  }

  _notifyStateChange() {
    this._onStateChange?.({
      enabled: this._enabled,
      styleMode: this._styleMode,
      labelsEnabled: this._labelsEnabled,
    });
  }

  destroy() {
    if (this._tileset) {
      try {
        this.viewer.scene.primitives.remove(this._tileset);
      } catch {}
      this._tileset = null;
    }
    if (this._labelsLayer) {
      try {
        this.viewer.imageryLayers.remove(this._labelsLayer, true);
      } catch {}
      this._labelsLayer = null;
    }
  }
}
