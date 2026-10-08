"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Eye,
  EyeOff,
  Link2,
  Maximize2,
  MapPinPlus,
  MousePointer2,
  Network,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ENVIRONMENTAL_SENSOR_CATALOG,
  type EnvironmentalConnection,
  type EnvironmentalNetwork,
  type EnvironmentalNode,
  type EnvironmentalNodeType,
  type NewEnvironmentalNode,
} from "./environmental-network-model";

const MESSAGE_SOURCE = "ecosentinel-environmental-network";
const NODE_TYPES: EnvironmentalNodeType[] = [
  "INDIVIDUAL / UNIVERSAL",
  "MASTER",
  "GATEWAY / RELAY",
  "FIRE",
  "FLOOD",
  "LANDSLIDE",
  "AIR QUALITY",
  "WEATHER / ENVIRONMENT",
  "CUSTOM",
];

type MapTool = "select" | "add" | "connect" | "move";
type EditorDraft = NewEnvironmentalNode & { existingId?: string };

interface NetworkEditorDraft {
  id?: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}

interface EnvironmentalNetworkWorkspaceProps {
  mapUrl: string;
  nodes: EnvironmentalNode[];
  networks: EnvironmentalNetwork[];
  connections: EnvironmentalConnection[];
  selectedNodeId: string;
  selectedNetworkId: string;
  selectedConnectionId: string | null;
  isFullscreen: boolean;
  enabled: boolean;
  onSelectNode: (id: string) => void;
  onSelectNetwork: (id: string) => void;
  onSelectConnection: (id: string | null) => void;
  onCreateNode: (node: NewEnvironmentalNode) => void;
  onUpdateNode: (id: string, node: NewEnvironmentalNode) => void;
  onDeleteNode: (id: string) => void;
  onCreateConnection: (sourceId: string, targetId: string) => void;
  onUpdateConnection: (id: string, kind: EnvironmentalConnection["kind"]) => void;
  onDeleteConnection: (id: string) => void;
  onCreateNetwork: (network: Omit<EnvironmentalNetwork, "id" | "altitude" | "color">) => void;
  onRenameNetwork: (id: string, name: string, region: string) => void;
  mapFocusMode: boolean;
  onMapFocusToggle: () => void;
  onFullscreen: () => void;
  onExitFullscreen: () => void;
}

function nodeDraftFromNode(node: EnvironmentalNode): EditorDraft {
  const sensorIds = node.sensors.flatMap((sensor) => {
    const match = ENVIRONMENTAL_SENSOR_CATALOG.find((definition) =>
      definition.name.toUpperCase() === sensor.paramName.toUpperCase(),
    );
    return match ? [match.id] : [];
  });
  return {
    existingId: node.id,
    id: node.id,
    label: node.name || node.label,
    networkId: node.networkId,
    type: NODE_TYPES.includes(node.type) ? node.type : "CUSTOM",
    task: node.task,
    latitude: node.latitude,
    longitude: node.longitude,
    sensorIds,
  };
}

