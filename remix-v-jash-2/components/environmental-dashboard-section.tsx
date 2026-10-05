"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  type LucideIcon,
  Thermometer, 
  Droplets, 
  CloudRain, 
  Waves, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wifi,
  Clock,
  Info,
  Gauge,
  Compass,
  Flame,
  Maximize2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EnvironmentalNetworkWorkspace } from "./environmental-network-workspace";
import {
  createEnvironmentalNode,
  ENVIRONMENTAL_GRAPH_STORAGE_KEY,
  loadEnvironmentalGraph,
  updateEnvironmentalNode,
  type EnvironmentalConnection,
  type EnvironmentalNetwork,
  type EnvironmentalNode,
  type NewEnvironmentalNode,
} from "./environmental-network-model";

// ============================================================================
// DATA CONTRACTS (Structured for ESP32 -> MQTT -> Node-RED -> ML -> FastAPI)
// ============================================================================

export interface SensorTelemetryItem {
  id: string;
  code: string;
  paramName: string;
  technicalLabel: string;
  value: string | number;
  unit: string;
  status: "LIVE" | "SYNCED" | "STANDBY" | "OFFLINE" | "DISCONNECTED";
  category: "sensor" | "intelligence";
  sensorNode: string;
  receivedAt?: number;
  lastPacket?: string;
  signalStrength?: string;
  busProtocol?: string;
  threshold?: { minimum?: number; maximum?: number };
  history?: number[];
}

export interface HazardStatusState {
  status: "Normal" | "Elevated" | "High" | "Critical";
  badgeText?: string;
  anomalyStatus: string;
  riskTrend: string;
  predictedCondition: string;
  lastSync: string;
  inferenceEngine: string;
}

export interface NodeMLIntelligence {
  timestamp: number; // Unix timestamp in seconds (e.g. 1789151004)
  riskScore: number; // Normalized 0 - 1 (e.g. 0.8363 -> 83.6 / 100)
  riskLevel: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
  anomalyScore: number; // Normalized 0 - 1 (e.g. 0.7333 -> 73.3 / 100)
  correlationFactor: number; // Normalized 0 - 1 (e.g. 0.912 -> 91.2%)
  confidence: number; // Normalized 0 - 1 (e.g. 0.9384 -> 93.8%)
  supportingNodes: string[]; // Array of corroborating node IDs
  observedNodes: number; // Total active nodes in ML consensus
  explanation: string[]; // Array of explanatory diagnostic sentences
  isDemo?: boolean;
}

export interface NodeTransportState {
  protocol: string;
  latency: string;
  broker: string;
  connection: string;
  qos: string;
  tls: string;
}

export interface SentinelNode {
  id: string;
  label: string; // e.g. "NODE 01"
  type:
    | "INDIVIDUAL / UNIVERSAL"
    | "MASTER"
    | "GATEWAY / RELAY"
    | "FIRE"
    | "FLOOD"
    | "LANDSLIDE"
    | "AIR QUALITY"
    | "WEATHER / ENVIRONMENT"
    | "CUSTOM"
    | "FOREST FIRE"
    | "UNIVERSAL"
    | "LIVE SENSOR";
  hardwareId: string; // e.g. "ESP32-NODE-01"
  status: "ONLINE" | "STANDBY" | "OFFLINE";
  sector: string; // e.g. "SECTOR-01"
  location: string;
  battery: string;
  firmware: string;
  hazard: HazardStatusState;
  ml: NodeMLIntelligence;
  sensors: SensorTelemetryItem[];
  transport: NodeTransportState;
}

// ============================================================================
// HELPER CONVERSION FUNCTIONS (Presentation Layer)
// ============================================================================

/**
 * Converts normalized 0-1 values or direct 0-100 numbers to a clean "XX.X" string
 */
export function formatScore100(val: number): string {
  const num = val <= 1 ? val * 100 : val;
  return num.toFixed(1);
}

/**
 * Converts normalized 0-1 values or direct percentage numbers to "XX.X%"
 */
export function formatPercent(val: number): string {
  const num = val <= 1 ? val * 100 : val;
  return `${num.toFixed(1)}%`;
}

/**
 * Converts Unix timestamp (seconds) into human-readable date and time representation
 */
export function formatTimestamp(unixSeconds: number): { dateStr: string; timeStr: string; fullStr: string } {
  const date = new Date(unixSeconds * 1000);
  if (isNaN(date.getTime())) {
    return { dateStr: "N/A", timeStr: "N/A", fullStr: "N/A" };
  }
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return {
    dateStr,
    timeStr,
    fullStr: `${dateStr} • ${timeStr}`,
  };
}

/**
 * Color styling for risk levels across EcoSentinel
 */
export function getRiskLevelBadgeClass(level: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL") {
  switch (level) {
    case "LOW":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "ELEVATED":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "HIGH":
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    case "CRITICAL":
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 border-zinc-700";
  }
}

export function getRiskLevelTextClass(level: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL") {
  switch (level) {
    case "LOW":
      return "text-emerald-400";
    case "ELEVATED":
      return "text-amber-400";
    case "HIGH":
      return "text-orange-400";
    case "CRITICAL":
      return "text-rose-400";
    default:
      return "text-zinc-300";
  }
}

export function getRiskGaugeGradient(level: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL") {
  switch (level) {
    case "LOW":
      return "from-emerald-500 to-emerald-400";
    case "ELEVATED":
      return "from-amber-500 to-amber-400";
    case "HIGH":
      return "from-orange-500 to-orange-400";
    case "CRITICAL":
      return "from-rose-500 to-rose-400";
    default:
      return "from-emerald-500 to-emerald-400";
  }
}

// ============================================================================
// EXACT 6 NODES DATASET
// NODE 01 — FLOOD (CRITICAL)
// NODE 02 — FLOOD (ELEVATED)
// NODE 03 — LANDSLIDE (HIGH)
// NODE 04 — FOREST FIRE (CRITICAL)
// NODE 05 — UNIVERSAL (ALL SUPPORTED SENSORS)
// NODE 06 — LIVE SENSOR (STANDBY / AWAITING INGEST)
// ============================================================================

