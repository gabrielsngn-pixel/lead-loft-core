import { COST_LINE_LABELS } from "./defaults";
import type {
  CostLine, CostLineKey, ProductKey, SimulationInputs, TeamKey, ViabilityAssumptions, ViabilityResult,
} from "./types";

const div = (a: number, b: number): number | null => (b === 0 || !isFinite(b) ? null : a / b);

/** Motor de cálculo (seção 6). Puro, sem arredondamento interno. */
export function calculateViability(
  inputs: SimulationInputs,
  a: ViabilityAssumptions,
  product: ProductKey = inputs.product
): ViabilityResult {
  const bank = a.banks.find((b) => b.id === inputs.obraBankId);
  if (!bank) throw new Error(`Banco da obra não encontrado: ${inputs.obraBankId}`);

  const R = inputs.unitsToTransfer;
  const c = inputs.conversionRate;
  const T = inputs.averageTicket;
  const pBO = bank.obraBankShare;
  const pCom = 1 - pBO;
  const pIso = bank.unpaidConversionRate;
  const tCom = T >= a.commissionedRate.ticketThreshold ? a.commissionedRate.rateAtOrAbove : a.commissionedRate.rateBelow;
  const imp = a.taxRate;
  const s = a.productRevenueShare[product];

  // 6.2 Receitas
  const E = R * c;
  const issuedVgf = E * T;
  const obraBank = E * pBO * bank.fixedFeeValue * (bank.fixedFeeType === "percent" ? T : 1);
  const commissionedBanks = E * pCom * tCom * T;
  const client = inputs.registryConversionRate * inputs.registryFeePerUnit * E;
  let K: number;
  switch (inputs.developerPaymentMode) {
    case "all": K = pIso * R + E; break;
    case "unpaid_only": K = pIso * R; break;
    case "obra_bank_only": K = pBO * E; break;
    case "unpaid_and_obra_bank": K = pIso * R + pBO * E; break;
  }
  const developer = inputs.developerFeePerUnit * K;
  const potential = obraBank + commissionedBanks + developer + client;
  const netPotential = potential * (1 - imp);

  // 6.3 Receita do produto
  const grossRevenue = potential * s;
  const taxes = grossRevenue * imp;
  const netRevenue = grossRevenue - taxes;

  // 6.4 Custos
  const t = a.teams;
  const vol: Record<TeamKey, number> = {} as Record<TeamKey, number>;
  vol.salesOnboarding = R * t.salesOnboarding.volumeRate;
  vol.salesFormalization = vol.salesOnboarding * t.salesFormalization.volumeRate;
  vol.opsCredit = vol.salesFormalization * t.opsCredit.volumeRate;
  vol.opsLegal = vol.salesOnboarding * t.opsLegal.volumeRate;
  vol.opsRelease = vol.opsLegal * t.opsRelease.volumeRate;
  const volOut = vol.opsRelease * inputs.outsideSpShare;
  const volSp = vol.opsRelease * (1 - inputs.outsideSpShare);

  const applies = (k: CostLineKey) => a.costApplicability[k].includes(product);
  const teamLine = (k: TeamKey): CostLine => {
    const ap = applies(k);
    const head = vol[k] / t[k].proposalsPerHead;
    return {
      key: k, label: COST_LINE_LABELS[k], volume: vol[k], proposalsPerHead: t[k].proposalsPerHead,
      headcount: head, unitCost: t[k].costPerHead, value: ap ? head * t[k].costPerHead : 0, applies: ap,
    };
  };
  const costLines: CostLine[] = [
    { key: "live", label: COST_LINE_LABELS.live, volume: null, proposalsPerHead: null, headcount: null, unitCost: a.liveCost, value: applies("live") ? a.liveCost : 0, applies: applies("live") },
    teamLine("salesOnboarding"),
    teamLine("salesFormalization"),
    teamLine("opsCredit"),
    teamLine("opsLegal"),
    teamLine("opsRelease"),
    { key: "registryOutsideSp", label: COST_LINE_LABELS.registryOutsideSp, volume: volOut, proposalsPerHead: null, headcount: null, unitCost: a.registryCostPerCase.outsideSp, value: applies("registryOutsideSp") ? volOut * a.registryCostPerCase.outsideSp : 0, applies: applies("registryOutsideSp") },
    { key: "registrySp", label: COST_LINE_LABELS.registrySp, volume: volSp, proposalsPerHead: null, headcount: null, unitCost: a.registryCostPerCase.sp, value: applies("registrySp") ? volSp * a.registryCostPerCase.sp : 0, applies: applies("registrySp") },
  ];
  const totalCost = costLines.reduce((sum, l) => sum + l.value, 0);

  // 6.5 Resultado
  const operatingProfit = netRevenue - totalCost;
  const minimumProfit = (a.minimumProfit.base / a.minimumProfit.divisor) * a.minimumProfit.multiplier;
  const gap = operatingProfit - minimumProfit;
  const avgNet = div(netRevenue, E);
  const avgComm = avgNet === null ? null : div(avgNet, T);

  // 6.6 Preço mínimo
  const gainPerReal = K * s * (1 - imp);
  const profitWithoutDev = (potential - developer) * s * (1 - imp) - totalCost;
  let minimumDeveloperFee: ViabilityResult["minimumDeveloperFee"];
  if (gainPerReal === 0) minimumDeveloperFee = { status: "not_reachable", value: null };
  else {
    const x = (minimumProfit - profitWithoutDev) / gainPerReal;
    minimumDeveloperFee = x <= 0 ? { status: "already_viable", value: 0 } : { status: "reachable", value: x };
  }

  return {
    product, issuedUnits: E, issuedVgf, pBO, pCom, pIso, tCom,
    revenue: { obraBank, commissionedBanks, developer, client, potential, netPotential },
    developerBase: K, revenueShare: s, grossRevenue, taxes, netRevenue,
    costLines, totalCost, operatingProfit, minimumProfit, gap, isViable: gap >= 0,
    perUnit: {
      grossRevenue: div(grossRevenue, E), taxes: div(taxes, E), netRevenue: avgNet,
      totalCost: div(totalCost, E), operatingProfit: div(operatingProfit, E),
      minimumProfit: div(minimumProfit, E), gap: div(gap, E),
    },
    averageNetRevenuePerUnit: avgNet,
    averageCommissionRate: avgComm,
    benchmarks: {
      netRevenuePerUnitMet: avgNet === null ? null : avgNet >= a.benchmarks.netRevenuePerUnit,
      averageCommissionRateMet: avgComm === null ? null : avgComm >= a.benchmarks.averageCommissionRate,
    },
    minimumDeveloperFee,
  };
}

