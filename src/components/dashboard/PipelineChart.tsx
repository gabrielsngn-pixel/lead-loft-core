import { Negotiation } from "@/types/crm";
import { cn } from "@/lib/utils";

interface PipelineChartProps {
  negotiations: Negotiation[];
}

const stages = [
  { key: "qualificacao", label: "Qualificação", color: "bg-blue-500" },
  { key: "proposta", label: "Proposta", color: "bg-primary" },
  { key: "negociacao", label: "Negociação", color: "bg-warning" },
  { key: "fechamento", label: "Fechamento", color: "bg-success" },
];

export function PipelineChart({ negotiations }: PipelineChartProps) {
  const stageData = stages.map((stage) => {
    const stageNegotiations = negotiations.filter((n) => n.etapa === stage.key);
    const totalValue = stageNegotiations.reduce((sum, n) => sum + n.valor, 0);
    const count = stageNegotiations.length;
    return { ...stage, totalValue, count };
  });

  const maxValue = Math.max(...stageData.map((s) => s.totalValue), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="stat-card">
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold">Pipeline de Vendas</h3>
        <p className="text-sm text-muted-foreground">Valor por etapa do funil</p>
      </div>
      <div className="space-y-4">
        {stageData.map((stage, index) => (
          <div
            key={stage.key}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                <span className="text-sm font-medium">{stage.label}</span>
                <span className="text-xs text-muted-foreground">
                  ({stage.count} {stage.count === 1 ? "negócio" : "negócios"})
                </span>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(stage.totalValue)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                style={{ width: `${(stage.totalValue / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total no Pipeline</span>
          <span className="text-lg font-display font-bold text-primary">
            {formatCurrency(stageData.reduce((sum, s) => sum + s.totalValue, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}