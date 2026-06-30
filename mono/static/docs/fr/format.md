# Format

**Mise en gras des questions.** Format prend un export TAO QTI et vous retourne le même ZIP avec chaque intitulé de question mis en gras — prêt à être réimporté dans TAO.

## Fonctionnement

Certains examens sont plus lisibles lorsque l'intitulé de la question se distingue. Format ouvre votre `.zip` QTI, repère chaque intitulé en texte brut, le met en gras, puis repackage l'archive sans toucher au reste.

## Utilisation de Format

1. **Importez** votre export TAO QTI `.zip`.
2. Cliquez sur **Run** (le formateur traite chaque question du package).
3. Consultez le récapitulatif des résultats — il indique combien d'intitulés ont été mis en gras sur le total.
4. **Téléchargez** la nouvelle archive. Son nom est complété par `-bold` (par exemple `exam.zip` → `exam-bold.zip`).
5. **Réimportez** le `-bold.zip` dans TAO.

## Remarques

- Les intitulés contenant déjà une mise en forme ne sont pas modifiés ; le récapitulatif indique combien ont été réellement traités.
- Le traitement est entièrement côté client — le ZIP ne quitte jamais votre navigateur.
