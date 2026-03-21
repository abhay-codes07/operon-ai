import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";

const bodySchema = z.object({
  description: z.string().trim().min(10).max(2000),
});

const SYSTEM_PROMPT = `You are an AI that converts a plain-English automation task description into a structured workflow definition for an autonomous web agent platform called Operon.

Return ONLY a valid JSON object — no markdown, no explanation, no code blocks. The JSON must match this exact shape:
{
  "name": "Short workflow name (3-6 words)",
  "description": "One-sentence description",
  "naturalLanguageTask": "The exact task for the agent, written clearly with all context. If the user mentions specific sites, preserve them. If they mention price/shopping, mention checking multiple sites.",
  "targetUrl": "Best starting URL for this task, or empty string if not applicable",
  "guardrails": ["Array of 2-4 safety rules relevant to this task"],
  "timeoutSeconds": 300,
  "retryLimit": 1,
  "scheduleCron": "5-field cron if user requested scheduling (e.g. '0 9 * * 1-5'), else empty string"
}

Rules:
- naturalLanguageTask must be actionable and specific — the agent will follow it literally
- For shopping/price tasks: always instruct the agent to compare across Amazon, eBay, Walmart, BestBuy, and Target
- For recurring tasks (daily, weekly, every morning): populate scheduleCron
- targetUrl: use a real URL if obvious from context, otherwise ""
- guardrails: practical rules like "Do not submit payment forms", "Screenshot at each step", "Stop if CAPTCHA is detected"
- timeoutSeconds: 180 for quick tasks, 300 for medium, 600 for complex multi-site tasks
- Always return valid JSON`;

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  void user;

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-ant-REPLACE_ME") {
    // Fallback: generate a sensible default without AI
    const task = parsed.data.description;
    const isPrice = /price|cost|cheap|buy|deal|compare/i.test(task);
    const isScheduled = /daily|weekly|every day|every morning|every week|monday/i.test(task);

    return NextResponse.json({
      name: task.split(" ").slice(0, 5).join(" "),
      description: task.slice(0, 120),
      naturalLanguageTask: isPrice
        ? `Search Google Shopping then check Amazon, eBay, Walmart, BestBuy, and Target to compare prices and collect the best price from each site for: ${task}`
        : task,
      targetUrl: isPrice ? "https://www.google.com/shopping" : "",
      guardrails: [
        "Do not submit payment forms or add items to cart",
        "Screenshot at each major step",
        "Stop if CAPTCHA is detected",
        "Do not enter personal information",
      ],
      timeoutSeconds: isPrice ? 600 : 300,
      retryLimit: 1,
      scheduleCron: isScheduled ? "0 9 * * 1-5" : "",
    });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate a workflow definition for this task:\n\n${parsed.data.description}`,
      },
    ],
  });

  const content = message.content[0];
  if (content?.type !== "text") {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }

  try {
    const result = JSON.parse(content.text) as Record<string, unknown>;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON", raw: content.text }, { status: 500 });
  }
}
