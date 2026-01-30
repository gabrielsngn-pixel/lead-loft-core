import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, FileText, Save, FileDown, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { MeetingMinutes, MeetingType, meetingTypeLabels } from "@/types/meetings";
import { mockLeads } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface MeetingMinutesFormProps {
  initialData?: Partial<MeetingMinutes>;
  onSave: (data: Partial<MeetingMinutes>) => void;
  onExportPdf?: (data: Partial<MeetingMinutes>) => void;
}

export function MeetingMinutesForm({ initialData, onSave, onExportPdf }: MeetingMinutesFormProps) {
  const [formData, setFormData] = useState<Partial<MeetingMinutes>>({
    empresa: initialData?.empresa || "",
    cnpj: initialData?.cnpj || "",
    tipoReuniao: initialData?.tipoReuniao || "apresentacao",
    dataReuniao: initialData?.dataReuniao || new Date(),
    horaInicio: initialData?.horaInicio || "",
    horaFim: initialData?.horaFim || "",
    participantes: initialData?.participantes || [],
    objetivos: initialData?.objetivos || "",
    pauta: initialData?.pauta || "",
    discussao: initialData?.discussao || "",
    decisoes: initialData?.decisoes || "",
    proximosPassos: initialData?.proximosPassos || "",
    observacoes: initialData?.observacoes || "",
    consultorNome: initialData?.consultorNome || "João Silva",
    leadId: initialData?.leadId,
    negociacaoId: initialData?.negociacaoId,
  });

  const [participantInput, setParticipantInput] = useState("");

  const handleChange = (field: keyof MeetingMinutes, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddParticipant = () => {
    if (participantInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        participantes: [...(prev.participantes || []), participantInput.trim()],
      }));
      setParticipantInput("");
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participantes: prev.participantes?.filter((_, i) => i !== index),
    }));
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = mockLeads.find((l) => l.id === leadId);
    if (lead) {
      setFormData((prev) => ({
        ...prev,
        leadId,
        empresa: lead.nomeFantasia || lead.razaoSocial,
        cnpj: lead.cnpj,
      }));
    }
  };

  const handleSave = () => {
    if (!formData.empresa || !formData.cnpj || !formData.dataReuniao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha empresa, CNPJ e data da reunião.",
        variant: "destructive",
      });
      return;
    }
    onSave({
      ...formData,
      id: initialData?.id || crypto.randomUUID(),
      status: "realizada",
      dataArmazenamento: new Date(),
      arquivada: false,
      historico: [],
    });
    toast({
      title: "Ata armazenada",
      description: "A ata foi salva no repositório de reuniões.",
    });
  };

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf(formData);
    }
    toast({
      title: "PDF gerado",
      description: "A ata foi exportada em formato PDF.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Loft Branding */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl">Ata de Reunião</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(formData.dataReuniao || new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              Loft CRM
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            Informações da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vincular a Contato</Label>
              <Select onValueChange={handleLeadSelect} value={formData.leadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar contato existente..." />
                </SelectTrigger>
                <SelectContent>
                  {mockLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.nomeFantasia || lead.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Reunião *</Label>
              <Select
                value={formData.tipoReuniao}
                onValueChange={(value) => handleChange("tipoReuniao", value as MeetingType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(meetingTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Input
                value={formData.empresa}
                onChange={(e) => handleChange("empresa", e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data *
              </Label>
              <Input
                type="date"
                value={formData.dataReuniao ? format(formData.dataReuniao, "yyyy-MM-dd") : ""}
                onChange={(e) => handleChange("dataReuniao", new Date(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hora Início
              </Label>
              <Input
                type="time"
                value={formData.horaInicio}
                onChange={(e) => handleChange("horaInicio", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hora Fim
              </Label>
              <Input
                type="time"
                value={formData.horaFim}
                onChange={(e) => handleChange("horaFim", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Participantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              placeholder="Nome do participante"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddParticipant())}
            />
            <Button type="button" onClick={handleAddParticipant} variant="outline">
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.participantes?.map((p, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveParticipant(index)}
              >
                {p} ×
              </Badge>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Consultor Responsável</Label>
            <Input value={formData.consultorNome} disabled className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Meeting Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Conteúdo da Reunião
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Objetivos</Label>
            <Textarea
              value={formData.objetivos}
              onChange={(e) => handleChange("objetivos", e.target.value)}
              placeholder="Quais eram os objetivos desta reunião?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Pauta</Label>
            <Textarea
              value={formData.pauta}
              onChange={(e) => handleChange("pauta", e.target.value)}
              placeholder="Liste os tópicos discutidos..."
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Discussão</Label>
            <Textarea
              value={formData.discussao}
              onChange={(e) => handleChange("discussao", e.target.value)}
              placeholder="Resuma os principais pontos discutidos..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Decisões</Label>
            <Textarea
              value={formData.decisoes}
              onChange={(e) => handleChange("decisoes", e.target.value)}
              placeholder="Quais decisões foram tomadas?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Próximos Passos</Label>
            <Textarea
              value={formData.proximosPassos}
              onChange={(e) => handleChange("proximosPassos", e.target.value)}
              placeholder="Quais são as próximas ações?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              placeholder="Notas adicionais (opcional)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleExportPdf} className="gap-2">
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </Button>
        <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4" />
          Armazenar Ata
        </Button>
      </div>
    </div>
  );
}
