import type { SentinelNode, SensorTelemetryItem } from "./environmental-dashboard-section";

export type EnvironmentalNodeType =
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

export type EnvironmentalNode = SentinelNode & {
  name: string;
  type: EnvironmentalNodeType;
  latitude: number;
  longitude: number;
  networkId: string;
  task: string;
  demoData?: boolean;
};

export interface EnvironmentalNetwork {
  id: string;
  name: string;
  region: string;
  summary: string;
  latitude: number;
  longitude: number;
  altitude: number;
  color: string;
}

export interface EnvironmentalConnection {
  id: string;
  networkId: string;
  sourceId: string;
  targetId: string;
  kind: "radio" | "gateway" | "mesh";
}

export interface SensorDefinition {
  id: string;
  name: string;
  unit: string;
  value: number;
  minimum?: number;
  maximum?: number;
  busProtocol: string;
}

export interface EnvironmentalGraphState {
  version: 7;
  nodes: EnvironmentalNode[];
  networks: EnvironmentalNetwork[];
  connections: EnvironmentalConnection[];
}

export interface NewEnvironmentalNode {
  id: string;
  label: string;
  networkId: string;
  type: EnvironmentalNodeType;
  task: string;
  latitude: number;
  longitude: number;
  sensorIds: string[];
}

export const ENVIRONMENTAL_NETWORKS: EnvironmentalNetwork[] = [
  {
    id: "assam-brahmaputra",
    name: "Assam · Brahmaputra flood watch",
    region: "Upper and central Brahmaputra valley",
    summary: "Six demo stations monitor river level, rainfall and slope risk across flood-prone Assam.",
    latitude: 26.9,
    longitude: 92.2,
    altitude: 1600000,
    color: "#2dd4bf",
  },
  {
    id: "nepal-monsoon-2024",
    name: "Nepal · 2024 monsoon flood response",
    region: "Bagmati corridor · Kathmandu to Sindhuli",
    summary: "Six simulated stations represent areas affected by the September 2024 flood and landslides.",
    latitude: 27.55,
    longitude: 85.55,
    altitude: 360000,
    color: "#f59e0b",
  },
];

export const ENVIRONMENTAL_SENSOR_CATALOG: SensorDefinition[] = [
  { id: "water-level", name: "Water level", unit: "m", value: 2.18, maximum: 2.5, busProtocol: "ADC 12-bit" },
  { id: "rainfall", name: "Rainfall", unit: "mm/h", value: 14.5, maximum: 20, busProtocol: "GPIO pulse" },
  { id: "flow-rate", name: "Flow rate", unit: "m³/s", value: 1.85, maximum: 2.2, busProtocol: "Hall pulse" },
  { id: "temperature", name: "Temperature", unit: "°C", value: 27.4, minimum: 0, maximum: 42, busProtocol: "I2C 0x48" },
  { id: "humidity", name: "Humidity", unit: "%", value: 68.2, maximum: 90, busProtocol: "I2C 0x40" },
  { id: "air-quality", name: "PM2.5", unit: "µg/m³", value: 18, maximum: 35, busProtocol: "UART" },
  { id: "wind-speed", name: "Wind speed", unit: "m/s", value: 4.8, maximum: 18, busProtocol: "RS-485" },
  { id: "soil-moisture", name: "Soil moisture", unit: "%", value: 72, maximum: 88, busProtocol: "I2C" },
  { id: "soil-tilt", name: "Slope tilt", unit: "°", value: 2.1, maximum: 5, busProtocol: "SPI" },
  { id: "smoke", name: "Smoke index", unit: "ppm", value: 12, maximum: 80, busProtocol: "UART" },
];

export const ENVIRONMENTAL_NODE_STORAGE_KEY = "ecosentinel-environmental-nodes-v1";
export const ENVIRONMENTAL_GRAPH_STORAGE_KEY = "ecosentinel-environmental-graph-v1";

