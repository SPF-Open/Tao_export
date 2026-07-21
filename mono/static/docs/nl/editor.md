# Editor

**Open een TAO QTI-export en bewerk alles aan een vraag.** Editor leest een
`.zip`-export uit TAO en laat je de prompt, de antwoorden, de
tekenlimiet van open vragen en de metadata wijzigen — in een
gebruiksvriendelijk formulier of rechtstreeks als raw XML — en exporteert
daarna een ZIP die klaar is om opnieuw in TAO te importeren.

## Wat het doet

Editor toont elke vraag in je QTI `.zip` in het zijpaneel. Een vraag
selecteren opent ze in een editor met twee modi:

- **Eenvoudige modus** — een formulier voor de velden van de vraag: de
  prompt/stam, de tekst van elke antwoordkeuze, welk(e) antwoord(en)
  correct is/zijn, een score per keuze, een tekenlimiet voor open vragen, en
  een sectie **Metadata** met de titel/het label/de taal van de vraag zelf,
  de TAO-testopties per vraag (zoom, rekenmachine, markeerstift,
  overzichtsscherm, waarschuwingen — wanneer het pakket een `test.xml`
  bevat), en LOM-metadata uit `imsmanifest.xml` wanneer aanwezig.
- **Raw XML-modus** — de onderliggende XML van de vraag, rechtstreeks
  bewerkbaar. Wanneer het pakket een `test.xml` en/of `imsmanifest.xml`
  bevat, laten aparte tabbladen je ook de relevante secties van die
  bestanden bewerken. Terugschakelen naar de eenvoudige modus leest de
  huidige XML opnieuw in, dus beide weergaven blijven altijd gesynchroniseerd.

Elke wijziging wordt toegepast als een gerichte aanpassing van de
oorspronkelijke XML-tekst — alle andere bytes van het pakket (attributen,
responsverwerking, alles waarvoor Editor geen veld toont) blijven
ongewijzigd, zodat het geëxporteerde pakket importeerbaar blijft in TAO.

## Editor gebruiken

1. **Upload** je TAO QTI `.zip`-export.
2. **Kies een vraag** uit de lijst in het zijpaneel.
3. Bewerk ze in **eenvoudige** modus, of schakel over naar **raw XML** voor
   volledige controle.
4. Klik op **Exporteer ZIP**.
5. **Download** het nieuwe archief (de naam krijgt `-edited` toegevoegd) en
   **importeer** het opnieuw in TAO.

## Opmerkingen

- Het aanvinken van "correct" gebeurt als één keuze of meerdere, afhankelijk
  van de eigen cardinaliteit van de vraag.
- Alleen bestaande antwoordkeuzes kunnen worden bewerkt — keuzes kunnen niet
  worden toegevoegd of verwijderd.
- Het tekenlimietveld komt overeen met de responsbeperking van de open
  vraag; leegmaken verwijdert de limiet.
- Ondersteuning voor LOM/manifest-metadata is best-effort: echte
  TAO-exports bevatten deze metadata niet altijd betrouwbaar, dus Editor
  toont wat het vindt en laat je een minimaal startblok toevoegen wanneer er
  geen is. Importeer het geëxporteerde pakket opnieuw in TAO om het te
  controleren voordat je erop vertrouwt.
- Een vraag met een niet-ondersteund interactietype verschijnt nog steeds in
  de lijst; de eenvoudige modus toont een melding en de raw XML-modus blijft
  volledig beschikbaar.
- De verwerking gebeurt volledig in je browser — de ZIP verlaat je browser
  nooit.
