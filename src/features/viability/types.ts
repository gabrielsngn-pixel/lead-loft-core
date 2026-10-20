export type ProductKey = "traditional" | "saas" | "full_saas";

export type CostLineKey =
  | "live"
  | "salesOnboarding"
  | "salesFormalization"
  | "opsCredit"
  | "opsLegal"
  | "opsRelease"
  | "registryOutsideSp"
  | "registrySp";

export type TeamKey = "salesOnboarding" | "salesFormalization" | "opsCredit" | "opsLegal" | "opsRelease";

export type DeveloperPaymentMode = "all" | "unpaid_only" | "obra_bank_only" | "unpaid_and_obra_bank";

export interface BankAssumption {
  id: string;
  name: string;
  fixedFeeType: "amount" | "percent";
  fixedFeeValue: number;
  obraBankShare: number;
  unpaidConversionRate: number;
  isActive: boolean;
}

export interface TeamAssumption {
  volumeRate: number;
  proposalsPerHead: number;
  costPerHead: number;
}

export interface ViabilityAssumptions {
  banks: BankAssumption[];
  taxRate: number;
  commissionedRate: { ticketThreshold: number; rateAtOrAbove: number; rateBelow: number };
  productRevenueShare: Record<ProductKey, number>;
  costApplicability: Record<CostLineKey, ProductKey[]>;
  liveCost: number;
  teams: Record<TeamKey, TeamAssumption>;
  registryCostPerCase: { outsideSp: number; sp: number };
  minimumProfit: { base: number; divisor: number; multiplier: number };
  benchmarks: { netRevenuePerUnit: number; averageCommissionRate: number };
  newSimulationDefaults: {
    conversionRate: number;
    developerFeePerUnit: number;
    developerPaymentMode: DeveloperPaymentMode;
    registryFeePerUnit: number;
    registryConversionRate: number;
    outsideSpShare: number;
  };
}

export interface SimulationInputs {
  totalUnits: number | null;
  stockUnits: number | null;
  unitsToTransfer: number;
  habiteSeMonth: string | null;
  averageTicket: number;
  obraBankId: string;
  product: ProductKey;
  conversionRate: number;
  developerFeePerUnit: number;
  developerPaymentMode: DeveloperPaymentMode;
  registryFeePerUnit: number;
  registryConversionRate: number;
  outsideSpShare: number;
}

export interface CostLine {
  key: CostLineKey;
  label: string;
  volume: number | null;
  proposalsPerHead: number | null;
  headcount: number | null;
  unitCost: number;
  value: number;
  applies: boolean;
}

export type MinimumPriceStatus = "reachable" | "already_viable" | "not_reachable";

export interface ViabilityResult {
  product: ProductKey;
  issuedUnits: number;
  issuedVgf: number;
  pBO: number;
  pCom: number;
  pIso: number;
  tCom: number;
  revenue: {
    obraBank: number;
    commissionedBanks: number;
    developer: number;
    client: number;
    potential: number;
    netPotential: number;
  };
  developerBase: number;
  revenueShare: number;
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  costLines: CostLine[];
  totalCost: number;
  operatingProfit: number;
  minimumProfit: number;
  gap: number;
  isViable: boolean;
  perUnit: {
    grossRevenue: number | null;
    taxes: number | null;
    netRevenue: number | null;
    totalCost: number | null;
    operatingProfit: number | null;
    minimumProfit: number | null;
    gap: number | null;
  };
  averageNetRevenuePerUnit: number | null;
  averageCommissionRate: number | null;
  benchmarks: {
    netRevenuePerUnitMet: boolean | null;
    averageCommissionRateMet: boolean | null;
  };
  minimumDeveloperFee: { status: MinimumPriceStatus; value: number | null };
}
