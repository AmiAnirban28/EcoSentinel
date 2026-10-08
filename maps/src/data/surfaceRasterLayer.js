import * as Cesium from 'cesium';

let baseLayerUsers = 0;
let baseLayerChange = null;
let priorStackId = null;

async function acquireCompatibleBase(viewer, controller) {
  const activeStack = controller?.getActiveStack?.();
  if (baseLayerUsers === 0 && activeStack?.id === 'photoreal' && controller) {
    priorStackId = activeStack.id;
    baseLayerChange = controller.setStack('esri-imagery', { silent: true });
  }
  baseLayerUsers += 1;
  const result = await baseLayerChange;
  if (activeStack?.id === 'photoreal' && controller && result?.activeId !== 'esri-imagery') {
    baseLayerUsers = Math.max(0, baseLayerUsers - 1);
    if (baseLayerUsers === 0) baseLayerChange = null;
    throw new Error('Could not switch to a compatible imagery base for NASA satellite data.');
  }
  if (!viewer.scene.globe) throw new Error('Cesium globe imagery is unavailable for NASA satellite data.');
}

async function releaseCompatibleBase(controller) {
  baseLayerUsers = Math.max(0, baseLayerUsers - 1);
  if (baseLayerUsers !== 0) return;
  await baseLayerChange;
  const targetStackId = priorStackId;
  baseLayerChange = null;
  priorStackId = null;
  if (
    targetStackId
    && controller?.getActiveStack?.()?.id === 'esri-imagery'
  ) {
    await controller?.setStack(targetStackId, { silent: true });
  }
}

export function createSurfaceRasterLayer({ id, name, icon, source, layerId, dateLagDays, matrixSet, maximumLevel }) {
  let viewerRef = null;
  let mapStackController = null;
  let imageryLayer = null;
  let enabled = false;
  let baseAcquired = false;
  let lastError = null;

  const layer = {
    id,
    name,
    icon,
    source,
    showInTogglePanel: true,
    stats: { count: 0, source, lastUpdate: null },

    attachMapStackController(controller) {
      mapStackController = controller;
    },

    async init(viewer) {
      viewerRef = viewer;
      return true;
    },

    async enable(viewer) {
      viewerRef = viewer;
      enabled = true;
      lastError = null;
      try {
        if (!baseAcquired) {
          await acquireCompatibleBase(viewer, mapStackController);
          baseAcquired = true;
        }
        if (!imageryLayer) {
          const date = new Date(Date.now() - dateLagDays * 86400000).toISOString().slice(0, 10);
          const provider = new Cesium.UrlTemplateImageryProvider({
            url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerId}/default/${date}/${matrixSet}/{z}/{y}/{x}.png`,
            credit: new Cesium.Credit('NASA Global Imagery Browse Services (GIBS)', true),
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            minimumLevel: 0,
            maximumLevel,
            tileWidth: 256,
            tileHeight: 256,
          });
          imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
          imageryLayer.alpha = 0.75;
        }
        imageryLayer.show = true;
        this.stats = { count: 0, source, lastUpdate: new Date().toISOString() };
        return true;
      } catch (error) {
        enabled = false;
        lastError = error?.message || 'NASA imagery could not be loaded.';
        if (baseAcquired) {
          baseAcquired = false;
          await releaseCompatibleBase(mapStackController);
        }
        throw error;
      }
    },

    async disable() {
      enabled = false;
      if (imageryLayer) imageryLayer.show = false;
      if (baseAcquired) {
        baseAcquired = false;
        await releaseCompatibleBase(mapStackController);
      }
      this.stats = { count: 0, source, lastUpdate: this.stats.lastUpdate };
      return true;
    },

    async update() {
      if (enabled) this.stats = { count: 0, source, lastUpdate: new Date().toISOString() };
    },

    destroy() {
      enabled = false;
      if (baseAcquired) {
        baseAcquired = false;
        void releaseCompatibleBase(mapStackController);
      }
      if (imageryLayer && viewerRef && !viewerRef.isDestroyed()) {
        viewerRef.imageryLayers.remove(imageryLayer, true);
      }
      imageryLayer = null;
      viewerRef = null;
    },

    getStats() {
      return { ...this.stats, error: lastError };
    },
  };

  return layer;
}
