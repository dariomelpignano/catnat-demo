# Rilevamento Piani e Seminterrato

## 🎯 Obiettivo

Determinare automaticamente:
1. **Numero di piani** dell'edificio
2. **Presenza di seminterrato/i**

Con indicazione di **fonte** e **confidence** per ogni dato.

---

## 🏢 Regola R1 - Numero di Piani

### Logica a Cascata

```
1. Controlla tag OSM "building:levels"
   ↓ Se presente
   ✅ Usa valore diretto → Confidence: HIGH

   ↓ Se assente

2. Stima da categoria edificio:
   - industrial/warehouse → 1 piano
   - retail/commercial → 2 piani
   - office → 4 piani
   - residential → 3 piani
   - default → 2 piani
   ✅ Usa stima → Confidence: LOW
```

### Codice di Riferimento

`src/inference/ubicazione.ts:15-44`

```typescript
export function inferFloors(tags: BuildingTags): {
  floors: number;
  confidence: Confidence
} {
  // Check building:levels tag
  if (tags['building:levels']) {
    const levels = parseInt(tags['building:levels'], 10);
    if (!isNaN(levels) && levels > 0) {
      return { floors: levels, confidence: 'HIGH' };
    }
  }

  // Fallback: stima da categoria
  const buildingType = tags.building?.toLowerCase();

  if (buildingType === 'industrial' || buildingType === 'warehouse') {
    return { floors: 1, confidence: 'LOW' };
  } else if (buildingType === 'retail' || buildingType === 'commercial') {
    return { floors: 2, confidence: 'LOW' };
  } else if (buildingType === 'office') {
    return { floors: 4, confidence: 'LOW' };
  }

  return { floors: 2, confidence: 'LOW' };
}
```

---

## 🏗️ Regola R2 - Seminterrato

### Logica a Cascata

```
1. Controlla tag OSM "building:levels:underground"
   ↓ Se >= 1
   ✅ Seminterrato presente → Confidence: HIGH

   ↓ Se = 0
   ✅ Seminterrato assente → Confidence: HIGH

   ↓ Se tag assente

2. Euristica ambientale:
   Se elevazione < 15m E pendenza < 2° E vicino acqua < 300m
   → Probabile NESSUN seminterrato (zona allagabile)
   ✅ Confidence: MEDIUM

   ↓ Altrimenti

3. Default: NO seminterrato
   ✅ Confidence: MEDIUM
```

### Codice di Riferimento

`src/inference/ubicazione.ts:53-83`

```typescript
export function inferUnderground(
  tags: BuildingTags,
  elevationM?: number,
  slopeDeg?: number,
  distanceToWaterM?: number
): { hasBasement: boolean; confidence: Confidence } {

  // Check building:levels:underground tag
  if (tags['building:levels:underground']) {
    const underground = parseInt(tags['building:levels:underground'], 10);
    if (!isNaN(underground) && underground >= 1) {
      return { hasBasement: true, confidence: 'HIGH' };
    } else if (!isNaN(underground) && underground === 0) {
      return { hasBasement: false, confidence: 'HIGH' };
    }
  }

  // Fallback: euristica
  const lowElevation = elevationM !== undefined && elevationM < 15;
  const lowSlope = slopeDeg !== undefined && slopeDeg < 2;
  const nearWater = distanceToWaterM !== undefined && distanceToWaterM < 300;

  if (lowElevation && lowSlope && nearWater) {
    // Zona a rischio → probabile nessun seminterrato
    return { hasBasement: false, confidence: 'MEDIUM' };
  }

  // Default
  return { hasBasement: false, confidence: 'MEDIUM' };
}
```

---

## 📊 Esempi Pratici

### Caso 1: Edificio con Tag OSM Completi

**Input**:
```json
{
  "tags": {
    "building": "office",
    "building:levels": "5",
    "building:levels:underground": "1"
  }
}
```

**Output**:
```json
{
  "floors": 5,
  "floors_confidence": "HIGH",
  "floors_source": "building:levels tag",

  "hasBasement": true,
  "basement_confidence": "HIGH",
  "basement_source": "building:levels:underground tag"
}
```

---