const ASSAM_LOCATIONS = [
  { latitude: 27.48, longitude: 94.91, location: "Dibrugarh · Brahmaputra east bank", type: "MASTER", task: "Valley master station · aggregate river and weather telemetry" },
  { latitude: 27.48, longitude: 94.58, location: "Dhemaji · Jiadhal confluence", type: "FLOOD", task: "River stage and flash-flood observation" },
  { latitude: 26.95, longitude: 94.17, location: "Majuli · Brahmaputra island", type: "FLOOD", task: "Island flood-level and rainfall monitoring" },
  { latitude: 26.75, longitude: 94.20, location: "Jorhat · Neamatighat", type: "WEATHER / ENVIRONMENT", task: "Rainfall, humidity and river-condition relay" },
  { latitude: 26.32, longitude: 91.00, location: "Barpeta · Beki river basin", type: "LANDSLIDE", task: "Soil saturation and slope-instability monitoring" },
  { latitude: 26.17, longitude: 91.75, location: "Guwahati · Brahmaputra reach", type: "GATEWAY / RELAY", task: "Gateway relay for central valley sensor traffic" },
] satisfies Array<{ latitude: number; longitude: number; location: string; type: EnvironmentalNodeType; task: string }>;

const NEPAL_LOCATIONS = [
  { latitude: 27.7172, longitude: 85.324, location: "Kathmandu · Bagmati corridor", type: "MASTER", task: "Valley master station · flood-response coordination" },
  { latitude: 27.6588, longitude: 85.3247, location: "Lalitpur · Nakhu river", type: "FLOOD", task: "Urban river-stage and rainfall monitoring" },
  { latitude: 27.671, longitude: 85.4298, location: "Bhaktapur · Hanumante river", type: "FLOOD", task: "Flash-flood and inundation observation" },
  { latitude: 27.584, longitude: 85.521, location: "Panauti · Roshi river", type: "LANDSLIDE", task: "Roshi basin flood and slope-risk monitoring" },
  { latitude: 27.623, longitude: 85.542, location: "Dhulikhel · Kavre district", type: "WEATHER / ENVIRONMENT", task: "Rainfall and slope-saturation observation" },
  { latitude: 27.253, longitude: 85.971, location: "Sindhuli · Sunkoshi corridor", type: "GATEWAY / RELAY", task: "Downstream flood warning and relay" },
] satisfies Array<{ latitude: number; longitude: number; location: string; type: EnvironmentalNodeType; task: string }>;

function cloneForLocation(
  node: SentinelNode,
  location: (typeof ASSAM_LOCATIONS)[number],
  options: { id: string; label: string; networkId: string; hardwareId: string; demoData: boolean },
): EnvironmentalNode {
  return {
    ...node,
    ...options,
    name: options.label,
    type: location.type,
    location: location.location,
    latitude: location.latitude,
    longitude: location.longitude,
    task: location.task,
    demoData: options.demoData,
    sensors: node.sensors.map((sensor, index) => ({
      ...sensor,
      id: options.demoData ? `${options.id}-${sensor.id}` : sensor.id,
      sensorNode: options.hardwareId,
      receivedAt: Date.now() - index * 16000,
      threshold: sensorThreshold(sensor),
      history: createSensorHistory(sensor.value, index),
    })),
  };
}

function sensorThreshold(sensor: SensorTelemetryItem) {
  const sensorName = `${sensor.paramName} ${sensor.unit}`.toLowerCase();
  const definition = ENVIRONMENTAL_SENSOR_CATALOG.find((item) => sensorName.includes(item.name.toLowerCase()));
  return definition ? { minimum: definition.minimum, maximum: definition.maximum } : undefined;
}

function createSensorHistory(value: string | number, salt: number): number[] {
  const center = Number(value);
  if (!Number.isFinite(center)) return [];
  return Array.from({ length: 20 }, (_, index) => {
    const wave = Math.sin((index + salt * 2) * 0.72) * Math.max(Math.abs(center) * 0.08, 0.2);
    return Number((center + wave).toFixed(2));
  });
}

