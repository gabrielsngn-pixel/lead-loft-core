import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/types/prospects";
import { useAuth } from "@/hooks/useAuth";

interface Consultant {
  id: string;
  nome: string;
  email: string;
}

interface AssignProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  onAssign: (prospect: Prospect, consultantId: string, consultantName: string) => Promise<void>;
}

export function AssignProspectDialog({
  open,
  onOpenChange,
  prospect,
  onAssign,
}: AssignProspectDialogProps) {
  const { profile } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      fetchConsultants();
      setSelectedConsultant("");
    }
  }, [open]);

  const fetchConsultants = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .neq("role", "pending")
        .order("nome");

      if (error) {
        console.error("Erro ao buscar consultores:", error);
        return;
      }

      setConsultants(
        (data || []).map((p) => ({
          id: p.user_id,
          nome: p.nome,
          email: p.email,
        }))
      );
    } finally {
      setFetching(false);
    }
  };

  const handleAssign = async () => {
    if (!prospect || !selectedConsultant) return;

    const consultant = consultants.find((c) => c.id === selectedConsultant);
    if (!consultant) return;

    setLoading(true);
    try {
      await onAssign(prospect, consultant.id, consultant.nome);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!prospect) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Associar Prospect a Consultor
          </DialogTitle>
          <DialogDescription>
            Selecione o consultor que ficará responsável pelo prospect{" "}
            <strong>{prospect.nomeCompleto}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Consultor Responsável</Label>
            <Select
              value={selectedConsultant}
              onValueChange={setSelectedConsultant}
              disabled={fetching}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetching ? "Carregando..." : "Selecione um consultor"} />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.nome} ({consultant.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedConsultant || loading}
          >
            {loading ? "Associando..." : "Associar Prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
