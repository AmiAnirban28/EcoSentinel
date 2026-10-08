/**
 * GOD'S EYE VIEW — THEMATIC MAPS ENGINE
 * Provides rich thematic mapping across four core domains:
 * 1. Extreme Weather & Hazard Maps (Heatwave/Thermal, Storm/Cyclone, Drought Monitor)
 * 2. Meteorological (Daily Weather) Maps (Surface Analysis, Temperature, Precipitation/Radar, Wind)
 * 3. Climatic Maps (Long-Term Trends) (Climate Zones, Isohyetal Rainfall, Climate Projections)
 * 4. Ecological & Physical Environment Maps (LULC, Topographic & Elevation)
 *
 * Renders spatial polygons, synoptic isobars, dynamic storm cones, vector winds,
 * and high-resolution localized telemetry across India and the World that
 * dynamically reveals granular parameters as the camera zooms in.
 */

import * as Cesium from 'cesium';
import { WEATHER_STATIONS } from './data/weatherStationCatalog.mjs';
import { governorRequestRender } from './renderGovernor.js';

// Global and India Stations with localized parameters across all thematic domains
export const THEMATIC_LOCATIONS = [
  // ── INDIA REGIONS & STATIONS ──
  {
    id: 'india-delhi',
    name: 'New Delhi / NCR',
    region: 'Northern India',
    country: 'India',
    lat: 28.6139,
    lon: 77.2090,
    elevation: 216, // meters AMSL
    telemetry: {
      heatwave: {
        temp: 43.8, // °C
        heatIndex: 49.2, // °C
        uhiDelta: '+5.2°C',
        wetBulb: 31.2, // °C
        alert: 'CRITICAL / RED ALERT',
        description: 'Severe urban heat island effect over concrete dense urban core; extreme thermal radiance from asphalt and built surfaces.',
      },
      cyclone: {
        windSpeed: 22, // km/h
        gustSpeed: 35,
        heading: 'NW',
        pressure: 1006.4, // hPa
        threatLevel: 'Low (Inland Continental)',
        description: 'Dry northwesterly continental airflow with local gust fronts.',
      },
      drought: {
        spei: -1.2,
        category: 'D1 - Moderate Drought',
        soilMoisture: 14.5, // %
        deficit: '-18 mm',
        groundwaterTrend: '-0.85 m/yr',
        description: 'Depleted shallow aquifer with high evaporative transpiration demand.',
      },
      surface: {
        pressure: 1006.4,
        tendency: '-1.2 hPa / 3hr',
        airMass: 'Continental Tropical (cT)',
        frontProximity: 'Dryline 120km East',
        isobar: '1006 hPa',
      },
      temp: {
        surfaceTemp: 43.8,
        feelsLike: 49.2,
        diurnalRange: '16.4°C',
        isothermBand: '40°C - 45°C',
      },
      precipitation: {
        rate: 0.0, // mm/h
        reflectivity: 12, // dBZ
        accumToday: 0.0,
        radarStatus: 'IMD Palam Doppler: Clear Echoes',
      },
      wind: {
        speedKnots: 12,
        speedKmh: 22,
        directionDeg: 315,
        cardinal: 'NW',
        vector: 'Streamline inland continental',
      },
      climate_zones: {
        koppen: 'BSh (Hot Semi-Arid Steppe)',
        biome: 'Subtropical Semi-Arid Scrub & Urbanized Gangetic Plain',
        decadalTrend: '+0.38°C / decade',
      },
      isohyetal: {
        annualRainfall: 714, // mm/yr
        monsoonShare: '84%',
        isohyetBand: '600 - 800 mm/yr',
      },
      climate_change: {
        temp2050: '+2.8°C Anomaly',
        heatwaveDaysIncrease: '+24 days/yr',
        coolingDegreeDays: '+38%',
      },
      lulc: {
        class: 'Urban Built-up / Impervious Core',
        coverPercent: '86% Built, 14% Canopy/Water',
        esaCode: 50,
      },
      elevation: {
        altitudeM: 216,
        terrain: 'Alluvial Plain (Yamuna River Basin)',
        contourInterval: '20m',
      },
    },
  },
  {
    id: 'india-churu',
    name: 'Churu / Thar Desert',
    region: 'Rajasthan',
    country: 'India',
    lat: 28.2900,
    lon: 74.9600,
    elevation: 286,
    telemetry: {
      heatwave: {
        temp: 48.6,
        heatIndex: 52.1,
        uhiDelta: '+1.1°C',
        wetBulb: 28.4,
        alert: 'MAXIMUM EXTREME / RED ALERT',
        description: 'Extreme desert heat dome; ground skin surface temperature exceeding 58.4°C with intense solar irradiance.',
      },
      cyclone: {
        windSpeed: 28,
        gustSpeed: 44,
        heading: 'WNW',
        pressure: 998.8,
        threatLevel: 'Low (Inland Arid)',
        description: 'Thermal low trough with convective dust devils and sand plumes.',
      },
      drought: {
        spei: -2.7,
        category: 'D4 - Exceptional Drought',
        soilMoisture: 6.2,
        deficit: '-64 mm',
        groundwaterTrend: '-2.4 m/yr',
        description: 'Critical soil moisture deficit with desiccated vegetation and severe livestock water stress.',
      },
      surface: {
        pressure: 998.8,
        tendency: '-0.8 hPa / 3hr',
        airMass: 'Continental Tropical Desert (cT)',
        frontProximity: 'Monsoon Heat Trough',
        isobar: '1000 hPa',
      },
      temp: {
        surfaceTemp: 48.6,
        feelsLike: 52.1,
        diurnalRange: '19.8°C',
        isothermBand: '> 45°C Extreme',
      },
      precipitation: {
        rate: 0.0,
        reflectivity: 5,
        accumToday: 0.0,
        radarStatus: 'Zero radar reflectivity',
      },
      wind: {
        speedKnots: 15,
        speedKmh: 28,
        directionDeg: 290,
        cardinal: 'WNW',
        vector: 'Loo wind vector',
      },
      climate_zones: {
        koppen: 'BWh (Hot Desert Climate)',
        biome: 'Thar Desert / Sandy Erg & Xeric Shrubland',
        decadalTrend: '+0.45°C / decade',
      },
      isohyetal: {
        annualRainfall: 325,
        monsoonShare: '88%',
        isohyetBand: '200 - 400 mm/yr',
      },
      climate_change: {
        temp2050: '+3.4°C Anomaly',
        heatwaveDaysIncrease: '+32 days/yr',
        desertificationFront: '+4.5 km/decade southward',
      },
      lulc: {
        class: 'Bare Sand Dune / Sparse Desert Scrub',
        coverPercent: '78% Bare Soil, 22% Xeric Grass',
        esaCode: 60,
      },
      elevation: {
        altitudeM: 286,
        terrain: 'Inter-dunal Sandy Desert Basin',
        contourInterval: '25m',
      },
    },
  },
  {
    id: 'india-bay-of-bengal',
    name: 'Bay of Bengal Cyclone Corridor',
    region: 'Maritime Bay of Bengal',
    country: 'India / Regional Waters',
    lat: 18.2000,
    lon: 89.5000,
    elevation: 0,
    telemetry: {
      heatwave: {
        temp: 31.8,
        heatIndex: 39.4,
        uhiDelta: '0.0°C (Marine)',
        wetBulb: 29.8,
        alert: 'TROPICAL STORM VIGIL',
        description: 'Tropical cyclone feeding on high sea surface temperatures (SST 31.5°C) and abundant moisture flux.',
      },
      cyclone: {
        windSpeed: 215, // km/h
        gustSpeed: 250,
        heading: 'NNE',
        pressure: 952.0, // hPa
        threatLevel: 'CATEGORY 4 / VERY SEVERE CYCLONIC STORM',
        eyeCoordinates: '18.2°N, 89.5°E',
        stormSurge: '3.8 meters above astronomical tide',
        trackProjection: 'Coastal landfall between Odisha and Sundarbans within 36 hours',
        description: 'Symmetric eyewall structure with intense deep convective bands and category 4 sustained hurricane winds.',
      },
      drought: {
        spei: 2.4,
        category: 'Extremely Wet / Monsoon Flooding',
        soilMoisture: 100,
        deficit: 'Surplus (+220 mm)',
        groundwaterTrend: 'Recharge / High',
        description: 'Massive precipitation swath with storm surge coastal inundation risks.',
      },
      surface: {
        pressure: 952.0,
        tendency: '-14.6 hPa / 3hr (Rapid Deepening)',
        airMass: 'Maritime Tropical (mT)',
        frontProximity: 'Cyclonic Spiral Bands',
        isobar: '960 hPa / 972 hPa Concentric',
      },
      temp: {
        surfaceTemp: 31.8,
        feelsLike: 39.4,
        diurnalRange: '2.5°C (Oceanic)',
        isothermBand: '30°C - 32°C SST',
      },
      precipitation: {
        rate: 68.5, // mm/h torrential
        reflectivity: 56, // dBZ heavy storm core
        accumToday: 240.0,
        radarStatus: 'Severe Cyclonic Eyewall Vortex',
      },
      wind: {
        speedKnots: 116,
        speedKmh: 215,
        directionDeg: 195,
        cardinal: 'SSW',
        vector: 'Cyclonic Counterclockwise Inflow Vortex',
      },
      climate_zones: {
        koppen: 'Af (Tropical Marine Monsoon)',
        biome: 'Northern Indian Ocean Tropical Marine',
        decadalTrend: '+0.28°C SST / decade',
      },
      isohyetal: {
        annualRainfall: 2850,
        monsoonShare: '75%',
        isohyetBand: '> 2500 mm/yr',
      },
      climate_change: {
        temp2050: '+1.9°C SST Anomaly',
        cycloneIntensityDelta: '+12% Cat 4/5 frequency',
        seaLevelRiseProjection: '+0.88m Coastal Inundation',
      },
      lulc: {
        class: 'Open Marine / Continental Shelf Waters',
        coverPercent: '100% Water Body',
        esaCode: 80,
      },
      elevation: {
        altitudeM: 0,
        terrain: 'Deep Oceanic Trench / Bay Shelf',
        contourInterval: 'Bathymetric 100m',
      },
    },
  },
  {
    id: 'india-mumbai',
    name: 'Mumbai / Konkan Coast',
    region: 'Maharashtra',
    country: 'India',
    lat: 18.9220,
    lon: 72.8347,
    elevation: 8,
    telemetry: {
      heatwave: {
        temp: 34.2,
        heatIndex: 45.6,
        uhiDelta: '+3.9°C',
        wetBulb: 30.8,
        alert: 'HIGH HUMIDITY HEAT WARNING',
        description: 'High relative humidity (84%) creates dangerous apparent temperature and heat stress along the coastal peninsula.',
      },
      cyclone: {
        windSpeed: 48,
        gustSpeed: 68,
        heading: 'WSW',
        pressure: 1002.5,
        threatLevel: 'Moderate (Monsoon Surge)',
        description: 'Strong westerly Arabian Sea monsoon surge driving heavy sea swell and coastal tides.',
      },
      drought: {
        spei: 1.1,
        category: 'Normal / Saturated',
        soilMoisture: 88,
        deficit: 'Surplus',
        groundwaterTrend: 'Stable',
        description: 'Monsoon saturation across coastal floodplains and urban catchment basins.',
      },
      surface: {
        pressure: 1002.5,
        tendency: '-0.4 hPa / 3hr',
        airMass: 'Maritime Tropical (mT)',
        frontProximity: 'Offshore Trough Line',
        isobar: '1004 hPa',
      },
      temp: {
        surfaceTemp: 34.2,
        feelsLike: 45.6,
        diurnalRange: '6.8°C',
        isothermBand: '32°C - 35°C Coastal',
      },
      precipitation: {
        rate: 32.4, // mm/h
        reflectivity: 48, // dBZ
        accumToday: 86.0,
        radarStatus: 'IMD Veravali Doppler: Active Monsoon Band',
      },
      wind: {
        speedKnots: 26,
        speedKmh: 48,
        directionDeg: 245,
        cardinal: 'WSW',
        vector: 'Southwest Monsoon Sea Flow',
      },
      climate_zones: {
        koppen: 'Am (Tropical Monsoon Climate)',
        biome: 'Coastal Plain & Deciduous Moist Forest Ecoregion',
        decadalTrend: '+0.25°C / decade',
      },
      isohyetal: {
        annualRainfall: 2420,
        monsoonShare: '95%',
        isohyetBand: '2200 - 2600 mm/yr',
      },
      climate_change: {
        temp2050: '+2.1°C Anomaly',
        seaLevelRiseRisk: '+1.15m Inundation Vulnerability (2050 RCP 8.5)',
        floodFrequency: '+45% high-tide urban waterlogging events',
      },
      lulc: {
        class: 'Dense Coastal Urban / Mangrove Creek Estuary',
        coverPercent: '72% Built-up, 18% Mangrove/Mudflat, 10% Water',
        esaCode: 50,
      },
      elevation: {
        altitudeM: 8,
        terrain: 'Low-lying Peninsular Island & Estuary',
        contourInterval: '5m',
      },
    },
  },
  {
    id: 'india-agumbe',
    name: 'Agumbe / Western Ghats',
    region: 'Karnataka',
    country: 'India',
    lat: 13.5040,
    lon: 75.0930,
    elevation: 643,
    telemetry: {
      heatwave: {
        temp: 26.4,
        heatIndex: 28.2,
        uhiDelta: '0.0°C (Natural Biosphere)',
        wetBulb: 25.1,
        alert: 'NORMAL / TEMPERATE BIOSPHERE',
        description: 'Dense rainforest canopy provides high evapotranspiration cooling and mist buffering.',
      },
      cyclone: {
        windSpeed: 38,
        gustSpeed: 62,
        heading: 'SW',
        pressure: 1004.2,
        threatLevel: 'Moderate (Orographic Uplift)',
        description: 'Orographic lift of monsoon moisture creating dense stratus cloud decks and steady high winds.',
      },
      drought: {
        spei: 2.8,
        category: 'Hyper-Humid / No Drought',
        soilMoisture: 98,
        deficit: 'Extreme Surplus',
        groundwaterTrend: 'Perennial Springs Active',
        description: 'Continuous perennial streamflow feeding major peninsular river headwaters.',
      },
      surface: {
        pressure: 948.0, // Station level (elevated)
        tendency: '0.0 hPa',
        airMass: 'Maritime Tropical Orographic',
        frontProximity: 'Western Ghats Orographic Escarpment',
        isobar: '1008 hPa (MSLP)',
      },
      temp: {
        surfaceTemp: 26.4,
        feelsLike: 28.2,
        diurnalRange: '5.2°C',
        isothermBand: '25°C - 28°C Rainforest',
      },
      precipitation: {
        rate: 45.0, // mm/h
        reflectivity: 52, // dBZ
        accumToday: 185.0,
        radarStatus: 'Orographic Monsoon Cloud Deck',
      },
      wind: {
        speedKnots: 20,
        speedKmh: 38,
        directionDeg: 220,
        cardinal: 'SW',
        vector: 'Orographic ridge wind',
      },
      climate_zones: {
        koppen: 'Af / Am (Tropical Rainforest / Monsoon)',
        biome: 'Western Ghats Montane Evergreen Rainforests',
        decadalTrend: '+0.18°C / decade',
      },
      isohyetal: {
        annualRainfall: 4120, // mm/yr ("Cherrapunji of the South")
        monsoonShare: '92%',
        isohyetBand: '> 3500 mm/yr Extreme Isohyet',
      },
      climate_change: {
        temp2050: '+1.7°C Anomaly',
        precipitationVolatility: '+18% extreme rainfall spell variance',
        biodiversityStress: 'Endemic amphibian thermal shift',
      },
      lulc: {
        class: 'Dense Evergreen Broadleaf Rainforest',
        coverPercent: '94% Forest Canopy, 4% Riparian, 2% Plantation',
        esaCode: 10,
      },
      elevation: {
        altitudeM: 643,
        terrain: 'Western Ghats Escarpment Ridge',
        contourInterval: '50m',
      },
    },
  },
  {
    id: 'india-sundarbans',
    name: 'Sundarbans Delta',
    region: 'West Bengal',
    country: 'India',
    lat: 21.9497,
    lon: 88.9000,
    elevation: 3,
    telemetry: {
      heatwave: {
        temp: 33.4,
        heatIndex: 44.1,
        uhiDelta: '0.0°C (Tidal Wetland)',
        wetBulb: 30.5,
        alert: 'TIDAL SURGE & HEAT HAZARD',
        description: 'Estuarine delta with high ambient humidity and low thermal radiation buffering.',
      },
      cyclone: {
        windSpeed: 75,
        gustSpeed: 110,
        heading: 'SSE',
        pressure: 988.0,
        threatLevel: 'HIGH (Coastal Surge Vulnerability)',
        description: 'Vulnerable tidal mudflats with embankment breach risks during cyclone surges.',
      },
      drought: {
        spei: 0.8,
        category: 'Normal / Saline Wetland',
        soilMoisture: 95,
        deficit: 'Surplus',
        groundwaterTrend: 'Saline intrusion zone',
        description: 'High tidal brackish water table with salinization risks to freshwater lenses.',
      },
      surface: {
        pressure: 988.0,
        tendency: '-2.8 hPa / 3hr',
        airMass: 'Maritime Tropical Delta',
        frontProximity: 'Intertropical Convergence Delta',
        isobar: '992 hPa',
      },
      temp: {
        surfaceTemp: 33.4,
        feelsLike: 44.1,
        diurnalRange: '7.1°C',
        isothermBand: '32°C - 35°C Delta',
      },
      precipitation: {
        rate: 18.2,
        reflectivity: 40,
        accumToday: 62.0,
        radarStatus: 'Coastal Radar: Saturated Convective Cells',
      },
      wind: {
        speedKnots: 40,
        speedKmh: 75,
        directionDeg: 165,
        cardinal: 'SSE',
        vector: 'Marine tidal gale',
      },
      climate_zones: {
        koppen: 'Aw (Tropical Wet & Dry / Delta)',
        biome: 'Sundarbans Freshwater Swamp & Mangrove Ecoregion',
        decadalTrend: '+0.22°C / decade',
      },
      isohyetal: {
        annualRainfall: 1920,
        monsoonShare: '82%',
        isohyetBand: '1800 - 2200 mm/yr',
      },
      climate_change: {
        temp2050: '+2.3°C Anomaly',
        seaLevelRiseRisk: '+1.40m Relative Sea Level Rise (Subsidence + Eustatic)',
        mangroveErosion: '-18.5 km² shoreline recession projected by 2050',
      },
      lulc: {
        class: 'Mangrove Forest & Tidal Intertidal Wetland',
        coverPercent: '68% Mangrove, 28% Tidal Channels, 4% Mudflat',
        esaCode: 90,
      },
      elevation: {
        altitudeM: 3,
        terrain: 'Active Alluvial Delta / Intertidal Mudflat',
        contourInterval: '2m',
      },
    },
  },
  {
    id: 'india-himalayas',
    name: 'Kanchenjunga / Himalayas',
    region: 'Sikkim / North Eastern Range',
    country: 'India',
    lat: 27.7025,
    lon: 88.1475,
    elevation: 8586,
    telemetry: {
      heatwave: {
        temp: -18.5,
        heatIndex: -26.2,
        uhiDelta: '0.0°C (Cryosphere)',
        wetBulb: -20.4,
        alert: 'EXTREME HYPOTHERMIA / BLIZZARD',
        description: 'High-altitude sub-zero cryosphere; intense solar UV with thin atmosphere.',
      },
      cyclone: {
        windSpeed: 110,
        gustSpeed: 160,
        heading: 'W',
        pressure: 345.0, // Alpine barometric
        threatLevel: 'Severe Jet Stream Gale',
        description: 'Subtropical westerly jet stream impingement over 8000m summits.',
      },
      drought: {
        spei: 0.0,
        category: 'Perpetual Snow & Glacial Ice',
        soilMoisture: 0,
        deficit: 'Frozen Storage',
        groundwaterTrend: 'Glacial meltwater source',
        description: 'Water stored as perennial ice and firn snow; key source for Teesta and Brahmaputra basins.',
      },
      surface: {
        pressure: 345.0,
        tendency: '-0.2 hPa / 3hr',
        airMass: 'High Alpine Tropospheric',
        frontProximity: 'Upper Jet Stream Boundary',
        isobar: '350 hPa Upper Air',
      },
      temp: {
        surfaceTemp: -18.5,
        feelsLike: -26.2,
        diurnalRange: '14.0°C',
        isothermBand: '< -15°C Cryosphere',
      },
      precipitation: {
        rate: 4.2, // Snow equivalent
        reflectivity: 24,
        accumToday: 18.0, // cm snow
        radarStatus: 'High Altitude Snow Plume',
      },
      wind: {
        speedKnots: 60,
        speedKmh: 110,
        directionDeg: 270,
        cardinal: 'W',
        vector: 'Tropospheric Jet Stream Vector',
      },
      climate_zones: {
        koppen: 'ET / EF (Polar Tundra / Ice Cap)',
        biome: 'Eastern Himalayan Alpine Shrub and Meadows / Cryosphere',
        decadalTrend: '+0.52°C / decade (Elevation-Dependent Warming)',
      },
      isohyetal: {
        annualRainfall: 1450, // Snow water equivalent
        monsoonShare: '65%',
        isohyetBand: 'Glacial accumulation zone',
      },
      climate_change: {
        temp2050: '+3.8°C Anomaly (Elevation-Dependent)',
        glacierRetreat: '-26% glacial ice volume projected by 2050',
        glofRisk: 'Glacial Lake Outburst Flood Warning: South Lhonak Lake',
      },
      lulc: {
        class: 'Permanent Glaciers / Snow & Bare Alpine Rock',
        coverPercent: '82% Snow/Ice, 18% Scree/Moraine',
        esaCode: 70,
      },
      elevation: {
        altitudeM: 8586,
        terrain: 'Glaciated Horn & High Himalayan Massif',
        contourInterval: '250m',
      },
    },
  },

  // ── WORLDWIDE BENCHMARK STATIONS ──
  {
    id: 'world-death-valley',
    name: 'Death Valley (Furnace Creek)',
    region: 'California',
    country: 'USA',
    lat: 36.4622,
    lon: -116.8672,
    elevation: -58, // Below sea level
    telemetry: {
      heatwave: {
        temp: 52.4,
        heatIndex: 54.8,
        uhiDelta: '0.0°C (Desert Grabens)',
        wetBulb: 27.2,
        alert: 'GLOBAL RECORD EXTREME HEAT',
        description: 'Deep below-sea-level graben with trapped superheated descending air; skin temperatures reach 81°C.',
      },
      cyclone: {
        windSpeed: 24,
        gustSpeed: 42,
        heading: 'S',
        pressure: 1012.0,
        threatLevel: 'Low',
        description: 'Dry thermal basin convective winds.',
      },
      drought: {
        spei: -3.2,
        category: 'D4 - Exceptional Drought',
        soilMoisture: 3.1,
        deficit: '-92 mm',
        groundwaterTrend: 'Depleted',
        description: 'Hyper-arid desert basin with virtually zero soil moisture capacity.',
      },
      surface: {
        pressure: 1018.0,
        tendency: '-0.3 hPa',
        airMass: 'Continental Tropical Desert (cT)',
        frontProximity: 'None',
        isobar: '1016 hPa',
      },
      temp: {
        surfaceTemp: 52.4,
        feelsLike: 54.8,
        diurnalRange: '21.2°C',
        isothermBand: '> 50°C Record Tier',
      },
      precipitation: {
        rate: 0.0,
        reflectivity: 0,
        accumToday: 0.0,
        radarStatus: 'Zero Echoes',
      },
      wind: {
        speedKnots: 13,
        speedKmh: 24,
        directionDeg: 180,
        cardinal: 'S',
        vector: 'Thermal valley updraft',
      },
      climate_zones: {
        koppen: 'BWh (Hot Desert Climate)',
        biome: 'Mojave Desert Shrubland',
        decadalTrend: '+0.48°C / decade',
      },
      isohyetal: {
        annualRainfall: 58,
        monsoonShare: '0%',
        isohyetBand: '< 100 mm/yr Hyper-Arid',
      },
      climate_change: {
        temp2050: '+3.6°C Anomaly',
        daysAbove50C: '+18 days/yr',
        biomeShift: 'Total loss of riparian springs',
      },
      lulc: {
        class: 'Bare Desert Salt Flat & Alluvial Fan',
        coverPercent: '95% Bare Rock/Salt, 5% Sparse Shrub',
        esaCode: 60,
      },
      elevation: {
        altitudeM: -58,
        terrain: 'Fault-Bounded Depressed Graben',
        contourInterval: '50m',
      },
    },
  },
  {
    id: 'world-atlantic-hurricane',
    name: 'Atlantic Hurricane Corridor (Miami Straits)',
    region: 'Florida Straits',
    country: 'USA / International Waters',
    lat: 25.1000,
    lon: -80.2000,
    elevation: 0,
    telemetry: {
      heatwave: {
        temp: 32.2,
        heatIndex: 42.0,
        uhiDelta: '+2.4°C (Coastal Metro)',
        wetBulb: 29.6,
        alert: 'TROPICAL STORM VIGIL',
        description: 'Warm Gulf Stream loop current (SST 31.0°C) driving high atmospheric moisture loading.',
      },
      cyclone: {
        windSpeed: 235,
        gustSpeed: 275,
        heading: 'NW',
        pressure: 938.0,
        threatLevel: 'CATEGORY 4 MAJOR HURRICANE',
        eyeCoordinates: '25.1°N, 80.2°W',
        stormSurge: '4.2 meters above MHHW',
        trackProjection: 'Approaching South Florida coastline; mandatory evacuation zone',
        description: 'Contracting pinhole eyewall with catastrophic sustained winds and extensive storm surge envelope.',
      },
      drought: {
        spei: 2.1,
        category: 'Excessive Moisture / Flooding',
        soilMoisture: 100,
        deficit: 'Surplus',
        groundwaterTrend: 'High Water Table',
        description: 'Coastal aquifer saturation with King Tide sunny-day flooding compounding.',
      },
      surface: {
        pressure: 938.0,
        tendency: '-18.2 hPa / 3hr',
        airMass: 'Maritime Tropical Hurricane Core',
        frontProximity: 'Outer Feeder Bands',
        isobar: '940 hPa Inner Core',
      },
      temp: {
        surfaceTemp: 32.2,
        feelsLike: 42.0,
        diurnalRange: '3.4°C',
        isothermBand: '30°C - 33°C',
      },
      precipitation: {
        rate: 75.0,
        reflectivity: 58,
        accumToday: 210.0,
        radarStatus: 'NOAA Doppler KBYX: Eyewall Vortex Rotation',
      },
      wind: {
        speedKnots: 127,
        speedKmh: 235,
        directionDeg: 135,
        cardinal: 'SE',
        vector: 'Counterclockwise Hurricane Gale',
      },
      climate_zones: {
        koppen: 'Aw (Tropical Wet-and-Dry)',
        biome: 'Florida Coastal Mangroves & Everglades',
        decadalTrend: '+0.31°C / decade',
      },
      isohyetal: {
        annualRainfall: 1680,
        monsoonShare: '65%',
        isohyetBand: '1500 - 1800 mm/yr',
      },
      climate_change: {
        temp2050: '+2.4°C Anomaly',
        seaLevelRiseRisk: '+0.95m Inundation (2050 NOAA Intermediate-High)',
        infrastructureAtRisk: 'Over $45B coastal assets below +1.5m datum',
      },
      lulc: {
        class: 'Dense Urban Coastal Strip & Everglades Wetland',
        coverPercent: '64% Urban, 26% Wetland, 10% Bay Waters',
        esaCode: 50,
      },
      elevation: {
        altitudeM: 2,
        terrain: 'Low-Lying Limestone Coastal Plain',
        contourInterval: '1m',
      },
    },
  },
  {
    id: 'world-amazon-basin',
    name: 'Amazon Basin (Manaus)',
    region: 'Amazonas',
    country: 'Brazil',
    lat: -3.1190,
    lon: -60.0217,
    elevation: 92,
    telemetry: {
      heatwave: {
        temp: 34.8,
        heatIndex: 43.5,
        uhiDelta: '+2.8°C',
        wetBulb: 30.1,
        alert: 'HEAT & DROUGHT STRESS VIGIL',
        description: 'Unprecedented dry-season thermal stress; Negro River water levels at historical 120-year lows.',
      },
      cyclone: {
        windSpeed: 18,
        gustSpeed: 32,
        heading: 'ENE',
        pressure: 1010.4,
        threatLevel: 'Nil (Equatorial Doldrums)',
        description: 'Intertropical Convergence Zone convective squall line.',
      },
      drought: {
        spei: -2.6,
        category: 'D3 - Extreme Drought',
        soilMoisture: 38,
        deficit: '-110 mm',
        groundwaterTrend: '-3.2 m riverbed subsidence',
        description: 'Severe Amazon basin drought affecting fluvial transport and isolated indigenous communities.',
      },
      surface: {
        pressure: 1010.4,
        tendency: '-0.2 hPa',
        airMass: 'Equatorial Continental (cE)',
        frontProximity: 'ITCZ Fluvial Trough',
        isobar: '1012 hPa',
      },
      temp: {
        surfaceTemp: 34.8,
        feelsLike: 43.5,
        diurnalRange: '10.5°C',
        isothermBand: '33°C - 36°C Equatorial',
      },
      precipitation: {
        rate: 8.5,
        reflectivity: 32,
        accumToday: 14.0,
        radarStatus: 'Isolated Convective Raincells',
      },
      wind: {
        speedKnots: 10,
        speedKmh: 18,
        directionDeg: 75,
        cardinal: 'ENE',
        vector: 'Trade wind equatorial convergence',
      },
      climate_zones: {
        koppen: 'Af (Tropical Rainforest Climate)',
        biome: 'Amazon Lowland Moist Forest',
        decadalTrend: '+0.34°C / decade',
      },
      isohyetal: {
        annualRainfall: 2280,
        monsoonShare: '70%',
        isohyetBand: '2000 - 2500 mm/yr Isohyet',
      },
      climate_change: {
        temp2050: '+3.1°C Anomaly',
        savannizationRisk: 'High risk of irreversible tipping point to degraded savanna',
        carbonBalance: 'Shift from net carbon sink to net carbon source during drought years',
      },
      lulc: {
        class: 'Dense Broadleaf Tropical Rainforest',
        coverPercent: '88% Forest Canopy, 8% Urban/Fluvial, 4% Deforested',
        esaCode: 10,
      },
      elevation: {
        altitudeM: 92,
        terrain: 'Alluvial River Confluence Plain',
        contourInterval: '20m',
      },
    },
  },
  {
    id: 'world-sahara',
    name: 'Sahara / Sahel (Bilma)',
    region: 'Agadez',
    country: 'Niger',
    lat: 18.6853,
    lon: 12.9164,
    elevation: 357,
    telemetry: {
      heatwave: {
        temp: 47.5,
        heatIndex: 49.8,
        uhiDelta: '0.0°C',
        wetBulb: 22.4,
        alert: 'CRITICAL DESERT HEAT & DUST',
        description: 'Hyper-arid sand desert with Harmattan dust storms; relative humidity below 8%.',
      },
      cyclone: {
        windSpeed: 36,
        gustSpeed: 58,
        heading: 'NE',
        pressure: 1008.2,
        threatLevel: 'Nil (Dust Gale)',
        description: 'Harmattan wind lifting Saharan mineral dust plumes across the continent.',
      },
      drought: {
        spei: -3.4,
        category: 'D4 - Exceptional Drought',
        soilMoisture: 1.8,
        deficit: '-140 mm',
        groundwaterTrend: 'Fossil Aquifer Extraction Only',
        description: 'Complete absence of renewable moisture; desertification margin migrating southward.',
      },
      surface: {
        pressure: 1008.2,
        tendency: '+0.1 hPa',
        airMass: 'Continental Tropical Saharan (cT)',
        frontProximity: 'None',
        isobar: '1008 hPa',
      },
      temp: {
        surfaceTemp: 47.5,
        feelsLike: 49.8,
        diurnalRange: '24.5°C',
        isothermBand: '> 45°C Hyper-Arid',
      },
      precipitation: {
        rate: 0.0,
        reflectivity: 0,
        accumToday: 0.0,
        radarStatus: 'Clear Dry Atmosphere',
      },
      wind: {
        speedKnots: 19,
        speedKmh: 36,
        directionDeg: 45,
        cardinal: 'NE',
        vector: 'Harmattan Trade Wind Vector',
      },
      climate_zones: {
        koppen: 'BWh (Hyper-Arid Desert)',
        biome: 'Sahara Desert Hyper-Arid Erg',
        decadalTrend: '+0.42°C / decade',
      },
      isohyetal: {
        annualRainfall: 18,
        monsoonShare: '0%',
        isohyetBand: '< 50 mm/yr Hyper-Arid',
      },
      climate_change: {
        temp2050: '+3.5°C Anomaly',
        desertExpansion: '+14 km/decade southern Sahel encroachment',
        groundwaterDepletion: 'Irreversible fossil water table drawdown',
      },
      lulc: {
        class: 'Hyper-Arid Sand Dunes (Erg) & Hamada Rock',
        coverPercent: '99% Sand/Rock, 1% Oasis Palm',
        esaCode: 60,
      },
      elevation: {
        altitudeM: 357,
        terrain: 'Inter-Erg Oasis Depression',
        contourInterval: '50m',
      },
    },
  },
  {
    id: 'world-alps',
    name: 'European Alps (Mont Blanc)',
    region: 'Chamonix / Aosta',
    country: 'France / Italy',
    lat: 45.8326,
    lon: 6.8652,
    elevation: 4808,
    telemetry: {
      heatwave: {
        temp: 3.2,
        heatIndex: 3.2,
        uhiDelta: '0.0°C',
        wetBulb: 0.8,
        alert: 'GLACIAL THAW ANOMALY (+4.8°C above normal)',
        description: 'Zero-degree isotherm climbing to 5,100m; severe permafrost degradation and rockfall hazards on high alpine routes.',
      },
      cyclone: {
        windSpeed: 82,
        gustSpeed: 125,
        heading: 'WNW',
        pressure: 560.0,
        threatLevel: 'Alpine Gale Warning',
        description: 'Atlantic frontal depression crossing the Alpine barrier with ridge winds.',
      },
      drought: {
        spei: -1.8,
        category: 'D2 - Cryosphere Deficit',
        soilMoisture: 22,
        deficit: 'Early Snowpack Depletion',
        groundwaterTrend: 'Accelerated runoff',
        description: 'Loss of winter snowpack volume leading to late-summer low river flow in Rhine and Rhone.',
      },
      surface: {
        pressure: 560.0,
        tendency: '-3.4 hPa / 3hr',
        airMass: 'Maritime Polar Orographic (mP)',
        frontProximity: 'Atlantic Cold Front 80km West',
        isobar: '1014 hPa (MSLP)',
      },
      temp: {
        surfaceTemp: 3.2,
        feelsLike: -4.5,
        diurnalRange: '11.2°C',
        isothermBand: '0°C - 5°C Glacial Thaw',
      },
      precipitation: {
        rate: 6.4,
        reflectivity: 28,
        accumToday: 22.0,
        radarStatus: 'Orographic Precipitation Cloud',
      },
      wind: {
        speedKnots: 44,
        speedKmh: 82,
        directionDeg: 295,
        cardinal: 'WNW',
        vector: 'Alpine Foehn / Ridge Flow',
      },
      climate_zones: {
        koppen: 'ET (Alpine Tundra / Glacial Cryosphere)',
        biome: 'Alps Montane and Subalpine Coniferous & Meadow',
        decadalTrend: '+0.55°C / decade (2x global rate)',
      },
      isohyetal: {
        annualRainfall: 1850,
        monsoonShare: '0%',
        isohyetBand: '1600 - 2000 mm/yr (Snow & Rain)',
      },
      climate_change: {
        temp2050: '+3.9°C Alpine Anomaly',
        glacierLoss: '-80% of small European Alpine glaciers lost by 2050',
        permafrostCollapse: 'Elevated rock avalanche danger across summits > 3,000m',
      },
      lulc: {
        class: 'Permanent Glacier, Alpine Scree & Moraine',
        coverPercent: '72% Ice/Glacier, 24% Exposed Bedrock, 4% Alpine Moss',
        esaCode: 70,
      },
      elevation: {
        altitudeM: 4808,
        terrain: 'Granite Massif & Glacial Cirque',
        contourInterval: '100m',
      },
    },
  },
];

