# EcoSentinel

### Environmental Hazard Monitoring and Early Warning

EcoSentinel brings environmental sensor networks, hazard intelligence, and a
geospatial 3D globe into one monitoring workspace. It is designed to help teams
see changing conditions, understand local risk, and focus attention where it is
needed.

## Environmental Watch

- **Multi-hazard monitoring:** Organize monitoring around floods, forest fires,
  landslides, air quality, and weather or environmental conditions.
- **Sensor telemetry at a glance:** Review readings such as rainfall, water
  level, flow rate, soil moisture, temperature, and humidity alongside node
  status and connectivity details.
- **Risk and anomaly intelligence:** See hazard levels, risk and anomaly scores,
  trends, forecast conditions, confidence, and explanations with supporting
  sensor nodes.
- **Geospatial situational awareness:** Place sensor nodes and networks on an
  interactive 3D globe, inspect their relationships, and use map layers to add
  environmental context.
- **Network workspace:** Create and manage monitoring nodes, group them into
  networks, and connect related nodes to represent how environmental signals
  are observed across an area.
- **Signal-to-response workflow:** The platform is designed around an
  edge-to-intelligence pipeline: ESP32 sensors, MQTT ingestion, Node-RED stream
  processing, machine-learning risk analysis, and dashboard alerting.

## Data Notes

The dashboard includes sample hazard and sensor records for demonstration.
Displaying live readings from deployed hardware requires a connected telemetry
and inference service. The map also provides independent live-data layers; data
availability depends on each upstream provider and any required API credentials.
EcoSentinel supports monitoring and decision support; it does not replace
official warnings or emergency-response procedures.

## Run Locally

Requires Node.js 22 or newer.

Install dependencies in each app once:

```powershell
npm install --prefix remix-ecodsentinel-sid-10
npm install --prefix remix-v-jash-2
