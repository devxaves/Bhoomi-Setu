/**
 * BhoomiSetu — Atlas Demo Seed API
 * POST /api/seed/atlas
 *
 * Seeds realistic demo data for the atlas:
 * - Alignment corridors (LineString/Polygon) for projects missing alignment_geojson
 * - Parcels with geometry positioned along corridors
 * - Demo affected families for R&R tracking
 *
 * Safe to call multiple times — idempotent (skips projects that already have alignment).
 */

import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db/pool";
import type { PoolClient } from "pg";

// ── Demo corridor geometries ──────────────────────────────────────────────
// Realistic GeoJSON for Indian infrastructure projects

interface DemoCorridor {
  projectName: string;
  alignment: any; // GeoJSON LineString or Polygon
  parcels: DemoParcel[];
}

interface DemoParcel {
  ulpin: string;
  surveyNumber: string;
  village: string;
  geometry: any; // GeoJSON Polygon
  areaHectares: number;
  landType: string;
  ownershipStatus: "clear" | "disputed" | "under_verification";
  litigationFlag: boolean;
  riskScore: number;
}

// ── NH-48 Bangalore–Mangalore Highway Expansion (Dakshina Kannada) ──────

const NH48_CORRIDOR: DemoCorridor = {
  projectName: "NH-48 Expansion: Bangalore–Mangalore Highway Widening",
  alignment: {
    type: "LineString",
    coordinates: [
      [74.9800, 12.8700],
      [74.9900, 12.8800],
      [75.0100, 12.8950],
      [75.0300, 12.9100],
      [75.0500, 12.9300],
      [75.0700, 12.9500],
      [75.0850, 12.9700],
      [75.1000, 12.9900],
      [75.1200, 13.0050],
      [75.1400, 13.0200],
      [75.1600, 13.0350],
      [75.1800, 13.0500],
    ],
  },
  parcels: [
    {
      ulpin: "KA20-DK-00001",
      surveyNumber: "12/2",
      village: "Kudupu",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.0500, 12.9280], [75.0560, 12.9280],
          [75.0560, 12.9330], [75.0500, 12.9330], [75.0500, 12.9280],
        ]],
      },
      areaHectares: 2.4,
      landType: "agricultural",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 35,
    },
    {
      ulpin: "KA20-DK-00002",
      surveyNumber: "14/1",
      village: "Thokkottu",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.0700, 12.9480], [75.0770, 12.9480],
          [75.0770, 12.9540], [75.0700, 12.9540], [75.0700, 12.9480],
        ]],
      },
      areaHectares: 1.8,
      landType: "agricultural",
      ownershipStatus: "disputed",
      litigationFlag: true,
      riskScore: 72,
    },
    {
      ulpin: "KA20-DK-00003",
      surveyNumber: "8/3",
      village: "Mallikatte",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.0350, 12.9080], [75.0420, 12.9080],
          [75.0420, 12.9140], [75.0350, 12.9140], [75.0350, 12.9080],
        ]],
      },
      areaHectares: 3.1,
      landType: "residential",
      ownershipStatus: "under_verification",
      litigationFlag: false,
      riskScore: 55,
    },
    {
      ulpin: "KA20-DK-00004",
      surveyNumber: "22/1",
      village: "Bendoor",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.0250, 12.8920], [75.0320, 12.8920],
          [75.0320, 12.8980], [75.0250, 12.8980], [75.0250, 12.8920],
        ]],
      },
      areaHectares: 1.5,
      landType: "agricultural",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 28,
    },
    {
      ulpin: "KA20-DK-00005",
      surveyNumber: "5/2",
      village: "Kulashekara",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.0900, 12.9650], [75.0970, 12.9650],
          [75.0970, 12.9710], [75.0900, 12.9710], [75.0900, 12.9650],
        ]],
      },
      areaHectares: 4.2,
      landType: "commercial",
      ownershipStatus: "disputed",
      litigationFlag: true,
      riskScore: 81,
    },
  ],
};

// ── Mumbai–Nagpur Expressway (Nashik) ────────────────────────────────────

