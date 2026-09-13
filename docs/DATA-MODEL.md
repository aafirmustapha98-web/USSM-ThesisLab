# USSM-ThesisLab — Modèle de données (v2)

> Statut : **spécification, non implémentée.**
> Conventions : `PK` clé primaire · `FK` clé étrangère · `⊘` immuable (écriture unique) · `⚙` configuration · `ƒ` dérivé (jamais stocké comme saisie)

---

## 0. Vue d'ensemble

```
        ⚙ MacroCategory ──< ⚙ Indicator ──< IndicatorObservation
                    │
                    └──< MacroReading ─────┐
                                           │
             MarketReading ────────────────┤
                                           │
   Sector ──< SectorReading ───────────────┤
     │                                     │
     └──< Ticker ──< CompanyFiling ────────┤
              │           │                │
              │           └─ ƒ Derived     │        ┌──────────────────┐
              ├──< CompanyReading ─────────┼───────>│ ⊘ DecisionSnapshot│
              ├──< ValuationReading ───────┤        └────────┬─────────┘
              ├──< ⊘ Thesis (versionnée)   │                 │
              │       ├──< Invalidator ──< InvalidatorCheck  │
              │       └──< ⊘ ChallengeRun ──< Objection      │
              ├──< TechnicalSetup                            │
              ├──< PriceObservation                          │
              └──< Position ──< PositionReview               │
                       │                                     │
                       └──< ⊘ JournalEntry <─────────────────┘

   ⚙ Rule ──< RuleFinding          Event          ⚙ Portfolio (singleton)
```

**Règle de portée** — la source de vérité d'un état global n'est jamais recopiée dans une fiche ticker. Seul le `DecisionSnapshot` en contient une copie, et il est immuable.

---

## 1. Configuration

### ⚙ `MacroCategory`

| Champ | Type | Note |
|---|---|---|
| `code` | PK, texte | `M01`…`M14` |
| `nom` | texte | |
| `gabarit` | enum | `quantitatif` \| `qualitatif` |
| `noyau` | booléen | `true` pour M01–M05 → obligatoires à la porte G3 |
| `peremption_jours` | entier | seuil d'avertissement de fraîcheur |
| `ordre` | entier | |

### ⚙ `Indicator`

| Champ | Type | Note |
|---|---|---|
| `code` | PK, texte | `CPI_YOY` |
| `category_code` | FK | |
| `nom`, `unite` | texte | `%`, `pts`, `USD`, `k` |
| `frequence` | enum | `quotidien` \| `hebdomadaire` \| `mensuel` \| `trimestriel` |
| `source` | enum | `trading_economics` \| `finviz` \| `manuel` |
| `obligatoire` | booléen | dans sa catégorie |

> L'app ne réclame un indicateur que si `date_reference` de sa dernière observation est antérieure à la période courante déduite de `frequence`.

### ⚙ `Rule` — voir [`RULES.md`](./RULES.md)

| Champ | Type | Note |
|---|---|---|
| `code` | PK | `C-07` |
| `portee` | enum | `company` \| `valuation` \| `macro` \| `market` \| `thesis` \| `timing` \| `portfolio` |
| `expression` | texte | condition évaluable sur les champs saisis et dérivés |
| `message` | texte | la question posée |
| `severite` | enum | `bloquant` \| `avertissement` |

### ⚙ `Portfolio` (singleton)

| Champ | Type | Note |
|---|---|---|
| `capital` | décimal | USD |
| `risque_max_par_trade_pct` | décimal | ex. 1,0 |
| `risque_ouvert_max_pct` | décimal | ex. 6,0 |
| `exposition_max_secteur_pct` | décimal | ex. 30,0 |

Dérivés `ƒ` : `risque_ouvert_actuel`, `exposition_totale`, `exposition_par_secteur`, `nb_positions_ouvertes`.

---

## 2. Macro & Marché (portée : globale, datée)

