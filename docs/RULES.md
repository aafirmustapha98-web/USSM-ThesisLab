# USSM-ThesisLab — Contrôles déterministes et portes (v2)

> Statut : **spécification, non implémentée.**
> Ces règles sont de la **configuration**, pas du code. Ajouter un contrôle ne doit jamais demander de modifier un composant.

---

## 1. Catalogue des contrôles

Un contrôle est une condition déterministe évaluée à la saisie. Il ne juge pas : **il pose une question à laquelle je dois répondre par écrit.**

`avertissement` → la réponse est exigée mais n'empêche rien.
`bloquant` → la porte associée reste fermée tant que la réponse n'est pas écrite.

### 1.1 Entreprise (portée `company`)

| Code | Condition | Question posée | Sév. |
|---|---|---|---|
| `C-01` | `sales_growth > 15%` et `eps_growth < 5%` | Le chiffre d'affaires progresse fortement mais le BPA beaucoup moins. Dilution, marges, charges financières ou exceptionnels ? | avert. |
| `C-02` | `net_income > 0` et `fcf < 0` | L'entreprise est bénéficiaire mais brûle du cash. Qu'est-ce qui explique l'écart ? | avert. |
| `C-03` | `earnings_quality < 0,6` sur 2 périodes | Le FCF couvre mal le résultat net depuis deux périodes. Qualité des bénéfices ? | avert. |
| `C-04` | `delta_marge(operating) ≤ −2 pts` et `sales_growth > 10%` | Les marges se contractent alors que le CA accélère. Pourquoi ? | avert. |
| `C-05` | `net_debt_to_ebitda > 3` et `interest_coverage < 3` | Levier élevé et couverture des intérêts faible. Qu'est-ce qui te rassure ? | avert. |
| `C-06` | `current_ratio < 1` ou `quick_ratio < 0,7` | Liquidité court terme tendue. Est-ce structurel dans ce secteur ? | avert. |
| `C-07` | `roic < 8%` et `diagnostic_qualite = vert` | Tu juges la qualité élevée avec un ROIC faible. Sur quoi te fondes-tu ? | **bloq.** |
| `C-08` | `shares` en hausse > 3 % sur un an | Dilution des actionnaires. En as-tu tenu compte dans ta croissance par action ? | avert. |
| `C-09` | `periode` du filing antérieure au dernier trimestre publié connu | Tes données datent de {periode} alors qu'un trimestre plus récent existe. Actualiser ? | avert. |
| `C-12` | `\|fcf_yield saisi − fcf_yield calculé\| > 10 %` relatif | Le FCF yield saisi diverge du calcul. Erreur de saisie ou périmètre différent ? | avert. |

### 1.2 Valorisation (portée `valuation`)

| Code | Condition | Question posée | Sév. |
|---|---|---|---|
| `C-20` | `pe < forward_pe` | Le P/E forward est supérieur au P/E actuel : le marché attend une **baisse** des bénéfices. Ta thèse en tient-elle compte ? | avert. |
| `C-21` | `peg > 2` et `diagnostic = attractive` | Tu juges la valorisation attractive avec un PEG supérieur à 2. Qu'est-ce qui le justifie ? | **bloq.** |
| `C-22` | `ev_ebitda` > 1,5 × médiane des pairs et `diagnostic ∈ {attractive, raisonnable}` | Le titre se paie nettement plus cher que ses pairs. Quelle prime justifies-tu ? | **bloq.** |
| `C-23` | aucun pair renseigné | Tu juges une valorisation sans comparaison. Ajouter au moins un pair ou justifier. | avert. |
| `C-24` | `diagnostic ∈ {chere, tres_chere}` et `conclusion = analyser_plus` sans motif | Tu juges le titre cher et tu continues. Écris pourquoi. | **bloq.** |

### 1.3 Macro & Marché (portée `macro`, `market`)

| Code | Condition | Question posée | Sév. |
|---|---|---|---|
| `C-30` | Une catégorie du noyau dépasse sa `peremption_jours` | {catégorie} date de {n} jours. Actualiser ou acquitter. | avert. |
| `C-31` | `MacroReading.diagnostic` inchangé depuis 3 lectures alors que ≥ 3 indicateurs ont changé de tendance | Ton diagnostic n'a pas bougé depuis trois lectures malgré des données qui bougent. Est-ce un choix ou une inertie ? | avert. |
| `C-32` | `MarketReading` sans invalidateur | Ton diagnostic de marché n'est pas falsifiable. Qu'est-ce qui te ferait changer d'avis ? | **bloq.** |
| `C-33` | `diagnostic = bullish` et breadth `% > 200 DMA` en baisse sur 2 lectures | Tu es haussier alors que la participation se dégrade. Comment le concilies-tu ? | avert. |

