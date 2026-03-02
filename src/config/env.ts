export type AppEnv = {
  NODE_ENV: "development" | "test" | "production";
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  STRIPE_SECRET_KEY: string;
  TINYFISH_API_KEY: string;
  TINYFISH_BASE_URL: string;
  TINYFISH_EXECUTE_PATH: string;
  TINYFISH_TIMEOUT_MS: number;
  SCREENSHOT_STORAGE_PROVIDER: "local";
  SCREENSHOT_STORAGE_BASE_PATH: string;
};

type RequiredStringEnvKey =
  | "NEXTAUTH_URL"
  | "NEXTAUTH_SECRET"
  | "DATABASE_URL"
  | "REDIS_URL"
  | "STRIPE_SECRET_KEY"
  | "TINYFISH_API_KEY"
  | "TINYFISH_BASE_URL"
  | "TINYFISH_EXECUTE_PATH"
  | "SCREENSHOT_STORAGE_BASE_PATH";

const requiredEnvKeys: RequiredStringEnvKey[] = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
  "STRIPE_SECRET_KEY",
  "TINYFISH_API_KEY",
  "TINYFISH_BASE_URL",
  "TINYFISH_EXECUTE_PATH",
  "SCREENSHOT_STORAGE_BASE_PATH",
];

function readNodeEnv(value: string | undefined): AppEnv["NODE_ENV"] {
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  return "development";
}

function readRequiredEnv(key: RequiredStringEnvKey): string {
  const value = process.env[key];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readTimeoutMs(value: string | undefined): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 120_000) {
    return 30_000;
  }

  return parsed;
}

export function getAppEnv(): AppEnv {
  const missingKeys = requiredEnvKeys.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missingKeys.length > 0) {
    throw new Error(
      `Environment validation failed. Missing keys: ${missingKeys.join(", ")}`,
    );
  }

  return {
    NODE_ENV: readNodeEnv(process.env.NODE_ENV),
    NEXTAUTH_URL: readRequiredEnv("NEXTAUTH_URL"),
    NEXTAUTH_SECRET: readRequiredEnv("NEXTAUTH_SECRET"),
    DATABASE_URL: readRequiredEnv("DATABASE_URL"),
    REDIS_URL: readRequiredEnv("REDIS_URL"),
    STRIPE_SECRET_KEY: readRequiredEnv("STRIPE_SECRET_KEY"),
    TINYFISH_API_KEY: readRequiredEnv("TINYFISH_API_KEY"),
    TINYFISH_BASE_URL: readRequiredEnv("TINYFISH_BASE_URL"),
    TINYFISH_EXECUTE_PATH: readRequiredEnv("TINYFISH_EXECUTE_PATH"),
    TINYFISH_TIMEOUT_MS: readTimeoutMs(process.env.TINYFISH_TIMEOUT_MS),
    SCREENSHOT_STORAGE_PROVIDER: "local",
    SCREENSHOT_STORAGE_BASE_PATH: readRequiredEnv("SCREENSHOT_STORAGE_BASE_PATH"),
  };
}
