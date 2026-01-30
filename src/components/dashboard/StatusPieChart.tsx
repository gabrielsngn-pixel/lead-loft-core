import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Lead, LeadStatus } from "@/types/crm";

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
        <CardTitle className="text-lg font-display">Ativos por Status</CardTitle>
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
                formatter={(value: number) => [value, "Leads"]}
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
