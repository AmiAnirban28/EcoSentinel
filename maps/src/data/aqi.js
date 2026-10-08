import * as Cesium from 'cesium';
import { horizonOccluder } from './iconOrientation.js';

/**
 * CPCB National Air Quality Index (NAQI) Standard Breakpoints & Categories.
 * Color scale strictly follows official Indian CPCB air quality indices:
 *  - 0–50: Good (Emerald Green)
 *  - 51–100: Satisfactory (Lime Green)
 *  - 101–200: Moderate (Amber / Yellow)
 *  - 201–300: Poor (Orange)
 *  - 301–400: Very Poor (Crimson Red)
 *  - 401+: Severe (Deep Maroon / Purple)
 */
export function getAqiCategory(aqiValue) {
  const aqi = Math.max(0, Math.round(Number(aqiValue) || 0));
  if (aqi <= 50) {
    return {
      category: 'Good',
      colorHex: '#10b981',
      cesiumColor: Cesium.Color.fromCssColorString('#10b981'),
      impact: 'Minimal health impact',
      code: 'good',
    };
  }
  if (aqi <= 100) {
    return {
      category: 'Satisfactory',
      colorHex: '#84cc16',
      cesiumColor: Cesium.Color.fromCssColorString('#84cc16'),
      impact: 'Minor breathing discomfort to sensitive individuals',
      code: 'satisfactory',
    };
  }
  if (aqi <= 200) {
    return {
      category: 'Moderate',
      colorHex: '#facc15',
      cesiumColor: Cesium.Color.fromCssColorString('#facc15'),
      impact: 'Breathing discomfort to people with asthma and heart disease',
      code: 'moderate',
    };
  }
  if (aqi <= 300) {
    return {
      category: 'Poor',
      colorHex: '#f97316',
      cesiumColor: Cesium.Color.fromCssColorString('#f97316'),
      impact: 'Breathing discomfort to most people on prolonged exposure',
      code: 'poor',
    };
  }
  if (aqi <= 400) {
    return {
      category: 'Very Poor',
      colorHex: '#ef4444',
      cesiumColor: Cesium.Color.fromCssColorString('#ef4444'),
      impact: 'Respiratory illness on prolonged exposure',
      code: 'very-poor',
    };
  }
  return {
    category: 'Severe',
    colorHex: '#881337',
    cesiumColor: Cesium.Color.fromCssColorString('#881337'),
    impact: 'Affects healthy people; serious impact on vulnerable groups',
    code: 'severe',
  };
}

/**
 * City camera target coordinates for interactive row chips
 */
const CITY_CAM_TARGETS = Object.freeze({
  all: { lon: 78.9629, lat: 21.5000, height: 3200000 },
  india: { lon: 78.9629, lat: 21.5000, height: 3200000 },
  delhi: { lon: 77.2090, lat: 28.6139, height: 80000 },
  mumbai: { lon: 72.8777, lat: 19.0760, height: 65000 },
  bengaluru: { lon: 77.5946, lat: 12.9716, height: 60000 },
  kolkata: { lon: 88.3639, lat: 22.5726, height: 60000 },
  asia: { lon: 95.0, lat: 22.0, height: 8500000 },
  global: { lon: 20.0, lat: 20.0, height: 18500000 },
});