### `IndicatorObservation`

| Champ | Type | Note |
|---|---|---|
| `id` | PK | |
| `indicator_code` | FK | |
| `valeur` | décimal | |
| `date_reference` | date | période décrite (`2026-08`) |
| `date_observation` | date | publication par la source |
| `date_saisie` | horodatage | auto |
| `tendance` | enum | `hausse` \| `stable` \| `baisse` |
| `note` | texte | optionnel |

> Unicité : (`indicator_code`, `date_reference`). Une correction crée une nouvelle ligne, l'ancienne est conservée.

### `MacroReading` — mon interprétation d'une catégorie

| Champ | Type | Note |
|---|---|---|
| `id` | PK | |
| `category_code` | FK | |
| `date` | date | |
| `que_se_passe_t_il` | texte | **obligatoire** |
| `pourquoi` | texte | **obligatoire** |
| `impacts` | multi-enum | `fed` \| `taux` \| `dollar` \| `actions` \| `secteurs` |
| `incertitudes` | liste de textes | « ce que je ne sais pas » |
| `diagnostic` | enum | `favorable` \| `neutre` \| `defavorable` (aux actions) — **saisi par moi** |
| `confiance` | 1–10 | |

Pour les catégories `qualitatif`, les indicateurs sont remplacés par une liste de `themes[]` (titre + note), le reste est identique.

### `MarketReading`

| Champ | Type | Note |
|---|---|---|
| `id`, `date` | | |
| `indices` | objet | SP500, Nasdaq, NDX, Russell 2000, Dow, SP500 Equal Weight |
| `breadth` | objet | A/D, new highs/lows, % > 50 DMA, % > 200 DMA |
| `volatilite` | objet | VIX, structure par terme |
| `diagnostic` | enum | `bullish` \| `bearish` \| `neutre` \| `transition` |
| `justification` | texte | **obligatoire** |
| `confiance` | 1–10 | |

