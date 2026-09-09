/**
 * BhoomiSetu — Parcel Spatial Intersection API
 * POST /api/parcels/intersect
 *
 * Body: { alignment: Polygon | MultiPolygon, district?: string, state?: string }
 * Returns: parcels whose geometry_geojson intersects the given alignment polygon.
 *
 * Spatial logic: since we store geometry as jsonb (not PostGIS geometry columns),
 * we do a DB fetch of candidate parcels (optionally filtered by district/state)
 * and use turf.js booleanIntersects for precise intersection in application code.
 *
 * This is the correct pattern for the jsonb-geometry fallback documented in the spec.
 * When PostGIS is available on Neon, this endpoint can be upgraded to a single
 * ST_Intersects() query for better performance at scale.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { query } from "@/lib/db/pool";
import type { Parcel } from "@/lib/db/queries/parcels";
import type { Polygon, MultiPolygon, Feature, Geometry } from "geojson";

interface IntersectRequestBody {
  alignment: Polygon | MultiPolygon;
  district?: string;
  state?: string;
}

export async function POST(req: NextRequest) {
  // This endpoint is accessible to authenticated users only
  // (public version for /citizen/lookup uses a separate scoped endpoint)
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<IntersectRequestBody>;

    if (!body.alignment) {
      return NextResponse.json(
        { error: "Missing required field: alignment (GeoJSON Polygon or MultiPolygon)" },
        { status: 400 }
      );
    }

    const { alignment, district, state } = body;

    if (alignment.type !== "Polygon" && alignment.type !== "MultiPolygon") {
      return NextResponse.json(
        { error: "alignment must be a GeoJSON Polygon or MultiPolygon" },
        { status: 400 }
      );
    }

    // Build candidate fetch query (filtered to reduce dataset size)
    const conditions: string[] = [];
    const params: string[] = [];
    let idx = 1;

    if (district) {
      conditions.push(`district = $${idx++}`);
      params.push(district);
    }
    if (state) {
      conditions.push(`state = $${idx++}`);
      params.push(state);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows: candidates } = await query<Parcel>(
      `SELECT id, ulpin, project_id, survey_number, village, district, state,
              area_hectares, land_type, geometry_geojson, ownership_status,
              litigation_flag, risk_score
       FROM parcels ${where}
       ORDER BY ulpin`,
      params
    );

    if (candidates.length === 0) {
      return NextResponse.json({ data: [], count: 0, note: "No candidate parcels in this region" });
    }

    // Turf.js application-side intersection check
    const { booleanIntersects, feature, polygon, multiPolygon } = await import("@turf/turf");

    const alignmentFeature: Feature<Polygon | MultiPolygon> =
      alignment.type === "Polygon"
        ? feature(polygon(alignment.coordinates).geometry)
        : feature(multiPolygon(alignment.coordinates).geometry);

    const intersecting = candidates.filter((parcel) => {
      try {
        const geom = parcel.geometry_geojson as Polygon | MultiPolygon;
        if (!geom || !geom.coordinates) return false;

        const parcelFeature: Feature<Geometry> =
          geom.type === "Polygon"
            ? feature(polygon(geom.coordinates).geometry)
            : feature(multiPolygon(geom.coordinates).geometry);

        return booleanIntersects(alignmentFeature, parcelFeature);
      } catch {
        return false;
      }
    });

    // Return a slimmed-down response (no full geometry_geojson to keep payload small)
    const result = intersecting.map((p) => ({
      id: p.id,
      ulpin: p.ulpin,
      project_id: p.project_id,
      survey_number: p.survey_number,
      village: p.village,
      district: p.district,
      state: p.state,
      area_hectares: p.area_hectares,
      land_type: p.land_type,
      ownership_status: p.ownership_status,
      litigation_flag: p.litigation_flag,
      risk_score: p.risk_score,
    }));

    return NextResponse.json({
      data: result,
      count: result.length,
      candidates_checked: candidates.length,
    });
  } catch (err) {
    console.error("POST /api/parcels/intersect error:", err);
    return NextResponse.json(
      { error: "Intersection query failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
