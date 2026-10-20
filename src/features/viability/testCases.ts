import { INITIAL_ASSUMPTIONS } from "./defaults";
import { calculateViability } from "./engine";
import type { ProductKey, SimulationInputs, ViabilityResult } from "./types";

/** Casos de teste da seção 9 (conferidos no Excel). */
export interface ExpectedCase {
  name: string;
  inputs: SimulationInputs;
  revenue: { issuedUnits: number; issuedVgf: number; tCom: number; obraBank: number; commissioned: number; developer: number; client: number; potential: number; netPotential: number };
  costs: Record<string, number>;
  products: Partial<Record<ProductKey, { gross: number; net: number; cost: number; profit: number; gap: number; avgNet?: number; avgComm?: number; minFee: number | "already_viable" }>>;
}

const base = (o: Partial<SimulationInputs>): SimulationInputs => ({
  totalUnits: null, stockUnits: null, unitsToTransfer: 0, habiteSeMonth: null, averageTicket: 0,
  obraBankId: "", product: "traditional", conversionRate: 0, developerFeePerUnit: 0,
  developerPaymentMode: "all", registryFeePerUnit: 0, registryConversionRate: 0, outsideSpShare: 0, ...o,
});

export const EXPECTED_CASES: ExpectedCase[] = [
  {
    name: "Caso 1",
    inputs: base({ obraBankId: "bradesco", totalUnits: 150, unitsToTransfer: 100, averageTicket: 600000, conversionRate: 0.35, developerFeePerUnit: 250, developerPaymentMode: "all", registryFeePerUnit: 0, registryConversionRate: 0.5, outsideSpShare: 0.5 }),
    revenue: { issuedUnits: 35, issuedVgf: 21000000, tCom: 0.0178, obraBank: 11900, commissioned: 246708, developer: 11700, client: 0, potential: 270308, netPotential: 231789.11 },
    costs: { live: 5000, salesOnboarding: 14285.71, salesFormalization: 15000, opsCredit: 1491.22, opsLegal: 1591.98, opsRelease: 5062.5, registryOutsideSp: 15187.5, registrySp: 3543.75 },
    products: {
      traditional: { gross: 270308, net: 231789.11, cost: 61162.66, profit: 170626.45, gap: 122026.45, avgNet: 6622.55, avgComm: 0.011, minFee: "already_viable" },
      saas: { gross: 135154, net: 115894.56, cost: 13145.7, profit: 102748.86, gap: 54148.86, avgNet: 3311.27, avgComm: 0.0055, minFee: "already_viable" },
      full_saas: { gross: 67577, net: 57947.28, cost: 61162.66, profit: -3215.38, gap: -51815.38, avgNet: 1655.64, avgComm: 0.0028, minFee: 5414.62 },
    },
  },
  {
    name: "Caso 2",
    inputs: base({ obraBankId: "caixa", totalUnits: 320, unitsToTransfer: 200, averageTicket: 450000, conversionRate: 0.3, developerFeePerUnit: 300, developerPaymentMode: "unpaid_and_obra_bank", registryFeePerUnit: 1500, registryConversionRate: 0.6, outsideSpShare: 0.3 }),
    revenue: { issuedUnits: 60, issuedVgf: 27000000, tCom: 0.0149, obraBank: 135000, commissioned: 201150, developer: 14040, client: 54000, potential: 404190, netPotential: 346592.92 },
    costs: { live: 5000, salesOnboarding: 28571.43, salesFormalization: 30000, opsCredit: 2982.43, opsLegal: 3183.96, opsRelease: 10125, registryOutsideSp: 18225, registrySp: 9922.5 },
    products: {
      traditional: { gross: 404190, net: 346592.92, cost: 108010.32, profit: 238582.6, gap: 189982.6, minFee: "already_viable" },
      saas: { gross: 202095, net: 173296.46, cost: 21291.39, profit: 152005.07, gap: 103405.07, minFee: "already_viable" },
      full_saas: { gross: 101047.5, net: 86648.23, cost: 108010.32, profit: -21362.09, gap: -69962.09, minFee: 7273.37 },
    },
  },
  {
    name: "Caso 3",
    inputs: base({ obraBankId: "santander", totalUnits: 80, unitsToTransfer: 60, averageTicket: 380000, conversionRate: 0.4, developerFeePerUnit: 0, developerPaymentMode: "obra_bank_only", registryFeePerUnit: 0, registryConversionRate: 0.5, outsideSpShare: 1 }),
    revenue: { issuedUnits: 24, issuedVgf: 9120000, tCom: 0.0149, obraBank: 11520, commissioned: 103274.88, developer: 0, client: 0, potential: 114794.88, netPotential: 98436.61 },
    costs: { live: 5000, salesOnboarding: 8571.43, salesFormalization: 9000, opsCredit: 894.73, opsLegal: 955.19, opsRelease: 3037.5, registryOutsideSp: 18225, registrySp: 0 },
    products: {
      traditional: { gross: 114794.88, net: 98436.61, cost: 45683.85, profit: 52752.76, gap: 4152.76, minFee: "already_viable" },
      saas: { gross: 57397.44, net: 49218.3, cost: 9887.42, profit: 39330.89, gap: -9269.11, minFee: 3753.29 },
      full_saas: { gross: 28698.72, net: 24609.15, cost: 45683.85, profit: -21074.69, gap: -69674.69, minFee: 56425.89 },
    },
  },
];