export function calculateAllProducts(inputs: SimulationInputs, a: ViabilityAssumptions): Record<ProductKey, ViabilityResult> {
  return {
    traditional: calculateViability(inputs, a, "traditional"),
    saas: calculateViability(inputs, a, "saas"),
    full_saas: calculateViability(inputs, a, "full_saas"),
  };
}

/** Lê um caminho tipo "teams.opsLegal.costPerHead" ou "banks.bradesco.obraBankShare". */
function getPath(obj: ViabilityAssumptions, path: string): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (let i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    if (i === 0 && parts[0] === "banks") {
      cur = (cur.banks as any[]).find((b) => b.id === parts[1]);
      i++;
      continue;
    }
    cur = cur[parts[i]];
  }
  return cur;
}

function setPath(obj: any, path: string, value: unknown): void {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (i === 0 && parts[0] === "banks") {
      cur = (cur.banks as any[]).find((b) => b.id === parts[1]);
      if (!cur) return;
      i++;
      if (i >= parts.length - 1) break;
      continue;
    }
    if (cur[parts[i]] == null) return;
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

/** Padrão atual + valores ajustados nesta simulação (lidos do snapshot). */
export function applyOverrides(
  defaults: ViabilityAssumptions,
  snapshot: ViabilityAssumptions,
  overriddenPaths: string[]
): ViabilityAssumptions {
  const result: ViabilityAssumptions = structuredClone(defaults);
  for (const path of overriddenPaths) {
    const v = getPath(snapshot, path);
    if (v !== undefined) setPath(result, path, structuredClone(v));
  }
  // Bancos usados no snapshot mas ausentes no padrão atual continuam disponíveis
  for (const b of snapshot.banks) {
    if (!result.banks.some((x) => x.id === b.id)) result.banks.push({ ...b, isActive: false });
  }
  return result;
}
