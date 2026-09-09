/**
 * BhoomiSetu — Mock Adapter API Routes
 * GET /api/mock/[adapter]
 *
 * Returns clearly-labeled mock JSON for: dilrmp, lacrris, bhoomirashi, pfms
 * Every call is logged to mock_adapter_log in the database.
 *
 * IMPORTANT: These are mock adapters demonstrating federated-integration architecture.
 * No real government API is called. All responses are labeled source: "mock-*".
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/pool";

// Mock response payloads per adapter
const MOCK_RESPONSES: Record<string, unknown> = {
  dilrmp: {
    source: "mock-DILRMP",
    note: "Digital India Land Records Modernisation Programme — mock response",
    data: {
      state: "Maharashtra",
      district: "Pune",
      ulpin_registry: {
        total_registered: 142837,
        digitised_pct: 78.4,
        mutation_pending: 4321,
      },
      last_sync: new Date().toISOString(),
    },
  },
  lacrris: {
    source: "mock-LACRRIS",
    note: "Land Acquisition, Compensation & R&R Info System — mock response",
    data: {
      active_acquisitions: 23,
      compensation_pending_crore: 184.5,
      rr_families_pending: 312,
      section_11_notified: 8,
      section_19_declared: 5,
      last_sync: new Date().toISOString(),
    },
  },
  bhoomirashi: {
    source: "mock-BhoomiRashi",
    note: "Highway land acquisition compensation portal (NHAI) — mock response",
    data: {
      project: "NH-48 Widening Phase II",
      total_parcels: 847,
      compensation_assessed_crore: 723.2,
      compensation_disbursed_crore: 601.8,
      disbursement_pct: 83.2,
      mutation_completed_pct: 41.6,
      last_sync: new Date().toISOString(),
    },
  },
  pfms: {
    source: "mock-PFMS",
    note: "Public Financial Management System — mock disbursement status",
    data: {
      scheme_code: "LA-COMP-2024",
      sanction_no: "PFMS/2024/MH/00147",
      amount_sanctioned_lakh: 4850.0,
      amount_released_lakh: 3940.0,
      pending_lakh: 910.0,
      beneficiaries: 1247,
      dbt_status: "active",
      last_payment_date: "2024-08-15",
      last_sync: new Date().toISOString(),
    },
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adapter: string }> }
) {
  const { adapter } = await params;
  const mockPayload = MOCK_RESPONSES[adapter];

  if (!mockPayload) {
    return NextResponse.json(
      { error: `Unknown mock adapter: ${adapter}. Valid: dilrmp, lacrris, bhoomirashi, pfms` },
      { status: 404 }
    );
  }

  // Log to mock_adapter_log (best-effort — don't fail the request if DB is down)
  try {
    await query(
      `INSERT INTO mock_adapter_log (source, request, response)
       VALUES ($1, $2, $3)`,
      [
        `mock-${adapter.toUpperCase()}`,
        JSON.stringify({ method: "GET", adapter }),
        JSON.stringify(mockPayload),
      ]
    );
  } catch (err) {
    console.warn("mock_adapter_log insert failed (non-fatal):", err);
  }

  return NextResponse.json(mockPayload);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ adapter: string }> }
) {
  const { adapter } = await params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (adapter === "pfms") {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const mockRef = `PFMS/2026/DBT/${randomSuffix}`;
    const utr = `RBI${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const responsePayload = {
      source: "mock-PFMS",
      status: "success",
      mock_pfms_ref: mockRef,
      dbt_utr: utr,
      amount: body.amount || 0,
      beneficiary: body.beneficiary || "Landowner DBT Account",
      ack_code: "PFMS_ACK_200",
      disbursed_at: new Date().toISOString(),
      note: "Public Financial Management System — mock direct benefit transfer successful",
    };

    try {
      await query(
        `INSERT INTO mock_adapter_log (source, request, response)
         VALUES ($1, $2, $3)`,
        [
          "mock-PFMS",
          JSON.stringify({ method: "POST", adapter, body }),
          JSON.stringify(responsePayload),
        ]
      );
    } catch (err) {
      console.warn("mock_adapter_log insert failed (non-fatal):", err);
    }

    return NextResponse.json(responsePayload);
  }

  const genericResponse = {
    source: `mock-${adapter.toUpperCase()}`,
    status: "received",
    timestamp: new Date().toISOString(),
    payload: body,
  };

  try {
    await query(
      `INSERT INTO mock_adapter_log (source, request, response)
       VALUES ($1, $2, $3)`,
      [
        `mock-${adapter.toUpperCase()}`,
        JSON.stringify({ method: "POST", adapter, body }),
        JSON.stringify(genericResponse),
      ]
    );
  } catch (err) {
    console.warn("mock_adapter_log insert failed (non-fatal):", err);
  }

  return NextResponse.json(genericResponse);
}
