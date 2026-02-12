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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { ExportImportButtons } from "@/components/shared/ExportImportButtons";
import { EditLeadDialog } from "@/components/editing/EditLeadDialog";
import { AssignLeadDialog } from "@/components/leads/AssignLeadDialog";
import { ClaimLeadDialog } from "@/components/leads/ClaimLeadDialog";
import { useLeads } from "@/hooks/useLeads";
import { Lead, LeadStatus, Priority, CompanyType } from "@/types/crm";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Users,
  Trash2,
  Building2,
  Landmark,
  PiggyBank,
  Share2,
  HelpCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { roleLabels } from "@/types/permissions";

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

const origemLabels: Record<string, string> = {
  site: "Site",
  indicacao: "Indicação",
  evento: "Evento",
  parceiro: "Parceiro",
  outbound: "Outbound",
  outro: "Outro",
};

const exportColumns = [
  { key: "cnpj", label: "CNPJ", required: true },
  { key: "razaoSocial", label: "Razão Social", required: true },
  { key: "nomeFantasia", label: "Nome Fantasia" },
  { key: "nomeContato", label: "Nome Contato" },
  { key: "email", label: "Email", required: true },
  { key: "telefone", label: "Telefone", required: true },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado" },
  { key: "responsavelNome", label: "Consultor" },
  { key: "origem", label: "Origem" },
  { key: "status", label: "Status" },
  { key: "prioridade", label: "Prioridade" },
  { key: "tipoEmpresa", label: "Tipo Empresa" },
];

