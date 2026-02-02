import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockNegotiations } from "@/data/mockData";
import { Negotiation } from "@/types/crm";
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

type NegotiationStage = "qualificacao" | "proposta" | "negociacao" | "fechamento";

const stageConfig: Record<NegotiationStage, { label: string; color: string; bgColor: string }> = {
  qualificacao: { label: "Qualificação", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  proposta: { label: "Proposta", color: "text-primary", bgColor: "bg-primary/5 border-primary/20" },
  negociacao: { label: "Negociação", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  fechamento: { label: "Fechamento", color: "text-success", bgColor: "bg-success/5 border-success/20" },
};

const Negociacoes = () => {
  const { toast } = useToast();
  const [negotiations, setNegotiations] = useState<Negotiation[]>(mockNegotiations);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [negotiationToDelete, setNegotiationToDelete] = useState<Negotiation | null>(null);

  const stages: NegotiationStage[] = ["qualificacao", "proposta", "negociacao", "fechamento"];

  const getNegotiationsByStage = (stage: NegotiationStage) => {
    return negotiations.filter((n) => n.etapa === stage);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTotalByStage = (stage: NegotiationStage) => {
    return getNegotiationsByStage(stage).reduce((sum, n) => sum + n.valor, 0);
  };

  const handleExport = () => {
    const csvContent = [
      ["Empresa", "Título", "Valor", "Etapa", "Probabilidade", "Previsão Fechamento", "CNPJ", "Viabilidade"],
      ...negotiations.map(n => [
        n.lead.nomeFantasia || n.lead.razaoSocial,
        n.titulo,
        n.valor.toString(),
        stageConfig[n.etapa].label,
        `${n.probabilidade}%`,
        n.dataPrevisaoFechamento ? format(n.dataPrevisaoFechamento, "dd/MM/yyyy") : "",
        n.lead.cnpj,
        n.lead.viabilidade?.status || "pendente",
      ])
    ].map(row => row.join(",")).join("\n");

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

  const handleConfirmDelete = () => {
    if (!negotiationToDelete) return;
    setNegotiations((prev) => prev.filter((n) => n.id !== negotiationToDelete.id));
    toast({
      title: "Negociação excluída",
      description: `${negotiationToDelete.titulo} foi removida.`,
    });
    setDeleteDialogOpen(false);
    setNegotiationToDelete(null);
  };

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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Negociação
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {stages.map((stage, stageIndex) => (
          <div
            key={stage}
            className="kanban-column min-w-[300px] animate-fade-in"
            style={{ animationDelay: `${stageIndex * 100}ms` }}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", {
                  "bg-blue-500": stage === "qualificacao",
                  "bg-primary": stage === "proposta",
                  "bg-amber-500": stage === "negociacao",
                  "bg-success": stage === "fechamento",
                })} />
                <h3 className="font-semibold text-foreground">
                  {stageConfig[stage].label}
                </h3>
                <Badge variant="secondary" className="ml-1">
                  {getNegotiationsByStage(stage).length}
                </Badge>
              </div>
            </div>

            {/* Stage Total */}
            <div className={cn(
              "rounded-lg p-3 mb-4 border",
              stageConfig[stage].bgColor
            )}>
              <p className="text-sm text-muted-foreground">Total na etapa</p>
              <p className={cn("text-lg font-bold", stageConfig[stage].color)}>
                {formatCurrency(getTotalByStage(stage))}
              </p>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {getNegotiationsByStage(stage).map((negotiation, cardIndex) => {
                return (
                  <div
                    key={negotiation.id}
                    className="kanban-card animate-fade-in"
                    style={{ animationDelay: `${(stageIndex * 100) + (cardIndex * 50)}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10">
                          <Building2 className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {negotiation.lead.nomeFantasia || negotiation.lead.razaoSocial}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {negotiation.lead.cidade}/{negotiation.lead.estado}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Mover etapa</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(negotiation)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir negociação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm font-medium text-foreground mb-3">
                      {negotiation.titulo}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-foreground">
                          {formatCurrency(negotiation.valor)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {negotiation.probabilidade}%
                      </Badge>
                    </div>

                    {negotiation.dataPrevisaoFechamento && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Previsão: {format(negotiation.dataPrevisaoFechamento, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {getNegotiationsByStage(stage).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma negociação</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a negociação{" "}
              <strong>{negotiationToDelete?.titulo}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Negociacoes;
