# Mettre le portfolio en ligne avec GitHub Pages

Oui, c'est possible, et c'est même le cas idéal : le site est 100 % statique
(du HTML, du CSS, du JavaScript, aucun serveur à faire tourner). GitHub Pages
est fait exactement pour ça, c'est gratuit, et **on peut continuer à le
modifier autant qu'on veut après la mise en ligne** — chaque modification
enregistrée redéploie le site toute seule en une minute environ.

Le dépôt existe déjà : `github.com/lorenzoslyover/PfolioGauthier`

L'adresse finale sera :

```
https://lorenzoslyover.github.io/PfolioGauthier/
```

---

## Avant de commencer — deux points à valider

**1. Le dépôt doit être public.** GitHub Pages sur un compte gratuit ne
publie que depuis un dépôt public. Concrètement, n'importe qui peut lire les
fichiers du dépôt, y compris `assets/CV_Gauthier_VADOT_2026.pdf`.
Un CV contient souvent un numéro de téléphone et une adresse : vérifiez avec
Gauthier que la version publiée est celle qu'il assume de rendre publique. Au
besoin, préparez une version « web » du CV sans coordonnées personnelles.

**2. Ce qui ne sera pas publié.** J'ai déjà exclu du dépôt :

- `PfolioGauthier.zip` — l'archive de travail
- `_notes/` — la liste d'améliorations et ses captures d'écran (notes privées)

Les fichiers restent sur votre disque, ils ne partent simplement pas sur
GitHub.

---

## Étape 1 · Envoyer le travail sur GitHub

Tout est actuellement sur la branche `contenu-gauthier`. Pages publie depuis
`main`, il faut donc y basculer le travail.

Ouvrez le Terminal, puis :

```bash
cd ~/Documents/pfolio

# On repasse sur main et on y intègre la branche de travail
git checkout main
git merge contenu-gauthier

# On envoie sur GitHub
git push origin main
```

> **Si `git push` demande un mot de passe :** GitHub n'accepte plus le mot de
> passe du compte. Il faut un *personal access token*, ou plus simplement
> installer **GitHub Desktop** (interface graphique, aucune ligne de commande)
> et se connecter dedans une fois pour toutes.

---

## Étape 2 · Activer GitHub Pages

Dans le navigateur :

1. Aller sur `https://github.com/lorenzoslyover/PfolioGauthier`
2. Onglet **Settings** (en haut à droite du dépôt)
3. Menu de gauche : **Pages**
4. Section **Build and deployment** :
   - *Source* : choisir **Deploy from a branch**
   - *Branch* : choisir **main**, et le dossier **/ (root)**
5. Cliquer sur **Save**

GitHub affiche alors un bandeau *« Your site is live at… »*. Le premier
déploiement prend **1 à 3 minutes**. Si la page affiche une erreur 404 juste
après, patientez et rechargez : c'est normal, le site n'est pas encore
construit.

---

## Étape 3 · Vérifier

Ouvrez `https://lorenzoslyover.github.io/PfolioGauthier/` et contrôlez :

- la timeline affiche bien les 11 projets ;
- une vignette de projet s'ouvre au clic ;
- le showreel démarre sur la page d'accueil ;
- le CV se télécharge depuis le bouton du profil.

> **Bonne nouvelle pour les vidéos YouTube :** en local, le site tourne sur
> `localhost`, une origine que YouTube traite avec méfiance. Sur
> `github.io`, c'est un vrai domaine en HTTPS. Si une vidéo refusait de se
> lancer en local, il y a de bonnes chances qu'elle passe une fois en ligne.

---

## Modifier le site après la mise en ligne

C'est là que ça devient confortable. **Deux méthodes**, au choix.

### Méthode A — depuis le navigateur (recommandée pour Gauthier)

Aucun logiciel, aucune ligne de commande. Idéal pour ajouter un projet ou
changer un lien.

