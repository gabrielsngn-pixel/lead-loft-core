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
import { UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/types/prospects";
import { useAuth } from "@/hooks/useAuth";
import { CompanyLinkSelector, CompanyOption, SelectedCompanyData } from "@/components/contatos/CompanyLinkSelector";

interface Consultant {
  id: string;
  nome: string;
  email: string;
}

interface AssignProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  existingCompanies: CompanyOption[];
  onAssign: (prospect: Prospect, consultantId: string, consultantName: string, companyData?: { razaoSocial: string; nomeFantasia: string; cnpj: string }) => Promise<void>;
}

export function AssignProspectDialog({
  open,
  onOpenChange,
  prospect,
  existingCompanies,
  onAssign,
}: AssignProspectDialogProps) {
  const { profile } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [companyData, setCompanyData] = useState<SelectedCompanyData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    isManual: false,
  });

  useEffect(() => {
    if (open && prospect) {
      fetchConsultants();
      setSelectedConsultant("");
      setCompanyData({
        razaoSocial: prospect.empresa,
        nomeFantasia: prospect.empresa,
        cnpj: "",
        isManual: true,
      });
    }
  }, [open, prospect]);

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
      const data = {
        razaoSocial: companyData.razaoSocial || prospect.empresa,
        nomeFantasia: companyData.nomeFantasia || prospect.empresa,
        cnpj: companyData.cnpj || "00.000.000/0000-00",
      };
      await onAssign(prospect, consultant.id, consultant.nome, data);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!prospect) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Atribuir Prospect a Consultor
          </DialogTitle>
          <DialogDescription>
            Selecione o consultor e vincule a uma empresa para criar o Contato Ativo do prospect{" "}
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

          <CompanyLinkSelector
            existingCompanies={existingCompanies}
            value={companyData}
            onChange={setCompanyData}
            defaultManualValues={{
              razaoSocial: prospect.empresa,
              nomeFantasia: prospect.empresa,
            }}
          />
        </div>

        <div className="bg-muted/20 rounded-lg p-3 text-sm space-y-1">
          <p className="font-medium text-muted-foreground">Esta ação irá:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Criar um registro em <strong>Contatos Ativos</strong></li>
            <li>Vincular o consultor selecionado como responsável</li>
            <li>Marcar o prospect como <strong>Convertido</strong></li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedConsultant || loading || !companyData.razaoSocial.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atribuindo...
              </>
            ) : (
              "Atribuir Prospect"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
