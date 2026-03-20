import { loadProcessEnvFromFiles } from "@/config/load-env";

async function main() {
  loadProcessEnvFromFiles();

  console.log("🔍 TinyFish API Environment Check\n");
  console.log("Configuration:");
  console.log(`BASE_URL: ${process.env.TINYFISH_BASE_URL}`);
  console.log(`PATH: ${process.env.TINYFISH_EXECUTE_PATH}`);
  console.log(`API_KEY: ${process.env.TINYFISH_API_KEY?.slice(0, 20)}...`);
  console.log(`TIMEOUT: ${process.env.TINYFISH_TIMEOUT_MS}ms`);

  const url = `${process.env.TINYFISH_BASE_URL}${process.env.TINYFISH_EXECUTE_PATH}`;
  console.log(`\n📍 Full URL: ${url}`);

  const testPayload = {
    requestId: "diagnostics-test",
    organizationId: "test",
    agentId: "test",
    workflowId: "test",
    workflowName: "Test",
    naturalLanguageTask: "Test task",
    steps: [
      {
        id: "step-1",
        action: "navigate",
        target: "https://example.com",
        expectedOutcome: "page loads",
      },
    ],
    guardrails: [],
    timeoutSeconds: 30,
    retryLimit: 1,
  };

  console.log("\n📤 Sending request with:");
  console.log(`- Method: POST`);
  console.log(`- Headers: X-API-Key, Authorization, Content-Type`);
  console.log(`- Body size: ${JSON.stringify(testPayload).length} bytes`);

  try {
    console.log("\n⏳ Fetching...");
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.TINYFISH_API_KEY || "",
        Authorization: `Bearer ${process.env.TINYFISH_API_KEY || ""}`,
      },
      body: JSON.stringify(testPayload),
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Response received in ${duration}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get("content-type");
    console.log(`Content-Type: ${contentType}`);

    const text = await response.text();
    console.log(`\nResponse body (${text.length} bytes):`);
    
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(text);
    }

    if (!response.ok) {
      console.log(`\n❌ API Error!`);
      console.log(`Status Code: ${response.status}`);
    } else {
      console.log(`\n✅ API request successful!`);
    }
  } catch (error) {
    console.log(`\n❌ Network Error!`);
    if (error instanceof Error) {
      console.log(`Type: ${error.constructor.name}`);
      console.log(`Message: ${error.message}`);
      console.log(`\nStack trace:`);
      console.log(error.stack);
    } else {
      console.log(JSON.stringify(error));
    }
  }
}

main().catch(console.error);
