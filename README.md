# Viking Combat Tracker

En webbapplikation för att hålla koll på karaktärers chockrutor och skada i Viking rollspel.

## Funktioner

- ⚔️ Skapa och hantera karaktärer med autentiskt Viking-skadessystem
- � 5x10 chockrutor (50 rutor totalt) istället för traditionella hälsopoäng
- 🎲 Automatiska T6-kast för chockkontroll vid varje ifylld ruta
- �🛡️ Rustningssystem som reducerar fysisk skada
- 💥 Chockstatus med möjlighet till återhämtning
- 📱 Mobilanpassad design (Progressive Web App)
- 🎮 Enkelt gränssnitt för snabb combat-hantering

## Viking Skadessystem

### Chockrutor
- **50 rutor totalt**: 5 rader × 10 rutor per rad  
- **Skada fyller rutor**: Från vänster till höger, rad för rad
- **EN chockkast per skademoment**: Antal tärningar = antal kompletta rader efter skadan
- **Första raden (0-10 skador)**: Inga chockkast
- **Andra raden (11-20 skador)**: 1T6 chockkast  
- **Tredje raden (21-30 skador)**: 2T6 chockkast
- **Fjärde raden (31-40 skador)**: 3T6 chockkast
- **Femte raden (41-50 skador)**: 4T6 chockkast

### Chockkast exempel:
- **Ta 15 skador** (fyller första raden + 5 i andra) → 1T6 vs Viljestyrka
- **Ta 25 skador** (fyller två rader + 5 i tredje) → 2T6 vs Viljestyrka  
- **Ta 35 skador** (fyller tre rader + 5 i fjärde) → 3T6 vs Viljestyrka

### Skadetyper
- **Fysisk skada**: Reduceras av rustningsvärde
- **Magisk skada**: Ignorerar rustning helt
- **Ren skada**: Ignorerar rustning helt

### Läkning
- Läker rutor från slutet (senast skadade rutor först)
- Möjlighet att återhämta sig från chock med T6-kast

## Installation

1. Klona eller ladda ner projektet
2. Installera Python-beroenden:
   ```bash
   pip install -r requirements.txt
   ```

## Körning

Kör applikationen med:
```bash
python app.py
```

Öppna sedan din webbläsare och gå till `http://localhost:5000`

## Användning

### Skapa karaktärer
1. Klicka på "Lägg till karaktär"
2. Fyll i namn och rustningsvärde
3. Klicka "Skapa"

### Hantera skada
1. Klicka på "⚔️ Skada" på en karaktärs kort
2. Ange antal chockrutor att fylla (1-50)
3. Välj skadetyp (fysisk/magisk/ren)
4. Systemet fyller rutor automatiskt och slår chockkast
5. Resultat visas med detaljerade kastresultat

### Läka karaktärer
1. Klicka på "❤️ Läka" på en karaktärs kort
2. Ange antal rutor att läka
3. Rutor töms från slutet

### Chockhantering
- Karaktärer i chock får violett status
- Klicka "🎲 Chocktest" för återhämtningsförsök
- T6-kast på 4+ för att komma ur chock

### Statusar
- **Oskadad**: 0 fyllda rutor (grön)
- **Lätt skadad**: 1-10 rutor (gul)
- **Skadad**: 11-25 rutor (orange)  
- **Svårt skadad**: 26-40 rutor (röd)
- **Kritiskt skadad**: 41-50 rutor (mörkröd)
- **I chock**: Misslyckade chockkast (violett, pulserande)

## Chockrutorna

Rutorna visas i en 5×10 grid:
```
Rad 1: [□][□][□][□][□][□][□][□][□][□]
Rad 2: [□][□][□][□][□][□][□][□][□][□]  
Rad 3: [□][□][□][□][□][□][□][□][□][□]
Rad 4: [□][□][□][□][□][□][□][□][□][□]
Rad 5: [□][□][□][□][□][□][□][□][□][□]
```

- **Tom ruta**: □ (vit bakgrund)
- **Skadad ruta**: ✗ (röd bakgrund)

## Mobilanvändning

Applikationen är byggd som en Progressive Web App (PWA):
- Fungerar offline efter första besöket
- Kan installeras på mobilen som en app
- Responsiv design för alla skärmstorlekar
- Touch-vänlig interface

## Teknisk info

- **Backend**: Python Flask med REST API
- **Frontend**: Vanilla JavaScript, CSS3
- **Regelmotor**: Autentiskt Viking rollspelssystem
- **Tärningskast**: Slumpgenerator för T6-kast
- **Storage**: In-memory (kan enkelt utökas till databas)
- **PWA-funktionalitet**: Service Worker, Web App Manifest

## Framtida förbättringar

- [ ] Databas för persistent storage
- [ ] Stridsturer och initiativ
- [ ] Ytterligare statuseffekter (förgiftning, etc.)
- [ ] Karaktärsblad med attribut
- [ ] Export/import av karaktärer och sessioner
- [ ] Ljudeffekter för tärningskast
- [ ] Flera kampanjer/sessioner
- [ ] Karaktärsstatistik och skadehistorik
- [ ] Anfallsberäkningar med vapenskada
