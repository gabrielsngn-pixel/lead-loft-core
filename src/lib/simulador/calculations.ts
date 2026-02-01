/**
 * Simulador de Viabilidade Loft
 * Lógica exata conforme especificado no histórico
 */

// Taxas dos bancos
export const BANK_RATES = {
  itau: 1.8,
  santander: 1.8,
  bradesco: 2.0,
};

// Modelos Caixa
export interface CaixaModel {
  id: string;
  label: string;
  rate: number; // %
  ceiling: number | null; // R$ por unidade, null = sem teto
}

export const CAIXA_MODELS: CaixaModel[] = [
  { id: "individual_spbe", label: "Individual SPBE", rate: 1.0, ceiling: null },
  { id: "alocacao_spbe", label: "Alocação SPBE", rate: 1.0, ceiling: 5000 },
  { id: "individual_mcmv", label: "Individual MCMV", rate: 0.8, ceiling: 2000 },
  { id: "alocacao_mcmv", label: "Alocação MCMV", rate: 0.8, ceiling: 600 },
];

// Tipos de registro
export type RegistroTipo = "parceiro" | "internalizado" | "sem_registro";

export const REGISTRO_OPTIONS = [
  { id: "parceiro" as const, label: "Registro com parceiro", desc: "Neutro para a Loft" },
  { id: "internalizado" as const, label: "Registro internalizado pela Loft", desc: "Gera receita incremental" },
  { id: "sem_registro" as const, label: "Projeto sem registro", desc: "Sensível à comissão" },
];

// Coparticipação CRE (oculta para incorporadores)
const COPARTICIPACAO_LOFT = 0.5; // 50%
const MARGEM_MINIMA = 0.30; // 0,30%

export interface BankMix {
  itau: number;
  santander: number;
  bradesco: number;
  caixa: number;
}

export interface CaixaSubMix {
  individual_spbe: number;
  alocacao_spbe: number;
  individual_mcmv: number;
  alocacao_mcmv: number;
}

export interface SimuladorInputs {
  unidades: number;
  vgv: number;
  bankMix: BankMix;
  caixaSubMix: CaixaSubMix;
  comissaoIncorporador: number; // % (0-2)
  registroTipo: RegistroTipo;
  valorRegistroPorUnidade: number;
}

export interface SimuladorResults {
  // Comissão calculada
  taxaPonderadaBanco: number;
  taxaEfetivaCaixa: number;
  caixaTetoAplicado: boolean;
  
  // Receitas
  receitaBrutaTotal: number;
  custoComissaoIncorporador: number;
  receitaLiquidaTotal: number;
  
  // Coparticipação (50/50)
  receitaLoft: number;
  receitaCRE: number;
  
  // Registro
  receitaRegistroTotal: number;
  receitaRegistroLoft: number;
  receitaRegistroCRE: number;
  
  // Margem final
  margemLoft: number; // %
  margemMinima: number; // %
  
  // Status
  status: "viavel" | "limite" | "inviavel";
  mensagem: string;
}

export const defaultInputs: SimuladorInputs = {
  unidades: 100,
  vgv: 50000000,
  bankMix: {
    itau: 25,
    santander: 25,
    bradesco: 25,
    caixa: 25,
  },
  caixaSubMix: {
    individual_spbe: 50,
    alocacao_spbe: 50,
    individual_mcmv: 0,
    alocacao_mcmv: 0,
  },
  comissaoIncorporador: 0.5,
  registroTipo: "parceiro",
  valorRegistroPorUnidade: 1500,
};

/**
 * Calcula taxa efetiva da Caixa baseado no sub-mix e ticket médio
 */
export function calcularTaxaEfetivaCaixa(
  subMix: CaixaSubMix,
  ticketMedio: number
): { taxa: number; tetoAplicado: boolean } {
  let taxaPonderada = 0;
  let tetoAplicado = false;

  const entries = [
    { key: "individual_spbe" as const, ...CAIXA_MODELS[0], pct: subMix.individual_spbe },
    { key: "alocacao_spbe" as const, ...CAIXA_MODELS[1], pct: subMix.alocacao_spbe },
    { key: "individual_mcmv" as const, ...CAIXA_MODELS[2], pct: subMix.individual_mcmv },
    { key: "alocacao_mcmv" as const, ...CAIXA_MODELS[3], pct: subMix.alocacao_mcmv },
  ];

  for (const entry of entries) {
    if (entry.pct <= 0) continue;

    let taxaEfetiva = entry.rate;

    // Aplicar teto se existir
    if (entry.ceiling !== null && ticketMedio > 0) {
      const taxaComTeto = (entry.ceiling / ticketMedio) * 100;
      if (taxaComTeto < entry.rate) {
        taxaEfetiva = taxaComTeto;
        tetoAplicado = true;
      }
    }

    taxaPonderada += (entry.pct / 100) * taxaEfetiva;
  }

  return { taxa: taxaPonderada, tetoAplicado };
}

