import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMinutas, type Minuta, type Clausula, getDefaultClausulas } from "@/hooks/useMinutas";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  Download,
  Eye,
  ArrowUp,
  ArrowDown,
  Search,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

// ==========================================
// PDF GENERATION
// ==========================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function generateMinutaHtml(minuta: Minuta): string {
  const dataFormatada = minuta.data_assinatura
    ? format(new Date(minuta.data_assinatura), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const enderecoCompleto = [minuta.endereco, minuta.cidade, minuta.estado]
    .filter(Boolean)
    .join(", ");

  const projeto = (minuta.dados_projeto || {}) as Record<string, number | boolean | string>;

  const clausulasHtml = minuta.clausulas
    .map(
      (c) => `
    <h2 class="section-title">${c.titulo}</h2>
    <div style="margin-bottom: 24px; white-space: pre-line;">${c.conteudo}</div>
  `
    )
    .join("\n");

  const condicoesRows = [
    `<tr><td>Empreendimento:</td><td class="right">${minuta.nome_empreendimento}</td></tr>`,
    projeto.vgvTotal ? `<tr><td>Estimativa de VGV Potencial:</td><td class="right">${formatCurrency(Number(projeto.vgvTotal))}</td></tr>` : "",
    projeto.unidades ? `<tr><td>Estimativa de unidades potenciais:</td><td class="right">${projeto.unidades} unidades</td></tr>` : "",
    projeto.ticketMedio ? `<tr><td>Ticket médio estimado:</td><td class="right">${formatCurrency(Number(projeto.ticketMedio))}</td></tr>` : "",
    Number(projeto.comissaoIncorporador) > 0 ? `<tr><td>Comissão da incorporadora:</td><td class="right">${formatPercent(Number(projeto.comissaoIncorporador))}</td></tr>` : "",
  ].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Minuta_${minuta.empresa_nome.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; font-size: 11pt; line-height: 1.6; color: #000; background: white; padding: 40px 50px; }
    h1, h2 { font-weight: 700; }
    p { margin-bottom: 8px; text-align: justify; }
    .header { display: flex; justify-content: flex-end; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #FF774A; }
    .header p { color: #666; font-size: 10pt; }
    .title { text-align: center; font-size: 14pt; color: #FF774A; font-weight: 700; margin-bottom: 32px; }
    .box { padding: 16px; margin-bottom: 16px; border-left: 3px solid #FF774A; background: #fafafa; }
    .section-title { color: #FF774A; font-weight: 700; margin-bottom: 12px; margin-top: 24px; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 12px; }
    .table tr:not(:last-child) { border-bottom: 1px solid #eee; }
    .table .right { text-align: right; font-weight: 700; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 32px 0; }
    .sig-box { padding: 16px; border: 1px solid #eee; border-radius: 4px; background: #fafafa; }
    .sig-box .name { color: #FF774A; font-weight: 700; margin-bottom: 4px; }
    .sig-box .cnpj { font-size: 10pt; margin-bottom: 16px; }
    .sig-line { border-bottom: 1px solid #000; height: 32px; margin-bottom: 8px; }
    .footer { text-align: center; padding: 16px; margin-top: 32px; background: #fafafa; border-radius: 4px; }
    .footer p { font-size: 9pt; font-style: italic; color: #666; }
    @media print { body { padding: 20px 30px; } @page { margin: 15mm; size: A4; } }
  </style>
</head>
<body>
  <div class="header"><p>São Paulo, ${dataFormatada}</p></div>
  <h1 class="title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO DE CRÉDITO IMOBILIÁRIO, REPASSE E REGISTRO</h1>

  <p>Pelo presente instrumento particular e na melhor forma de direito, de um lado:</p>
  <div class="box">
    <p><strong>LOFT INTERMEDIADORA LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº <strong>04.113.052/0001-25</strong>, com sede na cidade de São Paulo/SP, doravante denominada simplesmente "<strong>CONTRATADA</strong>" ou "<strong>LOFT</strong>";</p>
  </div>
  <p>E, de outro lado:</p>
  <div class="box">
    <p><strong>${minuta.empresa_nome}</strong>${minuta.nome_fantasia ? `, nome fantasia "${minuta.nome_fantasia}"` : ""}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob nº <strong>${minuta.cnpj || "___"}</strong>, com sede em ${enderecoCompleto || "___"}, neste ato representada por seu(sua) representante legal, <strong>${minuta.representante_legal || "___"}</strong>, portador(a) do CPF nº <strong>${minuta.cpf_representante || "___"}</strong>, doravante denominada simplesmente "<strong>CONTRATANTE</strong>" ou "<strong>INCORPORADORA</strong>";</p>
  </div>
  <p style="margin-bottom: 32px;">Têm entre si, justo e acordado, celebrar o presente Contrato de Prestação de Serviços de Intermediação de Crédito Imobiliário, Repasse e Registro, referente ao empreendimento "<strong>${minuta.nome_empreendimento}</strong>".</p>

  ${condicoesRows ? `<div class="box"><table class="table">${condicoesRows}</table></div>` : ""}

  ${clausulasHtml}

  <p style="margin-top: 32px;">E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.</p>
  <p style="text-align: center; margin: 32px 0;">São Paulo, ${dataFormatada}.</p>

  <h2 style="text-align: center; color: #FF774A; text-decoration: underline; margin-bottom: 24px;">ASSINATURAS</h2>
  <div class="signatures">
    <div class="sig-box">
      <p class="name">LOFT INTERMEDIADORA LTDA</p>
      <p class="cnpj">CNPJ: 04.113.052/0001-25</p>
      <div class="sig-line"></div>
      <p style="font-size: 10pt;">Nome: _________________________</p>
      <p style="font-size: 10pt;">Cargo: _________________________</p>
    </div>
    <div class="sig-box">
      <p class="name">${minuta.empresa_nome}</p>
      <p class="cnpj">CNPJ: ${minuta.cnpj || "___"}</p>
      <div class="sig-line"></div>
      <p style="font-size: 10pt;">Nome: ${minuta.representante_legal || "___"}</p>
      <p style="font-size: 10pt;">CPF: ${minuta.cpf_representante || "___"}</p>
    </div>
  </div>
  <h2 style="font-weight: 700; margin-bottom: 16px;">TESTEMUNHAS:</h2>
  <div class="signatures">
    <div><div class="sig-line"></div><p style="font-size: 10pt;">Nome: _________________________</p><p style="font-size: 10pt;">CPF: _________________________</p></div>
    <div><div class="sig-line"></div><p style="font-size: 10pt;">Nome: _________________________</p><p style="font-size: 10pt;">CPF: _________________________</p></div>
  </div>
  <div class="footer">
    <p>"Ao assinar este documento, as partes concordam integralmente com as condições comerciais aprovadas na simulação de viabilidade."</p>
    <p style="margin-top: 8px; font-style: normal; color: #999;">Contrato #${minuta.numero_contrato}</p>
  </div>
</body>
</html>`;
}

function exportMinutaPdf(minuta: Minuta) {
  const html = generateMinutaHtml(minuta);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// ==========================================
// CLAUSE EDITOR COMPONENT
// ==========================================

interface ClausulaEditorProps {
  clausulas: Clausula[];
  onChange: (clausulas: Clausula[]) => void;
}

function ClausulaEditor({ clausulas, onChange }: ClausulaEditorProps) {
  const moveClausula = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= clausulas.length) return;
    const updated = [...clausulas];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const updateClausula = (index: number, field: "titulo" | "conteudo", value: string) => {
    const updated = [...clausulas];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeClausula = (index: number) => {
    onChange(clausulas.filter((_, i) => i !== index));
  };

  const addClausula = () => {
    onChange([
      ...clausulas,
      {
        id: crypto.randomUUID(),
        titulo: "NOVA CLÁUSULA",
        conteudo: "",
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {clausulas.map((clausula, index) => (
        <Card key={clausula.id} className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={clausula.titulo}
                onChange={(e) => updateClausula(index, "titulo", e.target.value)}
                className="font-semibold text-sm border-none shadow-none px-0 h-auto focus-visible:ring-0"
                style={{ color: "hsl(var(--primary))" }}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveClausula(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveClausula(index, "down")}
                  disabled={index === clausulas.length - 1}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cláusula?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A cláusula "{clausula.titulo}" será removida.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeClausula(index)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={clausula.conteudo}
              onChange={(e) => updateClausula(index, "conteudo", e.target.value)}
              className="min-h-[120px] text-sm"
              placeholder="Conteúdo da cláusula..."
            />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addClausula} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Cláusula
      </Button>
    </div>
  );
}

// ==========================================
// CREATE MINUTA DIALOG
// ==========================================

interface LeadOption {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  nome_contato: string | null;
}

interface CreateMinutaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: any) => void;
}

function CreateMinutaDialog({ open, onOpenChange, onCreate }: CreateMinutaDialogProps) {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [leadSearch, setLeadSearch] = useState("");
  const [formData, setFormData] = useState({
    nome_empreendimento: "Empreendimento Exemplo",
    representante_legal: "",
    cpf_representante: "",
    endereco: "",
    // Mock project data
    vgvTotal: 50000000,
    unidades: 200,
    ticketMedio: 250000,
    comissaoIncorporador: 0,
    hasRegistro: false,
  });

  useEffect(() => {
    if (open) {
      supabase
        .from("leads")
        .select("id, razao_social, nome_fantasia, cnpj, email, telefone, cidade, estado, nome_contato")
        .order("razao_social")
        .then(({ data }) => {
          if (data) setLeads(data as LeadOption[]);
        });
    }
  }, [open]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const filteredLeads = leads.filter(
    (l) =>
      l.razao_social.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.nome_fantasia || "").toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.cnpj.includes(leadSearch)
  );

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setFormData((prev) => ({
        ...prev,
        endereco: `${lead.cidade}/${lead.estado}`,
        representante_legal: lead.nome_contato || "",
      }));
    }
  };

  const handleCreate = () => {
    if (!selectedLead || !profile) return;

    const numero = `LOFT-${Date.now().toString(36).toUpperCase()}`;
    const clausulas = getDefaultClausulas(formData.hasRegistro);

    onCreate({
      negotiation_id: null,
      viabilidade_id: null,
      nome_empreendimento: formData.nome_empreendimento,
      empresa_nome: selectedLead.razao_social,
      cnpj: selectedLead.cnpj,
      endereco: formData.endereco,
      cidade: selectedLead.cidade,
      estado: selectedLead.estado,
      representante_legal: formData.representante_legal || null,
      cpf_representante: formData.cpf_representante || null,
      nome_fantasia: selectedLead.nome_fantasia,
      dados_projeto: {
        vgvTotal: formData.vgvTotal,
        unidades: formData.unidades,
        ticketMedio: formData.ticketMedio,
        comissaoIncorporador: formData.comissaoIncorporador,
      },
      clausulas,
      numero_contrato: numero,
      data_assinatura: new Date().toISOString(),
      criado_por: profile.user_id,
      criado_por_nome: profile.nome,
    });

    onOpenChange(false);
    setSelectedLeadId("");
    setLeadSearch("");
    setFormData({
      nome_empreendimento: "Empreendimento Exemplo",
      representante_legal: "",
      cpf_representante: "",
      endereco: "",
      vgvTotal: 50000000,
      unidades: 200,
      ticketMedio: 250000,
      comissaoIncorporador: 0,
      hasRegistro: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Criar Nova Minuta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Company selection */}
          <div className="space-y-2">
            <Label className="font-semibold">Selecionar Empresa (Contato Ativo)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="max-h-40 border rounded-md">
              {filteredLeads.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma empresa encontrada</p>
              ) : (
                <div className="p-1">
                  {filteredLeads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedLeadId === lead.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectLead(lead.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.razao_social}</p>
                          <p className="text-xs text-muted-foreground">
                            CNPJ: {lead.cnpj} • {lead.cidade}/{lead.estado}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedLead && (
            <>
              {/* Auto-filled company data */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 space-y-1 text-sm">
                  <p><strong>Empresa:</strong> {selectedLead.razao_social}</p>
                  {selectedLead.nome_fantasia && <p><strong>Nome Fantasia:</strong> {selectedLead.nome_fantasia}</p>}
                  <p><strong>CNPJ:</strong> {selectedLead.cnpj}</p>
                  <p><strong>Localização:</strong> {selectedLead.cidade}/{selectedLead.estado}</p>
                </CardContent>
              </Card>

              {/* Editable fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome do Empreendimento</Label>
                  <Input
                    value={formData.nome_empreendimento}
                    onChange={(e) => setFormData((p) => ({ ...p, nome_empreendimento: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData((p) => ({ ...p, endereco: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Representante Legal</Label>
                  <Input
                    value={formData.representante_legal}
                    onChange={(e) => setFormData((p) => ({ ...p, representante_legal: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF do Representante</Label>
                  <Input
                    value={formData.cpf_representante}
                    onChange={(e) => setFormData((p) => ({ ...p, cpf_representante: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* Mock project data */}
              <div>
                <Label className="font-semibold">Dados do Projeto (editáveis)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">VGV Total (R$)</Label>
                    <Input
                      type="number"
                      value={formData.vgvTotal}
                      onChange={(e) => setFormData((p) => ({ ...p, vgvTotal: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Unidades</Label>
                    <Input
                      type="number"
                      value={formData.unidades}
                      onChange={(e) => setFormData((p) => ({ ...p, unidades: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ticket Médio (R$)</Label>
                    <Input
                      type="number"
                      value={formData.ticketMedio}
                      onChange={(e) => setFormData((p) => ({ ...p, ticketMedio: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Comissão Inc. (%)</Label>
                    <Input
                      type="number"
                      value={formData.comissaoIncorporador}
                      onChange={(e) => setFormData((p) => ({ ...p, comissaoIncorporador: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="hasRegistro"
                    checked={formData.hasRegistro}
                    onChange={(e) => setFormData((p) => ({ ...p, hasRegistro: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="hasRegistro" className="text-sm">Incluir cláusula de Registro</Label>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={!formData.nome_empreendimento}>
                <FileText className="w-4 h-4 mr-2" />
                Criar Minuta
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MINUTA DETAIL DIALOG
// ==========================================

interface MinutaDetailDialogProps {
  minuta: Minuta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (minuta: Minuta) => void;
}

function MinutaDetailDialog({ minuta, open, onOpenChange, onSave }: MinutaDetailDialogProps) {
  const [editedClausulas, setEditedClausulas] = useState<Clausula[]>([]);
  const [editedFields, setEditedFields] = useState({
    nome_empreendimento: "",
    empresa_nome: "",
    nome_fantasia: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    representante_legal: "",
    cpf_representante: "",
    dados_projeto: {} as Record<string, unknown>,
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && minuta) {
      setEditedClausulas([...minuta.clausulas]);
      setEditedFields({
        nome_empreendimento: minuta.nome_empreendimento,
        empresa_nome: minuta.empresa_nome,
        nome_fantasia: minuta.nome_fantasia || "",
        cnpj: minuta.cnpj || "",
        endereco: minuta.endereco || "",
        cidade: minuta.cidade || "",
        estado: minuta.estado || "",
        representante_legal: minuta.representante_legal || "",
        cpf_representante: minuta.cpf_representante || "",
        dados_projeto: (minuta.dados_projeto || {}) as Record<string, unknown>,
      });
      setIsEditing(false);
    }
    onOpenChange(isOpen);
  };

  if (!minuta) return null;

  const handleSave = () => {
    onSave({
      ...minuta,
      ...editedFields,
      nome_fantasia: editedFields.nome_fantasia || null,
      cnpj: editedFields.cnpj || null,
      endereco: editedFields.endereco || null,
      cidade: editedFields.cidade || null,
      estado: editedFields.estado || null,
      representante_legal: editedFields.representante_legal || null,
      cpf_representante: editedFields.cpf_representante || null,
      clausulas: editedClausulas,
    });
    setIsEditing(false);
  };

  const projeto = editedFields.dados_projeto;

  const updateField = (field: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  };

  const updateProjeto = (field: string, value: number) => {
    setEditedFields((prev) => ({
      ...prev,
      dados_projeto: { ...prev.dados_projeto, [field]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {minuta.nome_empreendimento} — {minuta.empresa_nome}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Contrato #{minuta.numero_contrato}</p>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b pb-3">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!isEditing) {
                setEditedClausulas([...minuta.clausulas]);
                setEditedFields({
                  nome_empreendimento: minuta.nome_empreendimento,
                  empresa_nome: minuta.empresa_nome,
                  nome_fantasia: minuta.nome_fantasia || "",
                  cnpj: minuta.cnpj || "",
                  endereco: minuta.endereco || "",
                  cidade: minuta.cidade || "",
                  estado: minuta.estado || "",
                  representante_legal: minuta.representante_legal || "",
                  cpf_representante: minuta.cpf_representante || "",
                  dados_projeto: (minuta.dados_projeto || {}) as Record<string, unknown>,
                });
              }
              setIsEditing(!isEditing);
            }}
          >
            <Pencil className="w-4 h-4 mr-1" />
            {isEditing ? "Editando..." : "Editar Contrato"}
          </Button>
          {isEditing && (
            <Button size="sm" onClick={handleSave}>
              Salvar Alterações
            </Button>
          )}
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMinutaPdf(isEditing ? { ...minuta, ...editedFields, clausulas: editedClausulas } as Minuta : minuta)}
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="py-4 space-y-6">
            {isEditing ? (
              <>
                {/* Editable header fields */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" style={{ color: "hsl(var(--primary))" }}>
                      Dados da Contratante (Incorporadora)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Razão Social</Label>
                        <Input value={editedFields.empresa_nome} onChange={(e) => updateField("empresa_nome", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                        <Input value={editedFields.nome_fantasia} onChange={(e) => updateField("nome_fantasia", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">CNPJ</Label>
                        <Input value={editedFields.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Endereço / Sede</Label>
                        <Input value={editedFields.endereco} onChange={(e) => updateField("endereco", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Cidade</Label>
                        <Input value={editedFields.cidade} onChange={(e) => updateField("cidade", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Estado</Label>
                        <Input value={editedFields.estado} onChange={(e) => updateField("estado", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Representante Legal</Label>
                        <Input value={editedFields.representante_legal} onChange={(e) => updateField("representante_legal", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">CPF do Representante</Label>
                        <Input value={editedFields.cpf_representante} onChange={(e) => updateField("cpf_representante", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Editable project data */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm" style={{ color: "hsl(var(--primary))" }}>
                      Dados do Empreendimento / Projeto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome do Empreendimento</Label>
                        <Input value={editedFields.nome_empreendimento} onChange={(e) => updateField("nome_empreendimento", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">VGV Total (R$)</Label>
                        <Input type="number" value={Number(projeto.vgvTotal || 0)} onChange={(e) => updateProjeto("vgvTotal", Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Unidades</Label>
                        <Input type="number" value={Number(projeto.unidades || 0)} onChange={(e) => updateProjeto("unidades", Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ticket Médio (R$)</Label>
                        <Input type="number" value={Number(projeto.ticketMedio || 0)} onChange={(e) => updateProjeto("ticketMedio", Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Comissão Incorporador (%)</Label>
                        <Input type="number" value={Number(projeto.comissaoIncorporador || 0)} onChange={(e) => updateProjeto("comissaoIncorporador", Number(e.target.value))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Editable clauses */}
                <div>
                  <h3 className="font-semibold text-sm mb-3" style={{ color: "hsl(var(--primary))" }}>
                    Cláusulas do Contrato
                  </h3>
                  <ClausulaEditor clausulas={editedClausulas} onChange={setEditedClausulas} />
                </div>
              </>
            ) : (
              <>
                {/* Read-only header */}
                <Card className="border-muted">
                  <CardContent className="pt-4 space-y-1 text-sm">
                    <p><strong>Empresa:</strong> {minuta.empresa_nome}{minuta.nome_fantasia ? ` (${minuta.nome_fantasia})` : ""}</p>
                    <p><strong>CNPJ:</strong> {minuta.cnpj || "—"}</p>
                    <p><strong>Endereço:</strong> {[minuta.endereco, minuta.cidade, minuta.estado].filter(Boolean).join(", ") || "—"}</p>
                    <p><strong>Representante:</strong> {minuta.representante_legal || "—"} {minuta.cpf_representante ? `(CPF: ${minuta.cpf_representante})` : ""}</p>
                    <p><strong>Empreendimento:</strong> {minuta.nome_empreendimento}</p>
                  </CardContent>
                </Card>

                {/* Read-only clauses */}
                <div className="space-y-6">
                  {minuta.clausulas.map((clausula) => (
                    <div key={clausula.id}>
                      <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(var(--primary))" }}>
                        {clausula.titulo}
                      </h3>
                      <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
                        {clausula.conteudo}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function Minutas() {
  const { minutas, isLoading, updateMinuta, createMinuta } = useMinutas();
  const [selectedMinuta, setSelectedMinuta] = useState<Minuta | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMinutas = minutas.filter(
    (m) =>
      m.nome_empreendimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.numero_contrato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (updated: Minuta) => {
    updateMinuta.mutate({
      id: updated.id,
      clausulas: updated.clausulas,
      nome_empreendimento: updated.nome_empreendimento,
      empresa_nome: updated.empresa_nome,
      cnpj: updated.cnpj,
      endereco: updated.endereco,
      cidade: updated.cidade,
      estado: updated.estado,
      representante_legal: updated.representante_legal,
      cpf_representante: updated.cpf_representante,
      nome_fantasia: updated.nome_fantasia,
      dados_projeto: updated.dados_projeto,
    });
    setSelectedMinuta(updated);
  };

  const handleCreate = (data: any) => {
    createMinuta.mutate(data);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minutas</h1>
            <p className="text-muted-foreground text-sm">
              Contratos editáveis gerados a partir do simulador de viabilidade
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{minutas.length} minutas</Badge>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Minuta
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empreendimento, empresa ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredMinutas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                {searchTerm ? "Nenhuma minuta encontrada" : "Nenhuma minuta disponível"}
              </h3>
              <p className="text-sm text-muted-foreground/70 max-w-md">
                As minutas são criadas automaticamente ao aprovar um projeto no simulador de viabilidade.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMinutas.map((minuta) => (
              <Card
                key={minuta.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  setSelectedMinuta(minuta);
                  setDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">
                        {minuta.nome_empreendimento}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">{minuta.empresa_nome}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      #{minuta.numero_contrato.split("-").pop()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{minuta.clausulas.length} cláusulas</span>
                    <span>•</span>
                    <span>
                      {format(new Date(minuta.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Criado por {minuta.criado_por_nome}
                  </p>
                  <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportMinutaPdf(minuta);
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MinutaDetailDialog
        minuta={selectedMinuta}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />

      <CreateMinutaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />
    </AppLayout>
  );
}
