import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calculator,
  Plus,
  Search,
  Filter,
  ExternalLink,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Viabilidade, ViabilidadeStatus } from "@/types/crm";

const statusConfig: Record<ViabilidadeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
  em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800", icon: <Calculator className="w-4 h-4" /> },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4" /> },
  reprovado: { label: "Reprovado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
  revisao: { label: "Em Revisão", color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="w-4 h-4" /> },
};

const resultadoConfig: Record<string, { label: string; color: string }> = {
  viavel: { label: "Viável", color: "bg-green-100 text-green-800" },
  inviavel: { label: "Inviável", color: "bg-red-100 text-red-800" },
  condicional: { label: "Condicional", color: "bg-amber-100 text-amber-800" },
};

const recomendacaoConfig: Record<string, { label: string; color: string }> = {
  simples: { label: "Simples", color: "bg-green-100 text-green-800" },
  media: { label: "Média", color: "bg-amber-100 text-amber-800" },
  nao: { label: "Não Recomendado", color: "bg-red-100 text-red-800" },
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedViabilidade, setSelectedViabilidade] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome_empreendimento: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    observacoes: "",
  });

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
        description: "A solicitação foi enviada para análise.",
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

  const handleOpenViabilityCompass = (viabilidade: any) => {
    // Abre o Viability Compass em nova aba
    // Pode ser configurado para passar parâmetros via URL
    const baseUrl = "https://viability-compass.lovable.app";
    const params = new URLSearchParams({
      cnpj: viabilidade.cnpj || "",
      nome: viabilidade.nome_empreendimento || "",
    });
    window.open(`${baseUrl}?${params.toString()}`, "_blank");
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
      subtitle="Módulo integrado ao Viability Compass"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4 flex-1">
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
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Viabilidade
        </Button>
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
                  <Badge className={`gap-1 ${statusConfig[viabilidade.status as ViabilidadeStatus]?.color}`}>
                    {statusConfig[viabilidade.status as ViabilidadeStatus]?.icon}
                    {statusConfig[viabilidade.status as ViabilidadeStatus]?.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {viabilidade.resultado ? (
                    <Badge className={resultadoConfig[viabilidade.resultado]?.color}>
                      {resultadoConfig[viabilidade.resultado]?.label}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {viabilidade.margem_estimada !== null ? (
                    <div className="flex items-center gap-1">
                      <Percent className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium">{viabilidade.margem_estimada}%</span>
                    </div>
                  ) : (
                    "—"
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
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setSelectedViabilidade(viabilidade);
                        setViewDialogOpen(true);
                      }}
                    >
                      <FileText className="w-3 h-3" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleOpenViabilityCompass(viabilidade)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Compass
                    </Button>
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
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Viabilidade</DialogTitle>
            <DialogDescription>
              Cadastre um novo estudo de viabilidade para análise no Viability Compass
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
              <Label>CNPJ</Label>
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
                placeholder="Informações adicionais sobre o empreendimento..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Viabilidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedViabilidade?.nome_empreendimento}</DialogTitle>
            <DialogDescription>
              Detalhes do estudo de viabilidade
            </DialogDescription>
          </DialogHeader>

          {selectedViabilidade && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={`gap-1 ${statusConfig[selectedViabilidade.status as ViabilidadeStatus]?.color}`}>
                      {statusConfig[selectedViabilidade.status as ViabilidadeStatus]?.icon}
                      {statusConfig[selectedViabilidade.status as ViabilidadeStatus]?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Resultado</Label>
                  <div className="mt-1">
                    {selectedViabilidade.resultado ? (
                      <Badge className={resultadoConfig[selectedViabilidade.resultado]?.color}>
                        {resultadoConfig[selectedViabilidade.resultado]?.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Aguardando análise</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">CNPJ</Label>
                  <p className="font-medium">{selectedViabilidade.cnpj || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Localização</Label>
                  <p className="font-medium">
                    {selectedViabilidade.cidade && selectedViabilidade.estado
                      ? `${selectedViabilidade.cidade}, ${selectedViabilidade.estado}`
                      : "—"}
                  </p>
                </div>
              </div>

              {selectedViabilidade.endereco && (
                <div>
                  <Label className="text-muted-foreground">Endereço</Label>
                  <p className="font-medium">{selectedViabilidade.endereco}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {selectedViabilidade.margem_estimada !== null
                      ? `${selectedViabilidade.margem_estimada}%`
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Margem</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedViabilidade.vgv_estimado)}
                  </p>
                  <p className="text-sm text-muted-foreground">VGV Estimado</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {selectedViabilidade.tir_estimada !== null
                      ? `${selectedViabilidade.tir_estimada}%`
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">TIR</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Custo do Terreno</Label>
                  <p className="font-medium">{formatCurrency(selectedViabilidade.custo_terreno)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Custo da Obra</Label>
                  <p className="font-medium">{formatCurrency(selectedViabilidade.custo_obra)}</p>
                </div>
              </div>

              {selectedViabilidade.recomendacao && (
                <div>
                  <Label className="text-muted-foreground">Recomendação</Label>
                  <div className="mt-1">
                    <Badge className={recomendacaoConfig[selectedViabilidade.recomendacao]?.color}>
                      {recomendacaoConfig[selectedViabilidade.recomendacao]?.label}
                    </Badge>
                  </div>
                </div>
              )}

              {selectedViabilidade.observacoes && (
                <div>
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="font-medium">{selectedViabilidade.observacoes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Solicitado por</Label>
                  <p className="font-medium">{selectedViabilidade.solicitado_por_nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data da Solicitação</Label>
                  <p className="font-medium">
                    {format(new Date(selectedViabilidade.data_solicitacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => handleOpenViabilityCompass(selectedViabilidade)} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir no Viability Compass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Viabilidade;
