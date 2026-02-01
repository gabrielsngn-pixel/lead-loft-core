/**
 * Simulador de Viabilidade Imobiliária - Lógica de Cálculos
 * Motor nativo do CRM para análise financeira de empreendimentos
 */

export interface ViabilidadeInputs {
  // Terreno
  areaTerreno: number; // m²
  custoTerreno: number; // R$
  
  // Projeto
  areaPrivativa: number; // m² total área privativa
  areaComum: number; // m² total área comum
  numUnidades: number;
  
  // Valores de Venda
  precoM2: number; // R$/m² área privativa
  
  // Custos de Obra
  custoConstrucaoM2: number; // R$/m² custo de construção
  
  // Outras despesas (%)
  taxaIncorporacao: number; // % sobre VGV (normalmente 3-5%)
  taxaComissaoVendas: number; // % sobre VGV (normalmente 4-6%)
  taxaMarketing: number; // % sobre VGV (normalmente 2-3%)
  taxaAdministrativa: number; // % sobre custo obra (normalmente 5-8%)
  
  // Financeiro
  taxaFinanciamento: number; // % a.a. (taxa de juros)
  prazoObra: number; // meses
  prazoVendas: number; // meses para vender tudo
  percentualFinanciado: number; // % do custo financiado
  
  // Impostos
  irpjCsll: number; // % lucro presumido (normalmente 6.73%)
  pis: number; // % sobre receita (0.65%)
  cofins: number; // % sobre receita (3%)
}

export interface ViabilidadeResults {
  // Receitas
  vgv: number; // Valor Geral de Vendas
  vgvPorUnidade: number;
  
  // Custos
  custoTerreno: number;
  custoObra: number;
  custoIncorporacao: number;
  custoComissaoVendas: number;
  custoMarketing: number;
  custoAdministrativo: number;
  custoFinanceiro: number;
  custoTotal: number;
  
  // Impostos
  impostosPis: number;
  impostosCofins: number;
  impostosIrpjCsll: number;
  impostosTotais: number;
  
  // Resultados
  lucroLiquido: number;
  margemLiquida: number; // %
  margemBruta: number; // %
  tir: number; // % Taxa Interna de Retorno (anualizada)
  vpl: number; // Valor Presente Líquido
  paybackMeses: number;
  roiAnual: number; // % Retorno sobre investimento anualizado
  
  // Indicadores
  custoM2Construido: number;
  lucroM2: number;
  eficienciaTerreno: number; // área privativa / área terreno
  
  // Recomendação
  resultado: "viavel" | "inviavel" | "condicional";
  recomendacao: "simples" | "media" | "nao";
  analise: string;
}

