# Demo Polizza Catnat

Sistema di precompilazione automatica per polizze assicurative contro le catastrofi naturali, basato su Partita IVA.

## 📋 Indice

- [Panoramica](#panoramica)
- [Architettura](#architettura)
- [Funzionalità](#funzionalità)
- [Stack Tecnologico](#stack-tecnologico)
- [Setup e Installazione](#setup-e-installazione)
- [Utilizzo](#utilizzo)
- [API Reference](#api-reference)
- [Conformità e Licenze](#conformità-e-licenze)
- [Testing](#testing)
- [Limitazioni](#limitazioni)

## 🎯 Panoramica

Questa applicazione dimostrativa automatizza la precompilazione di polizze catnat partendo dalla **Partita IVA** di un'impresa italiana. Il sistema:

1. Recupera i dati aziendali (ATECO, indirizzo, fatturato, dipendenti)
2. Geocodifica l'indirizzo e recupera dati geografici
3. Estrae caratteristiche dell'edificio da OpenStreetMap
4. Calcola un proxy del rischio allagamento
5. Stima i massimali assicurativi consigliati
6. Presenta i risultati con indicatori di **confidence** e **source** per ogni campo

## 🏗️ Architettura

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ POST /api/prefill { piva }
       ▼
┌──────────────────────────────────────────────────────┐
│              API Route Handler                        │
│              (/api/prefill/route.ts)                 │
└──────┬──────────────────┬──────────────┬─────────────┘
       │                  │              │
       ▼                  ▼              ▼
┌─────────────┐    ┌──────────────┐  ┌─────────────┐
│ BI Adapter  │    │   Geocoding  │  │ OSM Adapter │
│  (MockBI)   │    │  (Nominatim/ │  │ (Overpass)  │
│             │    │    Google)   │  │             │
└─────────────┘    └──────────────┘  └─────────────┘
       │                  │              │
       │                  │              │
       ▼                  ▼              ▼
┌─────────────────────────────────────────────────────┐
│           Inference Engines                          │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  Ubicazione  │  │  Massimali   │                │
│  │  (floors,    │  │  (parametric │                │
│  │   basement,  │  │   rules by   │                │
│  │   material)  │  │   ATECO)     │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│                Audit & Cache                         │
│           (SQLite + Prisma)                          │
└─────────────────────────────────────────────────────┘
```

### Flusso dati

```
Input: P.IVA
  │
  ├─► 1. BI Adapter → Company Data (ATECO, address, revenue, employees)
  │
  ├─► 2. Geocoding Adapter → lat, lng, normalized address
  │
  ├─► 3. Google Adapter (optional) → elevation, street view URL
  │
  ├─► 4. OSM Adapter → building footprint, tags, area, materials
  │
  ├─► 5. Risk/Terrain → flood score, slope, distance to water
  │
  ├─► 6. Inference/Ubicazione → floors, basement, material category, area
  │
  └─► 7. Inference/Massimali → assets breakdown, suggested coverage
       │
       └─► Output: PrefillResponse (with sources & confidence)
```

## ✨ Funzionalità

### Precompilazione automatica

- **Dati azienda**: Ragione sociale, ATECO, indirizzo, fatturato, dipendenti
- **Geolocalizzazione**: Coordinate GPS, indirizzo normalizzato
- **Caratteristiche edificio**:
  - Superficie (m²)
  - Numero di piani
  - Presenza di seminterrati
  - Materiali costruttivi (metallo, cls/laterizio, legno)
- **Rischio allagamento**: Score proxy basato su elevazione, pendenza, distanza da corsi d'acqua
- **Massimali suggeriti**:
  - Beni strumentali
  - Scorte
  - Impianti
  - Uplift per rischio

### Sistema di Confidence

Ogni campo precompilato include:
- **Source**: Provenienza del dato (MockBI, OSM, Google, Inference)
- **Method**: Metodo di recupero (tag OSM, geocoding, stima parametrica)
- **Confidence**: HIGH / MEDIUM / LOW

**Regole di confidence**:
- `HIGH`: Dato proveniente da fonte diretta (tag OSM, API BI)
- `MEDIUM`: Dato inferito con buona approssimazione
- `LOW`: Stima euristica o default di categoria

## 🛠️ Stack Tecnologico

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componenti UI)
- **React Query** (state management)
- **MapLibre GL** (mappe OSM)

### Backend
- **Next.js API Routes**
- **Prisma** + **SQLite** (audit, cache)
- **p-queue** (rate limiting Overpass)

### Servizi esterni
- **OpenStreetMap** / **Overpass API** (dati edifici)
- **Nominatim** (geocoding OSM)
- **Google Maps API** (opzionale: geocoding, elevation, street view)

## 📦 Setup e Installazione

### Prerequisiti
- Node.js 18+
- npm o yarn

### Installazione

```bash
# Clona il repository (o crea da zero)
git clone <repo-url>
cd catnat-demo

# Installa dipendenze
npm install

# Configura environment
cp .env.example .env

# Inizializza database
npx prisma generate
npx prisma db push

# Avvia server di sviluppo
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:3000`.

### Configurazione `.env`

```bash
# Google Maps API (opzionale)
USE_GOOGLE=false
GOOGLE_MAPS_API_KEY=

# OpenStreetMap / Overpass
OVERPASS_ENDPOINT=https://overpass-api.de/api/interpreter
NOMINATIM_BASE=https://nominatim.openstreetmap.org

# Business Intelligence source
BI_SOURCE=mock

# Database
DATABASE_URL="file:./prisma/dev.db"
```

**Modalità "solo OSM"** (default):
- Imposta `USE_GOOGLE=false`
- Usa Nominatim per geocoding
- Nessuna elevazione o Street View

**Modalità "con Google"**:
- Imposta `USE_GOOGLE=true`
- Fornisci `GOOGLE_MAPS_API_KEY`
- Abilita Elevation API e Street View

## 🚀 Utilizzo

### UI Web

1. Apri `http://localhost:3000`
2. Inserisci una Partita IVA del seed (es. `01234567890`)
3. Clicca "Precompila"
4. Esplora i dati precompilati con badge di fonte e confidence

### API

#### POST `/api/prefill`

Precompila tutti i dati della polizza.

**Request:**
```json
{
  "piva": "01234567890"
}
```

**Response:**
```json
{
  "company": {
    "piva": "01234567890",
    "ragioneSociale": "Metallica SRL",
    "ateco": "25.11.00",
    "indirizzo": "Via delle Industrie 45, 20100 Milano (MI)",
    "fatturatoStimato": 2500000,
    "dipendentiStimati": 35,
    "sources": {
      "base": {
        "source": "MockBI",
        "method": "mock_database",
        "confidence": "HIGH",
        "timestamp": "2025-01-15T10:30:00.000Z"
      }
    }
  },
  "geo": {
    "lat": 45.4642,
    "lng": 9.1900,
    "addressNormalized": "Via delle Industrie 45, Milano, MI, Italia",
    "provider": "nominatim",
    "elevationM": 122.5,
    "streetViewUrl": "https://maps.googleapis.com/..."
  },
  "building": {
    "areaM2": 1200,
    "floors": 2,
    "hasBasement": false,
    "materialCategory": "METAL",
    "tags": {
      "building": "industrial",
      "building:levels": "2",
      "building:material": "metal"
    },
    "polygonGeoJSON": { ... },
    "confidence": "HIGH",
    "sources": {
      "floors": {
        "source": "OSM",
        "method": "building:levels tag",
        "confidence": "HIGH"
      },
      ...
    }
  },
  "risk": {
    "floodScore": 0.25,
    "slopeDeg": 2.5,
    "distanceToWaterM": 450,
    "notes": "Rischio allagamento calcolato tramite proxy: BASSO..."
  },
  "suggestion": {
    "beniStrumentali": 580000,
    "scorte": 262500,
    "impianti": 144000,
    "massimale": 1233125,
    "breakdown": {
      "beniStrumentali": 580000,
      "scorte": 262500,
      "impianti": 144000,
      "uplift": 1.0625,
      "massimale": 1233125
    },
    "confidence": "HIGH",
    "sources": {
      "calculation": {
        "source": "Parametric Model",
        "method": "ATECO 25.11.00",
        "confidence": "HIGH",
        "notes": "Stima basata su regole parametriche per settore"
      }
    }
  },
  "auditId": "uuid-..."
}
```

#### GET `/api/geocoding?q=<address>`

Geocodifica un indirizzo.

**Response:**
```json
{
  "lat": 45.4642,
  "lng": 9.1900,
  "addressNormalized": "...",
  "provider": "nominatim"
}
```

#### GET `/api/osm?lat=<lat>&lng=<lng>`

Recupera feature edificio da OSM.

**Response:**
```json
{
  "polygonGeoJSON": { ... },
  "tags": { ... },
  "areaM2": 1200,
  "levels": 2,
  "material": "metal"
}
```

#### GET `/api/google?lat=<lat>&lng=<lng>&type=elevation|streetview`

Recupera elevation o street view URL (richiede Google API).

## 📜 Conformità e Licenze

### OpenStreetMap (ODbL)

- **Licenza**: [Open Database License (ODbL)](https://www.openstreetmap.org/copyright)
- **Attribution**: Presente nell'UI e nel README
- **Uso consentito**: Lettura, derivazione, caching locale per demo
- **Limitazioni**: Non distribuire dataset derivati senza attribuzione ODbL

### Google Maps API

- **Uso conforme**: Solo tramite API ufficiali (Geocoding, Elevation, Street View Static)
- **Street View**: URL generati al runtime, non salvati permanentemente su disco
- **Dataset derivati**: Non vengono creati dataset permanenti da tiles o immagini
- **Limitazioni**: Rispettare i [Terms of Service di Google Maps](https://cloud.google.com/maps-platform/terms)

### Note legali

Questa è una **demo educativa**. I dati sono mockati e le stime sono puramente indicative.

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm test
```

Test coperti:
- Parsing tag OSM → floors, material, basement
- Stima massimali per ATECO industriale e office
- Logiche di confidence

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Test coperti:
- Flusso completo `/api/prefill` con P.IVA seed
- UI: input P.IVA → rendering dati
- Gestione errori per P.IVA non trovata

## 🧩 Seed Data

Il file `src/seed/mock_companies.json` contiene 6 aziende campione:

1. **Metallica SRL** (Industriale - ATECO 25.11.00)
2. **Fashion Store SPA** (Retail - ATECO 47.71.10)
3. **TechConsulting SRLS** (IT Services - ATECO 62.02.00)
4. **Panificio Artigiano** (Produzione alimentare - ATECO 10.71.10)
5. **Logistica Express SRL** (Magazzinaggio - ATECO 52.10.10)
6. **Hotel Bella Vista SRL** (Hospitality - ATECO 55.10.00)

Puoi testare con P.IVA: `01234567890`, `09876543210`, ecc.

## 🚧 Limitazioni

1. **Dati mockati**: I dati aziendali provengono da un database mock, non da fonti reali.
2. **Rischio allagamento proxy**: Il calcolo è una stima euristica, non un'analisi idrogeologica professionale.
3. **Massimali**: Le regole parametriche sono semplificate e puramente indicative.
4. **Copertura geografica**: Ottimizzato per indirizzi italiani.
5. **Rate limiting Overpass**: L'Overpass API pubblica ha limiti di rate; la demo usa cache e queue per mitigare.

## 📚 Riferimenti

### Regole di Inferenza

**R1 - Piani**:
- `building:levels` → HIGH
- Stima da categoria → LOW

**R2 - Seminterrati**:
- `building:levels:underground` ≥ 1 → HIGH
- Euristica (elevazione bassa + pendenza bassa + vicino acqua) → MEDIUM/LOW

**R3 - Materiali**:
- `building:material` → HIGH
- `roof:material` → LOW
- Tipo edificio → LOW

**R4 - Superficie**:
- Poligono OSM → HIGH
- Default categoria → LOW

**R5 - Rischio allagamento**:
```
floodScore = w1*(1/distToWater) + w2*(1/elev) + w3*(1/slope)
w1=0.5, w2=0.3, w3=0.2
```

**R6 - Massimali**:
- **Industrial**: beni = 450€/m² + 20k€/piano; scorte = 7.5k€/dip; impianti = 120€/m²
- **Retail**: scorte = 400€/m²; arredi = 250€/m²
- **Office**: attrezzature = 4k€/dip; impianti = 150€/m²
- **Uplift**: `(1 + 0.25*floodScore)`

## 🤝 Contribuire

Questa è una demo educativa. Per miglioramenti:
1. Fork del repository
2. Crea un branch (`feature/miglioramento`)
3. Commit con messaggi descrittivi
4. Pull request

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) file.

---

**Disclaimer**: Questa applicazione è una demo tecnica. Le stime fornite non costituiscono consulenza assicurativa professionale.