1. Aller sur le dépôt GitHub
2. Cliquer sur le fichier **`data.json`**
3. Cliquer sur l'icône **crayon** (« Edit this file ») en haut à droite
4. Modifier le texte directement dans la page
5. Descendre en bas, bouton vert **Commit changes**
6. Écrire une courte description (« ajout du projet DOLORES »), puis confirmer

Le site se met à jour tout seul **en une minute environ**.

> **Attention à la virgule.** `data.json` suit une grammaire stricte : chaque
> élément d'une liste est séparé par une virgule, mais **le dernier n'en a
> pas**. Une virgule en trop et le site affiche « Médias hors ligne ».
> En cas de doute, collez le contenu sur <https://jsonlint.com> avant de
> valider : l'outil pointe la ligne fautive.

### Méthode B — depuis l'ordinateur

Pour les modifications plus lourdes (design, nouvelles fonctions) :

```bash
cd ~/Documents/pfolio

# 1. Récupérer d'éventuelles modifications faites depuis le site GitHub
git pull

# 2. Travailler, tester en local
python3 -m http.server 8080     # puis http://localhost:8080

# 3. Publier
git add -A
git commit -m "description de la modification"
git push
```

### Le réflexe qui évite les ennuis

Si vous éditez **à la fois** depuis GitHub et depuis l'ordinateur, faites
toujours `git pull` **avant** de commencer à travailler en local. Sinon les
deux versions divergent et il faut réconcilier à la main.

---

## Si quelque chose casse

Rien n'est jamais perdu : chaque enregistrement est une version, et on peut
revenir en arrière.

**Depuis GitHub** — onglet **Commits** du dépôt, cliquer sur la version
d'avant, puis **Revert**.

**Depuis le Terminal** :

```bash
git log --oneline          # liste des versions, la plus récente en haut
git revert LE_CODE         # annule une version précise, ex. git revert 0066989
git push
```

Pour annuler simplement une modification en cours, non encore enregistrée :

```bash
git restore data.json
```

---

## Le site ne se met pas à jour ?

Dans l'ordre :

1. **Attendre deux minutes.** Le déploiement n'est pas instantané. L'onglet
   **Actions** du dépôt montre le déploiement en cours (rond orange) ou
   terminé (coche verte).
2. **Vider le cache du navigateur** : `Cmd + Maj + R` sur Mac,
   `Ctrl + F5` sur Windows. C'est la cause numéro un des « mais j'ai bien
   modifié pourtant ».
3. **Vérifier le JSON** sur <https://jsonlint.com>. Si le fichier est
   invalide, le site affiche « Médias hors ligne ».
4. **Regarder l'onglet Actions.** Une croix rouge signale un échec de
   déploiement, avec le détail en cliquant dessus.

---

## Aller plus loin — un nom de domaine

`lorenzoslyover.github.io/PfolioGauthier` fonctionne très bien, mais pour un
portfolio professionnel un vrai nom de domaine fait la différence :
`gauthiervadot.fr`, par exemple. Comptez une dizaine d'euros par an chez un
bureau d'enregistrement (OVH, Gandi, Namecheap).

Une fois le domaine acheté :

1. Chez le fournisseur du domaine, créer quatre enregistrements **A** pointant
   vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et
   `185.199.111.153`
2. Sur GitHub : **Settings → Pages → Custom domain**, saisir le domaine,
   **Save**
3. Cocher **Enforce HTTPS** dès que la case devient disponible (quelques
   minutes à quelques heures)

Bonus : sur un domaine dédié, le site est servi à la racine, et les adresses
des projets deviennent `gauthiervadot.fr/project.html?id=proj-3`.

---

## Récapitulatif

| Ce que vous voulez faire            | Comment                                  |
| ----------------------------------- | ---------------------------------------- |
| Publier la première fois            | `git push origin main`, puis Settings → Pages |
| Ajouter ou modifier un projet       | Éditer `data.json` sur GitHub, Commit    |
| Changer le design                   | En local, puis `git push`                |
| Revenir en arrière                  | Onglet Commits → Revert                  |
| Voir si le déploiement a marché     | Onglet Actions                           |
| Le site semble figé                 | `Cmd + Maj + R`                          |