export interface FluxoCaixa {
  mes: number;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

// Valores padrão recomendados para o mercado brasileiro
export const defaultInputs: ViabilidadeInputs = {
  areaTerreno: 1000,
  custoTerreno: 2000000,
  areaPrivativa: 3000,
  areaComum: 1000,
  numUnidades: 30,
  precoM2: 8000,
  custoConstrucaoM2: 3500,
  taxaIncorporacao: 4,
  taxaComissaoVendas: 5,
  taxaMarketing: 2.5,
  taxaAdministrativa: 6,
  taxaFinanciamento: 12,
  prazoObra: 24,
  prazoVendas: 36,
  percentualFinanciado: 60,
  irpjCsll: 6.73,
  pis: 0.65,
  cofins: 3,
};

/**
 * Calcula VGV (Valor Geral de Vendas)
 */
export function calcularVGV(areaPrivativa: number, precoM2: number): number {
  return areaPrivativa * precoM2;
}

/**
 * Calcula custo total de construção
 */
export function calcularCustoObra(
  areaPrivativa: number,
  areaComum: number,
  custoConstrucaoM2: number
): number {
  const areaTotal = areaPrivativa + areaComum;
  return areaTotal * custoConstrucaoM2;
}

/**
 * Calcula custo financeiro (juros sobre capital)
 */
export function calcularCustoFinanceiro(
  custoTotal: number,
  percentualFinanciado: number,
  taxaAnual: number,
  prazoMeses: number
): number {
  const valorFinanciado = custoTotal * (percentualFinanciado / 100);
  const taxaMensal = taxaAnual / 100 / 12;
  // Juros simples sobre o valor médio financiado durante a obra
  const custoJuros = valorFinanciado * taxaMensal * (prazoMeses / 2);
  return custoJuros;
}

/**
 * Calcula a TIR (Taxa Interna de Retorno) usando método de Newton-Raphson
 */
export function calcularTIR(fluxos: number[], guess: number = 0.1): number {
  const maxIteracoes = 1000;
  const precisao = 0.0001;
  let taxa = guess;

  for (let i = 0; i < maxIteracoes; i++) {
    let vpl = 0;
    let derivada = 0;

    for (let j = 0; j < fluxos.length; j++) {
      const fator = Math.pow(1 + taxa, j);
      vpl += fluxos[j] / fator;
      derivada -= (j * fluxos[j]) / Math.pow(1 + taxa, j + 1);
    }

    if (Math.abs(vpl) < precisao) break;
    if (derivada === 0) break;

    taxa = taxa - vpl / derivada;
  }

  // Converter taxa mensal para anual
  const tirAnual = (Math.pow(1 + taxa, 12) - 1) * 100;
  return Math.round(tirAnual * 100) / 100;
}

/**
 * Calcula o VPL (Valor Presente Líquido)
 */
export function calcularVPL(fluxos: number[], taxaDesconto: number): number {
  const taxaMensal = taxaDesconto / 100 / 12;
  let vpl = 0;

  for (let i = 0; i < fluxos.length; i++) {
    vpl += fluxos[i] / Math.pow(1 + taxaMensal, i);
  }

  return Math.round(vpl);
}

/**
 * Calcula o payback (tempo para recuperar investimento)
 */
export function calcularPayback(fluxosCaixa: FluxoCaixa[]): number {
  for (let i = 0; i < fluxosCaixa.length; i++) {
    if (fluxosCaixa[i].saldoAcumulado >= 0) {
      return i;
    }
  }
  return fluxosCaixa.length;
}

/**
 * Gera o fluxo de caixa mensal do empreendimento
 */
export function gerarFluxoCaixa(
  inputs: ViabilidadeInputs,
  custoTotal: number,
  vgv: number
): FluxoCaixa[] {
  const fluxos: FluxoCaixa[] = [];
  const prazoTotal = Math.max(inputs.prazoObra, inputs.prazoVendas);
  
  // Distribuição de custos (curva S simplificada)
  const custoMensal = custoTotal / inputs.prazoObra;
  
  // Distribuição de vendas (linear após início das vendas)
  const inicioVendas = Math.floor(inputs.prazoObra * 0.3); // Vendas começam em 30% da obra
  const mesesVenda = inputs.prazoVendas - inicioVendas;
  const vendaMensal = mesesVenda > 0 ? vgv / mesesVenda : 0;
  
  let saldoAcumulado = 0;

  for (let mes = 0; mes <= prazoTotal; mes++) {
    let entradas = 0;
    let saidas = 0;

    // Custo do terreno no mês 0
    if (mes === 0) {
      saidas += inputs.custoTerreno;
    }

    // Custos de obra durante o prazo de construção
    if (mes > 0 && mes <= inputs.prazoObra) {
      saidas += custoMensal;
    }

    // Entradas de vendas após início
    if (mes >= inicioVendas && mes < inputs.prazoVendas) {
      entradas += vendaMensal;
    }

    const saldo = entradas - saidas;
    saldoAcumulado += saldo;

    fluxos.push({
      mes,
      entradas: Math.round(entradas),
      saidas: Math.round(saidas),
      saldo: Math.round(saldo),
      saldoAcumulado: Math.round(saldoAcumulado),
    });
  }

  return fluxos;
}

/**
 * Determina resultado e recomendação baseado nos indicadores
 */
export function determinarRecomendacao(
  margemLiquida: number,
  tir: number,
  payback: number
): { resultado: "viavel" | "inviavel" | "condicional"; recomendacao: "simples" | "media" | "nao"; analise: string } {
  // Critérios de viabilidade para incorporação imobiliária no Brasil
  const margemMinima = 15; // Margem mínima aceitável
  const tirMinima = 15; // TIR mínima aceitável (acima do CDI + prêmio de risco)
  const paybackMaximo = 48; // Payback máximo em meses

  const scores = {
    margem: margemLiquida >= margemMinima ? 1 : margemLiquida >= margemMinima * 0.8 ? 0.5 : 0,
    tir: tir >= tirMinima ? 1 : tir >= tirMinima * 0.7 ? 0.5 : 0,
    payback: payback <= paybackMaximo ? 1 : payback <= paybackMaximo * 1.25 ? 0.5 : 0,
  };

  const totalScore = scores.margem + scores.tir + scores.payback;

  let resultado: "viavel" | "inviavel" | "condicional";
  let recomendacao: "simples" | "media" | "nao";
  let analise: string;

  if (totalScore >= 2.5) {
    resultado = "viavel";
    recomendacao = "simples";
    analise = `Empreendimento com excelente viabilidade. Margem de ${margemLiquida.toFixed(1)}% e TIR de ${tir.toFixed(1)}% a.a. indicam retorno atrativo. Payback previsto em ${payback} meses está dentro do esperado.`;
  } else if (totalScore >= 1.5) {
    resultado = "condicional";
    recomendacao = "media";
    analise = `Empreendimento com viabilidade moderada. ${margemLiquida < margemMinima ? `Margem de ${margemLiquida.toFixed(1)}% está abaixo do ideal (${margemMinima}%).` : ""} ${tir < tirMinima ? `TIR de ${tir.toFixed(1)}% pode ser insuficiente para o risco.` : ""} Recomenda-se renegociar custos ou preços.`;
  } else {
    resultado = "inviavel";
    recomendacao = "nao";
    analise = `Empreendimento apresenta indicadores desfavoráveis. Margem de ${margemLiquida.toFixed(1)}%, TIR de ${tir.toFixed(1)}% e payback de ${payback} meses não justificam o investimento. Não recomendado nas condições atuais.`;
  }

  return { resultado, recomendacao, analise };
}

/**
 * Função principal de cálculo da viabilidade completa
 */
export function calcularViabilidade(inputs: ViabilidadeInputs): ViabilidadeResults {
  // Receitas
  const vgv = calcularVGV(inputs.areaPrivativa, inputs.precoM2);
  const vgvPorUnidade = vgv / inputs.numUnidades;

  // Custos
  const custoTerreno = inputs.custoTerreno;
  const custoObra = calcularCustoObra(inputs.areaPrivativa, inputs.areaComum, inputs.custoConstrucaoM2);
  const custoIncorporacao = vgv * (inputs.taxaIncorporacao / 100);
  const custoComissaoVendas = vgv * (inputs.taxaComissaoVendas / 100);
  const custoMarketing = vgv * (inputs.taxaMarketing / 100);
  const custoAdministrativo = custoObra * (inputs.taxaAdministrativa / 100);
  
  // Custo base (antes de financeiro)
  const custoBase = custoTerreno + custoObra + custoIncorporacao + custoComissaoVendas + custoMarketing + custoAdministrativo;
  
  const custoFinanceiro = calcularCustoFinanceiro(
    custoBase,
    inputs.percentualFinanciado,
    inputs.taxaFinanciamento,
    inputs.prazoObra
  );

  const custoTotal = custoBase + custoFinanceiro;

  // Impostos
  const impostosPis = vgv * (inputs.pis / 100);
  const impostosCofins = vgv * (inputs.cofins / 100);
  const lucroAntesIR = vgv - custoTotal - impostosPis - impostosCofins;
  const impostosIrpjCsll = Math.max(0, lucroAntesIR * (inputs.irpjCsll / 100));
  const impostosTotais = impostosPis + impostosCofins + impostosIrpjCsll;

  // Resultados
  const lucroLiquido = vgv - custoTotal - impostosTotais;
  const margemLiquida = (lucroLiquido / vgv) * 100;
  const margemBruta = ((vgv - custoTotal) / vgv) * 100;

  // Fluxo de caixa e indicadores
  const fluxosCaixa = gerarFluxoCaixa(inputs, custoTotal, vgv);
  const fluxosSimples = fluxosCaixa.map((f) => f.saldo);
  
  const tir = calcularTIR(fluxosSimples);
  const vpl = calcularVPL(fluxosSimples, 12); // 12% taxa de desconto
  const paybackMeses = calcularPayback(fluxosCaixa);

  // ROI anualizado
  const prazoTotalAnos = Math.max(inputs.prazoObra, inputs.prazoVendas) / 12;
  const roiAnual = ((lucroLiquido / custoTotal) / prazoTotalAnos) * 100;

  // Indicadores adicionais
  const areaTotal = inputs.areaPrivativa + inputs.areaComum;
  const custoM2Construido = custoTotal / areaTotal;
  const lucroM2 = lucroLiquido / inputs.areaPrivativa;
  const eficienciaTerreno = inputs.areaPrivativa / inputs.areaTerreno;

  // Recomendação
  const { resultado, recomendacao, analise } = determinarRecomendacao(margemLiquida, tir, paybackMeses);

  return {
    vgv: Math.round(vgv),
    vgvPorUnidade: Math.round(vgvPorUnidade),
    custoTerreno: Math.round(custoTerreno),
    custoObra: Math.round(custoObra),
    custoIncorporacao: Math.round(custoIncorporacao),
    custoComissaoVendas: Math.round(custoComissaoVendas),
    custoMarketing: Math.round(custoMarketing),
    custoAdministrativo: Math.round(custoAdministrativo),
    custoFinanceiro: Math.round(custoFinanceiro),
    custoTotal: Math.round(custoTotal),
    impostosPis: Math.round(impostosPis),
    impostosCofins: Math.round(impostosCofins),
    impostosIrpjCsll: Math.round(impostosIrpjCsll),
    impostosTotais: Math.round(impostosTotais),
    lucroLiquido: Math.round(lucroLiquido),
    margemLiquida: Math.round(margemLiquida * 100) / 100,
    margemBruta: Math.round(margemBruta * 100) / 100,
    tir: isNaN(tir) || !isFinite(tir) ? 0 : tir,
    vpl: Math.round(vpl),
    paybackMeses,
    roiAnual: Math.round(roiAnual * 100) / 100,
    custoM2Construido: Math.round(custoM2Construido),
    lucroM2: Math.round(lucroM2),
    eficienciaTerreno: Math.round(eficienciaTerreno * 100) / 100,
    resultado,
    recomendacao,
    analise,
  };
}