export interface SelfTestRow {
  caseName: string;
  label: string;
  kind: "money" | "percent" | "number" | "status";
  expected: number | string;
  actual: number | string | null;
  ok: boolean;
}

const MONEY_TOL = 0.01;
const PCT_TOL = 0.0001; // 0,01 p.p.

/** Para valores percentuais da planilha com 2 casas (ex.: 1,10%) comparamos o valor arredondado na exibição. */
const pctOk = (exp: number, act: number | null) => act !== null && Math.abs(Math.round(act * 10000) / 10000 - exp) <= PCT_TOL + 1e-12;
const moneyOk = (exp: number, act: number | null) => act !== null && Math.abs(act - exp) <= MONEY_TOL + 1e-9;

/** Executa os 3 casos com as premissas iniciais fixas no código. */
export function runSelfTest(): SelfTestRow[] {
  const rows: SelfTestRow[] = [];
  const A = INITIAL_ASSUMPTIONS;
  for (const c of EXPECTED_CASES) {
    const r = calculateViability(c.inputs, A, "traditional");
    const push = (label: string, kind: SelfTestRow["kind"], expected: number | string, actual: number | string | null, ok: boolean) =>
      rows.push({ caseName: c.name, label, kind, expected, actual, ok });
    const m = (label: string, exp: number, act: number | null) => push(label, "money", exp, act, moneyOk(exp, act));

    push("Unidades emitidas", "number", c.revenue.issuedUnits, r.issuedUnits, moneyOk(c.revenue.issuedUnits, r.issuedUnits));
    m("VGF emitido", c.revenue.issuedVgf, r.issuedVgf);
    push("Comissão dos comissionados", "percent", c.revenue.tCom, r.tCom, pctOk(c.revenue.tCom, r.tCom));
    m("Receita do banco da obra", c.revenue.obraBank, r.revenue.obraBank);
    m("Receita dos comissionados", c.revenue.commissioned, r.revenue.commissionedBanks);
    m("Receita do incorporador", c.revenue.developer, r.revenue.developer);
    m("Receita do cliente", c.revenue.client, r.revenue.client);
    m("Receita potencial", c.revenue.potential, r.revenue.potential);
    m("Potencial líquido (100%)", c.revenue.netPotential, r.revenue.netPotential);

    // custos por linha (valor quando a linha se aplica → produto Tradicional, onde todas se aplicam)
    for (const line of r.costLines) {
      const exp = c.costs[line.key];
      if (exp !== undefined) m(`Custo — ${line.label}`, exp, line.value);
    }

    for (const p of ["traditional", "saas", "full_saas"] as ProductKey[]) {
      const e = c.products[p];
      if (!e) continue;
      const rp: ViabilityResult = calculateViability(c.inputs, A, p);
      const tag = { traditional: "Tradicional", saas: "SaaS", full_saas: "Full SaaS" }[p];
      m(`${tag} — Receita bruta`, e.gross, rp.grossRevenue);
      m(`${tag} — Receita líquida`, e.net, rp.netRevenue);
      m(`${tag} — Custo para servir`, e.cost, rp.totalCost);
      m(`${tag} — Lucro operacional`, e.profit, rp.operatingProfit);
      m(`${tag} — Gap`, e.gap, rp.gap);
      m(`${tag} — Lucro mínimo`, 48600, rp.minimumProfit);
      if (e.avgNet !== undefined) m(`${tag} — Remuneração média por unidade`, e.avgNet, rp.averageNetRevenuePerUnit);
      if (e.avgComm !== undefined) push(`${tag} — Comissão média`, "percent", e.avgComm, rp.averageCommissionRate, pctOk(e.avgComm, rp.averageCommissionRate));
      if (e.minFee === "already_viable") {
        push(`${tag} — Preço mínimo`, "status", "viável sem cobrar", rp.minimumDeveloperFee.status === "already_viable" ? "viável sem cobrar" : rp.minimumDeveloperFee.status, rp.minimumDeveloperFee.status === "already_viable");
      } else {
        push(`${tag} — Preço mínimo`, "money", e.minFee, rp.minimumDeveloperFee.value, rp.minimumDeveloperFee.status === "reachable" && moneyOk(e.minFee, rp.minimumDeveloperFee.value));
      }
    }
  }
  return rows;
}
