# Portfolio — Animateur 2D & Monteur Vidéo

## Structure du projet

```
pfolio/
├── index.html          ← Structure HTML (ne jamais modifier)
├── styles.css          ← Thème dark premium
├── app.js              ← Moteur JS dynamique
├── data.json           ← ✅ SEUL FICHIER À MODIFIER
└── assets/
    ├── profile.jpg     ← Photo de profil
    ├── cv-johndoe.pdf  ← CV au format PDF
    ├── thumbs/         ← Miniatures des projets (16:9 recommandé)
    │   ├── showreel-2024.jpg
    │   └── ...
    └── icons/          ← Icônes des logiciels (SVG ou PNG, 18×18px)
        ├── ae.svg
        └── ...
```

## Comment lancer le site

> Ouvrir `index.html` directement dans le navigateur **ne fonctionnera pas** à cause du `fetch('data.json')`.
> Il faut un serveur local minimal.

**Option 1 — VS Code Live Server** (recommandé)
Installez l'extension *Live Server* et cliquez sur "Go Live".

**Option 2 — Python**

```bash
python -m http.server 8080
# puis ouvrir http://localhost:8080
```

**Option 3 — Node.js (npx)**

```bash
npx serve .
```

---

## Ajouter un projet (sans toucher au code)

Ouvrez `data.json` et ajoutez un objet dans le tableau `portfolio.projects` :

```json
{
  "id": "proj-7",
  "title": "Mon Nouveau Projet",
  "year": "2024",
  "role": "Animateur 2D",
  "category": "Publicité",
  "thumbnail": "assets/thumbs/mon-projet.jpg",
  "youtubeId": "YOUTUBE_VIDEO_ID",
  "context": "Description du projet..."
}
```

La grille s'adapte **automatiquement**. Aucune modification de HTML ou JS nécessaire.

---

## Personnalisation

| Ce que vous voulez changer      | Où le modifier                               |
| ------------------------------- | --------------------------------------------- |
| Nom, métier, showreel          | `data.json` → section `hero`             |
| Photo, bio, CV, compétences    | `data.json` → section `about`            |
| Projets                         | `data.json` → `portfolio.projects[]`     |
| Email, réseaux sociaux         | `data.json` → section `contact`          |
| Couleur accent (or par défaut) | `styles.css` → variable `--clr-accent`   |
| Police d'affichage              | `styles.css` → variable `--font-display` |
