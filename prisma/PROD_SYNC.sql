-- À exécuter sur Supabase (SQL Editor) si l’app Vercel plante après une mise à jour Prisma
-- et que tu ne peux pas lancer : npx prisma db push
-- (Une seule fois, ou si ces objets n’existent pas encore.)

CREATE TABLE IF NOT EXISTS "ServiceExtra" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationExtraMin" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ServiceExtra_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServiceExtra_serviceId_idx" ON "ServiceExtra"("serviceId");

DO $$ BEGIN
    ALTER TABLE "ServiceExtra" ADD CONSTRAINT "ServiceExtra_serviceId_fkey"
        FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Colonne ajoutée pour les extras choisis sur chaque ligne de service d’un job
ALTER TABLE "JobService" ADD COLUMN IF NOT EXISTS "selectedExtraIds" JSONB;
