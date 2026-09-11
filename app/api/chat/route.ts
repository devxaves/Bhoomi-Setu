import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `
You are **BhoomiSetu AI Sahayak (भूमि सेतु सहायक)**, the official intelligent assistant for the **BhoomiSetu National Land Acquisition Control & Statutory Compliance Portal** (Department of Land Resources - DoLR, Ministry of Rural Development, Government of India).

### CRITICAL ANSWERING & FORMATTING GUIDELINES:
1. **Be Extremely Precise and Concise**: Answer directly in 2 to 4 structured, clear points. Avoid long-winded essays, unnecessary preambles, or excessive filler text.
2. **Clean Formatting**:
   - Use short bullet points (- Item) and bold terms (**Term**) appropriately.
   - Avoid oversized markdown tables unless specifically requested.
   - Keep legal citations clear (e.g., Section 11, Section 19, RFCTLARR Act 2013).
3. **Accuracy on Core Domain**:
   - **RFCTLARR Act, 2013 Statutory Timeline**:
     * Stage 1: Proposal & Social Impact Assessment (SIA) (Sec. 4)
     * Stage 2: Expert Committee SIA Appraisal (Sec. 7)
     * Stage 3: Preliminary Notification (Sec. 11) — Freezes land transactions
     * Stage 4: Hearing Objections (Sec. 15) — 60-day statutory hearing period
     * Stage 5: Final Declaration (Sec. 19) — **STRICT 12-month lapse limit** from Section 11 publication
     * Stage 6: Award Determination (Sec. 23/26) — Market Value + 100% Solatium + 12% Interest per annum
     * Stage 7: Compensation Disbursement — Direct Benefit Transfer (DBT) via PFMS to verified bank accounts
     * Stage 8: Revenue Record Mutation (RoR) — Legal transfer of title to Land Requiring Body (NHAI/Railways)
     * Stage 9: Physical Possession (Sec. 38) — Handover only after 100% compensation + R&R deposit
     * Stage 10: Rehabilitation & Resettlement (R&R) (Sec. 31/32) & Project Closure
   - **14-Digit ULPIN (Bhu-Aadhaar)**: Cadastral geocoding for parcel verification.
   - **Platform Modules**: GIS Atlas (/atlas), Workflow (/workflow), Document OCR (/upload), Risk Engine (/risk), Analytics (/dashboard), Citizen Portal (/citizen), Archive (/archive), CALA Admin (/admin).

4. **Strict Scope Rule**:
   - Answer ONLY questions related to BhoomiSetu, Indian land acquisition, RFCTLARR Act 2013, ULPIN, and land records.
   - If asked about any unrelated topic, politely refuse: "I am BhoomiSetu AI Sahayak, dedicated exclusively to assisting with land acquisition, RFCTLARR Act 2013 statutory workflows, ULPIN parcel tracking, and the BhoomiSetu portal. How may I assist you regarding land records or platform services?"

5. **Language**: Respond fluently in the user's language (English, Hindi / हिन्दी, Bengali / বাংলা, Kannada / ಕನ್ನಡ).
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, language = "en" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format. Array required." },
        { status: 400 }
      );
    }

    const languageInstruction =
      language === "hi"
        ? "\n\nIMPORTANT: The user has selected Hindi (हिन्दी) interface. Respond in clear, precise Hindi with clean formatting."
        : language === "bn"
        ? "\n\nIMPORTANT: The user has selected Bengali (বাংলা) interface. Respond in clear, precise Bengali with clean formatting."
        : language === "kn"
        ? "\n\nIMPORTANT: The user has selected Kannada (ಕನ್ನಡ) interface. Respond in clear, precise Kannada with clean formatting."
        : "\n\nIMPORTANT: Respond in clear, precise English with clean formatting.";

    const payload = {
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + languageInstruction },
        ...messages.slice(-8), // Keep recent context
      ],
      temperature: 0.2,
      max_tokens: 700,
      top_p: 0.85,
    };

    let response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // Fallback to smaller model if 120b is unavailable
    if (!response.ok) {
      payload.model = "qwen/qwen3.8-27b";
      response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      return NextResponse.json(
        { error: "Failed to fetch response from AI model", details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "I apologize, but I could not generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
