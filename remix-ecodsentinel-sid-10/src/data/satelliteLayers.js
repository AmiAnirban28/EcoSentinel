import { createSurfaceRasterLayer } from './surfaceRasterLayer.js';

export const landSurfaceTemperatureLayer = createSurfaceRasterLayer({
  id: 'nasa-modis-lst',
  name: 'Satellite land-surface temperature',
  icon: '🌡',
  source: 'NASA MODIS Terra LST · daily',
  layerId: 'MODIS_Terra_Land_Surface_Temp_Day',
  dateLagDays: 3,
  matrixSet: 'GoogleMapsCompatible_Level7',
  maximumLevel: 7,
});

export const satellitePrecipitationLayer = createSurfaceRasterLayer({
  id: 'nasa-gpm-precipitation',
  name: 'Satellite precipitation',
  icon: '🌧',
  source: 'NASA GPM IMERG · half-hourly',
  layerId: 'IMERG_Precipitation_Rate',
  dateLagDays: 1,
  matrixSet: 'GoogleMapsCompatible_Level6',
  maximumLevel: 6,
});

export const vegetationGreennessLayer = createSurfaceRasterLayer({
  id: 'nasa-modis-ndvi',
  name: 'Vegetation greenness (NDVI)',
  icon: '🌱',
  source: 'NASA Terra MODIS · NDVI 8-day',
  layerId: 'MODIS_Terra_NDVI_8Day',
  dateLagDays: 2,
  matrixSet: 'GoogleMapsCompatible_Level9',
  maximumLevel: 9,
});

export const globalSoilMoistureLayer = createSurfaceRasterLayer({
  id: 'nasa-smap-soil-moisture',
  name: 'Global soil moisture · drought context',
  icon: '💧',
  source: 'NASA SMAP L4 · soil-moisture context, not a drought index',
  layerId: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
  dateLagDays: 7,
  matrixSet: 'GoogleMapsCompatible_Level6',
  maximumLevel: 6,
});

export default [
  landSurfaceTemperatureLayer,
  satellitePrecipitationLayer,
  vegetationGreennessLayer,
  globalSoilMoistureLayer,
];
