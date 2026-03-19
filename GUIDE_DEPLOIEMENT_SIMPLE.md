# Déployer DRS en ligne – guide pas à pas (depuis zéro)

Ce guide part du principe que le projet n’est pas encore sur GitHub et que tu utilises Supabase. On fait dans l’ordre : **Supabase** → **créer les tables** → **GitHub** → **Vercel**.

---

## Étape 1 : Supabase – récupérer l’URL de la base

1. Va sur **https://supabase.com** et connecte-toi.
2. Ouvre ton **projet** (celui avec la base pour DRS).
3. Dans le menu de gauche, clique sur l’**engrenage** en bas → **Project Settings**.
4. Dans le menu de gauche, clique sur **Database**.
5. Descends jusqu’à la section **Connection string** (ou clique **Connect** en haut du projet).

### Sur Windows : ne pas utiliser Direct `:5432`

L’URL **Direct** (`db.xxx.supabase.co:5432`) utilise souvent **IPv6**. Sur beaucoup de PC / réseaux Windows, Prisma affiche **P1001 Can’t reach database server**.  
Il faut le mode **Transaction** (pooler), port **`:6543`**.

6. Dans **Connection string**, choisis le mode **Transaction** (ou **Pooler** → transaction), pas **Direct**.
7. Copie l’**URI** (elle doit contenir **`...supabase.co:6543/...`**, pas `:5432`).
8. Ouvre ton fichier **`.env`** à la racine du projet (`f:\Entreprises\DRS\detailing software`).
9. Mets par exemple :
   ```text
   DATABASE_URL="COLLE_ICI_L_URL_COPIÉE&pgbouncer=true"
   ```
   - Si l’URL copiée a déjà des paramètres après `?`, ajoute **`&pgbouncer=true`** à la fin (important pour **Prisma** + pooler).
   - Vérifie aussi **`sslmode=require`** si ce n’est pas déjà dans l’URL.
10. **Mot de passe** : pas de crochets `[]` autour du mot de passe.  
    Si le mot de passe contient **`?`** ou **`#`**, encode : `?` → `%3F`, `#` → `%23`.
11. Sauvegarde le fichier `.env`.

**Vérification** : après `npx prisma db push`, la ligne `Datasource` doit afficher **`:6543`**, pas **`:5432`**.

### Si ton `.env` a bien `:6543` mais Prisma affiche encore `:5432` (P1001)

Sur Windows, une variable d’environnement **système ou utilisateur** nommée **`DATABASE_URL`** **écrase** le fichier `.env`. Prisma utilise alors l’ancienne URL (souvent en **:5432**).

1. Touche **Windows**, tape **variables d’environnement** → **Modifier les variables d’environnement pour votre compte** (ou système).
2. Dans **Variables utilisateur** (et éventuellement **Variables système**), cherche **`DATABASE_URL`**.
3. Si elle existe avec une URL en `:5432`, **supprime-la** ou remplace-la par la même URL que dans ton `.env` (mode Transaction **:6543** + `pgbouncer=true`).
4. **Ferme et rouvre** le terminal (cmd ou PowerShell), puis refais `npx prisma db push`.

Pour vérifier dans **cmd** avant Prisma :

```cmd
echo %DATABASE_URL%
```

Si une longue URL s’affiche alors que tu ne l’as pas définie dans cette fenêtre, c’est qu’elle vient des variables Windows.

---

## Étape 2 : Créer les tables dans Supabase (une seule fois)

Ouvre **l’invite de commandes Windows** (pas PowerShell) :  
**Win + R** → tape **cmd** → Entrée.

Puis exécute :

```cmd
cd /d "f:\Entreprises\DRS\detailing software"
npx prisma db push
```

Si tout va bien, tu vois un message du type "Your database is now in sync with your schema".  
Si tu as une erreur "Can't reach database server" : vérifie que le projet Supabase n’est pas en pause (dashboard Supabase → bouton **Restore** si besoin) et que le mot de passe dans `.env` est correct.

(Optionnel) Pour ajouter des données de démo (admin, etc.) :

```cmd
npx tsx run_seed.ts
```

---

### Si tu as l’erreur « Can't reach database server » (P1001)

Fais les points suivants **dans l’ordre** :

**1. Vérifier que le projet Supabase n’est pas en pause**

- Ouvre **https://supabase.com/dashboard** et sélectionne ton projet.
- Si tu vois **« Project is paused »** ou un bouton **« Restore project »**, clique dessus et attends que le projet redémarre (quelques minutes).
- Réessaie ensuite : `npx prisma db push`.

**2. Tester la base depuis le navigateur**

- Dans Supabase, menu de gauche : **SQL Editor**.
- Clique sur **New query**, tape : `SELECT 1;` puis **Run**.
- Si la requête s’exécute, la base fonctionne. Le blocage vient alors de ton PC ou du type de connexion (passer au point 3).
- Si ça ne marche pas, le projet est peut‑être encore en pause ou il y a un souci côté Supabase.

**3. Utiliser l’URL « Session mode » (pooler) au lieu de Direct**

