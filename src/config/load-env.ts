import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function parseEnvFile(content: string) {
  const entries: Array<{ key: string; value: string }> = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");
    if (index < 1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    entries.push({ key, value });
  }
  return entries;
}

export function loadProcessEnvFromFiles() {
  const candidates = [".env.local", ".env"];

  for (const file of candidates) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) {
      continue;
    }

    const content = readFileSync(path, "utf8");
    for (const { key, value } of parseEnvFile(content)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
