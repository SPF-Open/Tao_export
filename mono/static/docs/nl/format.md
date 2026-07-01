# Format

**Elke vraag automatisch opgemaakt, met preview en aanpassing.** Format opent
een TAO QTI-export en maakt bij het exporteren elke vraag automatisch op:
opsommingslijsten en regeleinden worden in elke stam gedetecteerd, en elke
nog platte-tekst-prompt wordt vetgedrukt. Kies eerst een vraag als je het
resultaat wilt bekijken of aanpassen vóór het exporteren.

## Wat het doet

Format leest elke vraag in je QTI `.zip` en toont ze in het zijpaneel.
Exporteren past twee automatische stappen toe op het hele pakket:

- **Stam-opmaak** — in de inleidende/context-tekst van elke vraag (vóór de
  antwoordkeuzes) worden regels die beginnen met `•` of `-` een echte
  opsommingslijst, en elk ander regeleinde wordt een regeleinde in de
  weergegeven vraag.
- **Prompts vetgedrukt** — elke prompt die nog platte tekst is, wordt
  vetgedrukt, volgens de conventie van TAO. Prompts die al opmaak bevatten,
  blijven ongewijzigd.

Je hoeft geen vraag te openen om dit toe te passen — het gebeurt voor elke
vraag bij het exporteren. Door een vraag te openen kun je precies bekijken
hoe de stam wordt weergegeven, en de tekst handmatig aanpassen als de
automatische detectie iets miste of je een ander resultaat wilt.

## Format gebruiken

1. **Upload** je TAO QTI `.zip`-export.
2. *(Optioneel)* **Kies een vraag** uit de lijst in het zijpaneel om de
   automatisch opgemaakte stam te bekijken, en pas de tekst aan als je dat
   wilt — de preview wordt live bijgewerkt.
3. Klik op **Export ZIP**. De stam van elke vraag wordt automatisch opgemaakt
   (met je aangepaste tekst voor elke vraag die je hebt bijgewerkt) en elke
   platte prompt wordt vetgedrukt.
4. **Download** het nieuwe archief. De naam krijgt `-stems` toegevoegd
   (bijvoorbeeld `exam.zip` → `exam-stems.zip`).
5. **Importeer** de `-stems.zip` opnieuw in TAO.

## Opmerkingen

- Alleen de stam van de vraag is bewerkbaar — antwoordkeuzes blijven
  ongewijzigd.
- Vragen zonder herkenbare stam (bijvoorbeeld een instructiepagina)
  verschijnen nog steeds in de lijst, maar de editor staat dan uit; ze worden
  niet beïnvloed door stam-opmaak (vetgedrukte prompts worden wel toegepast
  indien relevant).
- Alleen de opmaak die je hier aanmaakt (opsommingslijsten en regeleinden)
  wordt toegepast; andere opmaak die al in een stam aanwezig was (bijvoorbeeld
  vetgedrukte tekst) wordt teruggebracht tot platte tekst zodra die stam door
  de automatische opmaak gaat.
- De verwerking gebeurt volledig in je browser — de ZIP verlaat je browser
  nooit.
