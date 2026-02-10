import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Empreendimento } from "@/types/empreendimentos";

interface Consultor {
  user_id: string;
  nome: string;
  role: string;
}

interface AssignEmpreendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimento: Empreendimento;
  onUpdate: (data: Partial<Empreendimento> & { id: string }) => void;
}

export function AssignEmpreendimentoDialog({
  open,
  onOpenChange,
  empreendimento,
  onUpdate,
}: AssignEmpreendimentoDialogProps) {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [selectedConsultor, setSelectedConsultor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadConsultores();
      setSelectedConsultor("");
    }
  }, [open]);

  const loadConsultores = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, nome, role")
      .in("role", ["consultor", "sdr", "gestor", "master"])
      .order("nome");
    setConsultores(data || []);
    setIsLoading(false);
  };

  const handleAssign = () => {
    const consultor = consultores.find((c) => c.user_id === selectedConsultor);
    if (!consultor) return;

    onUpdate({
      id: empreendimento.id,
      consultor_responsavel_id: consultor.user_id,
      consultor_responsavel_nome: consultor.nome,
      status: empreendimento.status === "mapeado" ? "em_contato" : empreendimento.status,
    } as any);

    toast({ title: `Empreendimento atribuído a ${consultor.nome}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir a Consultor</DialogTitle>
          <DialogDescription>
            Selecione o consultor responsável por "{empreendimento.nome_empreendimento}".
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Consultor</Label>
              <Select value={selectedConsultor} onValueChange={setSelectedConsultor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor..." />
                </SelectTrigger>
                <SelectContent>
                  {consultores.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.nome} ({c.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {empreendimento.consultor_responsavel_nome && (
              <p className="text-sm text-muted-foreground">
                Atualmente atribuído a: <strong>{empreendimento.consultor_responsavel_nome}</strong>
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssign} disabled={!selectedConsultor}>
                Atribuir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