const MUMBAI_NAGPUR_CORRIDOR: DemoCorridor = {
  projectName: "Mumbai–Nagpur Expressway: Missing Link Completion",
  alignment: {
    type: "LineString",
    coordinates: [
      [73.7800, 20.0100],
      [73.8200, 20.0300],
      [73.8600, 20.0500],
      [73.9000, 20.0700],
      [73.9500, 20.0900],
      [74.0000, 20.1100],
      [74.0500, 20.1300],
      [74.1000, 20.1500],
    ],
  },
  parcels: [
    {
      ulpin: "MH12-NK-00001",
      surveyNumber: "33/2",
      village: "Pimpalgaon",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [73.8500, 20.0450], [73.8570, 20.0450],
          [73.8570, 20.0510], [73.8500, 20.0510], [73.8500, 20.0450],
        ]],
      },
      areaHectares: 5.6,
      landType: "agricultural",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 42,
    },
    {
      ulpin: "MH12-NK-00002",
      surveyNumber: "17/4",
      village: "Sinnar",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [73.9200, 20.0750], [73.9280, 20.0750],
          [73.9280, 20.0820], [73.9200, 20.0820], [73.9200, 20.0750],
        ]],
      },
      areaHectares: 3.8,
      landType: "agricultural",
      ownershipStatus: "disputed",
      litigationFlag: true,
      riskScore: 68,
    },
    {
      ulpin: "MH12-NK-00003",
      surveyNumber: "41/1",
      village: "Nandgaon",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [74.0100, 20.1050], [74.0180, 20.1050],
          [74.0180, 20.1120], [74.0100, 20.1120], [74.0100, 20.1050],
        ]],
      },
      areaHectares: 2.2,
      landType: "residential",
      ownershipStatus: "under_verification",
      litigationFlag: false,
      riskScore: 51,
    },
  ],
};

// ── Tungabhadra Irrigation Canal (Bellary) ───────────────────────────────

const TUNGABHADRA_CORRIDOR: DemoCorridor = {
  projectName: "Tungabhadra Irrigation Canal Extension",
  alignment: {
    type: "LineString",
    coordinates: [
      [76.8500, 15.1300],
      [76.8700, 15.1400],
      [76.8900, 15.1500],
      [76.9100, 15.1600],
      [76.9300, 15.1700],
      [76.9500, 15.1800],
      [76.9700, 15.1900],
      [76.9900, 15.2000],
    ],
  },
  parcels: [
    {
      ulpin: "KA09-BL-00001",
      surveyNumber: "6/1",
      village: "Hospet",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [76.8800, 15.1380], [76.8870, 15.1380],
          [76.8870, 15.1440], [76.8800, 15.1440], [76.8800, 15.1380],
        ]],
      },
      areaHectares: 1.9,
      landType: "agricultural",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 22,
    },
    {
      ulpin: "KA09-BL-00002",
      surveyNumber: "9/3",
      village: "Kudithini",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [76.9200, 15.1580], [76.9270, 15.1580],
          [76.9270, 15.1640], [76.9200, 15.1640], [76.9200, 15.1580],
        ]],
      },
      areaHectares: 2.7,
      landType: "agricultural",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 18,
    },
  ],
};

// ── Jaisalmer Solar Park Corridor (Rajasthan) ────────────────────────────

const JAISALMER_CORRIDOR: DemoCorridor = {
  projectName: "Jaisalmer Renewable Energy Solar Park Transmission Line",
  alignment: {
    type: "LineString",
    coordinates: [
      [70.5000, 26.8500],
      [70.5300, 26.8700],
      [70.5600, 26.8900],
      [70.5900, 26.9100],
      [70.6200, 26.9300],
      [70.6500, 26.9500],
      [70.6800, 26.9700],
      [70.7100, 26.9900],
    ],
  },
  parcels: [
    {
      ulpin: "RJ15-JS-00001",
      surveyNumber: "28/1",
      village: "Ramgarh",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [70.5500, 26.8850], [70.5580, 26.8850],
          [70.5580, 26.8920], [70.5500, 26.8920], [70.5500, 26.8850],
        ]],
      },
      areaHectares: 12.5,
      landType: "barren",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 15,
    },
    {
      ulpin: "RJ15-JS-00002",
      surveyNumber: "31/4",
      village: "Pokhran",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [70.6300, 26.9250], [70.6380, 26.9250],
          [70.6380, 26.9320], [70.6300, 26.9320], [70.6300, 26.9250],
        ]],
      },
      areaHectares: 8.3,
      landType: "barren",
      ownershipStatus: "clear",
      litigationFlag: false,
      riskScore: 12,
    },
  ],
};

