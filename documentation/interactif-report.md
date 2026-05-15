# Rapport Interactif - Analyse Runtime

Analyse runtime des exercices modifiés qui exportent `interactifReady = true`.

**Tags:**
- `autoCorrection-interactive-absente`: exercice interactif prêt mais `autoCorrection` reste vide après génération
- `erreur-runtime`: erreur lors de l’instanciation ou de la génération
- `timeout-exercice`: génération interrompue après dépassement du timeout

| Numéro | Fichier | Titre | Tags | Notifications Bugsnag |
| --- | --- | --- | --- | --- |
| 1 | [src/exercices/1e/1A-C15-2.ts](src/exercices/1e/1A-C15-2.ts) |  |  | aLeBonNombreDePropsDifferentes : J'ai trouvé 1 doublons. Il en reste 3 réponses différentes et j'en voulais 4, J'ai supprimé les doublons suivants : à l'indice 0 j'ai \frac{1}{8}\text{ du crédit.} et à l'indice 1 j'ai \frac{1}{8}\text{ du crédit.}, je supprime la réponse à l'indice 1 et je garde celle à l'indice 0 |
| 2 | [src/exercices/6e/6N31-8.js](src/exercices/6e/6N31-8.js) |  |  | AddTabDbleEntryMathlive a besoin absolument d'un numero d'exercice |
| 3 | [src/exercices/modèlesExos/Tuto_Exo_Simple.ts](src/exercices/modèlesExos/Tuto_Exo_Simple.ts) |  |  | Un exercice simple doit avoir un this.reponse sauf si c'est un qcm |
