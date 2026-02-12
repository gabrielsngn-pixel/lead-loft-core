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
  Edit,
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
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [cidadeFilter, setCidadeFilter] = useState<string>("all");
  const [consultorFilter, setConsultorFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"prioridade" | "dataUltimaInteracao">("dataUltimaInteracao");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Get unique cities and consultants for filters
  const uniqueCities = useMemo(() => {
    const cities = new Set(leads.map((l) => l.cidade).filter(Boolean));
    return Array.from(cities).sort();
  }, [leads]);

  const uniqueConsultants = useMemo(() => {
    const consultantMap = new Map<string, string>();
    leads.forEach((l) => {
      if (l.responsavelId && l.responsavelNome) {
        consultantMap.set(l.responsavelId, l.responsavelNome);
      }
    });
    return Array.from(consultantMap.entries()).map(([id, nome]) => ({ id, nome }));
  }, [leads]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj.includes(searchTerm) ||
      lead.nomeContato?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || lead.tipoEmpresa === tipoFilter;
    const matchesCidade = cidadeFilter === "all" || lead.cidade === cidadeFilter;
    const matchesConsultor =
      consultorFilter === "all" ||
      (consultorFilter === "unassigned" ? !lead.responsavelId : lead.responsavelId === consultorFilter);

    return matchesSearch && matchesStatus && matchesTipo && matchesCidade && matchesConsultor;
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
      ["Empresa", "Nome Fantasia", "CNPJ", "Contato", "Email", "Telefone", "Cidade", "Estado", "Consultor", "Origem", "Status", "Prioridade", "Comentários"],
      ...sortedLeads.map((lead) => [
        lead.razaoSocial,
        lead.nomeFantasia || "",
        lead.cnpj,
        lead.nomeContato || "",
        lead.email,
        lead.telefone,
        lead.cidade,
        lead.estado,
        lead.responsavelNome || "",
        lead.origem,
        statusConfig[lead.status].label,
        priorityConfig[lead.prioridade].label,
        lead.observacoes || "",
      ]),
    ]
      .map((row) => row.map(cell => `"${cell}"`).join(","))
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
      <AppLayout title="Repositório de Leads" subtitle="Base completa de leads com consultores atribuídos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Repositório de Leads" subtitle="Base completa de leads com consultores atribuídos">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Todos Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Todos Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            {Object.entries(companyTypeConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Todas Cidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Cidades</SelectItem>
            {uniqueCities.map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={consultorFilter} onValueChange={setConsultorFilter}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue placeholder="Todos Consultores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Consultores</SelectItem>
            <SelectItem value="unassigned">Sem consultor</SelectItem>
            {uniqueConsultants.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {sortedLeads.length} leads
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status Inicial</TableHead>
              <TableHead>Status Atual</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("prioridade")} className="flex items-center gap-1">
                  Prioridade <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Comentários</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-12">
                  Nenhum lead encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map((lead) => {
                const TypeIcon = companyTypeConfig[lead.tipoEmpresa].icon;
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{lead.nomeFantasia || lead.razaoSocial}</p>
                          <p className="text-xs text-muted-foreground">{lead.estado}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.cidade}</TableCell>
                    <TableCell className="text-sm font-mono text-xs">{lead.cnpj}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{lead.nomeContato || "—"}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                        <p className="text-xs text-muted-foreground">{lead.telefone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{lead.responsavelNome || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {lead.origem}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusConfig["novo"].className)}>
                        {statusConfig["novo"].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusConfig[lead.status].className)}>
                        {statusConfig[lead.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", priorityConfig[lead.prioridade].className)}>
                        {priorityConfig[lead.prioridade].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {lead.observacoes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!lead.responsavelId && (
                            <DropdownMenuItem onClick={() => handleClaim(lead)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Apropriar
                            </DropdownMenuItem>
                          )}
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