`MarketReading` possède ses propres `Invalidator` (mêmes champs qu'en § 5) : un diagnostic de marché doit être falsifiable comme une thèse.

---

## 3. Secteur (portée : groupe)

### `Sector`
`code` PK · `nom`

### `SectorReading`

| Champ | Type | Note |
|---|---|---|
| `id`, `sector_code` FK, `date` | | |
| `cycle` | enum | `expansion` \| `acceleration` \| `ralentissement` \| `contraction` |
| `demande` | enum | `forte` \| `normale` \| `faible` |
| `pricing_power` | enum | `fort` \| `moyen` \| `faible` |
| `capex` | enum | `hausse` \| `stable` \| `baisse` |
| `risques` | liste | chacun : `libelle`, `note` — **référençable par une thèse** |
| `catalyseurs` | liste | idem |
| `vent` | enum | `favorable` \| `neutre` \| `defavorable` — **saisi par moi** |
| `justification` | texte | **obligatoire** |
| `confiance` | 1–10 | |

---

## 4. Ticker, données financières, lectures

### `Ticker`

| Champ | Type | Note |
|---|---|---|
| `symbol` | PK | |
| `nom`, `sector_code` FK | | |
| `statut` | enum | `idee` \| `recherche` \| `watchlist` \| `position` \| `cloture` \| `ecarte` \| `archive` |
| `origine_idee` | enum | `screener` \| `actualite` \| `conversation` \| `these_macro` \| `intuition` \| `autre` — **obligatoire** |
| `origine_note` | texte | |
| `date_creation` | horodatage | |

### `CompanyFiling` — **la seule table de saisie financière**

| Bloc | Champs |
|---|---|
| Identité | `id` PK, `ticker` FK, `periode` (`2026-Q2`, `FY2025`), `date_publication`, `date_saisie`, `source` |
| Bruts | `revenue`, `eps`, `ebitda`, `ebit`, `net_income`, `fcf`, `cash`, `debt`, `equity`, `shares`, `market_cap` |
| Rentabilité | `gross_margin`, `operating_margin`, `net_margin`, `roa`, `roe`, `roic` |
| Solidité | `debt_to_equity`, `interest_coverage`, `current_ratio`, `quick_ratio` |
| Croissance | `sales_growth`, `eps_growth`, `ebitda_growth`, `fcf_growth` |
| Valorisation | `pe`, `forward_pe`, `peg`, `pb`, `ps`, `ev_ebitda`, `ev_ebit`, `ev_fcf`, `fcf_yield`, `dividend_yield` |

> Unicité : (`ticker`, `periode`). L'historique des périodes est conservé — c'est ce qui permet les variations et les contrôles.

### ƒ `DerivedMetrics` — calculé à la volée, **jamais stocké comme saisie**

```
net_debt              = debt − cash
net_debt_to_ebitda    = net_debt ÷ ebitda
fcf_yield_calc        = fcf ÷ market_cap
croissance(x)         = (x[t] − x[t−1]) ÷ |x[t−1]|
delta_marge(m)        = m[t] − m[t−1]
ev                    = market_cap + net_debt
earnings_quality      = fcf ÷ net_income
ecart_vs_pair(m)      = m[ticker] − médiane(m[pairs])
```

> `fcf_yield` peut être à la fois saisi (Finviz) et calculé. Divergence > 10 % → contrôle `C-12`.

### `CompanyReading`

`id`, `ticker` FK, `filing_id` FK, `date`
`interpretation_rentabilite`, `interpretation_solidite`, `interpretation_croissance` (les trois **obligatoires** — porte G2)
`diagnostic_qualite`, `diagnostic_croissance`, `diagnostic_solidite` : enum `vert` \| `jaune` \| `rouge` — **saisis par moi**, chacun avec sa justification
`confiance` 1–10

### `ValuationReading` — **zéro champ de saisie de données**

`id`, `ticker` FK, `filing_id` FK, `date`
`diagnostic` : enum `attractive` \| `raisonnable` \| `chere` \| `tres_chere` — **saisi par moi**
`justification` (**obligatoire**), `confiance` 1–10
`pairs` : liste de symbols comparés
`conclusion` : enum `analyser_plus` \| `watchlist` \| `ecarter` + `conclusion_motif` — **saisie par moi, jamais proposée par l'app**

---

## 5. Thèse, invalidateurs, challenge

### ⊘ `Thesis` — immuable et versionnée

| Champ | Type | Note |
|---|---|---|
| `id` | PK | |
| `ticker` | FK | |
| `version` | entier | 1, 2, 3… |
| `version_parente` | FK | null pour v1 |
| `motif_revision` | texte | **obligatoire si version > 1** |
| `objection_declencheuse` | FK `Objection` | renseignée si la révision vient d'une objection acceptée |
| `date` | horodatage | |
| `statut` | enum | `brouillon` \| `active` \| `revisee` \| `invalidee` \| `cloturee` |
| `direction` | enum | `long` \| `pas_d_interet` \| `a_eviter` |
| `raisons` | liste | ≥ 1 |
| `catalyseurs` | liste | ≥ 1 |
| `risques` | liste | ≥ 1 ; chaque item : `libelle` + `source` (`propre` \| `secteur`) + `ref_risque_secteur` |
| `bear_case` | texte | **obligatoire avant challenge** (pre-mortem) |
| `incertitudes` | liste | « ce que je ne sais pas » |
| `confiance_initiale` | 1–10 | **obligatoire** |
| `confiance_post_challenge` | 1–10 | saisie après traitement des objections — porte G5 |

> Une thèse `active` n'est jamais modifiée en place : toute édition produit une nouvelle version et bascule la précédente en `revisee`.

### `Invalidator`

| Champ | Type | Exemple |
|---|---|---|
| `id` PK, `thesis_id` FK (ou `market_reading_id`) | | |
| `libelle` | texte | « Érosion des marges » |
| `metrique` | texte | `gross_margin` |
| `operateur` | enum | `<` `>` `<=` `>=` `=` `croise_sous` `croise_sur` |
| `seuil` | décimal | `70` |
| `unite` | texte | `%` |
| `persistance` | texte | `2 trimestres consécutifs` |
| `horizon` | date | `2027-06-30`, nullable |
| `source` | enum | `finviz` \| `trading_economics` \| `prix` \| `observation` |
| `statut` | enum | `non_survenu` \| `survenu` \| `indetermine` |
| `date_statut` | horodatage | |

### `InvalidatorCheck` — la revue périodique

`id`, `invalidator_id` FK, `date`, `reponse` : enum `oui` \| `non` \| **`je_ne_sais_pas`**, `note`

> Le `je_ne_sais_pas` est conservé et compté : c'est un trou de surveillance, pas une non-réponse.

### ⊘ `ChallengeRun`

`id`, `thesis_id` FK, `date`, `mode` (`coach` \| `analyst`), `modele`, `prompt_version`, `sortie_brute`

### `Objection`

| Champ | Type | Note |
|---|---|---|
| `id` PK, `challenge_run_id` FK | | |
| `categorie` | enum | `hypothese_faible` \| `donnee_manquante` \| `contradiction` \| `biais` \| `scenario_contraire` \| `angle_mort_bear_case` |
| `texte` | texte | |
| `severite` | enum | `critique` \| `majeure` \| `mineure` |
| `statut` | enum | `ouverte` \| `acceptee` \| `refutee` |
| `reponse_utilisateur` | texte | **obligatoire si `refutee`** |
| `these_resultante` | FK `Thesis` | renseignée si `acceptee` |
| `date_traitement` | horodatage | |

> Contrainte de porte G5 : aucune objection `critique` au statut `ouverte`, et `statut ≠ ouverte` pour toutes.

---

## 6. Contrôles déterministes

### `RuleFinding`

`id`, `rule_code` FK, `portee`, `cible_id` (ticker, filing, thèse…), `date_detection`
`statut` : `ouvert` \| `repondu` \| `obsolete`
`reponse_utilisateur` : texte — **obligatoire pour passer à `repondu`**

> Une règle `bloquant` non répondue empêche la porte associée. Une règle devient `obsolete` si la condition cesse d'être vraie après une nouvelle saisie.

---

## 7. Timing, prix, positions

### `TechnicalSetup`

`id`, `ticker` FK, `date`, `tendance` (`hausse` \| `baisse` \| `laterale`), `support`, `resistance`, `entry`, `stop`, `target`, `horizon_jours`, `notes`

Dérivés ƒ : `risque_par_action = entry − stop` · `gain_par_action = target − entry` · `rr = gain ÷ risque` · `stop_pct = (entry − stop) ÷ entry`

### `PriceObservation` — entité autonome (décision 6)

`id`, `ticker` FK, `prix`, `horodatage`, `source` : enum `manuelle` \| `api`

> Séparer le prix des positions permet de brancher une source de cotation automatique plus tard sans modifier `Position`. Tout affichage de P/L indique l'âge du prix utilisé.

### `Position`

| Champ | Type | Note |
|---|---|---|
| `id` PK, `ticker` FK | | |
| `thesis_id` | FK | **version précise** de la thèse à l'entrée |
| `snapshot_id` | FK ⊘ | gel obligatoire — porte G6 |
| `setup_id` | FK | |
| `date_entree`, `prix_entree`, `shares`, `stop_initial`, `target_initial` | | |
| `stop_actuel` | décimal | historisé dans `PositionReview` |
| `statut` | enum | `ouverte` \| `cloturee` |
| `date_sortie`, `prix_sortie`, `frais` | | |
| `motif_sortie` | enum | `invalidateur` \| `stop` \| `cible` \| `discretionnaire` \| `event` |

Dérivés ƒ : `risque_initial = (prix_entree − stop_initial) × shares` · `valeur_position` · `pl_absolu` · `pl_pct` · `r_courant = (prix_courant − prix_entree) ÷ (prix_entree − stop_initial)` · `pct_capital`

### `PositionReview`

`id`, `position_id` FK, `date`
`checks` : liste de `InvalidatorCheck` — **remplie d'abord**
`statut_these` : enum `intacte` \| `renforcee` \| `affaiblie` \| `invalidee` — **saisi après les checks**
`confiance_actuelle` 1–10, `note`, `stop_modifie` + `motif_modification_stop`

---

## 8. Événements

### `Event`

`id`, `date`, `type` : enum `earnings` \| `cpi` \| `ppi` \| `nfp` \| `fomc` \| `powell` \| `decision_fed` \| `autre`
`portee` : enum `marche` \| `secteur` \| `ticker` · `cible` (code secteur ou symbol) · `note`

> Entité unique, consommée par le Dashboard (calendrier), le Timing (event risk) et les Positions (alerte d'événement avant l'horizon).

---

## 9. Gel et journal

### ⊘ `DecisionSnapshot` — **immuable, jamais supprimé**

| Champ | Contenu |
|---|---|
| `id`, `ticker`, `date`, `declencheur` | `entree_position` \| `mise_watchlist` \| `rejet` |
| `macro` | copie des `MacroReading` des 5 catégories du noyau + leurs observations |
| `marche` | copie de la `MarketReading` en vigueur |
| `secteur` | copie de la `SectorReading` en vigueur |
| `financier` | copie du `CompanyFiling` + tous les dérivés calculés à cet instant |
| `lectures` | `CompanyReading` + `ValuationReading` |
| `these` | `Thesis` vN intégrale + invalidateurs |
| `challenge` | `ChallengeRun` + toutes les objections **avec leur statut à cet instant** |
| `setup` | `TechnicalSetup` |
| `portefeuille` | capital, risque ouvert, exposition sectorielle à cet instant |
| `ages` | âge de chaque bloc en jours au moment du gel |

> Un snapshot est du JSON dénormalisé. Aucune clé étrangère vivante : il doit rester lisible même si les entités sources sont modifiées ou supprimées.

### ⊘ `JournalEntry`

`id`, `snapshot_id` FK ⊘, `position_id` FK (nullable — une décision de rejet n'a pas de position)
`date_cloture`, `resultat_pct`, `resultat_r`
`ce_que_j_attendais`, `ce_qui_s_est_produit`
`jugement` : enum `correcte` \| `partiellement_correcte` \| `incorrecte`
`erreur_principale`, `apprentissage` (**obligatoires** — porte G7)

### ƒ Statistiques de calibration

Toutes dérivées de `JournalEntry` + `DecisionSnapshot` + `Thesis` + `Objection`. Aucune saisie supplémentaire. Détail : [`ARCHITECTURE.md § 9`](./ARCHITECTURE.md).

---

## 10. Invariants à faire respecter par le stockage

1. `Thesis`, `ChallengeRun`, `DecisionSnapshot`, `JournalEntry` : **INSERT uniquement**. Aucun UPDATE, aucun DELETE.
2. Toute donnée financière porte une `periode`, jamais seulement une date de saisie.
3. Toute donnée saisie porte `date_reference`, `date_observation`, `date_saisie`.
4. Aucun champ dérivé n'est persisté comme saisie (sauf duplication assumée dans un snapshot).
5. Un `diagnostic` ou un `feu` n'est jamais écrit par le système — uniquement par l'utilisateur.
6. Une `Position` référence une **version** de thèse, jamais « la thèse » en général.
7. Un `Ticker` ne quitte l'état `recherche` ou `position` qu'en produisant un `DecisionSnapshot`.
8. Export JSON complet possible à tout moment, sans perte.
