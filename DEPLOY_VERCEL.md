# Déployer DRS Software sur Vercel

Ce guide permet de mettre l’application en ligne sur Vercel avec une base PostgreSQL (Supabase, Neon ou Vercel Postgres).

## 1. Base PostgreSQL : Supabase (recommandé si vous avez déjà un compte)

L’app utilise **PostgreSQL**. Supabase fournit une base Postgres prête à l’emploi.

1. Connectez-vous sur [supabase.com](https://supabase.com) (votre compte Pro convient).
2. Créez un **nouveau projet** (ou utilisez un projet existant).
3. Allez dans **Project Settings** (icône engrenage) → **Database**.
4. Dans **Connection string**, choisissez **URI** et copiez l’URL.
5. Remplacez `[YOUR-PASSWORD]` par le mot de passe de la base (celui affiché à la création du projet, ou réinitialisez-le dans **Database** → **Reset database password** si besoin).

**Conseil** : pour Vercel (serverless), utilisez la connexion **Session mode** (port **6543**) plutôt que Direct (5432), pour éviter trop de connexions. Dans Supabase : **Database** → **Connection string** → onglet **Connection pooling** → **Session mode** → copiez l’URI (elle contient `:6543`).

Exemple d’URL Supabase (Session mode, pour l’app sur Vercel) :
`postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`

Pour **créer les tables** la première fois (`prisma db push`), si vous avez une erreur avec le pooler, utilisez la connexion **Direct** (port 5432) dans **Connection string** → **URI**, le temps du `db push`, puis gardez l’URL Session mode (6543) dans Vercel pour l’app.

Autres options : **Neon** ([neon.tech](https://neon.tech)), **Vercel Postgres** (Storage dans le dashboard Vercel).

## 2. Pousser le code sur GitHub

Si ce n’est pas déjà fait :

```bash
cd "f:\Entreprises\DRS\detailing software"
git init
git add .
git commit -m "Initial commit - DRS Detailing Software"
```

Créez un dépôt sur [github.com](https://github.com/new), puis :

```bash
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

## 3. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous (avec GitHub si possible).
2. **Add New** → **Project** → importez le dépôt GitHub du projet.
3. **Configure Project** :
   - Framework Preset : Next.js (détecté automatiquement).
   - Build Command : `npm run build` (déjà dans `package.json`).
   - Pas besoin de changer Output Directory.
4. **Environment Variables** (à remplir avant de déployer) :
   - `DATABASE_URL` = votre URL Postgres (Supabase, Neon ou Vercel Postgres).
   - `NEXT_PUBLIC_APP_URL` = l’URL de l’app une fois déployée, ex. `https://votre-projet.vercel.app`.
5. Cliquez sur **Deploy**.

## 4. Créer les tables en production (une seule fois)

Après le premier déploiement, la base est vide. Créez les tables depuis votre machine :

```bash
cd "f:\Entreprises\DRS\detailing software"
# Remplacez par l’URL de votre base (Supabase, Neon ou Vercel Postgres)
set DATABASE_URL=postgresql://user:password@host/db?sslmode=require
npx prisma db push
```

Ou sous PowerShell :

```powershell
$env:DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
npx prisma db push
```

(Optionnel) Données de démo :

```bash
npx tsx prisma/seed.ts
```

Pour plus de données de test (client, employé, services) : `npx tsx run_seed.ts`.  
Utilisez la même `DATABASE_URL` que celle configurée sur Vercel.

## 5. Vérifier l’URL publique

Dans le projet Vercel : **Settings** → **Domains** pour voir l’URL (ex. `https://drs-software-xxx.vercel.app`). Mettez à jour `NEXT_PUBLIC_APP_URL` avec cette URL puis **Redeploy** pour que les liens du portail client (emails, partage) pointent vers la bonne adresse.

## Résumé des variables Vercel

| Variable | Exemple | Obligatoire |
|----------|---------|-------------|
| `DATABASE_URL` | URL Supabase / Neon / Vercel Postgres (ex. Supabase : `...@xxx.pooler.supabase.com:6543/postgres`) | Oui |
| `NEXT_PUBLIC_APP_URL` | `https://votre-app.vercel.app` | Recommandé (liens client) |

---

**Accès en ligne** : après le déploiement, ouvrez l’URL Vercel. La page d’accueil propose les entrées Admin, Employé et Client. Les comptes de test sont ceux définis dans le seed (ex. admin, employé, client démo).

---

## Développement en local après passage à Postgres

L’app utilise maintenant **PostgreSQL** uniquement (plus SQLite). En local :

1. Utilisez [Supabase](https://supabase.com), [Neon](https://neon.tech) ou Postgres en local.
2. Copiez `.env.example` vers `.env` et renseignez `DATABASE_URL` avec l’URL Postgres.
3. Créez les tables : `npx prisma db push`
4. (Optionnel) Seed : `npx tsx prisma/seed.ts` ou `npx tsx run_seed.ts`
5. Lancez l’app : `npm run dev`
