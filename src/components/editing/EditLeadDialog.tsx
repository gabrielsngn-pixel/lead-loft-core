import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, History, Save, X, Shield, Clock, User, Linkedin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useChangeHistory } from "@/hooks/useChangeHistory";
import { Lead, LeadStatus, Priority, CompanyType, LeadSource } from "@/types/crm";
import { leadFieldPermissions, roleLabels } from "@/types/permissions";
import { EditableField } from "./EditableField";
import { ChangeHistoryDialog } from "./ChangeHistoryDialog";

interface EditLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Lead) => void;
}

const statusOptions = [
  { value: "novo", label: "Novo" },
  { value: "qualificado", label: "Qualificado" },
  { value: "proposta", label: "Proposta" },
  { value: "ganho", label: "Ganho" },
  { value: "perdido", label: "Perdido" },
];

const priorityOptions = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const companyTypeOptions = [
  { value: "incorporadora", label: "Incorporadora" },
  { value: "banco", label: "Banco" },
  { value: "fundo", label: "Fundo" },
  { value: "canal", label: "Canal" },
  { value: "outro", label: "Outro" },
];

const sourceOptions = [
  { value: "site", label: "Site" },
  { value: "indicacao", label: "Indicação" },
  { value: "evento", label: "Evento" },
  { value: "parceiro", label: "Parceiro" },
  { value: "outbound", label: "Outbound" },
  { value: "outro", label: "Outro" },
];

