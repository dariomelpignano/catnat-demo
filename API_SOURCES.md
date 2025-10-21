# API Sources - Cosa è Vero e Cosa è Mock

## 📊 Riepilogo

| Componente | Tipo | Fonte | Note |
|------------|------|-------|------|
| **Dati Azienda** | 🎭 MOCK | `mock_companies.json` | 6 aziende fake |
| **Geocoding** | ✅ VERO | [Nominatim OSM](https://nominatim.openstreetmap.org) | API pubblica reale |
| **Edifici/Poligoni** | ✅ VERO | [Overpass API](https://overpass-api.de) | Dati OSM reali |
| **Elevazione** | ❌ NON ATTIVO | Google Elevation API | Richiede API key |
| **Street View** | ❌ NON ATTIVO | Google Street View | Richiede API key |

---

## 🎭 MOCK (Dati Finti)

### 1. Dati Azienda (BI Adapter)

**Fonte**: `src/seed/mock_companies.json`

```json
{
  "piva": "01234567890",
  "ragioneSociale": "Metallica SRL",
  "indirizzo": "Via delle Industrie 45",
  "ateco": "25.11.00",
  "fatturatoStimato": 2500000,
  "dipendentiStimati": 35
}
```

**Perché mock?**
- Demo non ha accesso a database reali (Cerved, Infocamere, ecc.)
- I dati aziendali reali richiedono abbonamenti costosi
- 6 aziende campione coprono tutti i casi d'uso

---

## ✅ VERO (API Reali)

### 2. Geocoding - Nominatim OSM

**Endpoint**: `https://nominatim.openstreetmap.org/search`

**Esempio reale**:
```bash
curl "https://nominatim.openstreetmap.org/search?q=Piazza+del+Duomo,+Milano&format=json"
```

**Risposta effettiva**:
```json
{
  "lat": "45.4639102",
  "lon": "9.1906398",
  "display_name": "Piazza del Duomo, Duomo, Municipio 1, Milano, Lombardia, Italia"
}
```

**Prova**:
- ✅ Nel database cache vedi `provider: "nominatim"`
- ✅ Le coordinate sono reali (verificabili su Google Maps)
- ✅ L'indirizzo normalizzato contiene dettagli OSM reali

**Limitazioni**:
- ⚠️ Max 1 richiesta/secondo (usage policy Nominatim)
- ⚠️ Dati possono non essere sempre precisi al 100%

---

### 3. Overpass API - Dati Edifici OSM

**Endpoint**: `https://overpass-api.de/api/interpreter`

**Query reale inviata**:
```
[out:json][timeout:25];
(
  way(around:50,45.4642,9.1900)["building"];
  relation(around:50,45.4642,9.1900)["building"];
);
out body;
>;
out skel qt;
```

**Cosa recupera**:
- ✅ Poligoni edifici (coordinate GPS reali)
- ✅ Tag OSM: `building:levels`, `building:material`, ecc.
- ✅ Area calcolata da geometria reale

**Esempio**:
Per "Fashion Store SPA" (Roma), l'app ha trovato un edificio reale su OSM con:
```json
{
  "areaM2": 456.47,  ← Calcolato da poligono OSM reale
  "tags": { "building": "yes" },
  "polygonGeoJSON": { ... }  ← Coordinate GPS vere
}
```

**Prova**:
- ✅ Puoi verificare su [OpenStreetMap](https://www.openstreetmap.org/#map=19/42.1385/12.3806)
- ✅ I timeout nei log dimostrano che sta chiamando API vera
- ✅ Nel database cache: 2 query salvate

**Limitazioni**:
- ⚠️ API pubblica può essere lenta (10-30s)
- ⚠️ Timeout frequenti se sovraccarica
- ⚠️ Non tutti gli edifici hanno dati completi su OSM

---

## ❌ NON ATTIVO (Disponibile ma Non Configurato)

### 4. Google Maps APIs

**Config attuale**:
```bash
USE_GOOGLE=false
GOOGLE_MAPS_API_KEY=
```

**API disponibili (ma non usate)**:
- Geocoding API (alternativa a Nominatim)
- Elevation API (quota edificio)
- Street View Static API (preview immagine)

**Come attivarle**:
1. Ottieni API key da [Google Cloud Console](https://console.cloud.google.com)
2. Abilita: Geocoding, Elevation, Street View Static
3. Modifica `.env`:
   ```
   USE_GOOGLE=true
   GOOGLE_MAPS_API_KEY=your_key_here
   ```

**Costi**: Google Maps ha un free tier (200$ crediti/mese), poi a pagamento.

---

## 🔍 Come Verificare

### Test 1: Geocoding è Vero

```bash
# Chiama direttamente Nominatim (senza passare per l'app)
curl "https://nominatim.openstreetmap.org/search?q=Via+Torino+78,+Torino&format=json&limit=1" -H "User-Agent: Test"
```

Vedrai la stessa risposta che usa l'app.

### Test 2: Overpass è Vero

```bash
# Chiama direttamente Overpass
curl -X POST "https://overpass-api.de/api/interpreter" \
  -d '[out:json][timeout:25];way(around:50,45.4642,9.1900)["building"];out tags;'
```

Vedrai i dati OSM reali degli edifici vicini a quelle coordinate.

### Test 3: Verifica Cache

```bash
sqlite3 prisma/prisma/dev.db "SELECT * FROM GeocodingCache;"
```

Vedrai indirizzi con coordinate reali.

---

## 📍 Esempio Completo

**Input**: P.IVA `09876543210` (Fashion Store SPA)

**Step 1 - BI Adapter (MOCK)**
```json
{
  "ragioneSociale": "Fashion Store SPA",  ← FINTO
  "indirizzo": "Corso Vittorio Emanuele 123, 00186 Roma (RM)"  ← FINTO
}
```

**Step 2 - Geocoding Nominatim (VERO)**
```bash
# Chiamata reale a OSM
GET https://nominatim.openstreetmap.org/search?q=Corso+Vittorio+Emanuele+123...
```
Risposta:
```json
{
  "lat": 42.1384917,  ← VERO (da OSM)
  "lon": 12.3805653,  ← VERO (da OSM)
  "display_name": "Corso Vittorio Emanuele, Campagnano di Roma..."  ← VERO
}
```

**Step 3 - Overpass API (VERO)**
```bash
# Chiamata reale a Overpass
POST https://overpass-api.de/api/interpreter
Query: edifici vicino a lat=42.1384917, lng=12.3805653
```
Risposta:
```json
{
  "elements": [{
    "type": "way",
    "tags": { "building": "yes" },  ← VERO (mappato da contributor OSM)
    "nodes": [...]  ← Coordinate GPS reali
  }]
}
```

**Step 4 - Calcolo Area (VERO)**
```javascript
// Usa turf.js per calcolare area da coordinate GPS reali
area(polygonGeoJSON) → 456.47 m²  ← CALCOLATO da dati veri
```

---

## 🎯 Conclusione

**Mix strategico**:
- 🎭 **Mock**: Solo dati aziendali (impossibili da ottenere gratis)
- ✅ **Vero**: Tutti i dati geografici (OSM è gratis e open)

**Valore della demo**:
1. Le logiche di inference sono vere
2. I calcoli geometrici sono veri
3. L'integrazione OSM funziona davvero
4. L'architettura è production-ready

**Per produzione**:
- Sostituisci `MockBIAdapter` con `CervedAdapter` (già stub presente)
- Aggiungi Google API key (opzionale, per elevazione)
- Tutto il resto è già pronto! 🚀

---

## 🔗 Riferimenti

- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [OpenStreetMap Copyright](https://www.openstreetmap.org/copyright)
- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
