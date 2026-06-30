# Import

**Excel vers TAO.** Import transforme un classeur Excel brut de questions en un
ensemble de questions TAO propre et prévisualisable, en associant chaque colonne
de la feuille à un champ de question.

## Ce que ça fait

Vous chargez un classeur `.xlsx` / `.xls`, indiquez à Import quelles colonnes
contiennent le titre, l'énoncé, la bonne réponse et les métadonnées de
compétence, et il analyse la feuille en questions structurées que vous pouvez
prévisualiser avant de les utiliser ailleurs dans TAO.

## Utiliser Import

1. **Déposez votre classeur** dans la zone de dépôt (ou parcourez vos fichiers).
   La feuille est lue entièrement dans votre navigateur.
2. **Choisissez la feuille** à analyser si le classeur en contient plusieurs.
3. **Mappez les colonnes** dans la barre latérale gauche :
   - **Title**, **Prompt**, **Correct** — les champs principaux de la question.
   - **Competency**, **Indicator** et les **descriptions de compétence / maîtrise**
     — métadonnées optionnelles utilisées pour les rapports.
4. **Affinez l'analyse** avec les options de **décalage de ligne** (offset),
   **saut de ligne** (skip-row) et **alternative** pour que l'analyseur démarre
   sur la bonne ligne et lise correctement les alternatives de réponse.
5. **Prévisualisez** les questions analysées à droite. Activez ou désactivez
   **Afficher / masquer les réponses** avec le bouton œil, et ouvrez la
   **matrice méta** pour examiner la couverture des compétences sur l'ensemble.

## Conseils

- Le même analyseur (`Question.parseSheet`) alimente la route Audit : un classeur
  qui s'importe sans erreur s'auditera également sans erreur.
- Tout s'exécute côté client — votre classeur ne quitte jamais votre machine.
