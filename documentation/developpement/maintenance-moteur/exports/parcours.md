# Vue Parcours pour l'application

La vue Parcours (`v=parcours` dans l'URL) prépare les parcours de l'application
MathALÉA (mathalea-mobile) : une bibliothèque de parcours par niveau, les classes
qui les reçoivent, les objectifs travaillés, et un fichier à publier dans le
dossier partagé des élèves. Elle est accessible depuis « Plus d'exports »
(« Parcours pour l'application ») sur la page d'accueil. Tout reste dans le
navigateur : la bibliothèque est enregistrée dans `localStorage`
(`mathalea-parcours-bibliotheque`), rien n'est envoyé à un serveur.

## Principe

1. **On crée pour un niveau, on donne à une classe.** L'éditeur ne contient pas
   les classes : la vue Classes attribue les parcours et règle leur ordre.
2. **Exercices** : « Ajouter des exercices » ouvre la fenêtre d'ajout du site
   (`TypstAddExerciseModal`) en pleine page, au niveau et au chapitre du
   parcours, réglages dépliés. Seuls les exercices interactifs entrent dans un
   parcours. La feuille composée sur la page d'accueil s'ajoute aussi d'un clic.
3. **Organisation** : liste simple, paliers numérotés ou ceintures (première
   ceinture au choix). « Paliers » propose un palier par objectif. Pour chaque
   palier : titre, accès (au moins N % au palier précédent, ou ouvert à tout
   moment), ressource pour revoir (lien), pause après le palier (texte et
   document lié). Les exercices se glissent d'un palier à l'autre ; les flèches
   franchissent aussi les bords des paliers.
4. **Objectifs** : chaque exercice reçoit l'objectif du programme sous lequel le
   référentiel le range (`listerExercices` du moteur, code comme `5N2G`). La vue
   Objectifs importe des listes (CSV `code;libellé;niveau;chapitre`, texte collé,
   fichier `objectifs-mathalea/1`) au fil de l'année, sans doublon.
5. **Publier** télécharge `parcours-mathalea-<date>.json` (format
   `classes-mathalea/1`) : les classes et leurs parcours pour les élèves, et
   toute la bibliothèque (parcours sans classe, objectifs). « Ouvrir » ou un
   fichier déposé sur la page reprend une bibliothèque publiée ici ou par
   l'application, sans rien effacer.

Le schéma du parcours (colonne de droite sur grand écran, repliable ailleurs)
montre les paliers, leurs exercices, les conditions d'accès et les pauses ; un
clic mène à la partie correspondante de l'éditeur.

## Format

Les clés du JSON sont celles de l'application (français) ; elles ne se
traduisent pas. Un parcours garde ses étapes en une seule liste ; `paliers`
donne le nombre d'exercices de chacun, si bien qu'une ancienne version de
l'application affiche simplement tout le parcours. Champs propres aux
paliers : `acces` (`libre` ou `seuil`), `seuil`, `ressource`, `pause` ; au
parcours : `style` (`paliers` ou `ceintures`), `premiereCeinture`.

## Fichiers

| Fichier                                                   | Rôle                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `src/components/setup/parcours/Parcours.svelte`           | La vue : bibliothèque, onglets, ouvrir et publier            |
| `src/components/setup/parcours/ParcoursEditor.svelte`     | Éditeur d'un parcours (paliers, objectifs, glisser-déposer)  |
| `src/components/setup/parcours/ParcoursSchema.svelte`     | Schéma du parcours                                           |
| `src/components/setup/parcours/ParcoursClasses.svelte`    | Classes, attribution et ordre                                |
| `src/components/setup/parcours/ParcoursObjectives.svelte` | Objectifs : import CSV, liste, exercices qui les travaillent |
| `src/components/setup/parcours/ExerciseSettings.svelte`   | Réglages d'un exercice du parcours                           |
| `src/components/setup/parcours/ExercisePreview.svelte`    | Aperçu élève (moteur de l'application)                       |
| `src/lib/parcours/`                                       | Format, bibliothèque, édition, objectifs, référentiel        |

La fenêtre d'ajout (`TypstAddExerciseModal`, `TypstExercisePreview`) accepte des
options facultatives pour cette vue (chemin d'arrivée, pleine page, réglages
dépliés, libellés) ; les autres vues n'en changent pas.

## Tests

- `tests/unit/parcours.test.ts` : paliers (découpage, déplacements, contrôles),
  bibliothèque (attribution, versions, publication, reprise), objectifs (CSV),
  ceintures et icônes, objectif du programme lu dans le référentiel.
