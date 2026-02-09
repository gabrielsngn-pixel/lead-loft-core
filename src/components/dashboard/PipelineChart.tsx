import { Negotiation } from "@/types/crm";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface PipelineChartProps {
  negotiations: Negotiation[];
}

const stages = [
  { key: "proposta_aprovada", label: "Proposta Aprovada", color: "bg-blue-500" },
  { key: "proposta_enviada", label: "Proposta Enviada", color: "bg-primary" },
  { key: "em_negociacao", label: "Em Negociação", color: "bg-warning" },
  { key: "proposta_ganha", label: "Proposta Ganha", color: "bg-success" },
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

  // Total only for active stages (excluding ganha)
  const activeTotal = stageData
    .filter(s => s.key !== "proposta_ganha")
    .reduce((sum, s) => sum + s.totalValue, 0);

  return (
    <div className="stat-card">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Receita Operacional</h3>
          <p className="text-sm text-muted-foreground">Valor por etapa do funil</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
              Visualização do valor acumulado em cada etapa do funil de negociações. 
              Considera apenas negociações ativas, excluindo canceladas.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
          <span className="text-sm text-muted-foreground">Pipeline Ativo</span>
          <span className="text-lg font-display font-bold text-primary">
            {formatCurrency(activeTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}