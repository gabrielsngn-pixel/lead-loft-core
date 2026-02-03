/**
 * Simulador de Viabilidade Loft
 * Pacote Mínimo Transferível — 100% fiel às especificações
 */

// ============================================
// 1. CONSTANTES FIXAS (Não Expostas ao Usuário)
// ============================================
export const CONSTANTS = {
  TAX_RATE: 0.101,              // 10,1% de impostos sobre receita bruta
  OPERATIONAL_COSTS: 0.0024,    // 0,24% custos operacionais (100% Loft)
  MIN_MARGIN: 0.000,            // 0,00% margem mínima (governança) - permite aprovação de qualquer margem >= 0
  VIABLE_MARGIN: 0.004,         // 0,40% margem viável
  LOFT_PARTICIPATION: 0.5,      // 50% rateio Loft
  PARTNER_PARTICIPATION: 0.5,   // 50% rateio CRE
};

// ============================================
// 1.2 TAXAS BANCÁRIAS FIXAS
// ============================================
export const BANK_RATES = {
  itau: 0.018,        // 1,80%
  santander: 0.018,   // 1,80%
  bradesco: 0.02,     // 2,00%
  // caixa: variável (depende do sub-mix)
};

// ============================================
// 1.3 PRODUTOS CAIXA (Taxas com Teto)
// ============================================
export interface CaixaModel {
  id: string;
  label: string;
  rate: number;        // Taxa base (decimal)
  ceiling: number | null; // Teto R$/unidade, null = sem teto
}

export const CAIXA_MODELS: CaixaModel[] = [
  { id: "individual_spbe", label: "Ind. SPBE", rate: 0.01, ceiling: null },
  { id: "alocacao_spbe", label: "Aloc. SPBE", rate: 0.01, ceiling: 5000 },
  { id: "individual_mcmv", label: "Ind. MCMV", rate: 0.008, ceiling: 2000 },
  { id: "alocacao_mcmv", label: "Aloc. MCMV", rate: 0.008, ceiling: 600 },
];

// ============================================
// TIPOS DE REGISTRO
// ============================================
export type RegistroTipo = "parceiro" | "internalizado" | "sem_registro";

export const REGISTRO_OPTIONS = [
  { id: "parceiro" as const, label: "Registro com parceiro", desc: "Neutro para a Loft" },
  { id: "internalizado" as const, label: "Registro internalizado pela Loft", desc: "Gera receita incremental" },
  { id: "sem_registro" as const, label: "Projeto sem registro", desc: "Sensível à comissão" },
];

// ============================================
// INTERFACES
// ============================================
export interface BankMix {
  itau: number;      // % (0-100)
  santander: number; // % (0-100)
  bradesco: number;  // % (0-100)
  caixa: number;     // % (0-100)
}

export interface CaixaSubMix {
  individual_spbe: number;  // % (0-100)
  alocacao_spbe: number;    // % (0-100)
  individual_mcmv: number;  // % (0-100)
  alocacao_mcmv: number;    // % (0-100)
}

export interface SimuladorInputs {
  unidades: number;
  vgv: number;
  bankMix: BankMix;
  caixaSubMix: CaixaSubMix;
  comissaoIncorporador: number; // % (0-1)
  registroTipo: RegistroTipo;
  valorRegistroPorUnidade: number;
  remunerarCaixa: boolean; // Nova variável: se true, Caixa gera receita
}

// Breakdown de receita por banco
export interface ReceitaPorBanco {
  itau: number;
  santander: number;
  bradesco: number;
  caixa: number;
}

export interface SimuladorResults {
  // Base
  ticketMedio: number;
  
  // Comissão bancária
  taxaPonderadaBanco: number;        // % (decimal, ex: 0.0175 = 1.75%)
  taxaEfetivaCaixa: number;          // % (decimal)
  caixaTetoAplicado: boolean;
  caixaDetalhe: CaixaProdutoDetalhe[];
  
  // Breakdown de receita por banco (em R$)
  receitaPorBanco: ReceitaPorBanco;
  receitaPorBancoPercent: ReceitaPorBanco;
  caixaRemunerada: boolean;
  
  // Receitas (em %)
  receitaBrutaPercent: number;       // bank_commission - incorporator_commission
  impostoPercent: number;            // receita_bruta × 0.101
  receitaLiquidaTotalPercent: number;// receita_bruta - impostos
  
