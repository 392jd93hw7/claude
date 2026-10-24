import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MODEL = process.env.OLLAMA_MODEL || "qwen3.8-27b-uncensored-mtp";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
    return NextResponse.json({ error: "Send between 1 and 40 chat messages." }, { status: 400 });
  }

  const safeMessages: ChatMessage[] = [];
  for (const item of messages) {
    if (
      !item ||
      typeof item !== "object" ||
      !("role" in item) ||
      !("content" in item) ||
      !["user", "assistant"].includes(String(item.role)) ||
      typeof item.content !== "string" ||
      item.content.length > 12000
    ) {
      return NextResponse.json({ error: "Each message must have a valid user/assistant role and text content under 12,000 characters." }, { status: 400 });
    }
    safeMessages.push({ role: item.role as ChatMessage["role"], content: item.content });
  }

  if (safeMessages[safeMessages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "The latest message must be from the user." }, { status: 400 });
  }

  const baseUrl = (process.env.OLLAMA_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!baseUrl || !baseUrl.startsWith("https://") && !baseUrl.startsWith("http://")) {
    return NextResponse.json({ error: "Server is missing a valid OLLAMA_BASE_URL environment variable." }, { status: 500 });
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OLLAMA_API_KEY || "ollama"}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a helpful, clear, and honest AI assistant. If you are unsure, say so." },
          ...safeMessages
        ],
        stream: false,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(80000),
      cache: "no-store"
    });

    const responseText = await upstream.text();
    if (!upstream.ok) {
      console.error("Ollama upstream error:", upstream.status, responseText.slice(0, 1000));
      return NextResponse.json(
        { error: `The model endpoint returned HTTP ${upstream.status}. Check that the tunnel is online and the model name is correct.` },
        { status: 502 }
      );
    }

    let data: { choices?: Array<{ message?: { content?: string } }> };
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "The model endpoint returned invalid JSON." }, { status: 502 });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string") {
      return NextResponse.json({ error: "The model endpoint response did not contain a chat reply." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "The model took too long to respond. Try again."
      : "Could not reach the model endpoint. The Kaggle session or Cloudflare tunnel may be offline.";
    console.error("Chat proxy failure:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
