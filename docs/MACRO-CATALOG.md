# USSM-ThesisLab — Catalogue macro (v2)

> Statut : **spécification, non implémentée.**
> **18 catégories → 14.** Ce catalogue est de la **configuration** : ajouter, retirer ou déplacer un indicateur ne doit jamais demander de modifier du code.

---

## 1. Ce qui a changé depuis la v1

| Action | Détail | Raison |
|---|---|---|
| **Supprimé** | `09 Marché actions`, `10 VIX` | Doublon exact avec le module Marché, qui devient la source unique |
| **Fusionné** | `05 Obligations` + `06 Courbe des taux` → **M03 Taux & Courbe** | Même lecture, mêmes indicateurs consultés ensemble |
| **Fusionné** | `07 Crédit` + `08 Liquidité` → **M05 Liquidité & Crédit** | Idem ; se diagnostiquent conjointement |
| **Hiérarchisé** | 5 catégories `noyau` obligatoires, 9 optionnelles | Décision 4 — rendre la charge de saisie tenable |
| **Typé** | 11 catégories `quantitatif`, 3 `qualitatif` | Gouvernement, Géopolitique et Technologie & IA ne sont pas des séries chiffrées Trading Economics : la structure « Indicateur / Valeur / Évolution » ne s'y applique pas |
| **Cadencé** | Chaque indicateur porte une `frequence` | L'app ne réclame que ce qui a réellement changé — c'est ce qui divise la charge par 4 à 5 |

---

## 2. Noyau — obligatoire (porte G3)

Ces 5 catégories doivent avoir une `MacroReading` pour ouvrir le module Thèse. Péremption par défaut : **30 jours** (avertissement, jamais bloquant).

### M01 — Inflation `quantitatif`

| Indicateur | Unité | Fréquence |
|---|---|---|
| CPI (a/a) | % | mensuel |
| Core CPI (a/a) | % | mensuel |
| PCE (a/a) | % | mensuel |
| Core PCE (a/a) | % | mensuel |
| PPI (a/a) | % | mensuel |
| Anticipations d'inflation (1 an / 5 ans) | % | mensuel |

### M02 — Fed & politique monétaire `quantitatif`

| Indicateur | Unité | Fréquence |
|---|---|---|
| Fed Funds Rate | % | mensuel |
| Taille du bilan de la Fed | Md USD | hebdomadaire |
| Rythme du QT | Md USD/mois | mensuel |
| Probabilité de baisse à la prochaine réunion | % | hebdomadaire |
| Taux terminal anticipé | % | mensuel |

### M03 — Taux & courbe `quantitatif`

| Indicateur | Unité | Fréquence |
|---|---|---|
| 2 ans | % | quotidien |
| 10 ans | % | quotidien |
| 30 ans | % | quotidien |
| Pente 10a−2a | pts | quotidien |
| Pente 10a−3m | pts | quotidien |
| 10 ans réel (TIPS) | % | quotidien |
| Breakeven 10 ans | % | quotidien |

### M04 — Emploi `quantitatif`

| Indicateur | Unité | Fréquence |
|---|---|---|
| Non-Farm Payrolls | k | mensuel |
| Taux de chômage | % | mensuel |
| Taux de participation | % | mensuel |
| Salaire horaire moyen (a/a) | % | mensuel |
| Inscriptions hebdomadaires au chômage | k | hebdomadaire |
| JOLTS — postes ouverts | M | mensuel |

### M05 — Liquidité & crédit `quantitatif`

| Indicateur | Unité | Fréquence |
|---|---|---|
| Spread Investment Grade | pdb | hebdomadaire |
| Spread High Yield | pdb | hebdomadaire |
| Indice de conditions financières | idx | hebdomadaire |
| Reverse Repo | Md USD | hebdomadaire |
| Réserves bancaires | Md USD | hebdomadaire |
| Compte général du Trésor (TGA) | Md USD | hebdomadaire |

---

## 3. Optionnelles quantitatives

À remplir quand la thèse l'exige. Non requises par la porte G3. Péremption par défaut : **60 jours**.

### M06 — Économie américaine
PIB (t/t annualisé) · ISM Manufacturier · ISM Services · PMI Composite · Ventes au détail (a/a) · Indicateurs avancés (LEI)

### M07 — Dollar
DXY · EUR/USD · USD/JPY · USD/CNY · Indice dollar pondéré des échanges

### M08 — Pétrole & matières premières
WTI · Brent · Gaz naturel · Cuivre · Or · Indice matières premières

### M09 — Immobilier
Mises en chantier · Permis de construire · Ventes de logements existants · Taux 30 ans · Indice Case-Shiller · Indice NAHB

### M10 — Consommateur
Confiance (Conference Board) · Sentiment (U. Michigan) · Taux d'épargne · Crédit à la consommation · Défauts sur cartes de crédit

### M11 — Industrie
Production industrielle · Utilisation des capacités · Commandes de biens durables · Stocks/ventes

---

## 4. Optionnelles qualitatives

**Gabarit différent** : pas de colonne Valeur ni Évolution. Une liste de `themes[]` (titre + note libre), puis la même structure d'interprétation que les fiches quantitatives. Péremption par défaut : **90 jours**.

### M12 — Gouvernement & budget
Thèmes suggérés : déficit et trajectoire de dette · plafond de la dette · calendrier d'émissions du Trésor · fiscalité des entreprises · réglementation sectorielle · shutdown et échéances budgétaires

### M13 — Géopolitique
Thèmes suggérés : Chine / Taïwan · contrôles à l'export de semi-conducteurs · Moyen-Orient et voies d'approvisionnement · Ukraine / Russie et énergie · droits de douane · élections majeures

### M14 — Technologie & IA
Thèmes suggérés : cycle de capex des hyperscalers · capacité de calcul et contraintes d'approvisionnement · adoption de l'IA en entreprise · cycle de remplacement matériel · réglementation de l'IA

> Ces trois catégories nourrissent surtout les risques de thèse et la lecture sectorielle. Elles sont optionnelles mais souvent décisives sur les semi-conducteurs.

---

## 5. Charge de saisie — avant / après

| | v1 | v2 |
|---|---|---|
| Catégories | 18 | 14 (dont 5 obligatoires) |
| Indicateurs à saisir par cycle complet | ~108 | ~30 pour le noyau |
| Interprétations rédigées par cycle | 18 | 5 |
| Rafraîchissement | tout, à chaque fois | uniquement ce dont la `frequence` est échue |

En rythme de croisière — la plupart des séries étant mensuelles — une mise à jour hebdomadaire du noyau représente une poignée de valeurs : les taux (quotidiens), les spreads et la liquidité (hebdomadaires), et le bloc mensuel le jour de sa publication.

C'est la différence entre une application qu'on tient et une application qu'on abandonne au troisième mois.

---

## 6. Où vivent les indicateurs retirés du catalogue macro

| Indicateur v1 | Emplacement v2 |
|---|---|
| S&P 500, Nasdaq, NDX, Russell 2000, Dow, SP500 Equal Weight | Module **Marché** → `MarketReading.indices` |
| Advance/Decline, New Highs/Lows, % > 50 DMA, % > 200 DMA | Module **Marché** → `MarketReading.breadth` |
| VIX, structure par terme du VIX | Module **Marché** → `MarketReading.volatilite` |

Le Dashboard affiche des feux `VIX` et `Dollar` : le premier est alimenté par le module Marché, le second par `M07` — et reste **gris « non renseigné »** tant que M07 n'a pas de lecture. Jamais vert par défaut.
