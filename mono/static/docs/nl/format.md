# Format

**Bewerk de stam van een vraag.** Format opent een TAO QTI-export, laat je een
vraag kiezen en de stam ervan handmatig herschrijven — met automatische
detectie van opsommingslijsten en regeleinden, en een live preview — en geeft
je daarna dezelfde ZIP terug, klaar om opnieuw te importeren in TAO.

## Wat het doet

Format leest elke vraag in je QTI `.zip` en toont ze in het zijpaneel. Kies er
een om de stam (de inleidende/context-tekst vóór de antwoordkeuzes) als platte
tekst te bewerken: regels die beginnen met `•` of `-` worden een echte
opsommingslijst, en elk ander regeleinde wordt een regeleinde in de
weergegeven vraag. Een live preview toont precies hoe het resultaat eruit zal
zien voordat je exporteert.

## Format gebruiken

1. **Upload** je TAO QTI `.zip`-export.
2. **Kies een vraag** uit de lijst in het zijpaneel.
3. **Bewerk de stam** in het tekstpaneel — de preview wordt live bijgewerkt.
4. Herhaal dit voor elke andere vraag die je wilt aanpassen.
5. Klik op **Export ZIP** en **download** het nieuwe archief. De naam krijgt
   `-stems` toegevoegd (bijvoorbeeld `exam.zip` → `exam-stems.zip`).
6. **Importeer** de `-stems.zip` opnieuw in TAO.

## Opmerkingen

- Alleen de stam van de vraag is bewerkbaar — antwoordkeuzes blijven
  ongewijzigd.
- Vragen zonder herkenbare stam (bijvoorbeeld een instructiepagina)
  verschijnen nog steeds in de lijst, maar de editor staat dan uit.
- Alleen de opmaak die je hier aanmaakt (opsommingslijsten en regeleinden)
  wordt toegepast; andere opmaak die al in de export aanwezig was (bijvoorbeeld
  vetgedrukte tekst) wordt teruggebracht tot platte tekst zodra je de stam van
  die vraag bewerkt.
- De verwerking gebeurt volledig in je browser — de ZIP verlaat je browser
  nooit.