### 1.4 Thèse (portée `thesis`)

| Code | Condition | Question posée | Sév. |
|---|---|---|---|
| `C-40` | `direction = long` et `MacroReading(noyau).diagnostic = defavorable` majoritaire | Ta thèse est acheteuse alors que ta propre lecture macro est défavorable. Justifie le décalage. | **bloq.** |
| `C-41` | `direction = long` et `SectorReading.vent = defavorable` | Le vent sectoriel que tu as toi-même diagnostiqué est contraire. Pourquoi passer outre ? | **bloq.** |
| `C-42` | Aucun invalidateur avec `metrique` renseignée | Tes invalidateurs ne sont pas mesurables. Rends-en au moins un observable. | **bloq.** |
| `C-43` | `bear_case` < 200 caractères | Ton pre-mortem est trop court pour être un vrai exercice. | **bloq.** |
| `C-44` | `confiance_post_challenge = confiance_initiale` et ≥ 1 objection `acceptee` | Tu as accepté une objection sans que ta confiance bouge. Est-ce cohérent ? | avert. |
| `C-45` | `confiance_initiale ≥ 9` | Confiance très élevée. Liste au moins deux incertitudes. | avert. |
| `C-46` | Risques de la thèse ⊄ risques du secteur, aucun import | Tu n'as retenu aucun risque sectoriel. Volontaire ? | avert. |

### 1.5 Timing (portée `timing`)

| Code | Condition | Question posée | Sév. |
|---|---|---|---|
| `C-50` | `rr < 2` | Le rapport gain/risque est inférieur à 2. Qu'est-ce qui justifie ce trade ? | **bloq.** |
| `C-51` | `stop_pct > 15 %` et `horizon_jours ≤ 30` | Stop très large pour un horizon swing. Cohérent ? | avert. |
| `C-52` | `stop` au-delà du support saisi | Ton stop est plus loin que le support que tu as identifié. Volontaire ? | avert. |
| `C-53` | Un `Event` de portée marché ou ticker tombe avant `date_entree + horizon_jours` | {event} tombe le {date}, avant ton horizon. Ton trade peut-il être fortement impacté ? | **bloq.** |
| `C-54` | `tendance = baisse` et `direction = long` | Tu achètes contre la tendance que tu as diagnostiquée. Pourquoi maintenant ? | **bloq.** |

### 1.6 Portefeuille (portée `portfolio`)

| Code | Condition | Effet | Sév. |
|---|---|---|---|
| `C-60` | Risque de la position > `risque_max_par_trade_pct` | Ouverture refusée. Réduire la taille ou resserrer le stop. | **bloq.** |
| `C-61` | Risque ouvert total > `risque_ouvert_max_pct` | Ouverture refusée. | **bloq.** |
| `C-62` | Exposition du secteur > `exposition_max_secteur_pct` | Concentration : {secteur} atteindrait {x} %. NVDA, AMD et AVGO sont trois lignes mais un seul pari. Justifier par écrit. | avert. |
| `C-63` | ≥ 3 positions ouvertes dans le même secteur | Idem, formulation concentration. | avert. |

### 1.7 Suivi de position (portée `position`)

| Code | Condition | Question posée | Sév. |
|---|---|---|---|
| `C-70` | Un invalidateur au statut `survenu` et position toujours ouverte depuis > 5 jours | {invalidateur} est survenu il y a {n} jours et tu es toujours en position. Quelle est ta décision ? | **bloq.** |
| `C-71` | ≥ 2 `InvalidatorCheck` à `je_ne_sais_pas` sur la même revue | Tu ne sais pas répondre à deux de tes propres invalidateurs. Quelle donnée te manque ? | avert. |
| `C-72` | Nouvelle version de thèse créée alors que `pl_pct < −5 %` | Tu révises ta thèse pendant que la position perd. Est-ce une nouvelle information ou une justification ? | avert. |
| `C-73` | `stop_actuel` élargi par rapport à `stop_initial` | Tu élargis ton stop. Écris le motif. | **bloq.** |
| `C-74` | Aucune `PositionReview` depuis 30 jours | Position non revue depuis un mois. | avert. |

