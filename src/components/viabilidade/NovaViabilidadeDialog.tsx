import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface NovaViabilidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  preSelectedLeadId?: string;
  preSelectedContatoId?: string;
  preSelectedNegocioId?: string;
}

export function NovaViabilidadeDialog({
  open,
  onOpenChange,
  onSuccess,
  preSelectedLeadId,
  preSelectedContatoId,
  preSelectedNegocioId,
}: NovaViabilidadeDialogProps) {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [origem, setOrigem] = useState<"manual" | "lead" | "contato" | "negocio">("manual");
  
  const [formData, setFormData] = useState({
    nome_empreendimento: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    observacoes: "",
    lead_id: preSelectedLeadId || "",
    contato_id: preSelectedContatoId || "",
    negocio_id: preSelectedNegocioId || "",
  });

  useEffect(() => {
    if (preSelectedLeadId) {
      setOrigem("lead");
      setFormData(prev => ({ ...prev, lead_id: preSelectedLeadId }));
    } else if (preSelectedContatoId) {
      setOrigem("contato");
      setFormData(prev => ({ ...prev, contato_id: preSelectedContatoId }));
    } else if (preSelectedNegocioId) {
      setOrigem("negocio");
      setFormData(prev => ({ ...prev, negocio_id: preSelectedNegocioId }));
    }
  }, [preSelectedLeadId, preSelectedContatoId, preSelectedNegocioId]);

  const handleCreate = async () => {
    if (!user || !profile) return;
    if (!formData.nome_empreendimento.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o nome do empreendimento.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const insertData: any = {
        nome_empreendimento: formData.nome_empreendimento,
        cnpj: formData.cnpj || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        observacoes: formData.observacoes || null,
        solicitado_por: user.id,
        solicitado_por_nome: profile.nome,
        status: "pendente",
      };

      // Vincular à origem selecionada
      if (origem === "lead" && formData.lead_id) {
        insertData.lead_id = formData.lead_id;
      } else if (origem === "contato" && formData.contato_id) {
        insertData.contato_id = formData.contato_id;
      } else if (origem === "negocio" && formData.negocio_id) {
        insertData.negocio_id = formData.negocio_id;
      }

      const { error } = await supabase.from("viabilidades").insert(insertData);

      if (error) throw error;

      toast({
        title: "Viabilidade criada!",
        description: "O estudo foi criado e está pronto para simulação.",
      });

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating viabilidade:", error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a viabilidade.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_empreendimento: "",
      cnpj: "",
      endereco: "",
      cidade: "",
      estado: "",
      observacoes: "",
      lead_id: "",
      contato_id: "",
      negocio_id: "",
    });
    setOrigem("manual");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Viabilidade</DialogTitle>
          <DialogDescription>
            Cadastre um novo estudo de viabilidade para simulação financeira
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Origem do Estudo</Label>
            <Select value={origem} onValueChange={(v) => setOrigem(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Cadastro Manual</SelectItem>
                <SelectItem value="lead">Vincular a Lead</SelectItem>
                <SelectItem value="contato">Vincular a Contato</SelectItem>
                <SelectItem value="negocio">Vincular a Negócio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome do Empreendimento *</Label>
            <Input
              placeholder="Ex: Residencial Vista Verde"
              value={formData.nome_empreendimento}
              onChange={(e) => setFormData({ ...formData, nome_empreendimento: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>CNPJ da Incorporadora</Label>
            <Input
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Endereço do Terreno</Label>
            <Input
              placeholder="Rua, número, bairro"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                placeholder="São Paulo"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                placeholder="SP"
                maxLength={2}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre o empreendimento..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={processing}>
            {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar e Simular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