export const NODES_DATA: SentinelNode[] = [
  // --------------------------------------------------------------------------
  // NODE 01 — FLOOD (REFERENCE ACTIVE CRITICAL EVENT PACKET)
  // Sensors: Temperature, Humidity, Rainfall, Water Level, Flow Rate
  // --------------------------------------------------------------------------
  {
    id: "node-01",
    label: "NODE 01",
    type: "FLOOD",
    hardwareId: "ESP32-NODE-01",
    status: "ONLINE",
    sector: "SECTOR-01",
    location: "SECTOR-01 // TOWER A",
    battery: "98%",
    firmware: "v2.1.4-sentinel",
    ml: {
      timestamp: 1789151004,
      riskScore: 0.8363, // -> 83.6 / 100
      riskLevel: "CRITICAL",
      anomalyScore: 0.7333, // -> 73.3 / 100
      correlationFactor: 0.912, // -> 91.2%
      confidence: 0.9384, // -> 93.8%
      supportingNodes: ["NODE_001", "NODE_002", "NODE_003"],
      observedNodes: 3,
      explanation: [
        "Significant environmental anomaly detected",
        "High flood likelihood",
        "3 nodes corroborate the event",
        "Sensor data quality is excellent",
      ],
      isDemo: false,
    },
    hazard: {
      status: "Critical",
      badgeText: "CRITICAL",
      anomalyStatus: "High divergence (>3.2σ from baseline)",
      riskTrend: "Escalating (+4.8% delta / hour)",
      predictedCondition: "Flash flood threat detected (4h projection)",
      lastSync: "T-00:00:01",
      inferenceEngine: "Eco-Ensemble ML v2.4 (FastAPI)",
    },
    sensors: [
      {
        id: "sen-temp",
        code: "SENSOR 01",
        technicalLabel: "THERMAL TELEMETRY",
        paramName: "TEMPERATURE",
        value: "27.4",
        unit: "°C",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-01",
        lastPacket: "T-00:00:01",
        signalStrength: "-64 dBm",
        busProtocol: "I2C 0x48",
      },
      {
        id: "sen-hum",
        code: "SENSOR 02",
        technicalLabel: "HYGROMETRIC SENSOR",
        paramName: "HUMIDITY",
        value: "68.2",
        unit: "%",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-01",
        lastPacket: "T-00:00:01",
        signalStrength: "-64 dBm",
        busProtocol: "I2C 0x40",
      },
      {
        id: "sen-rain",
        code: "SENSOR 03",
        technicalLabel: "PLUVIOMETER GAUGE",
        paramName: "RAINFALL",
        value: "14.5",
        unit: "mm",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-01",
        lastPacket: "T-00:00:02",
        signalStrength: "-65 dBm",
        busProtocol: "GPIO Pulse",
      },
      {
        id: "sen-water",
        code: "SENSOR 04",
        technicalLabel: "HYDROSTATIC DEPTH",
        paramName: "WATER LEVEL",
        value: "2.18",
        unit: "m",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-01",
        lastPacket: "T-00:00:01",
        signalStrength: "-64 dBm",
        busProtocol: "ADC 12-bit",
      },
      {
        id: "sen-flow",
        code: "SENSOR 05",
        technicalLabel: "HYDRODYNAMIC FLOW RATE",
        paramName: "FLOW RATE",
        value: "1.85",
        unit: "m³/s",
        status: "OFFLINE",
        category: "sensor",
        sensorNode: "ESP32-NODE-01",
        lastPacket: "T-00:00:02",
        signalStrength: "-65 dBm",
        busProtocol: "Hall Sensor Pulse",
      },
    ],
    transport: {
      protocol: "MQTT / TLS 1.3",
      latency: "0.04 sec latency",
      broker: "BROKER QOS 1",
      connection: "STABLE (TLS 1.3)",
      qos: "QoS 1 (At least once)",
      tls: "TLS v1.3 / AES-256-GCM",
    },
  },

  // --------------------------------------------------------------------------
  // NODE 02 — FLOOD (ELEVATED RISK)
  // Sensors: Temperature, Humidity, Rainfall, Water Level, Flow Rate
  // --------------------------------------------------------------------------
  {
    id: "node-02",
    label: "NODE 02",
    type: "FLOOD",
    hardwareId: "ESP32-NODE-02",
    status: "ONLINE",
    sector: "SECTOR-02",
    location: "SECTOR-02 // RIVER BASIN NORTH",
    battery: "94%",
    firmware: "v2.1.4-sentinel",
    ml: {
      timestamp: 1789151010,
      riskScore: 0.584, // -> 58.4 / 100
      riskLevel: "ELEVATED",
      anomalyScore: 0.492, // -> 49.2 / 100
      correlationFactor: 0.845, // -> 84.5%
      confidence: 0.915, // -> 91.5%
      supportingNodes: ["NODE_002", "NODE_001"],
      observedNodes: 2,
      explanation: [
        "Precipitation rate exceeding 3-hour baseline average",
        "Surface water runoff accumulation detected downstream",
        "Corroborating telemetry received from adjacent Flood Node 01",
        "Hydrological variance within manageable dissipation threshold",
      ],
      isDemo: true,
    },
    hazard: {
      status: "Elevated",
      badgeText: "ELEVATED",
      anomalyStatus: "Moderate threshold deviation (1.8σ)",
      riskTrend: "Rising (+1.4% delta / hour)",
      predictedCondition: "Surface runoff accumulation expected in 6h",
      lastSync: "T-00:00:02",
      inferenceEngine: "Eco-Ensemble ML v2.4 (FastAPI)",
    },
    sensors: [
      {
        id: "sen-temp",
        code: "SENSOR 01",
        technicalLabel: "THERMAL TELEMETRY",
        paramName: "TEMPERATURE",
        value: "24.1",
        unit: "°C",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-02",
        lastPacket: "T-00:00:02",
        signalStrength: "-68 dBm",
        busProtocol: "I2C 0x48",
      },
      {
        id: "sen-hum",
        code: "SENSOR 02",
        technicalLabel: "HYGROMETRIC SENSOR",
        paramName: "HUMIDITY",
        value: "79.5",
        unit: "%",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-02",
        lastPacket: "T-00:00:02",
        signalStrength: "-68 dBm",
        busProtocol: "I2C 0x40",
      },
      {
        id: "sen-rain",
        code: "SENSOR 03",
        technicalLabel: "PLUVIOMETER GAUGE",
        paramName: "RAINFALL",
        value: "8.2",
        unit: "mm",
        status: "OFFLINE",
        category: "sensor",
        sensorNode: "ESP32-NODE-02",
        lastPacket: "T-00:00:03",
        signalStrength: "-69 dBm",
        busProtocol: "GPIO Pulse",
      },
      {
        id: "sen-water",
        code: "SENSOR 04",
        technicalLabel: "HYDROSTATIC DEPTH",
        paramName: "WATER LEVEL",
        value: "1.62",
        unit: "m",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-02",
        lastPacket: "T-00:00:01",
        signalStrength: "-67 dBm",
        busProtocol: "ADC 12-bit",
      },
      {
        id: "sen-flow",
        code: "SENSOR 05",
        technicalLabel: "HYDRODYNAMIC FLOW RATE",
        paramName: "FLOW RATE",
        value: "0.94",
        unit: "m³/s",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-02",
        lastPacket: "T-00:00:02",
        signalStrength: "-68 dBm",
        busProtocol: "Hall Sensor Pulse",
      },
    ],
    transport: {
      protocol: "MQTT / TLS 1.3",
      latency: "0.05 sec latency",
      broker: "BROKER QOS 1",
      connection: "STABLE (TLS 1.3)",
      qos: "QoS 1 (At least once)",
      tls: "TLS v1.3 / AES-256-GCM",
    },
  },

  // --------------------------------------------------------------------------
  // NODE 03 — LANDSLIDE (HIGH RISK)
  // Sensors: Land Tilt, Soil Moisture ONLY
  // --------------------------------------------------------------------------
  {
    id: "node-03",
    label: "NODE 03",
    type: "LANDSLIDE",
    hardwareId: "ESP32-NODE-03",
    status: "ONLINE",
    sector: "SECTOR-03",
    location: "SECTOR-03 // ESCARPMENT SLOPE",
    battery: "91%",
    firmware: "v2.1.4-sentinel",
    ml: {
      timestamp: 1789150998,
      riskScore: 0.742, // -> 74.2 / 100
      riskLevel: "HIGH",
      anomalyScore: 0.681, // -> 68.1 / 100
      correlationFactor: 0.892, // -> 89.2%
      confidence: 0.927, // -> 92.7%
      supportingNodes: ["NODE_003", "NODE_005"],
      observedNodes: 2,
      explanation: [
        "Slope angular displacement anomaly detected on northern embankment",
        "Subsurface soil saturation levels approaching shear failure limit",
        "Geotechnical displacement vector correlates with moisture saturation",
        "Elevated landslide risk for surrounding drainage corridor",
      ],
      isDemo: true,
    },
    hazard: {
      status: "High",
      badgeText: "HIGH RISK",
      anomalyStatus: "Angular deflection threshold exceeded (>2.8°)",
      riskTrend: "Accelerating (+3.1% delta / hour)",
      predictedCondition: "Slope slippage hazard identified on eastern escarpment",
      lastSync: "T-00:00:01",
      inferenceEngine: "Eco-Ensemble ML v2.4 (FastAPI)",
    },
    sensors: [
      {
        id: "sen-tilt",
        code: "SENSOR 01",
        technicalLabel: "INCLINOMETER / GYROSCOPE",
        paramName: "LAND TILT",
        value: "+2.8°",
        unit: "deg",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-03",
        lastPacket: "T-00:00:01",
        signalStrength: "-61 dBm",
        busProtocol: "I2C 0x68 (MPU6050)",
      },
      {
        id: "sen-soil",
        code: "SENSOR 02",
        technicalLabel: "VOLUMETRIC WATER CONTENT",
        paramName: "SOIL MOISTURE",
        value: "76.4",
        unit: "%",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-03",
        lastPacket: "T-00:00:02",
        signalStrength: "-63 dBm",
        busProtocol: "Capacitive SPI",
      },
    ],
    transport: {
      protocol: "MQTT / TLS 1.3",
      latency: "0.03 sec latency",
      broker: "BROKER QOS 1",
      connection: "STABLE (TLS 1.3)",
      qos: "QoS 1 (At least once)",
      tls: "TLS v1.3 / AES-256-GCM",
    },
  },

  // --------------------------------------------------------------------------
  // NODE 04 — FOREST FIRE (CRITICAL RISK)
  // Sensors: Temperature, Smoke, Humidity ONLY
  // --------------------------------------------------------------------------
  {
    id: "node-04",
    label: "NODE 04",
    type: "FOREST FIRE",
    hardwareId: "ESP32-NODE-04",
    status: "ONLINE",
    sector: "SECTOR-04",
    location: "SECTOR-04 // TIMBER RIDGE LINE",
    battery: "89%",
    firmware: "v2.1.4-sentinel",
    ml: {
      timestamp: 1789151018,
      riskScore: 0.884, // -> 88.4 / 100
      riskLevel: "CRITICAL",
      anomalyScore: 0.825, // -> 82.5 / 100
      correlationFactor: 0.934, // -> 93.4%
      confidence: 0.952, // -> 95.2%
      supportingNodes: ["NODE_004", "NODE_005"],
      observedNodes: 2,
      explanation: [
        "Extreme thermal signature combined with critical relative humidity drop",
        "Particulate ionization index indicates active combustion or heavy smoke plume",
        "Combustion risk algorithm confirms wildfire ignition likelihood",
        "High fire propagation risk across timber perimeter",
      ],
      isDemo: true,
    },
    hazard: {
      status: "Critical",
      badgeText: "CRITICAL",
      anomalyStatus: "Particulate ionization surge (>4.1σ above ambient)",
      riskTrend: "Rapid escalation (+6.2% delta / hour)",
      predictedCondition: "High wildfire ignition risk in sector timber line",
      lastSync: "T-00:00:01",
      inferenceEngine: "Eco-Ensemble ML v2.4 (FastAPI)",
    },
    sensors: [
      {
        id: "sen-temp",
        code: "SENSOR 01",
        technicalLabel: "THERMAL TELEMETRY",
        paramName: "TEMPERATURE",
        value: "39.8",
        unit: "°C",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-04",
        lastPacket: "T-00:00:01",
        signalStrength: "-59 dBm",
        busProtocol: "I2C 0x48",
      },
      {
        id: "sen-smoke",
        code: "SENSOR 02",
        technicalLabel: "PHOTOELECTRIC PARTICULATE / SMOKE",
        paramName: "SMOKE",
        value: "412",
        unit: "ppm",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-04",
        lastPacket: "T-00:00:01",
        signalStrength: "-60 dBm",
        busProtocol: "ADC 12-bit (MQ-2)",
      },
      {
        id: "sen-hum",
        code: "SENSOR 03",
        technicalLabel: "HYGROMETRIC SENSOR",
        paramName: "HUMIDITY",
        value: "18.4",
        unit: "%",
        status: "OFFLINE",
        category: "sensor",
        sensorNode: "ESP32-NODE-04",
        lastPacket: "T-00:00:02",
        signalStrength: "-59 dBm",
        busProtocol: "I2C 0x40",
      },
    ],
    transport: {
      protocol: "MQTT / TLS 1.3",
      latency: "0.02 sec latency",
      broker: "BROKER QOS 1",
      connection: "STABLE (TLS 1.3)",
      qos: "QoS 1 (At least once)",
      tls: "TLS v1.3 / AES-256-GCM",
    },
  },

  // --------------------------------------------------------------------------
  // NODE 05 — UNIVERSAL (ALL SUPPORTED SENSORS)
  // Sensors: Temperature, Humidity, Rainfall, Water Level, Flow Rate,
  //          Soil Moisture, Land Tilt, Smoke
  // --------------------------------------------------------------------------
  {
    id: "node-05",
    label: "NODE 05",
    type: "UNIVERSAL",
    hardwareId: "ESP32-NODE-05",
    status: "ONLINE",
    sector: "SECTOR-05",
    location: "SECTOR-05 // MULTI-MODAL STATION",
    battery: "96%",
    firmware: "v2.1.4-sentinel",
    ml: {
      timestamp: 1789151025,
      riskScore: 0.182, // -> 18.2 / 100
      riskLevel: "LOW",
      anomalyScore: 0.124, // -> 12.4 / 100
      correlationFactor: 0.961, // -> 96.1%
      confidence: 0.978, // -> 97.8%
      supportingNodes: ["NODE_005", "NODE_001", "NODE_002", "NODE_004"],
      observedNodes: 4,
      explanation: [
        "All 8 telemetry channels reporting within standard environmental tolerances",
        "Cross-modal synthesis shows no cross-vector hazardous propagation",
        "Hydrological, geotechnical, and atmospheric parameters nominal",
        "Multi-sensor array health rating optimal",
      ],
      isDemo: true,
    },
    hazard: {
      status: "Normal",
      badgeText: "NOMINAL",
      anomalyStatus: "Nominal baseline (<0.4σ variance across all channels)",
      riskTrend: "Stable (-0.2% delta / hour)",
      predictedCondition: "Clear conditions projected for 24h window",
      lastSync: "T-00:00:02",
      inferenceEngine: "Eco-Ensemble ML v2.4 (FastAPI)",
    },
    sensors: [
      {
        id: "sen-temp",
        code: "SENSOR 01",
        technicalLabel: "THERMAL TELEMETRY",
        paramName: "TEMPERATURE",
        value: "26.8",
        unit: "°C",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:02",
        signalStrength: "-70 dBm",
        busProtocol: "I2C 0x48",
      },
      {
        id: "sen-hum",
        code: "SENSOR 02",
        technicalLabel: "HYGROMETRIC SENSOR",
        paramName: "HUMIDITY",
        value: "64.5",
        unit: "%",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:02",
        signalStrength: "-70 dBm",
        busProtocol: "I2C 0x40",
      },
      {
        id: "sen-rain",
        code: "SENSOR 03",
        technicalLabel: "PLUVIOMETER GAUGE",
        paramName: "RAINFALL",
        value: "5.4",
        unit: "mm",
        status: "OFFLINE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:03",
        signalStrength: "-71 dBm",
        busProtocol: "GPIO Pulse",
      },
      {
        id: "sen-water",
        code: "SENSOR 04",
        technicalLabel: "HYDROSTATIC DEPTH",
        paramName: "WATER LEVEL",
        value: "1.15",
        unit: "m",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:01",
        signalStrength: "-69 dBm",
        busProtocol: "ADC 12-bit",
      },
      {
        id: "sen-flow",
        code: "SENSOR 05",
        technicalLabel: "HYDRODYNAMIC FLOW RATE",
        paramName: "FLOW RATE",
        value: "0.72",
        unit: "m³/s",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:02",
        signalStrength: "-70 dBm",
        busProtocol: "Hall Sensor Pulse",
      },
      {
        id: "sen-soil",
        code: "SENSOR 06",
        technicalLabel: "VOLUMETRIC WATER CONTENT",
        paramName: "SOIL MOISTURE",
        value: "38.2",
        unit: "%",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:02",
        signalStrength: "-70 dBm",
        busProtocol: "Capacitive SPI",
      },
      {
        id: "sen-tilt",
        code: "SENSOR 07",
        technicalLabel: "INCLINOMETER / GYROSCOPE",
        paramName: "LAND TILT",
        value: "+0.3°",
        unit: "deg",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:01",
        signalStrength: "-69 dBm",
        busProtocol: "I2C 0x68 (MPU6050)",
      },
      {
        id: "sen-smoke",
        code: "SENSOR 08",
        technicalLabel: "PHOTOELECTRIC PARTICULATE / SMOKE",
        paramName: "SMOKE",
        value: "24",
        unit: "ppm",
        status: "LIVE",
        category: "sensor",
        sensorNode: "ESP32-NODE-05",
        lastPacket: "T-00:00:02",
        signalStrength: "-71 dBm",
        busProtocol: "ADC 12-bit (MQ-2)",
      },
    ],
    transport: {
      protocol: "MQTT / TLS 1.3",
      latency: "0.06 sec latency",
      broker: "BROKER QOS 1",
      connection: "STABLE (TLS 1.3)",
      qos: "QoS 1 (At least once)",
      tls: "TLS v1.3 / AES-256-GCM",
    },
  },

  // --------------------------------------------------------------------------
  // NODE 06 — LIVE SENSOR (RESERVED FOR FUTURE REAL HARDWARE INGEST)
  // Ready for live sensor stream attachment
  // --------------------------------------------------------------------------
  {
    id: "node-06",
    label: "NODE 06",
    type: "LIVE SENSOR",
    hardwareId: "ESP32-LIVE-01",
    status: "STANDBY",
    sector: "SECTOR-06",
    location: "FIELD HARDWARE SOCKET // PORT A",
    battery: "100%",
    firmware: "v2.1.4-sentinel",
    ml: {
      timestamp: 1789151030,
      riskScore: 0.100, // -> 10.0 / 100
      riskLevel: "LOW",
      anomalyScore: 0.050, // -> 5.0 / 100
      correlationFactor: 0.990, // -> 99.0%
      confidence: 0.990, // -> 99.0%
      supportingNodes: ["LIVE_NODE_001"],
      observedNodes: 1,
      explanation: [
        "Node reserved for direct physical sensor serial or MQTT ingest",
        "Awaiting active telemetry stream from field hardware interface",
        "Inference engine pipeline standing by for live packet ingestion",
      ],
      isDemo: true,
    },
    hazard: {
      status: "Normal",
      badgeText: "STANDBY",
      anomalyStatus: "Socket initialized • Awaiting field hardware packet stream",
      riskTrend: "Nominal (Standby mode)",
      predictedCondition: "Ready for live sensor stream attachment",
      lastSync: "T-00:00:05",
      inferenceEngine: "Eco-Ensemble ML v2.4 (FastAPI)",
    },
    sensors: [
      {
        id: "sen-temp",
        code: "SENSOR 01",
        technicalLabel: "THERMAL TELEMETRY",
        paramName: "TEMPERATURE",
        value: "--",
        unit: "°C",
        status: "STANDBY",
        category: "sensor",
        sensorNode: "ESP32-LIVE-01",
        lastPacket: "AWAITING INGEST",
        signalStrength: "- dBm",
        busProtocol: "I2C 0x48",
      },
      {
        id: "sen-hum",
        code: "SENSOR 02",
        technicalLabel: "HYGROMETRIC SENSOR",
        paramName: "HUMIDITY",
        value: "--",
        unit: "%",
        status: "STANDBY",
        category: "sensor",
        sensorNode: "ESP32-LIVE-01",
        lastPacket: "AWAITING INGEST",
        signalStrength: "- dBm",
        busProtocol: "I2C 0x40",
      },
      {
        id: "sen-rain",
        code: "SENSOR 03",
        technicalLabel: "PLUVIOMETER GAUGE",
        paramName: "RAINFALL",
        value: "--",
        unit: "mm",
        status: "STANDBY",
        category: "sensor",
        sensorNode: "ESP32-LIVE-01",
        lastPacket: "AWAITING INGEST",
        signalStrength: "- dBm",
        busProtocol: "GPIO Pulse",
      },
      {
        id: "sen-water",
        code: "SENSOR 04",
        technicalLabel: "HYDROSTATIC DEPTH",
        paramName: "WATER LEVEL",
        value: "--",
        unit: "m",
        status: "STANDBY",
        category: "sensor",
        sensorNode: "ESP32-LIVE-01",
        lastPacket: "AWAITING INGEST",
        signalStrength: "- dBm",
        busProtocol: "ADC 12-bit",
      },
      {
        id: "sen-soil",
        code: "SENSOR 05",
        technicalLabel: "VOLUMETRIC WATER CONTENT",
        paramName: "SOIL MOISTURE",
        value: "--",
        unit: "%",
        status: "STANDBY",
        category: "sensor",
        sensorNode: "ESP32-LIVE-01",
        lastPacket: "AWAITING INGEST",
        signalStrength: "- dBm",
        busProtocol: "Capacitive SPI",
      },
    ],
    transport: {
      protocol: "MQTT / TLS 1.3",
      latency: "Awaiting Socket",
      broker: "BROKER QOS 1",
      connection: "STANDBY (READY)",
      qos: "QoS 1 (At least once)",
      tls: "TLS v1.3 / AES-256-GCM",
    },
  },
];