/**
 * Calcula taxa ponderada do mix bancário
 */
export function calcularTaxaPonderadaBanco(
  bankMix: BankMix,
  taxaEfetivaCaixa: number
): number {
  const taxaPonderada =
    (bankMix.itau / 100) * BANK_RATES.itau +
    (bankMix.santander / 100) * BANK_RATES.santander +
    (bankMix.bradesco / 100) * BANK_RATES.bradesco +
    (bankMix.caixa / 100) * taxaEfetivaCaixa;

  return taxaPonderada;
}

/**
 * Valida se o mix bancário soma 100%
 */
export function validarMixBancario(mix: BankMix): boolean {
  const total = mix.itau + mix.santander + mix.bradesco + mix.caixa;
  return Math.abs(total - 100) < 0.01;
}

/**
 * Valida se o sub-mix Caixa soma 100%
 */
export function validarSubMixCaixa(subMix: CaixaSubMix): boolean {
  const total =
    subMix.individual_spbe +
    subMix.alocacao_spbe +
    subMix.individual_mcmv +
    subMix.alocacao_mcmv;
  return Math.abs(total - 100) < 0.01;
}

/**
 * Determina status de viabilidade
 */
function determinarStatus(margem: number): { status: SimuladorResults["status"]; mensagem: string } {
  if (margem >= MARGEM_MINIMA) {
    return {
      status: "viavel",
      mensagem: `Projeto viável com margem de ${margem.toFixed(2)}%`,
    };
  } else if (margem >= 0.20) {
    return {
      status: "limite",
      mensagem: `Margem no limite (${margem.toFixed(2)}%). Avaliar com CFO.`,
    };
  } else {
    return {
      status: "inviavel",
      mensagem: `Margem insuficiente (${margem.toFixed(2)}%). Abaixo do mínimo de ${MARGEM_MINIMA}%.`,
    };
  }
}

/**
 * Calcula viabilidade completa
 */
export function calcularViabilidade(inputs: SimuladorInputs): SimuladorResults {
  const ticketMedio = inputs.unidades > 0 ? inputs.vgv / inputs.unidades : 0;

  // Taxa efetiva Caixa
  const { taxa: taxaEfetivaCaixa, tetoAplicado: caixaTetoAplicado } = calcularTaxaEfetivaCaixa(
    inputs.caixaSubMix,
    ticketMedio
  );

  // Taxa ponderada do mix bancário
  const taxaPonderadaBanco = calcularTaxaPonderadaBanco(inputs.bankMix, taxaEfetivaCaixa);

  // Receita bruta = VGV × taxa ponderada
  const receitaBrutaTotal = inputs.vgv * (taxaPonderadaBanco / 100);

  // Custo = VGV × comissão incorporador
  const custoComissaoIncorporador = inputs.vgv * (inputs.comissaoIncorporador / 100);

  // Receita líquida
  const receitaLiquidaTotal = receitaBrutaTotal - custoComissaoIncorporador;

  // Coparticipação 50/50 (oculta)
  const receitaLoft = receitaLiquidaTotal * COPARTICIPACAO_LOFT;
  const receitaCRE = receitaLiquidaTotal * (1 - COPARTICIPACAO_LOFT);

  // Registro
  let receitaRegistroTotal = 0;
  let receitaRegistroLoft = 0;
  let receitaRegistroCRE = 0;

  if (inputs.registroTipo === "internalizado") {
    receitaRegistroTotal = inputs.valorRegistroPorUnidade * inputs.unidades;
    receitaRegistroLoft = receitaRegistroTotal * COPARTICIPACAO_LOFT;
    receitaRegistroCRE = receitaRegistroTotal * (1 - COPARTICIPACAO_LOFT);
  }

  // Margem Loft = (Receita Loft + Registro Loft) / VGV × 100
  const margemLoft = inputs.vgv > 0 ? ((receitaLoft + receitaRegistroLoft) / inputs.vgv) * 100 : 0;

  // Status
  const { status, mensagem } = determinarStatus(margemLoft);

  return {
    taxaPonderadaBanco,
    taxaEfetivaCaixa,
    caixaTetoAplicado,
    receitaBrutaTotal,
    custoComissaoIncorporador,
    receitaLiquidaTotal,
    receitaLoft,
    receitaCRE,
    receitaRegistroTotal,
    receitaRegistroLoft,
    receitaRegistroCRE,
    margemLoft,
    margemMinima: MARGEM_MINIMA,
    status,
    mensagem,
  };
}

/**
 * Formata valor em moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}