const ALL_CORRIDORS = [
  NH48_CORRIDOR,
  MUMBAI_NAGPUR_CORRIDOR,
  TUNGABHADRA_CORRIDOR,
  JAISALMER_CORRIDOR,
];

export async function POST(_req: NextRequest) {
  try {
    const result = await withTransaction(async (client: PoolClient) => {
      let projectsUpdated = 0;
      let parcelsCreated = 0;
      let skippedProjects = 0;

      for (const corridor of ALL_CORRIDORS) {
        // Find the project by name (partial match)
        const { rows: projectRows } = await client.query<{ id: string; alignment_geojson: any }>(
          `SELECT id, alignment_geojson FROM projects WHERE name ILIKE $1 LIMIT 1`,
          [`%${corridor.projectName.split(":")[0].trim()}%`]
        );

        if (projectRows.length === 0) {
          skippedProjects++;
          continue;
        }

        const project = projectRows[0];

        // Update alignment if missing
        if (!project.alignment_geojson) {
          await client.query(
            `UPDATE projects SET alignment_geojson = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(corridor.alignment), project.id]
          );
          projectsUpdated++;
        }

        // Check existing parcel count for this project
        const { rows: existingParcels } = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM parcels WHERE project_id = $1`,
          [project.id]
        );

        if (Number(existingParcels[0].count) >= corridor.parcels.length) {
          continue; // Already seeded
        }

        for (const parcel of corridor.parcels) {
          // Skip if ULPIN already exists (avoids FK conflicts with owners table)
          const { rows: existing } = await client.query<{ id: string }>(
            `SELECT id FROM parcels WHERE ulpin = $1 LIMIT 1`,
            [parcel.ulpin]
          );
          if (existing.length > 0) continue;
          await client.query(
            `INSERT INTO parcels (
              ulpin, project_id, survey_number, village, district, state,
              area_hectares, land_type, geometry_geojson,
              ownership_status, litigation_flag, risk_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              parcel.ulpin,
              project.id,
              parcel.surveyNumber,
              parcel.village,
              corridor.projectName.includes("Karnataka")
                ? "Dakshina Kannada"
                : corridor.projectName.includes("Mumbai") || corridor.projectName.includes("Nagpur")
                ? "Nashik"
                : corridor.projectName.includes("Tungabhadra")
                ? "Bellary"
                : "Jaisalmer",
              corridor.projectName.includes("Karnataka")
                ? "Karnataka"
                : corridor.projectName.includes("Mumbai") || corridor.projectName.includes("Nagpur")
                ? "Maharashtra"
                : corridor.projectName.includes("Tungabhadra")
                ? "Karnataka"
                : "Rajasthan",
              parcel.areaHectares,
              parcel.landType,
              JSON.stringify(parcel.geometry),
              parcel.ownershipStatus,
              parcel.litigationFlag,
              parcel.riskScore,
            ]
          );
          parcelsCreated++;
        }
      }

      return { projectsUpdated, parcelsCreated, skippedProjects };
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${result.projectsUpdated} corridors and ${result.parcelsCreated} parcels. ${result.skippedProjects} projects not found.`,
      data: result,
    });
  } catch (err) {
    console.error("POST /api/seed/atlas error:", err);
    return NextResponse.json(
      { error: "Failed to seed demo data", details: (err as Error).message },
      { status: 500 }
    );
  }
}
