import { z } from "zod";

const frac = z.number().min(0).max(1);
const money = z.number().min(0);
const product = z.enum(["traditional", "saas", "full_saas"]);
const paymentMode = z.enum(["all", "unpaid_only", "obra_bank_only", "unpaid_and_obra_bank"]);
const team = z.object({ volumeRate: frac, proposalsPerHead: z.number().gt(0), costPerHead: money });

export const assumptionsSchema = z.object({
  banks: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      fixedFeeType: z.enum(["amount", "percent"]),
      fixedFeeValue: money,
      obraBankShare: frac,
      unpaidConversionRate: frac,
      isActive: z.boolean(),
    })
  ).min(1),
  taxRate: frac,
  commissionedRate: z.object({ ticketThreshold: money, rateAtOrAbove: frac, rateBelow: frac }),
  productRevenueShare: z.object({ traditional: frac, saas: frac, full_saas: frac }),
  costApplicability: z.object({
    live: z.array(product), salesOnboarding: z.array(product), salesFormalization: z.array(product),
    opsCredit: z.array(product), opsLegal: z.array(product), opsRelease: z.array(product),
    registryOutsideSp: z.array(product), registrySp: z.array(product),
  }),
  liveCost: money,
  teams: z.object({ salesOnboarding: team, salesFormalization: team, opsCredit: team, opsLegal: team, opsRelease: team }),
  registryCostPerCase: z.object({ outsideSp: money, sp: money }),
  minimumProfit: z.object({ base: money, divisor: z.number().gt(0), multiplier: money }),
  benchmarks: z.object({ netRevenuePerUnit: money, averageCommissionRate: frac }),
  newSimulationDefaults: z.object({
    conversionRate: frac, developerFeePerUnit: money, developerPaymentMode: paymentMode,
    registryFeePerUnit: money, registryConversionRate: frac, outsideSpShare: frac,
  }),
});

export const inputsSchema = z.object({
  totalUnits: z.number().int().min(0).nullable(),
  stockUnits: z.number().int().min(0).nullable(),
  unitsToTransfer: z.number().int().gt(0),
  habiteSeMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  averageTicket: z.number().gt(0),
  obraBankId: z.string().min(1),
  product,
  conversionRate: frac,
  developerFeePerUnit: money,
  developerPaymentMode: paymentMode,
  registryFeePerUnit: money,
  registryConversionRate: frac,
  outsideSpShare: frac,
});