  // Rateio 50/50 (em %)
  receitaLiquidaLoftPercent: number;
  receitaLiquidaCREPercent: number;
  
  // Registro (em %)
  receitaRegistroTotalPercent: number;
  receitaRegistroLoftPercent: number;
  receitaRegistroCREPercent: number;
  
  // Receita Loft com Registro (em %)
  receitaLoftComRegistroPercent: number;
  
  // Custos Operacionais (em %)
  custosOperacionaisPercent: number;
  
  // Margem Final (em %)
  margemFinalPercent: number;
  
  // Valores em R$
  receitaBrutaCurrency: number;
  impostoCurrency: number;
  receitaLiquidaTotalCurrency: number;
  receitaLiquidaLoftCurrency: number;
  receitaLiquidaCRECurrency: number;
  receitaRegistroTotal: number;
  receitaRegistroLoft: number;
  receitaRegistroCRE: number;
  custosOperacionaisCurrency: number;
  margemFinalCurrency: number;
  
  // Status
  status: "viable" | "limit" | "inviable";
  statusLabel: string;
  statusColor: "green" | "yellow" | "red";
  
  // Alertas
  alerts: Alert[];
  
  // Legado (compatibilidade)
  margemLoft: number;        // Em % (ex: 0.42 para 0.42%)
  margemMinima: number;      // 0.30
  receitaBrutaTotal: number;
  receitaLiquidaTotal: number;
  receitaLoft: number;
  receitaCRE: number;
  custoComissaoIncorporador: number;
}

export interface CaixaProdutoDetalhe {
  id: string;
  label: string;
  pct: number;             // % do submix
  taxaBase: number;        // taxa original
  taxaEfetiva: number;     // após aplicar teto
  contribuicao: number;    // contribuição para taxa ponderada
  tetoAplicado: boolean;
  valorTeto: number | null;
}

export interface Alert {
  type: "success" | "warning" | "error";
  message: string;
}

// ============================================
// DEFAULTS
// ============================================
export const defaultInputs: SimuladorInputs = {
  unidades: 100,
  vgv: 50000000,
  bankMix: {
    itau: 40,
    santander: 30,
    bradesco: 20,
    caixa: 10,
  },
  caixaSubMix: {
    individual_spbe: 50,
    alocacao_spbe: 30,
    individual_mcmv: 15,
    alocacao_mcmv: 5,
  },
  comissaoIncorporador: 0.5,
  registroTipo: "parceiro",
  valorRegistroPorUnidade: 1000,
  remunerarCaixa: false, // Padrão: Caixa não remunerada
};

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula taxa efetiva de cada produto Caixa considerando teto
 */
export function calcularTaxaEfetivaCaixa(
  subMix: CaixaSubMix,
  ticketMedio: number
): { taxaEfetiva: number; tetoAplicado: boolean; detalhe: CaixaProdutoDetalhe[] } {
  let taxaPonderada = 0;
  let tetoAplicado = false;
  const detalhe: CaixaProdutoDetalhe[] = [];

  const entries = [
    { key: "individual_spbe" as const, model: CAIXA_MODELS[0], pct: subMix.individual_spbe },
    { key: "alocacao_spbe" as const, model: CAIXA_MODELS[1], pct: subMix.alocacao_spbe },
    { key: "individual_mcmv" as const, model: CAIXA_MODELS[2], pct: subMix.individual_mcmv },
    { key: "alocacao_mcmv" as const, model: CAIXA_MODELS[3], pct: subMix.alocacao_mcmv },
  ];

  for (const entry of entries) {
    let taxaEfetivaProduto = entry.model.rate;
    let produtoTetoAplicado = false;

    // Aplicar teto se existir
    if (entry.model.ceiling !== null && ticketMedio > 0) {
      const valorTeorico = ticketMedio * entry.model.rate;
      const valorAplicado = Math.min(valorTeorico, entry.model.ceiling);
      taxaEfetivaProduto = valorAplicado / ticketMedio;
      
      if (valorTeorico > entry.model.ceiling) {
        tetoAplicado = true;
        produtoTetoAplicado = true;
      }
    }

    const contribuicao = (entry.pct / 100) * taxaEfetivaProduto;
    taxaPonderada += contribuicao;

    detalhe.push({
      id: entry.model.id,
      label: entry.model.label,
      pct: entry.pct,
      taxaBase: entry.model.rate,
      taxaEfetiva: taxaEfetivaProduto,
      contribuicao,
      tetoAplicado: produtoTetoAplicado,
      valorTeto: entry.model.ceiling,
    });
  }

  return { taxaEfetiva: taxaPonderada, tetoAplicado, detalhe };
}

