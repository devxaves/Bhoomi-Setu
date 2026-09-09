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
  area_hectares: number | string | null;
  land_type: string | null;
  geometry_geojson: Polygon | MultiPolygon;
  ownership_status: "clear" | "disputed" | "under_verification";
  litigation_flag: boolean;
  risk_score: number | string;
}

export interface ProjectMapItem {
  id: string;
  name: string;
  district: string;
  state: string;
  land_requiring_body?: string;
  project_type?: string | null;
  current_stage: string;
  status_flag: "green" | "amber" | "red" | "lapsed";
  risk_score: number | string;
  alignment_geojson?: any;
}

interface ParcelMapProps {
  parcels?: ParcelFeature[];
  projectAlignment?: any;
  projects?: ProjectMapItem[];
  selectedProject?: ProjectMapItem | null;
  onProjectSelect?: (project: ProjectMapItem) => void;
  onParcelClick?: (parcel: ParcelFeature) => void;
  onAlignmentDraw?: (geojson: Polygon | MultiPolygon) => void;
  drawMode?: boolean; // enable alignment drawing
  className?: string;
  initialBounds?: LngLatBoundsLike; // [sw_lng, sw_lat, ne_lng, ne_lat]
}

type RasterLayer = "osm" | "satellite" | "topo";

