import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Download,
  Search, 
  Loader2, 
  Users, 
  UserCheck, 
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useProspects } from "@/hooks/useProspects";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ProspectCard } from "@/components/prospects/ProspectCard";
import { ImportProspectsDialog } from "@/components/prospects/ImportProspectsDialog";
import { ProspectActivityDialog } from "@/components/prospects/ProspectActivityDialog";
import { ConvertProspectDialog, ConvertCompanyData } from "@/components/prospects/ConvertProspectDialog";
import { useLeads } from "@/hooks/useLeads";
import { AssignProspectDialog } from "@/components/prospects/AssignProspectDialog";
import { CompanySummaryCard } from "@/components/prospects/CompanySummaryCard";
import { Prospect, ProspectStatus, PROSPECT_STATUS_CONFIG } from "@/types/prospects";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { subDays, isAfter } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const Prospects = () => {
  const { isMaster, isGestor, profile } = useAuth();
  const { toast } = useToast();
  const { 
    prospects, 
    loading, 
    importProspects,
    checkImportLimit,
    updateProspectStatus, 
    convertToContact, 
    deleteProspect,
    addActivity,
    getProspectActivities,
    assignProspect,
  } = useProspects();
  const { leads } = useLeads();
  const [convertLoading, setConvertLoading] = useState(false);

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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "all">("all");
  const [activeTab, setActiveTab] = useState("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Metrics
  const sevenDaysAgo = subDays(new Date(), 7);
  const importadosUltimos7Dias = prospects.filter(
    p => isAfter(p.dataImportacao, sevenDaysAgo)
  ).length;
  const convertidosUltimos7Dias = prospects.filter(
    p => p.status === "convertido" && p.convertidoEm && isAfter(p.convertidoEm, sevenDaysAgo)
  ).length;
  const totalConvertidos = prospects.filter(p => p.status === "convertido").length;
  const taxaConversao = prospects.length > 0 
    ? ((totalConvertidos / prospects.length) * 100).toFixed(1) 
    : "0";
  const semAtividade7Dias = prospects.filter(
    p => p.status !== "convertido" && p.status !== "descartado" && !isAfter(p.updatedAt, sevenDaysAgo)
  ).length;

  // Filters
  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || prospect.status === statusFilter;

    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "active" && prospect.status !== "convertido" && prospect.status !== "descartado") ||
      (activeTab === "converted" && prospect.status === "convertido");

    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleUpdateStatus = async (id: string, status: ProspectStatus) => {
    try {
      await updateProspectStatus(id, status);
      toast({ title: "Status atualizado" });
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleConvert = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setConvertDialogOpen(true);
  };

  const confirmConvert = async (companyData?: ConvertCompanyData) => {
    if (!selectedProspect) return;
    setConvertLoading(true);
    try {
      await convertToContact(selectedProspect, companyData);
      toast({ 
        title: "Prospect apropriado!", 
        description: "Um novo Contato Ativo foi criado." 
      });
      setConvertDialogOpen(false);
      setSelectedProspect(null);
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setConvertLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este prospect?")) return;
    try {
      await deleteProspect(id);
      toast({ title: "Prospect excluído" });
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleAddActivity = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setActivityDialogOpen(true);
  };

  const handleAssign = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setAssignDialogOpen(true);
  };

  const handleConfirmAssign = async (prospect: Prospect, consultantId: string, consultantName: string, companyData?: { razaoSocial: string; nomeFantasia: string; cnpj: string }) => {
    try {
      await assignProspect(prospect, consultantId, consultantName, companyData);
      toast({ 
        title: "Prospect atribuído!", 
        description: `Prospect foi atribuído a ${consultantName} e criado como Contato Ativo.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  // Helper to create activity for master user
  const createMasterActivity = async (titulo: string, descricao: string) => {
    if (!profile) return;
    // Find master user using security definer function (bypasses RLS)
    const { data: masterProfiles } = await supabase
      .rpc("get_master_user");

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

  // Action 1: Excluir prospect (request deletion + activity for master)
  const handleRequestDelete = async (prospect: Prospect) => {
    if (!confirm(`Confirma a solicitação de exclusão do prospect "${prospect.nomeCompleto}" (${prospect.empresa})?`)) return;
    try {
      if (isMaster) {
        await deleteProspect(prospect.id);
      } else {
        // Non-master: mark as descartado
        await updateProspectStatus(prospect.id, "descartado");
      }
      await createMasterActivity(
        `Exclusão de prospect - ${prospect.empresa}`,
        `Prospect "${prospect.nomeCompleto}" (${prospect.cargo}) da empresa ${prospect.empresa} foi excluído por ${profile?.nome}. Motivo: duplicidade ou dados indevidos.`
      );
      toast({ title: "Prospect excluído", description: "Atividade gerada para o Master." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Action 2: Cadastrar novo decisor (activity for master)
  const handleRequestNewDecisor = async (prospect: Prospect) => {
    try {
      await createMasterActivity(
        `Cadastrar novo decisor - ${prospect.empresa}`,
        `Solicitação de cadastro de novo decisor para a empresa ${prospect.empresa}. Prospect atual: "${prospect.nomeCompleto}" (${prospect.cargo}). Solicitado por ${profile?.nome}.`
      );
      toast({ title: "Atividade criada", description: `Atividade para cadastrar novo decisor da ${prospect.empresa} gerada para o Master.` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Action 3: Excluir + Cadastrar novo decisor
  const handleRequestDeleteAndNewDecisor = async (prospect: Prospect) => {
    if (!confirm(`Confirma a exclusão do prospect "${prospect.nomeCompleto}" e solicitação de novo decisor para ${prospect.empresa}?`)) return;
    try {
      if (isMaster) {
        await deleteProspect(prospect.id);
      } else {
        await updateProspectStatus(prospect.id, "descartado");
      }
      await createMasterActivity(
        `Cadastrar novo decisor - ${prospect.empresa}`,
        `Prospect "${prospect.nomeCompleto}" (${prospect.cargo}) da empresa ${prospect.empresa} foi excluído por ${profile?.nome}. Necessário cadastrar novo decisor para esta empresa.`
      );
      toast({ title: "Prospect excluído", description: `Atividade para cadastrar novo decisor da ${prospect.empresa} gerada para o Master.` });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AppLayout title="Prospects" subtitle="Prospecção ativa de pessoas físicas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Prospects" subtitle="Prospecção ativa de pessoas físicas (CPF)">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Importados (7 dias)"
          value={importadosUltimos7Dias}
          icon={<Users className="w-6 h-6" />}
          tooltip="Prospects importados nos últimos 7 dias"
        />
        <MetricCard
          title="Convertidos (7 dias)"
          value={convertidosUltimos7Dias}
          icon={<UserCheck className="w-6 h-6" />}
          variant="primary"
          tooltip="Prospects convertidos em Contato Ativo nos últimos 7 dias"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${taxaConversao}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="secondary"
          tooltip="Percentual de prospects convertidos em relação ao total"
        />
        <MetricCard
          title="Sem Atividade (7d)"
          value={semAtividade7Dias}
          icon={<AlertCircle className="w-6 h-6" />}
          variant={semAtividade7Dias > 0 ? "primary" : "secondary"}
          tooltip="Prospects ativos sem atividade há mais de 7 dias"
        />
      </div>

      {/* Company Summary */}
      <div className="mb-6">
        <CompanySummaryCard prospects={prospects} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProspectStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(PROSPECT_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const csvContent = [
              ["Nome Completo", "Cargo", "Empresa", "Email", "Telefone", "LinkedIn", "Status", "Consultor", "Data Importação"].join(","),
              ...prospects.map(p => [
                p.nomeCompleto,
                p.cargo,
                p.empresa,
                p.email,
                p.telefone || "",
                p.linkedinUrl,
                PROSPECT_STATUS_CONFIG[p.status]?.label || p.status,
                p.consultorResponsavelNome || "",
                format(p.dataImportacao, "dd/MM/yyyy"),
              ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
            ].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `prospects-${format(new Date(), "yyyy-MM-dd")}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          {isMaster && (
            <Button onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Prospects
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos ({prospects.length})</TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({prospects.filter(p => p.status !== "convertido" && p.status !== "descartado").length})
          </TabsTrigger>
          <TabsTrigger value="converted">
            Convertidos ({prospects.filter(p => p.status === "convertido").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredProspects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum prospect encontrado</p>
              <p className="text-sm">
                {isMaster 
                  ? "Importe prospects usando o botão acima" 
                  : "Aguarde a importação de novos prospects"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onUpdateStatus={handleUpdateStatus}
                  onConvert={handleConvert}
                  onDelete={handleDelete}
                  onAddActivity={handleAddActivity}
                  onAssign={handleAssign}
                  canAssign={isGestor || isMaster}
                  onRequestDelete={handleRequestDelete}
                  onRequestNewDecisor={handleRequestNewDecisor}
                  onRequestDeleteAndNewDecisor={handleRequestDeleteAndNewDecisor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ImportProspectsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={importProspects}
        checkLimit={checkImportLimit}
      />

      <ProspectActivityDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        prospect={selectedProspect}
        onAddActivity={addActivity}
        getActivities={getProspectActivities}
      />

      <ConvertProspectDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        prospect={selectedProspect}
        onConfirm={confirmConvert}
        existingCompanies={existingCompanies}
        loading={convertLoading}
      />

      {/* Assign Prospect Dialog (Gestor/Master) */}
      <AssignProspectDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        prospect={selectedProspect}
        existingCompanies={existingCompanies}
        onAssign={handleConfirmAssign}
      />
    </AppLayout>
  );
};

export default Prospects;