// Thematic Category Definitions
export const THEMATIC_CATEGORIES = [
  {
    id: 'hazards',
    name: 'Extreme Weather & Hazards',
    shortName: 'Hazards',
    icon: 'warning',
    description: 'Short-term environmental anomalies impacting public safety, thermal risks, tropical cyclones, and severe water scarcity.',
    layers: [
      {
        id: 'heatwave',
        name: 'Heatwave & Thermal Risk',
        tag: 'THERMAL',
        color: '#ff3344',
        metric: 'Surface Temp & UHI (°C)',
        description: 'Spatial thermal anomalies, urban heat island intensity, wet-bulb threshold exceedances, and regional heatwave alerts.',
        legend: [
          { label: '< 35°C (Warm)', color: '#ffd166' },
          { label: '35 - 40°C (Alert)', color: '#f77f00' },
          { label: '40 - 45°C (Severe)', color: '#d62828' },
          { label: '> 45°C (Extreme)', color: '#7209b7' },
        ],
      },
      {
        id: 'cyclone',
        name: 'Storm & Cyclone Tracking',
        tag: 'CYCLONE',
        color: '#00d4ff',
        metric: 'Wind Speed & Pressure (kt / hPa)',
        description: 'Forecast trajectories, category wind velocity cones, central low-pressure dips, and storm surge inundation projections.',
        legend: [
          { label: 'Cat 1 (64-82 kt)', color: '#00d4ff' },
          { label: 'Cat 2 (83-95 kt)', color: '#00b4d8' },
          { label: 'Cat 3 (96-112 kt)', color: '#ffd166' },
          { label: 'Cat 4 (113-136 kt)', color: '#f77f00' },
          { label: 'Cat 5 (>137 kt)', color: '#d62828' },
        ],
      },
      {
        id: 'drought',
        name: 'Drought Monitor (SPEI)',
        tag: 'DROUGHT',
        color: '#e76f51',
        metric: 'SPEI Deficit Index',
        description: 'Categorized soil moisture deficits, precipitation evapotranspiration indices (SPEI), and multi-tiered agricultural water stress.',
        legend: [
          { label: 'D0 Abnormally Dry', color: '#ffea79' },
          { label: 'D1 Moderate Drought', color: '#f9c74f' },
          { label: 'D2 Severe Drought', color: '#f8961e' },
          { label: 'D3 Extreme Drought', color: '#f3722c' },
          { label: 'D4 Exceptional', color: '#6a040f' },
        ],
      },
    ],
  },
  {
    id: 'meteo',
    name: 'Meteorological (Daily Weather)',
    shortName: 'Meteorological',
    icon: 'cloud',
    description: 'Synoptic atmospheric analysis, barometric pressure isobars, real-time isotherms, Doppler radar composites, and wind vectors.',
    layers: [
      {
        id: 'surface',
        name: 'Surface Analysis (Isobars & Fronts)',
        tag: 'ISOBARS',
        color: '#00f5d4',
        metric: 'Atmospheric Pressure (hPa)',
        description: 'Ground-level synoptic pressure systems, High (H) & Low (L) cells, cold fronts (blue), warm fronts (red), and pressure gradients.',
        legend: [
          { label: 'Low (< 1000 hPa)', color: '#f72585' },
          { label: '1004 - 1012 hPa', color: '#00f5d4' },
          { label: 'High (> 1016 hPa)', color: '#4cc9f0' },
          { label: 'Cold Front ──▲', color: '#0077b6' },
          { label: 'Warm Front ──●', color: '#e63946' },
        ],
      },
      {
        id: 'temp',
        name: 'Temperature & Isotherms',
        tag: 'TEMP',
        color: '#ff9e00',
        metric: 'Ambient Temp (°C)',
        description: 'Real-time ground and screen-level temperatures, regional isotherms connecting equal temperatures, and thermal comfort bands.',
        legend: [
          { label: '< 0°C (Freezing)', color: '#90e0ef' },
          { label: '0 - 15°C (Cool)', color: '#00b4d8' },
          { label: '16 - 30°C (Mild)', color: '#52b788' },
          { label: '31 - 42°C (Hot)', color: '#ffb703' },
          { label: '> 42°C (Extreme)', color: '#d90429' },
        ],
      },
      {
        id: 'precipitation',
        name: 'Precipitation & Live Radar',
        tag: 'RADAR',
        color: '#06d6a0',
        metric: 'Rain Rate (mm/h) & dBZ',
        description: 'Live Doppler composite radar reflectivity tiles, animated precipitation cells, snowfall bands, and convective storm tracks.',
        legend: [
          { label: 'Light (1-5 mm/h)', color: '#80ed99' },
          { label: 'Moderate (5-15 mm/h)', color: '#38b000' },
          { label: 'Heavy (15-40 mm/h)', color: '#ffb703' },
          { label: 'Torrential (>40 mm/h)', color: '#d00000' },
          { label: 'Hail / Severe (>55 dBZ)', color: '#9d0208' },
        ],
      },
      {
        id: 'wind',
        name: 'Wind & Streamlines',
        tag: 'WIND',
        color: '#48cae4',
        metric: 'Velocity (km/h & knots)',
        description: 'Dynamic wind vectors, atmospheric flow streamlines, prevailing monsoon surges, and upper-level jet stream tracking.',
        legend: [
          { label: '< 15 km/h (Calm)', color: '#caf0f8' },
          { label: '15 - 35 km/h (Breeze)', color: '#90e0ef' },
          { label: '35 - 65 km/h (Strong)', color: '#0077b6' },
          { label: '> 65 km/h (Gale)', color: '#7209b7' },
        ],
      },
    ],
  },
  {
    id: 'climate',
    name: 'Climatic Maps (Long-Term Trends)',
    shortName: 'Climatic',
    icon: 'public',
    description: 'Multi-decadal baseline environmental climatologies (30-year norms), global Köppen biomes, isohyetal bands, and 2050 anomaly models.',
    layers: [
      {
        id: 'climate_zones',
        name: 'Köppen Climate Zones',
        tag: 'BIOMES',
        color: '#70e000',
        metric: 'Köppen-Geiger Class',
        description: 'Worldwide terrestrial biome classifications: Tropical (A), Arid (B), Temperate (C), Continental (D), and Polar/Alpine (E).',
        legend: [
          { label: 'Af/Am Tropical Rainforest', color: '#007f5f' },
          { label: 'Aw Tropical Savanna', color: '#55a630' },
          { label: 'BWh/BSh Arid / Desert', color: '#e9c46a' },
          { label: 'Cfa/Cfb Temperate', color: '#2a9d8f' },
          { label: 'ET/EF Alpine Tundra/Ice', color: '#a8dadc' },
        ],
      },
      {
        id: 'isohyetal',
        name: 'Isohyetal (Rainfall Distribution)',
        tag: 'ISOHYET',
        color: '#0077b6',
        metric: 'Mean Annual Rainfall (mm)',
        description: 'Long-term 30-year mean annual precipitation contours (isohyets), delineating monsoon belts from hyper-arid desert basins.',
        legend: [
          { label: '< 300 mm (Arid)', color: '#e76f51' },
          { label: '300 - 800 mm (Dry)', color: '#f4a261' },
          { label: '800 - 1500 mm (Sub-humid)', color: '#2a9d8f' },
          { label: '1500 - 2500 mm (Humid)', color: '#457b9d' },
          { label: '> 2500 mm (Monsoon Belt)', color: '#1d3557' },
        ],
      },
      {
        id: 'climate_change',
        name: 'Climate Change Projections (2050)',
        tag: 'PROJECTIONS',
        color: '#d62828',
        metric: 'Temp Anomaly & Sea Level (+m)',
        description: 'CMIP6 / IPCC SSP2-4.5 & SSP5-8.5 anomaly projections: expected temperature deltas, coastal inundation margins, and crop stress shifts.',
        legend: [
          { label: '+1.5°C to +2.0°C (Low)', color: '#fcbf49' },
          { label: '+2.0°C to +3.0°C (Medium)', color: '#f77f00' },
          { label: '> +3.0°C (High Anomaly)', color: '#d62828' },
          { label: 'Coastal Flood (+1m SLR)', color: '#00b4d8' },
        ],
      },
    ],
  },
  {
    id: 'ecological',
    name: 'Ecological & Physical Environment',
    shortName: 'Ecological',
    icon: 'forest',
    description: 'Terrestrial biosphere, Land Use & Land Cover (ESA WorldCover 10m), digital elevation models, mountain passes, and watershed basins.',
    layers: [
      {
        id: 'lulc',
        name: 'Land Use & Land Cover (LULC)',
        tag: 'LULC',
        color: '#2d6a4f',
        metric: 'ESA WorldCover Classification',
        description: 'High-resolution land cover taxonomy: dense tree canopy, shrubland, agricultural cropland, urban built-up, wetlands, and water.',
        legend: [
          { label: 'Tree Cover (Forest)', color: '#006400' },
          { label: 'Shrubland / Grassland', color: '#ffbb22' },
          { label: 'Cropland (Agriculture)', color: '#ffff4c' },
          { label: 'Built-up (Urban Impervious)', color: '#e60000' },
          { label: 'Wetlands / Mangroves', color: '#00ffff' },
          { label: 'Water Bodies', color: '#004da8' },
        ],
      },
      {
        id: 'elevation',
        name: 'Topographic & Elevation Contours',
        tag: 'TOPOGRAPHY',
        color: '#b08968',
        metric: 'Elevation (m AMSL)',
        description: '3D hypsometric relief and isarithm elevation contours showcasing mountain massifs, plateau scarps, river valleys, and coastal plains.',
        legend: [
          { label: '0 - 100m (Coastal/Delta)', color: '#a7c957' },
          { label: '100 - 500m (Lowland)', color: '#e9c46a' },
          { label: '500 - 1500m (Plateau/Hills)', color: '#e76f51' },
          { label: '1500 - 4000m (Mountain)', color: '#bc6c25' },
          { label: '> 4000m (High Massif/Snow)', color: '#edf2f4' },
        ],
      },
    ],
  },
];

