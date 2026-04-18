const { spawnSync } = require("node:child_process")

function isEnabled(value) {
  if (!value) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes"
}

const enabled = isEnabled(process.env.PRISMA_DB_PUSH_ON_BUILD)

if (!enabled) {
  console.log("[prebuild-db-sync] Skipped (PRISMA_DB_PUSH_ON_BUILD not enabled).")
  process.exit(0)
}

if (!process.env.DATABASE_URL) {
  console.error("[prebuild-db-sync] DATABASE_URL is missing while PRISMA_DB_PUSH_ON_BUILD is enabled.")
  process.exit(1)
}

console.log("[prebuild-db-sync] Running prisma db push...")
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx"
const result = spawnSync(npxBin, ["prisma", "db", "push"], { stdio: "inherit" })

if (result.status !== 0) {
  console.error(`[prebuild-db-sync] prisma db push failed (exit ${result.status ?? "unknown"}).`)
  process.exit(result.status ?? 1)
}

console.log("[prebuild-db-sync] Database schema synced.")
