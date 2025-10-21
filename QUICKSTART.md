# Quick Start Guide

## Setup in 3 passi

### 1. Installa dipendenze
```bash
npm install
```

### 2. Inizializza database
```bash
npx prisma generate
npx prisma db push
```

### 3. Avvia il server
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Test rapido

1. Inserisci una P.IVA di test: `01234567890`
2. Clicca "Precompila"
3. Esplora i dati precompilati con badge di fonte e confidence

## P.IVA di test disponibili

| P.IVA | Azienda | Settore |
|-------|---------|---------|
| 01234567890 | Metallica SRL | Industriale |
| 09876543210 | Fashion Store SPA | Retail |
| 11223344556 | TechConsulting SRLS | IT Services |
| 55667788990 | Panificio Artigiano | Produzione |
| 99887766554 | Logistica Express SRL | Magazzinaggio |
| 12312312399 | Hotel Bella Vista SRL | Hospitality |

## Attivare Google Maps (opzionale)

1. Ottieni una API key da [Google Cloud Console](https://console.cloud.google.com)
2. Abilita: Geocoding API, Elevation API, Street View Static API
3. Modifica `.env`:
   ```
   USE_GOOGLE=true
   GOOGLE_MAPS_API_KEY=your_key_here
   ```
4. Riavvia il server

## Struttura progetto

```
catnat-demo/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── prefill/       # Main endpoint
│   │   ├── geocoding/     # Geocoding service
│   │   ├── osm/           # OSM building data
│   │   └── google/        # Google services
│   ├── components/        # UI components
│   │   ├── ui/           # shadcn/ui base
│   │   ├── CompanyForm.tsx
│   │   ├── MapView.tsx
│   │   └── ...
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── src/
│   ├── adapters/         # External service adapters
│   ├── inference/        # Business logic
│   ├── risk/            # Risk calculation
│   ├── lib/             # Utilities
│   └── seed/            # Mock data
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── inference.test.ts  # Unit tests
│   └── e2e.spec.ts        # E2E tests
└── README.md
```

## Comandi utili

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build
npm start

# Test
npm test              # Unit tests
npm run test:e2e      # E2E tests

# Database
npx prisma studio     # UI per esplorare DB
npx prisma db push    # Sync schema
```

## Troubleshooting

### Errore "Module not found"
```bash
npm install
npx prisma generate
```

### Porta 3000 occupata
```bash
# Usa porta alternativa
PORT=3001 npm run dev
```

### Errore Overpass API (rate limit)
- Aspetta 1-2 minuti tra le richieste
- Il sistema usa cache per ridurre le chiamate

### Test E2E falliscono
```bash
# Installa browser Playwright
npx playwright install chromium
```

## API Test con cURL

```bash
# Prefill completo
curl -X POST http://localhost:3000/api/prefill \
  -H "Content-Type: application/json" \
  -d '{"piva":"01234567890"}' | jq

# Geocoding
curl "http://localhost:3000/api/geocoding?q=Via+delle+Industrie+45,+Milano" | jq

# OSM building data
curl "http://localhost:3000/api/osm?lat=45.4642&lng=9.1900" | jq
```

## Note

- La prima richiesta può essere lenta (cache fredda)
- Rispetta i rate limit di Nominatim (1 req/sec)
- Overpass API può essere lenta (10-30 sec)
- I dati sono mockati per questa demo
