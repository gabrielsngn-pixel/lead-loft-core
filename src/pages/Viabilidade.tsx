import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calculator,
  Plus,
  Search,
  Play,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Percent,
  Save,
  RefreshCw,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  calcularViabilidade,
  defaultInputs,
  type ViabilidadeInputs,
  type ViabilidadeResults,
} from "@/lib/viabilidade";
import { SimuladorForm, ResultadosCard, NovaViabilidadeDialog } from "@/components/viabilidade";
import type { ViabilidadeStatus } from "@/types/crm";

const statusConfig: Record<ViabilidadeStatus, { label: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", icon: <Clock className="w-4 h-4" /> },
  em_analise: { label: "Em Análise", icon: <Calculator className="w-4 h-4" /> },
  aprovado: { label: "Aprovado", icon: <CheckCircle2 className="w-4 h-4" /> },
  reprovado: { label: "Reprovado", icon: <XCircle className="w-4 h-4" /> },
  revisao: { label: "Em Revisão", icon: <AlertCircle className="w-4 h-4" /> },
};

const getStatusStyles = (status: ViabilidadeStatus) => {
  switch (status) {
    case "pendente":
      return "bg-yellow-100 text-yellow-800";
    case "em_analise":
      return "bg-blue-100 text-blue-800";
    case "aprovado":
      return "bg-green-100 text-green-800";
    case "reprovado":
      return "bg-red-100 text-red-800";
    case "revisao":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const resultadoStyles: Record<string, string> = {
  viavel: "bg-green-100 text-green-800",
  inviavel: "bg-red-100 text-red-800",
  condicional: "bg-amber-100 text-amber-800",
};

const recomendacaoLabels: Record<string, string> = {
  simples: "Simples",
  media: "Média",
  nao: "Não Recomendado",
};

const resultadoLabels: Record<string, string> = {
  viavel: "Viável",
  inviavel: "Inviável",
  condicional: "Condicional",
};

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const Viabilidade = () => {
  const { toast } = useToast();
  const { profile, user, isMaster } = useAuth();
  const [viabilidades, setViabilidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"lista" | "simulador">("lista");
  
  // Simulador state
  const [selectedViabilidade, setSelectedViabilidade] = useState<any | null>(null);
  const [simuladorInputs, setSimuladorInputs] = useState<ViabilidadeInputs>(defaultInputs);
  const [saving, setSaving] = useState(false);

  // Resultados calculados em tempo real
  const results: ViabilidadeResults = useMemo(() => {
    return calcularViabilidade(simuladorInputs);
  }, [simuladorInputs]);

  useEffect(() => {
    fetchViabilidades();
  }, []);

  const fetchViabilidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("viabilidades")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setViabilidades(data || []);
    } catch (error) {
      console.error("Error fetching viabilidades:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as viabilidades.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSimulador = (viabilidade: any) => {
    setSelectedViabilidade(viabilidade);
    // Se já tiver dados salvos, carregar no simulador
    // Por enquanto usa valores padrão
    setSimuladorInputs(defaultInputs);
    setActiveTab("simulador");
  };

  const handleSaveSimulation = async () => {
    if (!selectedViabilidade || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("viabilidades")
        .update({
          vgv_estimado: results.vgv,
          custo_terreno: results.custoTerreno,
          custo_obra: results.custoObra,
          margem_estimada: results.margemLiquida,
          tir_estimada: results.tir,
          payback_meses: results.paybackMeses,
          resultado: results.resultado,
          recomendacao: results.recomendacao,
          status: "em_analise",
          analisado_por: user.id,
          analisado_por_nome: profile?.nome,
          data_analise: new Date().toISOString(),
        })
        .eq("id", selectedViabilidade.id);

      if (error) throw error;

      toast({
        title: "Simulação salva!",
        description: "Os resultados foram salvos no estudo de viabilidade.",
      });

      fetchViabilidades();
      setActiveTab("lista");
      setSelectedViabilidade(null);
    } catch (error) {
      console.error("Error saving simulation:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a simulação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (viabilidadeId: string, newStatus: ViabilidadeStatus) => {
    try {
      const { error } = await supabase
        .from("viabilidades")
        .update({ status: newStatus })
        .eq("id", viabilidadeId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `O status foi alterado para ${statusConfig[newStatus].label}.`,
      });

      fetchViabilidades();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (viabilidadeId: string) => {
    try {
      const { error } = await supabase
        .from("viabilidades")
        .delete()
        .eq("id", viabilidadeId);

      if (error) throw error;

      toast({
        title: "Viabilidade excluída",
        description: "O registro foi removido com sucesso.",
      });

      fetchViabilidades();
    } catch (error) {
      console.error("Error deleting viabilidade:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a viabilidade.",
        variant: "destructive",
      });
    }
  };

  const filteredViabilidades = viabilidades.filter((v) => {
    const matchesSearch =
      v.nome_empreendimento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: viabilidades.length,
    pendentes: viabilidades.filter((v) => v.status === "pendente").length,
    aprovadas: viabilidades.filter((v) => v.status === "aprovado").length,
    vgvTotal: viabilidades.reduce((acc, v) => acc + (v.vgv_estimado || 0), 0),
  };

  if (loading) {
    return (
      <AppLayout title="Viabilidade" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Viabilidade"
      subtitle="Simulador de viabilidade imobiliária nativo"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="lista" className="gap-2">
              <FileText className="w-4 h-4" />
              Estudos
            </TabsTrigger>
            <TabsTrigger value="simulador" className="gap-2">
              <Calculator className="w-4 h-4" />
              Simulador
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "lista" && (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Viabilidade
            </Button>
          )}
        </div>

        {/* Lista de Viabilidades */}
        <TabsContent value="lista" className="space-y-6 mt-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendentes}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.aprovadas}</p>
                    <p className="text-sm text-muted-foreground">Aprovadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.vgvTotal)}</p>
                    <p className="text-sm text-muted-foreground">VGV Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
                <SelectItem value="revisao">Em Revisão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Empreendimento</TableHead>
                  <TableHead className="font-semibold">Localização</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Resultado</TableHead>
                  <TableHead className="font-semibold">Margem</TableHead>
                  <TableHead className="font-semibold">VGV</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViabilidades.map((viabilidade) => (
                  <TableRow key={viabilidade.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{viabilidade.nome_empreendimento}</p>
                          <p className="text-sm text-muted-foreground">{viabilidade.cnpj || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {viabilidade.cidade && viabilidade.estado
                          ? `${viabilidade.cidade}, ${viabilidade.estado}`
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={viabilidade.status}
                        onValueChange={(v) => handleUpdateStatus(viabilidade.id, v as ViabilidadeStatus)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <Badge className={cn("gap-1", getStatusStyles(viabilidade.status as ViabilidadeStatus))}>
                            {statusConfig[viabilidade.status as ViabilidadeStatus]?.icon}
                            {statusConfig[viabilidade.status as ViabilidadeStatus]?.label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {viabilidade.resultado ? (
                        <Badge className={resultadoStyles[viabilidade.resultado]}>
                          {resultadoLabels[viabilidade.resultado]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {viabilidade.margem_estimada !== null ? (
                        <div className="flex items-center gap-1">
                          <Percent className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{viabilidade.margem_estimada}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span>{formatCurrency(viabilidade.vgv_estimado)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(viabilidade.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleOpenSimulador(viabilidade)}
                        >
                          <Play className="w-3 h-3" />
                          Simular
                        </Button>
                        {isMaster && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir viabilidade?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O estudo de viabilidade será permanentemente removido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(viabilidade.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredViabilidades.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhuma viabilidade encontrada</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Criar nova viabilidade
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Simulador */}
        <TabsContent value="simulador" className="space-y-6 mt-0">
          {selectedViabilidade && (
            <Card className="bg-muted/30">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedViabilidade.nome_empreendimento}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedViabilidade.cidade && selectedViabilidade.estado
                          ? `${selectedViabilidade.cidade}, ${selectedViabilidade.estado}`
                          : "Simulação em andamento"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSimuladorInputs(defaultInputs)}
                      className="gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resetar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSimulation}
                      disabled={saving}
                      className="gap-1"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar Resultados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Parâmetros da Simulação
                  </CardTitle>
                  <CardDescription>
                    Ajuste os valores e veja os resultados em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimuladorForm inputs={simuladorInputs} onChange={setSimuladorInputs} />
                </CardContent>
              </Card>
            </div>

            {/* Resultados */}
            <div>
              <ResultadosCard results={results} />
            </div>
          </div>

          {!selectedViabilidade && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Você está usando o simulador avulso. Para salvar os resultados, selecione um estudo existente.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("lista")}>
                  Ver Estudos Existentes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <NovaViabilidadeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchViabilidades}
      />
    </AppLayout>
  );
};

export default Viabilidade;
