import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: Request) {
  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json(
      { error: "OpenAI key missing. Set OPENAI_API_KEY." },
      { status: 400 },
    );
  }
  const body = await request.json();
  const { entityType, payload } = body;
  const prompt = [
    {
      role: "system" as const,
      content:
        "You are YuktraAI's internal CRM assistant. Provide concise situation summaries with risks and next actions.",
    },
    {
      role: "user" as const,
      content: `Entity type: ${entityType}\nContext JSON:\n${JSON.stringify(payload, null, 2)}\nProduce:\n1. Situation overview\n2. Key risks\n3. Tactical next actions`,
    },
  ];
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });
  const output = response.output?.[0];
  const text =
    output?.content?.[0]?.type === "output_text"
      ? output.content[0].text
      : "No summary generated.";
  return NextResponse.json({ summary: text });
}
