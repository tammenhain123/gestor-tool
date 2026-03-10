export type CepAddress = {
  cep?: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string;
  raw?: any;
};

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  if (!cep) return null;
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      cep: data.cep,
      rua: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      complemento: data.complemento,
      raw: data,
    };
  } catch (err) {
    return null;
  }
}

// CNAE helpers (IBGE Service)
const CNAE_BASE = 'https://servicodados.ibge.gov.br/api/v2/cnae';

export async function getCnaeClass(code: string): Promise<any | null> {
  if (!code) return null;
  const cleaned = code.replace(/\D/g, '');
  try {
    const res = await fetch(`${CNAE_BASE}/classes/${cleaned}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
}

export async function getCnaeSubclassesForClass(code: string): Promise<any[] | null> {
  if (!code) return null;
  const cleaned = code.replace(/\D/g, '');
  try {
    const res = await fetch(`${CNAE_BASE}/classes/${cleaned}/subclasses`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
}

export async function listCnaeSections(): Promise<any[] | null> {
  try {
    const res = await fetch(`${CNAE_BASE}/secoes`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
}

export default {
  lookupCep,
  getCnaeClass,
  getCnaeSubclassesForClass,
  listCnaeSections,
};
