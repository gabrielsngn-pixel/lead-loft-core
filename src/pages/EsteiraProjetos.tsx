import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  Target,
  TrendingUp,
  FileSignature,
  BarChart3,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface ProjetoAprovado {
  id: string;
  nome_empreendimento: string;
  empresa_nome: string | null;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  data_habitese: string | null;
  vgv_estimado: number | null;
  status_contrato: string | null;
  margem_estimada: number | null;
  comissao_incorporador: number | null;
  simulation_data: any;
  solicitado_por_nome: string;
  receita_operacional: number;
}

const MONTHS_2026 = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const META_VGV_TOTAL = 1_000_000_000;
const META_UNIDADES_TOTAL = 2500;
const META_VGV_CONSULTOR = 333_000_000;
const META_UNIDADES_CONSULTOR = 833;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const EsteiraProjetos = () => {
  const { toast } = useToast();
  const [projetos, setProjetos] = useState<ProjetoAprovado[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [incorporadoraFilter, setIncorporadoraFilter] = useState<string>("todas");
  const [consultorFilter, setConsultorFilter] = useState<string>("todos");
  const [mesRange, setMesRange] = useState<string>("todos");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  useEffect(() => {
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    setLoading(true);
    try {
      const [viabRes, negRes] = await Promise.all([
        supabase
          .from("viabilidades")
          .select("id, nome_empreendimento, empresa_nome, cnpj, cidade, estado, data_habitese, vgv_estimado, status_contrato, margem_estimada, comissao_incorporador, simulation_data, solicitado_por_nome")
          .eq("status", "aprovado"),
        supabase
          .from("negotiations")
          .select("viabilidade_id, valor")
          .not("viabilidade_id", "is", null),
      ]);

      if (viabRes.error) throw viabRes.error;
      if (negRes.error) throw negRes.error;

      // Build a map viabilidade_id -> sum of valor (receita operacional)
      const receitaMap = new Map<string, number>();
      (negRes.data || []).forEach((n) => {
        if (n.viabilidade_id) {
          receitaMap.set(n.viabilidade_id, (receitaMap.get(n.viabilidade_id) || 0) + n.valor);
        }
      });

      const projetos = (viabRes.data || []).map((v) => ({
        ...v,
        receita_operacional: receitaMap.get(v.id) || 0,
      })) as ProjetoAprovado[];

      setProjetos(projetos);
    } catch (error) {
      console.error("Error fetching projetos:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os projetos aprovados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUnidades = (projeto: ProjetoAprovado): number => {
    if (projeto.simulation_data && typeof projeto.simulation_data === "object") {
      const sim = projeto.simulation_data as any;
      return sim.unidades || 0;
    }
    return 0;
  };

  const getTicketMedio = (projeto: ProjetoAprovado): number => {
    const unidades = getUnidades(projeto);
    const vgv = projeto.vgv_estimado || 0;
    return unidades > 0 ? vgv / unidades : 0;
  };

  // Get unique incorporadoras
  const incorporadoras = useMemo(() => {
    const set = new Set<string>();
    projetos.forEach((p) => {
      if (p.empresa_nome) set.add(p.empresa_nome);
    });
    return Array.from(set).sort();
  }, [projetos]);

  // Get unique consultors
  const consultores = useMemo(() => {
    const set = new Set<string>();
    projetos.forEach((p) => {
      if (p.solicitado_por_nome) set.add(p.solicitado_por_nome);
    });
    return Array.from(set).sort();
  }, [projetos]);

  // Filter projects
  const filteredProjetos = useMemo(() => {
    return projetos.filter((p) => {
      if (statusFilter !== "todos") {
        const sc = p.status_contrato || "nao_enviado";
        if (sc !== statusFilter) return false;
      }
      if (consultorFilter !== "todos" && p.solicitado_por_nome !== consultorFilter) return false;
      if (incorporadoraFilter !== "todas" && p.empresa_nome !== incorporadoraFilter) return false;
      if (mesRange !== "todos" && p.data_habitese) {
        const month = new Date(p.data_habitese).getMonth();
        if (mesRange === "jan_jun" && month > 5) return false;
        if (mesRange === "jul_dez" && month < 6) return false;
      }
      return true;
    });
  }, [projetos, statusFilter, incorporadoraFilter, consultorFilter, mesRange]);

  // Group by month
  const monthlyData = useMemo(() => {
    return MONTHS_2026.map((name, index) => {
      const monthProjetos = filteredProjetos.filter((p) => {
        if (!p.data_habitese) return false;
        const d = new Date(p.data_habitese);
        return d.getMonth() === index && d.getFullYear() === 2026;
      });

      const totalUnidades = monthProjetos.reduce((sum, p) => sum + getUnidades(p), 0);
      const totalVGV = monthProjetos.reduce((sum, p) => sum + (p.vgv_estimado || 0), 0);
      const totalReceita = monthProjetos.reduce((sum, p) => sum + (p.receita_operacional || 0), 0);
      const assinados = monthProjetos.filter((p) => p.status_contrato === "assinado").length;
      const emAssinatura = monthProjetos.filter((p) => (p.status_contrato || "nao_enviado") === "em_assinatura").length;
      const naoEnviado = monthProjetos.filter((p) => (p.status_contrato || "nao_enviado") === "nao_enviado").length;

      return {
        name,
        index,
        projetos: monthProjetos,
        count: monthProjetos.length,
        totalUnidades,
        totalVGV,
        totalReceita,
        assinados,
        emAssinatura,
        naoEnviado,
      };
    });
  }, [filteredProjetos]);

  // Totals
  const totals = useMemo(() => {
    const totalVGV = filteredProjetos.reduce((sum, p) => sum + (p.vgv_estimado || 0), 0);
    const totalUnidades = filteredProjetos.reduce((sum, p) => sum + getUnidades(p), 0);
    return { totalVGV, totalUnidades };
  }, [filteredProjetos]);

  const isConsultorView = consultorFilter !== "todos";
  const META_VGV = isConsultorView ? META_VGV_CONSULTOR : META_VGV_TOTAL;
  const META_UNIDADES = isConsultorView ? META_UNIDADES_CONSULTOR : META_UNIDADES_TOTAL;

  const vgvPercent = (totals.totalVGV / META_VGV) * 100;
  const unidadesPercent = (totals.totalUnidades / META_UNIDADES) * 100;

  const getTrafficLight = (percent: number) => {
    if (percent > 90) return { color: "text-success", bg: "bg-success", label: "Verde" };
    if (percent >= 70) return { color: "text-warning-foreground", bg: "bg-warning", label: "Amarelo" };
    return { color: "text-destructive", bg: "bg-destructive", label: "Vermelho" };
  };

  const vgvLight = getTrafficLight(vgvPercent);
  const unidadesLight = getTrafficLight(unidadesPercent);

  // Drill down data
  const drillDownProjetos = useMemo(() => {
    if (selectedMonth === null) return [];
    return monthlyData[selectedMonth]?.projetos || [];
  }, [selectedMonth, monthlyData]);

  const exportToExcel = () => {
    const rows = filteredProjetos.map((p) => {
      const sim = p.simulation_data as any;
      const bankMix = sim?.bankMix || {};
      const caixaSubMix = sim?.caixaSubMix || {};
      const unidades = sim?.unidades || 0;
      const vgv = p.vgv_estimado || 0;
      const ticketMedio = unidades > 0 ? vgv / unidades : 0;

      return {
        "Empreendimento": p.nome_empreendimento,
        "Incorporadora": p.empresa_nome || "",
        "CNPJ": p.cnpj || "",
        "Cidade": p.cidade || "",
        "Estado": p.estado || "",
        "Consultor": p.solicitado_por_nome,
        "Data Habite-se": p.data_habitese ? format(new Date(p.data_habitese), "dd/MM/yyyy", { locale: ptBR }) : "",
        "Status Contrato": p.status_contrato === "assinado" ? "Assinado" : p.status_contrato === "em_assinatura" ? "Em assinatura" : "Não enviado",
        "Unidades": unidades,
        "Ticket Médio (R$)": Math.round(ticketMedio),
        "VGV Estimado (R$)": Math.round(vgv),
        "Comissão Incorporador (%)": p.comissao_incorporador != null ? (p.comissao_incorporador * 100).toFixed(2) : "",
        "Margem Estimada (%)": p.margem_estimada != null ? p.margem_estimada.toFixed(2) : "",
        "Receita Operacional Loft (R$)": Math.round(p.receita_operacional),
        "Mix Itaú (%)": bankMix.itau ?? "",
        "Mix Santander (%)": bankMix.santander ?? "",
        "Mix Bradesco (%)": bankMix.bradesco ?? "",
        "Mix Caixa (%)": bankMix.caixa ?? "",
        "Caixa - Ind. SPBE (%)": caixaSubMix.individual_spbe ?? "",
        "Caixa - Aloc. SPBE (%)": caixaSubMix.alocacao_spbe ?? "",
        "Caixa - Ind. MCMV (%)": caixaSubMix.individual_mcmv ?? "",
        "Caixa - Aloc. MCMV (%)": caixaSubMix.alocacao_mcmv ?? "",
        "Comissão Bancária Ponderada (%)": sim?.taxaPonderadaBanco != null ? (sim.taxaPonderadaBanco * 100).toFixed(2) : "",
        "Registro Tipo": sim?.registroTipo === "parceiro" ? "Parceiro" : sim?.registroTipo === "internalizado" ? "Internalizado" : sim?.registroTipo === "sem_registro" ? "Sem registro" : "",
        "Remunerar Caixa": sim?.remunerarCaixa === true ? "Sim" : sim?.remunerarCaixa === false ? "Não" : "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projetos Aprovados");

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String((r as any)[key]).length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `esteira-projetos-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast({ title: "Planilha exportada com sucesso!" });
  };

  if (loading) {
    return (
      <AppLayout title="Esteira de Projetos" subtitle="Gestão de VGV e Unidades 2026">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Esteira de Projetos" subtitle="Gestão de VGV e Unidades 2026">
      {/* Metas Estratégicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className={cn("border-2", vgvLight.color === "text-success" ? "border-success/30" : vgvLight.color === "text-warning-foreground" ? "border-warning/30" : "border-destructive/30")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className={cn("w-5 h-5", vgvLight.color)} />
                <h3 className="font-semibold">Meta de VGV Contratado</h3>
              </div>
              <div className={cn("w-3 h-3 rounded-full", vgvLight.bg)} />
            </div>
            <p className="text-3xl font-bold font-display mb-1">{formatCurrency(totals.totalVGV)}</p>
            <p className="text-sm text-muted-foreground mb-3">
              Meta: {formatCurrency(META_VGV)} · {vgvPercent.toFixed(1)}% atingida
            </p>
            <Progress value={Math.min(vgvPercent, 100)} className="h-2" />
          </CardContent>
        </Card>

        <Card className={cn("border-2", unidadesLight.color === "text-success" ? "border-success/30" : unidadesLight.color === "text-warning-foreground" ? "border-warning/30" : "border-destructive/30")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className={cn("w-5 h-5", unidadesLight.color)} />
                <h3 className="font-semibold">Meta de Unidades Contratadas</h3>
              </div>
              <div className={cn("w-3 h-3 rounded-full", unidadesLight.bg)} />
            </div>
            <p className="text-3xl font-bold font-display mb-1">{totals.totalUnidades.toLocaleString("pt-BR")}</p>
            <p className="text-sm text-muted-foreground mb-3">
              Meta: {META_UNIDADES.toLocaleString("pt-BR")} un · {unidadesPercent.toFixed(1)}% atingida
            </p>
            <Progress value={Math.min(unidadesPercent, 100)} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros Globais */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="nao_enviado">Não enviado</SelectItem>
            <SelectItem value="em_assinatura">Em assinatura</SelectItem>
            <SelectItem value="assinado">Assinado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={incorporadoraFilter} onValueChange={setIncorporadoraFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Incorporadora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {incorporadoras.map((inc) => (
              <SelectItem key={inc} value={inc}>{inc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={consultorFilter} onValueChange={setConsultorFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Consultor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Consultores</SelectItem>
            {consultores.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mesRange} onValueChange={setMesRange}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os meses</SelectItem>
            <SelectItem value="jan_jun">Jan – Jun</SelectItem>
            <SelectItem value="jul_dez">Jul – Dez</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendário Anual – 12 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {monthlyData.map((month) => (
          <Card
            key={month.index}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
              month.count > 0 ? "border-primary/10" : "opacity-60"
            )}
            onClick={() => {
              if (month.count > 0) {
                setSelectedMonth(month.index);
                setDrillDownOpen(true);
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {month.name}/2026
                </CardTitle>
                {month.count > 0 && (
                  <Badge variant="secondary">{month.count} projeto{month.count !== 1 ? "s" : ""}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {month.count > 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unidades</span>
                    <span className="font-medium">{month.totalUnidades.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VGV</span>
                    <span className="font-semibold text-primary">{formatCurrency(month.totalVGV)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receita Loft</span>
                    <span className="font-semibold text-success">{formatCurrency(month.totalReceita)}</span>
                  </div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {month.assinados > 0 && (
                      <Badge className="bg-success/10 text-success border-success/20 text-xs">
                        <FileSignature className="w-3 h-3 mr-1" />
                        {month.assinados} assinado{month.assinados !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {month.emAssinatura > 0 && (
                      <Badge className="bg-warning/10 text-warning-foreground border-warning/20 text-xs">
                        {month.emAssinatura} em assin.
                      </Badge>
                    )}
                    {month.naoEnviado > 0 && (
                      <Badge className="bg-muted text-muted-foreground text-xs">
                        {month.naoEnviado} não enviado{month.naoEnviado !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Sem projetos</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drill Down Dialog */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {selectedMonth !== null ? `${MONTHS_2026[selectedMonth]}/2026` : ""} — Detalhamento
            </DialogTitle>
          </DialogHeader>

          {drillDownProjetos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incorporadora</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                   <TableHead className="text-right">VGV</TableHead>
                   <TableHead className="text-right">Receita Loft</TableHead>
                   <TableHead>Habite-se</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drillDownProjetos
                  .sort((a, b) => (a.empresa_nome || "").localeCompare(b.empresa_nome || ""))
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.empresa_nome || "—"}</TableCell>
                      <TableCell>{p.nome_empreendimento}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-xs",
                            p.status_contrato === "assinado"
                              ? "bg-success/10 text-success border-success/20"
                              : p.status_contrato === "em_assinatura"
                              ? "bg-warning/10 text-warning-foreground border-warning/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {p.status_contrato === "assinado" ? "Assinado" : p.status_contrato === "em_assinatura" ? "Em assinatura" : "Não enviado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{getUnidades(p).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{formatCurrencyFull(getTicketMedio(p))}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrencyFull(p.vgv_estimado || 0)}</TableCell>
                      <TableCell className="text-right font-semibold text-success">{formatCurrencyFull(p.receita_operacional || 0)}</TableCell>
                      <TableCell>
                        {p.data_habitese
                          ? format(new Date(p.data_habitese), "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum projeto neste mês.</p>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default EsteiraProjetos;
