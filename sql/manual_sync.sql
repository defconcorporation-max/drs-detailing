-- SQL pour synchroniser manuellement le schéma DRS v5.0
-- À exécuter dans le SQL Editor de Supabase si Prisma ne parvient pas à faire le push

-- 1. Table ProductUsage
CREATE TABLE IF NOT EXISTS "ProductUsage" (
    "id" TEXT PRIMARY KEY,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "itemId" TEXT NOT NULL REFERENCES "InventoryItem"("id"),
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table BusinessProfile
CREATE TABLE IF NOT EXISTS "BusinessProfile" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table GiftCard
CREATE TABLE IF NOT EXISTS "GiftCard" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT UNIQUE NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table Warranty
CREATE TABLE IF NOT EXISTS "Warranty" (
    "id" TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL REFERENCES "ClientProfile"("id"),
    "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id"),
    "serviceId" TEXT NOT NULL REFERENCES "Service"("id"),
    "certNumber" TEXT UNIQUE NOT NULL,
    "issueDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table WaitlistEntry
CREATE TABLE IF NOT EXISTS "WaitlistEntry" (
    "id" TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL REFERENCES "ClientProfile"("id"),
    "preferredDate" TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Mise à jour des tables existantes
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "npsScore" INTEGER;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "lastMarketingSent" TIMESTAMP;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "lastBookingDate" TIMESTAMP;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "businessId" TEXT REFERENCES "BusinessProfile"("id");
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "businessId" TEXT REFERENCES "BusinessProfile"("id");
