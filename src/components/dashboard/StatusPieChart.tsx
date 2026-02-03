import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Lead, LeadStatus } from "@/types/crm";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  novo: { label: "Novo", color: "hsl(15, 100%, 64%)" },
  qualificado: { label: "Qualificado", color: "hsl(162, 65%, 20%)" },
  proposta: { label: "Proposta", color: "hsl(27, 100%, 75%)" },
  ganho: { label: "Ganho", color: "hsl(162, 68%, 39%)" },
  perdido: { label: "Perdido", color: "hsl(0, 84%, 60%)" },
};

interface StatusPieChartProps {
  leads: Lead[];
}

export function StatusPieChart({ leads }: StatusPieChartProps) {
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusConfig[status as LeadStatus].label,
    value: count,
    color: statusConfig[status as LeadStatus].color,
  }));

  return (
    <Card className="stat-card p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <span>Contatos por Status</span>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
                Distribuição dos contatos ativos por status atual no funil comercial.
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value, "Contatos"]}
                contentStyle={{ 
                  borderRadius: "8px", 
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))"
                }}
              />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
