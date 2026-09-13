# USSM-ThesisLab — Architecture fonctionnelle (v2)

> Version corrigée après revue de l'architecture v1.
> Statut : **spécification validée, non implémentée.**
> Documents liés : [`DATA-MODEL.md`](./DATA-MODEL.md) · [`RULES.md`](./RULES.md) · [`MACRO-CATALOG.md`](./MACRO-CATALOG.md)

---

## 0. Règle fondamentale

> **L'IA ne remplace jamais le raisonnement. Elle en augmente la qualité.**

Séquence non négociable, valable dans chaque module :

```
je saisis  →  j'interprète  →  l'app calcule  →  l'app contrôle  →  l'IA challenge
           →  je tranche    →  l'app gèle     →  je reviens vérifier si j'avais raison
```

Trois corollaires qui contraignent toute l'implémentation :

1. **L'app ne conclut jamais.** Elle calcule, contrôle, questionne, affiche des tensions. Elle ne produit ni score d'achat, ni note globale, ni recommandation, ni prix cible.
2. **Une donnée ne se saisit qu'une seule fois.** Tout ce qui peut être dérivé est dérivé, jamais stocké comme saisie.
3. **Ce qui a servi à décider est gelé.** Aucune décision passée ne peut être relue à la lumière de données actualisées.

---

## 1. Les 6 décisions actées

| # | Décision | Choix retenu |
|---|---|---|
| 1 | Feux tricolores | **Report de mes propres diagnostics uniquement.** Aucun feu calculé automatiquement. L'app n'écrit jamais la ligne de conclusion. |
| 2 | Suivi d'avancement | **Suppression du pourcentage.** Remplacé par des portes bloquantes + le suivi de calibration de la confiance. |
| 3 | Portefeuille | **Minimum vital dans le périmètre** : capital, risque max par trade, exposition ouverte, concentration sectorielle. |
| 4 | Catégories macro | **Noyau de 5 obligatoires + 9 optionnelles.** 18 → 14 catégories après fusion et suppression des doublons. |
| 5 | Invalidateurs | **Structurés et falsifiables** : métrique + opérateur + seuil + persistance + horizon + source. |
| 6 | Prix | **Saisie manuelle horodatée**, via une entité `PriceObservation` autonome permettant de brancher une source automatique plus tard. |

---

## 2. Corrections structurelles appliquées

### 2.1 Gel des décisions (`DecisionSnapshot`)

