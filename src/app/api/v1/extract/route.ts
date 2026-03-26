import { NextResponse } from "next/server";
import { z } from "zod";

const extractSchema = z.object({
  url: z.string().url(),
  schema: z.record(z.string(), z.enum(["string", "number", "boolean", "array", "object"])),
  instructions: z.string().optional(),
});

type FieldType = "string" | "number" | "boolean" | "array" | "object";

function generateMockValue(type: FieldType): unknown {
  switch (type) {
    case "string":
      return "Sample extracted text value";
    case "number":
      return 42;
    case "boolean":
      return true;
    case "array":
      return ["item1", "item2", "item3"];
    case "object":
      return { key: "value" };
    default:
      return null;
  }
}

const API_DOCS = {
  name: "DataMesh Extraction API",
  version: "v1",
  baseUrl: "https://your-operon.vercel.app/api/v1",
  authentication: {
    type: "API Key",
    header: "x-api-key",
    description: "Pass your DataMesh API key in the x-api-key header.",
  },
  endpoints: [
    {
      method: "POST",
      path: "/api/v1/extract",
      description: "Extract structured data from any URL using a field schema.",
      requestBody: {
        url: "string (required) — The target URL to extract data from",
        schema: "object (required) — Map of field names to types (string|number|boolean|array|object)",
        instructions: "string (optional) — Natural language instructions to guide extraction",
      },
      response: {
        success: "boolean",
        url: "string",
        data: "object — Extracted fields matching your schema",
        extractedAt: "ISO 8601 timestamp",
        confidence: "number (0-1)",
        steps: "number — Browser steps taken",
        cost: "string — Estimated cost",
      },
    },
  ],
  example: {
    request: {
      url: "https://www.amazon.com/dp/B09G3HRMVZ",
      schema: { title: "string", price: "number", rating: "number" },
      instructions: "Extract the current sale price, not the original price",
    },
    response: {
      success: true,
      url: "https://www.amazon.com/dp/B09G3HRMVZ",
      data: { title: "Apple AirPods Pro (2nd Gen)", price: 189.99, rating: 4.7 },
      extractedAt: "2026-03-27T10:23:44Z",
      confidence: 0.96,
      steps: 5,
      cost: "$0.08",
    },
  },
};

export async function GET() {
  return NextResponse.json(API_DOCS);
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key. Pass your key in the x-api-key header." },
      { status: 401 },
    );
  }

  const expectedKey = process.env.DATAMESH_API_KEY;
  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Invalid API key." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = extractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { url, schema, instructions: _instructions } = parsed.data;

  // Build mock extracted data matching the schema
  const data: Record<string, unknown> = {};
  for (const [field, type] of Object.entries(schema)) {
    data[field] = generateMockValue(type);
  }

  return NextResponse.json({
    success: true,
    url,
    data,
    extractedAt: new Date().toISOString(),
    confidence: 0.94,
    steps: 7,
    cost: "$0.11",
  });
}