const LIVE_THEMATIC_CATEGORIES = [
  {
    id: 'weather',
    shortName: 'Live Weather',
    layers: [{
      id: 'live-weather-stations',
      name: 'Live city observations',
      tag: 'OPEN-METEO',
      color: '#53e5ff',
      metric: 'Current temperature, humidity, rain and wind at city locations',
      source: 'Open-Meteo · public city forecast model data',
      description: 'Current conditions across major cities worldwide, with additional Indian state-city detail at closer zoom.',
      legend: [],
    }],
  },
  {
    id: 'satellite',
    shortName: 'Satellite',
    layers: [
      {
        id: 'nasa-modis-lst',
        name: 'Satellite land-surface temperature',
        tag: 'NASA MODIS',
        color: '#ff9e00',
        metric: 'Daily land-surface temperature imagery',
        source: 'NASA Terra MODIS · daily product',
        description: 'Satellite-measured surface temperature imagery. Cloud cover and acquisition gaps can leave areas blank.',
        legend: [],
      },
      {
        id: 'nasa-gpm-precipitation',
        name: 'Satellite precipitation',
        tag: 'NASA GPM',
        color: '#06d6a0',
        metric: 'Global precipitation rate imagery',
        source: 'NASA GPM IMERG · near-real-time product',
        description: 'Global precipitation-rate imagery from NASA GPM. It is satellite precipitation data, not a local rain gauge.',
        legend: [],
      },
      {
        id: 'nasa-modis-ndvi',
        name: 'Vegetation greenness (NDVI)',
        tag: 'NASA MODIS',
        color: '#70e000',
        metric: '8-day satellite vegetation-index composite',
        source: 'NASA Terra MODIS · NDVI 8-day',
        description: 'Satellite vegetation greenness context; not a crop-yield estimate or an official drought classification.',
        legend: [],
      },
    ],
  },
  {
    id: 'soil-water',
    shortName: 'Soil & Water',
    layers: [{
      id: 'nasa-smap-soil-moisture',
      name: 'Global soil-moisture context',
      tag: 'NASA SMAP',
      color: '#70e000',
      metric: 'Satellite soil-moisture retrieval',
      source: 'NASA SMAP L4 · root-zone soil-moisture context',
      description: 'Global soil moisture can help contextualize dry conditions; it is not an official drought index or drought classification.',
      legend: [],
    }],
  },
  {
    id: 'air-land',
    shortName: 'Air & Land',
    layers: [
      {
        id: 'aqi',
        name: 'Air quality stations',
        tag: 'CPCB · WAQI',
        color: '#ffb703',
        metric: 'Live AQI stations · India and global coverage',
        source: 'CPCB / WAQI Global',
        description: 'Live air-quality monitoring stations, with priority coverage across India.',
        legend: [],
      },
      {
        id: 'local-firms',
        name: 'Active fire detections',
        tag: 'NASA FIRMS',
        color: '#ff5b35',
        metric: 'Satellite fire detections · near real time',
        source: 'NASA FIRMS · VIIRS',
        description: 'Recent satellite fire detections. Requires a NASA FIRMS map key; thermal anomalies are not confirmed fire perimeters.',
        legend: [],
      },
    ],
  },
  {
    id: 'hazards',
    shortName: 'Hazards',
    layers: [{
      id: 'earthquakes',
      name: 'Recent earthquakes',
      tag: 'USGS',
      color: '#ff4d6d',
      metric: 'Global earthquakes · last 24 hours · M2.5+',
      source: 'U.S. Geological Survey',
      description: 'Recent global earthquake locations and magnitudes from the USGS.',
      legend: [],
    }],
  },
];

/**
 * Thematic Maps Controller
 * Manages active category, active layer, Cesium overlay entities,
 * tile imagery providers, camera altitude reactivity, and telemetry inspectors.
 */
export class ThematicMapsController {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.styleManager = options.styleManager || null;
    this.mapStackController = options.mapStackController || null;
    this.dataManager = options.dataManager || null;
    this._previousHeatmapStackId = null;
    this._heatmapCompatibleStackId = null;
    this._heatmapStackRequest = null;
    this._heatmapRestoreRequest = null;

    // State
    this.activeCategoryId = 'weather';
    this.activeLayerId = 'live-weather-stations';
    this.selectedLocationId = 'delhi';
    this._weatherObservations = new Map();
    this._selectedDataLayerIds = new Set();
    this._weatherMetric = 'temperature';
    this._dataManagerUnsubscribe = null;
    this.layerOpacity = 0.85;
    this.isLayerActive = true;
    this.currentZoomAltitude = 5000000; // meters AMSL
    this.zoomLevelName = 'GLOBAL VIEW';

    // Cesium Visual Elements
    this._dataSource = null;
    this._radarImageryLayer = null;
    this._topoImageryLayer = null;
    this._cameraListenerRemover = null;

    // DOM Elements Cache
    this._container = null;
    this._categoryTabsContainer = null;
    this._layerListContainer = null;
    this._legendContainer = null;
    this._inspectorContainer = null;
    this._owmContainer = null;
    this._meteoContainer = null;
    this._publicContainer = null;
    this._stormContainer = null;
    this._droughtContainer = null;