// Helper for icon mapping
const SENSOR_ICONS: Record<string, LucideIcon> = {
  "sen-temp": Thermometer,
  "sen-hum": Droplets,
  "sen-rain": CloudRain,
  "sen-water": Waves,
  "sen-flow": Gauge,
  "sen-soil": Layers,
  "sen-tilt": Compass,
  "sen-smoke": Flame,
};

const FASTAPI_SENSOR_IDS = new Set(NODES_DATA.find((node) => node.id === "node-06")?.sensors.map((sensor) => sensor.id) || []);
const SENSOR_STALE_AFTER_MS = 30_000;

function getSensorStatus(sensor: SensorTelemetryItem, now: number): SensorTelemetryItem["status"] {
  if (sensor.sensorNode !== "ESP32-LIVE-01") {
    return sensor.status === "SYNCED" ? "LIVE" : sensor.status;
  }
  if (sensor.status === "STANDBY" || sensor.status === "DISCONNECTED") return "DISCONNECTED";
  if (sensor.status === "OFFLINE") return "OFFLINE";
  if (sensor.receivedAt === undefined) return "DISCONNECTED";
  return now - sensor.receivedAt < SENSOR_STALE_AFTER_MS ? "LIVE" : "OFFLINE";
}

function formatPacketAge(sensor: SensorTelemetryItem, now: number) {
  if (sensor.receivedAt === undefined) return "No packet received";
  const elapsedSeconds = Math.max(0, Math.floor((now - sensor.receivedAt) / 1000));
  if (elapsedSeconds < 5) return "Just now";
  if (elapsedSeconds < 60) return `${elapsedSeconds} sec ago`;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours} hr ago`;
}

function seedReceivedAt(sensor: SensorTelemetryItem, now: number): SensorTelemetryItem {
  if (sensor.status === "OFFLINE") {
    const sensorNumber = Number(sensor.code.match(/\d+/)?.[0]) || 1;
    return { ...sensor, receivedAt: now - (5 + sensorNumber) * 60_000 };
  }
  if (sensor.status !== "LIVE" && sensor.status !== "SYNCED") return sensor;
  const relativePacketAge = sensor.lastPacket?.match(/^T-00:00:(\d+)$/);
  const ageSeconds = relativePacketAge ? Number(relativePacketAge[1]) : 0;
  return { ...sensor, receivedAt: now - ageSeconds * 1000 };
}

function readFastApiSensorPacket(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const source = payload as Record<string, unknown>;
  const candidate = source.sensors || source.readings || source.data || source;
  if (Array.isArray(candidate)) {
    return { ...source, ...Object.fromEntries(candidate.map((item) => {
      const record = item as Record<string, unknown>;
      return [String(record.id || record.sensorId || record.code || record.paramName || ""), record];
    })) };
  }
  return candidate && typeof candidate === "object"
    ? { ...source, ...candidate as Record<string, unknown> }
    : source;
}

function getFastApiSensorValue(packet: Record<string, unknown>, sensor: SensorTelemetryItem) {
  const normalizedName = sensor.paramName.toLowerCase().replaceAll(" ", "_");
  const aliases = [sensor.id, sensor.code, sensor.paramName, normalizedName, normalizedName.toUpperCase()];
  const raw = aliases.map((key) => packet[key]).find((value) => value !== undefined && value !== null);
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    return record.value ?? record.reading ?? record.amount;
  }
  return raw;
}

function getFastApiValue(packet: Record<string, unknown>, ...keys: string[]) {
  const sources = [packet, packet.ml, packet.intelligence, packet.hazard]
    .filter((source): source is Record<string, unknown> => Boolean(source && typeof source === "object"));
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return undefined;
}

function getFastApiNumber(packet: Record<string, unknown>, ...keys: string[]) {
  const value = getFastApiValue(packet, ...keys);
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function EnvironmentalDashboardSection() {
  const [seedGraph] = useState(() => loadEnvironmentalGraph(NODES_DATA));
  // Selected Node State (NODE 01 through NODE 06)
  const [selectedNodeId, setSelectedNodeId] = useState<string>(seedGraph.nodes[0]?.id || "node-01");
  const [nodes, setNodes] = useState<EnvironmentalNode[]>(() => {
    const now = Date.now();
    return seedGraph.nodes.map((node) => ({
      ...node,
      sensors: node.sensors.map((sensor) => seedReceivedAt(sensor, now)),
    }));
  });
  const [networks, setNetworks] = useState<EnvironmentalNetwork[]>(seedGraph.networks);
  const [connections, setConnections] = useState<EnvironmentalConnection[]>(seedGraph.connections);
  const [selectedNetworkId, setSelectedNetworkId] = useState(seedGraph.networks[0]?.id || "assam-brahmaputra");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [telemetryClock, setTelemetryClock] = useState(() => Date.now());
  const currentNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [shouldMountMap, setShouldMountMap] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapFocusMode, setMapFocusMode] = useState(false);

  // Progressive disclosure states (secondary info revealed on demand)
  const [showHazardDetails, setShowHazardDetails] = useState<boolean>(false);
  const [showTransportDetails, setShowTransportDetails] = useState<boolean>(false);
  const [expandedSensorIds, setExpandedSensorIds] = useState<Set<string>>(() => new Set());

  const toggleSensorExpansion = (id: string) => {
    setExpandedSensorIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  React.useEffect(() => {
    const interval = window.setInterval(() => setTelemetryClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const sampleDemoSensors = () => {
      const receivedAt = Date.now();
      setNodes((previous) => previous.map((node) => {
        if (!node.demoData) return node;
        return {
          ...node,
          sensors: node.sensors.map((sensor, index) => {
            const center = Number(sensor.value);
            if (!Number.isFinite(center)) return sensor;
            const value = Number((center + Math.sin(receivedAt / 9000 + index) * Math.max(Math.abs(center) * 0.025, 0.08)).toFixed(2));
            return {
              ...sensor,
              value: String(value),
              status: "SYNCED",
              receivedAt,
              lastPacket: "DEMO // JUST NOW",
              history: [...(sensor.history || []), value].slice(-20),
            };
          }),
        };
      }));
    };
    sampleDemoSensors();
    const interval = window.setInterval(sampleDemoSensors, 5000);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(ENVIRONMENTAL_GRAPH_STORAGE_KEY, JSON.stringify({ version: 7, nodes, networks, connections }));
    } catch {
      // Keep the dashboard usable if storage is disabled or full.
    }
  }, [connections, networks, nodes]);

  React.useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") {
      setShouldMountMap(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMountMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isMapFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMapFullscreen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapFullscreen]);

  React.useEffect(() => {
    const baseUrl = String(import.meta.env.VITE_FASTAPI_BASE_URL || "").trim().replace(/\/$/, "");
    const path = String(import.meta.env.VITE_FASTAPI_NODE06_PATH || "/api/sensors/node-06").trim();
    const apiKey = String(import.meta.env.VITE_FASTAPI_API_KEY || "").trim();
    if (!baseUrl || !apiKey || !FASTAPI_SENSOR_IDS.size) {
      setNodes((previous) => previous.map((node) => node.id === "node-06"
        ? {
            ...node,
            status: "STANDBY",
            sensors: node.sensors.map((sensor) => ({
              ...sensor,
              value: "--",
              status: "DISCONNECTED",
              receivedAt: undefined,
              lastPacket: "NO PACKET",
            })),
          }
        : node));
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
          headers: import.meta.env.VITE_FASTAPI_API_KEY
            ? { Authorization: `Bearer ${import.meta.env.VITE_FASTAPI_API_KEY}` }
            : undefined,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`FastAPI ${response.status}`);
        const packet = readFastApiSensorPacket(await response.json());
        if (cancelled) return;

        setNodes((previous) => previous.map((node) => {
          if (node.id !== "node-06") return node;
          const sensors = node.sensors.map((sensor) => {
            const value = getFastApiSensorValue(packet, sensor);
            const connected = value !== undefined && value !== null && value !== "";
            return {
              ...sensor,
              value: connected ? String(value) : "--",
              status: connected ? "LIVE" : "DISCONNECTED",
              receivedAt: connected ? Date.now() : undefined,
              lastPacket: connected ? "LIVE // JUST NOW" : "NO PACKET",
            } as SensorTelemetryItem;
          });
          const activeCount = sensors.filter((sensor) => sensor.status === "LIVE").length;
          const riskScore = getFastApiNumber(packet, "riskScore", "risk_score");
          const anomalyScore = getFastApiNumber(packet, "anomalyScore", "anomaly_score");
          const correlationFactor = getFastApiNumber(packet, "correlationFactor", "correlation_factor");
          const confidence = getFastApiNumber(packet, "confidence");
          const timestamp = getFastApiNumber(packet, "timestamp", "updatedAt", "updated_at");
          const riskLevel = String(getFastApiValue(packet, "riskLevel", "risk_level") || "").toUpperCase();
          const hazardStatusRaw = String(getFastApiValue(packet, "status", "hazardStatus", "hazard_status") || "").toLowerCase();
          const hazardStatus = hazardStatusRaw ? `${hazardStatusRaw[0].toUpperCase()}${hazardStatusRaw.slice(1)}` : "";
          const validHazardStatus = hazardStatus === "Normal" || hazardStatus === "Elevated" || hazardStatus === "High" || hazardStatus === "Critical";
          const explanation = getFastApiValue(packet, "explanation", "diagnostic", "message");
          const supportingNodes = getFastApiValue(packet, "supportingNodes", "supporting_nodes");
          const observedNodes = getFastApiNumber(packet, "observedNodes", "observed_nodes");
          return {
            ...node,
            status: activeCount > 0 ? "ONLINE" : "OFFLINE",
            sensors,
            ml: {
              ...node.ml,
              ...(riskScore === undefined ? {} : { riskScore: riskScore > 1 ? riskScore / 100 : riskScore }),
              ...(anomalyScore === undefined ? {} : { anomalyScore: anomalyScore > 1 ? anomalyScore / 100 : anomalyScore }),
              ...(correlationFactor === undefined ? {} : { correlationFactor: correlationFactor > 1 ? correlationFactor / 100 : correlationFactor }),
              ...(confidence === undefined ? {} : { confidence: confidence > 1 ? confidence / 100 : confidence }),
              ...(timestamp === undefined ? {} : { timestamp: timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp }),
              ...(riskLevel === "LOW" || riskLevel === "ELEVATED" || riskLevel === "HIGH" || riskLevel === "CRITICAL" ? { riskLevel } : {}),
              ...(Array.isArray(supportingNodes) ? { supportingNodes: supportingNodes.map(String) } : {}),
              ...(observedNodes === undefined ? {} : { observedNodes }),
              ...(Array.isArray(explanation) ? { explanation: explanation.map(String) } : typeof explanation === "string" ? { explanation: [explanation] } : {}),
            },
            hazard: {
              ...node.hazard,
              ...(validHazardStatus ? { status: hazardStatus } : {}),
              ...(typeof getFastApiValue(packet, "anomalyStatus", "anomaly_status") === "string" ? { anomalyStatus: String(getFastApiValue(packet, "anomalyStatus", "anomaly_status")) } : {}),
              ...(typeof getFastApiValue(packet, "riskTrend", "risk_trend") === "string" ? { riskTrend: String(getFastApiValue(packet, "riskTrend", "risk_trend")) } : {}),
              ...(typeof getFastApiValue(packet, "predictedCondition", "predicted_condition") === "string" ? { predictedCondition: String(getFastApiValue(packet, "predictedCondition", "predicted_condition")) } : {}),
              lastSync: "LIVE // JUST NOW",
            },
            transport: { ...node.transport, connection: `${activeCount}/${sensors.length} CHANNELS LIVE` },
          };
        }));
      } catch {
        if (cancelled) return;
        setNodes((previous) => previous.map((node) => node.id === "node-06"
          ? {
              ...node,
              status: "OFFLINE",
              sensors: node.sensors.map((sensor) => ({
                ...sensor,
                status: sensor.receivedAt === undefined ? "DISCONNECTED" : "OFFLINE",
              })),
            }
          : node));
      }
    };

    poll();
    const interval = window.setInterval(poll, Number(import.meta.env.VITE_FASTAPI_POLL_INTERVAL_MS || 5000));
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const mapsAppUrl = import.meta.env.VITE_MAPS_APP_URL || "/maps/";

  const selectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setExpandedSensorIds(new Set());
    setSelectedConnectionId(null);
    const node = nodes.find((item) => item.id === nodeId);
    if (node) setSelectedNetworkId(node.networkId);
  };

  const selectNetwork = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setSelectedConnectionId(null);
    const networkNode = nodes.find((node) => node.networkId === networkId && node.type === "MASTER")
      || nodes.find((node) => node.networkId === networkId);
    if (networkNode) selectNode(networkNode.id);
  };

  const createNode = (input: NewEnvironmentalNode) => {
    const id = input.id || `custom-${Date.now()}`;
    const node = createEnvironmentalNode(NODES_DATA[0], { ...input, id });
    setNodes((previous) => [...previous, node]);
    setSelectedNetworkId(node.networkId);
    selectNode(node.id);
  };

  const updateNode = (nodeId: string, input: NewEnvironmentalNode) => {
    setNodes((previous) => previous.map((node) => node.id === nodeId
      ? updateEnvironmentalNode(node, { ...input, id: nodeId })
      : node));
  };

  const deleteNode = (nodeId: string) => {
    const remaining = nodes.filter((node) => node.id !== nodeId);
    setNodes(remaining);
    setConnections((previous) => previous.filter((connection) => connection.sourceId !== nodeId && connection.targetId !== nodeId));
    if (selectedNodeId === nodeId && remaining[0]) selectNode(remaining[0].id);
  };

  const createConnection = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const existing = connections.find((connection) =>
      (connection.sourceId === sourceId && connection.targetId === targetId)
      || (connection.sourceId === targetId && connection.targetId === sourceId),
    );
    if (existing) {
      setSelectedConnectionId(existing.id);
      return;
    }
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const targetNode = nodes.find((node) => node.id === targetId);
    if (!sourceNode || !targetNode || sourceNode.networkId !== targetNode.networkId) return;

    const degree = (nodeId: string) => connections.filter((connection) =>
      connection.sourceId === nodeId || connection.targetId === nodeId,
    ).length;
    if (degree(sourceId) >= 2 || degree(targetId) >= 2) return;

    const pending = [sourceId];
    const visited = new Set<string>();
    while (pending.length > 0) {
      const currentId = pending.pop()!;
      if (currentId === targetId) return;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      for (const connection of connections) {
        if (connection.sourceId === currentId) pending.push(connection.targetId);
        if (connection.targetId === currentId) pending.push(connection.sourceId);
      }
    }

    setConnections((previous) => [...previous, {
      id: `link-${Date.now().toString(36)}`,
      networkId: sourceNode.networkId,
      sourceId,
      targetId,
      kind: sourceNode?.type === "MASTER" || sourceNode?.type === "GATEWAY / RELAY" ? "gateway" : "mesh",
    }]);
  };

  const createNetwork = (input: Omit<EnvironmentalNetwork, "id" | "altitude" | "color">) => {
    const network: EnvironmentalNetwork = {
      ...input,
      id: `network-${Date.now().toString(36)}`,
      altitude: 360000,
      color: networks.length % 2 === 0 ? "#38bdf8" : "#a3e635",
    };
    setNetworks((previous) => [...previous, network]);
    setSelectedNetworkId(network.id);
    setSelectedConnectionId(null);
  };

  const renameNetwork = (networkId: string, name: string, region: string) => {
    setNetworks((previous) => previous.map((network) => network.id === networkId
      ? { ...network, name, region }
      : network));
  };

  const currentNodeConnections = connections.filter((connection) =>
    connection.sourceId === currentNode.id || connection.targetId === currentNode.id,
  );
  const currentNodeLastUpdate = currentNode.sensors.reduce<number | undefined>(
    (latest, sensor) => sensor.receivedAt === undefined ? latest : Math.max(latest || 0, sensor.receivedAt),
    undefined,
  );
  const thresholdViolations = currentNode.sensors.filter((sensor) => {
    const value = Number(sensor.value);
    return Number.isFinite(value) && (
      (sensor.threshold?.maximum !== undefined && value > sensor.threshold.maximum)
      || (sensor.threshold?.minimum !== undefined && value < sensor.threshold.minimum)
    );
  });

  // Status badge styling helper based on hazard condition
  const getHazardBadgeClass = (status: HazardStatusState["status"]) => {
    switch (status) {
      case "Normal":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Elevated":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "High":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "Critical":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  // Formatted ML values
  const riskScoreFormatted = formatScore100(currentNode.ml.riskScore);
  const anomalyScoreFormatted = formatScore100(currentNode.ml.anomalyScore);
  const correlationFactorFormatted = formatPercent(currentNode.ml.correlationFactor);
  const confidenceFormatted = formatPercent(currentNode.ml.confidence);
  const timestampFormatted = formatTimestamp(currentNode.ml.timestamp);
  const riskGaugePercent = Math.min(100, Math.max(0, currentNode.ml.riskScore <= 1 ? currentNode.ml.riskScore * 100 : currentNode.ml.riskScore));

  // Paragraph joining explanation array
  const explanationParagraph = currentNode.ml.explanation.join(". ") + (currentNode.ml.explanation.length > 0 ? "." : "");

  return (
    <section
      id="environmental-dashboard-section"
      className="relative w-full bg-black text-zinc-100 py-16 sm:py-24 lg:py-28 border-t border-zinc-900/90"
    >
      {/* Subtle ambient lighting consistent with EcoSentinel deep-tech aesthetic */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#27272a0c_1px,transparent_1px),linear-gradient(to_bottom,#27272a0c_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/[0.025] blur-[140px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* ================================================================ */}
        {/* MAIN DASHBOARD CONTAINER: 30% NODE DATA + 70% MAP WORKSPACE     */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] gap-6 lg:gap-8 items-stretch">
          
          {/* ============================================================== */}
          {/* 1. LEFT DATA AREA (~ 1/3 SCREEN WIDTH) - MULTI-NODE SENTINEL   */}
          {/* Fixed height container matching map; internal content scrolls */}
          {/* ============================================================== */}
          <div className="flex flex-col h-[650px] lg:h-[760px]">
            
            {/* 1. Top Header: Always Visible Outside the Scrollable Region */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.35 }}
              className="pb-3 shrink-0"
            >
              {/* Telemetry pill & hardware status */}
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[11px] font-mono font-medium text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>{currentNode.status === "STANDBY" ? "STANDBY" : "LIVE"}</span>
                  <span className="text-zinc-600 font-sans">•</span>
                  <span className="text-zinc-400">Telemetry Ingest</span>
                </div>

                {/* Active node identifier */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono">
                  <span className="font-semibold text-zinc-100">{currentNode.label}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-emerald-400 font-semibold">{currentNode.type}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-zinc-400">{currentNode.hardwareId}</span>
                  <span className={cn(
                    "font-medium ml-1",
                    currentNode.status === "ONLINE" ? "text-emerald-400" : "text-amber-400"
                  )}>
                    ● {currentNode.status}
                  </span>
                </div>
              </div>

              {/* Compact active-network node selector */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-lg bg-zinc-950/90 border border-zinc-800/90 mb-2.5">
                {nodes.filter((node) => node.networkId === selectedNetworkId).map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        selectNode(node.id);
                      }}
                      className={cn(
                        "py-1 px-1 text-center text-[10px] sm:text-[11px] font-mono tracking-wider rounded transition-all select-none cursor-pointer truncate",
                        isSelected
                          ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold shadow-sm"
                          : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                      )}
                      aria-label={`Select ${node.label} - ${node.type}`}
                      aria-pressed={isSelected}
                    >
                      {node.label}
                    </button>
                  );
                })}
              </div>

              {/* Title row */}
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 uppercase">
                  LIVE ENVIRONMENTAL DATA
                </h2>
                    <span className="text-[10px] font-mono text-emerald-400/90 uppercase tracking-widest font-semibold">
                  {currentNode.name || currentNode.label} — {currentNode.type}
                </span>
              </div>
            </motion.div>

            {/* 2. Scrollable Content Region with custom subtle dark scrollbar */}
            <div className="flex-1 overflow-y-auto pr-2 custom-dashboard-scrollbar space-y-3.5">

              <div className="rounded-lg border border-emerald-500/25 bg-zinc-950/90 p-3.5 font-mono">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-widest text-emerald-400">ACTIVE ENVIRONMENTAL NODE</div>
                    <h3 className="mt-1 truncate text-sm font-semibold text-zinc-100">{currentNode.name || currentNode.label}</h3>
                    <div className="mt-1 truncate text-[10px] text-zinc-400">{currentNode.id} · {currentNode.type}</div>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded border px-2 py-1 text-[9px] font-semibold",
                    currentNode.status === "ONLINE" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                  )}>{currentNode.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-zinc-900 pt-2.5 text-[9px]">
                  <div><span className="text-zinc-500">BATTERY</span><div className="mt-0.5 text-zinc-200">{currentNode.battery}</div></div>
                  <div><span className="text-zinc-500">CONNECTIVITY</span><div className="mt-0.5 truncate text-emerald-300">{currentNode.transport.connection}</div></div>
                  <div><span className="text-zinc-500">LAST UPDATE</span><div className="mt-0.5 text-zinc-200">{currentNodeLastUpdate ? formatPacketAge({ receivedAt: currentNodeLastUpdate } as SensorTelemetryItem, telemetryClock) : "No packet"}</div></div>
                  <div><span className="text-zinc-500">NETWORK LINKS</span><div className="mt-0.5 text-zinc-200">{currentNodeConnections.length}</div></div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-900 pt-2 text-[9px]">
                  <span className="text-zinc-400">{currentNode.sensors.length} ATTACHED SENSORS</span>
                  <span className={thresholdViolations.length ? "text-rose-400" : "text-emerald-400"}>
                    {thresholdViolations.length ? `${thresholdViolations.length} THRESHOLD ALERT${thresholdViolations.length === 1 ? "" : "S"}` : "NO THRESHOLD VIOLATIONS"}
                  </span>
                </div>
              </div>
              
              {/* ============================================================ */}
              {/* 2. CURRENT HAZARD STATUS (COMFORTABLE SIZING)                */}
              {/* ============================================================ */}
              <motion.div
                key={`hazard-${currentNode.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm p-3.5 sm:p-4 shadow-md relative overflow-hidden"
              >
                {/* Subtle top indicator line denoting ML intelligence */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/50 via-emerald-400/20 to-transparent" />

                {/* Main always-visible status line */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      CURRENT HAZARD STATUS
                    </div>
                    <div className="mt-1 flex items-center gap-2.5">
                      <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 uppercase">
                        {currentNode.hazard.status}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-widest font-semibold px-2 py-0.5 rounded border",
                          getHazardBadgeClass(currentNode.hazard.status)
                        )}
                      >
                        {currentNode.hazard.badgeText || currentNode.hazard.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="text-[10px] font-mono text-zinc-400">SYSTEM HEALTH</div>
                    <div className="text-xs font-mono text-emerald-400 font-medium flex items-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>OPERATIONAL</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible toggle for Hazard Details */}
                <div className="mt-3 pt-2.5 border-t border-zinc-900/90 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowHazardDetails((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer select-none"
                    aria-expanded={showHazardDetails}
                  >
                    <span>HAZARD DETAILS</span>
                    {showHazardDetails ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>

                  <span className="text-[10px] font-mono text-zinc-500">
                    ML SYNTHESIS // HAZARD ENGINE
                  </span>
                </div>

                {/* Collapsible Conditions Drawer */}
                <AnimatePresence>
                  {showHazardDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between gap-2 bg-zinc-900/50 px-3 py-2 rounded border border-zinc-900">
                          <span className="text-zinc-400 text-[11px]">ANOMALY STATUS</span>
                          <span className="text-zinc-200 text-right text-[11px] font-medium">
                            {currentNode.hazard.anomalyStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-zinc-900/50 px-3 py-2 rounded border border-zinc-900">
                          <span className="text-zinc-400 text-[11px]">RISK TREND</span>
                          <span className="text-zinc-200 text-right text-[11px] font-medium flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                            {currentNode.hazard.riskTrend}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-zinc-900/50 px-3 py-2 rounded border border-zinc-900">
                          <span className="text-zinc-400 text-[11px]">PREDICTED CONDITION</span>
                          <span className="text-zinc-200 text-right text-[11px] font-medium">
                            {currentNode.hazard.predictedCondition}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ============================================================ */}
              {/* 3. UPGRADED AI RISK INTELLIGENCE & ML ENGINE METRICS         */}
              {/* Preserves 0-100 gauge + adds 8 core ML fields & explanation */}
              {/* ============================================================ */}
              <motion.div
                key={`ml-${currentNode.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 }}
                className="rounded-xl border border-emerald-500/25 bg-zinc-950/90 backdrop-blur-sm p-3.5 sm:p-4 shadow-md relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      AI RISK INTELLIGENCE // ML SYNTHESIS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {currentNode.ml.observedNodes} NODES CORROBORATED
                  </span>
                </div>

                {/* Primary Risk Score & Risk Level */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      RISK SCORE
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className={cn("text-2xl sm:text-3xl font-bold font-mono tracking-tight", getRiskLevelTextClass(currentNode.ml.riskLevel))}>
                        {riskScoreFormatted}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">/ 100</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      RISK LEVEL
                    </div>
                    <span className={cn("inline-block text-[11px] font-mono uppercase font-bold px-2.5 py-1 rounded border", getRiskLevelBadgeClass(currentNode.ml.riskLevel))}>
                      {currentNode.ml.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Horizontal Visual Gauge (0–100) */}
                <div className="mt-3">
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", getRiskGaugeGradient(currentNode.ml.riskLevel))}
                      style={{ width: `${riskGaugePercent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>0 (SAFE)</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100 (CRITICAL)</span>
                  </div>
                </div>

                {/* ML Specific Metrics Grid (Compact 2x2 technical row) */}
                <div className="mt-3 pt-2.5 border-t border-zinc-900 grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* Anomaly Score */}
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">ANOMALY SCORE</span>
                    <span className="text-zinc-100 font-semibold mt-0.5">{anomalyScoreFormatted} / 100</span>
                  </div>

                  {/* Correlation Factor */}
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">CORRELATION</span>
                    <span className="text-zinc-100 font-semibold mt-0.5">{correlationFactorFormatted}</span>
                  </div>

                  {/* Confidence */}
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">CONFIDENCE</span>
                    <span className="text-emerald-400 font-semibold mt-0.5">{confidenceFormatted}</span>
                  </div>

                  {/* Packet Timestamp */}
                  <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/80 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">TIMESTAMP</span>
                    <span className="text-zinc-200 text-[10px] font-medium mt-0.5 truncate" title={timestampFormatted.fullStr}>
                      {timestampFormatted.fullStr}
                    </span>
                  </div>
                </div>

                {/* Supporting Nodes & Observed Nodes */}
                <div className="mt-2.5 pt-2.5 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-1">
                      SUPPORTING NODES:
                    </span>
                    {currentNode.ml.supportingNodes.map((n) => (
                      <span
                        key={n}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono"
                      >
                        [{n}]
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-zinc-400">
                    OBSERVED: <strong className="text-zinc-200">{currentNode.ml.observedNodes} NODES</strong>
                  </span>
                </div>

                {/* WHY THIS RISK? (Explanation Paragraph) */}
                <div className="mt-3 pt-2.5 border-t border-zinc-900">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-emerald-400" />
                    <span>WHY THIS RISK? // DIAGNOSTIC SYNTHESIS</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/90 text-xs font-sans text-zinc-200 leading-relaxed">
                    {explanationParagraph}
                  </div>
                </div>
              </motion.div>

              {/* ============================================================ */}
              {/* 4. SENSOR DATA SECTION (DYNAMIC NODE-SPECIFIC TELEMETRY)      */}
              {/* Dynamically mapped to selected node's sensor set              */}
              {/* ============================================================ */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{currentNode.label} — {currentNode.type} TELEMETRY</span>
                  </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                    {currentNode.sensors.filter((sensor) => getSensorStatus(sensor, telemetryClock) === "LIVE").length}/{currentNode.sensors.length} CHANNELS ACTIVE
                  </span>
                </div>

                {/* 2-Column Grid for the dynamic sensor cards with comfortable padding */}
                <div className="grid grid-cols-2 gap-3">
                  {currentNode.sensors.map((sensor, idx) => {
                    const Icon = SENSOR_ICONS[sensor.id] || Radio;
                    const isExpanded = expandedSensorIds.has(sensor.id);
                    const sensorStatus = getSensorStatus(sensor, telemetryClock);
                    const packetAge = formatPacketAge(sensor, telemetryClock);
                    const isOddLast = (idx === currentNode.sensors.length - 1 && currentNode.sensors.length % 2 !== 0);
                    const numericValue = Number(sensor.value);
                    const thresholdExceeded = Number.isFinite(numericValue) && (
                      (sensor.threshold?.maximum !== undefined && numericValue > sensor.threshold.maximum)
                      || (sensor.threshold?.minimum !== undefined && numericValue < sensor.threshold.minimum)
                    );
                    const history = sensor.history || [];
                    const historyValues = history.length ? history : [numericValue, numericValue, numericValue];
                    const historyMin = Math.min(...historyValues);
                    const historyRange = Math.max(0.01, Math.max(...historyValues) - historyMin);
                    const historyPoints = historyValues.map((value, historyIndex) =>
                      `${(historyIndex / Math.max(1, historyValues.length - 1)) * 100},${22 - ((value - historyMin) / historyRange) * 18}`,
                    ).join(" ");

                    return (
                      <motion.div
                        key={`${currentNode.id}-${sensor.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ duration: 0.35, delay: 0.04 * idx }}
                        onClick={() => toggleSensorExpansion(sensor.id)}
                        className={cn(
                          "relative rounded-xl border bg-zinc-950/85 backdrop-blur-sm p-3.5 sm:p-4 transition-all cursor-pointer select-none flex flex-col justify-between",
                          isOddLast ? "col-span-2" : "col-span-1",
                            isExpanded
                            ? sensorStatus === "DISCONNECTED"
                              ? "border-red-500/50 bg-red-950/20 shadow-lg"
                              : sensorStatus === "OFFLINE"
                                ? "border-amber-500/50 bg-amber-950/20 shadow-lg"
                              : "border-emerald-500/40 bg-zinc-900/60 shadow-lg"
                            : "border-zinc-800/80 hover:border-zinc-700/90 hover:bg-zinc-900/30"
                        )}
                      >
                        {sensorStatus === "DISCONNECTED" && (
                          <span className="pointer-events-none absolute right-3 top-3 flex h-3 w-3" aria-label="Sensor disconnected">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70 [animation-iteration-count:2]" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                          </span>
                        )}
                        {/* Top row: Label + Icon + Expand Indicator */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-1">
                            <span className="truncate tracking-wider">{sensor.code}</span>
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-zinc-500" />
                              )}
                            </div>
                          </div>

                          {/* Technical Label */}
                          <div className="text-[9px] font-mono text-zinc-500 truncate">
                            {sensor.technicalLabel}
                          </div>

                          {/* Parameter Name */}
                          <div className="text-xs font-semibold tracking-wider text-zinc-300 uppercase mt-0.5 truncate">
                            {sensor.paramName}
                          </div>
                        </div>

                        {/* Primary Value (Prominent text-2xl font-bold font-mono) */}
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold font-mono text-zinc-50 tracking-tight">
                            {sensor.value}
                          </span>
                          <span className="text-xs font-mono font-medium text-zinc-400">
                            {sensor.unit}
                          </span>
                        </div>

                        {history.length > 1 && (
                          <div className="mt-2 flex items-center gap-2">
                            <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-7 min-w-0 flex-1" role="img" aria-label={`${sensor.paramName} recent history`}>
                              <polyline points={historyPoints} fill="none" stroke={thresholdExceeded ? "#fb7185" : "#34d399"} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                            </svg>
                            <span className="shrink-0 text-[8px] font-mono text-zinc-600">20 SAMPLES</span>
                          </div>
                        )}

                        {thresholdExceeded && (
                          <div className="mt-1 text-[9px] font-mono text-rose-400">
                            THRESHOLD EXCEEDED · {sensor.threshold?.maximum !== undefined ? `MAX ${sensor.threshold.maximum}` : `MIN ${sensor.threshold?.minimum}`}{sensor.unit}
                          </div>
                        )}

                        {/* Node / Live status footer */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-900/90 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-400 truncate">{sensor.sensorNode}</span>
                          <span className={cn(
                            "flex items-center gap-1 font-medium",
                            sensorStatus === "LIVE" ? "text-emerald-400" : sensorStatus === "DISCONNECTED" ? "text-red-400" : "text-amber-400"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              sensorStatus === "LIVE" ? "bg-emerald-400" : sensorStatus === "DISCONNECTED" ? "bg-red-400" : "bg-amber-400"
                            )} />
                            {sensorStatus}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>UPDATED · {packetAge}</span>
                        </div>

                        {/* Secondary information revealed on demand */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden mt-2 pt-2 border-t border-zinc-800 text-[10px] font-mono space-y-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-between text-zinc-400">
                                <span>NODE</span>
                                <span className="text-zinc-200">{sensor.sensorNode}</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>STATUS</span>
                                <span className={sensorStatus === "LIVE" ? "text-emerald-400" : sensorStatus === "DISCONNECTED" ? "text-red-400" : "text-amber-400"}>
                                  ● {sensorStatus}
                                </span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>UPDATED</span>
                                <span className="text-zinc-300">{packetAge}</span>
                              </div>
                              <div className="flex justify-between text-zinc-400">
                                <span>SIGNAL</span>
                                <span className="text-zinc-300">{sensor.signalStrength || "-64 dBm"}</span>
                              </div>
                              {sensor.busProtocol && (
                                <div className="flex justify-between text-zinc-400">
                                  <span>BUS / PROTOCOL</span>
                                  <span className="text-zinc-300">{sensor.busProtocol}</span>
                                </div>
                              )}
                              {sensor.threshold && (
                                <div className="flex justify-between text-zinc-400">
                                  <span>ALERT RANGE</span>
                                  <span className="text-zinc-300">{sensor.threshold.minimum ?? "—"} to {sensor.threshold.maximum ?? "—"} {sensor.unit}</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================ */}
              {/* 5. MQTT / TRANSPORT DETAILS (COMFORTABLE ACCORDION ROW)       */}
              {/* ============================================================ */}
              <div className="pt-1 pb-2">
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/80 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowTransportDetails((prev) => !prev)}
                      className="flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer select-none"
                      aria-expanded={showTransportDetails}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
                      <span className="font-semibold uppercase tracking-wider">
                        TRANSPORT: MQTT
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400 font-medium">STABLE</span>
                      {showTransportDetails ? (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
                      )}
                    </button>

                    <span className="text-[10px] font-mono text-zinc-400">
                      {currentNode.transport.latency}
                    </span>
                  </div>

                  {/* Expandable Transport Details */}
                  <AnimatePresence>
                    {showTransportDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3 pt-2.5 border-t border-zinc-900 space-y-1.5 text-[10px] font-mono"
                      >
                        <div className="flex justify-between text-zinc-400">
                          <span>LATENCY</span>
                          <span className="text-zinc-200">{currentNode.transport.latency}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>BROKER</span>
                          <span className="text-zinc-200">{currentNode.transport.broker}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>CONNECTION</span>
                          <span className="text-emerald-400">{currentNode.transport.connection}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>NODE HARDWARE</span>
                          <span className="text-zinc-300">{currentNode.hardwareId}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

          </div>

          {/* ============================================================== */}
          {/* 2. RIGHT-SIDE GEOSPATIAL NETWORK WORKSPACE                      */}
          {/* ============================================================== */}
          <div className="flex flex-col">
            <div
              id="geospatial-map-container"
              ref={mapContainerRef}
              className={cn(
                `
                w-full h-full min-h-[580px] lg:min-h-[760px]
                rounded-xl
                border border-zinc-800/60
                bg-zinc-950/60
                backdrop-blur-sm
                relative
                overflow-hidden
                flex flex-col justify-between
                p-4 sm:p-5
                `,
                isMapFullscreen && "fixed inset-0 z-[100] min-h-0 lg:min-h-0 h-[100dvh] rounded-none border-0 bg-black p-2",
              )}
            >
              {isMapFullscreen && (
                <button
                  type="button"
                  onClick={() => setIsMapFullscreen(false)}
                  className="absolute left-4 top-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950/90 text-zinc-200 shadow-lg transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                  aria-label="Exit fullscreen map"
                  title="Exit fullscreen map"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {/* Technical subtle geospatial grid canvas backdrop */}
              <div 
                className="absolute inset-0 bg-[linear-gradient(to_right,#27272a12_1px,transparent_1px),linear-gradient(to_bottom,#27272a12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" 
                aria-hidden="true" 
              />

              <div className={cn(
                "relative z-10 mb-1 flex items-center justify-between border-b border-zinc-900/80 pb-2",
                isMapFullscreen && "pl-12",
              )}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  <span className="text-xs font-mono text-zinc-400 font-semibold tracking-wider uppercase">
                    GEOSPATIAL CANVAS
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
                  <span>
                    VIEWPORT: READY
                  </span>
                </div>
              </div>

              <EnvironmentalNetworkWorkspace
                mapUrl={mapsAppUrl}
                enabled={shouldMountMap}
                nodes={nodes}
                networks={networks}
                connections={connections}
                selectedNodeId={selectedNodeId}
                selectedNetworkId={selectedNetworkId}
                selectedConnectionId={selectedConnectionId}
                isFullscreen={isMapFullscreen}
                mapFocusMode={mapFocusMode}
                onMapFocusToggle={() => setMapFocusMode((focused) => !focused)}
                onSelectNode={selectNode}
                onSelectNetwork={selectNetwork}
                onSelectConnection={setSelectedConnectionId}
                onCreateNode={createNode}
                onUpdateNode={updateNode}
                onDeleteNode={deleteNode}
                onCreateConnection={createConnection}
                onUpdateConnection={(id, kind) => setConnections((previous) => previous.map((connection) => connection.id === id ? { ...connection, kind } : connection))}
                onDeleteConnection={(id) => {
                  setConnections((previous) => previous.filter((connection) => connection.id !== id));
                  setSelectedConnectionId(null);
                }}
                onCreateNetwork={createNetwork}
                onRenameNetwork={renameNetwork}
                onFullscreen={() => setIsMapFullscreen(true)}
                onExitFullscreen={() => setIsMapFullscreen(false)}
              />

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
