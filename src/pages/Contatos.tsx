import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLeads } from "@/hooks/useLeads";
import { Lead, LeadStatus, Priority, CompanyType } from "@/types/crm";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { roleLabels } from "@/types/permissions";
import { EditLeadDialog } from "@/components/editing/EditLeadDialog";
import { CreateContactDialog, NewContactData, UniqueCompany } from "@/components/contatos/CreateContactDialog";
import { ContatosAtivosSummary } from "@/components/contatos/ContatosAtivosSummary";
import { ReassignContactDialog } from "@/components/contatos/ReassignContactDialog";
import { FollowUpCell } from "@/components/contatos/FollowUpCell";
import { useContactFollowups } from "@/hooks/useContactFollowups";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  CalendarCheck,
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
  Loader2,
  ChevronDown,
  ChevronRight,
  Linkedin,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
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
  const { currentUser, isMaster } = usePermissions();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { leads, loading, updateLead, deleteLead, createLead } = useLeads();
  const { getFollowupsForLead, createFollowup, updateFollowup, deleteFollowup } = useContactFollowups();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [consultorFilter, setConsultorFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"prioridade" | "dataUltimaInteracao">("prioridade");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingContact, setEditingContact] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [contactToUnassign, setContactToUnassign] = useState<Lead | null>(null);

  // Activity & Meeting dialogs
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [markMeetingDoneDialogOpen, setMarkMeetingDoneDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Lead | null>(null);
  const [activityDescription, setActivityDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");

  // Delete with justification dialog
  const [deleteJustifyDialogOpen, setDeleteJustifyDialogOpen] = useState(false);
  const [contactToDeleteJustify, setContactToDeleteJustify] = useState<Lead | null>(null);
  const [deleteJustification, setDeleteJustification] = useState("");
  const [deletingContact, setDeletingContact] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [contactToReassign, setContactToReassign] = useState<Lead | null>(null);

  // Get unique companies from all leads for autocomplete
  const uniqueCompanies = useMemo<UniqueCompany[]>(() => {
    const companyMap = new Map<string, UniqueCompany>();
    leads.forEach((lead) => {
      if (!companyMap.has(lead.cnpj)) {
        companyMap.set(lead.cnpj, {
          razaoSocial: lead.razaoSocial,
          nomeFantasia: lead.nomeFantasia,
          cnpj: lead.cnpj,
        });
      }
    });
    return Array.from(companyMap.values()).sort((a, b) =>
      (a.nomeFantasia || a.razaoSocial).localeCompare(b.nomeFantasia || b.razaoSocial)
    );
  }, [leads]);

  // Filter only leads that have a responsible person (active contacts)
  const activeContacts = leads.filter((lead) => lead.responsavelId);

  // Get unique consultants for filter dropdown
  const consultants = Array.from(new Set(activeContacts.map((c) => c.responsavelId).filter(Boolean))).map((id) => {
    const lead = activeContacts.find((c) => c.responsavelId === id);
    return { id: id!, nome: lead?.responsavelNome || "Desconhecido" };
  });

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
      return sortDirection === "desc"
        ? b.dataUltimaInteracao.getTime() - a.dataUltimaInteracao.getTime()
        : a.dataUltimaInteracao.getTime() - b.dataUltimaInteracao.getTime();
    }
    return sortDirection === "desc"
      ? b.dataUltimaInteracao.getTime() - a.dataUltimaInteracao.getTime()
      : a.dataUltimaInteracao.getTime() - b.dataUltimaInteracao.getTime();
  });

  // Group contacts by company (Razão Social)
  const groupedContacts = useMemo(() => {
    const groups = new Map<string, { company: UniqueCompany; contacts: Lead[] }>();
    
    sortedContacts.forEach((contact) => {
      const key = contact.razaoSocial.trim().toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, {
          company: {
            razaoSocial: contact.razaoSocial,
            nomeFantasia: contact.nomeFantasia,
            cnpj: contact.cnpj,
          },
          contacts: [],
        });
      }
      groups.get(key)!.contacts.push(contact);
    });
    
    return Array.from(groups.values());
  }, [sortedContacts]);

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["Nome Contato", "Empresa", "Tipo", "Consultor", "Status", "Prioridade", "Última Interação", "Próxima Reunião"],
      ...sortedContacts.map((lead) => [
        lead.nomeContato || "",
        lead.nomeFantasia || lead.razaoSocial,
        companyTypeConfig[lead.tipoEmpresa].label,
        lead.responsavelNome || "",
        statusConfig[lead.status].label,
        priorityConfig[lead.prioridade].label,
        format(lead.dataUltimaInteracao, "dd/MM/yyyy"),
        lead.proximaReuniao ? format(lead.proximaReuniao, "dd/MM/yyyy HH:mm") : "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contatos-ativos-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const toggleSort = (field: "prioridade" | "dataUltimaInteracao") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleEditContact = (contact: Lead) => {
    setEditingContact(contact);
    setEditDialogOpen(true);
  };

  const handleSaveContact = async (updatedContact: Lead) => {
    try {
      await updateLead(updatedContact);
      setEditDialogOpen(false);
      setEditingContact(null);
      toast({ title: "Contato atualizado" });
    } catch {
      toast({ title: "Erro ao atualizar contato", variant: "destructive" });
    }
  };


  const handleUnassignClick = (contact: Lead) => {
    setContactToUnassign(contact);
    setUnassignDialogOpen(true);
  };

  const handleConfirmUnassign = async () => {
    if (!contactToUnassign) return;
    try {
      await updateLead({
        ...contactToUnassign,
        responsavelId: undefined,
        responsavelNome: undefined,
      });

      // Revert any prospect that was converted into this contact
      const { data: linkedProspects } = await supabase
        .from("prospects")
        .select("id")
        .eq("contato_ativo_id", contactToUnassign.id)
        .eq("status", "convertido");

      if (linkedProspects && linkedProspects.length > 0) {
        await supabase
          .from("prospects")
          .update({
            status: "qualificado",
            convertido_em: null,
            contato_ativo_id: null,
            consultor_responsavel_id: null,
            consultor_responsavel_nome: null,
          })
          .eq("contato_ativo_id", contactToUnassign.id);
      }

      toast({ 
        title: "Contato desapropriado", 
        description: "O contato foi devolvido ao Repositório de Leads." + (linkedProspects && linkedProspects.length > 0 ? " O prospect vinculado foi reativado." : "")
      });
    } catch {
      toast({ title: "Erro ao desapropriar contato", variant: "destructive" });
    } finally {
      setUnassignDialogOpen(false);
      setContactToUnassign(null);
    }
  };

  const handleReassignClick = (contact: Lead) => {
    setContactToReassign(contact);
    setReassignDialogOpen(true);
  };

  const handleReassign = async (contact: Lead, consultorId: string, consultorNome: string) => {
    try {
      await updateLead({
        ...contact,
        responsavelId: consultorId,
        responsavelNome: consultorNome,
      });
      toast({ title: "Contato reatribuído", description: `Contato transferido para ${consultorNome}.` });
    } catch {
      toast({ title: "Erro ao reatribuir contato", variant: "destructive" });
      throw new Error("Falha");
    }
  };

  const handleCreateContact = async (data: NewContactData) => {
    if (!profile) {
      toast({ title: "Perfil carregando", description: "Aguarde o carregamento do seu perfil.", variant: "destructive" });
      return;
    }
    if (!data.razaoSocial.trim() || !data.email.trim() || !data.telefone.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha Razão Social, Email e Telefone.", variant: "destructive" });
      return;
    }

    try {
      const lead = await createLead({
        cnpj: data.cnpj || "00.000.000/0000-00",
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia || undefined,
        email: data.email,
        telefone: data.telefone,
        cidade: data.cidade || "N/A",
        estado: data.estado || "SP",
        origem: "outro",
        observacoes: undefined,
      });
      // claim immediately with linkedin
      await updateLead({
        ...lead,
        responsavelId: profile.user_id,
        responsavelNome: profile.nome,
        tipoEmpresa: data.tipoEmpresa,
        nomeContato: data.nomeContato || undefined,
        linkedin: data.linkedin || undefined,
        status: "qualificado",
      });
      setCreateDialogOpen(false);
      toast({ title: "Contato criado", description: "O contato já foi atribuído a você e aparece na lista." });
    } catch {
      toast({ title: "Erro ao criar contato", variant: "destructive" });
    }
  };

  // Helper to create activity for master user (same pattern as Prospects)
  const createMasterActivity = async (titulo: string, descricao: string) => {
    if (!profile) return;
    const { data: masterProfiles } = await supabase.rpc("get_master_user");
    const master = masterProfiles?.[0];
    if (!master) return;

    await supabase.from("activities").insert({
      tipo: "tarefa",
      categoria: "comercial",
      titulo,
      descricao,
      data_agendada: new Date().toISOString(),
      concluida: false,
      responsavel_id: master.user_id,
      responsavel_nome: master.nome,
      status_andamento: "em_andamento",
      criado_por: profile.user_id,
      criado_por_nome: profile.nome,
    });
  };

  // Action: Excluir contato — abre diálogo de justificativa
  const handleOpenDeleteJustifyDialog = (contact: Lead) => {
    setContactToDeleteJustify(contact);
    setDeleteJustification("");
    setDeleteJustifyDialogOpen(true);
  };

  // Confirmar exclusão com justificativa
  const handleConfirmDeleteWithJustification = async () => {
    if (!contactToDeleteJustify || !profile || !deleteJustification.trim()) {
      toast({ title: "Justificativa obrigatória", variant: "destructive" });
      return;
    }
    setDeletingContact(true);
    const contact = contactToDeleteJustify;
    const empresaNome = contact.nomeFantasia || contact.razaoSocial;
    try {
      // 1. Salvar no repositório de exclusões
      await supabase.from("deleted_contacts").insert({
        lead_id: contact.id,
        razao_social: contact.razaoSocial,
        nome_fantasia: contact.nomeFantasia || null,
        nome_contato: contact.nomeContato || null,
        email: contact.email,
        telefone: contact.telefone,
        cnpj: contact.cnpj,
        cidade: contact.cidade,
        estado: contact.estado,
        tipo_empresa: contact.tipoEmpresa,
        responsavel_id: contact.responsavelId || null,
        responsavel_nome: contact.responsavelNome || null,
        justificativa: deleteJustification.trim(),
        excluido_por: profile.user_id,
        excluido_por_nome: profile.nome,
      });

      // 2. Marcar como perdido (soft delete)
      await updateLead({ ...contact, status: "perdido" as any });

      // 3. Criar atividade para o Master
      await createMasterActivity(
        `Exclusão de contato - ${empresaNome}`,
        `Contato "${contact.nomeContato || "—"}" da empresa ${empresaNome} foi excluído por ${profile.nome}. Justificativa: ${deleteJustification.trim()}`
      );

      setDeleteJustifyDialogOpen(false);
      toast({ title: "Contato excluído", description: "Registro salvo e atividade gerada para o Master." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setDeletingContact(false);
      setContactToDeleteJustify(null);
    }
  };

  const handleOpenActivityDialog = (contact: Lead) => {
    setSelectedContact(contact);
    setActivityDescription("");
    setActivityDialogOpen(true);
  };

  const handleOpenMeetingDialog = (contact: Lead) => {
    setSelectedContact(contact);
    setMeetingDate("");
    setMeetingTime("");
    setMeetingDescription("");
    setMeetingDialogOpen(true);
  };

  const handleOpenMarkMeetingDoneDialog = (contact: Lead) => {
    setSelectedContact(contact);
    setMarkMeetingDoneDialogOpen(true);
  };

  const handleMarkMeetingAsDone = async () => {
    if (!selectedContact || !selectedContact.proximaReuniao) {
      toast({ title: "Contato sem reunião agendada", variant: "destructive" });
      return;
    }
    try {
      const obsEntry = `[Reunião realizada: ${format(selectedContact.proximaReuniao, "dd/MM/yyyy HH:mm")}]`;
      const updatedObs = selectedContact.observacoes
        ? `${selectedContact.observacoes}\n${obsEntry}`
        : obsEntry;
      
      await updateLead({ 
        ...selectedContact, 
        ultimaReuniao: selectedContact.proximaReuniao,
        proximaReuniao: undefined,
        observacoes: updatedObs 
      });
      setMarkMeetingDoneDialogOpen(false);
      toast({ title: "Reunião marcada como realizada" });
    } catch {
      toast({ title: "Erro ao atualizar reunião", variant: "destructive" });
    }
  };

  const handleRegisterActivity = async () => {
    if (!selectedContact || !activityDescription.trim()) {
      toast({ title: "Descreva a atividade", variant: "destructive" });
      return;
    }
    try {
      const updatedObs = selectedContact.observacoes
        ? `${selectedContact.observacoes}\n[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${activityDescription}`
        : `[${format(new Date(), "dd/MM/yyyy HH:mm")}] ${activityDescription}`;
      await updateLead({ ...selectedContact, observacoes: updatedObs });
      setActivityDialogOpen(false);
      toast({ title: "Atividade registrada" });
    } catch {
      toast({ title: "Erro ao registrar atividade", variant: "destructive" });
    }
  };

  const handleScheduleMeeting = async () => {
    if (!selectedContact || !meetingDate || !meetingTime) {
      toast({ title: "Preencha data e hora", variant: "destructive" });
      return;
    }
    try {
      const dateTime = new Date(`${meetingDate}T${meetingTime}`);
      const obsEntry = meetingDescription
        ? `[Reunião agendada: ${format(dateTime, "dd/MM/yyyy HH:mm")}] ${meetingDescription}`
        : `[Reunião agendada: ${format(dateTime, "dd/MM/yyyy HH:mm")}]`;
      const updatedObs = selectedContact.observacoes
        ? `${selectedContact.observacoes}\n${obsEntry}`
        : obsEntry;
      await updateLead({ ...selectedContact, proximaReuniao: dateTime, observacoes: updatedObs });
      setMeetingDialogOpen(false);
      toast({ title: "Reunião agendada" });
    } catch {
      toast({ title: "Erro ao agendar reunião", variant: "destructive" });
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

      {/* Summary Section */}
      <ContatosAtivosSummary contacts={activeContacts} />

      {/* Filters Bar */}
      <div className="stat-card mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar contatos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
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
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold w-8"></TableHead>
                <TableHead className="font-semibold">Nome do Contato</TableHead>
                <TableHead className="font-semibold">Empresa</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Consultor</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("prioridade")}>
                  <div className="flex items-center gap-1">
                    Prioridade
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Última Reunião</TableHead>
                <TableHead className="font-semibold">Próxima Reunião</TableHead>
                <TableHead className="font-semibold">Follow-up</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedContacts.map((group, groupIndex) => {
                const hasMultipleContacts = group.contacts.length > 1;
                const groupKey = group.company.razaoSocial.trim().toLowerCase();
                const isExpanded = expandedGroups.has(groupKey);
                
                if (hasMultipleContacts) {
                  // Render collapsible group
                  return (
                    <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)} asChild>
                      <>
                        {/* Group header row */}
                        <TableRow 
                          className="bg-muted/20 hover:bg-muted/40 cursor-pointer border-l-4 border-l-primary"
                        >
                          <TableCell className="w-8">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell colSpan={3}>
                            <div className="flex items-center gap-3">
                              <Building2 className="w-5 h-5 text-primary" />
                              <div>
                                <div className="font-semibold">{group.company.nomeFantasia || group.company.razaoSocial}</div>
                                <div className="text-xs text-muted-foreground font-mono">{group.company.cnpj}</div>
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                {group.contacts.length} contatos
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell colSpan={7}></TableCell>
                        </TableRow>
                        
                        {/* Collapsible content: individual contacts */}
                        <CollapsibleContent asChild>
                          <>
                            {group.contacts.map((contact, index) => {
                              const TypeIcon = companyTypeConfig[contact.tipoEmpresa]?.icon ?? HelpCircle;
                              return (
                                <TableRow 
                                  key={contact.id} 
                                  className="table-row-hover animate-fade-in cursor-pointer bg-background/50 border-l-4 border-l-primary/30" 
                                  style={{ animationDelay: `${index * 30}ms` }} 
                                  onClick={() => handleEditContact(contact)}
                                >
                                  <TableCell className="w-8"></TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <div className="font-medium">{contact.nomeContato || "—"}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                          {contact.email}
                                          {contact.linkedin && (
                                            <a 
                                              href={contact.linkedin} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-[#0077B5] hover:text-[#0077B5]/80"
                                            >
                                              <Linkedin className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm text-muted-foreground">{contact.cidade}/{contact.estado}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">{companyTypeConfig[contact.tipoEmpresa]?.label ?? "—"}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">{contact.responsavelNome ?? "—"}</TableCell>
                                  <TableCell>
                                    <Badge className={cn("badge-status", statusConfig[contact.status]?.className)}>{statusConfig[contact.status]?.label ?? contact.status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={cn("badge-status", priorityConfig[contact.prioridade]?.className)}>{priorityConfig[contact.prioridade]?.label ?? contact.prioridade}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {contact.ultimaReuniao ? <span className="text-muted-foreground">{format(contact.ultimaReuniao, "dd/MM/yyyy")}</span> : <span className="text-muted-foreground">—</span>}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {contact.proximaReuniao ? <span className="text-primary font-medium">{format(contact.proximaReuniao, "dd/MM HH:mm")}</span> : <span className="text-muted-foreground">—</span>}
                                   </TableCell>
                                   <TableCell>
                                     <FollowUpCell
                                       leadId={contact.id}
                                       followups={getFollowupsForLead(contact.id)}
                                       onCreateFollowup={createFollowup}
                                       onUpdateFollowup={updateFollowup}
                                       onDeleteFollowup={deleteFollowup}
                                     />
                                   </TableCell>
                                   <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Registrar Atividade" onClick={() => handleOpenActivityDialog(contact)}>
                                        <ClipboardList className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Agendar Reunião" onClick={() => handleOpenMeetingDialog(contact)}>
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
                                          {contact.proximaReuniao && (
                                            <DropdownMenuItem onClick={() => handleOpenMarkMeetingDoneDialog(contact)}>
                                              <CalendarCheck className="w-4 h-4 mr-2" />
                                              Marcar reunião realizada
                                            </DropdownMenuItem>
                                          )}
                                          {isMaster && (
                                            <DropdownMenuItem onClick={() => handleReassignClick(contact)}>
                                              <UserPlus className="w-4 h-4 mr-2" />
                                              Atribuir a consultor
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => handleUnassignClick(contact)}>
                                            <UserMinus className="w-4 h-4 mr-2" />
                                            Desapropriar contato
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleOpenDeleteJustifyDialog(contact)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir contato
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                } else {
                  // Single contact - render normally
                  const contact = group.contacts[0];
                  const TypeIcon = companyTypeConfig[contact.tipoEmpresa]?.icon ?? HelpCircle;
                  
                  return (
                    <TableRow 
                      key={contact.id} 
                      className="table-row-hover animate-fade-in cursor-pointer" 
                      style={{ animationDelay: `${groupIndex * 30}ms` }} 
                      onClick={() => handleEditContact(contact)}
                    >
                      <TableCell className="w-8"></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{contact.nomeContato || "—"}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              {contact.email}
                              {contact.linkedin && (
                                <a 
                                  href={contact.linkedin} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#0077B5] hover:text-[#0077B5]/80"
                                >
                                  <Linkedin className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{contact.nomeFantasia || contact.razaoSocial}</div>
                        <div className="text-sm text-muted-foreground">{contact.cidade}/{contact.estado}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{companyTypeConfig[contact.tipoEmpresa]?.label ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{contact.responsavelNome ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn("badge-status", statusConfig[contact.status]?.className)}>{statusConfig[contact.status]?.label ?? contact.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("badge-status", priorityConfig[contact.prioridade]?.className)}>{priorityConfig[contact.prioridade]?.label ?? contact.prioridade}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.ultimaReuniao ? <span className="text-muted-foreground">{format(contact.ultimaReuniao, "dd/MM/yyyy")}</span> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.proximaReuniao ? <span className="text-primary font-medium">{format(contact.proximaReuniao, "dd/MM HH:mm")}</span> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <FollowUpCell
                          leadId={contact.id}
                          followups={getFollowupsForLead(contact.id)}
                          onCreateFollowup={createFollowup}
                          onUpdateFollowup={updateFollowup}
                          onDeleteFollowup={deleteFollowup}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Registrar Atividade" onClick={() => handleOpenActivityDialog(contact)}>
                            <ClipboardList className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Agendar Reunião" onClick={() => handleOpenMeetingDialog(contact)}>
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
                              {contact.proximaReuniao && (
                                <DropdownMenuItem onClick={() => handleOpenMarkMeetingDoneDialog(contact)}>
                                  <CalendarCheck className="w-4 h-4 mr-2" />
                                  Marcar reunião realizada
                                </DropdownMenuItem>
                              )}
                              {isMaster && (
                                <DropdownMenuItem onClick={() => handleReassignClick(contact)}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Atribuir a consultor
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleUnassignClick(contact)}>
                                <UserMinus className="w-4 h-4 mr-2" />
                                Desapropriar contato
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDeleteJustifyDialog(contact)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir contato
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }
              })}
            </TableBody>
          </Table>
        )}

        {!loading && sortedContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum contato ativo encontrado</p>
            <p className="text-sm text-muted-foreground/70">Ajuste os filtros ou aproprie leads do repositório</p>
          </div>
        )}
      </div>

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateContact={handleCreateContact}
        existingCompanies={uniqueCompanies}
      />

      {/* Edit Dialog */}
      <EditLeadDialog lead={editingContact} open={editDialogOpen} onOpenChange={setEditDialogOpen} onSave={handleSaveContact} />

      {/* Delete with Justification Dialog */}
      <Dialog open={deleteJustifyDialogOpen} onOpenChange={setDeleteJustifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Contato</DialogTitle>
            <DialogDescription>
              Você está excluindo o contato <strong>{contactToDeleteJustify?.nomeContato || contactToDeleteJustify?.nomeFantasia || contactToDeleteJustify?.razaoSocial}</strong>. Informe o motivo da exclusão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea
                value={deleteJustification}
                onChange={(e) => setDeleteJustification(e.target.value)}
                placeholder="Ex: Dados duplicados, contato inativo, empresa encerrou atividades..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteJustifyDialogOpen(false)} disabled={deletingContact}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDeleteWithJustification} 
              disabled={!deleteJustification.trim() || deletingContact}
            >
              {deletingContact ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Exclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={unassignDialogOpen} onOpenChange={setUnassignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desapropriar contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desapropriar o contato <strong>{contactToUnassign?.nomeContato || contactToUnassign?.nomeFantasia || contactToUnassign?.razaoSocial}</strong>? 
              O contato será devolvido ao Repositório de Leads e poderá ser apropriado por outro consultor. O histórico será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnassign}>Desapropriar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Register Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Atividade</DialogTitle>
            <DialogDescription>
              Adicione uma atividade para <strong>{selectedContact?.nomeFantasia || selectedContact?.razaoSocial}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição da atividade *</Label>
              <Input
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Ex: Ligação de follow-up, Envio de proposta..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterActivity}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
            <DialogDescription>
              Agende uma reunião com <strong>{selectedContact?.nomeFantasia || selectedContact?.razaoSocial}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Assunto da reunião..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleScheduleMeeting}>Agendar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Meeting as Done Dialog */}
      <AlertDialog open={markMeetingDoneDialogOpen} onOpenChange={setMarkMeetingDoneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar Reunião como Realizada</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que a reunião com <strong>{selectedContact?.nomeFantasia || selectedContact?.razaoSocial}</strong>
              {selectedContact?.proximaReuniao && (
                <> agendada para <strong>{format(selectedContact.proximaReuniao, "dd/MM/yyyy 'às' HH:mm")}</strong></>
              )}
              {" "}foi realizada?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkMeetingAsDone}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign Contact Dialog (Master only) */}
      <ReassignContactDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        contact={contactToReassign}
        onReassign={handleReassign}
      />
    </AppLayout>
  );
};

export default Contatos;
