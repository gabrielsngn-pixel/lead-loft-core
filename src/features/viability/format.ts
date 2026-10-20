const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const bad = (v: number | null | undefined) => v === null || v === undefined || !isFinite(v);

export const formatMoney = (v: number | null | undefined) => (bad(v) ? "—" : brl.format(v as number));
export const formatPercent = (v: number | null | undefined) => (bad(v) ? "—" : pct.format(v as number));
export const formatQty = (v: number | null | undefined) => (bad(v) ? "—" : qty.format(v as number));
