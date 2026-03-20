import { loadProcessEnvFromFiles } from "@/config/load-env";
import { executeTinyFishWorkflow } from "@/server/integrations/tinyfish/client";

async function main() {
  loadProcessEnvFromFiles();

  console.log("🔍 Testing TinyFish API Connection...\n");
  console.log("Environment:");
  console.log(`- BASE_URL: ${process.env.TINYFISH_BASE_URL}`);
  console.log(`- PATH: ${process.env.TINYFISH_EXECUTE_PATH}`);
  console.log(`- API_KEY: ${process.env.TINYFISH_API_KEY?.slice(0, 10)}...`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}\n`);

  const testRequest = {
    requestId: "test-123",
    organizationId: "test-org",
    agentId: "test-agent",
    workflowId: "test-workflow",
    workflowName: "Test Workflow",
    naturalLanguageTask: "Test task",
    url: "https://example.com",
    goal: "Test task",
    steps: [
      {
        id: "step-1",
        action: "test",
        target: "https://example.com",
        expectedOutcome: "test outcome",
      },
    ],
    guardrails: [],
    timeoutSeconds: 30,
    retryLimit: 1,
  };

  try {
    console.log("📤 Sending request to TinyFish API...\n");
    const response = await executeTinyFishWorkflow(testRequest);
    console.log("✅ SUCCESS! Got response from TinyFish API:");
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.log("❌ ERROR from TinyFish API:");
    if (error instanceof Error) {
      console.log(`Message: ${error.message}`);
      console.log(`Type: ${error.constructor.name}`);
      if ("statusCode" in error) {
        console.log(`Status Code: ${(error as any).statusCode}`);
      }
      console.log(`Stack: ${error.stack?.split("\n").slice(0, 5).join("\n")}`);
    } else {
      console.log(JSON.stringify(error, null, 2));
    }
  }
}

main().catch(console.error);
