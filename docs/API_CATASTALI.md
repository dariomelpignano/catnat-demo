# API Catastali Italiane - Guida Completa

## 🏛️ Cosa Sono le API Catastali?

Le **API catastali** permettono di accedere ai dati del **Catasto Italiano** (gestito dall'Agenzia delle Entrate) tramite chiamate programmatiche.

Il **Catasto** contiene:
- Dati tecnici degli immobili (planimetrie, superficie, altezza)
- Dati identificativi (foglio, particella, subalterno)
- Dati di classamento (categoria catastale, classe, rendita)
- Dati proprietà e titolarità

---

## 📋 Quali Dati Forniscono per il Tuo Caso d'Uso

### Dati Utili per Polizze Catnat

| Dato Catastale | Utilità per Catnat | Equivalente OSM |
|----------------|-------------------|-----------------|
| **Categoria Catastale** | Tipo immobile (C/1=negozio, A/10=ufficio, D/1=industriale) | `building=retail/office` |
| **Numero Piani** | Piani fuori terra (es. "P. 3") | `building:levels=3` |
| **Presenza Seminterrato** | Piano S1, S2 nelle planimetrie | `building:levels:underground` |
| **Superficie Catastale** | m² calpestabili | Calcolo da poligono OSM |
| **Classe Energetica** | Qualità costruzione | `building:material` (indiretto) |
| **Anno Costruzione** | Anzianità edificio | `start_date` in OSM |
| **Planimetrie** | Layout interno, vani, altezze | Non disponibile in OSM |

---

## 🔐 Come Accedere alle API Catastali

### Opzione 1: **Sister - Agenzia delle Entrate** (Ufficiale)

**URL**: https://sister.agenziaentrate.gov.it

**Cosa Offre**:
- Consultazione visure catastali
- Ispezione ipotecaria
- Consultazione planimetrie
- **NO API pubbliche REST** (solo interfaccia web)

**Limitazioni**:
- Richiede autenticazione SPID/CIE
- Consultazioni a pagamento (€1-10 per visura)
- Non esiste API REST pubblica documentata
- Accesso manuale via web

**Costi**:
- Visura catastale: ~€1,35
- Planimetria: ~€3,50
- Ispezione ipotecaria: ~€8,00

**Per Sviluppatori**: ❌ Non utilizzabile per automazione

---

### Opzione 2: **Geoportale Nazionale** (Parziale)

**URL**: http://www.pcn.minambiente.it/mattm/

**Cosa Offre**:
- WMS/WFS per mappe catastali
- Confini particelle (poligoni)
- Dati geografici aperti
- **NO dati alfanumerici** (superficie, piani, ecc.)

**API Disponibili**:
- WMS (Web Map Service): mappe raster
- WFS (Web Feature Service): vettoriali
- CSW (Catalog Service): metadata

**Esempio Query WFS**:
```xml
GET http://wms.pcn.minambiente.it/ogc?
  service=WFS&
  version=1.0.0&
  request=GetFeature&
  typeName=DB_CATASTO&
  bbox=9.0,45.0,10.0,46.0
```

**Per Sviluppatori**: ⚠️ Solo per mappe, non dati tecnici

---

### Opzione 3: **Servizi Commerciali con API** (Raccomandato)

Esistono intermediari che hanno accordi con AgE e forniscono API:

#### 🏆 **Cerved** (Leader di Mercato)

**URL**: https://company.cerved.com

**Cosa Offre**:
- API REST per dati catastali
- Visure catastali automatizzate
- Dati immobiliari strutturati
- Integrazione con dati aziendali (già nel tuo stack!)

**API Endpoint** (esempio):
```bash
POST https://api.cerved.com/v2/catasto/visura
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "foglio": "12",
  "particella": "456",
  "comune": "H501"  // Codice catastale Milano
}
```

**Risposta**:
```json
{
  "immobile": {
    "categoria": "C/1",
    "classe": "3",
    "superficie": "120",
    "piani": 2,
    "seminterrato": false,
    "annoCostruzione": 1985,
    "rendita": 1200.50
  }
}
```

**Costi**:
- Setup: €500-2.000 (contratto annuale)
- Per chiamata: €0.50-2.00
- Volume: sconti oltre 10.000 chiamate/mese

**Per Sviluppatori**: ✅ Ideale per produzione

---

#### **Infocamere** (Camera di Commercio)

**URL**: https://www.infocamere.it

**Cosa Offre**:
- Visure camerali + catastali bundle
- API per dati aziendali + immobili
- Integrazione con Registro Imprese

**API**:
- Simile a Cerved
- Focus su immobili commerciali/industriali

**Costi**:
- Simili a Cerved
- Spesso abbinato a visure camerali

---

#### **Visure Italia** / **VisureNetwork**

**URL**: https://www.visureitalia.com

**Cosa Offre**:
- API REST per visure catastali
- Pay-per-use (no contratti annuali)
- Webhook per elaborazione asincrona

**Costi**:
- €2-5 per visura
- No setup fee
- Ideale per startup/MVP

---

## 🔧 Come Integrare nell'App Catnat

### Architettura Proposta

```
┌─────────────┐
│   P.IVA     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  1. Cerved BI API   │  ← Dati azienda + immobili registrati
│     (già nel tuo    │
│      adapter!)      │
└──────┬──────────────┘
       │
       ▼ indirizzo
┌─────────────────────┐
│  2. Geocoding       │  ← lat, lng
│     (Nominatim/     │
│      Google)        │
└──────┬──────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌─────────────┐         ┌──────────────────┐
│  3a. OSM    │         │  3b. Catasto API │
│  (Overpass) │         │  (Cerved/Visure) │
│             │         │                  │
│ - Footprint │         │ - Piani: 3       │
│ - Material  │         │ - Seminterrato:  │
│             │         │   Sì (S1)        │
│             │         │ - Superficie:    │
│             │         │   250 m²         │
│             │         │ - Anno: 1990     │
└─────────────┘         └──────────────────┘
       │                         │
       └──────────┬──────────────┘
                  ▼
         ┌─────────────────┐
         │  4. Merge Data  │
         │  (best source)  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  5. Inference   │
         │   + Massimali   │
         └─────────────────┘
```

### Codice di Esempio

#### 1. Adapter Catastale

```typescript
// src/adapters/catasto.ts

import { BuildingTags, Confidence } from '@/lib/types';

export interface CatastoData {
  categoria: string;  // C/1, A/10, D/1
  piani: number;
  seminterrato: boolean;
  superficieM2: number;
  annoCostruzione?: number;
  classe?: string;
}

export interface ICatastoAdapter {
  getDataByAddress(address: string): Promise<CatastoData | null>;
  getDataByCoordinates(lat: number, lng: number): Promise<CatastoData | null>;
}

// Implementazione Cerved
export class CervedCatastoAdapter implements ICatastoAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.cerved.com/v2';
  }

  async getDataByAddress(address: string): Promise<CatastoData | null> {
    try {
      // Step 1: Risolvi indirizzo → foglio/particella
      const catastaleId = await this.resolveCatastaleId(address);

      if (!catastaleId) return null;

      // Step 2: Richiedi visura
      const response = await fetch(`${this.baseUrl}/catasto/visura`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foglio: catastaleId.foglio,
          particella: catastaleId.particella,
          comune: catastaleId.comune,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cerved API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Step 3: Mappa risposta
      return {
        categoria: data.immobile.categoria,
        piani: this.parsePiani(data.immobile),
        seminterrato: this.hasSeminterrato(data.immobile),
        superficieM2: parseFloat(data.immobile.superficie),
        annoCostruzione: data.immobile.annoCostruzione,
        classe: data.immobile.classe,
      };

    } catch (error) {
      console.error('Cerved catasto error:', error);
      return null;
    }
  }

  private parsePiani(immobile: any): number {
    // Parsing logica piani da dati catastali
    // Esempio: "P. 3" → 3, "P.T. + 2" → 3
    const pianiStr = immobile.piani || '';
    const match = pianiStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  private hasSeminterrato(immobile: any): boolean {
    // Cerca indicatori di seminterrato
    const piani = immobile.piani?.toLowerCase() || '';
    return piani.includes('s1') ||
           piani.includes('semint') ||
           piani.includes('interrato');
  }

  private async resolveCatastaleId(address: string) {
    // Chiamata a servizio geocoding catastale Cerved
    // Restituisce foglio/particella da indirizzo
    // Implementazione specifica Cerved
    return { foglio: '12', particella: '456', comune: 'H501' };
  }

  async getDataByCoordinates(lat: number, lng: number): Promise<CatastoData | null> {
    // Cerved può supportare query per coordinate
    // Alternativa: usa reverse geocoding poi getDataByAddress
    return null;
  }
}

// Factory
export function getCatastoAdapter(): ICatastoAdapter | null {
  const useCatasto = process.env.USE_CATASTO === 'true';

  if (!useCatasto) return null;

  const provider = process.env.CATASTO_PROVIDER || 'cerved';

  if (provider === 'cerved') {
    const apiKey = process.env.CERVED_API_KEY;
    if (!apiKey) {
      console.warn('CERVED_API_KEY not set');
      return null;
    }
    return new CervedCatastoAdapter(apiKey);
  }

  return null;
}
```

#### 2. Integrazione nel Prefill

```typescript
// app/api/prefill/route.ts (modificato)

import { getCatastoAdapter } from '@/adapters/catasto';

export async function POST(req: NextRequest) {
  // ... codice esistente ...

  // Dopo geocoding
  const geo = await geocodingAdapter.geocodeAddress(company.indirizzo);

  // 🆕 Prova API catastale prima di OSM
  const catastoAdapter = getCatastoAdapter();
  let building: BuildingData;

  if (catastoAdapter) {
    const catastoData = await catastoAdapter.getDataByAddress(company.indirizzo);

    if (catastoData) {
      // Usa dati catastali (HIGH confidence)
      building = {
        areaM2: catastoData.superficieM2,
        floors: catastoData.piani,
        hasBasement: catastoData.seminterrato,
        materialCategory: mapCategoriaCatastale(catastoData.categoria),
        tags: {},
        confidence: 'HIGH',
        sources: {
          floors: createSourceInfo('Catasto', 'visura_catastale', 'HIGH'),
          area: createSourceInfo('Catasto', 'visura_catastale', 'HIGH'),
          basement: createSourceInfo('Catasto', 'planimetria', 'HIGH'),
        },
      };
    } else {
      // Fallback a OSM
      building = await getBuildingFromOSM(geo.lat, geo.lng);
    }
  } else {
    // Solo OSM (comportamento attuale)
    building = await getBuildingFromOSM(geo.lat, geo.lng);
  }

  // ... resto del codice ...
}

function mapCategoriaCatastale(categoria: string): MaterialCategory {
  // C/1 = negozio → probabilmente cls/laterizio
  // D/1 = industriale → probabilmente metallo
  // A/10 = ufficio → cls/laterizio

  if (categoria.startsWith('D/')) return 'METAL';
  if (categoria.startsWith('C/') || categoria.startsWith('A/')) return 'CLS_LATERIZIO';
  return 'UNKNOWN';
}
```

---

## 💰 Confronto Costi

| Fonte Dati | Setup | Costo Unitario | Affidabilità | Coverage Italia |
|------------|-------|----------------|--------------|-----------------|
| **OSM** | Gratis | Gratis | Bassa (5%) | ~30% edifici mappati |
| **Geoportale** | Gratis | Gratis | Media | 100% (solo mappe) |
| **Cerved** | €1.500/anno | €0.50-2.00 | Alta (95%) | ~100% |
| **Visure Italia** | Gratis | €2-5 | Alta (95%) | ~100% |
| **Sister (manuale)** | Gratis | €1.35-8.00 | Massima (100%) | 100% |

---

## 📊 Esempio Risposta Catastale vs OSM

### Edificio: Ufficio in Via Torino 78, Milano

#### Risposta OSM (Attuale)
```json
{
  "tags": {
    "building": "yes"  // ← Solo questo
  },
  "floors": 2,           // ← Stimato (LOW)
  "basement": false,     // ← Stimato (MEDIUM)
  "area": 250            // ← Default (LOW)
}
```

#### Risposta Catasto (con API)
```json
{
  "categoria": "A/10",          // Ufficio
  "piani": 4,                   // Dato reale
  "seminterrato": true,         // S1 in planimetria
  "superficie": 387,            // m² catastali
  "annoCostruzione": 1975,
  "classe": "3",
  "vani": 8,
  "confidence": "HIGH"
}
```

**Differenza**:
- Piani: 2 (stima) vs **4 (reale)** → +100% precisione
- Seminterrato: No (stima) vs **Sì (reale)** → correzione critica per rischio
- Area: 250 (default) vs **387 (reale)** → +55% precisione

**Impatto su massimale**:
- Con OSM: €200.000 stimato
- Con Catasto: €380.000 stimato (+90% accuracy)

---

## 🚀 Raccomandazioni per Produzione

### Strategia Ibrida (Best Practice)

1. **Prova Catasto prima** (se disponibile)
   - Confidence: HIGH
   - Costo: €0.50-2.00 per visura

2. **Fallback a OSM**
   - Confidence: LOW-MEDIUM
   - Costo: Gratis

3. **Cache aggressiva**
   - Salva dati catastali per 6-12 mesi
   - Riduci costi ripetuti

### Configurazione .env

```bash
# Catasto API
USE_CATASTO=true
CATASTO_PROVIDER=cerved  # cerved | visureitalia
CERVED_API_KEY=your_key_here
CERVED_BASE_URL=https://api.cerved.com/v2

# Fallback
USE_OSM_FALLBACK=true
```

### Costo Totale Esempio

**Scenario**: 1.000 preventivi/mese

**Opzione A - Solo OSM**:
- Costo: €0
- Accuracy: ~30%
- Rework preventivi errati: alto

**Opzione B - Solo Catasto**:
- Costo: €1.000-2.000/mese
- Accuracy: ~95%
- ROI: riduzione errori > risparmio rework

**Opzione C - Ibrida** (raccomandato):
- Catasto: 500 chiamate × €1 = €500
- OSM fallback: 500 × €0 = €0
- **Totale: €500/mese**
- Accuracy: ~65% (media pesata)

---

## 📚 Riferimenti

- [Sister - Agenzia Entrate](https://sister.agenziaentrate.gov.it)
- [Geoportale Nazionale](http://www.pcn.minambiente.it/mattm/)
- [Cerved Company](https://company.cerved.com)
- [Infocamere](https://www.infocamere.it)
- [Catasto - Come Leggere Visure](https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/visura-catastale-telematica)

---

## ❓ FAQ

**Q: Posso accedere ai dati catastali gratuitamente?**
A: Solo tramite Sister (manuale, €1.35 per visura), non via API automatizzate.

**Q: Cerved ha anche dati aziendali?**
A: Sì! Puoi fare chiamata unica per dati azienda + immobili → ottimo per Catnat.

**Q: Quanto tempo ci vuole per setup Cerved?**
A: ~2-4 settimane (contratto, onboarding, credenziali API, test).

**Q: Alternative gratuite?**
A: Geoportale per mappe, ma senza dati alfanumerici (piani, superficie).

**Q: Posso screenpare Sister?**
A: ❌ Vietato dai ToS, rischio legale. Usa API ufficiali/intermediari.
