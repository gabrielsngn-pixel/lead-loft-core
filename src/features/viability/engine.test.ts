import { describe, it, expect } from "vitest";
import { INITIAL_ASSUMPTIONS } from "./defaults";
import { calculateViability, applyOverrides } from "./engine";
import { EXPECTED_CASES, runSelfTest } from "./testCases";
import { assumptionsSchema, inputsSchema } from "./schema";
import { formatMoney, formatPercent } from "./format";

const A = INITIAL_ASSUMPTIONS;

describe("motor de viabilidade — casos da planilha", () => {
  for (const c of EXPECTED_CASES) {
    it(`${c.name}: todos os valores batem com o Excel`, () => {
      const failed = runSelfTest().filter((r) => r.caseName === c.name && !r.ok);
      expect(failed).toEqual([]);
    });
  }

  it("premissas iniciais e entradas dos casos são válidas", () => {
    expect(assumptionsSchema.safeParse(A).success).toBe(true);
    for (const c of EXPECTED_CASES) expect(inputsSchema.safeParse(c.inputs).success).toBe(true);
  });

  it("lucro mínimo padrão é R$ 48.600", () => {
    const r = calculateViability(EXPECTED_CASES[0].inputs, A);
    expect(r.minimumProfit).toBeCloseTo(48600, 6);
  });
});

describe("casos de borda", () => {
  it("conversão 0% → 0 emitidas, por unidade mostra —", () => {
    const r = calculateViability({ ...EXPECTED_CASES[0].inputs, conversionRate: 0 }, A);
    expect(r.issuedUnits).toBe(0);
    expect(r.perUnit.netRevenue).toBeNull();
    expect(r.averageCommissionRate).toBeNull();
    expect(formatMoney(r.perUnit.gap)).toBe("—");
    expect(formatPercent(r.averageCommissionRate)).toBe("—");
  });

  it("Sem banco + obra_bank_only → preço mínimo not_reachable", () => {
    const r = calculateViability({ ...EXPECTED_CASES[0].inputs, obraBankId: "sem_banco", developerPaymentMode: "obra_bank_only" }, A, "full_saas");
    expect(r.minimumDeveloperFee.status).toBe("not_reachable");
  });

  it("Caso 3 / SaaS com R$ 3.754 → viável", () => {
    const r = calculateViability({ ...EXPECTED_CASES[2].inputs, developerFeePerUnit: 3754 }, A, "saas");
    expect(r.gap).toBeGreaterThan(0);
    expect(r.isViable).toBe(true);
  });

  it("applyOverrides reaplica só os caminhos ajustados", () => {
    const snap = structuredClone(A);
    snap.taxRate = 0.2;
    snap.banks.find((b) => b.id === "bradesco")!.obraBankShare = 0.9;
    snap.liveCost = 999;
    const current = structuredClone(A);
    current.liveCost = 7000;
    const out = applyOverrides(current, snap, ["taxRate", "banks.bradesco.obraBankShare"]);
    expect(out.taxRate).toBe(0.2);
    expect(out.banks.find((b) => b.id === "bradesco")!.obraBankShare).toBe(0.9);
    expect(out.liveCost).toBe(7000);
  });
});
