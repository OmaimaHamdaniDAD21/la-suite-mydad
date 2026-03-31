# La Suite MyDAD — Contexte Projet

> Dernière mise à jour : 2026-03-30

## Vision

MyDAD est un **système d'exploitation stratégique et économique** pour les experts-comptables et leurs clients.
Ce n'est PAS un dashboard SaaS classique. C'est une plateforme de transformation qui combine :

- **Stratégie** : vision → piliers → objectifs → KPIs → actions
- **Transformation HOSMONY** : parcours 5 niveaux, exigences, actions, audit, certification
- **Création de valeur** : opportunités, financements, double matérialité, actifs hosmoniques
- **Configuration** : plateforme pilotée par le consultant (super-admin)
- **Données** : ingestion → normalisation → métriques calculées
- **IA native** : agents personnalisés, RAG, knowledge bases
- **Intégration** : connecteurs externes, sync, webhooks

---

## Architecture (7 couches)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Next.js 14 (App Router) + Shadcn/ui + Tailwind + Recharts │
├─────────────────────────────────────────────────────────────┤
│                    API GATEWAY LAYER                          │
│  Express.js REST + WebSocket                                 │
│  Auth, RBAC, tenant isolation, audit logging, config loader  │
├──────────┬──────────┬────────┬────────┬───────┬─────────────┤
│ STRATEGY │ HOSMONY  │ CONFIG │ DATA   │ AI    │ INTEGRATION │
│ + VALUE  │ ENGINE   │ ENGINE │ PIPE   │ LAYER │ LAYER       │
├──────────┴──────────┴────────┴────────┴───────┴─────────────┤
│                      DATA LAYER                              │
│  PostgreSQL 16 + pgvector │ Redis │ S3/MinIO                │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router), React, Tailwind, Shadcn/ui, Recharts |
| API | Express.js 5, TypeScript, Zod |
| ORM | Prisma 6 |
| BDD | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis + BullMQ |
| Stockage | S3-compatible (MinIO en dev) |
| IA | Claude API (Anthropic SDK), pgvector embeddings |
| Auth | JWT custom (access 15min + refresh 7j rotation) |
| Monorepo | Turborepo + pnpm |
| Infra dev | Docker Compose |
| Runtime | Node.js 20.20.2 (nvm) |

---

## Rôles (RBAC)

| Rôle | Description |
|------|-------------|
| `CONSULTANT` | Super-admin : configure la plateforme, gère N cabinets/clients |
| `EXPERT_COMPTABLE` | Pilote le cabinet, voit le portefeuille clients |
| `DIRIGEANT` | Dirigeant d'entreprise cliente, voit ses données |
| `COLLABORATEUR` | Membre d'équipe, actions assignées |

---

## HOSMONY — 5 Niveaux

| Niveau | Nom | Score min |
|--------|-----|-----------|
| 1 | Essentiel | 0 |
| 2 | Dynamique | 25 |
| 3 | Performance | 50 |
| 4 | Excellence | 75 |
| 5 | Étoile | 90 |

---

## Structure du Projet (état actuel)

