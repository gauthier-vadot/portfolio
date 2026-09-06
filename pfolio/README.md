# SÉQUENCE — Portfolio Animation 2D & Montage

Un portfolio qui prend la forme d'une **station de montage**. Le contenu vit
entièrement dans `data.json` : aucune ligne de HTML, CSS ou JS à toucher pour
mettre le site à jour.

---

## 1 · Lancer le site

Ouvrir `index.html` en double-cliquant **ne fonctionne pas** : le site charge
`data.json` via `fetch`, ce qui exige un vrai serveur. Trois options :

```bash
# Python (déjà installé sur Mac et Linux)
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

```bash
# Node.js
npx serve .
```

**VS Code** — installer l'extension *Live Server*, puis clic droit sur
`index.html` → « Open with Live Server ».

En ligne, le site fonctionne tel quel sur n'importe quel hébergeur statique
(Netlify, Vercel, GitHub Pages, OVH…) : il suffit d'y déposer le dossier.

---

## 2 · Arborescence

```
pfolio/
├── data.json        ← LE SEUL FICHIER À MODIFIER
├── index.html       ← page d'accueil (structure)
├── project.html     ← page de détail d'un projet
├── styles.css       ← thème commun (couleurs, typo, chrome)
├── home.css         ← styles de la page d'accueil
├── project.css      ← styles de la page projet
├── shared.js        ← briques communes (timecode, curseur, démarrage)
├── app.js           ← moteur de la page d'accueil
├── project.js       ← moteur de la page projet
├── _backup-v1/      ← ancienne version du portfolio, conservée
└── assets/
    ├── profile.jpg      ← photo de profil (carrée)
    ├── cv.pdf           ← CV
    ├── thumbs/          ← vignettes des projets (16:9, 960×540 min)
    ├── previews/        ← extraits vidéo muets au survol (optionnel, .mp4)
    └── icons/           ← icônes des logiciels (SVG, 48×48)
