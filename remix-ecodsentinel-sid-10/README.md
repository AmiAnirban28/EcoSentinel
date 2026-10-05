# EcoSentinel — Maps (God's Eye View)

Cesium-based 3D globe with live aircraft, vessels, satellites, quakes, fires, CCTV and more.

```bash
npm install
cp .env.example .env     # add the API keys you have; all are optional
npm run dev              # http://localhost:5173
npm run build            # production build in dist/
```

Use `npm run dev` for full functionality: the dev server hosts the API proxies
(OpenSky, CelesTrak, Overpass, CCTV, AIS, TomTom, FIRMS ...) configured in `vite.config.js`.

## God’s Eye AI provider

The existing God’s Eye chat interface supports two server-configured providers:

- **OpenAI** (`GEV_AI_PROVIDER="openai"`, the default): uses the existing OpenAI
  Realtime agent and its voice controls. Set `OPENAI_API_KEY`.
- **OpenRouter** (`GEV_AI_PROVIDER="openrouter"`): sends text/chat and map-tool
  requests through the local server proxy. Set `OPENROUTER_API_KEY`; optionally
  choose a model with `OPENROUTER_MODEL="openrouter/free"` or another model ID
  available to your OpenRouter account. Browser speech recognition and speech
  synthesis provide microphone input and spoken replies on this path.

For local development, either set these variables in `.env` before starting
`npm run dev`, or open **Provider Settings** in the app, enter provider keys,
choose the provider/model, and save. The settings dialog saves into the local
configuration and restarts Vite. API keys remain server-side; only provider and
model identifiers are sent to the browser. OpenAI Realtime Standard/Mini can
still be switched in the chat header when OpenAI is selected.

### Live weather overlays

`METEOSOURCE_API_KEY` can be saved from Provider Settings, opened directly via
the **API KEYS** button in the Thematic Maps weather section.
The Thematic Maps panel uses the server-side `/api/meteosource` proxy to sample
current weather at nine points around the current camera view. It builds
regional overlays for air temperature, local temperature anomaly,
temperature-threshold heat risk, cloud cover, current precipitation, and wind.
These overlays are regional to the current view; refresh after moving the camera.
For a global temperature raster, use the OpenWeather temperature tile in
**OpenWeather Dynamic Layers** (requires `OPENWEATHER_API_KEY`). The high-
temperature layer is a temperature-only indicator, not a wet-bulb or medical
heat index. Other pre-existing thematic scenarios are illustrative overlays
and should not be used as live hazard alerts.

### Public satellite, storm, and drought layers

The Thematic Maps panel also includes NASA GIBS MODIS land-surface temperature
and GPM IMERG precipitation tiles, NOAA National Hurricane Center active-storm
centres with official forecast-track KMZ overlays, and the U.S. Drought
Monitor's current D0–D4 boundaries. These sources require no API keys. NASA
rasters are served directly as cached map tiles; the NHC feed is cached locally
for ten minutes and forecast tracks are fetched only when enabled; simplified
U.S. drought boundaries are cached for six hours. NASA imagery is requested
directly as map tiles, avoiding a full-raster download.

When a surface heatmap or drought overlay is enabled from the default Google
3D Photoreal view, the map temporarily switches to Esri Satellite so the globe
imagery surface can render the overlay. The previous map stack is restored once
the last surface overlay is turned off (unless the user selected a different
map stack in the meantime).

Coverage and update limits: the U.S. Drought Monitor covers the United States
and updates weekly; NHC active storms cover its monitored Atlantic and Pacific
basins, not every global cyclone; NASA satellite products have processing lag
and are not instantaneous ground-temperature observations. GPM is a satellite
precipitation-rate layer, not a long-term drought index. All controls are in the
Thematic Maps panel; the drought layer is explicitly U.S.-only.

Data sources and terms: see `DATA_SOURCES.md`. License: `LICENSE` (MIT).
