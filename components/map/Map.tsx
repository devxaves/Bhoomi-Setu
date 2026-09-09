/**
 * BhoomiSetu — GIS Map Component (Phase 2 Placeholder)
 *
 * The full MapLibre GL implementation will be built in Phase 2 (GIS Engine).
 * This stub exports a no-op component to keep the codebase compiling cleanly.
 *
 * Phase 2 will include:
 * - MapLibre GL map with parcel polygon layer
 * - ULPIN-tagged parcel popups
 * - Project alignment drawing tools
 * - Turf.js intersection detection
 * - District boundary overlays
 */

"use client";

import { Map as MapIcon } from "lucide-react";

interface MapProps {
  className?: string;
  projectId?: string;
}

export default function Map({ className = "", projectId }: MapProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 ${className}`}
      style={{ minHeight: 360 }}
    >
      <MapIcon className="h-12 w-12 text-amber-400 mb-3" />
      <p className="font-semibold text-amber-800">GIS Parcel Atlas</p>
      <p className="text-sm text-amber-600 mt-1">
        {projectId ? `Project: ${projectId}` : "Interactive map — Coming in Phase 2"}
      </p>
    </div>
  );
}