    this._stormDataSource = null;
    this._stormTracks = new Map();
    this._storms = [];
    this._stormsEnabled = false;
    this._stormRequest = null;
    this._droughtDataSource = null;
    this._droughtEnabled = false;
    this._droughtRequest = null;
    this._initDataSource();
    this._initStormDataSource();
    this._initDom();
    this._initCameraListener();
    this._renderLayer();
  }

  /**
   * Initializes the dedicated Cesium CustomDataSource for thematic layers.
   */
  _initDataSource() {
    if (!this.viewer || !Cesium) return;
    try {
      this._dataSource = new Cesium.CustomDataSource('thematic-maps-overlay');
      this.viewer.dataSources.add(this._dataSource);
    } catch (error) {
      console.warn('[ThematicMaps] Error creating custom data source:', error);
    }
  }

  /**
   * Initializes camera movement listener to track zoom altitude and update LOD.
   */
  _initCameraListener() {
    if (!this.viewer?.camera) return;

    const updateZoomMetrics = () => {
      const carto = this.viewer.camera.positionCartographic;
      if (!carto) return;
      this.currentZoomAltitude = carto.height;

      // Classify zoom tier
      if (this.currentZoomAltitude > 3500000) {
        this.zoomLevelName = 'GLOBAL VIEW';
      } else if (this.currentZoomAltitude > 400000) {
        this.zoomLevelName = 'REGIONAL VIEW';
      } else {
        this.zoomLevelName = 'LOCAL PARAMETER ZOOM';
      }

      this._updateZoomHud();
      this._updateEntityVisibilityForZoom();
    };

    this._cameraListenerRemover = this.viewer.camera.moveEnd.addEventListener(updateZoomMetrics);
    updateZoomMetrics();
  }

  /**
   * Updates Zoom HUD indicator inside the card.
   */
  _updateZoomHud() {
    const zoomEl = document.getElementById('thematic-zoom-indicator');
    if (!zoomEl) return;
    const km = Math.round(this.currentZoomAltitude / 1000);
    zoomEl.innerHTML = `
      <span class="thematic-zoom-pill ${this.currentZoomAltitude <= 400000 ? 'highlight' : ''}">
        ${this.zoomLevelName} (${km.toLocaleString()} km alt)
      </span>
    `;
  }

  /**
   * Adjusts label scale and billboard density based on camera altitude.
   */
  _updateEntityVisibilityForZoom() {
    if (!this._dataSource?.entities) return;
    const isCloseZoom = this.currentZoomAltitude <= 600000;
    const isMidZoom = this.currentZoomAltitude <= 3500000;

    const entities = this._dataSource.entities.values;
    for (const entity of entities) {
      if (entity.thematicRole === 'detailed-callout') {
        entity.show = isCloseZoom;
      } else if (entity.thematicRole === 'regional-marker') {
        entity.show = isMidZoom;
      } else if (entity.thematicRole === 'global-contour') {
        entity.show = true;
      }
    }
  }

  /**
   * Builds the DOM elements inside `#thematic-body`.
   */
  _initDom() {
    this._container = document.getElementById('thematic-body');
    if (!this._container) return;

    this._container.innerHTML = `
      <div class="thematic-header-bar">
        <div class="thematic-layer-state-toggle">
          <button id="thematic-master-toggle" class="thematic-master-btn active" title="Toggle Thematic Overlay">
            <span class="thematic-master-dot"></span>
            <span id="thematic-master-status">OVERLAY: ACTIVE</span>
          </button>
        </div>
        <div id="thematic-zoom-indicator" class="thematic-zoom-wrap">
          <span class="thematic-zoom-pill">GLOBAL VIEW</span>
        </div>
      </div>

      <div class="thematic-data-disclaimer">
        LIVE CITY OBSERVATIONS · NASA SATELLITE PRODUCTS · GLOBAL SOIL-MOISTURE CONTEXT
      </div>
      <div class="thematic-section-label">DATA TYPE</div>
      <div id="thematic-category-tabs" class="thematic-category-tabs" role="tablist"></div>

      <div class="thematic-section-label">AVAILABLE LAYERS</div>
      <div id="thematic-layer-list" class="thematic-layer-list"></div>
      <div id="thematic-weather-metrics" class="thematic-weather-metrics">
        <span class="thematic-section-label">WEATHER MAP VALUE</span>
        <div role="group" aria-label="Weather map value">
          <button type="button" class="thematic-metric-btn active" aria-pressed="true" data-weather-metric="temperature">TEMP</button>
          <button type="button" class="thematic-metric-btn" aria-pressed="false" data-weather-metric="humidity">HUMIDITY</button>
          <button type="button" class="thematic-metric-btn" aria-pressed="false" data-weather-metric="precipitation">RAIN</button>
          <button type="button" class="thematic-metric-btn" aria-pressed="false" data-weather-metric="wind">WIND</button>
        </div>
      </div>
      <div class="thematic-meteo-toolbar">
        <span id="thematic-layer-status">Select a layer to show its live data.</span>
        <button id="thematic-weather-refresh" type="button">REFRESH</button>
      </div>
      <div id="thematic-meteo-list" class="thematic-owm-list"></div>

      <div class="thematic-section-label thematic-owm-header">
        <span>OFFICIAL ACTIVE STORMS</span>
        <span id="thematic-storm-status" class="thematic-owm-status-pill">CHECKING</span>
      </div>
      <div class="thematic-meteo-toolbar">
        <span>NHC-monitored Atlantic &amp; East Pacific basins</span>
        <button id="thematic-storms-toggle" type="button" role="switch" aria-checked="false">SHOW STORMS</button>
        <button id="thematic-storms-refresh" type="button">REFRESH</button>
      </div>
      <div id="thematic-storm-list" class="thematic-owm-list"></div>

      <div class="thematic-section-label">CITY OBSERVATIONS</div>
      <div id="thematic-location-chips" class="thematic-location-chips"></div>
      <div id="thematic-inspector" class="thematic-inspector"></div>
    `;

    this._categoryTabsContainer = document.getElementById('thematic-category-tabs');
    this._layerListContainer = document.getElementById('thematic-layer-list');
    this._meteoContainer = document.getElementById('thematic-meteo-list');
    this._stormContainer = document.getElementById('thematic-storm-list');
    this._legendContainer = document.getElementById('thematic-legend-box');
    this._inspectorContainer = document.getElementById('thematic-inspector');

    this._bindEvents();
    this._dataManagerUnsubscribe = this.dataManager?.subscribe((change) => {
      if (['visibility', 'refresh', 'refresh-failed', 'refresh-cancelled', 'visibility-failed'].includes(change.type)) {
        if (change.type === 'visibility' && this.isLayerActive
          && LIVE_THEMATIC_CATEGORIES.some((category) => category.layers.some((layer) => layer.id === change.layerId))) {
          if (change.enabled) this._selectedDataLayerIds.add(change.layerId);
          else this._selectedDataLayerIds.delete(change.layerId);
        }
        this._renderLayers();
        this._renderLegend();
        this._renderInspector();
      }
    }) || null;
    this._renderCategories();
    this._renderLayers();
    this._refreshNHCStorms();
    this._renderLegend();
    this._renderLocations();
    this._renderInspector();
    this._syncWeatherObservations();
  }

  /**
   * Binds UI event listeners.
   */
  _bindEvents() {
    this._weatherUpdatedHandler = (event) => {
      this._applyWeatherRecords(event.detail?.records || [], event.detail?.fetchedAt || null);
    };
    window.addEventListener('gev:weather-stations-updated', this._weatherUpdatedHandler);
    this._weatherStationSelectedHandler = (event) => {
      const stationId = event.detail?.stationId;
      if (!WEATHER_STATIONS.some((station) => station.id === stationId)) return;
      this.selectedLocationId = stationId;
      this.activeCategoryId = 'weather';
      this.activeLayerId = 'live-weather-stations';
      this._renderCategories();
      this._renderLayers();
      this._updateLocationChipsActive();
      this._renderInspector();
      this._inspectorContainer?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    window.addEventListener('gev:weather-station-selected', this._weatherStationSelectedHandler);
    document.getElementById('thematic-weather-refresh')?.addEventListener('click', async () => {
      const status = document.getElementById('thematic-layer-status');
      try {
        if (!this.dataManager?.isEnabled('live-weather-stations')) {
          await this._setDataLayerEnabled('live-weather-stations', true);
          return;
        }
        if (status) status.textContent = 'Refreshing current weather…';
        const refreshed = await this.dataManager.refreshLayer('live-weather-stations');
        if (!refreshed) throw new Error('The live weather observations could not be refreshed.');
      } catch (error) {
        if (status) status.textContent = error?.message || 'Weather refresh failed.';
      }
    });
    document.getElementById('thematic-weather-metrics')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-weather-metric]');
      if (!button) return;
      this._weatherMetric = button.dataset.weatherMetric;
      for (const option of document.querySelectorAll('[data-weather-metric]')) {
        option.classList.toggle('active', option === button);
        option.setAttribute('aria-pressed', String(option === button));
      }
      window.dispatchEvent(new CustomEvent('gev:weather-metric-changed', {
        detail: { metric: this._weatherMetric },
      }));
      this._renderLayers();
      this._renderLegend();
      this._renderInspector();
    });
    document.getElementById('thematic-storms-toggle')?.addEventListener('click', () => {
      this._toggleNHCStorms();
    });
    document.getElementById('thematic-storms-refresh')?.addEventListener('click', () => {
      void this._refreshNHCStorms(true);
    });
    this._stormContainer?.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link) event.stopPropagation();
    });

    const masterToggle = document.getElementById('thematic-master-toggle');
    if (masterToggle) {
      masterToggle.addEventListener('click', async () => {
        this.isLayerActive = !this.isLayerActive;
        masterToggle.classList.toggle('active', this.isLayerActive);
        const statusEl = document.getElementById('thematic-master-status');
        if (statusEl) {
          statusEl.textContent = this.isLayerActive ? 'OVERLAY: ACTIVE' : 'OVERLAY: OFF';
        }

        if (this.isLayerActive) {
          for (const layerId of this._selectedDataLayerIds) {
            await this._setDataLayerEnabled(layerId, true);
          }
          if (this._stormsEnabled) {
            if (this._stormDataSource) this._stormDataSource.show = true;
            for (const source of this._stormTracks.values()) source.show = true;
          }
        } else {
          for (const layer of LIVE_THEMATIC_CATEGORIES.flatMap((category) => category.layers)) {
            if (this.dataManager?.isEnabled(layer.id)) this._selectedDataLayerIds.add(layer.id);
          }
          try {
            await Promise.all([...this._selectedDataLayerIds].map((layerId) => (
              this.dataManager.setEnabled(layerId, false, { origin: 'user' })
            )));
          } catch (error) {
            if (statusEl) statusEl.textContent = error?.message || 'Could not hide all thematic layers.';
          }
          if (this._stormDataSource) this._stormDataSource.show = false;
          for (const source of this._stormTracks.values()) source.show = false;
        }
      });
    }
  }

  _syncWeatherObservations() {
    const weatherLayer = this.dataManager?.layers?.get('live-weather-stations')?.module;
    if (typeof weatherLayer?.getWeatherRecords !== 'function') return;
    this._applyWeatherRecords(weatherLayer.getWeatherRecords(), weatherLayer.getStats()?.lastUpdate || null);
  }

  _applyWeatherRecords(records, fetchedAt) {
    this._weatherObservations = new Map(records.map((record) => [record.id, record]));
    this._weatherFetchedAt = fetchedAt;
    this._renderLayers();
    this._renderInspector();
    const status = document.getElementById('thematic-layer-status');
    if (status && this.dataManager?.isEnabled('live-weather-stations') && fetchedAt) {
      status.textContent = `Open-Meteo · updated ${new Date(fetchedAt).toLocaleTimeString()}`;
    }
  }

  /**
   * Renders the domain category tabs.
   */
  _renderCategories() {
    if (!this._categoryTabsContainer) return;
    this._categoryTabsContainer.innerHTML = '';

    LIVE_THEMATIC_CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = `thematic-cat-btn ${cat.id === this.activeCategoryId ? 'active' : ''}`;
      btn.dataset.categoryId = cat.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(cat.id === this.activeCategoryId));
      btn.innerHTML = `
        <span class="thematic-cat-text">${cat.shortName}</span>
      `;
      btn.addEventListener('click', () => {
        if (this.activeCategoryId === cat.id) return;
        this.activeCategoryId = cat.id;
        // Default to first layer in new category
        if (cat.layers.length > 0) {
          this.activeLayerId = cat.layers[0].id;
        }
        this._renderCategories();
        this._renderLayers();
        this._renderLegend();
        this._renderInspector();
        this._syncWeatherMetricVisibility();
      });
      this._categoryTabsContainer.appendChild(btn);
    });
    this._syncWeatherMetricVisibility();
  }

  /**
   * Renders layer selection buttons for the active category.
   */
  _renderLayers() {
    if (!this._layerListContainer) return;
    this._layerListContainer.innerHTML = '';

    const currentCat = LIVE_THEMATIC_CATEGORIES.find((c) => c.id === this.activeCategoryId);
    if (!currentCat) return;
    const managerLayers = new Map((this.dataManager?.getAll() || []).map((entry) => [entry.id, entry]));

    currentCat.layers.forEach((layer) => {
      const card = document.createElement('div');
      const isActive = this._selectedDataLayerIds.has(layer.id) || this.dataManager?.isEnabled(layer.id);
      const state = managerLayers.get(layer.id);
      const count = Number(state?.stats?.count || 0);
      const isImagery = layer.id.startsWith('nasa-');
      const countLabel = layer.id === 'live-weather-stations' || layer.id === 'aqi'
        ? 'locations'
        : layer.id === 'local-firms'
          ? 'detections'
          : 'events';
      const dataStatus = state?.stats?.error === 'KEY REQUIRED'
        ? 'NASA FIRMS key required · configure in API Keys'
        : isImagery
        ? isActive
          ? 'Satellite imagery overlay active'
          : 'Select to show satellite imagery'
        : state?.stats?.error
        ? state.stats.error
        : isActive
          ? count > 0
            ? `${count.toLocaleString()} ${countLabel} · ${state.stats.lastUpdate ? `updated ${new Date(state.stats.lastUpdate).toLocaleTimeString()}` : 'loading'}`
            : state?.stats?.loading
              ? 'Loading current data…'
              : 'Layer is on · waiting for data'
          : 'Select to show on globe';
      card.className = `thematic-layer-card ${isActive ? 'active' : ''}`;
      card.dataset.layerId = layer.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', String(Boolean(isActive)));
      card.innerHTML = `
        <div class="thematic-layer-card-top">
          <span class="thematic-layer-name">${layer.name}</span>
          <span class="thematic-layer-tag" style="border-color: ${layer.color}; color: ${layer.color};">${isActive ? 'ON' : layer.tag}</span>
        </div>
        <div class="thematic-layer-desc">${layer.description}</div>
        <div class="thematic-layer-status${state?.stats?.error ? ' error' : ''}"></div>
      `;
      card.querySelector('.thematic-layer-status').textContent = dataStatus;
      const toggleLayer = async () => {
        this.activeLayerId = layer.id;
        const enabled = this.dataManager?.isEnabled(layer.id) || this._selectedDataLayerIds.has(layer.id);
        await this._setDataLayerEnabled(layer.id, !enabled);
        this._renderLayers();
        this._renderLegend();
        this._renderInspector();
      };
      card.addEventListener('click', toggleLayer);
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        void toggleLayer();
      });
      this._layerListContainer.appendChild(card);
    });
  }

  _syncWeatherMetricVisibility() {
    const metrics = document.getElementById('thematic-weather-metrics');
    if (metrics) metrics.hidden = this.activeCategoryId !== 'weather';
  }

  /**
   * Renders the dynamic legend according to the active layer.
   */
  _renderLegend() {
    if (!this._legendContainer) return;
    const currentCat = LIVE_THEMATIC_CATEGORIES.find((c) => c.id === this.activeCategoryId);
    const currentLayer = currentCat?.layers.find((l) => l.id === this.activeLayerId);
    if (!currentLayer) return;
    const weatherMetricLabels = {
      temperature: 'Current air temperature at city locations',
      humidity: 'Relative humidity at city locations',
      precipitation: 'Current precipitation at city locations',
      wind: 'Wind speed at city locations',
    };

    this._legendContainer.innerHTML = `
      <div class="thematic-legend-metric"><strong>${currentLayer.source}</strong></div>
      <div class="thematic-legend-items">${currentLayer.id === 'live-weather-stations' ? weatherMetricLabels[this._weatherMetric] : currentLayer.metric}</div>
      ${currentLayer.id === 'live-weather-stations' ? '<a href="https://open-meteo.com/en/licence" target="_blank" rel="noopener">Weather data by Open-Meteo.com</a> (CC BY 4.0).' : ''}
      ${currentLayer.id.startsWith('nasa-') ? '<div class="thematic-legend-items">NASA satellite imagery uses the published product palette; missing pixels indicate unavailable observations.</div>' : ''}
      ${currentLayer.id === 'local-firms' ? '<div class="thematic-legend-items">Thermal detections can include non-fire heat sources; they are not verified fire perimeters.</div>' : ''}
      ${currentLayer.id === 'nasa-modis-ndvi' ? '<div class="thematic-legend-items">Higher vegetation index values generally indicate greener vegetation; season and clouds affect the signal.</div>' : ''}
    `;
  }

  async _setDataLayerEnabled(layerId, enabled) {
    const status = document.getElementById('thematic-layer-status');
    if (enabled) this._selectedDataLayerIds.add(layerId);
    else this._selectedDataLayerIds.delete(layerId);
    if (!this.isLayerActive && enabled) {
      if (status) status.textContent = 'Overlay is off; the selected layers will remain hidden.';
      return;
    }
    if (!this.isLayerActive && !this.dataManager?.isEnabled(layerId)) return;
    if (!this.dataManager) throw new Error('The data-layer manager is unavailable.');
    try {
      const success = await this.dataManager.setEnabled(layerId, enabled, { origin: 'user' });
      const active = this.dataManager.isEnabled(layerId) === enabled;
      if (!success && !active) throw new Error(`Could not ${enabled ? 'enable' : 'disable'} ${layerId}.`);
      if (status) {
        const layer = LIVE_THEMATIC_CATEGORIES.flatMap((category) => category.layers).find((item) => item.id === layerId);
        status.textContent = enabled ? `${layer?.source || layerId} · loading data` : 'Layer hidden.';
      }
    } catch (error) {
      if (enabled) this._selectedDataLayerIds.delete(layerId);
      else this._selectedDataLayerIds.add(layerId);
      if (status) status.textContent = error?.message || 'Layer could not be changed.';
      this._renderLayers();
      return false;
    }
  }

  /**
   * Renders quick location exploration buttons.
   */
  _renderLocations() {
    const container = document.getElementById('thematic-location-chips');
    if (!container) return;
    container.innerHTML = '';

    const prominentIndiaCities = new Set([
      'jaipur', 'lucknow', 'patna', 'bhopal', 'ahmedabad', 'hyderabad',
      'bengaluru', 'chennai', 'kochi', 'kolkata', 'guwahati', 'srinagar',
      'dehradun', 'bhubaneswar', 'raipur', 'chandigarh',
    ]);
    const locations = WEATHER_STATIONS.filter((station) => (
      station.tier === 'world' || prominentIndiaCities.has(station.id)
    ));
    locations.forEach((loc) => {
      const chip = document.createElement('button');
      chip.className = `thematic-loc-chip ${loc.id === this.selectedLocationId ? 'active' : ''}`;
      chip.dataset.locationId = loc.id;
      const isIndia = loc.country === 'India';
      const flag = isIndia ? '🇮🇳' : '🌍';
      chip.innerHTML = `${flag} ${loc.name}`;
      chip.addEventListener('click', () => {
        this.selectedLocationId = loc.id;
        this._updateLocationChipsActive();
        this._renderInspector();
        this.flyToLocation(loc.id);
      });
      container.appendChild(chip);
    });
  }

  _updateLocationChipsActive() {
    const chips = document.querySelectorAll('.thematic-loc-chip');
    chips.forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.locationId === this.selectedLocationId);
    });
  }

  /**
   * Flies the Cesium camera smoothly to a chosen station or corridor.
   */
  flyToLocation(locationId) {
    const loc = WEATHER_STATIONS.find((station) => station.id === locationId)
      || THEMATIC_LOCATIONS.find((location) => location.id === locationId);
    if (!loc || !this.viewer?.camera || !Cesium) return;

    // Appropriate camera altitude depending on topography
    let targetHeight = 650000;
    if (loc.id.includes('bay-of-bengal') || loc.id.includes('atlantic')) {
      targetHeight = 450000; // broader view for cyclone envelope
    } else if (loc.id.includes('himalayas') || loc.id.includes('alps')) {
      targetHeight = 45000; // dramatic close-up for mountains
    }

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, targetHeight),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0.0,
      },
      duration: 2.2,
    });
  }

  /**
   * Renders the telemetry readout in the card for the selected location and active layer.
   */
  _renderInspector() {
    if (!this._inspectorContainer) return;
    const station = WEATHER_STATIONS.find((item) => item.id === this.selectedLocationId) || WEATHER_STATIONS[0];
    const record = this._weatherObservations.get(station.id);
    if (this.activeLayerId !== 'live-weather-stations') {
      const layer = LIVE_THEMATIC_CATEGORIES.flatMap((category) => category.layers)
        .find((candidate) => candidate.id === this.activeLayerId);
      const layerState = this.dataManager?.getAll().find((candidate) => candidate.id === this.activeLayerId);
      const stats = layerState?.stats || {};
      const statusText = stats.error
        ? stats.error
        : this.dataManager?.isEnabled(this.activeLayerId)
          ? layer?.id.startsWith('nasa-')
            ? 'Satellite imagery overlay active.'
            : stats.count
              ? `${Number(stats.count).toLocaleString()} ${layer?.id === 'aqi' ? 'monitoring locations' : layer?.id === 'local-firms' ? 'fire detections' : 'earthquake events'}${stats.lastUpdate ? ` · updated ${new Date(stats.lastUpdate).toLocaleTimeString()}` : ''}`
              : 'Layer enabled; waiting for its first data update.'
          : 'Layer is off. Select its map card above to display it.';
      this._inspectorContainer.innerHTML = `
        <div class="thematic-inspector-card">
          <div class="thematic-inspector-header"><strong>${layer?.name || 'Thematic layer'}</strong></div>
          <div class="thematic-telemetry-desc">${layer?.source || 'Live environmental data'}<br><span class="thematic-layer-status"></span></div>
        </div>
      `;
      this._inspectorContainer.querySelector('.thematic-layer-status').textContent = statusText;
      return;
    }
    if (!record) {
      const weatherEnabled = this.dataManager?.isEnabled('live-weather-stations');
      this._inspectorContainer.innerHTML = `
        <div class="thematic-inspector-card">
          <div class="thematic-inspector-header">
            <div class="thematic-inspector-loc-title">
              <span class="thematic-loc-flag">${station.country === 'India' ? '🇮🇳' : '🌍'}</span>
              <strong>${station.name}</strong>
              <span class="thematic-loc-sub">${station.state} · ${station.country}</span>
            </div>
            <div class="thematic-inspector-coords">${station.lat.toFixed(2)}°, ${station.lon.toFixed(2)}°</div>
          </div>
          <div class="thematic-loc-sub">${station.region}</div>
          <div class="thematic-telemetry-desc">${weatherEnabled
            ? 'Waiting for current weather observations for this city.'
            : 'Turn on Live city observations to load current weather for this city.'}</div>
        </div>
      `;
      return;
    }
    const observation = record.observation;
    const weatherMetricNames = {
      temperature: 'Temperature',
      humidity: 'Humidity',
      precipitation: 'Precipitation',
      wind: 'Wind',
    };
    const metricRows = [
      ['Temperature', `${observation.temperatureC.toFixed(1)} °C`],
      ['Feels like', observation.feelsLikeC == null ? '—' : `${observation.feelsLikeC.toFixed(1)} °C`],
      ['Humidity', observation.humidityPct == null ? '—' : `${Math.round(observation.humidityPct)}%`],
      ['Precipitation', observation.precipitationMm == null ? '—' : `${observation.precipitationMm.toFixed(1)} mm`],
      ['Wind', observation.windKph == null ? '—' : `${observation.windKph.toFixed(1)} km/h`],
    ].map(([name, value]) => `
      <div class="thematic-telemetry-row">
        <span class="thematic-telemetry-key">${name}</span>
        <span class="thematic-telemetry-val">${value}</span>
      </div>
    `).join('');
    this._inspectorContainer.innerHTML = `
      <div class="thematic-inspector-card">
        <div class="thematic-inspector-header">
          <div class="thematic-inspector-loc-title">
            <span class="thematic-loc-flag">${station.country === 'India' ? '🇮🇳' : '🌍'}</span>
            <strong>${station.name}</strong>
            <span class="thematic-loc-sub">${station.state} · ${station.country}</span>
          </div>
          <div class="thematic-inspector-coords">${station.lat.toFixed(2)}°, ${station.lon.toFixed(2)}°</div>
        </div>
        <div class="thematic-loc-sub">${station.region}</div>
        <div class="thematic-weather-highlight">${weatherMetricNames[this._weatherMetric]} layer · ${record.observation[{
          temperature: 'temperatureC',
          humidity: 'humidityPct',
          precipitation: 'precipitationMm',
          wind: 'windKph',
        }[this._weatherMetric]] ?? 'No reading'} ${this._weatherMetric === 'humidity' ? '%' : this._weatherMetric === 'temperature' ? '°C' : this._weatherMetric === 'precipitation' ? 'mm' : 'km/h'}</div>
        <div class="thematic-telemetry-table">${metricRows}</div>
        <div class="thematic-telemetry-desc">Open-Meteo current city model data, not an official surface station. <a href="https://open-meteo.com/en/licence" target="_blank" rel="noopener">Weather data by Open-Meteo.com</a> (CC BY 4.0) · ${this._weatherFetchedAt ? `updated ${new Date(this._weatherFetchedAt).toLocaleString()}` : ''}</div>
      </div>
    `;
  }

  /**
   * Cleans up existing visual entities and radar layers.
   */
  _clearActiveVisuals() {
    if (this._dataSource) {
      this._dataSource.entities.removeAll();
    }
    if (this._radarImageryLayer && this.viewer?.imageryLayers) {
      this.viewer.imageryLayers.remove(this._radarImageryLayer, true);
      this._radarImageryLayer = null;
    }
    if (this._topoImageryLayer && this.viewer?.imageryLayers) {
      this.viewer.imageryLayers.remove(this._topoImageryLayer, true);
      this._topoImageryLayer = null;
    }
  }

  async clearAllOverlays() {
    this._selectedDataLayerIds.clear();
    this._clearActiveVisuals();

    for (const cfg of Object.values(this._meteoConfig || {})) {
      cfg.enabled = false;
      this._removeMeteosourceImagery(cfg);
    }
    for (const cfg of Object.values(this._owmConfig || {})) {
      cfg.enabled = false;
      this._syncOwmImageryLayer(cfg);
    }
    for (const cfg of Object.values(this._publicImageryConfig || {})) {
      cfg.enabled = false;
      this._syncPublicImageryLayer(cfg);
    }

    this._stormsEnabled = false;
    if (this._stormDataSource) this._stormDataSource.show = false;
    for (const source of this._stormTracks.values()) source.show = false;
    const stormsToggle = document.getElementById('thematic-storms-toggle');
    if (stormsToggle) {
      stormsToggle.setAttribute('aria-checked', 'false');
      stormsToggle.classList.remove('active');
      stormsToggle.textContent = 'SHOW STORMS';
    }

    this._droughtEnabled = false;
    if (this._droughtDataSource) this._droughtDataSource.show = false;
    const droughtStatus = document.getElementById('thematic-drought-status');
    if (droughtStatus) droughtStatus.textContent = 'DROUGHT OFF';

    this._renderLayers();
    this._renderLegend();
    this._renderInspector();
    this._renderMeteosourceSection();
    this._renderOwmSection();
    this._renderPublicImagerySection();
    this._renderDroughtSection();
    await this._restoreHeatmapBasemapIfIdle();
    governorRequestRender('thematic-clear-all');
  }

  /**
   * Main render dispatch for the active thematic layer.
   */
  _renderLayer() {
    if (!this.viewer || !Cesium) return;
    this._clearActiveVisuals();
  }

  /**
   * Updates alpha/transparency on entities.
   */
  _updateEntityAlpha() {
    if (!this._dataSource?.entities) return;
    const entities = this._dataSource.entities.values;
    for (const entity of entities) {
      if (entity.polygon?.material?.color) {
        const c = entity.polygon.material.color.getValue();
        if (c) {
          entity.polygon.material = c.withAlpha(0.35 * this.layerOpacity);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EXTREME WEATHER & HAZARD MAPS IMPLEMENTATION
  // ─────────────────────────────────────────────────────────────────────────────

  _renderHeatwaveLayer() {
    const C = Cesium;
    // 1. Spatial Heat Risk Polygons over Northern/Western India & Thar Desert
    this._dataSource.entities.add({
      name: 'North India Heatwave Anomaly Core',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          70.5, 29.5,
          78.5, 30.5,
          82.0, 27.0,
          80.0, 24.5,
          74.0, 23.5,
          69.5, 26.5,
        ]),
        material: C.Color.fromCssColorString('#d90429').withAlpha(0.35 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#ff0054'),
        outlineWidth: 2,
        height: 100,
      },
    });

    // 2. Severe Thar Desert Core Polygon
    this._dataSource.entities.add({
      name: 'Thar Desert Extreme Heat Dome (>48°C)',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          71.0, 28.5,
          76.0, 29.0,
          75.5, 26.0,
          71.2, 25.5,
        ]),
        material: C.Color.fromCssColorString('#7209b7').withAlpha(0.45 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#f72585'),
        outlineWidth: 2,
        height: 150,
      },
    });

    // 3. Death Valley Heat Graben
    this._dataSource.entities.add({
      name: 'Death Valley Extreme Thermal Hazard',
      thematicRole: 'global-contour',
      ellipse: {
        semiMinorAxis: 80000.0,
        semiMajorAxis: 140000.0,
        rotation: C.Math.toRadians(-25),
        material: C.Color.fromCssColorString('#7209b7').withAlpha(0.45 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#ff0054'),
        height: 50,
      },
      position: C.Cartesian3.fromDegrees(-116.8672, 36.4622),
    });

    // 4. Station Markers with Telemetry Callouts
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.heatwave;
      return {
        label: `${loc.name}: ${data.temp}°C\n(HI: ${data.heatIndex}°C)`,
        detailText: `UHI: ${data.uhiDelta} | Wet-Bulb: ${data.wetBulb}°C\n${data.alert}`,
        color: data.temp >= 45 ? '#7209b7' : data.temp >= 40 ? '#d90429' : '#ff9e00',
      };
    });
  }

  _renderCycloneLayer() {
    const C = Cesium;

    // 1. Bay of Bengal Cyclone Remal/Mocha Projected Track Polyline
    const trackPoints = [
      C.Cartesian3.fromDegrees(88.0, 14.0, 500),
      C.Cartesian3.fromDegrees(88.8, 16.2, 500),
      C.Cartesian3.fromDegrees(89.5, 18.2, 500), // Eye Current
      C.Cartesian3.fromDegrees(90.2, 20.4, 500),
      C.Cartesian3.fromDegrees(91.0, 22.2, 500),
      C.Cartesian3.fromDegrees(91.8, 23.8, 500),
    ];

    this._dataSource.entities.add({
      name: 'Cyclone Mocha/Remal Track Trajectory',
      thematicRole: 'global-contour',
      polyline: {
        positions: trackPoints,
        width: 5,
        material: new C.PolylineDashMaterialProperty({
          color: C.Color.fromCssColorString('#00d4ff'),
          dashLength: 20.0,
        }),
      },
    });

    // 2. Cone of Uncertainty (Projection Wedge Polygon)
    this._dataSource.entities.add({
      name: 'Cyclone Forecast Cone of Uncertainty',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          89.5, 18.2,
          91.8, 20.8,
          93.5, 23.5,
          90.5, 24.5,
          88.8, 22.0,
          89.5, 18.2,
        ]),
        material: C.Color.fromCssColorString('#0077b6').withAlpha(0.28 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#00b4d8'),
        height: 200,
      },
    });

    // 3. Cyclone Eye Center Pulsing Circle (Bay of Bengal)
    this._dataSource.entities.add({
      name: 'Cyclone Eyewall Center (952 hPa / 115 kt)',
      thematicRole: 'regional-marker',
      position: C.Cartesian3.fromDegrees(89.5, 18.2, 1000),
      ellipse: {
        semiMinorAxis: 45000.0,
        semiMajorAxis: 45000.0,
        material: C.Color.fromCssColorString('#ff0054').withAlpha(0.6),
        outline: true,
        outlineColor: C.Color.WHITE,
        outlineWidth: 3,
      },
      point: {
        pixelSize: 14,
        color: C.Color.RED,
        outlineColor: C.Color.WHITE,
        outlineWidth: 3,
      },
      label: {
        text: 'EYE: CAT 4 (952 hPa | 115 kt)\nSurge: +3.8m',
        font: '12px monospace',
        fillColor: C.Color.WHITE,
        outlineColor: C.Color.BLACK,
        outlineWidth: 3,
        style: C.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: C.VerticalOrigin.BOTTOM,
        pixelOffset: new C.Cartesian2(0, -22),
      },
    });

    // 4. Atlantic Hurricane Corridor Track (Miami Straits)
    const atlanticTrack = [
      C.Cartesian3.fromDegrees(-76.0, 22.0, 500),
      C.Cartesian3.fromDegrees(-78.2, 23.5, 500),
      C.Cartesian3.fromDegrees(-80.2, 25.1, 500), // Miami eye
      C.Cartesian3.fromDegrees(-82.4, 27.2, 500),
      C.Cartesian3.fromDegrees(-84.0, 29.5, 500),
    ];
    this._dataSource.entities.add({
      name: 'Atlantic Category 4 Hurricane Corridor',
      thematicRole: 'global-contour',
      polyline: {
        positions: atlanticTrack,
        width: 5,
        material: new C.PolylineDashMaterialProperty({
          color: C.Color.fromCssColorString('#f77f00'),
          dashLength: 22.0,
        }),
      },
    });

    this._dataSource.entities.add({
      name: 'Atlantic Hurricane Eyewall (938 hPa / 130 kt)',
      thematicRole: 'regional-marker',
      position: C.Cartesian3.fromDegrees(-80.2, 25.1, 1000),
      ellipse: {
        semiMinorAxis: 55000.0,
        semiMajorAxis: 55000.0,
        material: C.Color.fromCssColorString('#d90429').withAlpha(0.55),
        outline: true,
        outlineColor: C.Color.WHITE,
        outlineWidth: 3,
      },
      label: {
        text: 'HURRICANE EYE: CAT 4\n(938 hPa | 130 kt)',
        font: '12px monospace',
        fillColor: C.Color.WHITE,
        outlineColor: C.Color.BLACK,
        outlineWidth: 3,
        style: C.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: C.VerticalOrigin.BOTTOM,
        pixelOffset: new C.Cartesian2(0, -22),
      },
    });

    this._addStationMarkers((loc) => {
      const data = loc.telemetry.cyclone;
      return {
        label: `${loc.name}: ${data.windSpeed} km/h\n(Pres: ${data.pressure} hPa)`,
        detailText: `Wind Heading: ${data.heading} | Threat: ${data.threatLevel}`,
        color: data.threatLevel.includes('CATEGORY') || data.threatLevel.includes('HIGH') ? '#d90429' : '#00d4ff',
      };
    });
  }

  _renderDroughtLayer() {
    const C = Cesium;

    // 1. India Drought Monitor Polygons (D3 & D4 in Marathwada, Rayalaseema, Thar)
    this._dataSource.entities.add({
      name: 'Western Vidarbha & Marathwada Drought Zone (D3)',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          74.5, 20.8,
          77.8, 20.2,
          77.2, 18.0,
          75.0, 18.2,
        ]),
        material: C.Color.fromCssColorString('#f3722c').withAlpha(0.38 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#f8961e'),
        height: 80,
      },
    });

    this._dataSource.entities.add({
      name: 'Thar Desert Interior Drought (D4 - Exceptional)',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          70.2, 27.8,
          74.2, 28.5,
          73.5, 25.2,
          70.5, 25.8,
        ]),
        material: C.Color.fromCssColorString('#6a040f').withAlpha(0.45 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#d62828'),
        height: 120,
      },
    });

    // 2. Sahel Belt Drought (Africa)
    this._dataSource.entities.add({
      name: 'Sahel Belt (D4 Exceptional Drought)',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          5.0, 19.5,
          22.0, 20.0,
          20.5, 14.5,
          4.5, 14.0,
        ]),
        material: C.Color.fromCssColorString('#6a040f').withAlpha(0.42 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#9d0208'),
        height: 100,
      },
    });

    this._addStationMarkers((loc) => {
      const data = loc.telemetry.drought;
      return {
        label: `${loc.name}: SPEI ${data.spei}\n(${data.category})`,
        detailText: `Soil Moisture: ${data.soilMoisture}% | Deficit: ${data.deficit}`,
        color: data.spei <= -2.5 ? '#6a040f' : data.spei <= -1.5 ? '#f3722c' : '#2a9d8f',
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. METEOROLOGICAL (DAILY WEATHER) MAPS IMPLEMENTATION
  // ─────────────────────────────────────────────────────────────────────────────

  _renderSurfaceAnalysisLayer() {
    const C = Cesium;

    // 1. Synoptic Isobar Polylines across South Asia
    const isobar1004 = [
      C.Cartesian3.fromDegrees(68.0, 24.0, 100),
      C.Cartesian3.fromDegrees(72.0, 23.0, 100),
      C.Cartesian3.fromDegrees(76.0, 22.0, 100),
      C.Cartesian3.fromDegrees(82.0, 21.5, 100),
      C.Cartesian3.fromDegrees(88.0, 21.0, 100),
    ];
    const isobar1008 = [
      C.Cartesian3.fromDegrees(66.0, 29.0, 100),
      C.Cartesian3.fromDegrees(72.0, 28.0, 100),
      C.Cartesian3.fromDegrees(78.0, 27.5, 100),
      C.Cartesian3.fromDegrees(84.0, 27.0, 100),
      C.Cartesian3.fromDegrees(90.0, 26.5, 100),
    ];
    const isobar1012 = [
      C.Cartesian3.fromDegrees(65.0, 34.0, 100),
      C.Cartesian3.fromDegrees(72.0, 33.5, 100),
      C.Cartesian3.fromDegrees(80.0, 32.5, 100),
      C.Cartesian3.fromDegrees(88.0, 31.8, 100),
    ];

    [
      { name: '1004 hPa Isobar', pos: isobar1004, color: '#00f5d4' },
      { name: '1008 hPa Isobar', pos: isobar1008, color: '#4cc9f0' },
      { name: '1012 hPa Isobar', pos: isobar1012, color: '#4895ef' },
    ].forEach((iso) => {
      this._dataSource.entities.add({
        name: iso.name,
        thematicRole: 'global-contour',
        polyline: {
          positions: iso.pos,
          width: 3,
          material: C.Color.fromCssColorString(iso.color).withAlpha(0.7),
        },
      });
    });

    // 2. High (H) and Low (L) Atmospheric Pressure Centers
    this._dataSource.entities.add({
      name: 'Monsoon Trough Low (L 998 hPa)',
      thematicRole: 'regional-marker',
      position: C.Cartesian3.fromDegrees(75.5, 27.2, 500),
      billboard: {
        image: this._createPressureCenterSvg('L', '#ff0054'),
        scale: 0.9,
      },
      label: {
        text: 'L 998 hPa',
        font: 'bold 12px monospace',
        fillColor: C.Color.fromCssColorString('#ff0054'),
        pixelOffset: new C.Cartesian2(0, 24),
      },
    });

    this._dataSource.entities.add({
      name: 'Tibetan Anticyclone High (H 1024 hPa)',
      thematicRole: 'regional-marker',
      position: C.Cartesian3.fromDegrees(86.0, 32.5, 500),
      billboard: {
        image: this._createPressureCenterSvg('H', '#4cc9f0'),
        scale: 0.9,
      },
      label: {
        text: 'H 1024 hPa',
        font: 'bold 12px monospace',
        fillColor: C.Color.fromCssColorString('#4cc9f0'),
        pixelOffset: new C.Cartesian2(0, 24),
      },
    });

    // 3. Station Pressure Readouts
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.surface;
      return {
        label: `${loc.name}: ${data.pressure} hPa\n(${data.tendency})`,
        detailText: `Air Mass: ${data.airMass} | Isobar: ${data.isobar}`,
        color: '#00f5d4',
      };
    });
  }

  _renderTemperatureLayer() {
    // Shaded isotherm corridors across latitudes
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.temp;
      let color = '#52b788';
      if (data.surfaceTemp > 45) color = '#7209b7';
      else if (data.surfaceTemp > 40) color = '#d90429';
      else if (data.surfaceTemp > 30) color = '#ffb703';
      else if (data.surfaceTemp < 0) color = '#90e0ef';

      return {
        label: `${loc.name}: ${data.surfaceTemp}°C\n(Feels: ${data.feelsLike}°C)`,
        detailText: `Diurnal Range: ${data.diurnalRange}\nBand: ${data.isothermBand}`,
        color,
      };
    });
  }

  _renderPrecipitationRadarLayer() {
    const C = Cesium;

    // Connect RainViewer live global composite radar tile layer!
    // Timestamp fallback: use latest radar tiles
    try {
      const radarProvider = new C.UrlTemplateImageryProvider({
        url: 'https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/2/1_1.png',
        credit: new C.Credit('RainViewer Live Doppler Radar', true),
        minimumLevel: 1,
        maximumLevel: 8,
      });

      this._radarImageryLayer = this.viewer.imageryLayers.addImageryProvider(radarProvider);
      this._radarImageryLayer.alpha = this.layerOpacity;
    } catch (err) {
      console.warn('[ThematicMaps] RainViewer imagery layer load notice:', err);
    }

    // Add Doppler station indicators with rain rate & reflectivity dBZ
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.precipitation;
      let color = '#80ed99';
      if (data.rate > 40) color = '#d00000';
      else if (data.rate > 15) color = '#ffb703';
      else if (data.rate > 0) color = '#38b000';

      return {
        label: `${loc.name}: ${data.rate} mm/h\n(${data.reflectivity} dBZ)`,
        detailText: `Accum: ${data.accumToday} mm\n${data.radarStatus}`,
        color,
      };
    });
  }

  _renderWindStreamlinesLayer() {
    const C = Cesium;

    // Streamline vectors across Arabian Sea Southwest Monsoon surge
    const streamlineCoords = [
      { start: [62.0, 10.0], end: [68.0, 14.5], label: 'SW Monsoon 32 kt' },
      { start: [66.0, 12.0], end: [72.0, 17.0], label: 'Arabian Sea Surge 38 kt' },
      { start: [70.0, 14.0], end: [74.5, 19.0], label: 'Konkan Inflow 28 kt' },
      { start: [82.0, 12.0], end: [87.0, 16.0], label: 'Bay of Bengal Branch 25 kt' },
      { start: [85.0, 14.0], end: [90.0, 19.5], label: 'Northern Bay Cyclonic 45 kt' },
    ];

    streamlineCoords.forEach((flow, i) => {
      this._dataSource.entities.add({
        name: `Wind Vector: ${flow.label}`,
        thematicRole: 'global-contour',
        polyline: {
          positions: [
            C.Cartesian3.fromDegrees(flow.start[0], flow.start[1], 1000),
            C.Cartesian3.fromDegrees(flow.end[0], flow.end[1], 1000),
          ],
          width: 4,
          material: new C.PolylineArrowMaterialProperty(C.Color.fromCssColorString('#48cae4')),
        },
      });
    });

    this._addStationMarkers((loc) => {
      const data = loc.telemetry.wind;
      return {
        label: `${loc.name}: ${data.speedKmh} km/h ${data.cardinal}\n(${data.speedKnots} kt @ ${data.directionDeg}°)`,
        detailText: `Vector: ${data.vector}`,
        color: data.speedKmh > 65 ? '#7209b7' : data.speedKmh > 35 ? '#0077b6' : '#48cae4',
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CLIMATIC MAPS (LONG-TERM TRENDS) IMPLEMENTATION
  // ─────────────────────────────────────────────────────────────────────────────

  _renderClimateZonesLayer() {
    const C = Cesium;

    // Macro Köppen-Geiger Biome Polygons over Indian Subcontinent & Globe
    // Tropical Am/Af (Western Ghats & Sundarbans)
    this._dataSource.entities.add({
      name: 'Tropical Rainforest & Monsoon Belt (Af/Am)',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          73.0, 8.5,
          76.0, 14.0,
          74.5, 16.5,
          73.0, 12.0,
        ]),
        material: C.Color.fromCssColorString('#007f5f').withAlpha(0.35 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#2b9348'),
      },
    });

    // Arid Desert BWh (Thar & Indus Valley)
    this._dataSource.entities.add({
      name: 'Hot Arid Desert Climate (BWh)',
      thematicRole: 'global-contour',
      polygon: {
        hierarchy: C.Cartesian3.fromDegreesArray([
          68.0, 24.0,
          74.5, 29.5,
          70.0, 31.0,
          66.5, 27.0,
        ]),
        material: C.Color.fromCssColorString('#e9c46a').withAlpha(0.40 * this.layerOpacity),
        outline: true,
        outlineColor: C.Color.fromCssColorString('#e76f51'),
      },
    });

    this._addStationMarkers((loc) => {
      const data = loc.telemetry.climate_zones;
      return {
        label: `${loc.name}:\n${data.koppen}`,
        detailText: `Biome: ${data.biome}\nTrend: ${data.decadalTrend}`,
        color: '#55a630',
      };
    });
  }

  _renderIsohyetalLayer() {
    const C = Cesium;

    // Isohyetal bands (rainfall distribution)
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.isohyetal;
      let color = '#2a9d8f';
      if (data.annualRainfall > 3000) color = '#1d3557';
      else if (data.annualRainfall > 1500) color = '#457b9d';
      else if (data.annualRainfall < 400) color = '#e76f51';

      return {
        label: `${loc.name}: ${data.annualRainfall} mm/yr\n(Monsoon: ${data.monsoonShare})`,
        detailText: `Band: ${data.isohyetBand}`,
        color,
      };
    });
  }

  _renderClimateChangeLayer() {
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.climate_change;
      return {
        label: `${loc.name}: 2050 Projection\n${data.temp2050}`,
        detailText: data.seaLevelRiseRisk
          ? `SLR: ${data.seaLevelRiseRisk}`
          : data.glacierLoss
          ? `Cryosphere: ${data.glacierLoss}`
          : `Heat Risk: ${data.heatwaveDaysIncrease || 'High Variance'}`,
        color: '#d62828',
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ECOLOGICAL & PHYSICAL ENVIRONMENT MAPS IMPLEMENTATION
  // ─────────────────────────────────────────────────────────────────────────────

  _renderLulcLayer() {
    this._addStationMarkers((loc) => {
      const data = loc.telemetry.lulc;
      let color = '#006400';
      if (data.class.includes('Urban')) color = '#e60000';
      else if (data.class.includes('Desert') || data.class.includes('Sand')) color = '#ffbb22';
      else if (data.class.includes('Mangrove') || data.class.includes('Wetland')) color = '#00ffff';
      else if (data.class.includes('Glacier')) color = '#edf2f4';

      return {
        label: `${loc.name}:\n${data.class}`,
        detailText: `ESA WorldCover: ${data.coverPercent} (Code ${data.esaCode})`,
        color,
      };
    });
  }

  _renderElevationLayer() {
    const C = Cesium;
    if (!C || !this.viewer) return;

    // Attach OpenTopography Copernicus 30m DEM / OpenTopoMap contour tiles
    if (!this._topoImageryLayer && this.viewer.imageryLayers) {
      try {
        const topoProvider = new C.UrlTemplateImageryProvider({
          url: '/api/opentopography/tiles/{z}/{x}/{y}.png',
          credit: new C.Credit('© OpenTopography Copernicus 30m DEM / OpenTopoMap Contours', true),
          maximumLevel: 17,
          tileWidth: 256,
          tileHeight: 256,
        });
        this._topoImageryLayer = this.viewer.imageryLayers.addImageryProvider(topoProvider);
        this._topoImageryLayer.minificationFilter = C.TextureMinificationFilter.LINEAR;
        this._topoImageryLayer.magnificationFilter = C.TextureMagnificationFilter.LINEAR;
        this._topoImageryLayer.contrast = 1.22;
        this._topoImageryLayer.gamma = 0.95;
        this._topoImageryLayer.brightness = 1.04;
        this._topoImageryLayer.alpha = this.layerOpacity;
        this._topoImageryLayer.show = this.isLayerActive;
      } catch (err) {
        console.warn('[ThematicMaps] Failed to attach OpenTopography contour layer:', err);
      }
    } else if (this._topoImageryLayer) {
      this._topoImageryLayer.show = this.isLayerActive;
      this._topoImageryLayer.alpha = this.layerOpacity;
    }

    this._addStationMarkers((loc) => {
      const data = loc.telemetry.elevation;
      const elev = loc.openTopoElevation != null ? loc.openTopoElevation : data.altitudeM;
      let color = '#a7c957';
      if (elev > 4000) color = '#edf2f4';
      else if (elev > 1500) color = '#bc6c25';
      else if (elev > 500) color = '#e76f51';

      const tag = loc.openTopoElevation != null ? 'COP30 DEM' : 'AMSL';
      return {
        label: `${loc.name}: ${Math.round(elev)}m ${tag}\n(${data.contourInterval} contours)`,
        detailText: `Geomorphology: ${data.terrain}\nOpenTopography COP30: ${loc.openTopoElevation != null ? `${loc.openTopoElevation.toFixed(1)}m (EGM2008 Datum)` : 'Querying DEM...'}`,
        color,
      };
    });

    this._fetchOpenTopoElevations();
  }

  async _fetchOpenTopoElevations() {
    THEMATIC_LOCATIONS.forEach(async (loc) => {
      if (loc.openTopoElevation != null) return;
      try {
        const res = await fetch(`/api/opentopography/elevation?lat=${loc.lat}&lon=${loc.lon}&dataset=COP30`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && (data.status === 'success' || data.elevation != null)) {
          loc.openTopoElevation = data.elevation;
          loc.openTopoDataset = data.dataset || 'COP30';
          loc.openTopoDatum = data.datum || 'EGM2008';

          if (this.activeLayerId === 'elevation' && this._dataSource?.entities) {
            const station = this._dataSource.entities.getById(`thematic-station-${loc.id}`);
            if (station?.label) {
              station.label.text = `${loc.name}: ${Math.round(data.elevation)}m COP30 DEM\n(${loc.telemetry.elevation.contourInterval} contours)`;
            }
            const detail = this._dataSource.entities.getById(`thematic-detail-${loc.id}`);
            if (detail?.label) {
              detail.label.text = `[COP30 DEM TELEMETRY]\nExact: ${data.elevation.toFixed(1)}m AMSL | Datum: ${loc.openTopoDatum}\nGeomorphology: ${loc.telemetry.elevation.terrain}`;
            }
          }
          if (this.selectedLocationId === loc.id && this.activeLayerId === 'elevation') {
            this._renderInspector();
          }
        }
      } catch {
        // silent fallback
      }
    });
  }

  /**
   * Helper to add station billboard markers and labels with zoom reactivity.
   */
  _addStationMarkers(getDataFn) {
    const C = Cesium;
    if (!this._dataSource || !C) return;

    THEMATIC_LOCATIONS.forEach((loc) => {
      const { label, detailText, color } = getDataFn(loc);

      // Station Root Entity with Point and Regional Label
      this._dataSource.entities.add({
        id: `thematic-station-${loc.id}`,
        name: loc.name,
        thematicRole: 'regional-marker',
        position: C.Cartesian3.fromDegrees(loc.lon, loc.lat, loc.elevation + 80),
        point: {
          pixelSize: 12,
          color: C.Color.fromCssColorString(color),
          outlineColor: C.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: label,
          font: 'bold 11px monospace',
          fillColor: C.Color.WHITE,
          outlineColor: C.Color.BLACK,
          outlineWidth: 3,
          style: C.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: C.VerticalOrigin.BOTTOM,
          pixelOffset: new C.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // Detailed Callout (Revealed only when zooming in close <= 600,000m)
      this._dataSource.entities.add({
        id: `thematic-detail-${loc.id}`,
        name: `${loc.name} Detail`,
        thematicRole: 'detailed-callout',
        position: C.Cartesian3.fromDegrees(loc.lon, loc.lat, loc.elevation + 40),
        label: {
          text: `[ZOOM TELEMETRY]\n${detailText}`,
          font: '10px monospace',
          fillColor: C.Color.fromCssColorString('#00d4ff'),
          outlineColor: C.Color.BLACK,
          outlineWidth: 3,
          style: C.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: C.VerticalOrigin.TOP,
          pixelOffset: new C.Cartesian2(0, 16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });
  }

  /**
   * Generates a data URI SVG icon for High 'H' or Low 'L' pressure centers.
   */
  _createPressureCenterSvg(letter, hexColor) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="rgba(0,0,0,0.75)" stroke="${hexColor}" stroke-width="3"/>
        <text x="18" y="23" font-size="16" font-family="monospace" font-weight="bold" fill="${hexColor}" text-anchor="middle">${letter}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  _initMeteosourceLayers() {
    const palette = {
      thermal: [
        { value: -20, color: '#163bba' },
        { value: -5, color: '#00a6e8' },
        { value: 10, color: '#65d6b3' },
        { value: 22, color: '#ffe34d' },
        { value: 32, color: '#ff8a24' },
        { value: 45, color: '#c90024' },
      ],
      cloud: [
        { value: 0, color: '#d8efff' },
        { value: 25, color: '#59c5e8' },
        { value: 50, color: '#55bb79' },
        { value: 75, color: '#ffd34a' },
        { value: 100, color: '#ef5638' },
      ],
      anomaly: [
        { value: -10, color: '#2046d8' },
        { value: -3, color: '#38bde8' },
        { value: 0, color: '#e8f2d0' },
        { value: 3, color: '#ffb32c' },
        { value: 10, color: '#d7193f' },
      ],
      heatRisk: [
        { value: 15, color: '#2371cf' },
        { value: 25, color: '#63c878' },
        { value: 30, color: '#ffe34d' },
        { value: 35, color: '#ff8a24' },
        { value: 43, color: '#c90024' },
      ],
      precipitation: [
        { value: 0, color: '#e7f4ff' },
        { value: 1, color: '#50c878' },
        { value: 5, color: '#ffdb4d' },
        { value: 15, color: '#f47c20' },
        { value: 35, color: '#d7193f' },
      ],
      wind: [
        { value: 0, color: '#d9f4ff' },
        { value: 10, color: '#5ec9d4' },
        { value: 25, color: '#58b86b' },
        { value: 50, color: '#ffb72b' },
        { value: 100, color: '#d5243d' },
      ],
    };
    this._meteoConfig = {
      temperature: {
        id: 'temperature', name: 'Air temperature', icon: '🌡️', field: 'temperatureC',
        unit: '°C', min: -20, max: 45, palette: palette.thermal,
        description: 'Current air temperature',
      },
      anomaly: {
        id: 'anomaly', name: 'Local temperature anomaly', icon: '🌡️', field: 'temperatureAnomalyC',
        unit: '°C vs local mean', min: -10, max: 10, palette: palette.anomaly,
        description: 'Air-temperature difference from this view’s sampled mean',
      },
      heatRisk: {
        id: 'heatRisk', name: 'High-temperature risk', icon: '☀️', field: 'heatRiskTempC',
        unit: '°C · temperature only', min: 15, max: 43, palette: palette.heatRisk,
        description: 'Temperature threshold proxy · not a medical heat index',
      },
      precipitation: {
        id: 'precipitation', name: 'Current precipitation', icon: '🌧️', field: 'precipitationMm',
        unit: 'mm', min: 0, max: 35, palette: palette.precipitation,
        description: 'Meteosource current precipitation',
      },
      wind: {
        id: 'wind', name: 'Wind speed', icon: '💨', field: 'windKph',
        unit: 'km/h', min: 0, max: 100, palette: palette.wind,
        description: 'Current wind speed',
      },
      cloudCover: {
        id: 'cloudCover', name: 'Cloud cover', icon: '☁️', field: 'cloudCoverPct',
        unit: '%', min: 0, max: 100, palette: palette.cloud,
        description: 'Current total cloud cover',
      },
    };
    this._meteoStatus = { configured: false };
    this._meteoSamples = null;
    this._meteoBounds = null;
    this._meteoSamplesAt = 0;
    this._meteoSamplesKey = '';
    this._meteoRequest = null;
    this._meteoMoveTimer = null;
    this._lastMeteoRefreshAt = 0;
  }

  async _checkMeteosourceStatus() {
    const statusEl = document.getElementById('thematic-meteo-status');
    try {
      const response = await fetch('/api/meteosource/status', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      this._meteoStatus = payload;
      if (statusEl) statusEl.textContent = payload.configured ? 'METEOSOURCE READY' : 'ADD API KEY';
    } catch (error) {
      if (statusEl) statusEl.textContent = 'WEATHER UNAVAILABLE';
      console.warn('[ThematicMaps] Meteosource status check failed:', error?.message || error);
    }

  }

  async _checkProviderSettingsAvailability() {
    const button = document.getElementById('thematic-meteo-api-keys');
    if (!button) return;
    try {
      const response = await fetch('/api/setup/status', { cache: 'no-store' });
      const contentType = response.headers.get('content-type') || '';
      button.hidden = !response.ok || !contentType.includes('application/json');
    } catch {
      button.hidden = true;
    }
  }

  _hasEnabledImageryOverlay() {
    return Object.values(this._meteoConfig || {}).some((cfg) => cfg.enabled)
      || Object.values(this._owmConfig || {}).some((cfg) => cfg.enabled)
      || Object.values(this._publicImageryConfig || {}).some((cfg) => cfg.enabled)
      || this._droughtEnabled;
  }

  async _ensureHeatmapCompatibleBasemap() {
    if (this._heatmapStackRequest) return this._heatmapStackRequest;
    if (!this.mapStackController) {
      if (!this.viewer?.scene?.globe?.show) {
        throw new Error('Heatmap overlays need a satellite imagery basemap; choose Esri Satellite first.');
      }
      return;
    }
    if (this._heatmapRestoreRequest) await this._heatmapRestoreRequest;
    if (this._heatmapStackRequest) return this._heatmapStackRequest;
    const current = this.mapStackController.getState();
    if (current?.activeStack?.kind !== 'photoreal' && this.viewer.scene.globe.show) return;
    const priorStackId = current?.activeId || null;
    this._previousHeatmapStackId ??= priorStackId;
    const request = (async () => {
      const fallback = await this.mapStackController.setStack('esri-imagery', { silent: true });
      if (fallback?.activeId !== 'esri-imagery' || !this.viewer.scene.globe.show) {
        throw new Error(this.mapStackController.getState()?.lastError
          || 'Could not activate a satellite imagery basemap for heatmaps.');
      }
      this._heatmapCompatibleStackId = fallback.activeId;
      governorRequestRender('thematic-heatmap-basemap');
    })();
    const wrappedRequest = request.finally(() => {
      if (this._heatmapStackRequest === wrappedRequest) this._heatmapStackRequest = null;
    });
    this._heatmapStackRequest = wrappedRequest;
    try {
      await wrappedRequest;
    } catch (error) {
      if (!this._hasEnabledImageryOverlay()) this._previousHeatmapStackId = null;
      throw error;
    }
  }

  async _restoreHeatmapBasemapIfIdle() {
    if (this._hasEnabledImageryOverlay() || this._heatmapRestoreRequest) return;
    if (this._heatmapStackRequest) {
      try {
        await this._heatmapStackRequest;
      } catch {
        return;
      }
    }
    const previousId = this._previousHeatmapStackId;
    const compatibleId = this._heatmapCompatibleStackId;
    this._previousHeatmapStackId = null;
    this._heatmapCompatibleStackId = null;
    if (!previousId || !compatibleId || !this.mapStackController) return;
    if (this.mapStackController.getState()?.activeId !== compatibleId) return;
    const restore = this.mapStackController.setStack(previousId, { silent: true }).then((state) => {
      if (state?.activeId !== previousId) {
        throw new Error(state?.lastError || `Could not restore the ${previousId} map stack.`);
      }
    });
    const wrappedRestore = restore.finally(() => {
      if (this._heatmapRestoreRequest === wrappedRestore) this._heatmapRestoreRequest = null;
    });
    this._heatmapRestoreRequest = wrappedRestore;
    try {
      await wrappedRestore;
    } catch (error) {
      console.warn('[ThematicMaps] Could not restore the previous basemap:', error?.message || error);
    }
  }

  _initPublicImageryLayers() {
    this._publicImageryConfig = {
      modis: {
        id: 'modis',
        layerId: 'MODIS_Terra_Land_Surface_Temp_Day',
        matrixSet: 'GoogleMapsCompatible_Level7',
        maxLevel: 7,
        dateLagDays: 2,
        name: 'Satellite land-surface temperature',
        description: 'NASA Terra MODIS · daily · typically 1–2 days behind',
        enabled: false,
        layer: null,
      },
      imerg: {
        id: 'imerg',
        layerId: 'IMERG_Precipitation_Rate',
        matrixSet: 'GoogleMapsCompatible_Level6',
        maxLevel: 6,
        dateLagDays: 1,
        name: 'GPM satellite precipitation',
        description: 'NASA IMERG · global rainfall rate · near-real-time',
        enabled: false,
        layer: null,
      },
    };
  }

  _initStormDataSource() {
    if (!this.viewer || !Cesium) return;
    try {
      this._stormDataSource = new Cesium.CustomDataSource('noaa-active-storms');
      this._stormDataSource.show = false;
      this.viewer.dataSources.add(this._stormDataSource);
    } catch (error) {
      console.warn('[ThematicMaps] Could not create the active-storm data source:', error);
    }
  }

  _renderPublicImagerySection() {
    if (!this._publicContainer) return;
    this._publicContainer.textContent = '';
    for (const cfg of Object.values(this._publicImageryConfig)) {
      const card = document.createElement('div');
      card.className = `thematic-owm-card ${cfg.enabled ? 'active' : ''}`;
      const top = document.createElement('div');
      top.className = 'thematic-owm-card-top';
      const info = document.createElement('div');
      info.className = 'thematic-owm-info';
      const name = document.createElement('div');
      name.className = 'thematic-owm-name';
      name.textContent = cfg.name;
      const detail = document.createElement('div');
      detail.className = 'thematic-owm-sub';
      detail.textContent = cfg.description;
      info.append(name, detail);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = `thematic-owm-toggle-switch ${cfg.enabled ? 'active' : ''}`;
      toggle.dataset.publicToggle = cfg.id;
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', String(cfg.enabled));
      toggle.setAttribute('aria-label', `Toggle ${cfg.name}`);
      const thumb = document.createElement('span');
      thumb.className = 'thematic-owm-toggle-thumb';
      const state = document.createElement('span');
      state.className = 'thematic-owm-toggle-text';
      state.textContent = cfg.enabled ? 'ON' : 'OFF';
      toggle.append(thumb, state);
      top.append(info, toggle);
      card.append(top);
      this._publicContainer.append(card);
    }
  }

  async _togglePublicImageryLayer(layerId) {
    const cfg = this._publicImageryConfig[layerId];
    if (!cfg) return;
    cfg.enabled = !cfg.enabled;
    this._renderPublicImagerySection();
    const status = document.getElementById('thematic-imagery-status');
    if (!cfg.enabled) {
      this._syncPublicImageryLayer(cfg);
      if (status) status.textContent = 'PUBLIC · NO KEY';
      await this._restoreHeatmapBasemapIfIdle();
      return;
    }
    try {
      if (status) status.textContent = 'PREPARING MAP…';
      await this._ensureHeatmapCompatibleBasemap();
      if (!cfg.enabled) return;
      this._syncPublicImageryLayer(cfg);
      if (status) status.textContent = 'NASA GIBS · LIVE';
    } catch (error) {
      cfg.enabled = false;
      this._renderPublicImagerySection();
      if (status) status.textContent = 'MAP LAYER ERROR';
      console.warn(`[ThematicMaps] Could not activate ${cfg.name}:`, error?.message || error);
      await this._restoreHeatmapBasemapIfIdle();
    }
  }

  _syncPublicImageryLayer(cfg) {
    if (!this.viewer?.imageryLayers) return;
    if (cfg.enabled && !cfg.layer) {
      try {
        const date = new Date(Date.now() - cfg.dateLagDays * 86400000).toISOString().slice(0, 10);
        const provider = new Cesium.UrlTemplateImageryProvider({
          url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${cfg.layerId}/default/${date}/${cfg.matrixSet}/{z}/{y}/{x}.png`,
          credit: new Cesium.Credit('NASA Global Imagery Browse Services (GIBS)', true),
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
          minimumLevel: 0,
          maximumLevel: cfg.maxLevel,
          tileWidth: 256,
          tileHeight: 256,
        });
        cfg.layer = this.viewer.imageryLayers.addImageryProvider(provider);
      } catch (error) {
        cfg.enabled = false;
        console.warn(`[ThematicMaps] Could not create the ${cfg.name} layer:`, error);
        return;
      }
    }
    if (cfg.layer) {
      cfg.layer.show = this.isLayerActive && cfg.enabled;
      cfg.layer.alpha = this.layerOpacity;
    }
    governorRequestRender('thematic-public-imagery');
  }

  _renderDroughtSection() {
    if (!this._droughtContainer) return;
    this._droughtContainer.textContent = '';
    const card = document.createElement('div');
    card.className = `thematic-owm-card ${this._droughtEnabled ? 'active' : ''}`;
    const top = document.createElement('div');
    top.className = 'thematic-owm-card-top';
    const info = document.createElement('div');
    info.className = 'thematic-owm-info';
    const name = document.createElement('div');
    name.className = 'thematic-owm-name';
    name.textContent = 'U.S. drought intensity';
    const detail = document.createElement('div');
    detail.className = 'thematic-owm-sub';
    detail.textContent = 'U.S. Drought Monitor · weekly · D0–D4';
    info.append(name, detail);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = `thematic-owm-toggle-switch ${this._droughtEnabled ? 'active' : ''}`;
    toggle.dataset.droughtToggle = 'usdm';
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(this._droughtEnabled));
    toggle.setAttribute('aria-label', 'Toggle U.S. Drought Monitor overlay');
    const thumb = document.createElement('span');
    thumb.className = 'thematic-owm-toggle-thumb';
    const state = document.createElement('span');
    state.className = 'thematic-owm-toggle-text';
    state.textContent = this._droughtEnabled ? 'ON' : 'OFF';
    toggle.append(thumb, state);
    top.append(info, toggle);
    card.append(top);
    this._droughtContainer.append(card);
  }

  async _toggleDroughtLayer() {
    this._droughtEnabled = !this._droughtEnabled;
    this._renderDroughtSection();
    const status = document.getElementById('thematic-drought-status');
    if (!this._droughtEnabled) {
      if (this._droughtDataSource) this._droughtDataSource.show = false;
      if (status) status.textContent = 'DROUGHT OFF';
      await this._restoreHeatmapBasemapIfIdle();
      return;
    }
    if (this._droughtDataSource) {
      this._droughtDataSource.show = this.isLayerActive;
      if (status) status.textContent = 'USDM · U.S. ONLY';
      return;
    }
    if (status) status.textContent = 'LOADING USDM…';
    try {
      await this._ensureHeatmapCompatibleBasemap();
    } catch (error) {
      this._droughtEnabled = false;
      this._renderDroughtSection();
      if (status) status.textContent = 'MAP LAYER ERROR';
      console.warn('[ThematicMaps] Could not prepare the U.S. Drought Monitor basemap:', error?.message || error);
      await this._restoreHeatmapBasemapIfIdle();
      return;
    }
    if (!this._droughtRequest) {
      this._droughtRequest = (async () => {
        const response = await fetch('/api/drought/usdm', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `USDM request failed (${response.status})`);
        if (payload.geojson?.type !== 'FeatureCollection') throw new Error('USDM returned invalid drought boundaries.');
        const source = await Cesium.GeoJsonDataSource.load(payload.geojson);
        this.viewer.dataSources.add(source);
        this._droughtDataSource = source;
        this._styleDroughtEntities();
        source.show = this.isLayerActive && this._droughtEnabled;
        governorRequestRender('thematic-drought-overlay');
        if (status) status.textContent = 'USDM · U.S. ONLY';
      })().catch((error) => {
        this._droughtEnabled = false;
        this._renderDroughtSection();
        if (status) status.textContent = 'DROUGHT DATA ERROR';
        console.warn('[ThematicMaps] U.S. Drought Monitor layer failed:', error?.message || error);
        void this._restoreHeatmapBasemapIfIdle();
      }).finally(() => {
        this._droughtRequest = null;
      });
    }
    await this._droughtRequest;
  }

  _styleDroughtEntities() {
    if (!this._droughtDataSource) return;
    const classes = [
      { label: 'D0 · Abnormally dry', color: '#ffff00' },
      { label: 'D1 · Moderate drought', color: '#fcd37f' },
      { label: 'D2 · Severe drought', color: '#ffaa00' },
      { label: 'D3 · Extreme drought', color: '#e60000' },
      { label: 'D4 · Exceptional drought', color: '#730000' },
    ];
    for (const entity of this._droughtDataSource.entities.values) {
      if (!entity.polygon) continue;
      const rawClass = entity.properties?.dm?.getValue?.(Cesium.JulianDate.now())
        ?? entity.properties?.DM?.getValue?.(Cesium.JulianDate.now());
      const severity = Number(rawClass);
      if (!Number.isInteger(severity) || severity < 0 || severity > 4) continue;
      const category = classes[severity];
      const color = Cesium.Color.fromCssColorString(category.color);
      entity.name = category.label;
      entity.polygon.material = color.withAlpha(this.layerOpacity * 0.55);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = color.withAlpha(Math.min(1, this.layerOpacity + 0.1));
    }
  }

  _renderNHCStorms() {
    if (!this._stormContainer) return;
    this._stormContainer.textContent = '';
    if (!this._storms.length) {
      const empty = document.createElement('div');
      empty.className = 'thematic-owm-sub';
      empty.textContent = 'No active NHC storms in monitored basins.';
      this._stormContainer.append(empty);
      return;
    }
    for (const storm of this._storms) {
      const card = document.createElement('div');
      card.className = 'thematic-owm-card thematic-meteo-card';
      const name = document.createElement('div');
      name.className = 'thematic-owm-name';
      name.textContent = `${storm.name} · ${storm.classification}`;
      const detail = document.createElement('div');
      detail.className = 'thematic-owm-sub';
      const wind = Number.isFinite(storm.windKnots) ? `${storm.windKnots} kt` : 'wind unavailable';
      detail.textContent = `${wind} · ${storm.latitude.toFixed(1)}°, ${storm.longitude.toFixed(1)}°`;
      card.append(name, detail);
      if (storm.lastUpdate) {
        const updated = document.createElement('div');
        updated.className = 'thematic-owm-sub';
        updated.textContent = `Advisory ${new Date(storm.lastUpdate).toLocaleString()}`;
        card.append(updated);
      }
      if (storm.advisoryUrl) {
        const link = document.createElement('a');
        link.href = storm.advisoryUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'thematic-public-source-link';
        link.textContent = 'OFFICIAL NHC ADVISORY ↗';
        card.append(link);
      }
      this._stormContainer.append(card);
    }
  }

  async _refreshNHCStorms() {
    if (this._stormRequest) return this._stormRequest;
    const status = document.getElementById('thematic-storm-status');
    if (status) status.textContent = 'CHECKING NHC…';
    this._stormRequest = (async () => {
      const response = await fetch('/api/noaa/storms/current', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `NHC request failed (${response.status})`);
      this._storms = Array.isArray(payload.storms) ? payload.storms : [];
      for (const source of this._stormTracks.values()) {
        this.viewer.dataSources.remove(source, true);
      }
      this._stormTracks.clear();
      this._renderNHCStorms();
      this._stormDataSource?.entities.removeAll();
      for (const storm of this._storms) {
        this._stormDataSource?.entities.add({
          id: `nhc-${storm.id}`,
          name: `${storm.name} · ${storm.classification}`,
          position: Cesium.Cartesian3.fromDegrees(storm.longitude, storm.latitude),
          point: {
            pixelSize: 14,
            color: Cesium.Color.fromCssColorString('#ff4d6d'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `${storm.name} · ${storm.windKnots ?? '--'} kt`,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }
      if (this._stormDataSource) this._stormDataSource.show = this.isLayerActive && this._stormsEnabled;
      if (this._stormsEnabled) await this._loadNHCTracks();
      this.viewer.scene?.requestRender?.();
      if (status) {
        const trackFailures = this._stormsEnabled
          && this._storms.some((storm) => storm.trackAvailable && !this._stormTracks.has(storm.id));
        status.textContent = this._storms.length
          ? `${this._storms.length} ACTIVE · NHC${trackFailures ? ' · TRACK ERROR' : ''}`
          : 'NO ACTIVE NHC STORMS';
      }
    })().catch((error) => {
      if (status) status.textContent = 'NHC FEED UNAVAILABLE';
      console.warn('[ThematicMaps] NOAA active-storm feed failed:', error?.message || error);
    }).finally(() => {
      this._stormRequest = null;
    });
    await this._stormRequest;
  }

  _toggleNHCStorms() {
    this._stormsEnabled = !this._stormsEnabled;
    const button = document.getElementById('thematic-storms-toggle');
    if (button) {
      button.setAttribute('aria-checked', String(this._stormsEnabled));
      button.classList.toggle('active', this._stormsEnabled);
      button.textContent = this._stormsEnabled ? 'STORMS ON' : 'SHOW STORMS';
    }
    if (this._stormDataSource) {
      this._stormDataSource.show = this.isLayerActive && this._stormsEnabled;
    }
    for (const source of this._stormTracks.values()) {
      source.show = this.isLayerActive && this._stormsEnabled;
    }
    if (this._stormsEnabled) {
      if (this._storms.length) void this._loadNHCTracks();
      else void this._refreshNHCStorms();
    } else {
      const status = document.getElementById('thematic-storm-status');
      if (status) status.textContent = this._storms.length ? `${this._storms.length} ACTIVE · NHC` : 'NO ACTIVE NHC STORMS';
    }
    this.viewer.scene?.requestRender?.();
  }

  async _loadNHCTracks() {
    if (!this._stormsEnabled || !this.viewer || !Cesium.KmlDataSource) return;
    const pending = this._storms.filter((storm) => storm.trackAvailable && !this._stormTracks.has(storm.id));
    if (!pending.length) return;
    const results = await Promise.allSettled(pending.map(async (storm) => {
      const response = await fetch(`/api/noaa/storms/track?id=${encodeURIComponent(storm.id)}`, { cache: 'no-store' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `NHC track request failed (${response.status})`);
      }
      const source = await Cesium.KmlDataSource.load(await response.blob(), {
        camera: this.viewer.camera,
        canvas: this.viewer.canvas,
        clampToGround: true,
      });
      source.name = `${storm.name} official forecast track`;
      source.show = this.isLayerActive && this._stormsEnabled;
      await this.viewer.dataSources.add(source);
      this._stormTracks.set(storm.id, source);
    }));
    const failures = results.filter((result) => result.status === 'rejected');
    for (const failure of failures) {
      console.warn('[ThematicMaps] NHC forecast track failed:', failure.reason?.message || failure.reason);
    }
    const status = document.getElementById('thematic-storm-status');
    if (status) {
      status.textContent = failures.length
        ? `TRACKS ${this._stormTracks.size}/${this._storms.length} · NHC`
        : `TRACKS ${this._stormTracks.size} · NHC`;
    }
  }

  _renderMeteosourceSection() {
    if (!this._meteoContainer || !this._meteoConfig) return;
    this._meteoContainer.textContent = '';
    for (const cfg of Object.values(this._meteoConfig)) {
      const card = document.createElement('div');
      card.className = 'thematic-owm-card thematic-meteo-card';
      card.dataset.meteoCard = cfg.id;

      const top = document.createElement('div');
      top.className = 'thematic-owm-card-top';
      const info = document.createElement('div');
      info.className = 'thematic-owm-info';
      const titleRow = document.createElement('div');
      titleRow.className = 'thematic-owm-title-row';
      const icon = document.createElement('span');
      icon.className = 'thematic-owm-icon';
      icon.textContent = cfg.icon;
      const title = document.createElement('span');
      title.className = 'thematic-owm-name';
      title.textContent = cfg.name;
      titleRow.append(icon, title);
      const description = document.createElement('div');
      description.className = 'thematic-owm-sub';
      description.textContent = cfg.description;
      info.append(titleRow, description);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'thematic-owm-toggle-switch';
      toggle.dataset.meteoToggle = cfg.id;
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', String(cfg.enabled === true));
      toggle.setAttribute('aria-label', `Toggle ${cfg.name} heatmap`);
      const thumb = document.createElement('span');
      thumb.className = 'thematic-owm-toggle-thumb';
      const state = document.createElement('span');
      state.className = 'thematic-owm-toggle-text';
      state.textContent = cfg.enabled ? 'ON' : 'OFF';
      toggle.append(thumb, state);
      top.append(info, toggle);

      const scale = document.createElement('div');
      scale.className = 'thematic-owm-scale-bar';
      scale.style.background = `linear-gradient(90deg, ${cfg.palette.map((stop) => stop.color).join(', ')})`;
      const labels = document.createElement('div');
      labels.className = 'thematic-owm-scale-labels';
      const range = document.createElement('span');
      range.className = 'thematic-owm-units-text';
      range.textContent = `${cfg.min} – ${cfg.max} ${cfg.unit}`;
      labels.append(range);
      card.append(top, scale, labels);
      card.classList.toggle('active', cfg.enabled === true);
      this._meteoContainer.append(card);
    }
  }

  _toggleMeteosourceLayer(layerId) {
    const cfg = this._meteoConfig[layerId];
    if (!cfg) return;
    cfg.enabled = !cfg.enabled;
    const card = this._meteoContainer?.querySelector(`[data-meteo-card="${cfg.id}"]`);
    const toggle = card?.querySelector('[data-meteo-toggle]');
    card?.classList.toggle('active', cfg.enabled);
    toggle?.classList.toggle('active', cfg.enabled);
    toggle?.setAttribute('aria-checked', String(cfg.enabled));
    const state = toggle?.querySelector('.thematic-owm-toggle-text');
    if (state) state.textContent = cfg.enabled ? 'ON' : 'OFF';

    if (!cfg.enabled) {
      this._removeMeteosourceImagery(cfg);
      void this._restoreHeatmapBasemapIfIdle();
      return;
    }
    void this._ensureHeatmapCompatibleBasemap().then(() => this._loadMeteosourceSamples()).then((samples) => {
      if (!cfg.enabled || !samples) return;
      this._renderMeteosourceHeatmap(cfg);
    }).catch((error) => {
      cfg.enabled = false;
      this._removeMeteosourceImagery(cfg);
      card?.classList.remove('active');
      toggle?.classList.remove('active');
      toggle?.setAttribute('aria-checked', 'false');
      if (state) state.textContent = 'OFF';
      const statusEl = document.getElementById('thematic-meteo-status');
      if (statusEl) statusEl.textContent = error?.message || 'WEATHER ERROR';
      void this._restoreHeatmapBasemapIfIdle();
    });
  }

  _getMeteosourceGrid() {
    const position = this.viewer?.camera?.positionCartographic;
    const C = Cesium;
    if (!position || !C?.Math) throw new Error('Move the globe to a location before loading weather.');
    const lat = C.Math.toDegrees(position.latitude);
    const lon = C.Math.toDegrees(position.longitude);
    const halfLat = Math.min(16, Math.max(0.1, (position.height / 111000) * 0.35));
    const halfLon = Math.min(30, halfLat / Math.max(0.2, Math.cos(C.Math.toRadians(lat))));
    const south = Math.max(-82, lat - halfLat);
    const north = Math.min(82, lat + halfLat);
    const west = Math.max(-180, lon - halfLon);
    const east = Math.min(180, lon + halfLon);
    const points = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        points.push({
          lat: south + ((north - south) * row) / 2,
          lon: west + ((east - west) * col) / 2,
        });
      }
    }
    return { bounds: { south, north, west, east }, points };
  }

  async _loadMeteosourceSamples(force = false) {
    if (!this._meteoStatus.configured) {
      await this._checkMeteosourceStatus();
      if (!this._meteoStatus.configured) {
        throw new Error('Add a Meteosource API key in Provider Settings to load live weather heatmaps.');
      }
    }
    const grid = this._getMeteosourceGrid();
    const key = grid.points.map(({ lat, lon }) => `${lat.toFixed(2)},${lon.toFixed(2)}`).join('|');
    if (!force && this._meteoSamples && this._meteoSamplesKey === key && Date.now() - this._meteoSamplesAt < 10 * 60 * 1000) {
      return this._meteoSamples;
    }
    if (this._meteoRequest) return this._meteoRequest;
    const statusEl = document.getElementById('thematic-meteo-status');
    if (statusEl) statusEl.textContent = 'LOADING 9 POINTS…';

    const fetchPoint = async ({ lat, lon }) => {
      const query = new URLSearchParams({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
      const response = await fetch(`/api/meteosource/current?${query}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Meteosource request failed (${response.status})`);
      return { lat, lon, ...payload.current };
    };
    this._meteoRequest = (async () => {
      const results = [];
      for (let index = 0; index < grid.points.length; index += 3) {
        results.push(...await Promise.allSettled(grid.points.slice(index, index + 3).map(fetchPoint)));
      }
      return results;
    })().then((results) => {
      const samples = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      if (samples.length < 4) {
        const failed = results.find((result) => result.status === 'rejected');
        throw new Error(failed?.reason?.message || `Only ${samples.length} of 9 weather points loaded.`);
      }
      const temperatures = samples.map((sample) => Number(sample.temperatureC)).filter(Number.isFinite);
      const localMean = temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length;
      this._meteoSamples = samples.map((sample) => ({
        ...sample,
        temperatureAnomalyC: Number(sample.temperatureC) - localMean,
        heatRiskTempC: Number(sample.temperatureC),
      }));
      this._meteoBounds = grid.bounds;
      this._meteoSamplesAt = Date.now();
      this._meteoSamplesKey = key;
      this._lastMeteoRefreshAt = Date.now();
      if (statusEl) statusEl.textContent = `${samples.length}/9 LIVE · METEOSOURCE`;
      return samples;
    }).finally(() => {
      this._meteoRequest = null;
    });
    return this._meteoRequest;
  }

  _renderMeteosourceHeatmap(cfg) {
    const C = Cesium;
    if (!C || !this.viewer?.imageryLayers || !this._meteoSamples?.length) return;
    this._removeMeteosourceImagery(cfg);
    const bounds = this._meteoBounds || this._getMeteosourceGrid().bounds;
    const sampleValues = this._meteoSamples
      .map((sample) => ({ ...sample, value: Number(sample[cfg.field]) }))
      .filter((sample) => Number.isFinite(sample.value));
    if (sampleValues.length < 4) throw new Error(`Meteosource has no ${cfg.name.toLowerCase()} observations for this area.`);

    const width = 320;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not create a weather heatmap canvas.');
    const image = context.createImageData(width, height);
    const latSpan = Math.max(0.001, bounds.north - bounds.south);
    const lonSpan = Math.max(0.001, bounds.east - bounds.west);
    const gridSpacing = Math.max(lonSpan / 2, latSpan / 2, 0.001);
    for (let py = 0; py < height; py += 1) {
      const lat = bounds.north - (py / (height - 1)) * latSpan;
      for (let px = 0; px < width; px += 1) {
        const lon = bounds.west + (px / (width - 1)) * lonSpan;
        let weighted = 0;
        let totalWeight = 0;
        let nearest = Infinity;
        for (const sample of sampleValues) {
          const cosLat = Math.max(0.2, Math.cos(C.Math.toRadians(lat)));
          const dx = (lon - sample.lon) * cosLat;
          const dy = lat - sample.lat;
          const distanceSquared = dx * dx + dy * dy;
          nearest = Math.min(nearest, Math.sqrt(distanceSquared));
          const weight = 1 / Math.max(distanceSquared, 0.00002);
          weighted += sample.value * weight;
          totalWeight += weight;
        }
        if (!totalWeight) continue;
        const value = Math.max(cfg.min, Math.min(cfg.max, weighted / totalWeight));
        const color = this._interpolateMeteosourceColor(cfg.palette, value);
        const offset = (py * width + px) * 4;
        const falloff = Math.max(0.28, Math.min(0.78, 0.86 - (nearest / gridSpacing) * 0.08));
        image.data[offset] = color[0];
        image.data[offset + 1] = color[1];
        image.data[offset + 2] = color[2];
        image.data[offset + 3] = Math.round(255 * falloff);
      }
    }
    context.putImageData(image, 0, 0);
    try {
      const provider = new C.SingleTileImageryProvider({
        url: canvas.toDataURL('image/png'),
        tileWidth: width,
        tileHeight: height,
        rectangle: C.Rectangle.fromDegrees(
          bounds.west,
          bounds.south,
          bounds.east,
          bounds.north,
        ),
        credit: new C.Credit(`Meteosource · ${cfg.name}`, true),
      });
      cfg.layer = this.viewer.imageryLayers.addImageryProvider(provider);
      cfg.layer.alpha = this.layerOpacity;
      cfg.layer.show = this.isLayerActive && cfg.enabled;
      governorRequestRender('thematic-meteosource-imagery');
    } catch (error) {
      throw new Error(`Could not display ${cfg.name.toLowerCase()} heatmap: ${error?.message || error}`);
    }
  }

  _interpolateMeteosourceColor(palette, value) {
    const hexRgb = (hex) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const first = palette[0];
    if (value <= first.value) return hexRgb(first.color);
    for (let i = 1; i < palette.length; i += 1) {
      const upper = palette[i];
      const lower = palette[i - 1];
      if (value <= upper.value) {
        const amount = (value - lower.value) / (upper.value - lower.value);
        const a = hexRgb(lower.color);
        const b = hexRgb(upper.color);
        return a.map((component, index) => Math.round(component + (b[index] - component) * amount));
      }
    }
    return hexRgb(palette[palette.length - 1].color);
  }

  _removeMeteosourceImagery(cfg) {
    if (!cfg?.layer || !this.viewer?.imageryLayers) return;
    try {
      this.viewer.imageryLayers.remove(cfg.layer, true);
    } catch (error) {
      console.warn('[ThematicMaps] Could not remove weather heatmap:', error?.message || error);
    }
    cfg.layer = null;
    governorRequestRender('thematic-meteosource-remove');
  }

  /**
   * Initializes OpenWeatherMap configuration and state for dynamic tile layers.
   */
  _initOwmLayers() {
    this._owmConfig = {
      precipitation: {
        id: 'precipitation',
        layerKey: 'precipitation_new',
        name: 'Precipitation Radar',
        shortName: 'Precipitation',
        icon: '🌧️',
        description: 'Dynamic Rain & Snow Radar (0 – 100 mm/h)',
        units: '0.1 · 5 · 20 · 50+ mm/h',
        gradient: 'linear-gradient(90deg, #80ed99 0%, #38b000 25%, #ffb703 50%, #d00000 75%, #7209b7 100%)',
        enabled: false,
        layer: null,
      },
      wind: {
        id: 'wind',
        layerKey: 'wind_new',
        name: 'Wind Velocity Field',
        shortName: 'Wind Speed',
        icon: '💨',
        description: 'Global Wind Velocity Vectors (0 – 50+ m/s)',
        units: '0 · 15 · 30 · 60+ kt',
        gradient: 'linear-gradient(90deg, #00f5d4 0%, #52b788 25%, #ffb703 50%, #f72585 75%, #7209b7 100%)',
        enabled: false,
        layer: null,
      },
      temp: {
        id: 'temp',
        layerKey: 'temp_new',
        name: 'Surface Temperature',
        shortName: 'Temperature',
        icon: '🌡️',
        description: 'Thermal Isotherms (-40°C to +50°C)',
        units: '-30°C · 0°C · 20°C · 40°C+',
        gradient: 'linear-gradient(90deg, #4361ee 0%, #4cc9f0 25%, #80ed99 50%, #ffb703 75%, #d00000 100%)',
        enabled: false,
        layer: null,
      },
    };
    this._owmStatus = { hasKey: false, configured: false };
  }

  /**
   * Checks upstream OpenWeather API connection status.
   */
  async _checkOwmStatus() {
    try {
      const resp = await fetch('/api/openweather/status');
      if (resp.ok) {
        this._owmStatus = await resp.json();
        this._updateOwmStatusBadge();
      }
    } catch {
      // ignore
    }
  }

  /**
   * Updates the status badge pill in the OpenWeather section header.
   */
  _updateOwmStatusBadge() {
    const badge = document.getElementById('thematic-owm-status-pill');
    if (!badge) return;
    const activeCount = Object.values(this._owmConfig).filter((c) => c.enabled).length;
    if (activeCount > 0) {
      badge.textContent = `${activeCount} ACTIVE · ${this._owmStatus.hasKey ? 'OWM LIVE' : 'DYNAMIC'}`;
      badge.classList.add('active');
    } else {
      badge.textContent = this._owmStatus.hasKey ? 'OWM READY' : 'DYNAMIC TILES';
      badge.classList.remove('active');
    }
  }

  /**
   * Renders the toggle-based UI cards for each OpenWeather Map layer.
   */
  _renderOwmSection() {
    if (!this._owmContainer) return;
    this._owmContainer.innerHTML = '';

    Object.values(this._owmConfig).forEach((cfg) => {
      const card = document.createElement('div');
      card.className = `thematic-owm-card ${cfg.enabled ? 'active' : ''}`;
      card.id = `thematic-owm-card-${cfg.id}`;

      card.innerHTML = `
        <div class="thematic-owm-card-top">
          <div class="thematic-owm-info">
            <div class="thematic-owm-title-row">
              <span class="thematic-owm-icon">${cfg.icon}</span>
              <span class="thematic-owm-name">${cfg.name}</span>
            </div>
            <div class="thematic-owm-sub">${cfg.description}</div>
          </div>
          <button 
            type="button" 
            role="switch" 
            aria-checked="${cfg.enabled ? 'true' : 'false'}" 
            class="thematic-owm-toggle-switch ${cfg.enabled ? 'active' : ''}" 
            id="thematic-owm-toggle-${cfg.id}"
            title="Toggle ${cfg.name} layer on globe"
          >
            <span class="thematic-owm-toggle-thumb"></span>
            <span class="thematic-owm-toggle-text">${cfg.enabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
        <div class="thematic-owm-scale-bar" style="background: ${cfg.gradient};"></div>
        <div class="thematic-owm-scale-labels">
          <span>MIN</span>
          <span class="thematic-owm-units-text">${cfg.units}</span>
          <span>MAX</span>
        </div>
      `;

      // Toggle click handler on switch button
      const toggleBtn = card.querySelector(`#thematic-owm-toggle-${cfg.id}`);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._toggleOwmLayer(cfg.id);
        });
      }

      // Card click also toggles
      card.addEventListener('click', (e) => {
        if (e.target.closest('.thematic-owm-toggle-switch')) return;
        this._toggleOwmLayer(cfg.id);
      });

      this._owmContainer.appendChild(card);
    });

    this._updateOwmStatusBadge();
  }

  /**
   * Toggles an OpenWeatherMap dynamic layer on or off.
   */
  _toggleOwmLayer(layerId) {
    const cfg = this._owmConfig[layerId];
    if (!cfg) return;

    cfg.enabled = !cfg.enabled;

    // Update UI DOM
    const card = document.getElementById(`thematic-owm-card-${cfg.id}`);
    const toggleBtn = document.getElementById(`thematic-owm-toggle-${cfg.id}`);

    if (card) card.classList.toggle('active', cfg.enabled);
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', cfg.enabled);
      toggleBtn.setAttribute('aria-checked', cfg.enabled ? 'true' : 'false');
      const textSpan = toggleBtn.querySelector('.thematic-owm-toggle-text');
      if (textSpan) textSpan.textContent = cfg.enabled ? 'ON' : 'OFF';
    }

    if (cfg.enabled) {
      void this._ensureHeatmapCompatibleBasemap().then(() => {
        if (cfg.enabled) this._syncOwmImageryLayer(cfg);
      }).catch((error) => {
        cfg.enabled = false;
        this._syncOwmImageryLayer(cfg);
        if (card) card.classList.remove('active');
        if (toggleBtn) {
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-checked', 'false');
          const textSpan = toggleBtn.querySelector('.thematic-owm-toggle-text');
          if (textSpan) textSpan.textContent = 'OFF';
        }
        const status = document.getElementById('thematic-owm-status-pill');
        if (status) status.textContent = 'HEATMAP BASEMAP ERROR';
        console.warn(`[ThematicMaps] Could not activate ${cfg.name}:`, error?.message || error);
        void this._restoreHeatmapBasemapIfIdle();
      });
    } else {
      this._syncOwmImageryLayer(cfg);
      void this._restoreHeatmapBasemapIfIdle();
    }
    this._updateOwmStatusBadge();
  }

  /**
   * Synchronizes Cesium imagery provider for an OpenWeatherMap layer.
   */
  _syncOwmImageryLayer(cfg) {
    if (!this.viewer?.imageryLayers) return;
    const C = Cesium;

    if (cfg.enabled) {
      if (!cfg.layer) {
        try {
          const provider = new C.UrlTemplateImageryProvider({
            url: `/api/openweather/tile/${cfg.layerKey}/{z}/{x}/{y}.png`,
            credit: new C.Credit(`OpenWeatherMap ${cfg.name}`, true),
            minimumLevel: 0,
            maximumLevel: 18,
            hasAlphaChannel: true,
          });
          cfg.layer = this.viewer.imageryLayers.addImageryProvider(provider);
        } catch (err) {
          console.warn(`[ThematicMaps] Error creating imagery layer for ${cfg.name}:`, err);
        }
      }

      if (cfg.layer) {
        cfg.layer.show = this.isLayerActive;
        cfg.layer.alpha = this.layerOpacity;
      }
    } else {
      if (cfg.layer) {
        cfg.layer.show = false;
      }
    }
    governorRequestRender('thematic-openweather-imagery');
  }

  /**
   * Destroys controller and cleans up listeners and imagery layers.
   */
  destroy() {
    this._clearActiveVisuals();
    window.removeEventListener('gev:weather-stations-updated', this._weatherUpdatedHandler);
    window.removeEventListener('gev:weather-station-selected', this._weatherStationSelectedHandler);
    this._dataManagerUnsubscribe?.();
    this._dataManagerUnsubscribe = null;
    if (this._weatherUpdatedHandler) {
      window.removeEventListener('gev:weather-stations-updated', this._weatherUpdatedHandler);
      this._weatherUpdatedHandler = null;
    }
    if (this._cameraListenerRemover) {
      this._cameraListenerRemover();
      this._cameraListenerRemover = null;
    }
    if (this._dataSource && this.viewer?.dataSources) {
      this.viewer.dataSources.remove(this._dataSource, true);
      this._dataSource = null;
    }
    if (this._topoImageryLayer && this.viewer?.imageryLayers) {
      try {
        this.viewer.imageryLayers.remove(this._topoImageryLayer, true);
      } catch {
        // ignore
      }
      this._topoImageryLayer = null;
    }
    if (this._owmConfig && this.viewer?.imageryLayers) {
      for (const cfg of Object.values(this._owmConfig)) {
        if (cfg.layer) {
          try {
            this.viewer.imageryLayers.remove(cfg.layer, true);
          } catch {
            // ignore
          }
          cfg.layer = null;
        }
        governorRequestRender('thematic-meteosource-remove');
      }
    }
    if (this._meteoMoveTimer) {
      clearTimeout(this._meteoMoveTimer);
      this._meteoMoveTimer = null;
    }
    if (this._meteoConfig && this.viewer?.imageryLayers) {
      for (const cfg of Object.values(this._meteoConfig)) {
        this._removeMeteosourceImagery(cfg);
      }
    }
    if (this._publicImageryConfig && this.viewer?.imageryLayers) {
      for (const cfg of Object.values(this._publicImageryConfig)) {
        if (!cfg.layer) continue;
        try {
          this.viewer.imageryLayers.remove(cfg.layer, true);
        } catch {
          // ignore
        }
        cfg.layer = null;
      }
    }
    if (this.viewer?.dataSources) {
      if (this._stormDataSource) this.viewer.dataSources.remove(this._stormDataSource, true);
      for (const source of this._stormTracks.values()) this.viewer.dataSources.remove(source, true);
      if (this._droughtDataSource) this.viewer.dataSources.remove(this._droughtDataSource, true);
    }
    this._stormTracks.clear();
    this._stormDataSource = null;
    this._droughtDataSource = null;
  }
}

/**
 * Factory initialization helper.
 */
export function initThematicMaps(options) {
  return new ThematicMapsController(options.viewer, options);
}
