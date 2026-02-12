import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead, LeadStatus } from "@/types/crm";
import { Users, CalendarCheck, UserCog } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie, Legend } from "recharts";

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  novo: { label: "Novo", color: "hsl(15, 100%, 64%)" },
  qualificado: { label: "Qualificado", color: "hsl(162, 65%, 20%)" },
  proposta: { label: "Proposta", color: "hsl(27, 100%, 75%)" },
  ganho: { label: "Ganho", color: "hsl(162, 68%, 39%)" },
  perdido: { label: "Perdido", color: "hsl(0, 84%, 60%)" },
};

interface ContatosAtivosSummaryProps {
  contacts: Lead[];
}

export function ContatosAtivosSummary({ contacts }: ContatosAtivosSummaryProps) {
  const totalContacts = contacts.length;

  const totalMeetingsScheduled = useMemo(
    () => contacts.filter((c) => c.proximaReuniao).length,
    [contacts]
  );

  const consultorData = useMemo(() => {
    const map = new Map<string, { nome: string; count: number }>();
    contacts.forEach((c) => {
      const id = c.responsavelId || "sem";
      const nome = c.responsavelNome || "Sem consultor";
      if (!map.has(id)) map.set(id, { nome, count: 0 });
      map.get(id)!.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [contacts]);

  const totalConsultores = consultorData.length;

  const barData = useMemo(
    () => consultorData.map((c) => ({ name: c.nome.split(" ")[0], contatos: c.count })),
    [consultorData]
  );

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: statusConfig[status as LeadStatus]?.label || status,
      value,
      color: statusConfig[status as LeadStatus]?.color || "hsl(var(--muted))",
    }));
  }, [contacts]);

  const barColors = [
    "hsl(15, 100%, 64%)",
    "hsl(162, 65%, 20%)",
    "hsl(27, 100%, 75%)",
    "hsl(162, 68%, 39%)",
    "hsl(220, 70%, 55%)",
    "hsl(280, 60%, 55%)",
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Metric cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card p-0">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Contatos Ativos</p>
              <p className="text-2xl font-semibold">{totalContacts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card p-0">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reuniões Agendadas</p>
              <p className="text-2xl font-semibold">{totalMeetingsScheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card p-0">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Consultores</p>
              <p className="text-2xl font-semibold">{totalConsultores}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="stat-card p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Contatos por Consultor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value, "Contatos"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="contatos" radius={[4, 4, 0, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Contatos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "Contatos"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
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
      </div>
    </div>
  );
}
