import type { ViabilityAssumptions } from "./types";

/** Premissas iniciais (seção 4.2 da especificação). Fixas no código: usadas pelo seed e pelo autoteste. */
export const INITIAL_ASSUMPTIONS: ViabilityAssumptions = {
  banks: [
    { id: "caixa", name: "Caixa Econômica Federal", fixedFeeType: "percent", fixedFeeValue: 0.01, obraBankShare: 0.5, unpaidConversionRate: 0.084, isActive: true },
    { id: "itau", name: "Itaú Unibanco S.A.", fixedFeeType: "amount", fixedFeeValue: 1200, obraBankShare: 0.5, unpaidConversionRate: 0.071, isActive: true },
    { id: "bradesco", name: "Banco Bradesco S.A.", fixedFeeType: "amount", fixedFeeValue: 1000, obraBankShare: 0.34, unpaidConversionRate: 0.118, isActive: true },
    { id: "inter", name: "Banco Inter", fixedFeeType: "amount", fixedFeeValue: 0, obraBankShare: 0.1, unpaidConversionRate: 0, isActive: true },
    { id: "santander", name: "Banco Santander (Brasil) S.A.", fixedFeeType: "amount", fixedFeeValue: 2000, obraBankShare: 0.24, unpaidConversionRate: 0.043, isActive: true },
    { id: "bb", name: "Banco do Brasil S.A.", fixedFeeType: "amount", fixedFeeValue: 800, obraBankShare: 0.3, unpaidConversionRate: 0.235, isActive: true },
    { id: "banrisul", name: "Banrisul", fixedFeeType: "amount", fixedFeeValue: 800, obraBankShare: 0.1, unpaidConversionRate: 0, isActive: true },
    { id: "sem_banco", name: "Sem banco", fixedFeeType: "amount", fixedFeeValue: 0, obraBankShare: 0, unpaidConversionRate: 0.104, isActive: true },
  ],
  taxRate: 0.1425,
  commissionedRate: { ticketThreshold: 600000, rateAtOrAbove: 0.0178, rateBelow: 0.0149 },
  productRevenueShare: { traditional: 1, saas: 0.5, full_saas: 0.25 },
  costApplicability: {
    live: ["traditional", "saas", "full_saas"],
    salesOnboarding: ["traditional", "full_saas"],
    salesFormalization: ["traditional", "full_saas"],
    opsCredit: ["traditional", "saas", "full_saas"],
    opsLegal: ["traditional", "saas", "full_saas"],
    opsRelease: ["traditional", "saas", "full_saas"],
    registryOutsideSp: ["traditional", "full_saas"],
    registrySp: ["traditional", "full_saas"],
  },
  liveCost: 5000,
  teams: {
    salesOnboarding: { volumeRate: 1, proposalsPerHead: 70, costPerHead: 10000 },
    salesFormalization: { volumeRate: 0.6, proposalsPerHead: 40, costPerHead: 10000 },
    opsCredit: { volumeRate: 1, proposalsPerHead: 170, costPerHead: 4225.11 },
    opsLegal: { volumeRate: 0.45, proposalsPerHead: 212, costPerHead: 7500 },
    opsRelease: { volumeRate: 0.9, proposalsPerHead: 60, costPerHead: 7500 },
  },
  registryCostPerCase: { outsideSp: 750, sp: 175 },
  minimumProfit: { base: 270000, divisor: 25, multiplier: 4.5 },
  benchmarks: { netRevenuePerUnit: 4500, averageCommissionRate: 0.012 },
  newSimulationDefaults: {
    conversionRate: 0.35,
    developerFeePerUnit: 250,
    developerPaymentMode: "all",
    registryFeePerUnit: 0,
    registryConversionRate: 0.5,
    outsideSpShare: 0.5,
  },
};

export const PRODUCT_LABELS = { traditional: "Tradicional", saas: "SaaS", full_saas: "Full SaaS" } as const;

export const COST_LINE_LABELS = {
  live: "Live",
  salesOnboarding: "Vendas — onboarding",
  salesFormalization: "Vendas — formalização",
  opsCredit: "Operação — crédito",
  opsLegal: "Operação — jurídico",
  opsRelease: "Operação — liberação/registro",
  registryOutsideSp: "Registro fora de SP",
  registrySp: "Registro em SP",
} as const;

export const TEAM_BASE_LABELS = {
  salesOnboarding: "das unidades a repassar",
  salesFormalization: "do volume de onboarding",
  opsCredit: "do volume de formalização",
  opsLegal: "do volume de onboarding",
  opsRelease: "do volume do jurídico",
} as const;

export const PAYMENT_MODE_LABELS = {
  all: "Por todas as unidades emitidas + casos isolados",
  unpaid_only: "Só pelos casos isolados",
  obra_bank_only: "Só pelas unidades emitidas com o banco da obra",
  unpaid_and_obra_bank: "Pelos casos isolados + unidades do banco da obra",
} as const;
