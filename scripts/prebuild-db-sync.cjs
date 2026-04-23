/**
 * Script de pré-build désactivé pour éviter de bloquer les déploiements Vercel
 * en cas de saturation de connexions.
 */
console.log("[prebuild-db-sync] Skipped (manual sync only).")
process.exit(0)
