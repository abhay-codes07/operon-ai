-- Phase 18 OperonHub marketplace core models

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketplacePricingModel') THEN
    CREATE TYPE "MarketplacePricingModel" AS ENUM ('FREE', 'PAID');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TemplateInstallationStatus') THEN
    CREATE TYPE "TemplateInstallationStatus" AS ENUM ('ACTIVE', 'PAUSED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "MarketplaceTemplate" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "authorOrgId" TEXT NOT NULL,
  "pricingModel" "MarketplacePricingModel" NOT NULL DEFAULT 'FREE',
  "priceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "installCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TemplateVersion" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "workflowDefinition" JSONB NOT NULL,
  "changelog" TEXT,
  "isLatest" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TemplateInstallation" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "installedVersion" TEXT NOT NULL,
  "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "TemplateInstallationStatus" NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "TemplateInstallation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TemplateReview" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplateReview_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MarketplaceTemplate"
  ADD CONSTRAINT "MarketplaceTemplate_authorOrgId_fkey"
  FOREIGN KEY ("authorOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateVersion"
  ADD CONSTRAINT "TemplateVersion_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateInstallation"
  ADD CONSTRAINT "TemplateInstallation_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateInstallation"
  ADD CONSTRAINT "TemplateInstallation_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TemplateReview"
  ADD CONSTRAINT "TemplateReview_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "MarketplaceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TemplateReview"
  ADD CONSTRAINT "TemplateReview_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceTemplate_slug_key" ON "MarketplaceTemplate"("slug");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_category_reliabilityScore_installCount_idx"
  ON "MarketplaceTemplate"("category", "reliabilityScore", "installCount");
CREATE INDEX IF NOT EXISTS "MarketplaceTemplate_authorOrgId_createdAt_idx"
  ON "MarketplaceTemplate"("authorOrgId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateVersion_templateId_version_key"
  ON "TemplateVersion"("templateId", "version");
CREATE INDEX IF NOT EXISTS "TemplateVersion_templateId_isLatest_publishedAt_idx"
  ON "TemplateVersion"("templateId", "isLatest", "publishedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateInstallation_templateId_orgId_key"
  ON "TemplateInstallation"("templateId", "orgId");
CREATE INDEX IF NOT EXISTS "TemplateInstallation_orgId_status_installedAt_idx"
  ON "TemplateInstallation"("orgId", "status", "installedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "TemplateReview_templateId_orgId_key"
  ON "TemplateReview"("templateId", "orgId");
CREATE INDEX IF NOT EXISTS "TemplateReview_templateId_createdAt_idx"
  ON "TemplateReview"("templateId", "createdAt");
