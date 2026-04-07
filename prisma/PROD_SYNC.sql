-- SCRIPT DE SYNCHRONISATION PRISMA -> SUPABASE (V45)
-- À exécuter dans le SQL Editor de Supabase si l'erreur 500 persiste

-- 1. Table InventoryFormat (Nouveau système d'inventaire)
CREATE TABLE IF NOT EXISTS "InventoryFormat" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "itemId" TEXT NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "InventoryFormat_itemId_idx" ON "InventoryFormat"("itemId");

-- 2. Table Inspection (Prise en charge véhicule)
CREATE TABLE IF NOT EXISTS "Inspection" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL DEFAULT 'CHECK_IN',
    "notes" TEXT,
    "photos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT
);

-- 3. Table InspectionPoint (Dégâts signalés)
CREATE TABLE IF NOT EXISTS "InspectionPoint" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "inspectionId" TEXT NOT NULL REFERENCES "Inspection"("id") ON DELETE CASCADE,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT
);

-- 4. Table TimeLog (Suivi du temps de travail)
CREATE TABLE IF NOT EXISTS "TimeLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER
);

-- 5. Mise à jour de la table User (Rendre Email et Password optionnels pour les clients créés manuellement)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- 6. Mise à jour de Job
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "totalPrice" DOUBLE PRECISION;

-- 7. Mise à jour de Vehicle
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "year" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "licensePlate" TEXT;

-- 8. Mise à jour de ClientProfile
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "npsScore" INTEGER;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "lastMarketingSent" TIMESTAMP;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "lastBookingDate" TIMESTAMP;
