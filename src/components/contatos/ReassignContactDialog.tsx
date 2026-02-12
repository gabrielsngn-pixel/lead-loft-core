import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";

interface ConsultorOption {
  user_id: string;
  nome: string;
}

interface ReassignContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Lead | null;
  onReassign: (contact: Lead, consultorId: string, consultorNome: string) => Promise<void>;
}

export function ReassignContactDialog({
  open,
  onOpenChange,
  contact,
  onReassign,
}: ReassignContactDialogProps) {
  const [consultores, setConsultores] = useState<ConsultorOption[]>([]);
  const [selectedConsultor, setSelectedConsultor] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedConsultor("");
    setFetching(true);
    supabase
      .from("profiles")
      .select("user_id, nome, role")
      .neq("role", "pending")
      .order("nome")
      .then(({ data }) => {
        setConsultores(
          (data || [])
            .filter((p) => p.user_id !== contact?.responsavelId)
            .map((p) => ({ user_id: p.user_id, nome: p.nome }))
        );
        setFetching(false);
      });
  }, [open, contact?.responsavelId]);

  const handleConfirm = async () => {
    if (!contact || !selectedConsultor) return;
    const consultor = consultores.find((c) => c.user_id === selectedConsultor);
    if (!consultor) return;
    setLoading(true);
    try {
      await onReassign(contact, consultor.user_id, consultor.nome);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Atribuir Contato a Consultor
          </DialogTitle>
          <DialogDescription>
            Transferir <strong>{contact?.nomeContato || contact?.nomeFantasia || contact?.razaoSocial}</strong>
            {contact?.responsavelNome && (
              <> (atualmente com <strong>{contact.responsavelNome}</strong>)</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {fetching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Select value={selectedConsultor} onValueChange={setSelectedConsultor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o consultor" />
              </SelectTrigger>
              <SelectContent>
                {consultores.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedConsultor || loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Atribuir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
