import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Prospect } from "@/types/prospects";
import { CompanyLinkSelector, CompanyOption, SelectedCompanyData } from "@/components/contatos/CompanyLinkSelector";
import { UserCheck, Loader2 } from "lucide-react";

export interface ConvertCompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
}

interface ConvertProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  onConfirm: (companyData?: ConvertCompanyData) => void;
  existingCompanies: CompanyOption[];
  loading?: boolean;
}

export function ConvertProspectDialog({
  open,
  onOpenChange,
  prospect,
  onConfirm,
  existingCompanies,
  loading,
}: ConvertProspectDialogProps) {
  const [companyData, setCompanyData] = useState<SelectedCompanyData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    isManual: false,
  });

  // Reset when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && prospect) {
      // Pre-fill with prospect's empresa as manual entry
      setCompanyData({
        razaoSocial: prospect.empresa,
        nomeFantasia: prospect.empresa,
        cnpj: "",
        isManual: true,
      });
    }
    onOpenChange(isOpen);
  };

  if (!prospect) return null;

  const handleConfirm = () => {
    const data: ConvertCompanyData = {
      razaoSocial: companyData.razaoSocial || prospect.empresa,
      nomeFantasia: companyData.nomeFantasia || prospect.empresa,
      cnpj: companyData.cnpj || "00.000.000/0000-00",
    };
    onConfirm(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Apropriar Prospect</DialogTitle>
          </div>
          <DialogDescription className="space-y-3">
            <p>
              Você está prestes a apropriar o prospect <strong>{prospect.nomeCompleto}</strong>.
            </p>
            <p className="text-sm">
              Vincule a uma empresa existente na base ou cadastre uma nova:
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
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
            <li>Vincular você como consultor responsável</li>
            <li>Marcar o prospect como <strong>Convertido</strong></li>
          </ul>
          <p className="text-warning font-medium mt-2">
            ⚠️ Esta ação não pode ser desfeita.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !companyData.razaoSocial.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Apropriando...
              </>
            ) : (
              "Apropriar Prospect"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
