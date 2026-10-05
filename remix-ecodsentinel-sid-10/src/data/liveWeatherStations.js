import * as Cesium from 'cesium';
import { horizonOccluder } from './iconOrientation.js';
import { WEATHER_STATIONS } from './weatherStationCatalog.mjs';

const EARTH_RADIUS_KM = 6371;
const WEATHER_METRICS = Object.freeze({
  temperature: { label: 'temperature', format: (value) => Number.isFinite(value) ? `${Math.round(value)}°C` : '—' },
  humidity: { label: 'humidity', format: (value) => Number.isFinite(value) ? `${Math.round(value)}% RH` : '—' },
  precipitation: { label: 'rain', format: (value) => Number.isFinite(value) ? `${value.toFixed(1)} mm` : '—' },
  wind: { label: 'wind', format: (value) => Number.isFinite(value) ? `${Math.round(value)} km/h` : '—' },
});

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => Cesium.Math.toRadians(degrees);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const rawA = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  const a = Math.min(1, Math.max(0, rawA));
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default {
  id: 'live-weather-stations',
  name: 'Live city weather',
  icon: '🌡',
  source: 'Open-Meteo · current city observations',
  showInTogglePanel: true,
  updateInterval: 10 * 60 * 1000,
  stats: { count: 0, source: 'Open-Meteo', lastUpdate: null },
  displayMetric: 'temperature',

  async init(viewer) {
    this.viewer = viewer;
    this.dataSource = new Cesium.CustomDataSource('live-weather-stations');
    await viewer.dataSources.add(this.dataSource);
    this.entitiesById = new Map();
    for (const station of WEATHER_STATIONS) {
      const entity = this.dataSource.entities.add({
        id: `live-weather-${station.id}`,
        position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat, 100),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString('#53e5ff'),
          outlineColor: Cesium.Color.fromCssColorString('#071523'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: station.name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#071523'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -15),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: false,
        },
      });
      entity.weatherStation = station;
      entity.show = false;
      this.entitiesById.set(station.id, entity);
    }
    this._clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this._clickHandler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position);
      const station = picked?.id?.weatherStation;
      if (!station) return;
      window.dispatchEvent(new CustomEvent('gev:weather-station-selected', {
        detail: { stationId: station.id },
      }));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this._cameraListener = viewer.camera.changed.addEventListener(() => this._updateVisibility());
    this._metricChangedListener = (event) => {
      const metric = event.detail?.metric;
      if (!Object.hasOwn(WEATHER_METRICS, metric)) return;
      this.displayMetric = metric;
      this._updateLabels();
    };
    window.addEventListener('gev:weather-metric-changed', this._metricChangedListener);
    return true;
  },

  async enable() {
    this.enabled = true;
    this.dataSource.show = true;
    this._updateVisibility();
    return true;
  },

  async disable() {
    this.enabled = false;
    this.dataSource.show = false;
    return true;
  },

  async update(viewer, { signal } = {}) {
    const response = await fetch('/api/thematic/weather/current', { signal });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `Live weather request failed (HTTP ${response.status}).`);
    }
    const result = await response.json();
    if (!Array.isArray(result.stations) || result.stations.length !== WEATHER_STATIONS.length) {
      throw new Error('Live weather feed returned an incomplete station catalog.');
    }
    const records = result.stations.map((record, index) => {
      const station = WEATHER_STATIONS[index];
      const temperatureC = Number(record.temperatureC);
      if (record.id !== station.id || !Number.isFinite(temperatureC)) {
        throw new Error(`Live weather feed returned invalid data for ${station.name}.`);
      }
      const observation = {
        temperatureC,
        feelsLikeC: record.feelsLikeC != null && Number.isFinite(Number(record.feelsLikeC)) ? Number(record.feelsLikeC) : null,
        humidityPct: record.humidityPct != null && Number.isFinite(Number(record.humidityPct)) ? Number(record.humidityPct) : null,
        precipitationMm: record.precipitationMm != null && Number.isFinite(Number(record.precipitationMm)) ? Number(record.precipitationMm) : null,
        windKph: record.windKph != null && Number.isFinite(Number(record.windKph)) ? Number(record.windKph) : null,
        windDirectionDeg: record.windDirectionDeg != null && Number.isFinite(Number(record.windDirectionDeg)) ? Number(record.windDirectionDeg) : null,
        weatherCode: record.weatherCode != null && Number.isFinite(Number(record.weatherCode)) ? Number(record.weatherCode) : null,
      };
      const entity = this.entitiesById.get(station.id);
      entity.weatherObservation = observation;
      return { ...station, observation };
    });
    this.stats = { count: records.length, source: 'Open-Meteo', lastUpdate: result.fetchedAt };
    this.lastError = null;
    window.dispatchEvent(new CustomEvent('gev:weather-stations-updated', { detail: { records, fetchedAt: result.fetchedAt } }));
    this._updateLabels();
    this._updateVisibility();
    return true;
  },

  _updateVisibility() {
    if (!this.enabled || !this.dataSource || !this.viewer?.camera) return;
    const camera = this.viewer.camera.positionCartographic;
    if (!camera) return;
    const height = camera.height;
    const lat = Cesium.Math.toDegrees(camera.latitude);
    const lon = Cesium.Math.toDegrees(camera.longitude);
    const indiaView = lat >= 4 && lat <= 38 && lon >= 64 && lon <= 100;
    const localRadiusKm = Math.max(180, Math.min(6000, height / 1000 * 1.5));
    const occluder = horizonOccluder(this.viewer.camera);
    const time = Cesium.JulianDate.now();

    for (const station of WEATHER_STATIONS) {
      const entity = this.entitiesById.get(station.id);
      const position = entity?.position?.getValue(time);
      const horizonVisible = Boolean(position && occluder.isPointVisible(position));
      const km = distanceKm(lat, lon, station.lat, station.lon);
      const worldVisible = height > 8_000_000 ? station.tier === 'world' : true;
      const localVisible = station.tier === 'state'
        ? indiaView && height <= 4_000_000 && km <= localRadiusKm
        : station.tier !== 'local' || height <= 4_000_000;
      const nearbyVisible = height > 4_000_000 || km <= localRadiusKm;
      const visible = worldVisible && localVisible && nearbyVisible && horizonVisible;
      entity.show = visible;
      entity.label.show = visible;
      if (visible && station.tier === 'state' && height < 900_000) {
        entity.label.text = `${station.name}, ${station.state} · ${this._metricValue(entity.weatherObservation)}`;
      } else if (visible) {
        entity.label.text = `${station.name} · ${this._metricValue(entity.weatherObservation)}`;
      }
    }
  },

  _metricValue(observation) {
    const metric = WEATHER_METRICS[this.displayMetric];
    return metric.format(observation?.[{
      temperature: 'temperatureC',
      humidity: 'humidityPct',
      precipitation: 'precipitationMm',
      wind: 'windKph',
    }[this.displayMetric]]);
  },

  _updateLabels() {
    if (!this.entitiesById) return;
    for (const station of WEATHER_STATIONS) {
      const entity = this.entitiesById.get(station.id);
      if (!entity?.label) continue;
      const place = station.tier === 'state' && this.viewer?.camera?.positionCartographic?.height < 900_000
        ? `${station.name}, ${station.state}`
        : station.name;
      entity.label.text = `${place} · ${this._metricValue(entity.weatherObservation)}`;
    }
  },

  getStats() {
    return { ...this.stats, error: this.lastError || null };
  },

  getWeatherRecords() {
    return WEATHER_STATIONS.flatMap((station) => {
      const observation = this.entitiesById?.get(station.id)?.weatherObservation;
      return observation ? [{ ...station, observation }] : [];
    });
  },

  destroy() {
    this.enabled = false;
    this._cameraListener?.();
    this._cameraListener = null;
    this._clickHandler?.destroy();
    this._clickHandler = null;
    window.removeEventListener('gev:weather-metric-changed', this._metricChangedListener);
    this._metricChangedListener = null;
    if (this.dataSource && this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.dataSources.remove(this.dataSource, true);
    }
    this.entitiesById?.clear();
    this.dataSource = null;
    this.viewer = null;
  },
};
