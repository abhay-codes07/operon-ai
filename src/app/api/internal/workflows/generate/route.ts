import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";

const bodySchema = z.object({
  description: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  const user = await requireOrganizationRole("MEMBER");
  void user;

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const task = parsed.data.description;

  const isPrice     = /price|cost|cheap|buy|deal|compare|shop|discount|sale|offer/i.test(task);
  const isJobs      = /job|career|hiring|recruit|linkedin|glassdoor|indeed/i.test(task);
  const isNews      = /news|article|headline|latest|update|blog|post/i.test(task);
  const isSecurity  = /security|vuln|scan|audit|pentest|exposure|leak/i.test(task);
  const isScheduled = /daily|weekly|every day|every morning|every week|monday|cron/i.test(task);

  let naturalLanguageTask = task;
  let targetUrl = "";
  let timeoutSeconds = 300;

  if (isPrice) {
    naturalLanguageTask = `Search Google Shopping then check Amazon, eBay, Walmart, BestBuy, and Target to compare prices and availability for: ${task}. Return a structured comparison with price, retailer, stock status, and direct product URL for each.`;
    targetUrl = "https://www.google.com/shopping";
    timeoutSeconds = 600;
  } else if (isJobs) {
    naturalLanguageTask = `Search LinkedIn Jobs, Indeed, and Glassdoor for: ${task}. Extract job title, company, location, salary range, and application URL for the top 10 most relevant results.`;
    targetUrl = "https://www.linkedin.com/jobs";
    timeoutSeconds = 480;
  } else if (isNews) {
    naturalLanguageTask = `Search Google News and relevant sources for: ${task}. Extract the top 5 most recent articles: title, source, published date, summary, and URL.`;
    targetUrl = "https://news.google.com";
    timeoutSeconds = 240;
  } else if (isSecurity) {
    naturalLanguageTask = `Perform a surface-level security audit for: ${task}. Check for exposed admin panels, sensitive files, open directory listings, and missing security headers. Report findings with severity.`;
    targetUrl = "";
    timeoutSeconds = 600;
  }

  const guardrails = isSecurity
    ? [
        "Do not exploit any discovered vulnerabilities",
        "Screenshot at each finding",
        "Stop if authentication is required beyond public pages",
        "Report findings only — do not modify any data",
      ]
    : [
        "Do not submit payment forms or add items to cart",
        "Screenshot at each major step",
        "Stop if CAPTCHA is detected",
        "Do not enter personal information",
      ];

  return NextResponse.json({
    name: task.split(" ").slice(0, 5).join(" "),
    description: task.slice(0, 120),
    naturalLanguageTask,
    targetUrl,
    guardrails,
    timeoutSeconds,
    retryLimit: 1,
    scheduleCron: isScheduled ? "0 9 * * 1-5" : "",
  });
}