export function createRegionalEnvironmentalNodes(baseNodes: SentinelNode[]): EnvironmentalNode[] {
  const templates = Array.from({ length: 6 }, (_, index) => baseNodes[index % baseNodes.length]);
  const assam = ASSAM_LOCATIONS.map((location, index) => cloneForLocation(templates[index], location, {
    id: `node-${String(index + 1).padStart(2, "0")}`,
    label: `AS-${String(index + 1).padStart(2, "0")}`,
    networkId: "assam-brahmaputra",
    hardwareId: `ESP32-AS-${String(index + 1).padStart(2, "0")}`,
    demoData: index !== 5,
  }));
  const nepal = NEPAL_LOCATIONS.map((location, index) => cloneForLocation(templates[index], location, {
    id: `np-node-${String(index + 1).padStart(2, "0")}`,
    label: `NP-${String(index + 1).padStart(2, "0")}`,
    networkId: "nepal-monsoon-2024",
    hardwareId: `SIM-NP-${String(index + 1).padStart(2, "0")}`,
    demoData: true,
  }));

  return [...assam, ...nepal];
}

export function createEnvironmentalNode(
  baseNode: SentinelNode,
  input: NewEnvironmentalNode,
): EnvironmentalNode {
  const sensors: SensorTelemetryItem[] = ENVIRONMENTAL_SENSOR_CATALOG
    .filter((definition) => input.sensorIds.includes(definition.id))
    .map((definition, index) => ({
      id: `${input.id}-${definition.id}`,
      code: `SENSOR ${String(index + 1).padStart(2, "0")}`,
      technicalLabel: `${definition.name.toUpperCase()} ENVIRONMENTAL INPUT`,
      paramName: definition.name.toUpperCase(),
      value: String(definition.value),
      unit: definition.unit,
      status: "SYNCED",
      category: "sensor",
      sensorNode: input.id,
      receivedAt: Date.now(),
      lastPacket: "DEMO // JUST NOW",
      signalStrength: "-68 dBm",
      busProtocol: definition.busProtocol,
      threshold: { minimum: definition.minimum, maximum: definition.maximum },
      history: createSensorHistory(definition.value, index),
    }));

  return {
    ...baseNode,
    ...input,
    name: input.label,
    type: input.type,
    hardwareId: `SIM-${input.id.toUpperCase()}`,
    status: "ONLINE",
    sector: input.networkId,
    location: `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    battery: "96%",
    demoData: true,
    hazard: {
      ...baseNode.hazard,
      status: "Normal",
      badgeText: "DEMO",
      lastSync: "DEMO // JUST NOW",
    },
    ml: { ...baseNode.ml, isDemo: true },
    sensors,
    transport: {
      ...baseNode.transport,
      protocol: "DEMO / MQTT READY",
      connection: "SIMULATED",
    },
  };
}

export function updateEnvironmentalNode(
  node: EnvironmentalNode,
  input: NewEnvironmentalNode,
): EnvironmentalNode {
  const updated = createEnvironmentalNode(node, input);
  return {
    ...node,
    ...updated,
    hardwareId: node.hardwareId,
    status: node.status,
    battery: node.battery,
    firmware: node.firmware,
    hazard: node.hazard,
    ml: node.ml,
    transport: node.transport,
    demoData: node.demoData,
  };
}

export const DEFAULT_ENVIRONMENTAL_CONNECTIONS: EnvironmentalConnection[] = [
  ["as-01-02", "assam-brahmaputra", "node-01", "node-02", "gateway"],
  ["as-01-06", "assam-brahmaputra", "node-01", "node-06", "gateway"],
  ["as-02-03", "assam-brahmaputra", "node-02", "node-03", "mesh"],
  ["as-03-04", "assam-brahmaputra", "node-03", "node-04", "mesh"],
  ["as-04-05", "assam-brahmaputra", "node-04", "node-05", "mesh"],
  ["np-01-02", "nepal-monsoon-2024", "np-node-01", "np-node-02", "gateway"],
  ["np-01-03", "nepal-monsoon-2024", "np-node-01", "np-node-03", "radio"],
  ["np-02-04", "nepal-monsoon-2024", "np-node-02", "np-node-04", "mesh"],
  ["np-03-05", "nepal-monsoon-2024", "np-node-03", "np-node-05", "mesh"],
  ["np-04-06", "nepal-monsoon-2024", "np-node-04", "np-node-06", "mesh"],
].map(([id, networkId, sourceId, targetId, kind]) => ({
  id,
  networkId,
  sourceId,
  targetId,
  kind: kind as EnvironmentalConnection["kind"],
}));

export function loadEnvironmentalGraph(baseNodes: SentinelNode[]): EnvironmentalGraphState {
  const fallback: EnvironmentalGraphState = {
    version: 7,
    nodes: createRegionalEnvironmentalNodes(baseNodes),
    networks: ENVIRONMENTAL_NETWORKS,
    connections: DEFAULT_ENVIRONMENTAL_CONNECTIONS,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(ENVIRONMENTAL_GRAPH_STORAGE_KEY);
    if (!saved) return fallback;
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== "object" || parsed === null) return fallback;
    const state = parsed as Partial<EnvironmentalGraphState>;
    const nodes = Array.isArray(state.nodes) ? state.nodes.filter((node) =>
      typeof node?.id === "string" && typeof node?.networkId === "string" &&
      Number.isFinite(node?.latitude) && Number.isFinite(node?.longitude) && Array.isArray(node?.sensors),
    ) : [];
    const networks = Array.isArray(state.networks) ? state.networks.filter((network) =>
      typeof network?.id === "string" && typeof network?.name === "string" &&
      Number.isFinite(network?.latitude) && Number.isFinite(network?.longitude),
    ) : [];
    const connections = Array.isArray(state.connections) ? state.connections.filter((connection) =>
      typeof connection?.id === "string" && typeof connection?.sourceId === "string" &&
      typeof connection?.targetId === "string" && typeof connection?.networkId === "string",
    ) : [];
    const seedConnectionIds = new Set(DEFAULT_ENVIRONMENTAL_CONNECTIONS.map((connection) => connection.id));
    const candidateConnections = state.version === 7
      ? connections
      : [...DEFAULT_ENVIRONMENTAL_CONNECTIONS, ...connections.filter((connection) => !seedConnectionIds.has(connection.id))];
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const normalizedConnections: EnvironmentalConnection[] = [];
    const degrees = new Map<string, number>();
    const hasPath = (startId: string, targetId: string) => {
      const visited = new Set<string>();
      const pending = [startId];
      while (pending.length > 0) {
        const currentId = pending.pop()!;
        if (currentId === targetId) return true;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        for (const connection of normalizedConnections) {
          if (connection.sourceId === currentId) pending.push(connection.targetId);
          if (connection.targetId === currentId) pending.push(connection.sourceId);
        }
      }
      return false;
    };
    for (const connection of candidateConnections) {
      const source = nodesById.get(connection.sourceId);
      const target = nodesById.get(connection.targetId);
      if (!source || !target || source.networkId !== target.networkId || source.networkId !== connection.networkId) continue;
      if (hasPath(connection.sourceId, connection.targetId)) continue;
      if ((degrees.get(connection.sourceId) || 0) >= 2 || (degrees.get(connection.targetId) || 0) >= 2) continue;
      normalizedConnections.push(connection);
      degrees.set(connection.sourceId, (degrees.get(connection.sourceId) || 0) + 1);
      degrees.set(connection.targetId, (degrees.get(connection.targetId) || 0) + 1);
    }

    const masterNetworks = new Set<string>();
    const normalizedNodes = nodes.map((node) => {
      const isDuplicateMaster = node.type === "MASTER" && masterNetworks.has(node.networkId);
      if (node.type === "MASTER" && !isDuplicateMaster) masterNetworks.add(node.networkId);
      return {
        ...node,
        name: node.name || node.label,
        type: isDuplicateMaster ? "INDIVIDUAL / UNIVERSAL" as const : node.type,
        demoData: (node.networkId === "assam-brahmaputra" && node.id !== "node-06")
          || node.networkId === "nepal-monsoon-2024"
          || Boolean(node.demoData),
      };
    });
    const networkDefaults = new Map(ENVIRONMENTAL_NETWORKS.map((network) => [network.id, network]));
    const normalizedNetworks = networks.map((network) => {
      const defaults = networkDefaults.get(network.id);
      return defaults ? {
        ...network,
        latitude: defaults.latitude,
        longitude: defaults.longitude,
        altitude: defaults.altitude,
        color: defaults.color,
      } : network;
    });

    return {
      version: 7,
      nodes: normalizedNodes.length > 0 ? normalizedNodes : fallback.nodes,
      networks: networks.length > 0 ? normalizedNetworks : fallback.networks,
      connections: normalizedConnections,
    };
  } catch {
    return fallback;
  }
}