```
la-suite-mydad/
├── package.json              # Root workspace (Turborepo + pnpm)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
│
├── docker/
│   └── docker-compose.yml    # PostgreSQL+pgvector, Redis, MinIO
│
├── demo/
│   ├── index.html            # Démo visuelle HTML/CSS/JS (validation UX)
│   └── server.mjs            # Serveur statique Node.js (port 5500)
│
├── apps/
│   └── api/                  # Express.js API
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                          # Entry point
│           ├── app.ts                            # Express app + routes
│           ├── config/
│           │   ├── env.ts                        # Zod-validated env
│           │   └── logger.ts                     # Pino logger
│           ├── middleware/
│           │   ├── auth.guard.ts                 # JWT verification
│           │   ├── role.guard.ts                 # requireRole() factory
│           │   ├── error-handler.ts              # AppError + global handler
│           │   ├── rate-limiter.ts               # In-memory rate limiter
│           │   ├── request-logger.ts             # HTTP request logging
│           │   └── audit-logger.ts               # logAudit() helper
│           ├── modules/
│           │   ├── auth/
│           │   │   ├── auth.routes.ts            # 8 routes
│           │   │   ├── auth.controller.ts        # Zod validation
│           │   │   └── auth.service.ts           # Business logic complète
│           │   ├── organizations/
│           │   │   ├── organizations.routes.ts   # 6 routes
│           │   │   └── organizations.controller.ts
│           │   ├── invitations/
│           │   │   ├── invitations.routes.ts     # 5 routes
│           │   │   └── invitations.controller.ts
│           │   ├── config-engine/                # ⚠️ NON INTÉGRÉ dans app.ts
│           │   │   ├── config-engine.routes.ts   # 19 routes
│           │   │   └── config-engine.controller.ts # 19 endpoints
│           │   └── users/
│           │       └── users.routes.ts           # Placeholder
│           └── utils/
│               ├── password.ts                   # bcrypt hash/verify
│               └── tokens.ts                     # JWT sign/verify
│
├── packages/
│   ├── shared/               # @mydad/shared
│   │   └── src/
│   │       ├── index.ts                          # Re-exports tout
│   │       ├── types/                            # 18 fichiers de types
│   │       │   ├── auth.types.ts
│   │       │   ├── user.types.ts
│   │       │   ├── organization.types.ts
│   │       │   ├── kpi.types.ts
│   │       │   ├── dashboard.types.ts
│   │       │   ├── hosmony.types.ts
│   │       │   ├── config.types.ts
│   │       │   ├── data-pipeline.types.ts
│   │       │   ├── ai.types.ts
│   │       │   ├── integration.types.ts
│   │       │   ├── strategy.types.ts
│   │       │   ├── evidence.types.ts
│   │       │   ├── audit.types.ts
│   │       │   ├── dynamics.types.ts
│   │       │   ├── opportunity.types.ts
│   │       │   ├── asset.types.ts
│   │       │   ├── stakeholder.types.ts
│   │       │   └── materiality.types.ts
│   │       ├── constants/                        # 5 fichiers
│   │       │   ├── roles.ts                      # ROLES, ROLE_LABELS, ROLE_HIERARCHY
│   │       │   ├── permissions.ts                # 42 permissions, DEFAULT_ROLE_PERMISSIONS
│   │       │   ├── hosmony-levels.ts             # 5 niveaux
│   │       │   ├── modules.ts                    # 15 MODULE_DEFINITIONS
│   │       │   └── connector-types.ts            # 9 types de connecteurs
│   │       └── validation/                       # 2 fichiers Zod
│   │           ├── auth.schema.ts
│   │           └── common.schema.ts
│   │
│   └── database/             # @mydad/database
│       ├── prisma/
│       │   ├── schema.prisma                     # ~600 lignes, 35+ modèles
│       │   └── seed.ts                           # 5 niveaux + 15 modules + ~24 exigences
│       └── src/
│           ├── client.ts                         # PrismaClient singleton
│           └── index.ts
```

---

## Avancement par Étape

### ✅ Étape 1 : Infrastructure Monorepo — TERMINÉE
- Turborepo + pnpm workspaces configurés
- Docker Compose : PostgreSQL 16 + pgvector, Redis 7, MinIO
- tsconfig, ESLint, Prettier
- `@mydad/shared` : 18 types, 5 constantes, 2 schémas Zod
- `@mydad/database` : schéma Prisma complet (35+ modèles), seed
- `.env.example` avec toutes les variables

### ✅ Étape 2 : API Core + Auth — TERMINÉE
- Express app avec middleware (CORS, Helmet, rate-limiter, error-handler, audit-logger)
- Auth complet : register, login, refresh, logout, forgot-password, reset-password, me, update-profile
- Guards : authGuard (JWT), requireRole (RBAC)
- Module invitations : send, list, validate, accept, revoke
- Module organizations : list, get, update, listMembers, listClients, addClient
- Transactions Prisma pour opérations critiques (register, accept invitation)

### 🟡 Étape 3 : Config Engine — EN COURS (fichiers créés, non intégré)
- `config-engine.routes.ts` : 19 routes définies
- `config-engine.controller.ts` : 19 endpoints implémentés
- **⚠️ NON type-checké** — fichiers créés par agent, compilation non vérifiée
- **⚠️ NON intégré** — routes pas encore montées dans `app.ts`
- À faire : vérifier compilation, monter `configRoutes` dans `app.ts`