### Caso 2: Edificio Senza Tag Dettagliati (Tipico)

**Input**:
```json
{
  "tags": {
    "building": "yes"  // ← Solo categoria generica
  },
  "elevationM": 120,
  "slopeDeg": 3.5,
  "distanceToWaterM": 800
}
```

**Output**:
```json
{
  "floors": 2,
  "floors_confidence": "LOW",
  "floors_source": "category estimate (default)",

  "hasBasement": false,
  "basement_confidence": "MEDIUM",
  "basement_source": "heuristic (no risk indicators)"
}
```

---

### Caso 3: Edificio Industrial in Zona Pianeggiante Vicino Fiume

**Input**:
```json
{
  "tags": {
    "building": "industrial"
  },
  "elevationM": 8,
  "slopeDeg": 0.5,
  "distanceToWaterM": 150
}
```

**Output**:
```json
{
  "floors": 1,
  "floors_confidence": "LOW",
  "floors_source": "category estimate (industrial)",

  "hasBasement": false,
  "basement_confidence": "MEDIUM",
  "basement_source": "heuristic (flood risk area - no basement likely)"
}
```

---

## 🔍 Come Verificare i Dati OSM

### Metodo 1: Via UI
1. Apri http://localhost:3000
2. Inserisci P.IVA (es. `01234567890`)
3. Guarda card "Caratteristiche Ubicazione":
   - **Badge verde** = dati da OSM (HIGH)
   - **Badge giallo** = stima parziale (MEDIUM)
   - **Badge arancione** = stima categorica (LOW)

### Metodo 2: Via API
```bash
curl -X POST http://localhost:3000/api/prefill \
  -H "Content-Type: application/json" \
  -d '{"piva":"01234567890"}' | jq '.building | {
    floors: .floors,
    floors_source: .sources.floors,
    basement: .hasBasement,
    basement_source: .sources.basement,
    tags: .tags
  }'
```

### Metodo 3: Controlla OSM Direttamente
```bash
# Recupera dati edificio via coordinate
curl "http://localhost:3000/api/osm?lat=45.4642&lng=9.1900" | jq '.tags'
```

---

## 📈 Migliorare la Qualità dei Dati

### Opzione A: Usa Edifici OSM con Tag Completi

Cerca su [OpenStreetMap](https://www.openstreetmap.org) edifici con:
- `building:levels` (numero piani)
- `building:levels:underground` (seminterrati)
- `building:material` (materiale)

Poi usa quelle coordinate nel seed data.

### Opzione B: Contribuisci a OSM

1. Registrati su OpenStreetMap
2. Aggiungi tag agli edifici che conosci:
   - `building:levels=3`
   - `building:levels:underground=1`
3. Aspetta ~1 ora per aggiornamento database Overpass
4. Re-testa l'app

### Opzione C: Integra Dati Catastali

In produzione, integra API catastali italiane (es. Agenzia delle Entrate):
- Visure catastali contengono numero piani
- Planimetrie indicano presenza seminterrati

Sostituisci `inferFloors()` con dato catastale reale → Confidence: HIGH

---

## 🎯 Limiti Attuali

| Aspetto | Situazione Attuale | Improvement Possibile |
|---------|-------------------|----------------------|
| **Coverage OSM** | ~10-20% edifici hanno `building:levels` | Contribuire a OSM |
| **Seminterrati OSM** | <5% edifici mappati | Dati catastali API |
| **Accuracy Stima** | ±1 piano | Machine Learning su imagery |
| **Confidence** | Bassa senza tag OSM | Integrazione fonti multiple |

---

## 🔬 Test Coverage

```bash
# Unit test delle regole
npm test -- tests/inference.test.ts

# Test specifici piani/seminterrati
npm test -- --grep "inferFloors|inferUnderground"
```

---

## 📚 Riferimenti

- [OSM Building Tags](https://wiki.openstreetmap.org/wiki/Key:building)
- [Building Levels](https://wiki.openstreetmap.org/wiki/Key:building:levels)
- [Underground Levels](https://wiki.openstreetmap.org/wiki/Key:building:levels:underground)
- Codice sorgente: `src/inference/ubicazione.ts`
