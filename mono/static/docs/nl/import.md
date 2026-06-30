# Import

**Excel naar TAO.** Import zet een onbewerkte Excel-werkmap met vragen om in een overzichtelijke, voorbeelbare TAO-vragenset door elke kolom van het werkblad te koppelen aan een vraagveld.

## Wat het doet

Je laadt een `.xlsx` / `.xls` werkmap, vertelt Import welke kolommen de titel, de vraagstelling, het juiste antwoord en de competentiemetadata bevatten, waarna het werkblad wordt omgezet in gestructureerde vragen die je kunt bekijken voordat je ze elders in TAO gebruikt.

## Import gebruiken

1. **Sleep je werkmap** naar de dropzone (of blader ernaar). Het werkblad wordt volledig in je browser ingelezen.
2. **Kies het werkblad** dat je wilt verwerken als de werkmap er meerdere heeft.
3. **Wijs de kolommen toe** in de linker zijbalk:
   - **Title**, **Prompt**, **Correct** — de kernvelden van de vraag.
   - **Competency**, **Indicator** en de **competentie- / beheersingsbeschrijvingen**
     — optionele metadata voor rapportage.
4. **Stel de verwerking in** met de opties **offset**, **skip-row** en **alternative**
   zodat de parser op de juiste rij begint en antwoordalternatieven correct leest.
5. **Bekijk een voorbeeld** van de verwerkte vragen aan de rechterkant. Schakel **Show / hide answers**
   in of uit met de oogknop, en open de **meta matrix** om de competentiedekking over de set te controleren.

## Tips

- Dezelfde parser (`Question.parseSheet`) wordt gebruikt in de Audit-route, dus een werkmap die probleemloos importeert, wordt ook probleemloos gecontroleerd.
- Alles wordt verwerkt aan de clientzijde — je werkmap verlaat nooit je computer.
