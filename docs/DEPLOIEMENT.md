# Mettre US Equity OS en ligne — guide pas à pas

> Tout se fait **depuis un navigateur**. Aucun terminal, aucune installation, aucun ordinateur de développement.
> Compte sur 20 à 30 minutes la première fois.

Résultat : une adresse privée, protégée par mot de passe, utilisable depuis le téléphone
et l'ordinateur, avec des données sauvegardées automatiquement.

**Coût : 0 €** sur les offres gratuites de Neon et Vercel.
Les tarifs et les limites de ces offres changent régulièrement — vérifie-les au moment de créer les comptes.

---

## Ce qu'il te faut

Trois comptes gratuits, créés dans cet ordre :

1. **GitHub** — héberge le code (tu l'as déjà : le dépôt `USSM-ThesisLab`)
2. **Neon** — héberge la base de données · [neon.tech](https://neon.tech)
3. **Vercel** — héberge l'application · [vercel.com](https://vercel.com)

Connecte-toi à Neon et à Vercel **avec ton compte GitHub** : ça évite deux mots de passe de plus.

---

## Étape 1 — Créer la base de données (Neon)

1. Va sur [neon.tech](https://neon.tech) → **Sign up** → *Continue with GitHub*.
2. Crée un projet :
   - **Name** : `ussm-thesislab`
   - **Postgres version** : laisse la valeur par défaut
   - **Region** : la plus proche de toi (`Europe (Frankfurt)` par exemple)
3. À la fin, Neon affiche une **connection string**. Deux choses importantes :
   - choisis l'onglet ou la case **Pooled connection** — l'URL doit contenir `-pooler`
   - copie-la en entier, elle ressemble à :
     ```
     postgresql://neondb_owner:XXXXXXXX@ep-quelque-chose-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```

> **Garde cette URL de côté** (bloc-notes, gestionnaire de mots de passe). Elle contient le mot de passe
> de ta base : ne la mets jamais dans le code, ni dans un message, ni dans une capture d'écran.
> Si elle fuite, Neon permet de la réinitialiser (*Reset password* dans les réglages du projet).

---

## Étape 2 — Choisir ton mot de passe d'application

Invente un mot de passe **long** (une phrase de 4-5 mots suffit, c'est plus solide qu'un mot court
compliqué) et note-le. C'est lui qui protégera l'accès à ton analyse.

Exemple de forme : `courbe-inversee-cafe-lundi`

---

## Étape 3 — Déployer l'application (Vercel)

1. Va sur [vercel.com](https://vercel.com) → **Sign up** → *Continue with GitHub*.
2. **Add New…** → **Project**.
3. Dans la liste des dépôts, trouve **USSM-ThesisLab** → **Import**.
   - Si le dépôt n'apparaît pas : *Adjust GitHub App Permissions* → autorise Vercel à le voir.
4. Sur l'écran de configuration :
   - **Framework Preset** : `Next.js` (détecté tout seul)
   - Ne touche à rien d'autre
5. Déplie **Environment Variables** et ajoute **deux** variables :

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | l'URL Neon *pooled* de l'étape 1 |
   | `APP_PASSWORD` | ton mot de passe de l'étape 2 |

   > Les deux sont indispensables. Sans `DATABASE_URL` le déploiement échoue ;
   > sans `APP_PASSWORD` l'application est **ouverte à quiconque a l'adresse**.

6. **Deploy**. Compte 2 à 3 minutes.

Les tables de la base sont créées automatiquement pendant le déploiement — il n'y a rien à lancer.

À la fin, Vercel te donne une adresse du type `ussm-thesislab.vercel.app`. Ouvre-la :
tu dois tomber sur l'écran **Mot de passe**.

---

## Étape 4 — Installer sur le téléphone

L'application est un site web : rien à installer depuis un store.

**iPhone (Safari)**
1. Ouvre ton adresse Vercel, connecte-toi
2. Bouton **Partager** (carré avec une flèche)
3. **Sur l'écran d'accueil** → **Ajouter**

**Android (Chrome)**
1. Ouvre ton adresse Vercel, connecte-toi
2. Menu **⋮** → **Ajouter à l'écran d'accueil**

L'icône apparaît comme une vraie application, en plein écran. La session dure **un an** par appareil :
tu ne retapes pas le mot de passe à chaque fois.

### Ce que tu feras sur quel écran

| | |
|---|---|
| **Ordinateur** | Saisie macro, saisie Finviz, rédaction de thèse, challenge |
| **Téléphone** | Dashboard, consultation d'un dossier, et surtout **Revue rapide** |

**Revue rapide** est l'écran pensé pour le pouce : mettre à jour un prix, répondre à ses
invalidateurs un par un, statuer sur la thèse. C'est précisément ce qu'on fait mal quand on
n'a pas l'outil sous la main.

---

## Étape 5 — Sauvegardes

Tes données sont saisies à la main : elles sont irremplaçables. Deux filets :

1. **Neon sauvegarde automatiquement.** C'est la protection principale, et elle ne demande rien.
2. **Export manuel** : `Réglages → Exporter tout en JSON`. Fais-le de temps en temps
   (après une grosse session de saisie), garde le fichier dans ton cloud personnel.
   C'est ta porte de sortie si tu changes un jour d'hébergeur.

---

## Mettre à jour l'application plus tard

Chaque modification poussée sur la branche du dépôt GitHub redéclenche un déploiement automatique.
Rien à faire de ton côté. Les nouvelles tables éventuelles sont créées pendant le déploiement.

Pour changer le mot de passe : Vercel → ton projet → **Settings** → **Environment Variables** →
modifie `APP_PASSWORD` → **Redeploy**. Toutes les sessions ouvertes sont invalidées.

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le déploiement échoue avec « DATABASE_URL n'est pas défini » | Variable absente ou mal orthographiée | Vercel → Settings → Environment Variables → vérifie le nom exact, puis **Redeploy** |
| Erreur de connexion à la base au chargement des pages | URL Neon non *pooled* | Reprends l'URL contenant `-pooler` dans Neon, remplace la variable, **Redeploy** |
| Bandeau rouge « Application non protégée » | `APP_PASSWORD` absente | Ajoute-la dans Vercel, **Redeploy** |
| La première page met 2-3 secondes | La base gratuite Neon était en veille | Normal, elle se réveille toute seule. Les suivantes sont instantanées |
| « Mot de passe incorrect » alors qu'il est bon | La variable a été modifiée sans redéploiement | **Redeploy** après tout changement de variable |

---

## Pour information : faire tourner l'app en local

Tu n'en as pas besoin, mais si un jour tu as un ordinateur de développement :

```bash
npm install
npm run db:local          # Postgres jetable, aucune installation requise
# reporte l'URL affichée dans un fichier .env.local (voir .env.example)
npm run dev
```

Le Postgres local (PGlite) n'accepte **qu'une connexion à la fois** : arrête `npm run dev`
avant de lancer un script qui touche à la base.
