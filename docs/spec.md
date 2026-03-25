# VerticalLog — Spec & Journal de développement

> Ce fichier est mis à jour à chaque changement significatif du projet.
> Il sert de référence pour l'évaluation finale et la co-développement Human-AI.

---

## Statut actuel

| Élément | Statut |
|---|---|
| Backend API | Complet |
| Authentification | Complet (Passport.js + JWT) |
| Base de données | Complet (Prisma + PostgreSQL 16) |
| Frontend — navigation publique | Complet |
| Frontend — carnet utilisateur | Complet |
| Frontend — gestion sites/voies (expert/admin) | Complet |
| OpenAPI spec | Complet |
| Release avancée 1 — carte interactive | A faire |
| Release avancée 2 — commentaires, export | A faire |

---

## Historique des étapes réalisées

### [c35ea2e] — Commit initial

**Contexte :** Projet scolaire fullstack "VerticalLog", carnet d'escalade numérique.

**Implémenté :**
- Stack complète : React 18 + TypeScript + Vite (frontend), Node.js + Express + TypeScript (backend), PostgreSQL 16 via Docker
- Authentification JWT avec `bcrypt` + `jsonwebtoken`
- Middleware de rôles hiérarchique : `user (1) < expert (2) < admin (3)`
- 4 modules de routes backend : `auth`, `sites`, `climbing-routes`, `logbook`
- 7 pages frontend : Home, Sites, SiteDetail, Login, Register, Logbook, Profile
- Schéma SQL : `users`, `sites`, `climbing_routes`, `logbook`
- Données de démo : 1 admin, 3 sites, 5 voies
- `docker-compose.yml` avec init automatique depuis `init.sql`

**Décisions techniques :**
- SQL brut via `pg.Pool` (remplacé ensuite par Prisma)
- JWT stocké en localStorage côté frontend
- Vite proxy `/api/*` → `localhost:3001`

---

### [740509e] — CLAUDE.md

**Contexte :** Mise en place du contexte de co-développement Human-AI.

