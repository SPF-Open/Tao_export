# Format

**Modifiez l'intitulé d'une question.** Format ouvre un export TAO QTI, vous permet de choisir une question et de réécrire son intitulé à la main — avec détection automatique des listes à puces et des sauts de ligne, et un aperçu en direct — puis vous retourne le même ZIP, prêt à être réimporté dans TAO.

## Fonctionnement

Format lit chaque question de votre `.zip` QTI et les liste dans le panneau latéral. Choisissez-en une pour modifier son intitulé (le texte d'introduction/de contexte affiché avant les choix de réponse) sous forme de texte brut : les lignes commençant par `•` ou `-` deviennent une véritable liste à puces, et tout autre saut de ligne devient un saut de ligne dans la question affichée. Un aperçu en direct montre exactement à quoi ressemblera le résultat avant l'export.

## Utilisation de Format

1. **Importez** votre export TAO QTI `.zip`.
2. **Choisissez une question** dans la liste du panneau latéral.
3. **Modifiez l'intitulé** dans le panneau de texte — l'aperçu se met à jour au fur et à mesure.
4. Répétez l'opération pour chaque question que vous souhaitez modifier.
5. Cliquez sur **Export ZIP**, puis **Téléchargez** la nouvelle archive. Son nom est complété par `-stems` (par exemple `exam.zip` → `exam-stems.zip`).
6. **Réimportez** le `-stems.zip` dans TAO.

## Remarques

- Seul l'intitulé de la question est modifiable — les choix de réponse restent inchangés.
- Les questions sans intitulé reconnaissable (par exemple une page d'instructions) apparaissent quand même dans la liste, mais leur éditeur est désactivé.
- Seule la mise en forme que vous créez ici (listes à puces et sauts de ligne) est appliquée ; toute autre mise en forme déjà présente dans l'export (par exemple du texte en gras) est réduite à du texte brut dès que vous modifiez l'intitulé de cette question.
- Le traitement est entièrement côté client — le ZIP ne quitte jamais votre navigateur.