```

> Les images et le CV livrés sont des **placeholders**. Remplacez-les par les
> vrais fichiers en gardant les mêmes noms — rien d'autre à faire.

---

## 3 · Les vidéos : coller un lien YouTube suffit

Partout où le site attend une vidéo, vous pouvez coller **n'importe quel lien
YouTube**, sous la forme que vous avez sous la main :

```
https://www.youtube.com/watch?v=K5nq2GuaPBQ
https://youtu.be/K5nq2GuaPBQ
https://www.youtube.com/shorts/K5nq2GuaPBQ
https://www.youtube.com/embed/K5nq2GuaPBQ
K5nq2GuaPBQ                              ← l'identifiant seul marche aussi
```

Cela vaut pour les trois emplacements :

| Emplacement                       | Champ                          |
| --------------------------------- | ------------------------------ |
| Vidéo du moniteur d'accueil       | `hero.showreelUrl`             |
| Aperçu au survol d'un clip        | `projects[].preview`           |
| Vidéos d'un projet                | `projects[].videos[].youtubeId` |

Un fichier vidéo local (`assets/videos/showreel.mp4`) fonctionne aussi dans ces
trois champs — le site détecte tout seul de quoi il s'agit.

> Sur l'accueil, la lecture et la barre de transport sont indépendantes : la
> vidéo est intégrée directement et démarre toujours, même si l'API JavaScript
> de YouTube est bloquée (bloqueur de pub, réseau d'entreprise). Dans ce cas
> seuls les boutons lecture / son / position se grisent. Si l'intégration
> elle-même échoue, un lien « Ouvrir sur YouTube » prend le relais.
>
> Une vidéo YouTube ne démarre automatiquement que si elle est **muette** —
> c'est une règle des navigateurs, pas un réglage du site. Le son s'active
> avec le bouton haut-parleur de la barre de transport.

### « Vidéo non disponible » alors que le lien fonctionne sur YouTube

Ce message vient de YouTube, pas du site. Trois causes, dans l'ordre de
fréquence :

1. **L'intégration est désactivée sur la vidéo.** Dans YouTube Studio :
   la vidéo → *Modifier* → *Afficher plus* → *Autres options* → cochez
   **« Autoriser l'intégration »**. C'est décoché par défaut sur certaines
   vidéos, notamment celles marquées « contenu destiné aux enfants ».
2. **La vidéo est privée.** Une vidéo *non répertoriée* fonctionne ;
   une vidéo *privée* ne s'intègre jamais.
3. **Musique sous droits.** Une réclamation peut bloquer la lecture hors de
   YouTube tout en la laissant passer sur YouTube même.

Le site affiche désormais la cause exacte par-dessus le lecteur, avec la
marche à suivre — inutile d'ouvrir la console.

Par défaut l'intégration passe par `www.youtube.com`. Pour utiliser le domaine
sans cookie, ajoutez dans `data.json` :

```json
"meta": { "youtubeHost": "www.youtube-nocookie.com" }
```

Attention : ce domaine refuse certaines vidéos non répertoriées. Si une vidéo
marche sur l'un et pas sur l'autre, c'est la piste à suivre.

---

## 4 · Ajouter un projet

Dans `data.json`, ajouter un objet au tableau `portfolio.projects` :

```json
{
  "id": "proj-7",
  "track": "V2",
  "title": "Mon Nouveau Projet",
  "year": "2024",
  "role": "Animateur 2D",
  "category": "Publicité",
  "client": "Nom du client",
  "duration": "00:02:30",
  "thumbnail": "assets/thumbs/mon-projet.jpg",
  "timelineImage": "assets/thumbs/mon-projet-large.jpg",
  "preview": "https://youtu.be/K5nq2GuaPBQ",
  "color": "#7ee0d3",
  "tools": ["After Effects", "Illustrator"],
  "context": "Description du projet…",
  "videos": [
    {
      "youtubeId": "https://www.youtube.com/watch?v=K5nq2GuaPBQ",
      "title": "Version longue",
      "duration": "02:30",
      "description": "Texte affiché sous le lecteur."
    }
  ]
}
```

La timeline se recalcule seule. Aucun autre fichier à modifier.

### Champs d'un projet

| Champ           | Obligatoire | Effet                                                                 |
| --------------- | :---------: | --------------------------------------------------------------------- |
| `id`            |      ✔      | Identifiant unique, sert d'URL : `project.html?id=proj-7`              |
| `title`         |      ✔      | Titre affiché sur le clip et la page                                   |
| `track`         |             | `V2` ou `V1` — sur quelle piste poser le clip. Défaut : première piste |
| `year`          |             | Affiché sur le clip et dans l'inspecteur                               |
| `role`          |             | Votre rôle sur le projet                                               |
| `category`      |             | Étiquette en haut du clip                                              |
| `client`        |             | Affiché dans l'en-tête de la page projet                               |
| `duration`      |             | **Détermine la largeur du clip sur la timeline.** Format `hh:mm:ss`    |
| `thumbnail`     |             | Vignette du projet (16:9)                                              |
| `timelineImage` |             | Image de fond du clip sur la timeline, si vous en voulez une différente |
| `preview`       |             | Aperçu muet joué au survol : lien YouTube **ou** `.mp4`. `""` si aucun |
| `color`         |             | Couleur de la tranche gauche du clip                                   |
| `tools`         |             | Liste de logiciels, affichée en bas de la page projet                  |
| `context`       |             | Texte de la note de production                                         |
| `videos[]`      |             | Une ou plusieurs vidéos. Au-delà d'une, un chutier apparaît            |

**Image de fond d'un clip** — le site prend la première disponible dans cet
ordre : `timelineImage`, puis `thumbnail`, puis la miniature YouTube de la
première vidéo du projet. Vous n'êtes donc obligé de fournir aucune image :
un projet avec juste un lien YouTube affiche déjà quelque chose.

> L'ordre du tableau `projects` = l'ordre de gauche à droite sur la timeline.
> Mettez les projets les plus forts en premier.

### « Comment sait-on qu'on peut cliquer ? »

Cinq signaux se cumulent, parce qu'un seul ne suffit jamais :

- un **bouton de lecture** en haut à droite de chaque clip, visible en
  permanence — c'est le repère le plus universel, et le seul qui fonctionne
  sur mobile où il n'y a pas de survol ;
- une **barre d'outils** au-dessus de la timeline avec un point qui pulse et
  la consigne écrite (texte modifiable via `portfolio.hint`) ;
- les clips **apparaissent en cascade** quand la timeline entre à l'écran, et
  le premier reçoit un anneau d'attention autour de son bouton — le mouvement
  attire l'œil là où il faut ;
- au survol : le clip se soulève, son cadre s'allume, l'image reprend ses
  couleurs, le bouton se remplit et la durée cède la place à « Ouvrir ↗ » ;
- le curseur se transforme en cercle avec la mention « ouvrir le clip ».

### Lisibilité du texte

Quelle que soit l'image ou la vidéo que vous mettez — très claire, très
chargée, blanche — le titre reste lisible. Trois protections se cumulent et ne
demandent aucun réglage de votre part : la luminosité de l'image est bridée, un
voile dégradé indépendant de l'image assombrit les zones de texte, et chaque
texte porte sa propre ombre portée. Le voile ne s'atténue pas au survol.

Vous n'avez donc pas à choisir des images sombres : mettez ce qui représente le
mieux le projet.

---

## 5 · Personnalisation courante

| Ce que vous voulez changer            | Où                                                     |
| ------------------------------------- | ------------------------------------------------------ |
| Nom, métier, ville, disponibilité     | `data.json` → `hero`                                   |
| Vidéo du moniteur d'accueil           | `data.json` → `hero.showreelUrl` (YouTube ou `.mp4`)   |
| Fiche technique à droite du moniteur  | `data.json` → `hero.specs[]` (libre, autant de lignes) |
| Photo, bio, chiffres clés, CV         | `data.json` → `about`                                  |
| Logiciels maîtrisés                   | `data.json` → `about.skills[]` (`name`, `role`, `icon`) |
| Nom des pistes de la timeline         | `data.json` → `portfolio.tracks[]`                     |
| Consigne « cliquez un clip »          | `data.json` → `portfolio.hint`                         |
| Email et réseaux sociaux              | `data.json` → `contact`                                |
| **Couleur d'accent de tout le site**  | `data.json` → `meta.accent`                            |
| Nom de séquence en haut de page       | `data.json` → `meta.sequenceName`                      |
| Initiales du logo                     | `data.json` → `meta.initials`                          |

### Réseaux sociaux disponibles

`linkedin`, `vimeo`, `youtube`, `instagram`, `behance`, `twitter`, `tiktok`,
`artstation`, `website`. Toute autre valeur retombe sur l'icône générique.

### Réglages fins de la timeline

Dans `app.js`, l'objet `TL` en tête de la section timeline :

```js
const TL = {
  minW: 215,      // largeur mini d'un clip, en pixels
  maxW: 470,      // largeur maxi
  gap: 14,        // espace entre deux clips d'une même piste
  stagger: 0.5,   // décalage entre pistes — 0 = aligné, 1 = à la suite
  curve: 0.45,    // compression de l'échelle des durées
  zoom: 1
};
```

---

## 6 · Détails de conception

- **Zéro dépendance.** Aucun framework, aucun `npm install`. Trois polices
  Google (Barlow Condensed, JetBrains Mono, Inter) et c'est tout.
- **Accessibilité.** Navigation au clavier, libellés ARIA, contrastes tenus.
  Le curseur personnalisé, le grain et toutes les animations se désactivent
  automatiquement si le système demande un mouvement réduit.
- **Mobile.** La timeline horizontale se replie en pile verticale sous 760 px ;
  le curseur personnalisé disparaît sur écran tactile.
- **Dégradation propre.** Un champ absent dans `data.json` masque simplement
  l'élément concerné plutôt que d'afficher un trou ou une erreur.
- **Si `data.json` ne charge pas**, le site affiche un message « Médias hors
  ligne » expliquant qu'il faut passer par un serveur local.

---

## 7 · Mise en ligne

1. Remplacer les placeholders dans `assets/`.
2. Remplir `data.json` avec les vrais projets et coordonnées.
3. Déposer le dossier (sans `_backup-v1/`) chez l'hébergeur.

Pour une bonne carte de partage sur les réseaux, ajouter dans le `<head>` de
`index.html` :

```html
<meta property="og:title"       content="Prénom Nom — Animateur 2D & Monteur" />
<meta property="og:description" content="Portfolio animation 2D et montage." />
<meta property="og:image"       content="https://votre-domaine.fr/assets/thumbs/showreel-2024.jpg" />
```

---

## 8 · Vidéos Google Drive

Un lien Drive se colle comme un lien YouTube, dans les mêmes champs. Le site
tente d'abord de lire **le fichier d'origine**, ce qui préserve la résolution.
Le lecteur Drive, lui, retranscode et tombe à 360p sur les formats larges — les
écrans de la Défense font 7488×1920, il ne sait pas les gérer.

Si le flux direct échoue (quota Google, écran d'analyse antivirus sur les gros
fichiers), le site bascule automatiquement sur le lecteur Drive **et affiche un
bandeau** prévenant que la qualité est réduite, avec un lien vers la version
d'origine. La page ne casse jamais.

> Pour les vidéos importantes, YouTube en « non répertorié » reste supérieur :
> qualité d'origine, pas de quota, chargement plus rapide. Non répertorié
> signifie invisible dans les recherches et sur la chaîne, accessible seulement
> par le lien.

---

## 9 · Fiche technique dynamique

Dans `hero.specs`, une valeur peut être un **jeton** que le lecteur remplit en
direct :

| Jeton            | Affiche                          |
| ---------------- | -------------------------------- |
| `{{title}}`      | le titre réel de la vidéo YouTube |
| `{{duration}}`   | sa durée                          |
| `{{timecode}}`   | la position de lecture            |
| `{{quality}}`    | la qualité servie (hd1080, etc.)  |

Toute autre valeur reste affichée telle quelle. Sur la page projet,
l'inspecteur se met à jour tout seul quand on change de vidéo dans le chutier.

`footer.credit` accepte `{{year}}`, remplacé par l'année courante — le crédit
ne vieillit plus.

---

## 10 · Protection de l'adresse email

L'adresse n'apparaît jamais en clair dans le code source servi : elle est
encodée et reconstruite au moment du clic. Les aspirateurs à adresses ne la
voient pas, le visiteur ne voit pas la différence. Un clic ouvre le client mail
dans une fenêtre séparée, sans quitter le portfolio ; si aucun client n'est
configuré, l'adresse est copiée dans le presse-papier.

Pour la changer : `contact.email` dans `data.json`, et rien d'autre.
