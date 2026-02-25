import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContactFollowup,
  FollowupType,
  followupTypeLabels,
  followupTypeIcons,
  getFollowupColor,
} from "@/hooks/useContactFollowups";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Phone, MessageSquare, Mail, Linkedin, Smartphone, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpCellProps {
  leadId: string;
  followups: ContactFollowup[];
  onCreateFollowup: (leadId: string, tipo: FollowupType, anotacoes: string, dataAcao: string) => Promise<any>;
  onUpdateFollowup: (id: string, updates: { tipo?: FollowupType; anotacoes?: string; data_acao?: string }) => Promise<any>;
  onDeleteFollowup: (id: string) => Promise<boolean>;
}

const colorClasses = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  gray: "bg-muted-foreground/30",
};

const typeIcons: Record<FollowupType, typeof Phone> = {
  ligacao: Phone,
  whatsapp: MessageSquare,
  sms: Smartphone,
  linkedin: Linkedin,
  email: Mail,
};

export function FollowUpCell({ leadId, followups, onCreateFollowup, onUpdateFollowup, onDeleteFollowup }: FollowUpCellProps) {
  const [open, setOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<FollowupType>("ligacao");
  const [anotacoes, setAnotacoes] = useState("");
  const [dataAcao, setDataAcao] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  const color = getFollowupColor(followups);
  const latestFollowup = followups.length > 0
    ? followups.reduce((a, b) => new Date(a.data_acao) > new Date(b.data_acao) ? a : b)
    : null;

  const resetForm = () => {
    setFormMode(null);
    setEditId(null);
    setTipo("ligacao");
    setAnotacoes("");
    setDataAcao(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const handleCreate = () => {
    setFormMode("create");
    setEditId(null);
    setTipo("ligacao");
    setAnotacoes("");
    setDataAcao(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const handleEdit = (f: ContactFollowup) => {
    setFormMode("edit");
    setEditId(f.id);
    setTipo(f.tipo);
    setAnotacoes(f.anotacoes || "");
    setDataAcao(format(new Date(f.data_acao), "yyyy-MM-dd'T'HH:mm"));
  };

  const handleSubmit = async () => {
    if (formMode === "create") {
      await onCreateFollowup(leadId, tipo, anotacoes, new Date(dataAcao).toISOString());
    } else if (formMode === "edit" && editId) {
      await onUpdateFollowup(editId, { tipo, anotacoes, data_acao: new Date(dataAcao).toISOString() });
    }
    resetForm();
  };

  // Show last 5 followups
  const recentFollowups = [...followups]
    .sort((a, b) => new Date(b.data_acao).getTime() - new Date(a.data_acao).getTime())
    .slice(0, 5);

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {/* Color indicator dot */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={cn("w-3 h-3 rounded-full shrink-0", colorClasses[color])} />
          </TooltipTrigger>
          <TooltipContent>
            {color === "green" && "Follow-up recente (≤5 dias)"}
            {color === "yellow" && "Atenção: 6-7 dias sem follow-up"}
            {color === "red" && "Crítico: +7 dias sem follow-up"}
            {color === "gray" && "Nenhum follow-up registrado"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Last followup type badge */}
      {latestFollowup && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs">{followupTypeIcons[latestFollowup.tipo]}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{followupTypeLabels[latestFollowup.tipo]}</p>
              <p className="text-xs">{format(new Date(latestFollowup.data_acao), "dd/MM/yyyy HH:mm")}</p>
              {latestFollowup.anotacoes && <p className="text-xs mt-1 max-w-[200px]">{latestFollowup.anotacoes}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Popover with actions */}
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="end">
          {formMode ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                {formMode === "create" ? "Novo Follow-up" : "Editar Follow-up"}
              </h4>
              <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as FollowupType)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(followupTypeLabels) as FollowupType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {followupTypeIcons[t]} {followupTypeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data</Label>
                <Input
                  type="datetime-local"
                  value={dataAcao}
                  onChange={(e) => setDataAcao(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Anotações</Label>
                <Textarea
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  placeholder="Detalhes do contato..."
                  className="text-xs min-h-[60px]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
                  {formMode === "create" ? "Registrar" : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Follow-ups</h4>
                <Button size="sm" className="h-7 text-xs" onClick={handleCreate}>
                  <Plus className="w-3 h-3 mr-1" /> Novo
                </Button>
              </div>

              {recentFollowups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Nenhum follow-up registrado
                </p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {recentFollowups.map((f) => {
                    const Icon = typeIcons[f.tipo];
                    return (
                      <div key={f.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-xs group">
                        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{followupTypeLabels[f.tipo]}</span>
                            <span className="text-muted-foreground">
                              {format(new Date(f.data_acao), "dd/MM HH:mm")}
                            </span>
                          </div>
                          {f.anotacoes && (
                            <p className="text-muted-foreground truncate mt-0.5">{f.anotacoes}</p>
                          )}
                          <p className="text-muted-foreground/60 mt-0.5">por {f.criado_por_nome}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEdit(f)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onDeleteFollowup(f.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
