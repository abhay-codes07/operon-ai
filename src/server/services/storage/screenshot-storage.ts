import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getAppEnv } from "@/config/env";

type ScreenshotArtifactInput = {
  organizationId: string;
  executionId: string;
  screenshotId: string;
  mimeType: string;
  base64Data: string;
};

export type StoredScreenshotArtifact = {
  screenshotId: string;
  storagePath: string;
  mimeType: string;
};

function getFileExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("png")) {
    return "png";
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "jpg";
  }

  return "bin";
}

export async function persistScreenshotArtifact(
  input: ScreenshotArtifactInput,
): Promise<StoredScreenshotArtifact> {
  const env = getAppEnv();
  const extension = getFileExtensionFromMimeType(input.mimeType);
  const relativePath = path.join(
    input.organizationId,
    input.executionId,
    `${input.screenshotId}.${extension}`,
  );
  const absolutePath = path.join(env.SCREENSHOT_STORAGE_BASE_PATH, relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(input.base64Data, "base64"));

  return {
    screenshotId: input.screenshotId,
    storagePath: absolutePath,
    mimeType: input.mimeType,
  };
}
