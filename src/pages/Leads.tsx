import { useState, useMemo } from "react";
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
import { useLeads } from "@/hooks/useLeads";
import { Lead, LeadStatus, Priority, CompanyType } from "@/types/crm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Search,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Download,
  Building2,
  Landmark,
  PiggyBank,
  Share2,
  HelpCircle,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  novo: { label: "Novo", className: "badge-new" },
  qualificado: { label: "Qualificado", className: "badge-qualified" },
  proposta: { label: "Proposta", className: "badge-proposal" },
  ganho: { label: "Ganho", className: "badge-won" },
  perdido: { label: "Perdido", className: "badge-lost" },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-destructive/10 text-destructive" },
  media: { label: "Média", className: "bg-warning/30 text-warning-foreground" },
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

const companyTypeConfig: Record<CompanyType, { label: string; icon: typeof Building2 }> = {
  incorporadora: { label: "Incorporadora", icon: Building2 },
  banco: { label: "Banco", icon: Landmark },
  fundo: { label: "Fundo", icon: PiggyBank },
  canal: { label: "Canal", icon: Share2 },
  outro: { label: "Outro", icon: HelpCircle },
};

const Leads = () => {
  const { profile, isGestor } = useAuth();
  const { toast } = useToast();
  const { leads, loading, claimLead, assignLead, deleteLead } = useLeads();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"prioridade" | "dataUltimaInteracao">("dataUltimaInteracao");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Only show unassigned leads (repository = leads without responsavel)
  const unassignedLeads = leads.filter((lead) => !lead.responsavelId);

  const filteredLeads = unassignedLeads.filter((lead) => {
    const matchesSearch =
      lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortField === "prioridade") {
      const order = { alta: 3, media: 2, baixa: 1 };
      const diff = order[b.prioridade] - order[a.prioridade];
      return sortDirection === "desc" ? diff : -diff;
    }
    return sortDirection === "desc"
      ? b.dataUltimaInteracao.getTime() - a.dataUltimaInteracao.getTime()
      : a.dataUltimaInteracao.getTime() - b.dataUltimaInteracao.getTime();
  });

  const toggleSort = (field: "prioridade" | "dataUltimaInteracao") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleClaim = async (lead: Lead) => {
    try {
      await claimLead(lead);
      toast({ title: "Lead apropriado", description: "O lead agora aparece em Contatos Ativos." });
    } catch {
      toast({ title: "Erro ao apropriar lead", variant: "destructive" });
    }
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLead(leadToDelete.id);
      toast({ title: "Lead excluído" });
    } catch {
      toast({ title: "Erro ao excluir lead", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Razão Social", "Nome Fantasia", "CNPJ", "Email", "Cidade", "Estado", "Status", "Prioridade"],
      ...sortedLeads.map((lead) => [
        lead.razaoSocial,
        lead.nomeFantasia || "",
        lead.cnpj,
        lead.email,
        lead.cidade,
        lead.estado,
        statusConfig[lead.status].label,
        priorityConfig[lead.prioridade].label,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repositorio-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <AppLayout title="Repositório de Leads" subtitle="Leads não atribuídos disponíveis para apropriação">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Repositório de Leads" subtitle="Leads não atribuídos disponíveis para apropriação">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Total no Repositório</p>
          <p className="stat-value">{unassignedLeads.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Prioridade Alta</p>
          <p className="stat-value text-destructive">{unassignedLeads.filter(l => l.prioridade === "alta").length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Novos (últimos 7 dias)</p>
          <p className="stat-value">
            {unassignedLeads.filter(l => {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return l.dataCriacao > sevenDaysAgo;
            }).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="stat-card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social, email, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("prioridade")} className="flex items-center gap-1">
                  Prioridade <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("dataUltimaInteracao")} className="flex items-center gap-1">
                  Última Interação <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum lead disponível no repositório
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map((lead) => {
                const TypeIcon = companyTypeConfig[lead.tipoEmpresa].icon;
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{lead.nomeFantasia || lead.razaoSocial}</p>
                          {lead.nomeFantasia && (
                            <p className="text-xs text-muted-foreground">{lead.razaoSocial}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.cnpj}</TableCell>
                    <TableCell className="text-sm">{lead.cidade}/{lead.estado}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", priorityConfig[lead.prioridade].className)}>
                        {priorityConfig[lead.prioridade].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusConfig[lead.status].className)}>
                        {statusConfig[lead.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(lead.dataUltimaInteracao, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleClaim(lead)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Apropriar
                          </DropdownMenuItem>
                          {isGestor && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(lead)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir permanentemente o lead "{leadToDelete?.razaoSocial}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Leads;
