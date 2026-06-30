# Library

**Banque de questions.** Library construit une base de données SQLite portable de questions à partir de vos exports TAO et de vos fichiers Excel, puis vous permet d'y effectuer des recherches instantanées — le tout dans votre navigateur.

## Fonctionnement

Library maintient une base de données SQLite `.taodb` de questions que vous pouvez enrichir au fil du temps, filtrer et transporter d'une machine à l'autre sous forme d'un fichier portable unique. La base de données réside dans votre navigateur (OPFS) et survit donc à un rechargement de page.

## Les trois onglets

- **Database** — créez, ouvrez et exportez votre bibliothèque `.taodb` portable. Vous pouvez définir, modifier ou supprimer un mot de passe ; les fichiers exportés sont alors chiffrés avec AES-GCM et illisibles sans celui-ci.
- **Import** — intégrez du contenu dans la bibliothèque à partir d'exports TAO `.zip`, de fichiers Excel, ou d'un ZIP enrichi de compétences Excel.
- **Search** — interrogez la banque instantanément et affinez les résultats grâce aux filtres dans la barre latérale gauche. Les utilisateurs avancés peuvent ouvrir la fenêtre **SQL query** pour des requêtes directes.

## Utilisation de Library

1. Dans **Database**, créez une nouvelle bibliothèque ou ouvrez un fichier `.taodb` existant.
2. Dans **Import**, ajoutez vos exports TAO et/ou vos fichiers Excel pour la remplir.
3. Dans **Search**, trouvez des questions et affinez avec les filtres.
4. De retour dans **Database**, **exportez** la bibliothèque pour la sauvegarder ou la partager (optionnellement protégée par mot de passe).

## Notes

- Une base de données en mémoire (non persistante) contenant du contenu non sauvegardé vous avertira avant que vous fermiez ou actualisiez la page — exportez-la d'abord.
- Tout s'exécute côté client ; votre banque de questions ne quitte jamais votre navigateur.
