import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Plus,
  Search,
  TrendingUp,
  Calendar,
  FileCheck,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEmpreendimentos } from "@/hooks/useEmpreendimentos";
import { useAuth } from "@/hooks/useAuth";
import { ImportEmpreendimentosDialog } from "@/components/empreendimentos/ImportEmpreendimentosDialog";
import { CreateEmpreendimentoDialog } from "@/components/empreendimentos/CreateEmpreendimentoDialog";
import { EmpreendimentoDetailDialog } from "@/components/empreendimentos/EmpreendimentoDetailDialog";
import { EmpreendimentoCard } from "@/components/empreendimentos/EmpreendimentoCard";
import type { Empreendimento } from "@/types/empreendimentos";
import {
  statusEmpreendimentoLabels,
  statusEmpreendimentoColors,
  type EmpreendimentoStatus,
} from "@/types/empreendimentos";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Empreendimentos() {
  const {
    empreendimentos,
    isLoading,
    createEmpreendimento,
    updateEmpreendimento,
    deleteEmpreendimento,
    importEmpreendimentos,
    useDecisores,
    findDecisores,
    addDecisor,
    removeDecisor,
    importLogs,
  } = useEmpreendimentos();
  const { isGestor, isMaster } = useAuth();
  const canEdit = isGestor || false;
  const canDelete = isMaster || false;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Empreendimento | null>(null);

  const decisoresQuery = useDecisores(selectedEmp?.id ?? null);

  const filtered = useMemo(() => {
    return empreendimentos.filter((e) => {
      const matchesSearch =
        !searchTerm ||
        e.nome_empreendimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.construtora.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [empreendimentos, searchTerm, statusFilter]);

  // Executive metrics
  const totalEmpreendimentos = empreendimentos.length;
  const totalVGV = empreendimentos.reduce((sum, e) => sum + (e.vgv_estimado || 0), 0);
  const viabilidadeAprovada = empreendimentos.filter((e) => e.status === "viabilidade_aprovada").length;
  const contratoAssinado = empreendimentos.filter((e) => e.status === "contrato_assinado").length;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    empreendimentos.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [empreendimentos]);

  // Top 10 próximos habite-ses
  const top10Habiteses = useMemo(() => {
    const today = new Date();
    return empreendimentos
      .filter((e) => e.data_habitese && e.status !== "contrato_assinado" && e.status !== "perdido")
      .map((e) => ({
        ...e,
        diasRestantes: differenceInDays(parseISO(e.data_habitese!), today),
      }))
      .filter((e) => e.diasRestantes >= -30) // include up to 30 days overdue
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 10);
  }, [empreendimentos]);

  // Calendar grouped by year > month
  const calendarByYear = useMemo(() => {
    const groups: Record<string, Record<string, Empreendimento[]>> = {};
    filtered
      .filter((e) => e.mes_ano_habitese)
      .forEach((e) => {
        const [mesStr, anoStr] = e.mes_ano_habitese!.split("/");
        const ano = anoStr || "Sem Ano";
        const mes = mesStr || "0";
        if (!groups[ano]) groups[ano] = {};
        if (!groups[ano][mes]) groups[ano][mes] = [];
        groups[ano][mes].push(e);
      });
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, months]) => ({
        year,
        months: Object.entries(months)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([month, emps]) => ({
            month: Number(month),
            monthName: MONTH_NAMES[Number(month)] || month,
            emps,
          })),
      }));
  }, [filtered]);

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" />
              Empreendimentos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Radar de Hot Leads estratégicos (SPE) — {totalEmpreendimentos} mapeados
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <ImportEmpreendimentosDialog
                onImport={(records, fonte) => importEmpreendimentos.mutate({ records, fonte })}
                isLoading={importEmpreendimentos.isPending}
              />
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Novo
              </Button>
            </div>
          )}
        </div>

        {/* Executive cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEmpreendimentos}</p>
                  <p className="text-xs text-muted-foreground">Total Mapeados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalVGV)}</p>
                  <p className="text-xs text-muted-foreground">VGV Potencial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{viabilidadeAprovada}</p>
                  <p className="text-xs text-muted-foreground">Viabilidade Aprovada</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contratoAssinado}</p>
                  <p className="text-xs text-muted-foreground">Contrato Assinado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status breakdown */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge
              key={status}
              variant="secondary"
              className={`cursor-pointer ${statusEmpreendimentoColors[status as EmpreendimentoStatus] || ""}`}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            >
              {statusEmpreendimentoLabels[status as EmpreendimentoStatus] || status}: {count}
            </Badge>
          ))}
          {statusFilter !== "all" && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setStatusFilter("all")}>
              ✕ Limpar filtro
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lista">
          <TabsList>
            <TabsTrigger value="lista">Empreendimentos</TabsTrigger>
            <TabsTrigger value="calendario">Calendário de Entregas</TabsTrigger>
            <TabsTrigger value="importacoes">Histórico de Importações</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, construtora ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Top 10 próximos Habite-ses */}
            {top10Habiteses.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Top 10 — Próximos Habite-ses para Atuar
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {top10Habiteses.map((emp, idx) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-colors"
                        onClick={() => setSelectedEmp(emp)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                            emp.diasRestantes <= 0 ? "bg-destructive/10 text-destructive" :
                            emp.diasRestantes <= 30 ? "bg-orange-100 text-orange-700" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-medium text-sm line-clamp-1">{emp.nome_empreendimento}</span>
                            <span className="text-muted-foreground text-xs ml-0 block">
                              {emp.construtora} — {emp.cidade}/{emp.estado}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-medium">
                              {emp.mes_ano_habitese}
                            </p>
                            <p className={cn(
                              "text-[10px]",
                              emp.diasRestantes <= 0 ? "text-destructive font-semibold" :
                              emp.diasRestantes <= 30 ? "text-orange-600" :
                              "text-muted-foreground"
                            )}>
                              {emp.diasRestantes <= 0 
                                ? `${Math.abs(emp.diasRestantes)}d atrasado` 
                                : `em ${emp.diasRestantes}d`}
                            </p>
                          </div>
                          <Badge className={cn("text-[10px]", statusEmpreendimentoColors[emp.status as EmpreendimentoStatus])}>
                            {statusEmpreendimentoLabels[emp.status as EmpreendimentoStatus]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum empreendimento encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((emp) => (
                  <EmpreendimentoCard
                    key={emp.id}
                    empreendimento={emp}
                    onClick={setSelectedEmp}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendario" className="space-y-6">
            {calendarByYear.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum empreendimento com data de Habite-se definida.</p>
              </div>
            ) : (
              calendarByYear.map(({ year, months }) => (
                <div key={year} className="space-y-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                    <Calendar className="w-5 h-5 text-primary" />
                    {year}
                    <Badge variant="secondary" className="ml-2">
                      {months.reduce((sum, m) => sum + m.emps.length, 0)} empreendimentos
                    </Badge>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {months.map(({ month, monthName, emps }) => (
                      <Card key={month} className="overflow-hidden">
                        <CardHeader className="py-3 bg-muted/30">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{monthName}</span>
                            <Badge variant="outline" className="text-xs">
                              {emps.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y">
                            {emps.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                                onClick={() => setSelectedEmp(emp)}
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-sm line-clamp-1">{emp.nome_empreendimento}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {emp.construtora} — {emp.cidade}/{emp.estado}
                                  </p>
                                </div>
                                <Badge className={cn("text-[10px] flex-shrink-0 ml-2", statusEmpreendimentoColors[emp.status as EmpreendimentoStatus])}>
                                  {statusEmpreendimentoLabels[emp.status as EmpreendimentoStatus]}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="importacoes" className="space-y-4">
            {importLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma importação realizada ainda.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Importados</TableHead>
                      <TableHead>Ignorados</TableHead>
                      <TableHead>Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.data_importacao), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell className="capitalize">{log.fonte}</TableCell>
                        <TableCell>{log.total_registros}</TableCell>
                        <TableCell className="text-green-600 font-medium">{log.quantidade_importada}</TableCell>
                        <TableCell className="text-orange-600">{log.quantidade_ignorada}</TableCell>
                        <TableCell>{log.user_nome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateEmpreendimentoDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={(data) => createEmpreendimento.mutate(data)}
          isLoading={createEmpreendimento.isPending}
        />

        <EmpreendimentoDetailDialog
          empreendimento={selectedEmp}
          open={!!selectedEmp}
          onOpenChange={(open) => !open && setSelectedEmp(null)}
          decisores={decisoresQuery.data || []}
          isLoadingDecisores={decisoresQuery.isLoading}
          onUpdate={(data) => updateEmpreendimento.mutate(data)}
          onDelete={(id) => deleteEmpreendimento.mutate(id)}
          onAddDecisor={(d) => addDecisor.mutate(d)}
          onRemoveDecisor={(id) => removeDecisor.mutate(id)}
          onFindDecisores={findDecisores}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </AppLayout>
  );
}