Parfois la connexion **Direct** (port 5432) est bloquée par ton réseau. Essaie l’URL du **pooler** :

- Supabase → **Project Settings** (engrenage) → **Database**.
- Descends jusqu’à **Connection string**.
- Repère la section **Connection pooling** (ou un onglet du même type).
- Choisis **Session mode** (ou **Transaction mode**) et copie l’URL affichée (elle contient souvent **:6543** et un host du type **`aws-0-xxx.pooler.supabase.com`**).
- Remplace dans ton **`.env`** la valeur de **DATABASE_URL** par cette nouvelle URL (en remplaçant toujours `[YOUR-PASSWORD]` par ton mot de passe, et en encodant **?** en **%3F** si besoin).
- Sauvegarde puis réessaie : `npx prisma db push`.

**4. Vérifier le mot de passe**

- Supabase → **Project Settings** → **Database** → **Database password**.
- Si tu n’es pas sûr du mot de passe : **Reset database password**, note le nouveau, et mets‑le dans **DATABASE_URL** dans ton `.env` (avec **%3F** pour un **?** si ton mot de passe en contient un).

**5. Réseau / pare-feu**

- Si tu es sur un réseau d’entreprise ou un VPN, essaie sans VPN ou depuis une autre connexion (ex. partage de connexion du téléphone).
- Vérifie que ton pare-feu ou antivirus n’ bloque pas les connexions sortantes sur le port **5432** (ou **6543** si tu utilises le pooler).

---

## Étape 3 : Mettre le projet sur GitHub

### 3.1 Compte GitHub

- Si tu n’as pas de compte : va sur **https://github.com** → **Sign up**.
- Connecte-toi.

### 3.2 Créer un dépôt vide sur GitHub

1. Clique sur le **+** en haut à droite → **New repository**.
2. **Repository name** : par ex. `drs-detailing-software` (sans espace).
3. Laisse **Public**.
4. Ne coche **pas** "Add a README" (le projet en a déjà un).
5. Clique sur **Create repository**.

Tu arrives sur une page avec une URL du type :  
`https://github.com/TON_USERNAME/drs-detailing-software`

### 3.3 Envoyer ton code depuis ton PC

Ouvre à nouveau **cmd** (invite de commandes) :

```cmd
cd /d "f:\Entreprises\DRS\detailing software"
git init
git add .
git commit -m "Premier commit - DRS Detailing"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/drs-detailing-software.git
git push -u origin main
```

Remplace **TON_USERNAME** et **drs-detailing-software** par ton vrai nom d’utilisateur et le nom du dépôt que tu as créé.

Si on te demande de te connecter à GitHub, suis les instructions (mot de passe ou token). Une fois le `git push` terminé, ton code est sur GitHub.

---

## Étape 4 : Déployer sur Vercel

1. Va sur **https://vercel.com** et connecte-toi (idéalement avec le même compte GitHub).
2. Clique sur **Add New** → **Project**.
3. Tu vois la liste de tes dépôts GitHub. Choisis **drs-detailing-software** (ou le nom que tu as donné) → **Import**.
4. Sur la page de configuration :
   - **Framework** : Next.js (normalement déjà détecté).
   - Ne change pas **Build Command** (laisse `npm run build`).
5. **Environment Variables** (important) :
   - Clique sur **Add** (ou "Environment Variables").
   - **Name** : `DATABASE_URL`  
     **Value** : colle **exactement la même** URL que dans ton `.env` (celle de Supabase).
   - Clique à nouveau **Add**.
   - **Name** : `NEXT_PUBLIC_APP_URL`  
     **Value** : pour l’instant mets `https://ton-projet.vercel.app` (on mettra la vraie URL juste après le premier déploiement).
6. Clique sur **Deploy**.

Attends la fin du build. À la fin, Vercel t’affiche l’URL de ton site (ex. `https://drs-detailing-software-xxx.vercel.app`).

### Mettre la bonne URL pour les liens client

1. Dans le projet Vercel, va dans **Settings** → **Environment Variables**.
2. Modifie **NEXT_PUBLIC_APP_URL** : mets l’URL exacte de ton site (celle affichée après le deploy).
3. Va dans **Deployments** → sur le dernier déploiement, clique sur les **...** → **Redeploy** (pour que la nouvelle variable soit prise en compte).

---

## Récap

| Étape | Où | Quoi faire |
|-------|----|-------------|
| 1 | Supabase | Récupérer l’URL (Project Settings → Database → Connection string URI) et la mettre dans `.env` avec le bon mot de passe. |
| 2 | CMD sur ton PC | `npx prisma db push` (et optionnellement `npx tsx run_seed.ts`). |
| 3 | GitHub | Créer un dépôt, puis `git init` → `git add .` → `git commit` → `git remote add origin` → `git push`. |
| 4 | Vercel | Import du dépôt GitHub, ajout de `DATABASE_URL` et `NEXT_PUBLIC_APP_URL`, puis Deploy. |

Une fois tout ça fait, ton app est en ligne sur l’URL Vercel. Tu peux t’y connecter en admin (mot de passe défini dans le seed, souvent `admin` pour le MVP).
