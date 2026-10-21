# Probabilités

Ce guide fixe la notation et les consignes des exercices de probabilités
(`1A-P05-*`, et les exercices de probabilité conditionnelle).

## Notation

- Une probabilité s'écrit avec un `P` majuscule : `P(B)`, `P_A(B)`,
  `P(A \cap C)`, `P_{\overline A}(B)`. Ne jamais écrire `p(B)` ni `p_A(B)`.
- Les événements sont désignés par une lettre majuscule, éventuellement
  indicée : `A_1`, `S`, `\overline{S}`.
- Dans une phrase, « la probabilité » reste au féminin, mais la notation
  `P(B)` désigne un nombre et son participe s'accorde au masculin :
  « $P(B)$ est égal à : » (et non « la probabilité $P(B)$ est égal »).

## Consignes en saisie libre

Dans une partie non QCM, la dernière phrase demande la valeur de la probabilité
à calculer, sans question de forme « Quelle est la probabilité… ? » :

- en non interactif : « Calculer $P(B)$. » ;
- en interactif : « $P(B)=$ » suivi du champ de saisie, sur la même ligne.

```ts
this.enonceCourt = () =>
  this.enonce.replace(
    /La probabilité de l'événement \$B\$ est: \s*$/,
    this.interactif ? '$P(B)=$' : 'Calculer $P(B)$.',
  )
this.champReponseCourteEnLigne = true
```

Le champ est placé à la suite de la consigne grâce à `champReponseCourteEnLigne`
(voir [Conserver un QCM en option](interactivite-simple.md#conserver-un-qcm-en-option)).

## Saisie de la réponse

- Clavier : `clavierDeBaseAvecFraction` pour une fraction, `clavierNumbers`
  pour un décimal positif.
- Comparaison : `compareReponseCourte` avec `fractionEgale` pour une fraction,
  `nombreDecimalSeulement` pour un nombre.
- Pas de `amcType` (voir [Export AMC](complements/export-amc.md#type-amc-et-saisie-libre)).

Exemples : `src/exercices/1e/1A-P05-1.ts` à `1A-P05-6.ts`.