export function EditLeadDialog({
  lead,
  open,
  onOpenChange,
  onSave,
}: EditLeadDialogProps) {
  const { toast } = useToast();
  const { currentUser } = usePermissions();
  const { history, logChange } = useChangeHistory("lead", lead?.id || "");
  
  const [editedLead, setEditedLead] = useState<Lead | null>(lead);
  const [hasChanges, setHasChanges] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyFieldFilter, setHistoryFieldFilter] = useState<string | undefined>();

  // Sync internal state whenever a different lead is opened.
  // This fixes cases where the dialog would not render because `editedLead`
  // was initialized with `null` and never updated.
  useEffect(() => {
    if (open) {
      setEditedLead(lead);
      setHasChanges(false);
    }
  }, [lead, open]);

  useEffect(() => {
    if (!open) {
      setEditedLead(null);
      setHasChanges(false);
    }
  }, [open]);

  if (!lead) return null;

  const currentLead = editedLead ?? lead;

  const handleFieldChange = (fieldName: string, value: string) => {
    const fieldPermission = leadFieldPermissions.find(p => p.field === fieldName);
    const oldValue = String((lead as any)[fieldName] ?? "");
    
    // Log the change
    if (fieldPermission) {
      logChange(fieldName, fieldPermission.label, oldValue, value);
    }

    // Update the lead - handle date fields
    setEditedLead(prev => {
      if (!prev) return prev;
      let newValue: any = value;
      
      // Convert date strings to Date objects for date fields
      if ((fieldName === 'ultimaReuniao' || fieldName === 'proximaReuniao') && value) {
        newValue = new Date(value);
      } else if ((fieldName === 'ultimaReuniao' || fieldName === 'proximaReuniao') && !value) {
        newValue = undefined;
      }
      
      const updated = { ...prev, [fieldName]: newValue, dataUltimaInteracao: new Date() };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (currentLead) {
      onSave(currentLead);
      toast({
        title: "Alterações salvas",
        description: `${currentLead.nomeFantasia || currentLead.razaoSocial} atualizado com sucesso.`,
      });
      setHasChanges(false);
    }
  };

  const handleShowFieldHistory = (fieldName: string) => {
    setHistoryFieldFilter(fieldName);
    setHistoryDialogOpen(true);
  };

  const handleShowAllHistory = () => {
    setHistoryFieldFilter(undefined);
    setHistoryDialogOpen(true);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="font-display text-xl">
                    {lead.nomeFantasia || lead.razaoSocial}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-mono">{lead.cnpj}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <User className="w-3 h-3" />
                  {roleLabels[currentUser.role]}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowAllHistory}
                  className="gap-1"
                >
                  <History className="w-4 h-4" />
                  Histórico
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <Tabs defaultValue="contato" className="py-4">
              <TabsList className="mb-4">
                <TabsTrigger value="contato">Dados do Contato</TabsTrigger>
                <TabsTrigger value="empresa">Empresa</TabsTrigger>
                <TabsTrigger value="comercial">Comercial</TabsTrigger>
                <TabsTrigger value="protegido">Campos Protegidos</TabsTrigger>
              </TabsList>

              <TabsContent value="contato" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    fieldName="nomeContato"
                    label="Nome do Contato"
                    value={currentLead.nomeContato}
                    onSave={(v) => handleFieldChange("nomeContato", v)}
                    placeholder="Nome do contato"
                    onHistoryClick={() => handleShowFieldHistory("nomeContato")}
                  />
                  <EditableField
                    fieldName="email"
                    label="Email"
                    value={currentLead.email}
                    onSave={(v) => handleFieldChange("email", v)}
                    placeholder="email@empresa.com"
                    onHistoryClick={() => handleShowFieldHistory("email")}
                  />
                  <EditableField
                    fieldName="telefone"
                    label="Telefone"
                    value={currentLead.telefone}
                    onSave={(v) => handleFieldChange("telefone", v)}
                    placeholder="(00) 00000-0000"
                    onHistoryClick={() => handleShowFieldHistory("telefone")}
                  />
                  <EditableField
                    fieldName="cidade"
                    label="Cidade"
                    value={currentLead.cidade}
                    onSave={(v) => handleFieldChange("cidade", v)}
                    placeholder="Cidade"
                    onHistoryClick={() => handleShowFieldHistory("cidade")}
                  />
                  <EditableField
                    fieldName="estado"
                    label="Estado"
                    value={currentLead.estado}
                    onSave={(v) => handleFieldChange("estado", v)}
                    placeholder="UF"
                    onHistoryClick={() => handleShowFieldHistory("estado")}
                  />
                  <EditableField
                    fieldName="linkedin"
                    label="LinkedIn"
                    value={currentLead.linkedin}
                    onSave={(v) => handleFieldChange("linkedin", v)}
                    placeholder="https://linkedin.com/in/perfil"
                    onHistoryClick={() => handleShowFieldHistory("linkedin")}
                  />
                  <EditableField
                    fieldName="ultimaReuniao"
                    label="Última Reunião"
                    value={currentLead.ultimaReuniao ? format(currentLead.ultimaReuniao, "yyyy-MM-dd") : ""}
                    onSave={(v) => handleFieldChange("ultimaReuniao", v)}
                    type="date"
                    onHistoryClick={() => handleShowFieldHistory("ultimaReuniao")}
                  />
                  <EditableField
                    fieldName="proximaReuniao"
                    label="Próxima Reunião"
                    value={currentLead.proximaReuniao ? format(currentLead.proximaReuniao, "yyyy-MM-dd") : ""}
                    onSave={(v) => handleFieldChange("proximaReuniao", v)}
                    type="date"
                    onHistoryClick={() => handleShowFieldHistory("proximaReuniao")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="empresa" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    fieldName="razaoSocial"
                    label="Razão Social"
                    value={currentLead.razaoSocial}
                    onSave={(v) => handleFieldChange("razaoSocial", v)}
                    placeholder="Razão Social"
                    onHistoryClick={() => handleShowFieldHistory("razaoSocial")}
                  />
                  <EditableField
                    fieldName="nomeFantasia"
                    label="Nome Fantasia"
                    value={currentLead.nomeFantasia}
                    onSave={(v) => handleFieldChange("nomeFantasia", v)}
                    placeholder="Nome Fantasia"
                    onHistoryClick={() => handleShowFieldHistory("nomeFantasia")}
                  />
                  <EditableField
                    fieldName="tipoEmpresa"
                    label="Tipo de Empresa"
                    value={currentLead.tipoEmpresa}
                    onSave={(v) => handleFieldChange("tipoEmpresa", v as CompanyType)}
                    type="select"
                    options={companyTypeOptions}
                    onHistoryClick={() => handleShowFieldHistory("tipoEmpresa")}
                  />
                  <EditableField
                    fieldName="origem"
                    label="Origem"
                    value={currentLead.origem}
                    onSave={(v) => handleFieldChange("origem", v as LeadSource)}
                    type="select"
                    options={sourceOptions}
                    onHistoryClick={() => handleShowFieldHistory("origem")}
                  />
                </div>
              </TabsContent>

              <TabsContent value="comercial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    fieldName="status"
                    label="Status"
                    value={currentLead.status}
                    onSave={(v) => handleFieldChange("status", v as LeadStatus)}
                    type="select"
                    options={statusOptions}
                    onHistoryClick={() => handleShowFieldHistory("status")}
                  />
                  <EditableField
                    fieldName="prioridade"
                    label="Prioridade"
                    value={currentLead.prioridade}
                    onSave={(v) => handleFieldChange("prioridade", v as Priority)}
                    type="select"
                    options={priorityOptions}
                    onHistoryClick={() => handleShowFieldHistory("prioridade")}
                  />
                  <EditableField
                    fieldName="valorEstimado"
                    label="Valor Estimado"
                    value={currentLead.valorEstimado}
                    onSave={(v) => handleFieldChange("valorEstimado", v)}
                    type="number"
                    displayFormatter={(v) => formatCurrency(Number(v))}
                    onHistoryClick={() => handleShowFieldHistory("valorEstimado")}
                  />
                  <div className="col-span-2">
                    <EditableField
                      fieldName="observacoes"
                      label="Observações"
                      value={currentLead.observacoes}
                      onSave={(v) => handleFieldChange("observacoes", v)}
                      type="textarea"
                      placeholder="Adicione observações sobre este lead..."
                      onHistoryClick={() => handleShowFieldHistory("observacoes")}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="protegido" className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="font-medium text-sm">Campos Protegidos</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estes campos são controlados por regras de governança e só podem ser alterados por gestores.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    fieldName="id"
                    label="ID do Contato"
                    value={lead.id}
                    onSave={() => {}}
                  />
                  <EditableField
                    fieldName="cnpj"
                    label="CNPJ"
                    value={lead.cnpj}
                    onSave={(v) => handleFieldChange("cnpj", v)}
                    onHistoryClick={() => handleShowFieldHistory("cnpj")}
                  />
                  <EditableField
                    fieldName="dataCriacao"
                    label="Data de Criação"
                    value={format(lead.dataCriacao, "dd/MM/yyyy", { locale: ptBR })}
                    onSave={() => {}}
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">
                      Viabilidade Aprovada
                    </label>
                    {lead.viabilidade?.status === "sim" ? (
                      <div className="bg-success/10 text-success p-3 rounded-lg">
                        <p className="font-medium">Aprovada</p>
                        <p className="text-sm">
                          Margem: {lead.viabilidade.margem}% | Rec: {lead.viabilidade.recomendacao}
                        </p>
                        {lead.viabilidade.dataAnalise && (
                          <p className="text-xs mt-1">
                            Analisada em {format(lead.viabilidade.dataAnalise, "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {lead.viabilidade?.status === "pendente" ? "Pendente" : "Não aprovada"}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <Separator />

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
                Última atualização: {format(currentLead.dataUltimaInteracao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              {hasChanges && (
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ChangeHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        history={history}
        entityName={lead.nomeFantasia || lead.razaoSocial}
        fieldFilter={historyFieldFilter}
      />
    </>
  );
}
