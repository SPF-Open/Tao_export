# Editor

**Ouvrez un export TAO QTI et modifiez tout d'une question.** Editor lit un
`.zip` exporté depuis TAO et permet de modifier le prompt, les réponses, la
limite de caractères des questions ouvertes et les métadonnées — dans un
formulaire convivial ou directement en XML brut — puis d'exporter un ZIP
prêt à réimporter dans TAO.

## Fonctionnement

Editor liste chaque question de votre `.zip` QTI dans le panneau latéral.
Sélectionner une question l'ouvre dans un éditeur à deux modes :

- **Mode simple** — un formulaire pour les champs de la question : le
  prompt/intitulé, le texte de chaque choix de réponse, quelle(s) réponse(s)
  est/sont correcte(s), un score par choix, une limite de caractères pour
  les questions ouvertes, et une section **Métadonnées** couvrant le titre,
  le label et la langue de la question, les options TAO du test par
  question (zoom, calculatrice, surlignage, écran de révision,
  avertissements — quand le paquet contient un `test.xml`), et les
  métadonnées LOM du `imsmanifest.xml` quand il est présent.
- **Mode XML brut** — le XML de la question, modifiable directement. Quand
  le paquet contient un `test.xml` et/ou un `imsmanifest.xml`, des onglets
  séparés permettent d'éditer les sections concernées de ces fichiers
  également. Repasser en mode simple relit le XML courant, les deux vues
  restent donc toujours synchronisées.

Chaque modification est appliquée comme un changement ciblé dans le texte
XML d'origine — tous les autres octets du paquet (attributs, traitement des
réponses, tout ce pour quoi Editor n'affiche pas de champ) restent
inchangés, afin que le paquet exporté reste importable dans TAO.

## Utilisation d'Editor

1. **Importez** votre export TAO QTI `.zip`.
2. **Choisissez une question** dans la liste du panneau latéral.
3. Modifiez-la en mode **Simple**, ou passez en **XML brut** pour un
   contrôle complet.
4. Cliquez sur **Exporter le ZIP**.
5. **Téléchargez** la nouvelle archive (son nom est complété par
   `-edited`) et **réimportez-la** dans TAO.

## Remarques

- La sélection de la "bonne réponse" se fait par choix unique ou multiple,
  selon la cardinalité propre à la question.
- Seuls les choix de réponse existants peuvent être modifiés — il n'est pas
  possible d'en ajouter ou d'en supprimer.
- Le champ de limite de caractères correspond à la contrainte de réponse de
  la question ouverte ; le vider retire la limite.
- Le support des métadonnées LOM/manifest est fourni au mieux : les exports
  TAO réels n'embarquent pas ces métadonnées de façon fiable, donc Editor
  affiche ce qu'il trouve et permet d'ajouter un bloc minimal de départ
  quand il n'y en a pas. Réimportez le paquet exporté dans TAO pour le
  vérifier avant de vous y fier.
- Une question avec un type d'interaction non pris en charge apparaît quand
  même dans la liste ; le mode simple affiche un avertissement et le mode
  XML brut reste pleinement disponible.
- Le traitement est entièrement côté client — le ZIP ne quitte jamais votre
  navigateur.
