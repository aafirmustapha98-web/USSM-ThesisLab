# USSM-ThesisLab — Périmètre V1 et réconciliation spec / architecture v2

> La spécification « US Equity Investment Operating System » a été rédigée **avant** la revue d'architecture.
> Ce document arbitre les points où les deux se contredisent. Les six décisions de la v2 restent en vigueur.

---

## 1. Points de conflit et arbitrages

### 1.1 « 18 catégories macro » vs 14

**Conflit apparent, pas réel.** La spec demande une page *Macro & Market* contenant 18 catégories, dont `09 Marché actions` et `10 VIX`. La v2 a sorti ces deux-là du catalogue macro — mais pour les placer dans le **bloc Marché de la même page**. Rien n'est perdu : tous les indicateurs listés dans la spec (indices, A/D, new highs/lows, % > 50/200 DMA, VIX, term structure, VIX futures, VVIX) sont présents, sous `Macro & Market → Market`.

Restent deux fusions réelles :

| Spec | V1 | Traitement |
|---|---|---|
| `05 Obligations` + `06 Courbe des taux` | `M03 Rates & Curve` | Les deux questions de la spec sont conservées dans la fiche fusionnée |
| `07 Crédit` + `08 Liquidité` | `M05 Liquidity & Credit` | Idem. La spec elle-même place `Financial Conditions` dans les deux |

Résultat : **14 catégories macro + 1 bloc Marché**, tous les indicateurs de la spec conservés.
Le catalogue est de la configuration (`src/config/macro-catalog.ts`) : rescinder une fusion ne demande que d'éditer ce fichier.

### 1.2 Pourcentages de progression vs portes

La spec affiche `NVDA — 72%` et `Challenge 30%`, tout en avertissant (§26) que *Progress ≠ Investment Score*. La décision 2 a supprimé le pourcentage pour éviter la pulsion de complétion.

**Arbitrage : on garde la visibilité, on retire le chiffre gamifiable.**

- Le Research Board affiche les **9 étapes** du workflow avec leur état : `terminée` / `en cours` / `verrouillée`.
- Le repère chiffré est `étape 5 sur 9` — un rang, pas un score.
- Ce qui **bloque** est la porte, et une porte fermée nomme ce qui manque plutôt que d'afficher un pourcentage.

### 1.3 « Research » : page ou workflow ?

La v2 en avait fait un simple fil guidé et introduit une page `Secteurs`. La spec liste explicitement `Research` comme page 3 sur 8, et rattache l'analyse sectorielle à l'entreprise (§10).

**La spec l'emporte** : `Research` est une page — le tableau de bord du workflow, d'où l'on choisit un ticker et où l'on voit l'état de ses 9 étapes. L'analyse sectorielle vit dans la fiche ticker. La navigation compte exactement les 8 entrées de la spec.

### 1.4 Position sizing

La spec (§19) : *« Ne jamais imposer arbitrairement un risque de 1 %. Je définirai moi-même mon niveau de risque. »* La décision 3 introduisait des plafonds bloquants.

**Arbitrage : l'application n'impose aucune valeur, elle fait respecter celles que j'ai déclarées.** Les plafonds de `Settings` sont **vides par défaut** — aucun contrôle de portefeuille ne se déclenche tant que je n'ai rien déclaré. Le sizing part de `Maximum acceptable loss`, saisi par moi, exactement comme la spec le demande.

### 1.5 IA

La spec (§30) demande d'intégrer l'IA **après** que la structure de données et l'interface fonctionnent.

**V1 ne fait aucun appel de modèle.** Mais toute la mécanique est en place et utilisable : `ChallengeRun`, objections typées selon les 10 axes de la spec (§16), boucle de résolution `ouverte / acceptée / réfutée`, et **saisie manuelle des objections** — je peux jouer l'avocat du diable moi-même et le workflow complet reste testable. Le branchement du modèle ne changera pas le schéma.

---

## 2. Ce que la spec ajoute à la v2

| Apport | Traitement |
|---|---|
| **Horizon Swing / Long Term** (§3) | Nouveau. Moteur d'analyse unique ; l'horizon est un champ explicite de la thèse et de la position. **Un changement d'horizon est une action tracée, motif obligatoire, inscrite au Journal.** Une position swing perdante ne peut pas devenir « long terme » sans laisser de trace. |
| **Décision à 6 valeurs** (§21) | `Buy` / `Watchlist` / `Wait` / `Avoid` / `Sell` / `Hold`, justification obligatoire. Remplace l'énumération à 3 valeurs de la v2. |
| **URL source par indicateur** (§8, §29) | Champ `sourceUrl` sur chaque observation + liens Trading Economics / Finviz sur chaque écran de saisie. |
| **« Insufficient data »** (§12) | Un dérivé dont une entrée manque affiche `Insufficient data` et la liste des champs manquants. Jamais de valeur inventée, jamais de zéro par défaut. |
| **Traçabilité des calculs** (§12) | Chaque dérivé affiche sa formule et les valeurs utilisées. |
| **Géopolitique structurée** (§7) | Événement + date + pays + durée + probabilité + impact, puis canaux de transmission (pétrole, inflation, supply chain, commerce, dollar, taux, croissance, secteurs). |
| **Technology / AI** (§7) | Chaîne `CapEx → Revenue → FCF → ROI` comme question centrale de la catégorie. |
| **Sector + Industry** (§11) | Deux niveaux distincts, la v2 n'avait que Sector. |
| **CFO et CFO / Net Income** (§11, §12) | Ajoutés aux données entreprise et aux dérivés. |
| **Erreurs récurrentes** (§25) | Taxonomie d'erreurs sur les entrées de journal, agrégée dans Learning. |
| **Bull case** (§15) | La v2 n'avait que le bear case ; la spec demande les deux. Les deux sont obligatoires avant le challenge. |

---

## 3. Ce qui est maintenu de la v2

- Gel immuable de la décision (`DecisionSnapshot`) — le Journal ne lit jamais les fiches vivantes.
- Thèse versionnée, motif de révision obligatoire.
- Invalidateurs structurés + revue avec `je ne sais pas`.
- Boucle de résolution des objections.
- Triple datation (référence / observation / saisie).
- Feux = report de mes diagnostics ; l'application ne conclut jamais.
- Origine de l'idée, cycle de vie du ticker.
- Fréquence par indicateur (l'app ne réclame que l'échu).
- Garde-fous IA `AI-1` à `AI-7`.

---

## 4. Pile technique

| Couche | Choix | Raison |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | Un seul processus, rendu serveur, Server Actions pour les mutations — pas d'API REST à écrire à la main |
| Base | **Postgres** (`postgres-js`) + **Drizzle ORM** | Hébergée (Neon) : sauvegardes automatiques, accessible depuis le téléphone et l'ordinateur. Un fichier SQLite ne survit pas à un hébergement serverless. En local, PGlite fournit un Postgres jetable sans installation. |
| Style | **Tailwind CSS v4**, composants maison | Interface sobre orientée finance ; aucune librairie UI imposant son style |
| Graphiques | **aucun en V1** | La spec demande explicitement peu de graphiques |
| IA | adaptateur `src/lib/ai/` non branché | Intégration après validation de la structure (§30) |

Principes d'implémentation :

1. **Catalogues en configuration** (`src/config/`) — ajouter un indicateur ou une règle n'exige jamais de toucher un composant.
2. **Formulaires générés** depuis les catalogues.
3. **Aucun dérivé persisté** — tout est recalculé, sauf à l'intérieur d'un snapshot gelé.
4. **Local-first** — aucune dépendance réseau.
5. **Export JSON complet** dès la V1.
