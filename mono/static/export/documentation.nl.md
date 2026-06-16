# Export-TAO

**Versie: 02-10-2024**

---

## Inhoudsopgave

1. [Inleiding](#inleiding)
2. [Voorbereiding van bestanden](#voorbereiding-van-bestanden)
3. [Export](#export)
4. [Ondersteuning](#ondersteuning)
5. [Technische info](#technische-info)

---

## Inleiding

Dit document is bedoeld om u te begeleiden bij het gebruik van het TAO-testexportplatform. De site ondersteunt open vragen en meerkeuzevragen.

Deze applicatie is bestemd voor het testteam van SPF Finances. Er worden geen wijzigingen aangebracht om te voldoen aan andere gebruiksgevallen dan die van het testteam van SPF Finances.

---

## Voorbereiding van bestanden

### Stap 1: Exporteren van een examen of vragen

1. Ga naar **TAO** en selecteer het examen of de map met de vragen die u als PDF wilt exporteren.
2. Klik op de knop **Exporteren** linksonder in uw scherm.
3. Er verschijnt een menu aan de rechterkant en u kunt naar de volgende stap gaan.

![Placeholder: Screenshot of TAO interface showing the Export button location - TODO: Add image here]

### Stap 2: Selecteer het exporttype

1. Controleer of het exporttype **QTI Examen 2.2** is.
2. Klik vervolgens op **Exporteren**.
3. Als de download direct start, kunt u direct naar de volgende stap gaan.

![Placeholder: Screenshot of export type selection - TODO: Add image here]

> **Als de download NIET start**, moet u wachten tot de export is verwerkt. U kunt de status controleren in de rechterbovenhoek van de TAO-interface. Zodra de taak is voltooid, kunt u op het opslagpictogram klikken.

- De taak is nog niet voltooid en wordt verwerkt.
- De taak is voltooid en u kunt op het downloadpictogram klikken.

---

## Export

### Stap 1: Configuratie

1. Ga naar de volgende site: **Export-TAO**
2. Klik op **Bladeren** en selecteer het zip-bestand uit de vorige stap.
3. De site genereert automatisch de vragen en toont ze aan de rechterkant van de pagina.
4. U kunt vervolgens de verschillende opties gebruiken om de export naar wens te configureren:

| Optie | Beschrijving |
|-------|--------------|
| **Answer** | Antwoorden tonen/verbergen |
| **Instruction** | Instructies tonen/verbergen |
| **Letter** | Opsommingstekens / Alfabetische lijst |
| **Compare** | Visuele vergelijking van twee testen |
| **Inzage** | Examengemodus - onderstreepte antwoorden |
| **Sort question** | Vragen sorteren op titel |
| **Randomize** | Vragen/antwoorden shufflen |
| **Zoom** | Weergavegrootte wijzigen |
| **Multiple Files** | Meerdere bestanden laden |
| **Merge Files** | Meerdere examens samenvoegen |
| **Audit** | Audit-modus voor validatie van overeenkomsten tussen Excel- en QTI-bestanden |
| **Get PDF** | Opent afdrukvenster |
| **Show/Hide** | Vragen individueel verbergen of volgorde wijzigen |

![Placeholder: Screenshot of Export-TAO interface with all options - TODO: Add image here]

### Stap 2a: Audit-modus (Optioneel)

De **Audit-modus** stelt u in staat de kwaliteit van de overeenstemming tussen uw Excel-bestand en het QTI-bestand dat uit TAO is geëxporteerd, te valideren. Ga als volgt te werk om deze modus te gebruiken:

1. Klik op het **Audit**-tabblad bovenaan het formulier
2. Upload uw Excel-bestand met referentievragen
3. De applicatie zal:
   - Excel-vragen automatisch vergelijken met QTI-vragen
   - Een overeenkomstenscore voor elke vraag weergeven
   - Discrepanties identificeren (titels, vragen, antwoorden)
   - Mogelijke copy-paste-fouten detecteren
   - Een gedetailleerd rapport genereren met kritieke, grote en kleine fouten
4. U kunt het rapport in JSON-, Markdown-, HTML- of CSV-indeling exporteren
5. Afdrukken van het rapport is ook beschikbaar met alle details (één vraag per pagina)

**Soorten gedetecteerde fouten:**
- **Kritiek (Blokkering)**: Grote gegevensverschillen
- **Groot**: Significante discrepanties
- **Klein**: Kleine format- of presentatieverschillen

### Stap 2b: PDF maken

Finaliseer de configuratie en klik vervolgens op **Get PDF**. Deze knop opent een afdrukvenster. Vanuit dit menu moet u kiezen of u wilt afdrukken of exporteren als PDF, afhankelijk van uw behoeften.

---

## Ondersteuning

De site **Export-TAO** is op geen enkele wijze verbonden aan TAO, SPF Stratégie & Appui of SPF Finances. Neem alstublieft geen contact op met het technisch ondersteuningsteam van deze organisaties, maar neem in plaats daarvan contact op met **Benoit Welsch (MINFIN)** via Teams of gebruik deze e-mailadressen:

- benoitwelsch@minfin.fed.be
- main@lv0.eu

---

## Technische info

| | |
|---|---|
| **Sitelink** | https://export.tao.lv0.eu/ |
| **Ontwikkelaar** | Benoit Welsch |
| **E-mail** | benoitwelsch@minfin.fed.be |
| **Hosting** | Cloudflare |
| **Frontend** | Svelte |
| **Repository** | [SPF-Open/Tao_export](https://github.com/SPF-Open/Tao_export) |

### Privacy

De site slaat geen bestanden op en bewaart geen enkel spoor van het gebruik. Alle gegevensverwerking wordt client-side uitgevoerd en er gaat geen vertrouwelijke informatie via de servers van Cloudflare.

Cloudflare zorgt er alleen voor dat HTML-, CSS- en JS-bestanden publiek en toegankelijk zijn.

De site is volledig open-source en is beschikbaar op GitHub.
