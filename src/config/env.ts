export type AppEnv = {
  NODE_ENV: "development" | "test" | "production";
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_STARTER: string;
  STRIPE_PRICE_GROWTH: string;
  SLACK_WEBHOOK_URL?: string;
  ANTHROPIC_API_KEY?: string;
  ALERT_EMAIL_FROM?: string;
  ALERT_EMAIL_TO?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  TINYFISH_API_KEY: string;
  TINYFISH_BASE_URL: string;
  TINYFISH_EXECUTE_PATH: string;
  TINYFISH_TIMEOUT_MS: number;
  SCREENSHOT_STORAGE_PROVIDER: "local";
  SCREENSHOT_STORAGE_BASE_PATH: string;
  BULLMQ_QUEUE_PREFIX: string;
  BULLMQ_EXECUTION_ATTEMPTS: number;
  BULLMQ_EXECUTION_BACKOFF_MS: number;
};

type RequiredStringEnvKey =
  | "NEXTAUTH_URL"
  | "NEXTAUTH_SECRET"
  | "DATABASE_URL"
  | "REDIS_URL"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "STRIPE_PRICE_STARTER"
  | "STRIPE_PRICE_GROWTH"
  | "TINYFISH_API_KEY"
  | "TINYFISH_BASE_URL"
  | "TINYFISH_EXECUTE_PATH"
  | "SCREENSHOT_STORAGE_BASE_PATH"
  | "BULLMQ_QUEUE_PREFIX";

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

  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 600_000) {
    return 30_000;
  }

  return parsed;
}

function readBoundedInteger(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
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
    STRIPE_WEBHOOK_SECRET: readRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    STRIPE_PRICE_STARTER: readRequiredEnv("STRIPE_PRICE_STARTER"),
    STRIPE_PRICE_GROWTH: readRequiredEnv("STRIPE_PRICE_GROWTH"),
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL?.trim() || undefined,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY?.trim() || undefined,
    ALERT_EMAIL_FROM: process.env.ALERT_EMAIL_FROM?.trim() || undefined,
    ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO?.trim() || undefined,
    SMTP_HOST: process.env.SMTP_HOST?.trim() || undefined,
    SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    SMTP_USER: process.env.SMTP_USER?.trim() || undefined,
    SMTP_PASS: process.env.SMTP_PASS?.trim() || undefined,
    TINYFISH_API_KEY: readRequiredEnv("TINYFISH_API_KEY"),
    TINYFISH_BASE_URL: readRequiredEnv("TINYFISH_BASE_URL"),
    TINYFISH_EXECUTE_PATH: readRequiredEnv("TINYFISH_EXECUTE_PATH"),
    TINYFISH_TIMEOUT_MS: readTimeoutMs(process.env.TINYFISH_TIMEOUT_MS),
    SCREENSHOT_STORAGE_PROVIDER: "local",
    SCREENSHOT_STORAGE_BASE_PATH: readRequiredEnv("SCREENSHOT_STORAGE_BASE_PATH"),
    BULLMQ_QUEUE_PREFIX: readRequiredEnv("BULLMQ_QUEUE_PREFIX"),
    BULLMQ_EXECUTION_ATTEMPTS: readBoundedInteger(
      process.env.BULLMQ_EXECUTION_ATTEMPTS,
      3,
      1,
      10,
    ),
    BULLMQ_EXECUTION_BACKOFF_MS: readBoundedInteger(
      process.env.BULLMQ_EXECUTION_BACKOFF_MS,
      1000,
      100,
      60_000,
    ),
  };
}
