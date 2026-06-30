# Audit

**Vérification de conformité.** Audit compare un export TAO QTI avec la source Excel
à partir de laquelle il a été généré, et signale chaque différence par niveau de gravité,
afin de confirmer que l'examen exporté correspond fidèlement à sa source.

## Ce que ça fait

Audit lit les deux fichiers, fait correspondre les questions par leur ordre/position (l'export TAO
est généré depuis l'Excel, ils partagent donc l'ordre et le nombre), et signale toute
différence dans les titres, énoncés et réponses — classée en critique, majeure ou
mineure.

## Utiliser Audit

1. **Chargez l'export TAO `.zip`**. Ses questions sont analysées et comptées.
2. **Chargez la source Excel** et sélectionnez la **feuille** à comparer.
3. **Choisissez le modèle** (par exemple FIN / OLD_BOSA / OLD_FIN) pour que l'Excel soit
   lu de la même manière que la route Import le fait. Optionnellement, **ignorez les titres** si
   seuls les énoncés et les réponses importent.
4. **Lancez** l'audit et examinez les résultats.

## Lire les résultats

Les différences sont classées par niveau de gravité :

- **Critique (bloquant)** — différences de données importantes, y compris les questions sans correspondance
  et les écarts de comptage Excel↔QTI. Ces cas font échouer l'audit.
- **Majeur** — écarts significatifs.
- **Mineur** — petites différences de mise en forme ou de présentation.

Vous pouvez exporter le rapport (JSON, Markdown, HTML ou CSV) et l'imprimer avec tous les
détails, une question par page.

## Notes

- Audit réutilise le parseur et les modèles d'Import, donc un classeur qui s'importe
  correctement s'audite correctement.
- Les deux fichiers sont traités entièrement dans votre navigateur.