> `C-70` et `C-72` sont les deux contrôles les plus importants du catalogue : ils visent précisément les moments où l'on se ment le mieux à soi-même.

---

## 2. Les portes (formalisation)

Une porte est une conjonction de conditions. Elle est **binaire et non contournable**. Les avertissements de fraîcheur ne bloquent jamais — ils s'acquittent.

```
G1  Entreprise
    ticker.sector_code ≠ null
    ∧ ∃ SectorReading(sector_code)

G2  Valorisation
    G1
    ∧ CompanyReading.interpretation_rentabilite ≠ ∅
    ∧ CompanyReading.interpretation_solidite    ≠ ∅
    ∧ CompanyReading.interpretation_croissance  ≠ ∅
    ∧ ∄ RuleFinding(portee=company, severite=bloquant, statut=ouvert)

G3  Thèse
    G2
    ∧ ∀ c ∈ MacroCategory[noyau] : ∃ MacroReading(c)
    ∧ ∃ MarketReading
    ∧ ∃ ValuationReading avec justification ≠ ∅
    ∧ ∄ RuleFinding(portee=valuation, severite=bloquant, statut=ouvert)

G4  Bouton Challenge  /  mode Analyst
    G3
    ∧ |thesis.raisons| ≥ 1 ∧ |thesis.catalyseurs| ≥ 1 ∧ |thesis.risques| ≥ 1
    ∧ thesis.bear_case ≠ ∅  (≥ 200 caractères)
    ∧ ∃ Invalidator(thesis) avec metrique ≠ null
    ∧ thesis.confiance_initiale ≠ null

G5  Timing
    G4
    ∧ ∃ ChallengeRun(thesis)
    ∧ ∄ Objection(statut = ouverte)
    ∧ ∄ Objection(severite = critique ∧ statut = ouverte)
    ∧ thesis.confiance_post_challenge ≠ null
    ∧ ∄ RuleFinding(portee=thesis, severite=bloquant, statut=ouvert)

G6  Ouverture de position
    G5
    ∧ TechnicalSetup complet (entry, stop, target, horizon)
    ∧ rr calculable
    ∧ ∄ RuleFinding(portee ∈ {timing, portfolio}, severite=bloquant, statut=ouvert)
    ∧ event risk revu
    ∧ DecisionSnapshot créé          ← condition finale, atomique avec l'ouverture

G7  Archivage
    ∃ JournalEntry(snapshot) avec erreur_principale ≠ ∅ ∧ apprentissage ≠ ∅
```

### Affichage d'une porte fermée

Une porte fermée n'affiche jamais un pourcentage. Elle affiche **ce qui manque, nommément** :

```
🔒 Timing verrouillé
   • Objection critique non tranchée : « Tu supposes l'expansion des
     marges sans donnée de pricing power »
   • Objection majeure non tranchée (1)
   • Confiance post-challenge non saisie

⚠ Avertissements (n'empêchent pas) :
   • Liquidité & Crédit : 41 jours   [acquitter]
   • C-62 : Semiconducteurs atteindrait 68 % du portefeuille
```

---

## 3. Garde-fous IA (contraintes d'exécution)

| # | Règle | Application |
|---|---|---|
| `AI-1` | Le mode **Tutor** reçoit un contexte vide | Aucun identifiant de ticker, aucune donnée de dossier ni de portefeuille n'est transmis au modèle |
| `AI-2` | Le mode **Analyst** exige la porte G4 | Bouton désactivé sinon |
| `AI-3` | Le mode **Coach** exige les champs obligatoires de la fiche courante | Pas d'IA avant mon interprétation |
| `AI-4` | Aucun mode ne reçoit le **P/L courant** avant de challenger | Champ exclu du contexte de `ChallengeRun` |
| `AI-5` | Aucun mode ne produit recommandation, prix cible, ni taille de position | Inscrit dans le prompt système ; une sortie contrevenante est marquée et non affichée comme conclusion |
| `AI-6` | Toute sortie est horodatée et conservée avec `modele` et `prompt_version` | Entre dans le `DecisionSnapshot` |
| `AI-7` | L'IA ne pré-remplit **jamais** un champ d'interprétation ou un diagnostic | Aucun endpoint d'écriture sur `MacroReading`, `CompanyReading`, `ValuationReading`, `Thesis` |

> `AI-7` est la traduction technique de la règle fondamentale. Si un seul champ d'interprétation devient pré-remplissable par l'IA, tout le produit perd sa raison d'être.
