# Créer un custom element (convention MathALÉA)

Ce guide impose le pattern à suivre pour tout nouveau custom element du projet.

Objectif : avoir une API homogène pour l'injection HTML, la mise à jour d'affichage, la sérialisation de la réponse élève et la désactivation de l'interactivité.

## Classe de base

Toute nouvelle classe doit étendre `MathaleaCustomElement` dans `src/lib/customElements/MathaleaCustomElement.ts`.

L'implémentation du custom element doit être placée dans `src/lib/customElements/`. Les helpers métier qui appellent `create(...)` ou encapsulent le composant peuvent rester dans un autre dossier (`src/lib/interactif/`, `src/lib/tableur/`, etc.) si cela clarifie l'API utilisée par les exercices.

Exemple de signature minimale :

```ts
export class MonElement extends MathaleaCustomElement {
  static readonly elementTag = 'mon-element'
}
```

## Règles obligatoires

1. Héritage

- La classe étend `MathaleaCustomElement`.
- Le tag est déclaré via `static readonly elementTag`.
- Le fichier de la classe se trouve dans `src/lib/customElements/`.

2. Méthode statique create

- `create(...)` retourne la chaîne HTML à injecter dans l'énoncé.
- `create(...)` sert pour les usages métiers visibles.
- Les attributs doivent être passés en camelCase, la base les convertit en kebab-case.

3. Méthode render contextuelle

- En HTML : `render()` met à jour le DOM du composant.
- En LaTeX : `render()` retourne la variante LaTeX si elle existe, sinon une chaîne vide.
- Pour la partie LaTeX, implémenter `renderLatex()` quand nécessaire.

4. Propriété value

- Le getter `value` retourne l'état métier du composant (réponse élève).
- Le setter `value` réinjecte un état (correction figée, restitution Capytale, reprise de session).
- Le type exact dépend du composant, mais la propriété s'appelle toujours `value`.

5. Propriété interactivityOn

- `interactivityOn` permet de rendre le composant inerte sans perdre son affichage.
- Le composant doit appliquer cet état à ses contrôles (inputs, boutons, drag, listeners actifs).

6. Lifecycle DOM

- `connectedCallback()` installe le composant et appelle `render()`.
- `disconnectedCallback()` nettoie les listeners et ressources externes.

## Cas spécial : élément technique non visible

Si un composant doit être créé comme objet DOM technique (tests, vérifications hors affichage), ne pas détourner `create(...)`.

Utiliser une méthode dédiée, par exemple :

- `createEltToAppendToDom(...)`

Ce nommage évite de mélanger :

- API HTML standard (`create`) ;
- API technique d'instanciation DOM interne.

## Checklist avant merge

- Le composant étend `MathaleaCustomElement`.
- `elementTag` est défini.
- `create(...)` existe et est utilisée par les helpers d'injection.
- `value` (getter/setter) est implémentée et testée.
- `interactivityOn` est respectée.
- `connectedCallback()` et `disconnectedCallback()` sont propres.
- Le rendu non HTML est défini (`renderLatex()` ou chaîne vide assumée).

## Migration d'un composant existant

Ordre recommandé :

1. Faire hériter la classe de `MathaleaCustomElement`.
2. Ajouter `elementTag`.
3. Introduire `create(...)` et rebrancher le helper historique (`addXxx`) dessus.
4. Déplacer la classe dans `src/lib/customElements/` si elle vivait ailleurs.
5. Uniformiser `value` et `interactivityOn`.
6. Ajouter le nettoyage dans `disconnectedCallback()`.
7. Vérifier les usages dans les fichiers de vérification interactive.

## Fichiers utiles

- Base : `src/lib/customElements/MathaleaCustomElement.ts`
- Interactivité (référence) : `../reference/systeme-interactivite.md`
- Guide général interactivité : `rendre-un-exercice-interactif.md`
