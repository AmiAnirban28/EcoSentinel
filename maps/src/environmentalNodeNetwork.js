import * as Cesium from 'cesium';
import { horizonOccluder } from './data/iconOrientation.js';

const MESSAGE_SOURCE = 'ecosentinel-environmental-network';
const NODE_PREFIX = 'environment-node:';
const CONNECTION_PREFIX = 'environment-connection:';
const markerGlyphCache = new Map();

function markerGlyph(color, selected) {
  const key = `${color}:${selected}`;
  if (markerGlyphCache.has(key)) return markerGlyphCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  const center = 24;
  context.shadowColor = color;
  context.shadowBlur = selected ? 18 : 12;
  context.globalAlpha = selected ? 0.5 : 0.32;
  context.fillStyle = color;
  context.beginPath();
  context.arc(center, center, selected ? 19 : 16, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  context.strokeStyle = selected ? '#ffffff' : color;
  context.lineWidth = selected ? 2.5 : 2;
  context.beginPath();
  context.arc(center, center, selected ? 15 : 13, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = selected ? 1 : 0.7;
  context.lineWidth = 1;
  context.beginPath();
  context.arc(center, center, selected ? 9 : 8, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI / 2;
    context.beginPath();
    context.moveTo(center + Math.cos(angle) * 18, center + Math.sin(angle) * 18);
    context.lineTo(center + Math.cos(angle) * 22, center + Math.sin(angle) * 22);
    context.stroke();
  }
  context.fillStyle = selected ? '#ffffff' : color;
  context.beginPath();
  context.arc(center, center, selected ? 4.5 : 3.5, 0, Math.PI * 2);
  context.fill();
  markerGlyphCache.set(key, canvas);
  return canvas;
}

function readEntityId(result) {
  const id = result?.id?.id ?? result?.id;
  if (typeof id !== 'string') return null;
  if (id.startsWith(NODE_PREFIX)) return { kind: 'node', id: id.slice(NODE_PREFIX.length) };
  if (id.startsWith(CONNECTION_PREFIX)) return { kind: 'connection', id: id.slice(CONNECTION_PREFIX.length) };
  return null;
}

export function initEnvironmentalNodeNetworkBridge(viewer) {
  const dataSource = new Cesium.CustomDataSource('environmental-node-network');
  void viewer.dataSources.add(dataSource);

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  const defaultHandler = viewer.screenSpaceEventHandler;
  const previousDoubleClick = defaultHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  let snapshot = { nodes: [], connections: [], activeNetworkId: '', selectedNodeId: '', mode: 'select', sourceNodeId: '' };
  let cursorPosition = null;
  let draggedNodeId = '';
  let draggedPosition = null;

  const postToParent = (type, detail = {}) => {
    if (window.parent === window) return;
    window.parent.postMessage({ source: MESSAGE_SOURCE, type, ...detail }, window.location.origin);
  };

  function pickWorldPosition(screenPosition) {
    if (!screenPosition) return null;
    try {
      if (viewer.scene.pickPositionSupported) {
        const depthPosition = viewer.scene.pickPosition(screenPosition);
        if (Cesium.defined(depthPosition)) return depthPosition;
      }
    } catch {
      // Fall through to the globe surface when the depth buffer has no hit.
    }
    try {
      const ray = viewer.camera.getPickRay(screenPosition);
      return ray ? viewer.scene.globe.pick(ray, viewer.scene) : null;
    } catch {
      return null;
    }
  }

  function toLocation(cartesian) {
    if (!cartesian) return null;
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    if (!cartographic) return null;
    return {
      latitude: Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(6)),
      longitude: Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(6)),
    };
  }

  function syncPreview() {
    const previewId = 'environment-connection-preview';
    let sourceNode = snapshot.nodes.find((node) => node.id === snapshot.sourceNodeId);
    if (!sourceNode && cursorPosition && snapshot.mode === 'connect') {
      const cursor = Cesium.Cartographic.fromCartesian(cursorPosition);
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const node of snapshot.nodes) {
        if (node.networkId !== snapshot.activeNetworkId) continue;
        const latitude = Cesium.Math.toRadians(node.latitude);
        const longitude = Cesium.Math.toRadians(node.longitude);
        const deltaLatitude = latitude - cursor.latitude;
        const deltaLongitude = (longitude - cursor.longitude) * Math.cos(cursor.latitude);
        const distance = deltaLatitude * deltaLatitude + deltaLongitude * deltaLongitude;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          sourceNode = node;
        }
      }
    }
    if (snapshot.mode !== 'connect' || !sourceNode || !cursorPosition) {
      dataSource.entities.removeById(previewId);
      return;
    }

    const start = Cesium.Cartesian3.fromDegrees(sourceNode.longitude, sourceNode.latitude, 100);
    const positions = new Cesium.CallbackProperty(() => [start, cursorPosition], false);
    if (dataSource.entities.getById(previewId)) {
      dataSource.entities.removeById(previewId);
    }
    dataSource.entities.add({
      id: previewId,
      polyline: {
        positions,
        width: 2,
        clampToGround: true,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.CYAN.withAlpha(0.85),
          dashLength: 14,
        }),
      },
    });
  }

  function refreshNodeHorizonVisibility() {
    const occluder = horizonOccluder(viewer.camera);
    const time = Cesium.JulianDate.now();
    let changed = false;
    for (const node of snapshot.nodes) {
      const entity = dataSource.entities.getById(`${NODE_PREFIX}${node.id}`);
      const position = entity?.position?.getValue(time);
      if (!entity || !position) continue;
      const visible = occluder.isPointVisible(position);
      if (entity.show !== visible) {
        entity.show = visible;
        changed = true;
      }
    }
    if (changed) viewer.scene.requestRender();
  }

  function renderSnapshot(nextSnapshot) {
    snapshot = { ...snapshot, ...nextSnapshot };
    dataSource.entities.removeAll();
    const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));

    for (const connection of snapshot.connections) {
      const source = nodeById.get(connection.sourceId);
      const target = nodeById.get(connection.targetId);
      if (!source || !target) continue;
      const isActive = connection.networkId === snapshot.activeNetworkId;
      const color = connection.kind === 'gateway'
        ? Cesium.Color.fromCssColorString('#f0b66d')
        : connection.kind === 'radio'
          ? Cesium.Color.fromCssColorString('#7dd3fc')
          : Cesium.Color.fromCssColorString('#2dd4bf');
      dataSource.entities.add({
        id: `${CONNECTION_PREFIX}${connection.id}`,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            source.longitude, source.latitude,
            target.longitude, target.latitude,
          ]),
          width: isActive ? 4 : 2,
          clampToGround: true,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: color.withAlpha(isActive ? 0.95 : 0.32),
            glowPower: isActive ? 0.24 : 0.1,
            taperPower: 0.72,
          }),
        },
      });
    }

    for (const node of snapshot.nodes) {
      if (!Number.isFinite(node.latitude) || !Number.isFinite(node.longitude)) continue;
      const isActive = node.networkId === snapshot.activeNetworkId;
      const isSelected = node.id === snapshot.selectedNodeId;
      const color = Cesium.Color.fromCssColorString(node.color || '#39d0b3');
      dataSource.entities.add({
        id: `${NODE_PREFIX}${node.id}`,
        position: draggedNodeId === node.id && draggedPosition
          ? draggedPosition
          : Cesium.Cartesian3.fromDegrees(node.longitude, node.latitude, 120),
        billboard: {
          image: markerGlyph(color.toCssColorString(), isSelected),
          width: isSelected ? 36 : isActive ? 29 : 22,
          height: isSelected ? 36 : isActive ? 29 : 22,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        point: {
          pixelSize: isSelected ? 5 : isActive ? 4 : 3,
          color: color.withAlpha(isActive ? 1 : 0.55),
          outlineColor: isSelected ? Cesium.Color.WHITE : Cesium.Color.BLACK,
          outlineWidth: isSelected ? 3 : 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: isActive ? node.name : '',
          font: '600 11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -23),
          showBackground: isActive,
          backgroundColor: color.withAlpha(0.92),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }

    syncPreview();
    refreshNodeHorizonVisibility();
    viewer.scene.requestRender();
  }

  function handleMapDoubleClick(movement) {
    if (snapshot.mode !== 'add') {
      previousDoubleClick?.(movement);
      return;
    }
    if (readEntityId(viewer.scene.pick(movement.position))?.kind === 'node') return;
    const location = toLocation(pickWorldPosition(movement.position));
    if (!location) return;
    const canvas = viewer.scene.canvas;
    postToParent('placement-requested', {
      ...location,
      x: movement.position.x / canvas.clientWidth,
      y: movement.position.y / canvas.clientHeight,
    });
  }

  defaultHandler.setInputAction(handleMapDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  handler.setInputAction((movement) => {
    const picked = readEntityId(viewer.scene.pick(movement.position));
    if (snapshot.mode === 'move' && picked?.kind === 'node') {
      draggedNodeId = picked.id;
      draggedPosition = pickWorldPosition(movement.position);
      return;
    }
    if (!picked) return;
    if (snapshot.mode === 'connect' && picked.kind === 'node') {
      if (!snapshot.sourceNodeId) {
        postToParent('connection-source-selected', { id: picked.id });
      } else if (snapshot.sourceNodeId !== picked.id) {
        postToParent('connection-requested', { sourceId: snapshot.sourceNodeId, targetId: picked.id });
      } else {
        postToParent('connection-source-selected', { id: picked.id });
      }
      return;
    }
    postToParent(picked.kind === 'node' ? 'node-selected' : 'connection-selected', { id: picked.id });
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  handler.setInputAction((movement) => {
    const worldPosition = pickWorldPosition(movement.endPosition);
    if (draggedNodeId && worldPosition) {
      draggedPosition = worldPosition;
      const entity = dataSource.entities.getById(`${NODE_PREFIX}${draggedNodeId}`);
      if (entity) entity.position = worldPosition;
      viewer.scene.requestRender();
      return;
    }

    cursorPosition = worldPosition;
    syncPreview();
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    if (!draggedNodeId || !draggedPosition) return;
    const movedId = draggedNodeId;
    const location = toLocation(draggedPosition);
    draggedNodeId = '';
    draggedPosition = null;
    if (location) postToParent('node-moved', { id: movedId, ...location });
  }, Cesium.ScreenSpaceEventType.LEFT_UP);

  const handleParentMessage = (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.source !== MESSAGE_SOURCE) return;

    if (message.type === 'sync') renderSnapshot(message.snapshot || {});
    if (message.type === 'search') {
      const input = document.getElementById('location-search');
      const submit = document.getElementById('location-search-submit');
      if (!(input instanceof HTMLInputElement) || !submit || typeof message.query !== 'string') return;
      input.value = message.query;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      submit.click();
    }
    if (message.type === 'focus') {
      const { latitude, longitude, altitude = 420000, duration = 1.4 } = message;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
        duration,
      });
    }
  };

  window.addEventListener('message', handleParentMessage);
  const cameraChanged = () => refreshNodeHorizonVisibility();
  viewer.camera.changed.addEventListener(cameraChanged);
  if (window.parent !== window) postToParent('ready');

  return {
    dataSource,
    destroy() {
      window.removeEventListener('message', handleParentMessage);
      viewer.camera.changed.removeEventListener(cameraChanged);
      handler.destroy();
      if (previousDoubleClick) defaultHandler.setInputAction(previousDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      else defaultHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      viewer.dataSources.remove(dataSource, true);
    },
  };
}