/**
 * Alias para compatibilidade
 */
export function calcularTaxaPonderadaCaixa(
  subMix: CaixaSubMix,
  ticketMedio: number
): { taxaEfetiva: number; tetoAplicado: boolean } {
  const result = calcularTaxaEfetivaCaixa(subMix, ticketMedio);
  return { taxaEfetiva: result.taxaEfetiva, tetoAplicado: result.tetoAplicado };
}

/**
 * Calcula taxa ponderada do mix bancário
 */
export function calcularTaxaPonderadaBanco(
  bankMix: BankMix,
  taxaEfetivaCaixa: number
): number {
  return (
    (bankMix.itau / 100) * BANK_RATES.itau +
    (bankMix.santander / 100) * BANK_RATES.santander +
    (bankMix.bradesco / 100) * BANK_RATES.bradesco +
    (bankMix.caixa / 100) * taxaEfetivaCaixa
  );
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
 * Determina status de viabilidade conforme regras
 */
function determinarStatus(margemPercent: number): { 
  status: "viable" | "limit" | "inviable"; 
  label: string; 
  color: "green" | "yellow" | "red";
} {
  // viable: >= 0.40%
  if (margemPercent >= CONSTANTS.VIABLE_MARGIN * 100) {
    return {
      status: "viable",
      label: "Projeto viável",
      color: "green",
    };
  }
  // limit: >= 0.30% AND < 0.40%
  if (margemPercent >= CONSTANTS.MIN_MARGIN * 100) {
    return {
      status: "limit",
      label: "Margem no limite",
      color: "yellow",
    };
  }
  // inviable: < 0.30%
  return {
    status: "inviable",
    label: "Projeto inviável",
    color: "red",
  };
}

/**
 * Gera alertas baseado nas condições
 */
function gerarAlertas(
  inputs: SimuladorInputs,
  margemPercent: number,
  caixaTetoAplicado: boolean
): Alert[] {
  const alerts: Alert[] = [];

  // Alerta: registro sensível
  if (inputs.registroTipo === "sem_registro" && inputs.comissaoIncorporador >= 0.7) {
    alerts.push({
      type: "warning",
      message: "Projeto sem registro é mais sensível à comissão do incorporador.",
    });
  }

  // Alerta: margem abaixo do mínimo
  if (margemPercent < CONSTANTS.MIN_MARGIN * 100) {
    alerts.push({
      type: "error",
      message: "Margem da Loft não atende o mínimo exigido.",
    });
  }

  // Alerta: teto Caixa aplicado
  if (caixaTetoAplicado) {
    alerts.push({
      type: "warning",
      message: "Um ou mais produtos CAIXA tiveram remuneração limitada ao teto.",
    });
  }

  // Alerta: registro internalizado (sucesso)
  if (inputs.registroTipo === "internalizado") {
    alerts.push({
      type: "success",
      message: "Registro internalizado gera receita incremental e melhora a margem.",
    });
  }

  return alerts;
}

/**
 * Calcula viabilidade completa
 */
export function calcularViabilidade(inputs: SimuladorInputs): SimuladorResults {
  const { unidades, vgv, bankMix, caixaSubMix, comissaoIncorporador, registroTipo, valorRegistroPorUnidade, remunerarCaixa } = inputs;
  
  // --- Cálculos Base ---
  const ticketMedio = unidades > 0 ? vgv / unidades : 0;

  // --- Taxa Efetiva CAIXA ---
  const { taxaEfetiva: taxaEfetivaCaixa, tetoAplicado: caixaTetoAplicado, detalhe: caixaDetalhe } = 
    calcularTaxaEfetivaCaixa(caixaSubMix, ticketMedio);

  // --- Breakdown de Receita por Banco (NOVA LÓGICA) ---
  // VGV alocado por banco
  const vgvItau = vgv * (bankMix.itau / 100);
  const vgvSantander = vgv * (bankMix.santander / 100);
  const vgvBradesco = vgv * (bankMix.bradesco / 100);
  const vgvCaixa = vgv * (bankMix.caixa / 100);

  // Receita por banco (em R$)
  const receitaItau = vgvItau * BANK_RATES.itau;
  const receitaSantander = vgvSantander * BANK_RATES.santander;
  const receitaBradesco = vgvBradesco * BANK_RATES.bradesco;
  // Caixa: só gera receita se remunerarCaixa = true
  const receitaCaixa = remunerarCaixa ? vgvCaixa * taxaEfetivaCaixa : 0;

  // Receita por banco em R$
  const receitaPorBanco: ReceitaPorBanco = {
    itau: receitaItau,
    santander: receitaSantander,
    bradesco: receitaBradesco,
    caixa: receitaCaixa,
  };

  // Receita por banco em % do VGV
  const receitaPorBancoPercent: ReceitaPorBanco = {
    itau: vgv > 0 ? (receitaItau / vgv) * 100 : 0,
    santander: vgv > 0 ? (receitaSantander / vgv) * 100 : 0,
    bradesco: vgv > 0 ? (receitaBradesco / vgv) * 100 : 0,
    caixa: vgv > 0 ? (receitaCaixa / vgv) * 100 : 0,
  };

  // --- VGV Remunerado (para base de comissão) ---
  // Comissão do incorporador incide APENAS sobre o VGV remunerado
  const vgvRemunerado = vgvItau + vgvSantander + vgvBradesco + (remunerarCaixa ? vgvCaixa : 0);

  // --- Receita Total Bancária (soma das receitas por banco) ---
  const receitaBancariaTotalCurrency = receitaItau + receitaSantander + receitaBradesco + receitaCaixa;
  const receitaBancariaTotalPercent = vgv > 0 ? receitaBancariaTotalCurrency / vgv : 0;

  // --- Comissão do Incorporador (apenas sobre VGV remunerado) ---
  const custoComissaoIncorporador = vgvRemunerado * (comissaoIncorporador / 100);

  // --- Receita Bruta (receita bancária - comissão incorporador) ---
  const receitaBrutaCurrency = receitaBancariaTotalCurrency - custoComissaoIncorporador;
  const receitaBrutaPercent = vgv > 0 ? receitaBrutaCurrency / vgv : 0;
  
  // --- Impostos sobre receita bruta ---
  const impostoCurrency = receitaBrutaCurrency * CONSTANTS.TAX_RATE;
  const impostoPercent = receitaBrutaPercent * CONSTANTS.TAX_RATE;
  
  // --- Receita Líquida Total ---
  const receitaLiquidaTotalCurrency = receitaBrutaCurrency - impostoCurrency;
  const receitaLiquidaTotalPercent = receitaBrutaPercent - impostoPercent;

  // --- Rateio 50/50 ---
  const receitaLiquidaLoftCurrency = receitaLiquidaTotalCurrency * CONSTANTS.LOFT_PARTICIPATION;
  const receitaLiquidaCRECurrency = receitaLiquidaTotalCurrency * CONSTANTS.PARTNER_PARTICIPATION;
  const receitaLiquidaLoftPercent = receitaLiquidaTotalPercent * CONSTANTS.LOFT_PARTICIPATION;
  const receitaLiquidaCREPercent = receitaLiquidaTotalPercent * CONSTANTS.PARTNER_PARTICIPATION;

  // --- Registro (se internalizado) ---
  let receitaRegistroTotal = 0;
  let receitaRegistroTotalPercent = 0;
  let receitaRegistroLoftPercent = 0;
  let receitaRegistroCREPercent = 0;
  let receitaRegistroLoft = 0;
  let receitaRegistroCRE = 0;

  if (registroTipo === "internalizado" && vgv > 0) {
    receitaRegistroTotal = valorRegistroPorUnidade * unidades;
    receitaRegistroTotalPercent = receitaRegistroTotal / vgv;
    receitaRegistroLoftPercent = receitaRegistroTotalPercent * CONSTANTS.LOFT_PARTICIPATION;
    receitaRegistroCREPercent = receitaRegistroTotalPercent * CONSTANTS.PARTNER_PARTICIPATION;
    receitaRegistroLoft = receitaRegistroTotal * CONSTANTS.LOFT_PARTICIPATION;
    receitaRegistroCRE = receitaRegistroTotal * CONSTANTS.PARTNER_PARTICIPATION;
  }

  // --- Receita Total Loft com Registro ---
  const receitaLoftComRegistroPercent = receitaLiquidaLoftPercent + receitaRegistroLoftPercent;

  // --- Custos Operacionais ---
  const custosOperacionaisPercent = CONSTANTS.OPERATIONAL_COSTS;
  const custosOperacionaisCurrency = vgv * custosOperacionaisPercent;

  // --- Margem Final Loft ---
  const margemFinalPercent = receitaLoftComRegistroPercent - custosOperacionaisPercent;
  const margemFinalCurrency = vgv * margemFinalPercent;

  // --- Taxa Ponderada (para display - considera se Caixa é remunerada) ---
  const taxaPonderadaBancoDisplay = remunerarCaixa 
    ? calcularTaxaPonderadaBanco(bankMix, taxaEfetivaCaixa)
    : calcularTaxaPonderadaBanco({ ...bankMix, caixa: 0 }, taxaEfetivaCaixa) * (100 / (100 - bankMix.caixa));

  // Taxa real considerando Caixa ou não
  const taxaPonderadaReal = vgv > 0 ? receitaBancariaTotalCurrency / vgv : 0;

  // --- Status ---
  const margemPercentDisplay = margemFinalPercent * 100;
  const { status, label: statusLabel, color: statusColor } = determinarStatus(margemPercentDisplay);

  // --- Alertas ---
  const alerts = gerarAlertas(inputs, margemPercentDisplay, caixaTetoAplicado);

  // Alerta adicional: Caixa não remunerada
  if (bankMix.caixa > 0 && !remunerarCaixa) {
    alerts.push({
      type: "warning",
      message: `Operação com Caixa (${bankMix.caixa}% do mix) sem remuneração`,
    });
  }

  return {
    // Base
    ticketMedio,
    
    // Comissão bancária
    taxaPonderadaBanco: taxaPonderadaReal * 100,  // Taxa efetiva considerando Caixa
    taxaEfetivaCaixa: taxaEfetivaCaixa * 100,
    caixaTetoAplicado,
    caixaDetalhe,
    
    // Breakdown por banco
    receitaPorBanco,
    receitaPorBancoPercent,
    caixaRemunerada: remunerarCaixa,
    
    // Receitas (em % para display)
    receitaBrutaPercent: receitaBrutaPercent * 100,
    impostoPercent: impostoPercent * 100,
    receitaLiquidaTotalPercent: receitaLiquidaTotalPercent * 100,
    
    // Rateio 50/50 (em % para display)
    receitaLiquidaLoftPercent: receitaLiquidaLoftPercent * 100,
    receitaLiquidaCREPercent: receitaLiquidaCREPercent * 100,
    
    // Registro (em % para display)
    receitaRegistroTotalPercent: receitaRegistroTotalPercent * 100,
    receitaRegistroLoftPercent: receitaRegistroLoftPercent * 100,
    receitaRegistroCREPercent: receitaRegistroCREPercent * 100,
    
    // Receita Loft com Registro (em % para display)
    receitaLoftComRegistroPercent: receitaLoftComRegistroPercent * 100,
    
    // Custos Operacionais (em % para display)
    custosOperacionaisPercent: custosOperacionaisPercent * 100,
    
    // Margem Final (em % para display)
    margemFinalPercent: margemPercentDisplay,
    
    // Valores em R$
    receitaBrutaCurrency,
    impostoCurrency,
    receitaLiquidaTotalCurrency,
    receitaLiquidaLoftCurrency,
    receitaLiquidaCRECurrency,
    receitaRegistroTotal,
    receitaRegistroLoft,
    receitaRegistroCRE,
    custosOperacionaisCurrency,
    margemFinalCurrency,
    
    // Status
    status,
    statusLabel,
    statusColor,
    
    // Alertas
    alerts,
    
    // Legado (compatibilidade com componentes existentes)
    margemLoft: margemPercentDisplay,
    margemMinima: CONSTANTS.MIN_MARGIN * 100,
    receitaBrutaTotal: receitaBrutaCurrency,
    receitaLiquidaTotal: receitaLiquidaTotalCurrency,
    receitaLoft: receitaLiquidaLoftCurrency,
    receitaCRE: receitaLiquidaCRECurrency,
    custoComissaoIncorporador,
  };
}

// ============================================
// FORMATAÇÃO
// ============================================

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
