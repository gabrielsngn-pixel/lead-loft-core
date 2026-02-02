import { useState } from "react";
import { Material, MaterialUsage } from "@/types/materials";
import { mockLeads, mockNegotiations } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Play, Building2, Briefcase } from "lucide-react";

interface UseMaterialDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (usage: Partial<MaterialUsage>) => void;
}

export function UseMaterialDialog({
  material,
  open,
  onOpenChange,
  onConfirm,
}: UseMaterialDialogProps) {
  const [leadId, setLeadId] = useState<string>("");
  const [negociacaoId, setNegociacaoId] = useState<string>("");
  const [contexto, setContexto] = useState<string>("");
  const { toast } = useToast();

  // Get active leads (with responsible person)
  const activeLeads = mockLeads.filter(l => l.responsavelId);
  
  // Get negotiations for selected lead
  const availableNegotiations = leadId 
    ? mockNegotiations.filter(n => n.leadId === leadId)
    : mockNegotiations;

  const handleConfirm = () => {
    const usage: Partial<MaterialUsage> = {
      materialId: material?.id,
      leadId: leadId || undefined,
      leadName: leadId ? activeLeads.find(l => l.id === leadId)?.nomeFantasia || activeLeads.find(l => l.id === leadId)?.razaoSocial : undefined,
      negociacaoId: negociacaoId || undefined,
      contexto: contexto || undefined,
      dataUso: new Date(),
    };

    onConfirm?.(usage);
    
    toast({
      title: "Material utilizado",
      description: `"${material?.titulo}" foi registrado como utilizado${usage.leadName ? ` para ${usage.leadName}` : ""}.`,
    });

    // Reset form
    setLeadId("");
    setNegociacaoId("");
    setContexto("");
    onOpenChange(false);
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Usar Material
          </DialogTitle>
          <DialogDescription>
            Registre o uso de "{material.titulo}" para acompanhamento de conversão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lead Selection */}
          <div className="space-y-2">
            <Label htmlFor="lead" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Vincular a Contato (opcional)
            </Label>
            <Select value={leadId || "none"} onValueChange={(v) => setLeadId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {activeLeads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nomeFantasia || lead.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Negotiation Selection */}
          <div className="space-y-2">
            <Label htmlFor="negociacao" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Vincular a Negociação (opcional)
            </Label>
            <Select value={negociacaoId || "none"} onValueChange={(v) => setNegociacaoId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma negociação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {availableNegotiations.map((neg) => (
                  <SelectItem key={neg.id} value={neg.id}>
                    {neg.titulo} - {neg.lead.nomeFantasia || neg.lead.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="contexto">Contexto de uso (opcional)</Label>
            <Textarea
              id="contexto"
              placeholder="Ex: Reunião de apresentação, envio por email..."
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="btn-cta">
            <Play className="w-4 h-4 mr-2" />
            Confirmar Uso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
