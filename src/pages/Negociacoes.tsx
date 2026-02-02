import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useLeads } from "@/hooks/useLeads";
import { Negotiation, NegotiationStage } from "@/types/crm";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Building2,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Download,
  Trash2,
  Loader2,
  TrendingUp,
  Percent,
  Home,
  Calculator,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const stageConfig: Record<NegotiationStage, { label: string; color: string; bgColor: string }> = {
  proposta_aprovada: { label: "Proposta Aprovada", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  proposta_enviada: { label: "Proposta Enviada", color: "text-primary", bgColor: "bg-primary/5 border-primary/20" },
  em_negociacao: { label: "Em Negociação", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  proposta_ganha: { label: "Proposta Ganha", color: "text-success", bgColor: "bg-success/5 border-success/20" },
  proposta_cancelada: { label: "Proposta Cancelada", color: "text-destructive", bgColor: "bg-destructive/5 border-destructive/20" },
};

const stages: NegotiationStage[] = ["proposta_aprovada", "proposta_enviada", "em_negociacao", "proposta_ganha", "proposta_cancelada"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

const Negociacoes = () => {
  const { toast } = useToast();
  const { leads } = useLeads();
  const { negotiations, loading, createNegotiation, deleteNegotiation, updateNegotiation } = useNegotiations();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [negotiationToDelete, setNegotiationToDelete] = useState<Negotiation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newNegData, setNewNegData] = useState({
    leadId: "",
    titulo: "",
    valor: "",
    etapa: "proposta_aprovada" as NegotiationStage,
    probabilidade: "20",
  });

  const getNegotiationsByStage = (stage: NegotiationStage) => negotiations.filter((n) => n.etapa === stage);

  const getTotalByStage = (stage: NegotiationStage) =>
    getNegotiationsByStage(stage).reduce((sum, n) => sum + n.valor, 0);

  const handleExport = () => {
    const csvContent = [
      ["Empresa", "Título", "Valor", "Etapa", "Probabilidade", "Previsão Fechamento", "CNPJ", "Margem", "VGV", "Unidades"],
      ...negotiations.map((n) => [
        n.lead.nomeFantasia || n.lead.razaoSocial,
        n.titulo,
        n.valor.toString(),
        stageConfig[n.etapa].label,
        `${n.probabilidade}%`,
        n.dataPrevisaoFechamento ? format(n.dataPrevisaoFechamento, "dd/MM/yyyy") : "",
        n.lead.cnpj,
        n.margemEstimada ? formatPercent(n.margemEstimada) : "",
        n.vgvTotal ? formatCurrency(n.vgvTotal) : "",
        n.unidades?.toString() || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negociacoes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const handleDeleteClick = (negotiation: Negotiation) => {
    setNegotiationToDelete(negotiation);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (negotiation: Negotiation) => {
    setSelectedNegotiation(negotiation);
    setDetailsDialogOpen(true);
  };

  const handleMoveStage = async (negotiation: Negotiation, newStage: NegotiationStage) => {
    try {
      await updateNegotiation({ ...negotiation, etapa: newStage });
      toast({ title: "Etapa atualizada", description: `Movido para ${stageConfig[newStage].label}` });
    } catch {
      toast({ title: "Erro ao mover negociação", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!negotiationToDelete) return;
    try {
      await deleteNegotiation(negotiationToDelete.id);
      toast({ title: "Negociação excluída", description: `${negotiationToDelete.titulo} foi removida.` });
    } catch {
      toast({ title: "Erro ao excluir negociação", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setNegotiationToDelete(null);
    }
  };

  const handleCreateNegotiation = async () => {
    if (!newNegData.leadId || !newNegData.titulo || !newNegData.valor) {
      toast({ title: "Campos obrigatórios", description: "Preencha Lead, Título e Valor.", variant: "destructive" });
      return;
    }

    try {
      await createNegotiation({
        leadId: newNegData.leadId,
        titulo: newNegData.titulo,
        valor: parseFloat(newNegData.valor.replace(/\D/g, "")) / 100 || 0,
        etapa: newNegData.etapa,
        probabilidade: parseInt(newNegData.probabilidade, 10) || 20,
      });
      toast({ title: "Negociação criada" });
      setCreateDialogOpen(false);
      setNewNegData({ leadId: "", titulo: "", valor: "", etapa: "proposta_aprovada", probabilidade: "20" });
    } catch {
      toast({ title: "Erro ao criar negociação", variant: "destructive" });
    }
  };

  // Leads with responsibility (contacts)
  const eligibleLeads = leads.filter((l) => l.responsavelId);

  return (
    <AppLayout title="Negociações" subtitle="Acompanhe o funil de vendas">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="text-base px-4 py-2">
            {negotiations.length} negociações ativas
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            Total: {formatCurrency(negotiations.reduce((sum, n) => sum + n.valor, 0))}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Negociação
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stage, stageIndex) => (
            <div key={stage} className="kanban-column min-w-[260px] animate-fade-in" style={{ animationDelay: `${stageIndex * 100}ms` }}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn("w-3 h-3 rounded-full", {
                      "bg-blue-500": stage === "proposta_aprovada",
                      "bg-primary": stage === "proposta_enviada",
                      "bg-warning": stage === "em_negociacao",
                      "bg-success": stage === "proposta_ganha",
                      "bg-destructive": stage === "proposta_cancelada",
                    })}
                  />
                  <h3 className="font-semibold text-foreground text-sm">{stageConfig[stage].label}</h3>
                  <Badge variant="secondary" className="ml-1 text-xs">{getNegotiationsByStage(stage).length}</Badge>
                </div>
              </div>

              {/* Stage Total */}
              <div className={cn("rounded-lg p-3 mb-4 border", stageConfig[stage].bgColor)}>
                <p className="text-xs text-muted-foreground">Total na etapa</p>
                <p className={cn("text-base font-bold", stageConfig[stage].color)}>{formatCurrency(getTotalByStage(stage))}</p>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {getNegotiationsByStage(stage).map((negotiation, cardIndex) => (
                  <div key={negotiation.id} className="kanban-card animate-fade-in" style={{ animationDelay: `${stageIndex * 100 + cardIndex * 50}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                          <Building2 className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{negotiation.lead.nomeFantasia || negotiation.lead.razaoSocial}</p>
                          <p className="text-xs text-muted-foreground">{negotiation.lead.cidade}/{negotiation.lead.estado}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(negotiation)}>Ver detalhes</DropdownMenuItem>
                          {stages.filter(s => s !== stage).map(s => (
                            <DropdownMenuItem key={s} onClick={() => handleMoveStage(negotiation, s)}>
                              Mover para {stageConfig[s].label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(negotiation)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir negociação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm font-medium text-foreground mb-3">{negotiation.titulo}</p>

                    {/* Indicadores principais */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-3 h-3" />
                          <span>Valor</span>
                        </div>
                        <span className="font-semibold text-foreground">{formatCurrency(negotiation.valor)}</span>
                      </div>
                      
                      {negotiation.margemEstimada !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="w-3 h-3" />
                            <span>Margem</span>
                          </div>
                          <Badge variant="outline" className={cn("text-xs", {
                            "border-success text-success": negotiation.margemEstimada >= 0.004,
                            "border-warning text-warning-foreground": negotiation.margemEstimada >= 0.003 && negotiation.margemEstimada < 0.004,
                            "border-destructive text-destructive": negotiation.margemEstimada < 0.003,
                          })}>
                            {formatPercent(negotiation.margemEstimada)}
                          </Badge>
                        </div>
                      )}
                      
                      {negotiation.unidades && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Home className="w-3 h-3" />
                            <span>Unidades</span>
                          </div>
                          <span className="font-medium">{negotiation.unidades}</span>
                        </div>
                      )}

                      {negotiation.vgvTotal && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calculator className="w-3 h-3" />
                            <span>VGV</span>
                          </div>
                          <span className="font-medium">{formatCurrency(negotiation.vgvTotal)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">{negotiation.probabilidade}%</Badge>
                      {negotiation.dataPrevisaoFechamento && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(negotiation.dataPrevisaoFechamento, "dd/MM", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {getNegotiationsByStage(stage).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nenhuma negociação</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Negociação</DialogTitle>
            <DialogDescription>Crie uma negociação vinculada a um contato ativo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contato (Lead) *</Label>
              <Select value={newNegData.leadId} onValueChange={(v) => setNewNegData((p) => ({ ...p, leadId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contato" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleLeads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.nomeFantasia || l.razaoSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={newNegData.titulo} onChange={(e) => setNewNegData((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: Pacote de integração" />
            </div>

            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                value={newNegData.valor}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/\D/g, "");
                  const formatted = (Number(numeric) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                  setNewNegData((p) => ({ ...p, valor: formatted }));
                }}
                placeholder="0,00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={newNegData.etapa} onValueChange={(v) => setNewNegData((p) => ({ ...p, etapa: v as NegotiationStage }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s} value={s}>{stageConfig[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Probabilidade (%)</Label>
                <Input type="number" min={0} max={100} value={newNegData.probabilidade} onChange={(e) => setNewNegData((p) => ({ ...p, probabilidade: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateNegotiation}>Criar Negociação</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Negociação</DialogTitle>
            <DialogDescription>Indicadores do simulador de viabilidade</DialogDescription>
          </DialogHeader>

          {selectedNegotiation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-medium">{selectedNegotiation.lead.nomeFantasia || selectedNegotiation.lead.razaoSocial}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Título</p>
                  <p className="font-medium">{selectedNegotiation.titulo}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Indicadores do Simulador</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Margem</span>
                    <span className="font-medium">{selectedNegotiation.margemEstimada !== undefined ? formatPercent(selectedNegotiation.margemEstimada) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Comissão Inc.</span>
                    <span className="font-medium">{selectedNegotiation.comissaoIncorporador !== undefined ? formatPercent(selectedNegotiation.comissaoIncorporador) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Registro (valor)</span>
                    <span className="font-medium">{selectedNegotiation.registroValor !== undefined ? formatCurrency(selectedNegotiation.registroValor) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Receita Reg. % Loft</span>
                    <span className="font-medium">{selectedNegotiation.receitaRegistroLoftPercent !== undefined ? formatPercent(selectedNegotiation.receitaRegistroLoftPercent) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Desp. Operacionais</span>
                    <span className="font-medium">{selectedNegotiation.despesasOperacionais !== undefined ? formatCurrency(selectedNegotiation.despesasOperacionais) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Unidades</span>
                    <span className="font-medium">{selectedNegotiation.unidades ?? "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">Ticket Médio</span>
                    <span className="font-medium">{selectedNegotiation.ticketMedio !== undefined ? formatCurrency(selectedNegotiation.ticketMedio) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">VGV Total</span>
                    <span className="font-medium">{selectedNegotiation.vgvTotal !== undefined ? formatCurrency(selectedNegotiation.vgvTotal) : "—"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded col-span-2">
                    <span className="text-muted-foreground">Comissão Bancária Ponderada</span>
                    <span className="font-medium">{selectedNegotiation.comissaoBancariaPonderada !== undefined ? formatPercent(selectedNegotiation.comissaoBancariaPonderada) : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a negociação <strong>{negotiationToDelete?.titulo}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Negociacoes;
