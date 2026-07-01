# Format

**Mise en forme automatique de chaque question, avec aperçu et ajustement.** Format ouvre un export TAO QTI et, lors de l'export, met automatiquement en forme chaque question : les listes à puces et les sauts de ligne sont détectés dans chaque intitulé, et chaque intitulé de réponse (prompt) encore en texte brut est mis en gras. Choisissez d'abord une question si vous souhaitez prévisualiser ou ajuster son résultat avant l'export.

## Fonctionnement

Format lit chaque question de votre `.zip` QTI et les liste dans le panneau latéral. L'export applique deux passes automatiques à l'ensemble du package :

- **Mise en forme de l'intitulé** — dans le texte d'introduction/de contexte de chaque question (affiché avant les choix de réponse), les lignes commençant par `•` ou `-` deviennent une véritable liste à puces, et tout autre saut de ligne devient un saut de ligne dans la question affichée.
- **Mise en gras des prompts** — chaque prompt encore en texte brut est mis en gras, selon la convention de TAO. Les prompts contenant déjà une mise en forme sont laissés tels quels.

Il n'est pas nécessaire d'ouvrir une question pour que ces deux traitements s'appliquent : ils s'exécutent sur chaque question lors de l'export. Ouvrir une question permet de prévisualiser exactement le rendu de son intitulé, et de modifier le texte à la main si la détection automatique a manqué quelque chose ou si vous souhaitez un résultat différent.

## Utilisation de Format

1. **Importez** votre export TAO QTI `.zip`.
2. *(Facultatif)* **Choisissez une question** dans la liste du panneau latéral pour prévisualiser son intitulé mis en forme automatiquement, et modifiez le texte si vous souhaitez l'ajuster — l'aperçu se met à jour au fur et à mesure.
3. Cliquez sur **Export ZIP**. L'intitulé de chaque question est mis en forme automatiquement (en utilisant votre texte modifié pour toute question que vous avez ajustée) et chaque prompt en texte brut est mis en gras.
4. **Téléchargez** la nouvelle archive. Son nom est complété par `-stems` (par exemple `exam.zip` → `exam-stems.zip`).
5. **Réimportez** le `-stems.zip` dans TAO.

## Remarques

- Seul l'intitulé de la question est modifiable — les choix de réponse restent inchangés.
- Les questions sans intitulé reconnaissable (par exemple une page d'instructions) apparaissent quand même dans la liste, mais leur éditeur est désactivé ; elles ne sont pas concernées par la mise en forme de l'intitulé (la mise en gras des prompts s'applique tout de même si pertinent).
- Seule la mise en forme que vous créez ici (listes à puces et sauts de ligne) est appliquée ; toute autre mise en forme déjà présente dans un intitulé (par exemple du texte en gras) est réduite à du texte brut dès que cet intitulé passe par la mise en forme automatique.
- Le traitement est entièrement côté client — le ZIP ne quitte jamais votre navigateur.
