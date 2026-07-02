# Audit

**Conformiteitscontrole.** Audit vergelijkt een TAO QTI-export met de Excel-bron
waaruit hij is opgebouwd en markeert elk verschil naar ernst, zodat u kunt
bevestigen dat het geëxporteerde examen trouw overeenkomt met zijn bron.

## Wat het doet

Audit leest beide bestanden, koppelt vragen op basis van hun volgorde/positie (de
TAO-export wordt gegenereerd vanuit de Excel, zodat ze dezelfde volgorde en
hetzelfde aantal delen), en rapporteert eventuele verschillen in titels, prompts
en antwoorden — ingedeeld als kritiek, belangrijk of klein.

## Audit gebruiken

1. **Upload de TAO `.zip`**-export. De vragen worden geparseerd en geteld.
2. **Upload de Excel-bron** en kies het **blad** om mee te vergelijken.
3. **Kies de sjabloon** (FIN / OLD_BOSA / OLD_FIN) zodat de Excel op dezelfde
   manier wordt gelezen als de Import-route dat doet, of kies **Aangepast** om
   zelf de kolomletters en rij-indeling in te voeren voor een bron die geen enkel
   vast sjabloon volgt. Optioneel **titels negeren** als alleen prompts en
   antwoorden van belang zijn.
4. **Voer** de audit uit en bekijk de resultaten.

## Resultaten lezen

Verschillen worden beoordeeld naar ernst:

- **Kritiek (blokkerend)** — grote gegevensverschillen, inclusief niet-gekoppelde
  vragen en Excel↔QTI-aantalmismatches. Deze doen de audit mislukken.
- **Belangrijk** — significante afwijkingen.
- **Klein** — kleine opmaak- of presentatieverschillen.

U kunt het rapport exporteren (JSON, Markdown, HTML of CSV) en het afdrukken met
volledige details, één vraag per pagina.

## Opmerkingen

- Audit hergebruikt de Import-parser en sjablonen, dus een werkmap die foutloos
  importeert, auditeert ook foutloos.
- Beide bestanden worden volledig in uw browser verwerkt.
