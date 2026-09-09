/**
 * BhoomiSetu — ParcelMap Component (Phase 2: GIS Engine)
 *
 * Full-featured MapLibre GL map with:
 * - Raster tile sources: OSM, Esri Satellite, OpenTopoMap (toggle)
 * - Nominatim India geocoder (countrycodes=in)
 * - Parcel polygon layer colored by risk_score / status_flag
 * - Project alignment GeoJSON overlay
 * - Click → parcel detail sidebar
 * - Draw mode for alignment corridors (via @mapbox/mapbox-gl-draw)
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as MapLibreMap, GeoJSONSource, LngLatBoundsLike } from "maplibre-gl";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { Layers, Satellite, Mountain, MapPin, X } from "lucide-react";

// Parcel data shape as returned from /api/parcels
export interface ParcelFeature {
  id: string;
  ulpin: string;
  project_id: string | null;
  survey_number: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  area_hectares: number | null;
  land_type: string | null;
  geometry_geojson: Polygon | MultiPolygon;
  ownership_status: "clear" | "disputed" | "under_verification";
  litigation_flag: boolean;
  risk_score: number;
}

interface ParcelMapProps {
  parcels?: ParcelFeature[];
  projectAlignment?: Polygon | MultiPolygon | null;
  onParcelClick?: (parcel: ParcelFeature) => void;
  onAlignmentDraw?: (geojson: Polygon | MultiPolygon) => void;
  drawMode?: boolean; // enable alignment drawing
  className?: string;
  initialBounds?: LngLatBoundsLike; // [sw_lng, sw_lat, ne_lng, ne_lat]
}

type RasterLayer = "osm" | "satellite" | "topo";

// Risk score → fill color (0-100 scale)
function riskColor(score: number): string {
  if (score >= 70) return "#ef4444"; // red
  if (score >= 40) return "#f59e0b"; // amber
  return "#22c55e"; // green
}

// Status flag → fill color
function statusColor(flag: string): string {
  const map: Record<string, string> = {
    green: "#22c55e",
    amber: "#f59e0b",
    red: "#ef4444",
    lapsed: "#7c3aed",
  };
  return map[flag] ?? "#6b7280";
}

// Build a GeoJSON FeatureCollection from parcels for the map source
function buildParcelGeoJSON(parcels: ParcelFeature[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: parcels
      .filter((p) => p.geometry_geojson)
      .map((p) => ({
        type: "Feature",
        id: p.id,
        geometry: p.geometry_geojson,
        properties: {
          id: p.id,
          ulpin: p.ulpin,
          village: p.village ?? "",
          district: p.district ?? "",
          area_hectares: p.area_hectares ?? 0,
          ownership_status: p.ownership_status,
          litigation_flag: p.litigation_flag,
          risk_score: p.risk_score,
          fill_color: riskColor(p.risk_score),
        },
      })),
  };
}

const RASTER_SOURCES: Record<RasterLayer, { name: string; tiles: string[]; attribution: string; icon: React.ReactNode }> = {
  osm: {
    name: "Street",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    icon: <MapPin className="h-3.5 w-3.5" />,
  },
  satellite: {
    name: "Satellite",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "© Esri, DigitalGlobe",
    icon: <Satellite className="h-3.5 w-3.5" />,
  },
  topo: {
    name: "Topo",
    tiles: ["https://a.tile.opentopomap.org/{z}/{x}/{y}.png"],
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    icon: <Mountain className="h-3.5 w-3.5" />,
  },
};

export default function ParcelMap({
  parcels = [],
  projectAlignment = null,
  onParcelClick,
  onAlignmentDraw,
  drawMode = false,
  className = "",
  initialBounds,
}: ParcelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const drawRef = useRef<unknown>(null);
  const [activeLayer, setActiveLayer] = useState<RasterLayer>("osm");
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [drawActive, setDrawActive] = useState(false);

  // --- Initialise MapLibre map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    Promise.all([
      import("maplibre-gl"),
      import("@maplibre/maplibre-gl-geocoder"),
    ]).then(([maplibre, { default: MaplibreGeocoder }]) => {
      const { Map, NavigationControl, ScaleControl, AttributionControl } = maplibre;

      const map = new Map({
        container: containerRef.current!,
        style: buildStyle("osm"),
        center: [78.9629, 20.5937], // India centre
        zoom: 4.5,
        attributionControl: false,
      });

      map.addControl(new NavigationControl(), "top-right");
      map.addControl(new ScaleControl({ unit: "metric" }), "bottom-right");
      map.addControl(
        new AttributionControl({ compact: true }),
        "bottom-left"
      );

      // Nominatim geocoder — India only
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geocoderApi: any = {
        forwardGeocode: async (config: { query?: string | number[] }) => {
          const q = typeof config.query === "string" ? config.query : "";
          const url = new URL("https://nominatim.openstreetmap.org/search");
          url.searchParams.set("q", q);
          url.searchParams.set("format", "geojson");
          url.searchParams.set("countrycodes", "in");
          url.searchParams.set("limit", "5");
          const res = await fetch(url.toString(), {
            headers: { "Accept-Language": "en" },
          });
          const data = await res.json();
          return {
            type: "FeatureCollection",
            features: (data.features ?? []).map((f: Record<string, unknown>) => {
              const geo = f.geometry as { coordinates: number[] };
              const props = f.properties as Record<string, unknown>;
              return {
                type: "Feature",
                geometry: { type: "Point", coordinates: geo.coordinates },
                place_name: props.display_name as string,
                properties: props,
                text: props.display_name as string,
                place_type: ["place"],
                center: geo.coordinates as [number, number],
              };
            }),
          };
        },
        reverseGeocode: async () => ({ type: "FeatureCollection", features: [] }),
      };

      const geocoder = new MaplibreGeocoder(geocoderApi, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        maplibregl: maplibre as any,
        placeholder: "Search district, tehsil, village…",
        collapsed: false,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addControl(geocoder as any, "top-left");

      map.on("load", () => {
        // Add parcel source + layers
        map.addSource("parcels", {
          type: "geojson",
          data: buildParcelGeoJSON([]),
        });

        // Fill layer — colored by risk_score
        map.addLayer({
          id: "parcels-fill",
          type: "fill",
          source: "parcels",
          paint: {
            "fill-color": ["get", "fill_color"],
            "fill-opacity": 0.55,
          },
        });

        // Stroke layer
        map.addLayer({
          id: "parcels-stroke",
          type: "line",
          source: "parcels",
          paint: {
            "line-color": "#1e293b",
            "line-width": 1.2,
            "line-opacity": 0.8,
          },
        });

        // Hover highlight
        map.addLayer({
          id: "parcels-hover",
          type: "fill",
          source: "parcels",
          paint: {
            "fill-color": "#ffffff",
            "fill-opacity": 0.25,
          },
          filter: ["==", ["get", "id"], ""],
        });

        // Alignment source + layer
        map.addSource("alignment", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "alignment-fill",
          type: "fill",
          source: "alignment",
          paint: {
            "fill-color": "#6366f1",
            "fill-opacity": 0.18,
          },
        });
        map.addLayer({
          id: "alignment-stroke",
          type: "line",
          source: "alignment",
          paint: {
            "line-color": "#4f46e5",
            "line-width": 2.5,
            "line-dasharray": [4, 2],
          },
        });

        setMapLoaded(true);
      });

      // Hover on parcels
      let hoveredId: string | null = null;
      map.on("mousemove", "parcels-fill", (e) => {
        if (e.features?.length) {
          const id = e.features[0].properties?.id as string;
          if (hoveredId !== id) {
            map.setFilter("parcels-hover", ["==", ["get", "id"], id]);
            hoveredId = id;
          }
          map.getCanvas().style.cursor = "pointer";
        }
      });
      map.on("mouseleave", "parcels-fill", () => {
        map.setFilter("parcels-hover", ["==", ["get", "id"], ""]);
        map.getCanvas().style.cursor = "";
        hoveredId = null;
      });

      // Click on parcel
      map.on("click", "parcels-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as ParcelFeature;
        const match = parcels.find((p) => p.id === props.id);
        if (match) {
          setSelectedParcel(match);
          onParcelClick?.(match);
        }
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build MapLibre style object with the given raster layer
  function buildStyle(layer: RasterLayer) {
    const src = RASTER_SOURCES[layer];
    return {
      version: 8 as const,
      sources: {
        raster: {
          type: "raster" as const,
          tiles: src.tiles,
          tileSize: 256,
          attribution: src.attribution,
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "raster",
          type: "raster" as const,
          source: "raster",
        },
      ],
    };
  }

  // --- Sync parcels → GeoJSON source ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const src = mapRef.current.getSource("parcels") as GeoJSONSource | undefined;
    src?.setData(buildParcelGeoJSON(parcels));

    // Auto-fit bounds if parcels exist
    if (parcels.length > 0 && !initialBounds) {
      try {
        import("@turf/turf").then(({ bbox, featureCollection, feature }) => {
          const fc = featureCollection(
            parcels
              .filter((p) => p.geometry_geojson)
              .map((p) => feature(p.geometry_geojson))
          );
          const [minLng, minLat, maxLng, maxLat] = bbox(fc);
          mapRef.current?.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 15 });
        });
      } catch { /* ignore */ }
    }
  }, [parcels, mapLoaded, initialBounds]);

  // --- Sync alignment overlay ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const src = mapRef.current.getSource("alignment") as GeoJSONSource | undefined;
    if (projectAlignment) {
      src?.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: projectAlignment, properties: {} }],
      });
    } else {
      src?.setData({ type: "FeatureCollection", features: [] });
    }
  }, [projectAlignment, mapLoaded]);

  // --- Switch raster layer ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const src = RASTER_SOURCES[activeLayer];
    // Update raster source tiles
    (map.getSource("raster") as maplibregl.RasterTileSource | undefined)?.setTiles?.(src.tiles);
  }, [activeLayer, mapLoaded]);

  // --- Draw mode (alignment polygon) ---
  const toggleDraw = useCallback(async () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (!drawRef.current) {
      const { default: MapboxDraw } = await import("@mapbox/mapbox-gl-draw");
      // CSS is imported globally in layout.tsx

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        defaultMode: "draw_polygon",
      });

      map.addControl(draw as unknown as maplibregl.IControl);
      drawRef.current = draw;

      map.on("draw.create", () => {
        const data = draw.getAll();
        const poly = data.features[0]?.geometry as Polygon | MultiPolygon | undefined;
        if (poly) onAlignmentDraw?.(poly);
      });
      map.on("draw.update", () => {
        const data = draw.getAll();
        const poly = data.features[0]?.geometry as Polygon | MultiPolygon | undefined;
        if (poly) onAlignmentDraw?.(poly);
      });

      setDrawActive(true);
    } else {
      // Already added — toggle off by removing
      map.removeControl(drawRef.current as maplibregl.IControl);
      drawRef.current = null;
      setDrawActive(false);
    }
  }, [mapLoaded, onAlignmentDraw]);

  // Fit to initialBounds prop
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !initialBounds) return;
    mapRef.current.fitBounds(initialBounds as LngLatBoundsLike, { padding: 40 });
  }, [initialBounds, mapLoaded]);

  return (
    <div className={`relative flex ${className}`}>
      {/* Map container */}
      <div ref={containerRef} className="flex-1 rounded-xl overflow-hidden" style={{ minHeight: 480 }} />

      {/* Layer toggle */}
      <div className="absolute top-2 right-14 z-10 flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow border p-1">
        {(Object.entries(RASTER_SOURCES) as [RasterLayer, typeof RASTER_SOURCES.osm][]).map(([key, src]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            title={src.name}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              activeLayer === key
                ? "bg-amber-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {src.icon}
            {src.name}
          </button>
        ))}
      </div>

      {/* Draw toggle button (when drawMode enabled) */}
      {drawMode && (
        <div className="absolute top-12 right-14 z-10">
          <button
            onClick={toggleDraw}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium shadow border transition-colors ${
              drawActive
                ? "bg-indigo-600 text-white border-indigo-700"
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {drawActive ? "Drawing…" : "Draw Alignment"}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 right-2 z-10 bg-white/90 backdrop-blur rounded-lg shadow border p-2 text-xs">
        <div className="font-semibold text-gray-700 mb-1">Risk Score</div>
        {[
          { color: "#22c55e", label: "Low (0–40)" },
          { color: "#f59e0b", label: "Medium (40–70)" },
          { color: "#ef4444", label: "High (70+)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: item.color }} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
        <div className="border-t mt-1 pt-1 font-semibold text-gray-700 mb-1">Alignment</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#6366f1", opacity: 0.6 }} />
          <span className="text-gray-600">Project corridor</span>
        </div>
      </div>

      {/* Parcel detail panel */}
      {selectedParcel && (
        <div className="absolute top-2 left-2 z-20 w-72 bg-white rounded-xl shadow-lg border p-4 animate-fade-in">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">ULPIN</div>
              <div className="font-mono font-bold text-sm text-amber-700">{selectedParcel.ulpin}</div>
            </div>
            <button
              onClick={() => setSelectedParcel(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Survey No." value={selectedParcel.survey_number ?? "—"} />
            <Row label="Village" value={selectedParcel.village ?? "—"} />
            <Row label="District" value={selectedParcel.district ?? "—"} />
            <Row label="Area" value={selectedParcel.area_hectares ? `${selectedParcel.area_hectares} ha` : "—"} />
            <Row label="Land Type" value={selectedParcel.land_type ?? "—"} />
            <div className="flex justify-between">
              <span className="text-gray-500">Ownership</span>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  selectedParcel.ownership_status === "clear"
                    ? "bg-green-100 text-green-700"
                    : selectedParcel.ownership_status === "disputed"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {selectedParcel.ownership_status}
              </span>
            </div>
            {selectedParcel.litigation_flag && (
              <div className="flex items-center gap-1 text-red-600 text-xs bg-red-50 rounded px-2 py-1">
                ⚠️ Litigation flag active
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-gray-500 font-medium">Risk Score</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedParcel.risk_score >= 60 ? "#fee2e2" : selectedParcel.risk_score >= 30 ? "#fef3c7" : "#dcfce7",
                    color: riskColor(selectedParcel.risk_score),
                  }}
                >
                  {selectedParcel.risk_score.toFixed(1)} / 100
                </span>
                <a
                  href="/risk"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  title="View contributing explainable factors in Risk Console"
                >
                  Why? →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
