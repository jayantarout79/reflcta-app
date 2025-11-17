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
  const { clientName, projectType, problemStatement } = body;
  const prompt = [
    {
      role: "system" as const,
      content:
        "You draft crisp professional AI services proposals. Use concise bullet lists under clear headings.",
    },
    {
      role: "user" as const,
      content: `Client: ${clientName}\nProject Type: ${projectType}\nDescription: ${problemStatement}\nGenerate:\n- Scope overview (paragraph)\n- 3 project phases\n- Bullet deliverables per phase\n- Indicative 6-8 week timeline\n- Highlight measurable success metrics`,
    },
  ];
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
  });
  const output = response.output?.[0];
  const outputText = response.output_text?.[0];
  const fallbackFromContent =
    (output?.type === "message" &&
      "content" in output &&
      Array.isArray(output.content) &&
      output.content[0]?.type === "output_text" &&
      output.content[0]?.text) ??
    null;
  const text = outputText ?? fallbackFromContent ?? "Proposal unavailable.";
  return NextResponse.json({ proposal: text });
}