export function EnvironmentalNetworkWorkspace({
  mapUrl,
  nodes,
  networks,
  connections,
  selectedNodeId,
  selectedNetworkId,
  selectedConnectionId,
  isFullscreen,
  enabled,
  onSelectNode,
  onSelectNetwork,
  onSelectConnection,
  onCreateNode,
  onUpdateNode,
  onDeleteNode,
  onCreateConnection,
  onUpdateConnection,
  onDeleteConnection,
  onCreateNetwork,
  onRenameNetwork,
  mapFocusMode,
  onMapFocusToggle,
  onFullscreen,
  onExitFullscreen,
}: EnvironmentalNetworkWorkspaceProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mapSurfaceRef = useRef<HTMLDivElement>(null);
  const mapControlsRef = useRef<HTMLDivElement>(null);
  const focusStateRef = useRef({ ready: false, networkId: selectedNetworkId, nodeId: selectedNodeId });
  const initialMapUrl = mapUrl.split("#")[0];
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const activeNetwork = networks.find((network) => network.id === selectedNetworkId) || networks[0];
  const [mapReady, setMapReady] = useState(false);
  const [networkLayerVisible, setNetworkLayerVisible] = useState(true);
  const [tool, setTool] = useState<MapTool>("select");
  const [sourceNodeId, setSourceNodeId] = useState("");
  const [placement, setPlacement] = useState<{ latitude: number; longitude: number; x: number; y: number } | null>(null);
  const [nodeDraft, setNodeDraft] = useState<EditorDraft | null>(null);
  const [networkDraft, setNetworkDraft] = useState<NetworkEditorDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState("");

  const activeNodes = useMemo(
    () => nodes.filter((node) => node.networkId === selectedNetworkId),
    [nodes, selectedNetworkId],
  );
  const activeConnections = useMemo(
    () => connections.filter((connection) => connection.networkId === selectedNetworkId),
    [connections, selectedNetworkId],
  );
  const mapSnapshotKey = JSON.stringify(nodes.map((node) => ({
    id: node.id,
    name: node.name || node.label,
    latitude: node.latitude,
    longitude: node.longitude,
    networkId: node.networkId,
    status: node.status,
    color: networks.find((network) => network.id === node.networkId)?.color,
  })));
  const selectedConnection = connections.find((connection) => connection.id === selectedConnectionId);
  const selectedConnectionNodes = selectedConnection
    ? [nodes.find((node) => node.id === selectedConnection.sourceId), nodes.find((node) => node.id === selectedConnection.targetId)]
    : [];
  const isEnvironmentalLayerVisible = networkLayerVisible && !mapFocusMode;

  function toggleMapFocus() {
    setTool("select");
    setSourceNodeId("");
    setNodeDraft(null);
    setPlacement(null);
    setNetworkDraft(null);
    onSelectConnection(null);
    onMapFocusToggle();
  }

  const sendToMap = (type: string, detail: Record<string, unknown> = {}) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: MESSAGE_SOURCE, type, ...detail },
      window.location.origin,
    );
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.origin !== window.location.origin) return;
      const message = event.data;
      if (!message || message.source !== MESSAGE_SOURCE) return;

      if (message.type === "clear-data-layers") {
        setTool("select");
        setSourceNodeId("");
        setNodeDraft(null);
        setPlacement(null);
        onSelectConnection(null);
        return;
      }
      if (message.type === "ready") setMapReady(true);
      if (message.type === "node-selected" && typeof message.id === "string") {
        onSelectNode(message.id);
        onSelectConnection(null);
      }
      if (message.type === "connection-source-selected" && typeof message.id === "string") {
        setSourceNodeId(message.id);
        onSelectNode(message.id);
        onSelectConnection(null);
      }
      if (message.type === "connection-selected" && typeof message.id === "string") {
        onSelectConnection(message.id);
      }
      if (message.type === "connection-requested" && typeof message.sourceId === "string" && typeof message.targetId === "string") {
        onCreateConnection(message.sourceId, message.targetId);
        onSelectNode(message.targetId);
      }
      if (message.type === "placement-requested" && Number.isFinite(message.latitude) && Number.isFinite(message.longitude)) {
        setPlacement({
          latitude: message.latitude,
          longitude: message.longitude,
          x: Number(message.x) || 0.5,
          y: Number(message.y) || 0.5,
        });
        setNodeDraft({
          id: `custom-${Date.now()}`,
          label: `NODE ${String(nodes.length + 1).padStart(2, "0")}`,
          networkId: selectedNetworkId,
          type: "FLOOD",
          task: "Environmental monitoring",
          latitude: message.latitude,
          longitude: message.longitude,
          sensorIds: ["water-level", "rainfall"],
        });
        setFormError("");
      }
      if (message.type === "node-moved" && typeof message.id === "string" && Number.isFinite(message.latitude) && Number.isFinite(message.longitude)) {
        const node = nodes.find((item) => item.id === message.id);
        if (node) onUpdateNode(node.id, { ...nodeDraftFromNode(node), latitude: message.latitude, longitude: message.longitude });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [nodes, onCreateConnection, onSelectConnection, onSelectNode, onUpdateNode, selectedNetworkId]);

  useEffect(() => {
    const cancelOutsideMap = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mapSurfaceRef.current?.contains(target)) return;
      const editControl = target instanceof Element ? target.closest("[data-map-edit-control]") : null;
      if (editControl && mapControlsRef.current?.contains(editControl)) return;
      setTool("select");
      setSourceNodeId("");
      setNodeDraft(null);
      setPlacement(null);
      setNetworkDraft(null);
      onSelectConnection(null);
    };
    document.addEventListener("pointerdown", cancelOutsideMap, true);
    return () => document.removeEventListener("pointerdown", cancelOutsideMap, true);
  }, [onSelectConnection]);

  useEffect(() => {
    if (!mapReady) return;
    sendToMap("sync", {
      snapshot: {
        nodes: isEnvironmentalLayerVisible ? JSON.parse(mapSnapshotKey) : [],
        connections: isEnvironmentalLayerVisible ? connections : [],
        activeNetworkId: selectedNetworkId,
        selectedNodeId,
        mode: tool,
        sourceNodeId,
      },
    });
  }, [connections, isEnvironmentalLayerVisible, mapReady, mapSnapshotKey, selectedNetworkId, selectedNodeId, sourceNodeId, tool]);

  useEffect(() => {
    if (!mapReady || !activeNetwork) return;
    const previous = focusStateRef.current;
    const networkChanged = previous.networkId !== selectedNetworkId;
    const initialFocus = !previous.ready;
    focusStateRef.current = { ready: true, networkId: selectedNetworkId, nodeId: selectedNodeId };

    if (initialFocus) {
      const focusTimer = window.setTimeout(() => {
        sendToMap("focus", {
          latitude: 18,
          longitude: 86,
          altitude: 22000000,
          duration: 1.8,
        });
      }, 0);
      return () => window.clearTimeout(focusTimer);
    }

    if (networkChanged) {
      const focusTimer = window.setTimeout(() => {
        sendToMap("focus", {
          latitude: activeNetwork.latitude,
          longitude: activeNetwork.longitude,
          altitude: activeNetwork.altitude,
          duration: 1.8,
        });
      }, 0);
      return () => window.clearTimeout(focusTimer);
    }

    if (previous.nodeId !== selectedNodeId && selectedNode && tool !== "connect") {
      sendToMap("focus", {
        latitude: selectedNode.latitude,
        longitude: selectedNode.longitude,
        altitude: 210000,
        duration: 1.2,
      });
    }
  }, [
    activeNetwork?.altitude,
    activeNetwork?.latitude,
    activeNetwork?.longitude,
    mapReady,
    selectedNetworkId,
    selectedNode?.latitude,
    selectedNode?.longitude,
    selectedNodeId,
    tool,
  ]);

  function submitNodeDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nodeDraft) return;
    if (!nodeDraft.label.trim()) return setFormError("Enter a node name.");
    if (!Number.isFinite(nodeDraft.latitude) || Math.abs(nodeDraft.latitude) > 90 || !Number.isFinite(nodeDraft.longitude) || Math.abs(nodeDraft.longitude) > 180) {
      return setFormError("Latitude must be -90 to 90 and longitude -180 to 180.");
    }
    if (nodeDraft.type === "MASTER" && nodes.some((node) =>
      node.networkId === nodeDraft.networkId && node.type === "MASTER" && node.id !== nodeDraft.existingId,
    )) return setFormError("This network already has a master node.");
    if (nodeDraft.sensorIds.length === 0) return setFormError("Select at least one sensor.");
    if (nodeDraft.existingId) onUpdateNode(nodeDraft.existingId, nodeDraft);
    else onCreateNode(nodeDraft);
    onSelectNetwork(nodeDraft.networkId);
    setNodeDraft(null);
    setPlacement(null);
    setTool("select");
    setFormError("");
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const coordinateMatch = searchQuery.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordinateMatch) {
      const latitude = Number(coordinateMatch[1]);
      const longitude = Number(coordinateMatch[2]);
      if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
        sendToMap("focus", { latitude, longitude, altitude: 180000, duration: 1.2 });
        return;
      }
    }
    if (searchQuery.trim()) sendToMap("search", { query: searchQuery.trim() });
  }

  function beginNetworkEditor(network?: EnvironmentalNetwork) {
    setNetworkDraft(network
      ? { id: network.id, name: network.name, region: network.region, latitude: network.latitude, longitude: network.longitude }
      : { name: "", region: "", latitude: activeNetwork?.latitude ?? 27, longitude: activeNetwork?.longitude ?? 88 });
  }

  function submitNetworkDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!networkDraft?.name.trim() || !networkDraft.region.trim()) return;
    if (networkDraft.id) onRenameNetwork(networkDraft.id, networkDraft.name.trim(), networkDraft.region.trim());
    else onCreateNetwork({
      name: networkDraft.name.trim(),
      region: networkDraft.region.trim(),
      summary: "Admin-created environmental node network.",
      latitude: networkDraft.latitude,
      longitude: networkDraft.longitude,
    });
    setNetworkDraft(null);
  }

  const setDraftField = <K extends keyof NewEnvironmentalNode>(key: K, value: NewEnvironmentalNode[K]) => {
    setNodeDraft((draft) => draft ? { ...draft, [key]: value } : draft);
  };

  const toolOptions: Array<{ id: MapTool; label: string; icon: typeof MousePointer2 }> = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "add", label: "Add node", icon: MapPinPlus },
    { id: "connect", label: "Connect", icon: Link2 },
    { id: "move", label: "Move", icon: Crosshair },
  ];

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2.5">
      {!mapFocusMode && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/80 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Network className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <label className="sr-only" htmlFor="environmental-network-select">Active environmental network</label>
          <select
            id="environmental-network-select"
            value={selectedNetworkId}
            onChange={(event) => onSelectNetwork(event.target.value)}
            className="min-w-0 max-w-[min(72vw,420px)] border-0 bg-zinc-950 text-xs font-semibold text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>{network.name}</option>
            ))}
          </select>
          {activeNetwork && (
            <button type="button" onClick={() => beginNetworkEditor(activeNetwork)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" aria-label="Rename network" title="Rename network">
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {
            <button type="button" onClick={() => beginNetworkEditor()} className="inline-flex items-center gap-1 rounded border border-zinc-800 px-2 py-1 text-[10px] font-mono text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300" title="Create an independent network">
              <Plus className="h-3 w-3" aria-hidden="true" /> NETWORK
            </button>
          }
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
          <span>{activeNodes.length} NODES</span>
          <span>{activeConnections.length} LINKS</span>
          <button
            type="button"
            onClick={() => activeNetwork && sendToMap("focus", {
              latitude: activeNetwork.latitude,
              longitude: activeNetwork.longitude,
              altitude: Math.max(activeNetwork.altitude, 1600000),
              duration: 1.2,
            })}
            className="inline-flex items-center gap-1 rounded border border-zinc-800 px-2 py-1 text-[9px] text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300"
            aria-label="Focus network"
            title="Frame the active network"
          >
            <Crosshair className="h-3 w-3" aria-hidden="true" /> FOCUS
          </button>
          <button
            type="button"
            aria-pressed={networkLayerVisible}
            onClick={() => setNetworkLayerVisible((visible) => !visible)}
            className="inline-flex items-center justify-center rounded border border-zinc-800 p-1 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300"
            aria-label={networkLayerVisible ? "Hide environmental network layer" : "Show environmental network layer"}
            title={networkLayerVisible ? "Hide environmental network layer" : "Show environmental network layer"}
          >
            {networkLayerVisible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>
      </div>}

      {!mapFocusMode && <div className="flex flex-wrap items-center justify-between gap-2">
        <div ref={mapControlsRef} className="inline-flex items-center gap-1">
          <button
            type="button"
            data-map-edit-control
            aria-pressed={!mapFocusMode}
            onClick={toggleMapFocus}
            className="inline-flex items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/15 p-1.5 text-emerald-300 hover:bg-emerald-500/20"
            aria-label="Focus map"
            title="Focus map"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <div className="inline-flex overflow-hidden rounded border border-zinc-800 bg-zinc-950" role="group" aria-label="Map editing mode">
              {toolOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  data-map-edit-control
                  aria-pressed={tool === id}
                  onClick={() => {
                    setTool(id);
                    setSourceNodeId(id === "connect" ? selectedNodeId : "");
                    onSelectConnection(null);
                    if (id === "connect" && activeNetwork) {
                      sendToMap("focus", {
                        latitude: activeNetwork.latitude,
                        longitude: activeNetwork.longitude,
                        altitude: Math.max(activeNetwork.altitude, 1600000),
                        duration: 1.2,
                      });
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-r border-zinc-800 px-2.5 py-1.5 text-[10px] font-mono last:border-r-0",
                    tool === id ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  )}
                  title={label}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 sm:max-w-[340px]">
          <label className="sr-only" htmlFor="environmental-map-search">Search a place or latitude and longitude</label>
          <input
            id="environmental-map-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Place or latitude, longitude"
            className="min-w-0 flex-1 border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
          <button type="submit" className="border border-l-0 border-zinc-800 bg-zinc-900 px-2.5 text-zinc-300 hover:text-emerald-300" aria-label="Find place or coordinates" title="Find place or coordinates">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>
      </div>}

      <div ref={mapSurfaceRef} className="relative min-h-[390px] flex-1 overflow-hidden rounded border border-zinc-900 bg-black">
        {mapFocusMode && (
          <button
            type="button"
            onClick={toggleMapFocus}
            className="absolute left-3 top-3 z-30 inline-flex items-center justify-center rounded border border-emerald-500/50 bg-zinc-950/90 p-2 text-emerald-300 shadow-lg hover:bg-zinc-900"
            aria-label="Restore dashboard and network"
            title="Restore dashboard and network"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {enabled ? (
          <iframe
            ref={iframeRef}
            title="EcoSentinel environmental node network map"
            src={initialMapUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            allow="fullscreen; geolocation"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[10px] font-mono uppercase text-zinc-600">Initializing map workspace</div>
        )}

        {tool !== "select" && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-zinc-700/80 bg-zinc-950/90 px-2.5 py-1.5 text-[10px] font-mono text-emerald-300">
            {tool === "add" ? "DOUBLE-CLICK TO PLACE" : tool === "connect" ? `CONNECT FROM ${nodes.find((node) => node.id === sourceNodeId)?.name || selectedNode?.label || "NODE"}` : "DRAG NODE TO MOVE · CLICK OUTSIDE TO CANCEL"}
          </div>
        )}

        {placement && nodeDraft && (
          <form
            onSubmit={submitNodeDraft}
            className="absolute z-20 w-[min(340px,calc(100%-16px))] max-h-[calc(100%-16px)] overflow-y-auto rounded border border-emerald-500/50 bg-zinc-950/98 p-3 shadow-2xl"
            style={{ left: `${Math.min(placement.x * 100, 70)}%`, top: `${Math.min(placement.y * 100, 56)}%` }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase text-zinc-100">{nodeDraft.existingId ? "Edit node" : "Add environmental node"}</h3>
                <p className="mt-1 text-[10px] font-mono text-zinc-500">{placement.latitude.toFixed(5)}, {placement.longitude.toFixed(5)}</p>
              </div>
              <button type="button" onClick={() => { setNodeDraft(null); setPlacement(null); }} className="rounded p-1 text-zinc-400 hover:bg-zinc-800" aria-label="Close node editor"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 space-y-1 text-[10px] font-mono text-zinc-400">NODE NAME
                <input value={nodeDraft.label} onChange={(event) => setDraftField("label", event.target.value)} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
              </label>
              <label className="space-y-1 text-[10px] font-mono text-zinc-400">TYPE
                <select value={nodeDraft.type} onChange={(event) => setDraftField("type", event.target.value as EnvironmentalNodeType)} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-[10px] text-zinc-100">
                  {NODE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-mono text-zinc-400">NETWORK
                <select value={nodeDraft.networkId} onChange={(event) => setDraftField("networkId", event.target.value)} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-[10px] text-zinc-100">
                  {networks.map((network) => <option key={network.id} value={network.id}>{network.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-mono text-zinc-400">LATITUDE
                <input type="number" min="-90" max="90" step="0.000001" value={nodeDraft.latitude} onChange={(event) => setDraftField("latitude", Number(event.target.value))} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
              </label>
              <label className="space-y-1 text-[10px] font-mono text-zinc-400">LONGITUDE
                <input type="number" min="-180" max="180" step="0.000001" value={nodeDraft.longitude} onChange={(event) => setDraftField("longitude", Number(event.target.value))} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
              </label>
              <label className="col-span-2 space-y-1 text-[10px] font-mono text-zinc-400">PURPOSE / TASK
                <input value={nodeDraft.task} onChange={(event) => setDraftField("task", event.target.value)} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
              </label>
            </div>

            <fieldset className="mt-3 border-t border-zinc-800 pt-2">
              <legend className="mb-2 text-[10px] font-mono uppercase text-zinc-400">Attached sensors</legend>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {ENVIRONMENTAL_SENSOR_CATALOG.map((sensor) => (
                  <label key={sensor.id} className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                    <input
                      type="checkbox"
                      checked={nodeDraft.sensorIds.includes(sensor.id)}
                      onChange={(event) => setDraftField("sensorIds", event.target.checked
                        ? [...nodeDraft.sensorIds, sensor.id]
                        : nodeDraft.sensorIds.filter((id) => id !== sensor.id))}
                      className="accent-emerald-400"
                    />
                    {sensor.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {formError && <p role="alert" className="mt-2 text-[10px] text-rose-400">{formError}</p>}
            <div className="mt-3 flex items-center justify-between gap-2">
              {nodeDraft.existingId && (
                <button type="button" onClick={() => { onDeleteNode(nodeDraft.existingId!); setNodeDraft(null); setPlacement(null); }} className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> DELETE</button>
              )}
              <button type="submit" className="rounded bg-emerald-500 px-3 py-1.5 text-[10px] font-semibold text-black hover:bg-emerald-400">{nodeDraft.existingId ? "SAVE NODE" : "ADD NODE"}</button>
            </div>
          </form>
        )}

        {networkDraft && (
          <form onSubmit={submitNetworkDraft} className="absolute left-1/2 top-1/2 z-20 w-[min(340px,calc(100%-20px))] -translate-x-1/2 -translate-y-1/2 border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-zinc-100">{networkDraft.id ? "Rename network" : "Create network"}</h3>
              <button type="button" onClick={() => setNetworkDraft(null)} className="rounded p-1 text-zinc-400 hover:bg-zinc-800" aria-label="Close network editor"><X className="h-4 w-4" /></button>
            </div>
            <label className="mb-2 block space-y-1 text-[10px] font-mono text-zinc-400">NETWORK NAME
              <input autoFocus value={networkDraft.name} onChange={(event) => setNetworkDraft({ ...networkDraft, name: event.target.value })} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
            </label>
            <label className="mb-3 block space-y-1 text-[10px] font-mono text-zinc-400">REGION
              <input value={networkDraft.region} onChange={(event) => setNetworkDraft({ ...networkDraft, region: event.target.value })} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
            </label>
            {!networkDraft.id && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[10px] font-mono text-zinc-400">CENTER LAT
                  <input type="number" step="0.0001" value={networkDraft.latitude} onChange={(event) => setNetworkDraft({ ...networkDraft, latitude: Number(event.target.value) })} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
                </label>
                <label className="space-y-1 text-[10px] font-mono text-zinc-400">CENTER LON
                  <input type="number" step="0.0001" value={networkDraft.longitude} onChange={(event) => setNetworkDraft({ ...networkDraft, longitude: Number(event.target.value) })} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-xs text-zinc-100" />
                </label>
              </div>
            )}
            <button type="submit" className="w-full rounded bg-emerald-500 px-3 py-2 text-[10px] font-semibold text-black hover:bg-emerald-400">{networkDraft.id ? "SAVE NETWORK" : "CREATE NETWORK"}</button>
          </form>
        )}

        {isEnvironmentalLayerVisible && selectedConnection && !nodeDraft && !networkDraft && (
          <div className="absolute bottom-3 left-3 z-20 max-w-[min(360px,calc(100%-24px))] border border-cyan-500/40 bg-zinc-950/95 p-3 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase text-cyan-300">SELECTED CONNECTION · {selectedConnection.kind}</div>
                <div className="mt-1 text-xs text-zinc-100">{selectedConnectionNodes[0]?.name} ↔ {selectedConnectionNodes[1]?.name}</div>
              </div>
              <button type="button" onClick={() => onSelectConnection(null)} className="text-zinc-500 hover:text-zinc-100" aria-label="Close connection details"><X className="h-4 w-4" /></button>
            </div>
            <label className="mt-2 block space-y-1 text-[9px] font-mono text-zinc-500">LINK TYPE
              <select value={selectedConnection.kind} onChange={(event) => onUpdateConnection(selectedConnection.id, event.target.value as EnvironmentalConnection["kind"])} className="w-full border border-zinc-800 bg-black px-2 py-1.5 text-[10px] text-zinc-200">
                <option value="radio">RADIO</option>
                <option value="gateway">GATEWAY / RELAY</option>
                <option value="mesh">MESH</option>
              </select>
            </label>
            <button type="button" onClick={() => onDeleteConnection(selectedConnection.id)} className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> REMOVE CONNECTION</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-900/80 pt-2 text-[10px] font-mono text-zinc-400">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span>ZONE: {selectedNode?.sector || activeNetwork?.region}</span>
          <span className="text-zinc-700">•</span>
          <span className="truncate">NODE: {selectedNode?.hardwareId || "--"}</span>
          <span className="text-zinc-700">•</span>
          <span>DATUM: WGS-84</span>
        </div>
        {selectedNode && (
          <button type="button" onClick={() => { setNodeDraft(nodeDraftFromNode(selectedNode)); setPlacement({ latitude: selectedNode.latitude, longitude: selectedNode.longitude, x: 0.5, y: 0.3 }); }} className="inline-flex shrink-0 items-center gap-1.5 text-zinc-300 hover:text-emerald-300" title="Edit selected node">
            <Pencil className="h-3.5 w-3.5" /> EDIT {selectedNode.label}
          </button>
        )}
        {!isFullscreen && (
          <button type="button" onClick={onFullscreen} className="inline-flex shrink-0 items-center gap-1.5 border-l border-zinc-800 pl-3 text-[10px] font-mono text-zinc-300 hover:text-emerald-300" aria-label="Open map fullscreen" title="Open map fullscreen">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /> FULLSCREEN MAP
          </button>
        )}
      </div>
    </div>
  );
}