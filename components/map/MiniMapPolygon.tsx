/**
 * BhoomiSetu — MiniMapPolygon Component
 *
 * Compact polygon-drawing tool for admin parcel geometry entry.
 * Renders a small MapLibre map with MapboxDraw in polygon mode.
 * Fires onChange(geojson) whenever a polygon is drawn or updated.
 * Used in /admin → Add Parcel form.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Polygon, MultiPolygon } from "geojson";
import { PenLine, Trash2, CheckCircle2 } from "lucide-react";

interface MiniMapPolygonProps {
  value?: Polygon | MultiPolygon | null;
  onChange: (geojson: Polygon | MultiPolygon | null) => void;
  height?: number;
}

export default function MiniMapPolygon({ value, onChange, height = 320 }: MiniMapPolygonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const drawRef = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasGeom, setHasGeom] = useState(!!value);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    Promise.all([
      import("maplibre-gl"),
      import("@mapbox/mapbox-gl-draw"),
    ]).then(([maplibre, { default: MapboxDraw }]) => {
      const { Map, NavigationControl } = maplibre;

      const map = new Map({
        container: containerRef.current!,
        style: {
          version: 8 as const,
          sources: {
            osm: {
              type: "raster" as const,
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
        },
        center: [78.9629, 20.5937],
        zoom: 4,
        attributionControl: false,
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
        defaultMode: "simple_select",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addControl(draw as any, "top-right");
      drawRef.current = draw;

      map.on("load", () => {
        // If there's an existing value, add it to draw
        if (value) {
          draw.add({
            type: "Feature",
            geometry: value,
            properties: {},
          });
          // Fit to the geometry
          import("@turf/turf").then(({ bbox }) => {
            const [minLng, minLat, maxLng, maxLat] = bbox({
              type: "FeatureCollection",
              features: [{ type: "Feature", geometry: value, properties: {} }],
            });
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 40 });
          });
        }
        setLoaded(true);
      });

      function emitChange() {
        const data = draw.getAll();
        const poly = data.features[0]?.geometry as Polygon | MultiPolygon | undefined;
        setHasGeom(!!poly);
        onChange(poly ?? null);
      }

      map.on("draw.create", emitChange);
      map.on("draw.update", emitChange);
      map.on("draw.delete", () => {
        setHasGeom(false);
        onChange(null);
      });

      mapRef.current = map;
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any)?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearDraw = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (drawRef.current as any)?.deleteAll?.();
    setHasGeom(false);
    onChange(null);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <PenLine className="h-4 w-4 text-indigo-600" />
          Draw Parcel Boundary
        </div>
        {hasGeom && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              Polygon captured
            </span>
            <button
              type="button"
              onClick={clearDraw}
              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-0.5"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden border border-gray-200 relative"
        style={{ height }}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-sm text-gray-400 animate-pulse">Loading map…</div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Click the polygon tool (top-right of map) to start drawing. Click first point again to close.
      </p>
    </div>
  );
}
