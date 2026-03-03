# Architecture Taagne-GFA

Document de référence pour comprendre et faire évoluer le projet.

---

## 1. Vue d’ensemble

- **Frontend** : React (Vite) + TypeScript, React Router, React Query, contextes (auth, langue, année scolaire).
- **Backend** : Node.js + Express, MongoDB (Mongoose), JWT, rôles (super_admin, admin, director, accountant, teacher).

---

## 2. Frontend (`frontend/src`)

### 2.1 Rôle des dossiers

| Dossier | Rôle |
|--------|------|
| **`pages/`** | Une page = un écran (route). Fichiers PascalCase (ex. `UserManagement.tsx`). |
| **`components/`** | Composants réutilisables. Sous-dossiers : `layout/`, `ui/`, `dashboard/`, `grades/`, `filters/`, etc. |
| **`components/ui/`** | Composants UI de base (boutons, cartes, formulaires) — style shadcn. |
| **`hooks/`** | Logique réutilisable (données, side-effects). Préfixe `use` (ex. `usePayments.ts`). |
| **`contexts/`** | État global (Auth, Langue, Année scolaire, Filtre super-admin). |
| **`lib/`** | Utilitaires, client API, formatage, validation. Pas de React. |
| **`i18n/`** | Traductions (fr.json, ar.json) et configuration i18n. |
| **`constants/`** | Constantes partagées (routes, noms d’app). |

### 2.2 Flux typique

- **Route** → définie dans `App.tsx` (ou via `constants/routes.ts`).
- **Page** → charge les données via des **hooks** (`usePayments`, `useSchoolYears`, etc.).
- **Hooks** → appellent `lib/api.ts` (client HTTP) et mettent en cache avec React Query.
- **Contexte** → auth (`AuthContext`), langue (`LanguageContext`), année scolaire (`SchoolYearContext`).

### 2.3 Conventions

- **Imports** : alias `@/` pour `src/` (ex. `@/components/ui/button`).
- **Noms** : composants en PascalCase, hooks/fichiers en camelCase.
- **Nouvelle page** : ajouter le composant dans `pages/`, la route dans `App.tsx`, et le lien dans la sidebar si besoin.

---

## 3. Backend (`backend`)

### 3.1 Rôle des dossiers

| Dossier | Rôle |
|--------|------|
| **`models/`** | Schémas Mongoose (User, School, Payment, etc.). Un fichier par entité. |
| **`controllers/`** | Logique métier : lecture/écriture en base, réponses HTTP. Un fichier par domaine. |
| **`routes/`** | Définition des URLs et des middlewares (auth, rôles). Un fichier par domaine. |
| **`middlewares/`** | Auth JWT, vérification des rôles, année scolaire active, abonnement. |
| **`config/`** | Connexion base de données. |
| **`utils/`** | Validation, messages d’erreur. |
| **`scripts/`** | Scripts CLI (ex. seed super-admin). |

### 3.2 Flux d’une requête

1. **Route** (`routes/xxx_routes.js`) : méthode HTTP + chemin.
2. **Middlewares** : `protect` (JWT), `authorizeRoles(...)`, `requireActiveSchoolYear`, etc.
3. **Controller** : `exports.maFonction = async (req, res) => { ... }` — lit `req.user`, `req.query`, `req.body`, envoie `res.json(...)`.

### 3.3 Conventions

- **Modèles** : singulier pour le schéma (ex. `User`, `Payment`), fichier en PascalCase (ex. `Users.js` pour le modèle User).
- **Controllers** : `nom_domaine_controller.js` (ex. `user_controller.js`).
- **Routes** : `nom_domaine_routes.js`. Préfixe API : `/backend_api/...` (défini dans `app.js`).
- **Réponses** : succès `res.status(200).json(...)`, erreur `res.status(4xx/5xx).json({ message: '...' })`.

---

## 4. Sécurité et rôles

- **super_admin** : accès plateforme (dashboard super-admin, toutes les écoles).
- **admin / director** : gestion de l’école (utilisateurs, paramètres, rôles et permissions).
- **accountant** : finances (paiements, dépenses, types de frais).
- **teacher** : pédagogie (notes, emplois du temps, etc.).

Connexion super-admin : formulaire dédié (`/auth?mode=super_admin`), compte dans la collection `SuperAdmin`. Les autres utilisateurs sont dans la collection `User` avec `schoolId`.

---

## 5. Où ajouter quoi ?

| Besoin | Où faire |
|--------|----------|
| Nouvelle page (écran) | `frontend/src/pages/NomPage.tsx` + route dans `App.tsx` |
| Nouveau composant réutilisable | `frontend/src/components/` (ou sous-dossier approprié) |
| Nouvel appel API | `frontend/src/lib/api.ts` + hook dans `hooks/` si besoin de cache |
| Nouvelle route API | `backend/routes/` + `backend/controllers/` |
| Nouvelle entité en base | `backend/models/Nom.js` + schéma Mongoose |
| Nouvelle traduction | `frontend/src/i18n/locales/fr.json` et `ar.json` |

---

## 6. Démarrage

- **Backend** : `cd backend && npm install && npm run dev` (écoute sur le port configuré, ex. 5000).
- **Frontend** : `cd frontend && npm install && npm run dev` (Vite, ex. 5173).
- **Variables d’environnement** : voir `.env.example` ou README dans chaque dossier si présent.

---

## 7. Refactorisation récente (résumé)

- **Backend** : le dossier des schémas Mongoose s’appelle `models/` (et non `modals/`). Tous les `require('../models/...')` pointent vers ce dossier.
- **Frontend** : les chemins de routes sont centralisés dans `src/constants/index.ts` (`ROUTES`, `dashboardPath()`). `App.tsx` et la sidebar utilisent ces constantes ; pour ajouter une route, on l’ajoute dans `ROUTES.DASH` et dans `DASHBOARD_ROUTES` dans `App.tsx`.
- **Documentation** : ce fichier (`ARCHITECTURE.md`) décrit la structure et les conventions pour garder le projet simple et compréhensible.
