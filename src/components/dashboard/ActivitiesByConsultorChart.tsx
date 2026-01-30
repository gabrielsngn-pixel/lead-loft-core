import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Activity, User } from "@/types/crm";

interface ActivitiesByConsultorChartProps {
  activities: Activity[];
  users: User[];
}

export function ActivitiesByConsultorChart({ activities, users }: ActivitiesByConsultorChartProps) {
  const activityCounts = activities.reduce((acc, activity) => {
    if (!activity.concluida) {
      acc[activity.responsavelId] = (acc[activity.responsavelId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const data = users
    .filter(u => u.role === "consultor")
    .map(user => ({
      name: user.nome.split(" ")[0],
      atividades: activityCounts[user.id] || 0,
    }));

  return (
    <Card className="stat-card p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display">Atividades da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [value, "Atividades"]}
                contentStyle={{ 
                  borderRadius: "8px", 
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))"
                }}
              />
              <Bar 
                dataKey="atividades" 
                radius={[0, 4, 4, 0]}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index % 2 === 0 ? "hsl(15, 100%, 64%)" : "hsl(162, 65%, 20%)"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
