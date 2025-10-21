import { IBIAdapter, CompanyData } from '@/lib/types';
import { createSourceInfo } from '@/lib/confidence';
import mockCompanies from '@/seed/mock_companies.json';

export class MockBIAdapter implements IBIAdapter {
  async getCompanyByPIVA(piva: string): Promise<CompanyData | null> {
    const company = mockCompanies.find(c => c.piva === piva);

    if (!company) {
      return null;
    }

    const fullAddress = `${company.indirizzo}, ${company.cap} ${company.comune} (${company.provincia})`;

    return {
      piva: company.piva,
      ragioneSociale: company.ragioneSociale,
      indirizzo: fullAddress,
      cap: company.cap,
      comune: company.comune,
      ateco: company.ateco,
      fatturatoStimato: company.fatturatoStimato,
      dipendentiStimati: company.dipendentiStimati,
      sources: {
        base: createSourceInfo('MockBI', 'mock_database', 'HIGH', 'Dati da database demo'),
        fatturato: company.fatturatoStimato
          ? createSourceInfo('MockBI', 'mock_database', 'HIGH')
          : createSourceInfo('MockBI', 'not_available', 'LOW', 'Dato non disponibile'),
        dipendenti: company.dipendentiStimati
          ? createSourceInfo('MockBI', 'mock_database', 'HIGH')
          : createSourceInfo('MockBI', 'not_available', 'LOW', 'Dato non disponibile'),
      },
    };
  }
}

// Stub for future Cerved-like integration
export class CervedLikeAdapter implements IBIAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getCompanyByPIVA(piva: string): Promise<CompanyData | null> {
    // Stub implementation
    // In production, this would call the Cerved API
    throw new Error('CervedLikeAdapter not implemented. Use MockBIAdapter for demo.');
  }
}

export function getBIAdapter(): IBIAdapter {
  const biSource = process.env.BI_SOURCE || 'mock';

  if (biSource === 'mock') {
    return new MockBIAdapter();
  }

  if (biSource === 'cerved') {
    const apiKey = process.env.CERVED_API_KEY || '';
    const baseUrl = process.env.CERVED_BASE_URL || '';
    return new CervedLikeAdapter(apiKey, baseUrl);
  }

  return new MockBIAdapter();
}
