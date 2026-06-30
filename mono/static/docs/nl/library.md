# Library

**Vragenbank.** Library bouwt een draagbare SQLite-vraagdatabase op basis van uw
TAO-exports en Excel-bestanden, en laat u er onmiddellijk in zoeken — volledig in uw browser.

## Wat het doet

Library beheert een `.taodb` SQLite-database met vragen die u na verloop van tijd kunt uitbreiden,
filteren en meenemen tussen machines als één draagbaar bestand.
De database leeft in uw browser (OPFS) en blijft bewaard na een paginaverversing.

## De drie tabbladen

- **Database** — maak, open en exporteer uw draagbare `.taodb`-bibliotheek. U kunt
  een wachtwoord instellen, wijzigen of verwijderen; geëxporteerde bestanden worden dan versleuteld met
  AES-GCM en zijn zonder wachtwoord onleesbaar.
- **Import** — voeg inhoud toe aan de bibliotheek vanuit TAO `.zip`-exports, Excel-bestanden
  of een ZIP verrijkt met Excel-competenties.
- **Search** — doorzoek de bank onmiddellijk en verfijn de resultaten met de filters in
  de linker zijbalk. Gevorderde gebruikers kunnen de **SQL query**-modal openen voor directe
  zoekopdrachten.

## Library gebruiken

1. Ga naar **Database** om een nieuwe bibliotheek aan te maken of een bestaand `.taodb`-bestand te openen.
2. Ga naar **Import** om uw TAO-exports en/of Excel-bestanden toe te voegen.
3. Ga naar **Search** om vragen te zoeken en te verfijnen met de filters.
4. Ga terug naar **Database** om de bibliotheek te **exporteren** en op te slaan of te delen (optioneel
   beveiligd met een wachtwoord).

## Opmerkingen

- Een in-memory (niet-persistente) database met niet-opgeslagen inhoud geeft u een waarschuwing
  voordat u de pagina sluit of vernieuwt — exporteer eerst.
- Alles werkt client-side; uw vragenbank verlaat uw browser nooit.
