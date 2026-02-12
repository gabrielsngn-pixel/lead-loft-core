import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead } from "@/types/crm";
import { Users, CalendarCheck, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";

interface ContatosAtivosSummaryProps {
  contacts: Lead[];
}

export function ContatosAtivosSummary({ contacts }: ContatosAtivosSummaryProps) {
  const totalContacts = contacts.length;

  const totalMeetingsScheduled = useMemo(
    () => contacts.filter((c) => c.proximaReuniao).length,
    [contacts]
  );

  const totalQualificadosPercent = useMemo(() => {
    if (!totalContacts) return 0;
    const qualificados = contacts.filter((c) => c.status === "qualificado").length;
    return Math.round((qualificados / totalContacts) * 100);
  }, [contacts, totalContacts]);

  const consultorData = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; qualificados: number }>();
    contacts.forEach((c) => {
      const id = c.responsavelId || "sem";
      const nome = c.responsavelNome || "Sem consultor";
      if (!map.has(id)) map.set(id, { nome, total: 0, qualificados: 0 });
      const entry = map.get(id)!;
      entry.total++;
      if (c.status === "qualificado") entry.qualificados++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [contacts]);

  const barData = useMemo(
    () =>
      consultorData.map((c) => ({
        name: c.nome.split(" ")[0],
        contatos: c.total,
        qualificadosPct: c.total > 0 ? Math.round((c.qualificados / c.total) * 100) : 0,
      })),
    [consultorData]
  );

  const meetingData = useMemo(() => {
    const map = new Map<string, { nome: string; realizadas: number; futuras: number }>();
    contacts.forEach((c) => {
      const id = c.responsavelId || "sem";
      const nome = c.responsavelNome || "Sem consultor";
      if (!map.has(id)) map.set(id, { nome, realizadas: 0, futuras: 0 });
      const entry = map.get(id)!;
      if (c.ultimaReuniao) entry.realizadas++;
      if (c.proximaReuniao) entry.futuras++;
    });
    return Array.from(map.values())
      .filter((m) => m.realizadas > 0 || m.futuras > 0)
      .sort((a, b) => b.realizadas + b.futuras - (a.realizadas + a.futuras))
      .map((m) => ({ name: m.nome.split(" ")[0], realizadas: m.realizadas, futuras: m.futuras }));
  }, [contacts]);

  const barColors = [
    "hsl(15, 100%, 64%)",
    "hsl(162, 65%, 20%)",
    "hsl(27, 100%, 75%)",
    "hsl(162, 68%, 39%)",
    "hsl(220, 70%, 55%)",
    "hsl(280, 60%, 55%)",
  ];

  const CustomBarLabel = ({ x, y, width, value }: any) => (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="hsl(var(--muted-foreground))"
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
    >
      {value}%
    </text>
  );

  return (
    <div className="space-y-4 mb-6">
      {/* Metric cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="stat-card p-0 border-l-4 border-l-primary">
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
        <Card className="stat-card p-0 border-l-4 border-l-loft-green">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 rounded-xl bg-loft-green/10 text-loft-green">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reuniões Agendadas</p>
              <p className="text-2xl font-semibold">{totalMeetingsScheduled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="stat-card p-0">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">Contatos por Consultor</CardTitle>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {totalQualificadosPercent}% qualificados
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "qualificadosPct") return [`${value}%`, "Qualificados"];
                      return [value, "Contatos"];
                    }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="contatos" radius={[6, 6, 0, 0]} label={<CustomBarLabel />}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-1">% de qualificados por consultor</p>
          </CardContent>
        </Card>

        <Card className="stat-card p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Reuniões por Consultor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meetingData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Bar dataKey="realizadas" name="Realizadas" fill="hsl(162, 65%, 20%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="futuras" name="Futuras" fill="hsl(15, 100%, 64%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-1">
              Realizadas = última reunião · Futuras = próxima reunião
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