### ⬜ Étape 4 : Data Pipeline (MVP)
### ⬜ Étape 5 : HOSMONY Journey Engine (API)
### ⬜ Étape 6 : Action Plan Engine (API)
### ⬜ Étape 7 : Evidence & Documentation System (API)
### ⬜ Étape 8 : Audit & Certification System (API)
### ⬜ Étape 9 : AI Studio (MVP)
### ⬜ Étape 10 : Strategy Engine (API)
### ⬜ Étape 11 : Double Materiality Engine (API)
### ⬜ Étape 12 : Stakeholder Management (API)
### ⬜ Étape 13 : Business & Value Engine (API)
### ⬜ Étape 14 : Market & Asset System (API)
### ⬜ Étape 15 : Internal Dynamics (API)
### ⬜ Étape 16 : Frontend — Auth + Shell + Config
### ⬜ Étape 17 : Frontend — Dashboard + HOSMONY + Strategy + Value
### ⬜ Étape 18 : Sécurité + Tests

---

## Démo Visuelle

Une démo HTML/CSS/JS standalone existe dans `demo/` :
- Serveur : `node demo/server.mjs` → `http://localhost:5500`
- Simule l'interface expert-comptable : sidebar, KPIs, plan d'actions, exigences HOSMONY, IA
- Objectif : validation UX avec de vrais experts-comptables avant de continuer le développement

---

## Décisions Techniques Importantes

### Architecture
1. **Multi-tenancy par `organizationId`** sur chaque entité — pas de schéma séparé par tenant
2. **Rôle sur `UserOrganization`** (join table) — un même user peut avoir des rôles différents selon l'org
3. **Hiérarchie cabinet/client** via `Organization.parentId` (self-referencing)
4. **Config Engine** : tout est configurable par org (modules, KPIs, workflows, permissions, feature flags)
5. **Templates consultant** : le consultant crée une config → l'applique à N clients

### Auth
6. **JWT custom** : access token 15min + refresh token 7j avec rotation
7. **bcrypt cost 12** pour le hashing des mots de passe
8. **Token rotation** : l'ancien refresh token est révoqué à chaque refresh

### Base de données
9. **PostgreSQL 16 + pgvector** : une seule BDD pour relationnel + embeddings IA
10. **Prisma 6** comme ORM — schéma déclaratif, migrations automatiques
11. **`Unsupported("vector(1536)")`** dans Prisma pour les embeddings pgvector

### HOSMONY
12. **Exigences configurables** par niveau — le consultant peut les personnaliser
13. **3 mécanismes de validation** : automatique (KPI → seuil), manuelle (consultant), evidence (preuve validée)
14. **Progression automatique** : quand toutes les exigences mandatory sont MET → proposition de passage

### IA
15. **10 agents pré-configurés** : regulatory, funding, business, brand, action_planner, pre_auditor, strategy_advisor, materiality_analyst, opportunity_detector, application_generator
16. **RAG avec pgvector** : chunking → embedding → recherche vectorielle → contexte injecté

### Données
17. **Pipeline 3 étapes** : RawData (brut) → NormalizedData (unifié) → ComputedMetric (KPI calculé)
18. **BullMQ** pour les jobs asynchrones (sync, metrics, embeddings, agents)

---

## Modèles Prisma (résumé)

| Domaine | Modèles |
|---------|---------|
| Core | User, RefreshToken, Organization, UserOrganization, Invitation |
| Config | OrgConfig, ModuleDefinition, ModuleConfig, FeatureFlag, KpiConfig, WorkflowConfig, RoleConfig, ConfigTemplate |
| Data | DataSource, SyncJob, RawData, NormalizedData, ComputedMetric |
| AI | Agent, Prompt, KnowledgeBase, KnowledgeDocument, DocumentChunk, AgentRun |
| Integration | Webhook |
| HOSMONY | HosmonyLevel, HosmonyJourney, JourneyProgression, HosmonyRequirement, OrgRequirement, ActionPlan, Action |
| Dynamics | Initiative, Participation |
| Evidence | Evidence |
| Audit | HosmonyAudit, AuditResult |
| Strategy | Strategy, StrategyPillar, StrategyObjective |
| Matérialité | MaterialityIssue, MaterialityAssessment |
| Stakeholders | Stakeholder |
| Opportunités | Opportunity, ValueTracker |
| Marketplace | HosmonicAsset |
| Système | DashboardConfig, AuditLog |

---

## Prochaine action

Quand le développement reprend, l'étape immédiate est :
1. **Type-checker** le module `config-engine` (vérifier compilation TypeScript)
2. **Monter** `configRoutes` dans `app.ts`
3. Continuer avec l'étape 4 (Data Pipeline)