**Implémenté :**
- `CLAUDE.md` : fichier de guidance pour Claude Code (commandes, architecture, rôles, flux d'auth)
- Dépôt GitHub créé : `Oslolc/projet-escalade` (renommé ensuite)

---

### [b0c4733] — Migration Prisma + Passport.js

**Contexte :** Le contrat projet indiquait Prisma et Passport — le code utilisait `pg` brut et JWT direct. Migration pour aligner code et contrat.

**Implémenté :**
- **Prisma ORM** remplace `pg.Pool` :
  - `backend/prisma/schema.prisma` : source de vérité du schéma DB
  - `prisma.user`, `prisma.site`, `prisma.climbingRoute`, `prisma.logbook`
  - `$queryRaw` conservé uniquement pour les stats (agrégats complexes)
- **Passport.js** remplace la vérification JWT manuelle :
  - `passport-local` : stratégie login (email + mot de passe via bcrypt)
  - `passport-jwt` : stratégie protection des routes (Bearer token)
  - `backend/src/config/passport.ts` : configuration des deux stratégies
  - `authenticateToken` devient `passport.authenticate('jwt', { session: false })`
- Erreurs Prisma mappées : `P2002` (doublon) → 409, `P2025` (introuvable) → 404

**Avantages apportés :**
- Typage TypeScript automatique des modèles DB
- Injection SQL impossible par construction
- Schéma centralisé et versionnable

---

### [f032c2e] — UI gestion sites et voies (expert/admin)

**Contexte :** L'API CRUD existait mais le frontend ne proposait aucune UI pour créer/modifier/supprimer.

**Implémenté :**

**`frontend/src/pages/Sites.tsx`** :
- Bouton "+ Nouveau site" visible uniquement pour `expert` et `admin`
- Modal création/modification de site (nom, type, localisation, description, image URL)
- Bouton "Modifier" par carte de site (expert/admin)
- Bouton "Supprimer" par carte de site (admin uniquement) avec confirmation

**`frontend/src/pages/SiteDetail.tsx`** :
- Bouton "+ Ajouter une voie" visible pour expert/admin
- Modal création/modification de voie (nom, cotation, style, description)
- Bouton "Modifier" par ligne de voie (expert/admin)
- Bouton "Supprimer" par ligne de voie (admin uniquement)
- Colonne "Actions" unifiée : "+ Carnet" (user) + "Modifier" (expert) + "Supprimer" (admin)

**Règle de permissions frontend :**
```typescript
const canManage = user?.role === 'expert' || user?.role === 'admin';
const canDelete = user?.role === 'admin';
```

---

### [17a28a7] — CTAs page d'accueil adaptatifs

**Contexte :** La home affichait "Créer un compte" même pour les utilisateurs déjà connectés.

**Implémenté :**
- Import de `useAuth` dans `Home.tsx`
- Hero : si connecté → "Mon carnet", sinon → "Créer un compte"
- Section CTA bas de page : si connecté → message de bienvenue + liens "Mon carnet" / "Mon profil", sinon → "Commencer gratuitement"

---

### [45c55e7] — Fix : liste de voies vide dans le carnet

**Contexte :** Dans le modal "Nouvelle ascension" du carnet, sélectionner un site laissait la liste des voies vide.

**Cause :** `GET /api/sites` retourne `route_count` mais pas `climbing_routes`. Le code lisait `site?.climbing_routes` depuis la liste déjà chargée — toujours `undefined`.

**Correction (`Logbook.tsx`) :**
```typescript
// Avant
const site = sites.find((s) => s.id === Number(selectedSite));
setRoutes(site?.climbing_routes || []);

// Après
getRoutesForSite(Number(selectedSite))
  .then((res) => setRoutes(res.data))
```
Appel API `GET /api/climbing-routes/site/:id` déclenché à chaque sélection de site.

---

### [8c67d90] — Slides de présentation orale

**Contexte :** Présentation orale "Human-AI co-dev strategy" (5 min, 25 mars 2026).

**Implémenté :**
- `docs/presentation.html` : présentation HTML autonome, 5 slides
- Navigation clavier (flèches) et clics
- Contenu : outil+setup, stratégie Human/IA, exemple concret (bug admin), bilan critique
- Renommage du dépôt : `2026_FULLSTACK_DECAY_Mathis`

---

### Fix : hash bcrypt invalide pour le compte admin

**Contexte :** `POST /api/auth/login` retournait systématiquement "Invalid credentials" pour `admin@verticallog.fr`.

**Cause :** Le hash bcrypt dans `init.sql` (`$2b$10$rOzJqhG7...`) ne correspondait pas au mot de passe `admin123` — vérifié avec `bcrypt.compare()`.

**Correction :**
- Nouveau hash généré : `$2b$10$PjEObkDVkfPAR/tux3FbR.dzfz23LToUtnhBkvLBDTaBvmBLr/roe`
- `init.sql` mis à jour
- DB mise à jour directement via requête SQL

---

### [2b8c8b6] — OpenAPI 3.0 spec

**Contexte :** Adoption du spec-driven development — documenter l'API existante comme source de vérité.

**Implémenté :**
- `docs/openapi.yaml` : spec OpenAPI 3.0 complète
- 17 endpoints documentés (auth, sites, climbing-routes, logbook, health)
- Schémas : User, Site, ClimbingRoute, LogbookEntry, Stats, Error
- Codes d'erreur : 400, 401, 403, 404, 409
- Sécurité Bearer JWT documentée
- Contraintes de rôle par endpoint

**Utilisation :** coller dans [editor.swagger.io](https://editor.swagger.io) pour UI interactive.

---

### React 19

**Contexte :** Contrat projet indiquait React 19.

**Implémenté :**
- `frontend/package.json` : `react` et `react-dom` passés à `^19.0.0`
- `@types/react` et `@types/react-dom` passés à `^19.0.0`

**A faire :** lancer `npm install` dans `/frontend` pour installer les nouvelles versions.

---

## Prochaines étapes à implémenter

### Release avancée 1

#### Carte interactive des sites
- **Lib :** Leaflet + `react-leaflet`
- **Données :** `latitude` et `longitude` déjà présents dans le modèle `Site`
- **UI :** nouvelle page ou section dans `Sites.tsx` avec toggle carte/liste
- **Marqueurs :** clic sur un marqueur → lien vers `SiteDetail`

#### Filtrage avancé des sites
- Filtre par type déjà présent — étendre avec :
  - Recherche par département/région
  - Filtre par cotation min/max des voies du site

---

### Release avancée 2

#### Commentaires communautaires sur les voies
- Nouveau modèle DB : `comments (id, user_id, route_id, content, created_at)`
- Nouveau endpoint : `GET/POST /api/climbing-routes/:id/comments`
- UI : section commentaires dans `SiteDetail` sous chaque voie

#### Export du carnet
- Endpoint : `GET /api/logbook/export?format=csv`
- Générer CSV côté backend avec les colonnes : date, voie, cotation, site, ressenti, commentaire
- Bouton "Exporter CSV" dans `Logbook.tsx`

#### Upload d'images pour les sites
- Lib backend : `multer` pour la gestion des fichiers
- Stockage : dossier `backend/uploads/` ou service externe (Cloudinary)
- Remplace le champ `image_url` (URL manuelle) par un vrai upload

---

### Améliorations techniques restantes

| Tâche | Priorité | Détail |
|---|---|---|
| `npm install` React 19 | Haute | Appliquer la mise à jour `package.json` |
| Variables d'environnement | Moyenne | Renforcer `JWT_SECRET` en production |
| Pagination logbook | Basse | `GET /api/logbook?page=1&limit=20` |
| Refresh token | Basse | Éviter la déconnexion après 7 jours |
| Tests API | Basse | Vitest + supertest sur les routes critiques |

---

## Architecture en bref

```
frontend/src/
├── api.ts               — client Axios + intercepteur Bearer token
├── context/AuthContext  — état global auth (user, token, login, logout)
├── components/
│   ├── Navbar           — navigation + état connecté/déconnecté
│   ├── PrivateRoute     — garde les routes protégées
│   └── StarRating       — composant ressenti 1-5
└── pages/
    ├── Home             — hero + stats + CTAs adaptatifs
    ├── Sites            — liste + CRUD (expert/admin)
    ├── SiteDetail       — voies + CRUD voies + ajout carnet
    ├── Logbook          — carnet + stats + graphiques Chart.js
    ├── Profile          — profil utilisateur
    ├── Login / Register — formulaires auth

backend/src/
├── index.ts             — Express + CORS + Passport init
├── db.ts                — PrismaClient singleton
├── config/passport.ts   — LocalStrategy + JWTStrategy
├── middleware/auth.ts   — authenticateToken + requireRole()
└── routes/
    ├── auth.ts          — register, login (Passport), me
    ├── sites.ts         — CRUD sites (Prisma)
    ├── routes.ts        — CRUD voies (Prisma)
    └── logbook.ts       — CRUD carnet + stats ($queryRaw)

docs/
├── spec.md              — ce fichier
├── openapi.yaml         — spec API OpenAPI 3.0
└── presentation.html    — slides présentation orale
```

---

## Rôles et permissions

| Action | public | user | expert | admin |
|---|:---:|:---:|:---:|:---:|
| Consulter sites et voies | X | X | X | X |
| S'inscrire / se connecter | X | — | — | — |
| Gérer son carnet | — | X | X | X |
| Créer / modifier sites et voies | — | — | X | X |
| Supprimer sites et voies | — | — | — | X |

---

*Dernière mise à jour : 2026-03-25*
