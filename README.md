# EcoSentinel

Environmental hazard monitoring, sensor-network intelligence, and a live
geospatial globe in one browser application.

## Run Locally

Requires Node.js 22 or newer. Run these commands from the workspace root:

```powershell
npm install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard and globe
share one Vite server and origin; the globe is at `/maps/`, with its API routes
under `/api/`. Stop the server with Ctrl+C. Run `npm.cmd run build` for the
combined production output in `dist/`, or `npm.cmd run lint` for the TypeScript
check. In shells where `npm` resolves correctly, `npm run dev` is equivalent.

## Environmental Watch

- **Multi-hazard monitoring:** floods, forest fires, landslides, air quality,
	weather, and other environmental conditions.
- **Sensor telemetry:** rainfall, water level, flow rate, soil moisture,
	temperature, and humidity alongside node status and connectivity.
- **Risk and anomaly intelligence:** hazard levels, scores, trends, forecasts,
	confidence, explanations, and supporting sensor nodes.
- **Geospatial awareness:** inspect environmental nodes and networks on the
	interactive 3D globe, with map layers for additional context.
- **Network workspace:** create monitoring nodes, group them into networks,
	and connect related nodes.
- **Signal-to-response workflow:** designed around ESP32 sensors, MQTT
	ingestion, Node-RED stream processing, machine-learning risk analysis, and
	dashboard alerts.

## Configuration and Data

The dashboard includes sample hazard and sensor records. Live sensor readings
require a connected telemetry and inference service. Copy `.env.example` to
`.env` for optional dashboard `VITE_*` endpoint settings. Users enter the
FastAPI key with the dashboard's **API KEY** control; it is held only for that
tab and sent to the configured endpoint. Restrict it at the API provider. The
endpoint URL and polling interval remain deployment settings. Map-provider
keys are entered through **Provider Settings** per tab; all keys are optional.
The map's Vite middleware hosts
live-data proxies for sources such as OpenSky, CelesTrak, Overpass, CCTV, AIS,
TomTom, and FIRMS.

For browser-based key entry after deployment, serve the built app through the
Node Vite preview server (`npm.cmd run preview`) over HTTPS. **POWER UP ·
CONNECT APIs** has no login or deployment token: each user's provider keys stay
in that tab's session storage and are sent only with that tab's API requests.
They are never written to the server's `.env`; closing the tab clears them.
Static-only hosting cannot run the required provider proxies. If HTTPS
terminates at a trusted reverse proxy, set
`GEV_PROVIDER_SETTINGS_TRUST_PROXY=1`. Google Maps and Cesium ion keys are
browser-visible by design, so restrict them at the provider.

Availability depends on upstream providers and any required credentials. The
application supports monitoring and decision-making; it does not replace
official warnings or emergency-response procedures.

## Map Data Notes

The globe includes live aircraft, vessels, satellites, earthquakes, fires,
CCTV, and other layers. NASA GIBS MODIS land-surface temperature and GPM IMERG
precipitation, NOAA active-storm centres and forecast tracks, and U.S. Drought
Monitor boundaries are also available without API keys. NASA imagery may have
processing lag; the Drought Monitor is U.S.-only and updates weekly; NOAA storm
coverage is limited to monitored basins. GPM is satellite precipitation rate,
not a long-term drought index. These layers are not emergency alerts.

Surface heatmap and drought overlays may temporarily switch the globe from
Google 3D Photoreal to Esri Satellite so the imagery surface can render them.
The previous map stack is restored when the last surface overlay is disabled,
unless another stack was selected in the meantime.

## Bundled Data Attribution

The dam and datacenter layers are derived from OpenStreetMap and are licensed
under ODbL 1.0. Keep OpenStreetMap contributor attribution and the Open
Infrastructure Map source credit for dams. The bundled snapshots remove
contact-oriented values; the app does not use those fields. The dam layer has
704 features and the datacenter layer has 4,351. The original datacenter
extraction date and query were not recorded.

Offline physical-region polygons come from Natural Earth 10m vectors, which
are public domain. The bundle contains 1,046 named land regions and 292 marine
regions. Its source commit, fetch time, and curation metadata are recorded in
the dataset files; see `maps/DATA_SOURCES.md`.

Submarine cable and landing-point data are from TeleGeography's Submarine Cable
Map and are licensed CC BY-NC-SA 3.0, separately from this project's MIT
source license. Attribution is required: "© TeleGeography —
submarinecablemap.com". Commercial use is not permitted; remove the bundled
cable and landing-point files or obtain a commercial license before using the
project commercially. Adapted or redistributed data must retain the same
ShareAlike license. The bundle contains 712 cables and 1,917 landing points.

## God’s Eye AI Providers

The map supports OpenAI Realtime (`OPENAI_API_KEY`) and OpenRouter
(`OPENROUTER_API_KEY`, with an optional `OPENROUTER_MODEL`). OpenRouter handles
text/chat and map-tool requests; browser speech recognition and synthesis
provide microphone input and spoken replies. Enter keys through Provider
Settings. Browser-entered keys are kept in the current tab only and sent with
that tab's API requests; they are not written to the host.
OpenAI Realtime Standard/Mini can be switched in the chat header when OpenAI
is selected.

### Live Weather Overlays

`METEOSOURCE_API_KEY` enables regional live weather overlays from the Thematic
Maps panel. The server samples current conditions at nine points around the
camera view for air temperature, local temperature anomaly, threshold heat
risk, cloud cover, precipitation, and wind. Refresh after moving the camera.
The global OpenWeather temperature tile requires `OPENWEATHER_API_KEY`.
Temperature layers are not wet-bulb or medical heat indices; other scenario
overlays are illustrative, not live hazard alerts.

### Public Satellite, Storm, and Drought Layers

The Thematic Maps panel includes NASA GIBS MODIS land-surface temperature and
GPM IMERG precipitation, NOAA National Hurricane Center storm centres and
forecast tracks, and U.S. Drought Monitor D0-D4 boundaries. These sources need
no API keys. NASA imagery can have processing lag; NHC covers monitored basins;
the U.S. Drought Monitor is U.S.-only and updates weekly. GPM is precipitation
rate, not a long-term drought index. NASA tiles are requested directly; storm
and drought data use local caches.

Surface heatmap and drought layers may temporarily switch the globe from
Google 3D Photoreal to Esri Satellite so the imagery surface can render them.
The previous stack is restored when the last surface overlay is disabled,
unless another stack was selected in the meantime.

For source details and terms, see [maps/DATA_SOURCES.md](maps/DATA_SOURCES.md)
and [maps/LICENSE](maps/LICENSE).
