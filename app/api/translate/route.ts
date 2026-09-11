import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Text and targetLang are required." },
        { status: 400 }
      );
    }

    if (targetLang === "en") {
      return NextResponse.json({ translatedText: text });
    }

    const langMap: Record<string, string> = {
      hi: "Hindi (हिन्दी)",
      bn: "Bengali (বাংলা)",
      kn: "Kannada (ಕನ್ನಡ)",
      en: "English",
    };

    const targetLangName = langMap[targetLang] || targetLang;

    const payload = {
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are an expert government and legal translator for India's Department of Land Resources (DoLR). Translate the user's text into ${targetLangName} accurately, preserving official legal terms like RFCTLARR, ULPIN, Solatium, SIA, Section 11, Section 19, RoR, and DBT. Output ONLY the translated text without commentary, quotes, or explanations.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    };

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: "Translation API failed", details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translatedText = data?.choices?.[0]?.message?.content?.trim() || text;

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
