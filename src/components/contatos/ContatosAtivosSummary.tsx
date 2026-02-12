import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead } from "@/types/crm";
import { Users, CalendarCheck, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface ContatosAtivosSummaryProps {
  contacts: Lead[];
}

const NAVY = "hsl(220, 50%, 30%)";
const NAVY_LIGHT = "hsl(220, 40%, 55%)";
const GREEN = "hsl(162, 55%, 35%)";
const GREEN_LIGHT = "hsl(162, 40%, 65%)";

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card))",
  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
  fontSize: "12px",
};

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

  const barData = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; qualificados: number }>();
    contacts.forEach((c) => {
      const id = c.responsavelId || "sem";
      const nome = c.responsavelNome || "Sem consultor";
      if (!map.has(id)) map.set(id, { nome, total: 0, qualificados: 0 });
      const entry = map.get(id)!;
      entry.total++;
      if (c.status === "qualificado") entry.qualificados++;
    });
    return Array.from(map.values())
      .sort((a, b) => a.total - b.total)
      .map((c) => ({
        name: c.nome.split(" ").slice(0, 2).join(" "),
        total: c.total,
        qualificados: c.qualificados,
        pct: c.total > 0 ? Math.round((c.qualificados / c.total) * 100) : 0,
      }));
  }, [contacts]);

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
      .map((m) => ({
        name: m.nome.split(" ").slice(0, 2).join(" "),
        realizadas: m.realizadas,
        futuras: m.futuras,
      }));
  }, [contacts]);

  const contactsChartHeight = Math.max(220, barData.length * 44 + 40);

  const QualLabel = ({ x, y, width, value, payload }: any) => {
    const pct = payload?.pct;
    if (pct === undefined) return null;
    return (
      <text
        x={x + width + 6}
        y={y + 4}
        fill={GREEN}
        fontSize={11}
        fontWeight={600}
      >
        {pct}%
      </text>
    );
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-secondary bg-card rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total de Contatos Ativos
              </p>
              <p className="text-3xl font-display font-bold tracking-tight text-foreground">
                {totalContacts}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success bg-card rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="p-3 rounded-lg bg-success/10">
              <CalendarCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Reuniões Agendadas
              </p>
              <p className="text-3xl font-display font-bold tracking-tight text-foreground">
                {totalMeetingsScheduled}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Horizontal bar: Contatos por Consultor */}
        <Card className="bg-card rounded-xl shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display font-semibold text-foreground">
              Contatos por Consultor
            </CardTitle>
            <div className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1 rounded-full text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {totalQualificadosPercent}% qualificados
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div style={{ height: contactsChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  barGap={2}
                  barSize={16}
                  margin={{ top: 4, right: 50, bottom: 4, left: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => {
                      if (name === "qualificados") return [value, "Qualificados"];
                      return [value, "Total"];
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                  />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill={NAVY}
                    radius={[0, 4, 4, 0]}
                    label={<QualLabel />}
                  />
                  <Bar
                    dataKey="qualificados"
                    name="Qualificados"
                    fill={GREEN}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-1">
              % de qualificados exibido ao lado de cada barra
            </p>
          </CardContent>
        </Card>

        {/* Grouped bar: Reuniões por Consultor */}
        <Card className="bg-card rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display font-semibold text-foreground">
              Reuniões por Consultor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={meetingData}
                  barGap={3}
                  barSize={22}
                  margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
                  />
                  <Bar
                    dataKey="realizadas"
                    name="Realizadas"
                    fill={NAVY}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="futuras"
                    name="Futuras"
                    fill={NAVY_LIGHT}
                    radius={[4, 4, 0, 0]}
                  />
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
