-- ============================================================
-- DRS DETAILING – SYNCHRONISATION PRISMA → SUPABASE
-- Généré le 2026-04-22 – Correspond à schema.prisma actuel
-- Sûr à ré-exécuter (IF NOT EXISTS partout)
-- ============================================================

-- ==================== TABLES CORE ====================

-- User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "email" TEXT UNIQUE,
    "password" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ClientProfile
CREATE TABLE IF NOT EXISTS "ClientProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id"),
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "businessId" TEXT,
    "referralCode" TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
    "referredById" TEXT,
    "accessKey" TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
    "npsScore" INTEGER,
    "lastMarketingSent" TIMESTAMP(3),
    "lastBookingDate" TIMESTAMP(3)
);

-- EmployeeProfile
CREATE TABLE IF NOT EXISTS "EmployeeProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id"),
    "hourlyRate" DOUBLE PRECISION,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1
);

-- Badge
CREATE TABLE IF NOT EXISTS "Badge" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL,
    "criteria" TEXT
);

-- EmployeeBadge
CREATE TABLE IF NOT EXISTS "EmployeeBadge" (
    "employeeId" TEXT NOT NULL REFERENCES "EmployeeProfile"("id"),
    "badgeId" TEXT NOT NULL REFERENCES "Badge"("id"),
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("employeeId", "badgeId")
);

-- Availability
CREATE TABLE IF NOT EXISTS "Availability" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "employeeId" TEXT NOT NULL REFERENCES "EmployeeProfile"("id"),
    "dayOfWeek" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT FALSE,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL
);

-- BusinessProfile
CREATE TABLE IF NOT EXISTS "BusinessProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "clientId" TEXT NOT NULL REFERENCES "ClientProfile"("id"),
    "type" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "color" TEXT,
    "licensePlate" TEXT,
    "businessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Service
CREATE TABLE IF NOT EXISTS "Service" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60
);

-- ServiceExtra
CREATE TABLE IF NOT EXISTS "ServiceExtra" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serviceId" TEXT NOT NULL REFERENCES "Service"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "priceExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationExtraMin" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "ServiceExtra_serviceId_idx" ON "ServiceExtra"("serviceId");

-- Job
CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "clientId" TEXT NOT NULL REFERENCES "ClientProfile"("id"),
    "vehicleId" TEXT,
    "employeeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "color" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "customServiceName" TEXT,
    "customServicePrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- JobService (join table)
CREATE TABLE IF NOT EXISTS "JobService" (
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "serviceId" TEXT NOT NULL REFERENCES "Service"("id"),
    "selectedExtraIds" JSONB,
    "isDone" BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY ("jobId", "serviceId")
);

-- _JobTeam (many-to-many implicit Prisma table)
CREATE TABLE IF NOT EXISTS "_JobTeam" (
    "A" TEXT NOT NULL REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE,
    "B" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_JobTeam_AB_unique" ON "_JobTeam"("A", "B");
CREATE INDEX IF NOT EXISTS "_JobTeam_B_index" ON "_JobTeam"("B");

-- ==================== INVENTORY ====================

-- InventoryItem
CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "minThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "type" TEXT NOT NULL,
    "sdsUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- InventoryFormat
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

-- ProductUsage
CREATE TABLE IF NOT EXISTS "ProductUsage" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "itemId" TEXT NOT NULL REFERENCES "InventoryItem"("id"),
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INSPECTIONS & TIME ====================

-- Inspection
CREATE TABLE IF NOT EXISTS "Inspection" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL DEFAULT 'CHECK_IN',
    "notes" TEXT,
    "photos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT
);

-- InspectionPoint
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

-- TimeLog
CREATE TABLE IF NOT EXISTS "TimeLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER
);

-- ==================== FINANCES & MISC ====================

-- Expense
CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT
);

-- GiftCard
CREATE TABLE IF NOT EXISTS "GiftCard" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "code" TEXT NOT NULL UNIQUE,
    "initialAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WaitlistEntry
CREATE TABLE IF NOT EXISTS "WaitlistEntry" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "clientId" TEXT NOT NULL REFERENCES "ClientProfile"("id"),
    "preferredDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Warranty
CREATE TABLE IF NOT EXISTS "Warranty" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "clientId" TEXT NOT NULL REFERENCES "ClientProfile"("id"),
    "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id"),
    "serviceId" TEXT NOT NULL REFERENCES "Service"("id"),
    "businessId" TEXT,
    "certNumber" TEXT NOT NULL UNIQUE,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BetaFeedback
CREATE TABLE IF NOT EXISTS "BetaFeedback" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "pageUrl" TEXT NOT NULL,
    "userContext" TEXT,
    "content" TEXT NOT NULL,
    "screenshots" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== COLONNES MANQUANTES (ALTER) ====================
-- Ces ALTER sont sûrs à ré-exécuter grâce à IF NOT EXISTS

-- User : email et password optionnels
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Job : colonnes ajoutées après V1
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "totalPrice" DOUBLE PRECISION;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "customServiceName" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "customServicePrice" DOUBLE PRECISION;

-- Vehicle : colonnes optionnelles
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "year" INTEGER;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "licensePlate" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "businessId" TEXT;

-- ClientProfile : colonnes marketing/NPS
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "npsScore" INTEGER;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "lastMarketingSent" TIMESTAMP(3);
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "lastBookingDate" TIMESTAMP(3);
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- InventoryItem : SDS url
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "sdsUrl" TEXT;

-- JobService : extras et done tracking
ALTER TABLE "JobService" ADD COLUMN IF NOT EXISTS "selectedExtraIds" JSONB;
ALTER TABLE "JobService" ADD COLUMN IF NOT EXISTS "isDone" BOOLEAN DEFAULT FALSE;

-- Foreign keys manquantes (safe)
DO $$ BEGIN
    ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_businessId_fkey"
        FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_referredById_fkey"
        FOREIGN KEY ("referredById") REFERENCES "ClientProfile"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_businessId_fkey"
        FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_businessId_fkey"
        FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==================== FIN ====================
-- Après exécution, l'app devrait fonctionner sans erreur de schéma.