const Leads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, isGestor, isMaster } = usePermissions();
  const { leads, loading, updateLead, deleteLead, claimLead, assignLead } = useLeads();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [cidadeFilter, setCidadeFilter] = useState<string>("all");
  const [consultorFilter, setConsultorFilter] = useState<string>("all");

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(
    new Set(leads.filter((l) => !l.responsavelId && l.cidade).map((l) => l.cidade))
  ).sort();

  // Get unique consultores from responsavelNome for filter dropdown
  const uniqueConsultores = Array.from(
    new Set(leads.filter((l) => !l.responsavelId && l.responsavelNome).map((l) => l.responsavelNome!))
  ).sort();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [leadToClaim, setLeadToClaim] = useState<Lead | null>(null);

  // Build unique companies list from all leads
  const existingCompanies = useMemo(() => {
    const map = new Map<string, { razaoSocial: string; nomeFantasia?: string; cnpj: string }>();
    leads.forEach((l) => {
      if (!map.has(l.cnpj)) {
        map.set(l.cnpj, { razaoSocial: l.razaoSocial, nomeFantasia: l.nomeFantasia, cnpj: l.cnpj });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial)
    );
  }, [leads]);

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setEditDialogOpen(true);
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    try {
      await updateLead(updatedLead);
      setEditDialogOpen(false);
      setEditingLead(null);
      toast({ title: "Lead atualizado com sucesso" });
    } catch {
      toast({ title: "Erro ao atualizar lead", variant: "destructive" });
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
      toast({
        title: "Lead excluído",
        description: `${leadToDelete.nomeFantasia || leadToDelete.razaoSocial} foi removido.`,
      });
    } catch {
      toast({ title: "Erro ao excluir lead", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleClaimLead = async (lead: Lead, companyData?: { razaoSocial: string; nomeFantasia: string; cnpj: string }) => {
    try {
      if (companyData) {
        // Update company data then claim
        await updateLead({ ...lead, razaoSocial: companyData.razaoSocial, nomeFantasia: companyData.nomeFantasia, cnpj: companyData.cnpj });
        await claimLead({ ...lead, razaoSocial: companyData.razaoSocial, nomeFantasia: companyData.nomeFantasia, cnpj: companyData.cnpj });
      } else {
        await claimLead(lead);
      }
      toast({ title: "Você é agora responsável por este lead" });
    } catch {
      toast({ title: "Erro ao apropriar lead", variant: "destructive" });
    }
  };

  const handleOpenClaimDialog = (lead: Lead) => {
    setLeadToClaim(lead);
    setClaimDialogOpen(true);
  };

  const handleOpenAssignDialog = (lead: Lead) => {
    setLeadToAssign(lead);
    setAssignDialogOpen(true);
  };

  const handleAssignLead = async (lead: Lead, consultantId: string, consultantName: string) => {
    try {
      await assignLead(lead, consultantId, consultantName);
      toast({ title: `Lead atribuído a ${consultantName}` });
    } catch {
      toast({ title: "Erro ao atribuir lead", variant: "destructive" });
    }
  };

  // Repositório de Leads: apenas leads SEM responsável (não apropriados)
  const filteredLeads = leads.filter((lead) => {
    // Lead com responsável vai para Contatos Ativos, não aparece aqui
    if (lead.responsavelId) return false;

    const matchesSearch =
      lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || lead.tipoEmpresa === tipoFilter;
    const matchesCidade = cidadeFilter === "all" || lead.cidade === cidadeFilter;
    
    // Filtro por consultor: "none" = sem consultor, "all" = todos, ou nome específico
    const matchesConsultor = 
      consultorFilter === "all" || 
      (consultorFilter === "none" && !lead.responsavelNome) ||
      (consultorFilter !== "none" && lead.responsavelNome === consultorFilter);

    return matchesSearch && matchesStatus && matchesTipo && matchesCidade && matchesConsultor;
  });

  const handleImport = (_data: any[]) => {
    // import via backend será tratado futuramente
    toast({ title: "Importação não implementada (backend)", variant: "destructive" });
  };

  return (
    <AppLayout title="Repositório de Leads" subtitle="Gerencie todos os leads da sua base">
      {/* Role Badge */}
      <div className="flex items-center justify-end mb-4">
        <Badge variant="outline" className="gap-1">
          <Shield className="w-3 h-3" />
          {roleLabels[currentUser.role]}
        </Badge>
      </div>

      {/* Filters Bar */}
      <div className="stat-card mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <ExportImportButtons
                moduleName="leads"
                data={filteredLeads}
                columns={exportColumns}
                onImport={handleImport}
                templateFields={exportColumns}
              />
              <Button onClick={() => navigate("/leads/novo")}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(companyTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Cidades</SelectItem>
                {uniqueCities.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={consultorFilter} onValueChange={setConsultorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Consultor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Consultores</SelectItem>
                <SelectItem value="none">Sem Consultor</SelectItem>
                {uniqueConsultores.map((consultor) => (
                  <SelectItem key={consultor} value={consultor}>{consultor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="ml-auto">
              {filteredLeads.length} leads
            </Badge>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="stat-card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Empresa</TableHead>
                <TableHead className="font-semibold">Cidade</TableHead>
                <TableHead className="font-semibold">CNPJ</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">Consultor</TableHead>
                <TableHead className="font-semibold">Origem</TableHead>
                <TableHead className="font-semibold">Status Inicial</TableHead>
                <TableHead className="font-semibold">Status Atual</TableHead>
                <TableHead className="font-semibold">Prioridade</TableHead>
                <TableHead className="font-semibold">Comentários</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead, index) => {
                const TypeIcon = companyTypeConfig[lead.tipoEmpresa]?.icon ?? HelpCircle;
                return (
                  <TableRow
                    key={lead.id}
                    className="table-row-hover animate-fade-in cursor-pointer"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => handleEditLead(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/10">
                          <TypeIcon className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.nomeFantasia || lead.razaoSocial}</p>
                          <p className="text-sm text-muted-foreground">{lead.estado}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.cidade}</TableCell>
                    <TableCell className="font-mono text-sm">{lead.cnpj}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{lead.nomeContato || lead.email}</p>
                        <p className="text-muted-foreground">{lead.telefone}</p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Input
                        className="h-8 w-32 text-sm"
                        placeholder="Nome do consultor"
                        value={lead.responsavelNome || ""}
                        onChange={(e) => {
                          const newName = e.target.value;
                          updateLead({ ...lead, responsavelNome: newName || undefined });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{origemLabels[lead.origem] ?? lead.origem}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="badge-status badge-new">Novo</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("badge-status", statusConfig[lead.status]?.className)}>{statusConfig[lead.status]?.label ?? lead.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("badge-status", priorityConfig[lead.prioridade]?.className)}>{priorityConfig[lead.prioridade]?.label ?? lead.prioridade}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.observacoes ? (
                        <span className="text-sm" title={lead.observacoes}>
                          {lead.observacoes.length > 48 ? `${lead.observacoes.slice(0, 48)}…` : lead.observacoes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenClaimDialog(lead)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Apropriar para mim
                            </DropdownMenuItem>
                            {(isGestor || isMaster) && (
                              <DropdownMenuItem onClick={() => handleOpenAssignDialog(lead)}>
                                <Users className="w-4 h-4 mr-2" />
                                Atribuir a consultor
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(lead)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!loading && filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum lead encontrado</p>
            <p className="text-sm text-muted-foreground/70">Tente ajustar seus filtros de busca</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditLeadDialog lead={editingLead} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSave={handleSaveLead} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nomeFantasia || leadToDelete?.razaoSocial}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Lead Dialog (Gestor/Master) */}
      <AssignLeadDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        lead={leadToAssign}
        onAssign={handleAssignLead}
      />

      {/* Claim Lead Dialog */}
      <ClaimLeadDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        lead={leadToClaim}
        existingCompanies={existingCompanies}
        onClaim={handleClaimLead}
      />
    </AppLayout>
  );
};

export default Leads;
