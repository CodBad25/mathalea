# Banques d'exercices externes

MathALÉA permet d'ajouter ses propres banques d'exercices statiques, en plus de
celles fournies avec le site. Une fois ajoutée, la banque apparaît dans
« Ressources partenaires » et ses exercices se sélectionnent comme les autres.

Le point d'entrée est le bouton **« Ajouter une banque d'exercices »**, en
dernière position de la rubrique « Ressources partenaires » du menu latéral. Il
ouvre la fenêtre qui sert aussi à retirer une banque déjà installée.

## Deux provenances

| Provenance                                                          | Comment                   | Partage par lien                               |
| ------------------------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| Archive `.zip`                                                      | Déposée depuis la machine | Non : la banque n'existe que sur ce navigateur |
| Dépôt de [forge.apps.education.fr](https://forge.apps.education.fr) | En collant l'URL du dépôt | Oui                                            |

Une archive est conservée dans le navigateur (IndexedDB) et rechargée
automatiquement aux visites suivantes ; un dépôt de forge est relu à chaque
démarrage, ce qui fait remonter les mises à jour de son auteur.

Le dépôt doit être **public**. MathALÉA lit ses fichiers par l'API GitLab, qui
autorise les requêtes venant d'un autre site ; aucun réglage n'est à faire côté
dépôt (ni GitLab Pages, ni configuration CORS). Les formes d'URL acceptées :

```
https://forge.apps.education.fr/mon-groupe/ma-banque
https://forge.apps.education.fr/mon-groupe/ma-banque.git
https://forge.apps.education.fr/mon-groupe/ma-banque/-/tree/une-autre-branche
https://forge.apps.education.fr/mon-groupe/ma-banque/-/tree/main/un-sous-dossier
```

MathALÉA cherche `manifest.json` à la racine du dépôt puis, s'il ne l'y trouve
pas, dans son sous-dossier `dist/` : un dépôt de sources dont le `manifest.json`
n'est publié que dans ce dossier (build généré par une CI, par exemple) n'a donc
besoin d'aucune URL particulière. Les deux dernières formes ne servent que pour
lire une autre branche que `main`, ou un sous-dossier autre que `dist/`.

## Partager un lien

Quand une sélection contient des exercices venant d'un dépôt de forge, le lien
produit par MathALÉA porte un paramètre `bq` désignant ce dépôt : le
destinataire voit les exercices sans avoir à installer la banque, et sa propre
liste de banques n'est pas modifiée.

Les banques déposées en `.zip` ne peuvent pas suivre un lien — elles ne sont
présentes que sur la machine qui les a importées. Pour partager une banque,
publiez-la sur la forge.

## Format d'une banque

Une banque est un dossier (ou une archive) contenant un `manifest.json` à sa
racine, et les fichiers qu'il référence :

```
manifest.json
png/somme-de-fractions.png
png/somme-de-fractions_cor.png
typ/somme-de-fractions.typ
tex/somme-de-fractions.tex
```

### `manifest.json`

```json
{
  "schema": "mathalea-banque-v1",
  "id": "ma-banque",
  "titre": "Ma banque d'exercices",
  "auteur": "Prénom Nom",
  "licence": "CC BY-SA 4.0",
  "version": "1.0.0",
  "description": "Quelques mots sur la banque.",
  "exercices": [
    {
      "id": "somme-de-fractions",
      "titre": "Somme de deux fractions",
      "categorie": "Nombres et calculs",
      "sousCategorie": "Fractions",
      "tags": ["fractions", "addition"],
      "etoiles": 2,
      "png": "png/somme-de-fractions.png",
      "pngCor": "png/somme-de-fractions_cor.png",
      "typ": "typ/somme-de-fractions.typ",
      "typCor": "typ/somme-de-fractions_cor.typ",
      "tex": "tex/somme-de-fractions.tex",
      "texCor": "tex/somme-de-fractions_cor.tex"
    }
  ]
}
```

Champs de la banque :

| Champ                                         | Obligatoire | Rôle                                                                                                                                                                 |
| --------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`                                      | oui         | doit valoir `mathalea-banque-v1`                                                                                                                                     |
| `id`                                          | oui         | identifiant court (lettres, chiffres, `.`, `_`, `-`) ; il entre dans les uuid des exercices, donc dans les liens partagés                                            |
| `titre`                                       | oui         | nom du nœud affiché dans « Ressources partenaires »                                                                                                                  |
| `auteur`, `licence`, `version`, `description` | non         | `auteur` figure aussi en attribution discrète sous chaque exercice de la banque (vues prof et élève) ; les quatre sont affichés dans la liste des banques installées |
| `exercices`                                   | oui         | liste des exercices, non vide                                                                                                                                        |

Champs d'un exercice :

| Champ                        | Obligatoire | Rôle                                                                                                             |
| ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`                         | oui         | identifiant unique dans la banque ; figer sa valeur garde les liens partagés valides                             |
| `titre`                      | oui         | intitulé affiché dans le menu                                                                                    |
| `categorie`, `sousCategorie` | non         | deux niveaux de regroupement dans le menu ; sans eux l'exercice est placé directement sous le titre de la banque |
| `tags`                       | non         | étiquettes affichées sous le titre                                                                               |
| `etoiles`                    | non         | difficulté de 0 à 5, affichée en étoiles                                                                         |
| `png`, `pngCor`              | —           | images de l'énoncé et de la correction, affichées dans les vues HTML et A4                                       |
| `typ`, `typCor`              | —           | sources Typst, utilisées à la place des images dans la vue Typst (l'utilisateur peut alors modifier l'exercice)  |
| `tex`, `texCor`              | —           | sources LaTeX (fragments, sans `\documentclass`), reprises dans les exports LaTeX et PDF                         |

Un exercice doit fournir au moins l'un de `png`, `typ` ou `tex`. En pratique,
`png` est ce que voient les vues HTML : une banque sans image ne s'affichera que
dans les vues Typst ou LaTeX correspondantes.

Tous les chemins sont **relatifs à la racine de la banque**. Les chemins
absolus, les URLs et les remontées `..` sont refusés.

## Fabriquer une banque

Un modèle de banque (arborescence de sources, script de construction autonome
en bash, README détaillé) est maintenu hors de ce dépôt ; la page d'aide
[coopmaths.fr/www/aide/banque-exercices](https://coopmaths.fr/www/aide/banque-exercices)
— également accessible via l'icône d'aide en haut à gauche de la modale —
pointe vers ce modèle et détaille la marche à suivre.

Le principe général : une arborescence `sources/` de fichiers `.typ` et/ou
`.tex`, dont les dossiers donnent les catégories, avec un en-tête de
commentaires en tête de chaque fichier (`//` en Typst, `%` en LaTeX) pour le
titre, les étiquettes et les étoiles :

```typst
// titre: Somme de deux fractions
// tags: fractions, addition
// etoiles: 2
```

Un script de construction compile les png (CLI `typst`, ou `pdflatex` +
`pdftoppm` pour les sources LaTeX), copie les sources et écrit le
`manifest.json`.

## Où cela se branche dans le code

| Fichier                                                                                     | Rôle                                                                        |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/lib/types/banquesExternes.ts`                                                          | types du manifest et des provenances                                        |
| `src/lib/components/banquesExternes.ts`                                                     | validation du manifest, uuid `bq-…`, construction du référentiel            |
| `src/lib/stores/banquesExternesStore.ts`                                                    | chargement zip/forge (avec repli `dist/`), persistance, référentiel courant |
| `src/lib/stores/banquesExternesDb.ts`                                                       | archives zip en IndexedDB                                                   |
| `src/main.ts`                                                                               | chargement des banques avant le premier rendu                               |
| `src/components/setup/start/presentationalComponents/sideMenu/BanquesExternesDialog.svelte` | interface d'ajout et de retrait, bouton d'aide                              |
