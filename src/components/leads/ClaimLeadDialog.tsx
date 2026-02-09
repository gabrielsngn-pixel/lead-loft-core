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
import { Lead } from "@/types/crm";
import { CompanyLinkSelector, CompanyOption, SelectedCompanyData } from "@/components/contatos/CompanyLinkSelector";
import { UserPlus, Loader2 } from "lucide-react";

interface ClaimLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  existingCompanies: CompanyOption[];
  onClaim: (lead: Lead, companyData?: { razaoSocial: string; nomeFantasia: string; cnpj: string }) => Promise<void>;
}

export function ClaimLeadDialog({
  open,
  onOpenChange,
  lead,
  existingCompanies,
  onClaim,
}: ClaimLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [useExistingCompany, setUseExistingCompany] = useState(false);
  const [companyData, setCompanyData] = useState<SelectedCompanyData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    isManual: false,
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && lead) {
      // Default: keep current company data
      setUseExistingCompany(false);
      setCompanyData({
        razaoSocial: lead.razaoSocial,
        nomeFantasia: lead.nomeFantasia || "",
        cnpj: lead.cnpj,
        isManual: false,
      });
    }
    onOpenChange(isOpen);
  };

  if (!lead) return null;

  const handleClaim = async () => {
    setLoading(true);
    try {
      if (useExistingCompany && companyData.razaoSocial) {
        await onClaim(lead, {
          razaoSocial: companyData.razaoSocial,
          nomeFantasia: companyData.nomeFantasia,
          cnpj: companyData.cnpj || lead.cnpj,
        });
      } else {
        await onClaim(lead);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Apropriar Lead</DialogTitle>
          </div>
          <DialogDescription>
            Apropriar <strong>{lead.nomeFantasia || lead.razaoSocial}</strong> para você.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm font-medium">Empresa atual:</p>
            <p className="text-sm">{lead.nomeFantasia || lead.razaoSocial}</p>
            <p className="text-xs font-mono text-muted-foreground">{lead.cnpj}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="changeCompany"
              checked={useExistingCompany}
              onChange={(e) => setUseExistingCompany(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="changeCompany" className="text-sm cursor-pointer">
              Vincular a outra empresa existente
            </label>
          </div>

          {useExistingCompany && (
            <CompanyLinkSelector
              existingCompanies={existingCompanies}
              value={companyData}
              onChange={setCompanyData}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleClaim} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Apropriando...
              </>
            ) : (
              "Apropriar para mim"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
