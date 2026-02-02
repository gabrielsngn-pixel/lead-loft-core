import { useState } from "react";
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
import { mockLeads, mockUsers } from "@/data/mockData";
import { Lead, LeadStatus, Priority, CompanyType } from "@/types/crm";
import { usePermissions } from "@/hooks/usePermissions";
import { roleLabels } from "@/types/permissions";
import { EditLeadDialog } from "@/components/editing/EditLeadDialog";
import { cn } from "@/lib/utils";
import {
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  ClipboardList,
  Building2,
  Landmark,
  PiggyBank,
  Share2,
  HelpCircle,
  Download,
  Upload,
  Filter,
  ArrowUpDown,
  Edit,
  Shield,
  Plus,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const Contatos = () => {
  const { currentUser } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [consultorFilter, setConsultorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"prioridade" | "dataUltimaInteracao">("prioridade");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [contacts, setContacts] = useState<Lead[]>(mockLeads);
  const [editingContact, setEditingContact] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Lead | null>(null);
  
  // Filter only leads that have a responsible person (active contacts)
  const activeContacts = contacts.filter(lead => lead.responsavelId);

  const filteredContacts = activeContacts.filter((lead) => {
    const matchesSearch = 
      lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nomeContato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || lead.prioridade === priorityFilter;
    const matchesConsultor = consultorFilter === "all" || lead.responsavelId === consultorFilter;
    const matchesTipo = tipoFilter === "all" || lead.tipoEmpresa === tipoFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesConsultor && matchesTipo;
  });

  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortField === "prioridade") {
      const priorityOrder = { alta: 3, media: 2, baixa: 1 };
      const diff = priorityOrder[b.prioridade] - priorityOrder[a.prioridade];
      if (diff !== 0) return sortDirection === "desc" ? diff : -diff;
      // Secondary sort by date
      return sortDirection === "desc" 
        ? b.dataUltimaInteracao.getTime() - a.dataUltimaInteracao.getTime()
        : a.dataUltimaInteracao.getTime() - b.dataUltimaInteracao.getTime();
    }
    return sortDirection === "desc" 
      ? b.dataUltimaInteracao.getTime() - a.dataUltimaInteracao.getTime()
      : a.dataUltimaInteracao.getTime() - b.dataUltimaInteracao.getTime();
  });

  const handleExport = () => {
    const csvContent = [
      ["Nome Contato", "Empresa", "Tipo", "Consultor", "Status", "Prioridade", "Última Interação", "Próxima Reunião", "Viabilidade"],
      ...sortedContacts.map(lead => [
        lead.nomeContato || "",
        lead.nomeFantasia || lead.razaoSocial,
        companyTypeConfig[lead.tipoEmpresa].label,
        lead.responsavelNome || "",
        statusConfig[lead.status].label,
        priorityConfig[lead.prioridade].label,
        format(lead.dataUltimaInteracao, "dd/MM/yyyy"),
        lead.proximaReuniao ? format(lead.proximaReuniao, "dd/MM/yyyy HH:mm") : "",
        lead.viabilidade?.status || "pendente",
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contatos-ativos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const toggleSort = (field: "prioridade" | "dataUltimaInteracao") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleEditContact = (contact: Lead) => {
    setEditingContact(contact);
    setEditDialogOpen(true);
  };

  const handleSaveContact = (updatedContact: Lead) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    setEditDialogOpen(false);
    setEditingContact(null);
  };

  const handleDeleteClick = (contact: Lead) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      setContacts(prev => prev.filter(c => c.id !== contactToDelete.id));
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  return (
    <AppLayout title="Contatos Ativos" subtitle="Lista de leads sob sua responsabilidade">
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
          {/* Search and Actions Row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={consultorFilter} onValueChange={setConsultorFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Consultor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Consultores</SelectItem>
                {mockUsers.filter(u => u.role === "consultor").map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
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

            <Badge variant="secondary" className="ml-auto">
              {sortedContacts.length} contatos
            </Badge>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Nome do Contato</TableHead>
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Consultor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort("prioridade")}
              >
                <div className="flex items-center gap-1">
                  Prioridade
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort("dataUltimaInteracao")}
              >
                <div className="flex items-center gap-1">
                  Última Interação
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="font-semibold">Próxima Reunião</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.map((contact, index) => {
              const TypeIcon = companyTypeConfig[contact.tipoEmpresa].icon;
              
              return (
                <TableRow 
                  key={contact.id} 
                  className="table-row-hover animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => handleEditContact(contact)}
                >
                  <TableCell>
                    <div className="font-medium">{contact.nomeContato || "—"}</div>
                    <div className="text-sm text-muted-foreground">{contact.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{contact.nomeFantasia || contact.razaoSocial}</div>
                    <div className="text-sm text-muted-foreground">{contact.cidade}/{contact.estado}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{companyTypeConfig[contact.tipoEmpresa].label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{contact.responsavelNome}</TableCell>
                  <TableCell>
                    <Badge className={cn("badge-status", statusConfig[contact.status].className)}>
                      {statusConfig[contact.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("badge-status", priorityConfig[contact.prioridade].className)}>
                      {priorityConfig[contact.prioridade].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(contact.dataUltimaInteracao, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {contact.proximaReuniao ? (
                      <span className="text-primary font-medium">
                        {format(contact.proximaReuniao, "dd/MM HH:mm")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Registrar Atividade">
                        <ClipboardList className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Agendar Reunião">
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClick(contact)}
                          >
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

        {sortedContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum contato ativo encontrado
            </p>
            <p className="text-sm text-muted-foreground/70">
              Ajuste os filtros ou aproprie leads do repositório
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditLeadDialog
        lead={editingContact}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveContact}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato{" "}
              <strong>{contactToDelete?.nomeContato || contactToDelete?.nomeFantasia || contactToDelete?.razaoSocial}</strong>?
              Esta ação não pode ser desfeita.
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

export default Contatos;