Le Journal ne lit **jamais** les fiches vivantes. À chaque décision engageante (entrée en position, mise en watchlist, rejet d'une idée), l'app fige une copie immuable de tout ce qui a servi à décider : lectures macro du noyau, lecture marché, lecture secteur, jeu de données financières + dérivés, lecture de valorisation, thèse vN intégrale, invalidateurs, objections IA avec leur statut, setup technique, état du portefeuille.

Un snapshot n'est **jamais** modifiable ni supprimable. C'est la seule source du Journal.

### 2.2 Boucle de résolution du challenge

Chaque objection produite par l'IA devient un objet avec un statut que je dois trancher :

| Statut | Effet |
|---|---|
| `acceptée` | Je modifie ma thèse → création automatique d'une version v+1 avec motif |
| `réfutée` | Je dois écrire pourquoi (champ obligatoire, non vide) |
| `ouverte` | Elle reste visible sur la fiche, sur la thèse **et sur la position** |

Une objection de sévérité `critique` laissée `ouverte` **bloque** l'accès au module Timing (porte G5).

### 2.3 Macro et Marché sortis du pipeline ticker

Le pipeline vertical est une **discipline de lecture**, pas une structure de données. Les portées réelles :

| Portée | Modules | Cardinalité |
|---|---|---|
| **Global daté** | Macro, Marché | Un seul état du monde à la date T, partagé par toutes les analyses |
| **Groupe** | Secteur | Un état par secteur, partagé par tous ses tickers |
| **Ticker** | Entreprise, Valorisation, Thèse, Timing, Position | Un par ticker |

Une fiche ticker **référence** l'état macro/marché en vigueur, elle ne le duplique pas. L'app n'oblige jamais à ressaisir la macro pour un nouveau titre ; elle signale son âge.

### 2.4 Invalidateurs structurés et reliés au suivi

Fini le texte libre. Un invalidateur est une condition observable :

```
Marge brute  <  70 %   pendant 2 trimestres consécutifs   avant le 30/06/2027   (source : Finviz)
Core CPI     >  3,5 %  pendant 3 mois consécutifs         sans horizon          (source : Trading Economics)
```

À chaque revue de position, l'app affiche mes invalidateurs **un par un** et exige une réponse :
`Oui, survenu` / `Non` / **`Je ne sais pas`**.

Le « je ne sais pas » est une réponse valide et suivie : c'est un trou de surveillance, et le délai entre *invalidateur survenu* et *sortie effective* devient une métrique d'apprentissage (§ 8).

### 2.5 Doublons supprimés

| Doublon v1 | Résolution v2 |
|---|---|
| Macro `09 Marché actions` + `10 VIX` ⟷ module Marché | Supprimés du catalogue macro. Le module Marché est la source unique. |
| Macro `05 Obligations` + `06 Courbe des taux` | Fusionnés en `M03 Taux & Courbe`. |
| Macro `07 Crédit` + `08 Liquidité` | Fusionnés en `M05 Liquidité & Crédit`. |
| Ratios de valorisation en double (Entreprise § E + page Valorisation) | **Entreprise = saisie** (tout Finviz, ratios inclus). **Valorisation = interprétation et comparaison, zéro champ de saisie.** |
| Risques/catalyseurs secteur ⟷ thèse | La thèse **importe par référence** les risques du secteur ; je n'ajoute que le spécifique entreprise. |
| Calendrier Dashboard ⟷ Event Risk ⟷ date d'earnings | Une seule entité `Event` (date, type, portée) alimentant les trois écrans. |
| Page « Macro & Market » ⟷ page « Research » | **Research n'est pas une page** : c'est un fil guidé (barre de workflow) qui traverse les pages. Voir § 4. |

### 2.6 Trois dates, pas une

Toute donnée saisie porte :

- **date de référence** — la période que la donnée décrit (`Q2 2026`, `août 2026`)
- **date d'observation** — publication par la source (CPI publié le 11/09)
- **date de saisie** — le moment où je l'ai entrée (13/09)

C'est ce qui permet de dire « ta fiche NVDA repose sur le Q1 alors que le Q2 est publié », et c'est indispensable au gel (§ 2.1).

---

## 3. Navigation (8 pages + réglages)

```
┌──────────────────────────────────────────┐
│              US EQUITY OS                │
├──────────────────────────────────────────┤
│  🏠  Dashboard                           │
│  🌎  Macro & Marché        ← global daté │
│  🏭  Secteurs              ← par groupe  │
│  🏢  Entreprise            ← par ticker  │
│  💰  Valorisation          ← par ticker  │
│  🧠  Thèse & Challenge     ← par ticker  │
│  ⏱️  Timing & Positions    ← par ticker  │
│  📔  Journal & Apprentissage             │
├──────────────────────────────────────────┤
│  ⚙️  Réglages  (hors workflow)           │
└──────────────────────────────────────────┘
```

**Changements par rapport à la v1 :** `Research` disparaît de la navigation (devenu un workflow), `Secteurs` devient une page à part entière (portée distincte), et `Timing` — absent de la nav v1 alors qu'il était un module — rejoint `Positions`.

`⚙️ Réglages` contient le portefeuille, le catalogue d'indicateurs, le catalogue de règles et l'export. Ce n'est pas une étape d'analyse.

---

## 4. Le workflow « Research » (barre de progression remplacée)

Sur toute page ticker, une barre horizontale montre l'état des **portes**, pas un pourcentage :

```
Secteur ✓  →  Entreprise ✓  →  Valorisation ✓  →  Thèse ✓  →  Challenge ⚠  →  Timing 🔒  →  Position 🔒

🔒 Timing verrouillé — il te reste :
   • 2 objections non tranchées (dont 1 critique)
   • confiance post-challenge non saisie
⚠ Macro noyau : Liquidité & Crédit date de 41 jours
```

**Portes bloquantes vs avertissements de fraîcheur.** Une porte se franchit ou non (binaire, pas de contournement). Un avertissement de fraîcheur s'affiche et doit être *acquitté*, jamais bloquant : une donnée macro peut légitimement n'avoir pas bougé.

### Les 7 portes

| Porte | Ouvre | Conditions |
|---|---|---|
| **G1** | Entreprise | Ticker rattaché à un secteur + `SectorReading` existante |
| **G2** | Valorisation | `CompanyReading` : interprétation écrite pour rentabilité, solidité **et** croissance |
| **G3** | Thèse | Les 5 catégories macro du noyau ont une lecture + `MarketReading` + `SectorReading` + `CompanyReading` + `ValuationReading` |
| **G4** | Bouton Challenge | Thèse : ≥1 raison, ≥1 catalyseur, ≥1 risque, **bear case (pre-mortem) écrit**, ≥1 invalidateur structuré, confiance initiale saisie |
| **G5** | Timing | Zéro objection `critique` au statut `ouverte`, toutes les objections tranchées, confiance post-challenge saisie |
| **G6** | Ouverture de position | Setup technique complet, R/R calculé, sizing conforme au portefeuille, event risk revu, snapshot gelé |
| **G7** | Archivage | `JournalEntry` remplie |

Définition formelle : [`RULES.md § 2`](./RULES.md).

---

## 5. Les modules

### 5.1 🏠 Dashboard

Répond à 5 questions, rien de plus. **Tous les feux sont le report de mes propres diagnostics**, avec leur âge. Un état non renseigné s'affiche en gris — jamais en vert par défaut.

```
RÉGIME — d'après mes lectures

Macro (noyau)      🟡  Neutre / incertain      12 j
Marché             🟢  Haussier                 3 j
Liquidité & Crédit 🔴  Défavorable             41 j  ⚠ ancien
VIX                🟡                           3 j
Dollar             ⚪  non renseigné             —
────────────────────────────────────────────────
ÉVÉNEMENTS         CPI 17 sept · FOMC 23 sept · NFP 2 oct
────────────────────────────────────────────────
EN COURS           NVDA  🔒 Timing verrouillé (2 objections ouvertes)
                   AMD   → Valorisation
                   MSFT  → Thèse
────────────────────────────────────────────────
PORTEFEUILLE       Risque ouvert 2,4 % / 6 % max
                   Semis 68 % ⚠ concentration
────────────────────────────────────────────────
WATCHLIST          AMZN · META · AVGO
```

### 5.2 🌎 Macro & Marché

**Macro — 14 catégories, 5 obligatoires.** Catalogue complet : [`MACRO-CATALOG.md`](./MACRO-CATALOG.md).

Chaque indicateur porte une **fréquence** (quotidien / mensuel / trimestriel). L'app ne réclame que ce qui a réellement changé depuis ma dernière saisie — c'est ce qui divise la charge de saisie par 4 à 5.

Deux gabarits de fiche :

- **Quantitatif** (11 catégories) : tableau d'indicateurs + interprétation
- **Qualitatif** (3 catégories : Gouvernement, Géopolitique, Technologie & IA) : thèmes + interprétation, sans colonne de valeur

Structure d'interprétation, identique partout :

```
MON INTERPRÉTATION
  Que se passe-t-il ?            [obligatoire]
  Pourquoi ?                     [obligatoire]
  Impact sur : ☐ Fed ☐ Taux ☐ Dollar ☐ Actions ☐ Secteurs
  Ce que je ne sais pas          [liste d'incertitudes]
  Mon diagnostic : 🟢 favorable / 🟡 neutre / 🔴 défavorable (aux actions)
  Confiance : 1 ──────── 10
```

**L'IA n'intervient qu'après** que les deux champs obligatoires sont remplis.

**Marché** — source unique pour indices, breadth et volatilité (les catégories macro `09` et `10` de la v1 sont supprimées). Diagnostic obligatoire (`bullish` / `bearish` / `neutre` / `transition`) + justification + **invalidateurs structurés** du diagnostic, au même format qu'une thèse.

### 5.3 🏭 Secteurs

Fiche par secteur, partagée par tous ses tickers : cycle, demande, pricing power, capex, risques, catalyseurs, et la conclusion — **écrite par moi** — « vent favorable / neutre / défavorable pour une entreprise du secteur ».

### 5.4 🏢 Entreprise

**Seule page de saisie des données financières.** Les données sont rattachées à une **période fiscale** (`Q2 2026`), pas à une date de saisie.

- **Saisi** : bruts (CA, BPA, EBITDA, EBIT, résultat net, FCF, trésorerie, dette, capitaux propres, actions, capitalisation), rentabilité, solidité, croissance, et les ratios de valorisation lus sur Finviz.
- **Jamais saisi, toujours calculé** : dette nette, dette nette/EBITDA, FCF yield, variations de marge période à période, taux de croissance, écarts vs période précédente.

Les **contrôles de cohérence** se déclenchent à la saisie (§ 7).

Diagnostics à cocher par moi : Qualité 🟢🟡🔴 · Croissance · Solidité — chacun avec une justification écrite.

### 5.5 💰 Valorisation

**Aucune saisie.** Affiche les ratios déjà entrés, les dérivés, et le tableau comparatif (pairs + secteur).

Mon diagnostic : attractive / raisonnable / chère / très chère + pourquoi.

L'app affiche la **tension**, jamais la conclusion :

```
D'après TES diagnostics :

  Qualité        🟢     Secteur     🟢
  Croissance     🟢     Marché      🟢
  Solidité       🟢     Macro       🟡
  Valorisation   🟡

  Tension : qualité élevée + valorisation exigeante.

  → Ta conclusion ?  ☐ Analyser plus  ☐ Watchlist  ☐ Écarter
     Pourquoi ? [________________________]
```

La ligne `→ WATCHLIST` de la v1 est supprimée : c'était une recommandation produite par l'app.

### 5.6 🧠 Thèse & Challenge

**La thèse est versionnée et immuable.** Toute modification crée une v+1 avec date et **motif du changement**. Le Journal montre le fil des versions — c'est ce qui rend visible la thèse qui mute pour justifier une position perdante.

Structure :

| Champ | Note |
|---|---|
| Direction | `long` / `pas d'intérêt` / `à éviter` — le formulaire ne présuppose plus l'achat |
| Raisons | ≥ 1 |
| Catalyseurs | ≥ 1 |
| Risques | ≥ 1, dont import par référence des risques secteur |
| **Bear case (pre-mortem)** | **Obligatoire, écrit par moi, avant le challenge.** « Dans 6 mois le titre a perdu 30 %. Que s'est-il passé ? » |
| Ce que je ne sais pas | Incertitudes assumées |
| Invalidateurs | ≥ 1, structuré (§ 2.4) |
| Confiance initiale | 1–10 |
| Confiance post-challenge | 1–10, saisie après traitement des objections |

**🥊 Challenge ma thèse** — porte G4. L'IA cherche à détruire le raisonnement : hypothèses faibles, données manquantes, contradictions, biais, scénario contraire. Chaque sortie devient une objection tranchée (§ 2.2). Une valeur ajoutée nouvelle : *qu'as-tu manqué dans ton propre bear case ?*

### 5.7 ⏱️ Timing & Positions

Le swing trading n'apparaît qu'ici, porte G5 franchie.

**Setup** : tendance, support, résistance, entrée, stop, cible. **Calculé** : risque/action, gain/action, R/R.

**Sizing, contraint par le portefeuille** :

```
Position Size = (Capital × Risque max par trade %) ÷ (Entrée − Stop)
```

L'app vérifie ensuite, au niveau **portefeuille** et non de la seule ligne :

- risque de la position ≤ risque max par trade → **bloquant**
- risque ouvert total ≤ plafond → **bloquant**
- exposition sectorielle ≤ plafond → **avertissement à justifier par écrit**

C'est la correction du trou v1 : NVDA + AMD + AVGO sont trois lignes mais **un seul pari**.

**Event risk** — alimenté par l'entité `Event` partagée : l'app liste les événements tombant avant mon horizon et demande si le trade peut être fortement impacté.

**Position ouverte** — affiche l'entrée, le stop, la cible, le P/L, le R courant, **les objections restées ouvertes** et **la revue d'invalidateurs**. La case « thèse intacte / renforcée / affaiblie / invalidée » n'est plus déclarative : elle se remplit *après* avoir répondu invalidateur par invalidateur.

### 5.8 📔 Journal & Apprentissage

Lit exclusivement les `DecisionSnapshot`. Pour chaque décision close : thèse initiale gelée, ce que j'attendais, ce qui s'est produit, résultat **en % et en R**, jugement (correcte / partiellement / incorrecte), erreur principale, apprentissage.

Puis les statistiques de calibration (§ 8) — c'est ce qui remplace la barre à 72 %.

---

## 6. Origine de l'idée

Champ obligatoire à la création d'un ticker : `screener` / `actualité` / `conversation` / `thèse macro` / `intuition` / `autre` + note libre. Coût de saisie négligeable, exploité dans le Journal : *quelle source d'idées me réussit réellement ?*

---

## 7. Deux moteurs distincts — ne jamais les confondre

| | **Contrôles** | **Challenge** |
|---|---|---|
| Nature | Règles déterministes | LLM adversarial |
| Portée | Locale, à la saisie | Globale, sur la thèse |
| Déclenchement | Automatique | Bouton explicite, porte G4 |
| Fiabilité | Totale | Variable, jamais autoritaire |
| Exemple | « CA +25 % mais BPA +2 %. Pourquoi ? » | « Tu supposes l'expansion des marges. Sur quoi ? » |
| Sortie | `RuleFinding` → réponse écrite exigée | `Objection` → statut à trancher |

Les contrôles sont gratuits, fiables, non hallucinants : **ils sont la colonne vertébrale du produit**, le challenge LLM en est le complément. Catalogue initial : [`RULES.md § 1`](./RULES.md).

---

## 8. Les trois niveaux d'IA et leurs garde-fous

| Niveau | Contexte accessible | Peut | Ne peut jamais |
|---|---|---|---|
| **Coach** (défaut) | Fiche courante, après mes champs obligatoires | Questionner, pointer un manque | Donner une valeur, un avis directionnel, une conclusion |
| **Tutor** | **Aucun** — contexte vide | Expliquer un mécanisme général | Voir mon dossier, mon ticker, mon portefeuille |
| **Analyst** | Dossier complet, porte G4 franchie | Diagnostiquer mon raisonnement | Recommander un achat, donner un prix cible ou une taille |

Garde-fous imposés par l'application, pas par ma discipline :

1. Le mode **Tutor n'a techniquement aucun accès** au dossier en cours. Sans quoi « explique-moi si NVDA est chère » devient de l'Analyst déguisé.
2. Le mode **Analyst est verrouillé** tant que thèse et bear case ne sont pas écrits.
3. **L'IA ne voit jamais le P/L courant d'une position** avant de challenger — sinon elle rationalise avec moi.
4. Aucun mode ne produit de recommandation directionnelle, de prix cible ou de taille de position. Contrainte inscrite dans le prompt système **et** dans les portes d'accès.
5. Toute sortie IA est horodatée, le modèle est enregistré, et elle est conservée (elle entre dans le snapshot).

---

## 9. Ce qui remplace la barre de progression

Métriques calculées dans le Journal, toutes dérivées, aucune saisie supplémentaire :

| Métrique | Ce qu'elle révèle |
|---|---|
| Taux de réussite par tranche de confiance (1-3 / 4-6 / 7-8 / 9-10) | **Calibration** : ma confiance prédit-elle quoi que ce soit ? |
| Écart moyen confiance avant / après challenge | Perméabilité au challenge. Un écart nul = biais de confirmation mesuré. |
| Taux d'objections acceptées vs réfutées | Idem, sous un autre angle |
| Résultat moyen en **R** par origine d'idée | Quelle source d'idées me réussit |
| Résultat en R par diagnostic de valorisation | Est-ce que je paie trop cher ? |
| Motif de sortie : invalidateur / stop / cible / discrétionnaire | Part de discrétionnaire = part d'indiscipline |
| **Délai entre invalidateur survenu et sortie effective** | L'indicateur d'honnêteté le plus dur. |
| Nombre de révisions de thèse en position perdante | Détection de la thèse qui mute pour se justifier |

---

## 10. Hors périmètre (explicite)

- Aucune récupération automatique de données (Trading Economics et Finviz sont saisis à la main, par choix).
- Aucun backtest, aucun screener, aucune optimisation.
- Aucune exécution d'ordre, aucun lien courtier.
- Pas d'optimisation de portefeuille ni de calcul de corrélation statistique — seulement des plafonds de concentration déclarés.
- Mono-utilisateur, mono-devise (USD).

## 11. Contraintes techniques imposées par l'architecture

1. **Indicateurs, catégories et règles sont de la configuration, pas du code.** Ajouter un indicateur ne doit jamais demander de modifier un composant.
2. **Formulaires déclaratifs**, générés depuis les schémas — sinon 14 catégories × N indicateurs deviennent ingérables.
3. **Export et sauvegarde dès le premier jour** (JSON complet + CSV par entité). Toutes les données sont saisies à la main : elles sont irremplaçables.
4. **Entités immuables** (`DecisionSnapshot`, `Thesis`, `ChallengeRun`, `JournalEntry`) : écriture unique, jamais d'UPDATE ni de DELETE.
5. **Local d'abord.** Aucune dépendance réseau hors appels IA.

---

## 12. Cycle de vie d'un ticker

```
idée ──→ recherche ──→ watchlist ──→ position ouverte ──→ clôturée ──→ archivée
   │          │             │                                   │
   └──────────┴─────────────┴────────→ écartée ─────────────────┘
                                          (snapshot + motif obligatoires)
```

Chaque transition engageante produit un `DecisionSnapshot`. « Écartée » est une décision à part entière et doit être gelée : les titres qu'on n'achète pas enseignent autant que les autres.
