#!/usr/bin/env node
import * as fs from "fs";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log("\n🔐 TinyFish API Key Configuration\n");
  console.log("Your TinyFish credentials were exposed and need to be regenerated.");
  console.log("Please follow these steps:\n");
  console.log("1. Go to: https://agent.tinyfish.ai/");
  console.log("2. Sign in to your account");
  console.log("3. Click 'API Keys' in the sidebar");
  console.log("4. Generate a new API key (or copy existing if you have one)\n");

  const apiKey = await prompt("Enter your TinyFish API Key: ");

  if (!apiKey || !apiKey.trim()) {
    console.log("\n❌ API key is required!");
    rl.close();
    return;
  }

  // Read current .env
  let envContent = fs.readFileSync(".env", "utf-8");
  
  // Replace the placeholder
  envContent = envContent.replace(
    /TINYFISH_API_KEY=.*/,
    `TINYFISH_API_KEY=${apiKey.trim()}`
  );

  // Write back
  fs.writeFileSync(".env", envContent);

  console.log("\n✅ API key saved to .env");
  console.log("📝 API Key ends with: ...${apiKey.trim().slice(-10)}");
  console.log("\n🚀 Ready to test! Run: npm run dev\n");

  rl.close();
}

main().catch(console.error);
