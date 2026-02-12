import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead } from "@/types/crm";
import { Users, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
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

const LOFT_GREEN = "hsl(158, 70%, 25%)"; // #115644
const LOFT_ORANGE = "hsl(14, 100%, 60%)"; // #FF774A
const MUTED_GRAY = "hsl(0, 0%, 85%)";

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card))",
  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
  fontSize: "12px",
};

export function ContatosAtivosSummary({ contacts }: ContatosAtivosSummaryProps) {
  const totalContacts = contacts.length;

  const meetingTotals = useMemo(() => {
    let realizadas = 0;
    let futuras = 0;
    contacts.forEach((c) => {
      if (c.ultimaReuniao) realizadas++;
      if (c.proximaReuniao) futuras++;
    });
    return { total: realizadas + futuras, realizadas, futuras };
  }, [contacts]);

  const stackedData = useMemo(() => {
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
      .sort((a, b) => b.total - a.total)
      .map((c) => {
        const pctQual = c.total > 0 ? Math.round((c.qualificados / c.total) * 100) : 0;
        return {
          name: c.nome.split(" ").slice(0, 2).join(" "),
          qualificados: pctQual,
          outros: 100 - pctQual,
          totalContatos: c.total,
          totalQual: c.qualificados,
        };
      });
  }, [contacts]);

  const totalQualificadosPercent = useMemo(() => {
    if (!totalContacts) return 0;
    const qualificados = contacts.filter((c) => c.status === "qualificado").length;
    return Math.round((qualificados / totalContacts) * 100);
  }, [contacts, totalContacts]);

  const StackedLabel = () => null; // Label removido

  return (
    <div className="space-y-4 mb-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-lg bg-success/10">
              <CalendarCheck className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Reuniões
              </p>
              <p className="text-3xl font-display font-bold tracking-tight text-foreground">
                {meetingTotals.total}
              </p>
              <div className="flex gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  {meetingTotals.realizadas} realizadas
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  {meetingTotals.futuras} futuras
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary bg-card rounded-xl shadow-sm">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="p-3 rounded-lg bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Taxa de Qualificação
              </p>
              <p className="text-3xl font-display font-bold tracking-tight text-foreground">
                {totalQualificadosPercent}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stacked 100% column chart */}
      <Card className="bg-card rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display font-semibold text-foreground">
            Qualificação por Consultor
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedData}
                barSize={36}
                margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === "Qualificados") return [`${value}% (${props.payload.totalQual})`, "Qualificados"];
                    return [`${value}%`, "Outros"];
                  }}
                  labelFormatter={(label: string, payload: any) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${label} — ${item.totalContatos} contatos` : label;
                  }}
                />
                <Bar
                  dataKey="qualificados"
                  name="Qualificados"
                  stackId="a"
                  fill={LOFT_GREEN}
                  radius={[0, 0, 0, 0]}
                  label={<StackedLabel />}
                />
                <Bar
                  dataKey="outros"
                  name="Outros"
                  stackId="a"
                  fill={MUTED_GRAY}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-1">
            Passe o mouse sobre as barras para ver o total de contatos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