// Extract a representative [lng, lat] coordinate from any GeoJSON geometry
function getProjectCoordinates(geo: any): [number, number] | null {
  if (!geo) return null;
  if (geo.type === "Point" && Array.isArray(geo.coordinates)) {
    return [geo.coordinates[0], geo.coordinates[1]];
  }
  if (geo.type === "LineString" && Array.isArray(geo.coordinates) && geo.coordinates.length > 0) {
    const coords = geo.coordinates;
    const midIndex = Math.floor(coords.length / 2);
    return [coords[midIndex][0], coords[midIndex][1]];
  }
  if (geo.type === "Polygon" && Array.isArray(geo.coordinates) && geo.coordinates[0]?.length > 0) {
    const ring = geo.coordinates[0];
    let sumLng = 0;
    let sumLat = 0;
    for (let i = 0; i < ring.length; i++) {
      sumLng += ring[i][0];
      sumLat += ring[i][1];
    }
    return [sumLng / ring.length, sumLat / ring.length];
  }
  if (geo.type === "MultiPolygon" && Array.isArray(geo.coordinates)) {
    const ring = geo.coordinates[0]?.[0];
    if (ring && ring.length > 0) {
      let sumLng = 0;
      let sumLat = 0;
      for (let i = 0; i < ring.length; i++) {
        sumLng += ring[i][0];
        sumLat += ring[i][1];
      }
      return [sumLng / ring.length, sumLat / ring.length];
    }
  }
  return null;
}

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
      .map((p) => {
        const score = Number(p.risk_score ?? 0);
        return {
          type: "Feature",
          id: p.id,
          geometry: p.geometry_geojson,
          properties: {
            id: p.id,
            ulpin: p.ulpin,
            village: p.village ?? "",
            district: p.district ?? "",
            area_hectares: Number(p.area_hectares ?? 0),
            ownership_status: p.ownership_status,
            litigation_flag: p.litigation_flag,
            risk_score: score,
            fill_color: riskColor(score),
          },
        };
      }),
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
  projects = [],
  selectedProject = null,
  onProjectSelect,
  onParcelClick,
  onAlignmentDraw,
  drawMode = false,
  className = "",
  initialBounds,
}: ParcelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<any[]>([]);
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
          filter: ["in", "$type", "Polygon"],
        });
        map.addLayer({
          id: "alignment-glow",
          type: "line",
          source: "alignment",
          paint: {
            "line-color": "#a5b4fc",
            "line-width": 6,
            "line-opacity": 0.45,
          },
        });
        map.addLayer({
          id: "alignment-stroke",
          type: "line",
          source: "alignment",
          paint: {
            "line-color": "#4f46e5",
            "line-width": 3,
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
  }, [parcels, mapLoaded]);

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

  // --- Render project markers on map ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // Clean up old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!projects || projects.length === 0) return;

    import("maplibre-gl").then((maplibre) => {
      projects.forEach((proj) => {
        const coords = getProjectCoordinates(proj.alignment_geojson);
        if (!coords) return;

        const isSelected = selectedProject?.id === proj.id;
        const risk = Number(proj.risk_score ?? 0);
        const color =
          proj.status_flag === "green"
            ? "#10b981"
            : proj.status_flag === "amber"
            ? "#f59e0b"
            : proj.status_flag === "red"
            ? "#ef4444"
            : "#8b5cf6";

        const el = document.createElement("div");
        el.className = "cursor-pointer select-none group";
        el.style.zIndex = isSelected ? "50" : "20";

        // Display label: short project name or district
        const shortLabel = proj.name.split(":")[0].replace(/Expansion|Widening|Extension/gi, "").trim() || proj.district;

        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 600;
              background-color: ${isSelected ? "#0f172a" : "#ffffff"};
              color: ${isSelected ? "#f8fafc" : "#1e293b"};
              border: 1.5px solid ${isSelected ? "#f59e0b" : "#cbd5e1"};
              box-shadow: ${isSelected ? "0 10px 15px -3px rgba(0,0,0,0.3), 0 0 0 3px rgba(245, 158, 11, 0.45)" : "0 3px 6px -1px rgba(0,0,0,0.12)"};
              transform: ${isSelected ? "scale(1.1)" : "scale(1)"};
              transition: all 0.2s ease;
            ">
              <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0; box-shadow: 0 0 0 1.5px white;"></span>
              <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${shortLabel}
              </span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 5px solid ${isSelected ? "#f59e0b" : "#94a3b8"};
              margin-top: -1px;
            "></div>
          </div>
        `;

        // Popup tooltip
        const popup = new maplibre.Popup({
          offset: 14,
          closeButton: false,
          closeOnClick: false,
        }).setHTML(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 6px; font-size: 11px; max-width: 220px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px; line-height: 1.2;">${proj.name}</div>
            <div style="color: #64748b; font-size: 10px; margin-bottom: 5px;">📍 ${proj.district}, ${proj.state}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 1px 5px; border-radius: 4px; background: ${color}; color: #fff;">
                ${proj.status_flag}
              </span>
              <span style="font-weight: 600; color: #334155;">Risk: ${risk.toFixed(1)}</span>
            </div>
            <div style="margin-top: 4px; font-size: 10px; color: #d97706; font-weight: 500;">
              Click to view corridor & parcels →
            </div>
          </div>
        `);

        el.addEventListener("mouseenter", () => {
          if (!isSelected) popup.setLngLat(coords).addTo(map);
        });
        el.addEventListener("mouseleave", () => {
          popup.remove();
        });

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          popup.remove();
          onProjectSelect?.(proj);
        });

        const marker = new maplibre.Marker({ element: el, anchor: "bottom" })
          .setLngLat(coords)
          .addTo(map);

        markersRef.current.push(marker);
      });
    });
  }, [projects, selectedProject, mapLoaded, onProjectSelect]);

  // --- Auto-fit camera to selected project or national view ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    if (selectedProject) {
      import("@turf/turf").then(({ bbox, feature, featureCollection }) => {
        try {
          if (parcels.length > 0) {
            const validParcels = parcels.filter((p) => p.geometry_geojson);
            if (validParcels.length > 0) {
              const fc = featureCollection(validParcels.map((p) => feature(p.geometry_geojson)));
              const [minLng, minLat, maxLng, maxLat] = bbox(fc);
              map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 15 });
              return;
            }
          }

          if (projectAlignment) {
            const [minLng, minLat, maxLng, maxLat] = bbox(feature(projectAlignment));
            if (minLng === maxLng && minLat === maxLat) {
              map.flyTo({ center: [minLng, minLat], zoom: 13 });
            } else {
              map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 14 });
            }
            return;
          }

          const coords = getProjectCoordinates(selectedProject.alignment_geojson);
          if (coords) {
            map.flyTo({ center: coords, zoom: 12 });
          }
        } catch (e) {
          console.error("Camera fit error:", e);
        }
      });
    } else if (projects && projects.length > 0 && !initialBounds) {
      // Show all project markers across India
      const allCoords = projects
        .map((p) => getProjectCoordinates(p.alignment_geojson))
        .filter((c): c is [number, number] => c !== null);

      if (allCoords.length > 1) {
        let minLng = allCoords[0][0];
        let maxLng = allCoords[0][0];
        let minLat = allCoords[0][1];
        let maxLat = allCoords[0][1];
        allCoords.forEach(([lng, lat]) => {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, maxZoom: 7 });
      }
    }
  }, [selectedProject, projectAlignment, parcels, mapLoaded, projects, initialBounds]);

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
                    backgroundColor:
                      Number(selectedParcel.risk_score ?? 0) >= 60
                        ? "#fee2e2"
                        : Number(selectedParcel.risk_score ?? 0) >= 30
                        ? "#fef3c7"
                        : "#dcfce7",
                    color: riskColor(Number(selectedParcel.risk_score ?? 0)),
                  }}
                >
                  {Number(selectedParcel.risk_score ?? 0).toFixed(1)} / 100
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
