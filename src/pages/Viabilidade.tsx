import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calculator,
  Plus,
  Search,
  Play,
  Clock,
  Loader2,
  Building2,
  MapPin,
  FileText,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  calcularViabilidade,
  defaultInputs,
  formatCurrency,
  formatPercent,
  validarMixBancario,
  validarSubMixCaixa,
  type SimuladorInputs,
  type RegistroTipo,
} from "@/lib/simulador";
import {
  SimuladorHeader,
  EstruturaProjeto,
  BankMixCard,
  ComissaoRegistro,
  ResultadosSidebar,
} from "@/components/simulador";
import { ContratoLoftDialog } from "@/components/contrato/ContratoLoft";

const Viabilidade = () => {
  const { toast } = useToast();
  const { profile, user, isMaster } = useAuth();
  const [viabilidades, setViabilidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"lista" | "simulador">("lista");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contratoDialogOpen, setContratoDialogOpen] = useState(false);

  // Viabilidade selecionada para simulação
  const [selectedViabilidade, setSelectedViabilidade] = useState<any | null>(null);

  // Simulador inputs
  const [inputs, setInputs] = useState<SimuladorInputs>(defaultInputs);

  // Form para nova viabilidade
  const [formData, setFormData] = useState({
    nome_empreendimento: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    observacoes: "",
  });

  // Resultados calculados em tempo real
  const results = useMemo(() => calcularViabilidade(inputs), [inputs]);
  const ticketMedio = inputs.unidades > 0 ? inputs.vgv / inputs.unidades : 0;
  const isValidMix = validarMixBancario(inputs.bankMix) && 
    (inputs.bankMix.caixa === 0 || validarSubMixCaixa(inputs.caixaSubMix));

  // Fetch viabilidades on mount
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

  const handleCreate = async () => {
    if (!user || !profile) return;
    if (!formData.nome_empreendimento.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o nome do empreendimento.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.from("viabilidades").insert({
        nome_empreendimento: formData.nome_empreendimento,
        cnpj: formData.cnpj || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        observacoes: formData.observacoes || null,
        solicitado_por: user.id,
        solicitado_por_nome: profile.nome,
        status: "pendente",
      });

      if (error) throw error;

      toast({
        title: "Viabilidade criada!",
        description: "Agora você pode simular a viabilidade do projeto.",
      });

      setCreateDialogOpen(false);
      setFormData({
        nome_empreendimento: "",
        cnpj: "",
        endereco: "",
        cidade: "",
        estado: "",
        observacoes: "",
      });
      fetchViabilidades();
    } catch (error) {
      console.error("Error creating viabilidade:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a viabilidade.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenSimulador = (viabilidade: any) => {
    setSelectedViabilidade(viabilidade);
    setInputs(defaultInputs);
    setActiveTab("simulador");
  };

  const handleSaveSimulation = async () => {
    if (!selectedViabilidade || !user) return;
    if (!isValidMix) {
      toast({
        title: "Mix inválido",
        description: "Corrija o mix bancário antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("viabilidades")
        .update({
          vgv_estimado: inputs.vgv,
          margem_estimada: results.margemFinalPercent,
          resultado: results.status === "viable" ? "viavel" : results.status === "limit" ? "condicional" : "inviavel",
          recomendacao: results.status === "viable" ? "simples" : results.status === "limit" ? "media" : "nao",
          status: "em_analise",
          analisado_por: user.id,
          analisado_por_nome: profile?.nome,
          data_analise: new Date().toISOString(),
        })
        .eq("id", selectedViabilidade.id);

      if (error) throw error;

      toast({
        title: "Simulação salva!",
        description: `Margem de ${formatPercent(results.margemFinalPercent)} registrada.`,
      });

      fetchViabilidades();
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

  const handleAprovarSimulacao = () => {
    if (!isValidMix) {
      toast({
        title: "Mix inválido",
        description: "Corrija o mix bancário antes de aprovar.",
        variant: "destructive",
      });
      return;
    }
    setContratoDialogOpen(true);
  };

  const handleContratoGerado = async (contrato: any) => {
    // Atualizar status da viabilidade para "aprovado" quando contrato é gerado
    if (selectedViabilidade) {
      try {
        await supabase
          .from("viabilidades")
          .update({
            status: "aprovado",
            resultado: results.status === "viable" ? "viavel" : "condicional",
          })
          .eq("id", selectedViabilidade.id);
        
        fetchViabilidades();
        toast({
          title: "Contrato gerado!",
          description: `Contrato ${contrato.numeroContrato} foi gerado com sucesso.`,
        });
      } catch (error) {
        console.error("Error updating viabilidade:", error);
      }
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

  const stats = {
    total: viabilidades.length,
    pendentes: viabilidades.filter((v) => v.status === "pendente").length,
    aprovadas: viabilidades.filter((v) => v.resultado === "viavel").length,
  };

  return (
    <AppLayout
      title="Viabilidade"
      subtitle="Simulador de viabilidade Loft Incorporações"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="lista" className="gap-2">
              <FileText className="w-4 h-4" />
              Projetos
            </TabsTrigger>
            <TabsTrigger value="simulador" className="gap-2">
              <Calculator className="w-4 h-4" />
              Simulador
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "lista" && (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          )}
        </div>

        {/* Lista de Projetos */}
        <TabsContent value="lista" className="space-y-6 mt-0">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total de Projetos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <Clock className="w-5 h-5 text-warning-foreground" />
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
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.aprovadas}</p>
                    <p className="text-sm text-muted-foreground">Viáveis</p>
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
                  <TableHead className="font-semibold">Margem</TableHead>
                  <TableHead className="font-semibold">Comissão</TableHead>
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
                      <Badge variant="secondary">{viabilidade.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {viabilidade.margem_estimada !== null ? (
                        <span className={cn("font-medium", {
                          "text-success": viabilidade.resultado === "viavel",
                          "text-warning-foreground": viabilidade.resultado === "condicional",
                          "text-destructive": viabilidade.resultado === "inviavel",
                        })}>
                          {viabilidade.margem_estimada.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof (viabilidade as any).comissao_incorporador === "number" ? (
                        <span className="font-medium">
                          {(viabilidade as any).comissao_incorporador.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(viabilidade.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-primary hover:bg-primary/90"
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
                                <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O projeto será permanentemente removido.
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
                <p className="text-muted-foreground">Nenhum projeto encontrado</p>
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Criar novo projeto
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Simulador */}
        <TabsContent value="simulador" className="space-y-6 mt-0">
          {/* Header do Simulador */}
          <div className="bg-accent/30 rounded-2xl p-8 mb-6">
            <SimuladorHeader />
          </div>

          {/* Projeto selecionado */}
          {selectedViabilidade && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("lista")}
                      className="gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
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
                      onClick={() => setInputs(defaultInputs)}
                      className="gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resetar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSimulation}
                      disabled={saving || !isValidMix}
                      className="gap-1 bg-secondary hover:bg-secondary/90"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar Simulação
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layout 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda - Inputs */}
            <div className="space-y-4">
              <EstruturaProjeto
                unidades={inputs.unidades}
                vgv={inputs.vgv}
                onUnidadesChange={(v) => setInputs({ ...inputs, unidades: v })}
                onVgvChange={(v) => setInputs({ ...inputs, vgv: v })}
              />
              
              <BankMixCard
                bankMix={inputs.bankMix}
                caixaSubMix={inputs.caixaSubMix}
                onBankMixChange={(bankMix) => setInputs({ ...inputs, bankMix })}
                onCaixaSubMixChange={(caixaSubMix) => setInputs({ ...inputs, caixaSubMix })}
                ticketMedio={ticketMedio}
              />
              
              <ComissaoRegistro
                comissaoIncorporador={inputs.comissaoIncorporador}
                registroTipo={inputs.registroTipo}
                valorRegistroPorUnidade={inputs.valorRegistroPorUnidade}
                unidades={inputs.unidades}
                onComissaoChange={(v) => setInputs({ ...inputs, comissaoIncorporador: v })}
                onRegistroTipoChange={(v) => setInputs({ ...inputs, registroTipo: v })}
                onValorRegistroChange={(v) => setInputs({ ...inputs, valorRegistroPorUnidade: v })}
              />
            </div>

            {/* Coluna Direita - Resultados */}
            <div>
              <ResultadosSidebar 
                results={results} 
                registroTipo={inputs.registroTipo}
                vgv={inputs.vgv}
                canAprovar={isValidMix && selectedViabilidade !== null}
                onAprovar={handleAprovarSimulacao}
              />
            </div>
          </div>

          {!selectedViabilidade && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Calculator className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Selecione um projeto para simular ou use o simulador avulso.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("lista")}>
                  Ver Projetos
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>
              Cadastre um novo projeto de incorporação para análise de viabilidade
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Empreendimento *</Label>
              <Input
                placeholder="Ex: Residencial Vista Verde"
                value={formData.nome_empreendimento}
                onChange={(e) => setFormData({ ...formData, nome_empreendimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ da Incorporadora</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                placeholder="Rua, número, bairro"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="São Paulo"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={processing} className="bg-primary hover:bg-primary/90">
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contrato Loft Dialog */}
      <ContratoLoftDialog
        open={contratoDialogOpen}
        onOpenChange={setContratoDialogOpen}
        dadosProjeto={{
          vgv: inputs.vgv,
          unidades: inputs.unidades,
          ticketMedio: ticketMedio,
          comissaoIncorporador: inputs.comissaoIncorporador,
          valorRegistroPorUnidade: inputs.valorRegistroPorUnidade,
          registroTipo: inputs.registroTipo,
        }}
        dadosPreenchidos={selectedViabilidade ? {
          cnpj: selectedViabilidade.cnpj || "",
          endereco: selectedViabilidade.endereco || "",
          cidade: selectedViabilidade.cidade || "",
          estado: selectedViabilidade.estado || "",
        } : undefined}
        onContratoGerado={handleContratoGerado}
      />
    </AppLayout>
  );
};

export default Viabilidade;
