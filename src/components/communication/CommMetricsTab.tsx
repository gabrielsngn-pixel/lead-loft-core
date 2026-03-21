import { useEmailMetrics } from "@/hooks/useEmailOutreach";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Mail, CheckCircle, Eye } from "lucide-react";

export function CommMetricsTab() {
  const { data: metrics, isLoading } = useEmailMetrics();

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando métricas...</p>;
  if (!metrics) return null;

  const kpis = [
    { title: "Emails Hoje", value: metrics.today, icon: Mail, color: "text-primary" },
    { title: "Total Enviados", value: metrics.total, icon: CheckCircle, color: "text-primary" },
    { title: "Taxa de Abertura", value: `${metrics.openRate}%`, icon: Eye, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Métricas de Email</h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Envios por Consultor</CardTitle>
        </CardHeader>
        <CardContent>
          {(metrics.byUser as any[]).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.byUser as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sent" name="Enviados" fill="hsl(var(--primary))" />
                <Bar dataKey="read" name="Lidos" fill="hsl(var(--accent))" />
                <Bar dataKey="replied" name="Respondidos" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
