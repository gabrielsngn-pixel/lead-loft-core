import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useEmpreendimentos } from "@/hooks/useEmpreendimentos";
import { useAuth } from "@/hooks/useAuth";
import { ImportEmpreendimentosDialog } from "@/components/empreendimentos/ImportEmpreendimentosDialog";
import { CreateEmpreendimentoDialog } from "@/components/empreendimentos/CreateEmpreendimentoDialog";
import { EmpreendimentoDetailDialog } from "@/components/empreendimentos/EmpreendimentoDetailDialog";
import type { Empreendimento } from "@/types/empreendimentos";
import {
  statusEmpreendimentoLabels,
  statusEmpreendimentoColors,
  tipoEmpreendimentoLabels,
  type EmpreendimentoStatus,
  type TipoEmpreendimento,
} from "@/types/empreendimentos";

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

  // Calendar view by month/year
  const byMonth = useMemo(() => {
    const groups: Record<string, Empreendimento[]> = {};
    filtered
      .filter((e) => e.mes_ano_habitese)
      .forEach((e) => {
        const key = e.mes_ano_habitese!;
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
      });
    return Object.entries(groups).sort(([a], [b]) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
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
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="calendario">Calendário de Entregas</TabsTrigger>
            <TabsTrigger value="importacoes">Histórico de Importações</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
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
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Construtora</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Habite-se</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>VGV</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((emp) => (
                      <TableRow
                        key={emp.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedEmp(emp)}
                      >
                        <TableCell className="font-medium">{emp.nome_empreendimento}</TableCell>
                        <TableCell>{emp.construtora}</TableCell>
                        <TableCell>{emp.cidade}/{emp.estado}</TableCell>
                        <TableCell>{emp.mes_ano_habitese || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {tipoEmpreendimentoLabels[emp.tipo_empreendimento as TipoEmpreendimento] || emp.tipo_empreendimento}
                        </TableCell>
                        <TableCell>{emp.vgv_estimado ? formatCurrency(emp.vgv_estimado) : "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusEmpreendimentoColors[emp.status as EmpreendimentoStatus]}>
                            {statusEmpreendimentoLabels[emp.status as EmpreendimentoStatus]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendario" className="space-y-4">
            {byMonth.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum empreendimento com data de Habite-se definida.</p>
              </div>
            ) : (
              byMonth.map(([monthYear, emps]) => (
                <Card key={monthYear}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {monthYear} — {emps.length} empreendimento{emps.length > 1 ? "s" : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      {emps.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedEmp(emp)}
                        >
                          <div>
                            <span className="font-medium text-sm">{emp.nome_empreendimento}</span>
                            <span className="text-muted-foreground text-xs ml-2">
                              {emp.construtora} — {emp.cidade}/{emp.estado}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {emp.vgv_estimado && (
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(emp.vgv_estimado)}
                              </span>
                            )}
                            <Badge className={`text-xs ${statusEmpreendimentoColors[emp.status as EmpreendimentoStatus]}`}>
                              {statusEmpreendimentoLabels[emp.status as EmpreendimentoStatus]}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
