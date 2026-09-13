# USSM-ThesisLab — US Equity OS

**Build. Challenge. Learn.**

Système personnel d'analyse des actions américaines. Les données macro (Trading Economics) et
financières (Finviz) sont collectées **à la main**. L'application structure l'analyse, force
l'interprétation, contrôle les trous de raisonnement et challenge la thèse — **elle ne décide jamais**.

> *Don't automate my thinking. Structure it, challenge it and help me learn from it.*

```
DATA → MY ANALYSIS → MY THESIS → AI CHALLENGE → DECISION → FOLLOW-UP → LEARNING
```

## Démarrer

```bash
npm install
npm run db:migrate     # crée data/ussm.db
npm run dev            # http://localhost:3000
```

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et exécution en production |
| `npm run db:generate` | régénère les migrations après modification du schéma |
| `npm run db:migrate` | applique les migrations |
| `npm run smoke` | déroule le workflow complet sur une base jetable et affiche l'état des portes |

La base est un fichier unique — `data/ussm.db`. La sauvegarde, c'est le copier.
Un export JSON complet est disponible dans **Réglages**.

## Les 8 pages

| Page | Rôle |
|---|---|
| **Dashboard** | Régime de marché d'après **mes** diagnostics, événements, dossiers en cours, portefeuille |
| **Macro & Market** | 14 catégories macro (5 obligatoires) + le bloc Marché. Données puis interprétation |
| **Research** | Le fil guidé et l'état des 10 étapes de chaque dossier |
| **Company Analysis** | Seule page de saisie financière + calculs tracés + mes interprétations |
| **Valuation** | Zéro saisie — multiples, croissance, comparaison, mon diagnostic |
| **Thesis & AI Challenge** | Thèse versionnée, invalidateurs structurés, boucle d'objections, Timing |
| **Positions** | Suivi, revue par invalidateur, changement d'horizon tracé, clôture |
| **Journal & Learning** | Instantanés gelés, calibration de la confiance, erreurs récurrentes |

## Ce que l'application ne fait jamais

- Récupérer automatiquement les données de Trading Economics ou Finviz
- Choisir une action, générer une thèse, produire un BUY/SELL ou un score « 87/100 »
- Calculer un feu tricolore ou un diagnostic à ma place
- Écrire dans un champ d'interprétation (`AI-7`)
- Inventer une donnée manquante — elle affiche `Insufficient data` et dit ce qui manque

## Conception

| Document | Contenu |
|---|---|
| [`docs/V1-SCOPE.md`](docs/V1-SCOPE.md) | Périmètre V1, réconciliation spec / architecture, pile technique |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Architecture fonctionnelle : principes, décisions, modules, portes, niveaux d'IA |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | Entités, champs, relations, dérivés, invariants |
| [`docs/RULES.md`](docs/RULES.md) | Contrôles déterministes, formalisation des portes, garde-fous IA |
| [`docs/MACRO-CATALOG.md`](docs/MACRO-CATALOG.md) | Les 14 catégories macro, indicateurs et fréquences |

## Configuration, pas code

Les indicateurs, les blocs de saisie et les règles de contrôle sont des données :

- `src/config/macro-catalog.ts` — catégories, indicateurs, fréquences
- `src/config/company-blocks.ts` — blocs de saisie, énumérations, taxonomies
- `src/config/rules.ts` — les 34 contrôles déterministes

Ajouter un indicateur ou une règle n'exige jamais de toucher un composant.

## Pile

Next.js 15 (App Router, Server Actions) · TypeScript · SQLite + Drizzle · Tailwind CSS v4.
Aucune dépendance réseau, aucun appel de modèle en V1.

## État

V1 fonctionnelle : le workflow complet Macro → … → Journal est opérationnel et vérifié par `npm run smoke`.
L'IA Coach / Tutor / Analyst n'est pas branchée — la mécanique de challenge est en place et
utilisable manuellement, le schéma ne changera pas lors du branchement.
