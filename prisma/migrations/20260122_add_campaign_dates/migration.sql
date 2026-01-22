-- Migration: add_campaign_dates
-- Adds startAt and endAt columns to Campaigns if they do not exist
ALTER TABLE "Campaigns" ADD COLUMN IF NOT EXISTS "startAt" timestamptz;
ALTER TABLE "Campaigns" ADD COLUMN IF NOT EXISTS "endAt" timestamptz;
