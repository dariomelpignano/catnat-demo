import { Confidence, MaterialCategory, MassimaliBreakdown } from '@/lib/types';
import { combineConfidence } from '@/lib/confidence';

interface MassimaliInput {
  ateco: string;
  areaM2: number;
  floors: number;
  employeesGuess?: number;
  fatturatoGuess?: number;
  materialCategory: MaterialCategory;
  floodScore: number;
  areaConfidence: Confidence;
  floorsConfidence: Confidence;
}

interface MassimaliOutput {
  beniStrumentali: number;
  scorte: number;
  impianti: number;
  massimale: number;
  breakdown: MassimaliBreakdown;
  confidence: Confidence;
}

/**
 * R6 - Stima massimali suggeriti
 * Applica regole parametriche per categoria ATECO
 */
export function estimateAssets(input: MassimaliInput): MassimaliOutput {
  const { ateco, areaM2, floors, employeesGuess, fatturatoGuess, materialCategory, floodScore } = input;

  // Determina categoria da ATECO
  const atecoPrefix = ateco.substring(0, 2);

  let beniStrumentali = 0;
  let scorte = 0;
  let impianti = 0;
  let confidence: Confidence = 'MEDIUM';

  // Industrial (ATECO 10-33: manifatturiero)
  if (atecoPrefix >= '10' && atecoPrefix <= '33') {
    // R6 - Industrial:
    // beni_strum = α1*area_m2 + α2*floors
    // scorte = β1*employeesGuess
    // impianti = γ1*area_m2
    const alpha1 = 450; // €/m²
    const alpha2 = 20000; // €/piano
    const beta1 = 7500; // € per dipendente
    const gamma1 = 120; // €/m²

    beniStrumentali = alpha1 * areaM2 + alpha2 * floors;
    scorte = beta1 * (employeesGuess || 10);
    impianti = gamma1 * areaM2;

    confidence = combineConfidence(input.areaConfidence, input.floorsConfidence);
  }
  // Retail (ATECO 45-47: commercio)
  else if (atecoPrefix >= '45' && atecoPrefix <= '47') {
    // R6 - Retail:
    // scorte = k*area_m2
    // arredi/impianti = 250 €/m²
    const k = 400; // €/m²
    const arrediPerM2 = 250;

    scorte = k * areaM2;
    beniStrumentali = arrediPerM2 * areaM2 * 0.5; // arredi
    impianti = arrediPerM2 * areaM2 * 0.5;

    confidence = combineConfidence(input.areaConfidence, 'MEDIUM');
  }
  // Office / Services (ATECO 58-82: servizi)
  else if (
    (atecoPrefix >= '58' && atecoPrefix <= '82') ||
    atecoPrefix === '62' ||
    atecoPrefix === '63'
  ) {
    // R6 - Office:
    // attrezzature = 4k € × employeesGuess
    // impianti = 150 €/m²
    const attrezzaturePerDip = 4000;
    const impiantiPerM2 = 150;

    beniStrumentali = attrezzaturePerDip * (employeesGuess || 5);
    impianti = impiantiPerM2 * areaM2;
    scorte = 0; // uffici generalmente senza scorte

    confidence = combineConfidence(input.areaConfidence, 'MEDIUM');
  }
  // Logistics / Warehouse (ATECO 52: magazzinaggio)
  else if (atecoPrefix === '52') {
    const alpha1 = 300;
    const beta1 = 8000;
    const gamma1 = 100;

    beniStrumentali = alpha1 * areaM2;
    scorte = beta1 * (employeesGuess || 15);
    impianti = gamma1 * areaM2;

    confidence = combineConfidence(input.areaConfidence, 'MEDIUM');
  }
  // Hospitality (ATECO 55-56: alloggio e ristorazione)
  else if (atecoPrefix === '55' || atecoPrefix === '56') {
    const arrediPerM2 = 350;
    const impiantiPerM2 = 200;

    beniStrumentali = arrediPerM2 * areaM2;
    impianti = impiantiPerM2 * areaM2;
    scorte = 50 * areaM2; // scorte alimentari/bevande

    confidence = combineConfidence(input.areaConfidence, 'MEDIUM');
  }
  // Default
  else {
    beniStrumentali = 250 * areaM2;
    impianti = 100 * areaM2;
    scorte = 50 * areaM2;
    confidence = 'LOW';
  }

  // Applica uplift per rischio allagamento
  const uplift = 1 + 0.25 * floodScore;

  const massimale = Math.round((beniStrumentali + scorte + impianti) * uplift);

  const breakdown: MassimaliBreakdown = {
    beniStrumentali: Math.round(beniStrumentali),
    scorte: Math.round(scorte),
    impianti: Math.round(impianti),
    uplift: parseFloat(uplift.toFixed(2)),
    massimale,
  };

  return {
    beniStrumentali: breakdown.beniStrumentali,
    scorte: breakdown.scorte,
    impianti: breakdown.impianti,
    massimale,
    breakdown,
    confidence,
  };
}
