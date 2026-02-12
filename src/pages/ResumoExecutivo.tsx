import { useState, useRef, useEffect } from "react";
import {
  FileText,
  TrendingUp,
  Target,
  Users,
  Building2,
  Calendar,
  Handshake,
  Loader2,
  Download,
  Sparkles,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  Briefcase,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExecutiveSummary } from "@/hooks/useExecutiveSummary";
import { cn } from "@/lib/utils";

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

const etapaLabels: Record<string, string> = {
  proposta_aprovada: "Proposta Aprovada",
  proposta_enviada: "Proposta Enviada",
  em_negociacao: "Em Negociação",
  proposta_ganha: "Proposta Ganha",
  proposta_cancelada: "Cancelada",
};

const statusLabels: Record<string, string> = {
  novo: "Novo",
  qualificado: "Qualificado",
  proposta: "Proposta",
  ganho: "Ganho",
  perdido: "Perdido",
};

export default function ResumoExecutivo() {
  const data = useExecutiveSummary();
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(data.headNote);
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync note text when data loads
  useEffect(() => {
    if (!editingNote && data.headNote) {
      setNoteText(data.headNote);
    }
  }, [data.headNote, editingNote]);

  const [movimentacoesOpen, setMovimentacoesOpen] = useState(true);
  const [compromissosOpen, setCompromissosOpen] = useState(true);

  const handleSaveNote = async () => {
    await data.saveHeadNote(noteText);
    setEditingNote(false);
  };

  const handleExportPdf = () => {
    window.print();
  };

  if (data.loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto" ref={reportRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#115644]">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Resumo Executivo
              </h1>
              <p className="text-muted-foreground text-sm">
                Relatório consolidado de performance comercial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={data.generateAiSummary}
              disabled={data.aiLoading}
              className="gap-2"
            >
              {data.aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar Insights
            </Button>
            <Button onClick={handleExportPdf} className="gap-2 bg-[#115644] hover:bg-[#115644]/90">
              <Download className="w-4 h-4" />
              Gerar PDF Executivo
            </Button>
          </div>
        </div>

        {/* 1. Cabeçalho Institucional */}
        <Card className="border-[#115644]/20">
          <CardContent className="pt-6 pb-6">
            <div className="text-center mb-4">
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Resumo Executivo Comercial — Semana {data.semanaAno}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
                Relatório consolidado de performance comercial com base nos dados de Dashboard,
                Prospects, Contatos Ativos e Esteira de Projetos.
              </p>
            </div>
            <Separator className="my-4" />
            {data.aiSections?.resumoGeral ? (
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                {data.aiSections.resumoGeral}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* 2. Diagnóstico Consolidado */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#115644]" />
            <h3 className="font-display text-lg font-semibold">Diagnóstico Consolidado</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="Receita Operacional"
              value={formatCurrency(data.receitaOperacional)}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <MetricCard
              label="VGV Acumulado"
              value={formatCurrency(data.totalVgvProjetos)}
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <MetricCard
              label="Meta Anual VGV"
              value={formatCurrency(data.META_VGV)}
              icon={<Target className="w-4 h-4" />}
            />
            <MetricCard
              label="% Atingimento"
              value={`${data.vgvPercent.toFixed(1)}%`}
              icon={<TrendingUp className="w-4 h-4" />}
              highlight={data.vgvPercent >= 70}
            />
            <MetricCard
              label="Unidades Contratadas"
              value={data.totalUnidadesProjetos.toLocaleString("pt-BR")}
              icon={<Building2 className="w-4 h-4" />}
            />
            <MetricCard
              label="Projetos Aprovados"
              value={String(data.totalProjetos)}
              icon={<Briefcase className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* 3. Pulso Comercial */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#FF774A]" />
            <h3 className="font-display text-lg font-semibold">Pulso Comercial</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="Prospects na Base"
              value={String(data.totalProspects)}
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              label="Novos Prospects (7d)"
              value={String(data.novosProspects)}
              icon={<ArrowUpRight className="w-4 h-4" />}
            />
            <MetricCard
              label="Contatos Ativos"
              value={String(data.totalContatos)}
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              label="Reuniões Agendadas"
              value={String(data.reunioesAgendadas)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <MetricCard
              label="Reuniões Realizadas"
              value={String(data.reunioesRealizadas)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <MetricCard
              label="Contratos Fechados"
              value={String(data.contratosFechados)}
              icon={<Handshake className="w-4 h-4" />}
              highlight={data.contratosFechados > 0}
            />
          </div>
          {data.aiSections?.pulsoComercial && (
            <Card className="mt-3 bg-muted/30 border-0">
              <CardContent className="py-3">
                <p className="text-sm leading-relaxed text-foreground/80 italic">
                  {data.aiSections.pulsoComercial}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 4. Esteira de Projetos */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#115644]" />
            <h3 className="font-display text-lg font-semibold">Esteira de Projetos</h3>
          </div>
          {data.esteiraData.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">VGV Potencial</TableHead>
                      <TableHead className="text-right">Prob.</TableHead>
                      <TableHead>Próxima Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.esteiraData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.projeto}</TableCell>
                        <TableCell>{row.empresa}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {etapaLabels[row.etapa] || row.etapa}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrencyFull(row.vgv)}
                        </TableCell>
                        <TableCell className="text-right">{row.probabilidade}%</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.proximaAcao}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma negociação ativa no momento.
              </CardContent>
            </Card>
          )}
          {data.aiSections?.esteiraProjetos && (
            <Card className="mt-3 bg-muted/30 border-0">
              <CardContent className="py-3">
                <p className="text-sm leading-relaxed text-foreground/80 italic">
                  {data.aiSections.esteiraProjetos}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 5. Movimentações e Próximos Compromissos */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-[#FF774A]" />
            <h3 className="font-display text-lg font-semibold">Contas Estratégicas da Semana</h3>
          </div>

          {/* Movimentações da Semana */}
          <Card className="mb-3">
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setMovimentacoesOpen(!movimentacoesOpen)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#115644]" />
                  Movimentações da Semana
                  <Badge variant="secondary" className="text-xs ml-1">{data.reunioesSemana.length}</Badge>
                </CardTitle>
                {movimentacoesOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {movimentacoesOpen && (
              <CardContent className="p-0 pt-0">
                {data.reunioesSemana.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Consultor</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.reunioesSemana.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.empresa}</TableCell>
                          <TableCell className="text-sm">{row.contato}</TableCell>
                          <TableCell className="text-sm">{row.consultor}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.data.toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    Nenhuma reunião realizada nesta semana.
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Próximos Compromissos */}
          <Card>
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setCompromissosOpen(!compromissosOpen)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF774A]" />
                  Próximos Compromissos
                  <Badge variant="secondary" className="text-xs ml-1">{data.reunioesProximaSemana.length}</Badge>
                </CardTitle>
                {compromissosOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {compromissosOpen && (
              <CardContent className="p-0 pt-0">
                {data.reunioesProximaSemana.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Consultor</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.reunioesProximaSemana.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.empresa}</TableCell>
                          <TableCell className="text-sm">{row.contato}</TableCell>
                          <TableCell className="text-sm">{row.consultor}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.data.toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    Nenhuma reunião agendada para a próxima semana.
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {data.aiSections?.contasEstrategicas && (
            <Card className="mt-3 bg-muted/30 border-0">
              <CardContent className="py-3">
                <p className="text-sm leading-relaxed text-foreground/80 italic">
                  {data.aiSections.contasEstrategicas}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 6. Leitura do Head Comercial */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#115644]" />
              <h3 className="font-display text-lg font-semibold">
                Leitura Estratégica
              </h3>
            </div>
            {!editingNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNoteText(data.headNote);
                  setEditingNote(true);
                }}
              >
                Editar
              </Button>
            )}
          </div>
          <Card className="border-[#115644]/20">
            <CardContent className="pt-6">
              {editingNote ? (
                <div className="space-y-3">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Insira aqui a leitura estratégica semanal..."
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNote(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={data.savingNote}
                      className="gap-2 bg-[#115644] hover:bg-[#115644]/90"
                    >
                      {data.savingNote ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : data.headNote ? (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {data.headNote}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Nenhuma leitura registrada para esta semana. Clique em "Editar" para adicionar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, header, button, .sidebar, [data-sidebar] {
            display: none !important;
          }
          .max-w-5xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}

// Compact metric card component
function MetricCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("transition-all", highlight && "border-[#115644]/30 bg-[#115644]/5")}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
          {icon}
          <span className="text-[10px] uppercase tracking-wider font-medium truncate">
            {label}
          </span>
        </div>
        <p className="text-lg font-bold font-display">{value}</p>
      </CardContent>
    </Card>
  );
}