export function createAqiLayer() {
  let _viewer = null;
  let _dataSource = null;
  let _count = 0;
  let _lastUpdate = null;
  let _lastError = null;
  let _enabled = false;
  let _stations = [];
  let _categoryCounts = { good: 0, satisfactory: 0, moderate: 0, poor: 0, 'very-poor': 0, severe: 0 };
  let _rowControlsListener = null;
  let _activeCityChip = 'all';
  let _horizonChangedRemove = null;

  function refreshHorizonVisibility() {
    if (!_enabled || !_viewer?.camera || !_dataSource) return;
    const occluder = horizonOccluder(_viewer.camera);
    const time = Cesium.JulianDate.now();
    let changed = false;
    for (const entity of _dataSource.entities.values) {
      const position = entity.position?.getValue(time);
      if (!position) continue;
      const visible = occluder.isPointVisible(position);
      if (entity.show !== visible) {
        entity.show = visible;
        changed = true;
      }
    }
    if (changed) _viewer.scene.requestRender();
  }

  const layer = {
    id: 'aqi',
    name: 'Air Quality (AQI)',
    icon: '🍃',
    source: 'CPCB / WAQI Global',
    updateInterval: 180000, // 3 minutes

    init(viewer) {
      _viewer = viewer;
      if (viewer && viewer.dataSources) {
        _dataSource = new Cesium.CustomDataSource('aqi');
        _dataSource.show = false;
        viewer.dataSources.add(_dataSource);
      }
      _count = 0;
      _lastUpdate = null;
      _lastError = null;
      _enabled = false;
      _stations = [];
    },

    enable(viewer) {
      _enabled = true;
      if (_dataSource) _dataSource.show = true;
      if (!_horizonChangedRemove && viewer?.camera) {
        _horizonChangedRemove = viewer.camera.changed.addEventListener(refreshHorizonVisibility);
      }
      refreshHorizonVisibility();
      if (viewer && viewer.scene) viewer.scene.requestRender();
    },

    disable(viewer) {
      _enabled = false;
      _horizonChangedRemove?.();
      _horizonChangedRemove = null;
      if (_dataSource) _dataSource.show = false;
      if (viewer && viewer.scene) viewer.scene.requestRender();
    },

    setRowControlsListener(listener) {
      _rowControlsListener = typeof listener === 'function' ? listener : null;
    },

    setParams(params = {}, { origin = 'user' } = {}) {
      if (params.focusCity && CITY_CAM_TARGETS[params.focusCity]) {
        _activeCityChip = params.focusCity;
        const target = CITY_CAM_TARGETS[params.focusCity];
        if (_viewer && _viewer.camera) {
          _viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(target.lon, target.lat, target.height),
            duration: 1.8,
          });
        }
        _rowControlsListener?.();
      }
      return true;
    },

    getParams() {
      return { focusCity: _activeCityChip };
    },

    getRowControls() {
      const indiaCount = _stations.filter((s) => s.isIndia || s.country === 'India').length;
      return {
        chips: [
          {
            id: 'focus-all',
            label: '🇮🇳 India Focus',
            active: _activeCityChip === 'all' || _activeCityChip === 'india',
            params: { focusCity: 'all' },
            title: `Focus on India CPCB network (${indiaCount || 'dense'} stations)`,
          },
          {
            id: 'focus-delhi',
            label: '🏛️ Delhi NCR',
            active: _activeCityChip === 'delhi',
            params: { focusCity: 'delhi' },
            title: 'Fly to Delhi-NCR CPCB monitors',
          },
          {
            id: 'focus-mumbai',
            label: '🌊 Mumbai',
            active: _activeCityChip === 'mumbai',
            params: { focusCity: 'mumbai' },
            title: 'Fly to Mumbai MMR CPCB monitors',
          },
          {
            id: 'focus-bengaluru',
            label: '💻 Bengaluru',
            active: _activeCityChip === 'bengaluru',
            params: { focusCity: 'bengaluru' },
            title: 'Fly to Bengaluru CPCB monitors',
          },
          {
            id: 'focus-asia',
            label: '🌏 Asia',
            active: _activeCityChip === 'asia',
            params: { focusCity: 'asia' },
            title: 'Explore Asian continent air quality',
          },
          {
            id: 'focus-global',
            label: '🌐 Worldwide',
            active: _activeCityChip === 'global',
            params: { focusCity: 'global' },
            title: 'Global overview across international monitoring stations',
          },
        ],
        legend: [
          { label: 'Good (0-50)', count: _categoryCounts.good, color: '#10b981', blurb: 'Minimal health impact' },
          { label: 'Satisfactory (51-100)', count: _categoryCounts.satisfactory, color: '#84cc16', blurb: 'Minor discomfort to sensitive people' },
          { label: 'Moderate (101-200)', count: _categoryCounts.moderate, color: '#facc15', blurb: 'Discomfort to asthma & heart patients' },
          { label: 'Poor (201-300)', count: _categoryCounts.poor, color: '#f97316', blurb: 'Discomfort on prolonged exposure' },
          { label: 'Severe (301+)', count: _categoryCounts['very-poor'] + _categoryCounts.severe, color: '#ef4444', blurb: 'Serious respiratory threat' },
        ],
      };
    },

    async update(viewer) {
      try {
        const response = await fetch('/api/aqi');
        if (!response.ok) {
          _lastError = `AQI API HTTP ${response.status}`;
          console.warn(`[Data:AQI] Upstream API returned ${response.status}`);
          return false;
        }

        const json = await response.json();
        const stations = Array.isArray(json?.stations) ? json.stations : [];

        _stations = stations;
        _count = stations.length;
        _lastUpdate = Date.now();
        _lastError = null;

        // Reset category counts
        _categoryCounts = { good: 0, satisfactory: 0, moderate: 0, poor: 0, 'very-poor': 0, severe: 0 };

        if (_dataSource) {
          _dataSource.entities.removeAll();

          for (const station of stations) {
            const aqi = Number(station.aqi) || 0;
            const cat = getAqiCategory(aqi);
            const isIndia = Boolean(station.isIndia || station.country === 'India');

            if (Object.hasOwn(_categoryCounts, cat.code)) {
              _categoryCounts[cat.code]++;
            }

            const position = Cesium.Cartesian3.fromDegrees(station.lon, station.lat, isIndia ? 35 : 20);
            const groundPosition = Cesium.Cartesian3.fromDegrees(station.lon, station.lat);

            // Ground illumination halo:
            // Indian stations have higher prominence, larger radius, and higher opacity
            const baseHaloRadius = isIndia ? 16000 : 9000;
            const multiplier = isIndia ? 75 : 45;
            const haloRadius = Math.max(baseHaloRadius, Math.min(isIndia ? 38000 : 22000, baseHaloRadius + aqi * multiplier));

            _dataSource.entities.add({
              id: `aqi-halo:${station.id}`,
              position: groundPosition,
              ellipse: {
                semiMajorAxis: haloRadius,
                semiMinorAxis: haloRadius,
                material: new Cesium.ColorMaterialProperty(
                  cat.cesiumColor.withAlpha(isIndia ? 0.32 : 0.18)
                ),
                outline: true,
                outlineColor: isIndia ? Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.85) : cat.cesiumColor.withAlpha(0.45),
                outlineWidth: isIndia ? 2.2 : 1.0,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              },
            });

            // Point marker & text label
            const descriptionHtml = isIndia ? `
              <div style="font-family:'JetBrains Mono',monospace;padding:8px;line-height:1.5;color:#f3f4f6;background:#111827;border-radius:8px;border:1px solid #f59e0b55;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #374151;padding-bottom:6px;">
                  <div>
                    <span style="font-size:14px;font-weight:700;color:#ffffff;">🇮🇳 ${station.name}</span>
                    <div style="font-size:10px;color:#f59e0b;font-weight:600;margin-top:2px;">Central Pollution Control Board (CPCB) • ${station.city}, ${station.state || 'India'}</div>
                  </div>
                  <span style="background:${cat.colorHex};color:#ffffff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">${cat.category.toUpperCase()}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                  <div style="background:#1f2937;padding:6px;border-radius:4px;">
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">AQI Value</div>
                    <div style="font-size:20px;font-weight:800;color:${cat.colorHex};">${aqi}</div>
                  </div>
                  <div style="background:#1f2937;padding:6px;border-radius:4px;">
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Dominant Pollutant</div>
                    <div style="font-size:15px;font-weight:700;color:#60a5fa;">${String(station.dominant || 'PM2.5').toUpperCase()}</div>
                  </div>
                </div>
                ${station.pm25 != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:2px;">• PM2.5: <b>${station.pm25} µg/m³</b></div>` : ''}
                ${station.pm10 != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:2px;">• PM10: <b>${station.pm10} µg/m³</b></div>` : ''}
                ${station.no2 != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:2px;">• NO₂: <b>${station.no2} µg/m³</b></div>` : ''}
                ${station.temp != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:4px;">• Ambient Temp: <b>${station.temp}°C</b></div>` : ''}
                <div style="font-size:10px;color:#9ca3af;margin-top:6px;padding-top:4px;border-top:1px dashed #374151;">
                  Health Advisory: ${cat.impact}<br/>
                  Authority: <b>Central Pollution Control Board (CPCB) / WAQI</b>
                </div>
              </div>
            ` : `
              <div style="font-family:'JetBrains Mono',monospace;padding:8px;line-height:1.5;color:#f3f4f6;background:#111827;border-radius:8px;border:1px solid #374151;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #374151;padding-bottom:6px;">
                  <div>
                    <span style="font-size:14px;font-weight:700;color:#ffffff;">🌐 ${station.name}</span>
                    <div style="font-size:10px;color:#9ca3af;margin-top:2px;">Global Air Monitor • ${station.city}, ${station.country || 'International'}</div>
                  </div>
                  <span style="background:${cat.colorHex};color:#ffffff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;">${cat.category.toUpperCase()}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                  <div style="background:#1f2937;padding:6px;border-radius:4px;">
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">AQI Value</div>
                    <div style="font-size:20px;font-weight:800;color:${cat.colorHex};">${aqi}</div>
                  </div>
                  <div style="background:#1f2937;padding:6px;border-radius:4px;">
                    <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;">Dominant</div>
                    <div style="font-size:15px;font-weight:700;color:#60a5fa;">${String(station.dominant || 'PM2.5').toUpperCase()}</div>
                  </div>
                </div>
                ${station.pm25 != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:2px;">• PM2.5: <b>${station.pm25} µg/m³</b></div>` : ''}
                ${station.pm10 != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:2px;">• PM10: <b>${station.pm10} µg/m³</b></div>` : ''}
                ${station.temp != null ? `<div style="font-size:11px;color:#d1d5db;margin-bottom:4px;">• Ambient Temp: <b>${station.temp}°C</b></div>` : ''}
                <div style="font-size:10px;color:#9ca3af;margin-top:6px;padding-top:4px;border-top:1px dashed #374151;">
                  Advisory: ${cat.impact}<br/>
                  Network: <b>WAQI Global Air Quality Network</b>
                </div>
              </div>
            `;

            _dataSource.entities.add({
              id: `aqi:${station.id}`,
              name: isIndia ? `🇮🇳 ${station.name} (AQI ${aqi})` : `${station.name} (AQI ${aqi})`,
              position,
              point: {
                pixelSize: isIndia ? (aqi > 200 ? 17 : 14) : (aqi > 200 ? 12 : 9),
                color: cat.cesiumColor,
                outlineColor: isIndia ? Cesium.Color.fromCssColorString('#fde047') : Cesium.Color.WHITE.withAlpha(0.9),
                outlineWidth: isIndia ? 2.5 : 1.5,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                scaleByDistance: isIndia
                  ? new Cesium.NearFarScalar(5e3, 1.35, 8e6, 0.75)
                  : new Cesium.NearFarScalar(5e3, 1.1, 4e6, 0.5),
              },
              label: {
                text: isIndia ? `🇮🇳 ${station.city}: ${aqi}` : `${station.city}: ${aqi}`,
                font: isIndia ? 'bold 12px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                outlineColor: isIndia ? Cesium.Color.BLACK : Cesium.Color.fromCssColorString('#111827'),
                outlineWidth: isIndia ? 3.5 : 2.5,
                pixelOffset: new Cesium.Cartesian2(0, isIndia ? -22 : -18),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                  0,
                  isIndia ? 6000000 : 2800000
                ),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
              description: descriptionHtml,
              properties: {
                layerId: 'aqi',
                stationId: station.id,
                name: station.name,
                city: station.city,
                country: station.country || (isIndia ? 'India' : 'International'),
                state: station.state,
                isIndia,
                aqi,
                category: cat.category,
                dominant: station.dominant || 'pm25',
                pm25: station.pm25,
                pm10: station.pm10,
                source: isIndia ? 'Central Pollution Control Board (CPCB) / WAQI' : 'WAQI Global',
              },
            });
          }
        }

        _rowControlsListener?.();
        refreshHorizonVisibility();
        if (viewer?.scene) viewer.scene.requestRender();

        const inCount = stations.filter((s) => s.isIndia || s.country === 'India').length;
        console.log(`[Data:AQI] Updated: ${_count} stations worldwide (${inCount} priority India CPCB stations)`);
        return true;
      } catch (e) {
        console.warn('[Data:AQI] Fetch error:', e);
        _lastError = 'Network error';
        return false;
      }
    },

    destroy(viewer) {
      _enabled = false;
      _horizonChangedRemove?.();
      _horizonChangedRemove = null;
      if (_dataSource && viewer && viewer.dataSources) {
        viewer.dataSources.remove(_dataSource, true);
        _dataSource = null;
      }
      _count = 0;
      _lastUpdate = null;
      _lastError = null;
      _stations = [];
    },

    getAnalystRecords(maxCount = 200) {
      if (!_enabled || !_stations.length) return [];
      const limit = Number.isFinite(maxCount) ? Math.max(1, Math.floor(maxCount)) : 200;
      return _stations.slice(0, limit).map((s) => {
        const cat = getAqiCategory(s.aqi);
        const isIndia = Boolean(s.isIndia || s.country === 'India');
        return {
          id: s.id,
          name: s.name,
          city: s.city,
          state: s.state,
          country: s.country || (isIndia ? 'India' : 'International'),
          isIndia,
          latitude: s.lat,
          longitude: s.lon,
          aqi: s.aqi,
          category: cat.category,
          dominant: s.dominant || 'pm25',
          pm25: s.pm25,
          pm10: s.pm10,
          source: isIndia ? 'Central Pollution Control Board (CPCB) / WAQI' : 'WAQI Global',
        };
      });
    },

    getStats() {
      const inCount = _stations.filter((s) => s.isIndia || s.country === 'India').length;
      return {
        count: _count,
        indiaCount: inCount,
        globalCount: Math.max(0, _count - inCount),
        lastUpdate: _lastUpdate,
        error: _lastError,
        source: 'CPCB / WAQI Global',
      };
    },
  };

  return layer;
}

const aqiLayer = createAqiLayer();
export default aqiLayer;
