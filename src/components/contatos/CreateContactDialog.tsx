import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyType } from "@/types/crm";
import { Linkedin } from "lucide-react";
import { CompanyLinkSelector, CompanyOption, SelectedCompanyData } from "./CompanyLinkSelector";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateContact: (data: NewContactData) => Promise<void>;
  existingCompanies: UniqueCompany[];
}

export interface UniqueCompany {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
}

export interface NewContactData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  nomeContato: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  tipoEmpresa: CompanyType;
  linkedin: string;
}

const companyTypeConfig: Record<CompanyType, { label: string }> = {
  incorporadora: { label: "Incorporadora" },
  banco: { label: "Banco" },
  fundo: { label: "Fundo" },
  canal: { label: "Canal" },
  outro: { label: "Outro" },
};

export function CreateContactDialog({
  open,
  onOpenChange,
  onCreateContact,
  existingCompanies,
}: CreateContactDialogProps) {
  const [companyData, setCompanyData] = useState<SelectedCompanyData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    isManual: false,
  });

  const [contactFields, setContactFields] = useState({
    nomeContato: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    tipoEmpresa: "incorporadora" as CompanyType,
    linkedin: "",
  });

  const handleSubmit = async () => {
    await onCreateContact({
      razaoSocial: companyData.razaoSocial,
      nomeFantasia: companyData.nomeFantasia,
      cnpj: companyData.cnpj,
      ...contactFields,
    });
    // Reset form
    setCompanyData({ razaoSocial: "", nomeFantasia: "", cnpj: "", isManual: false });
    setContactFields({
      nomeContato: "",
      email: "",
      telefone: "",
      cidade: "",
      estado: "",
      tipoEmpresa: "incorporadora",
      linkedin: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
          <DialogDescription>
            Crie um contato ativo (já atribuído a você) para seguir a jornada comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company Selection */}
          <CompanyLinkSelector
            existingCompanies={existingCompanies}
            value={companyData}
            onChange={setCompanyData}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={contactFields.tipoEmpresa}
                onValueChange={(v) => setContactFields((p) => ({ ...p, tipoEmpresa: v as CompanyType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(companyTypeConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Contato</Label>
              <Input
                value={contactFields.nomeContato}
                onChange={(e) => setContactFields((p) => ({ ...p, nomeContato: e.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                value={contactFields.email}
                onChange={(e) => setContactFields((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                value={contactFields.telefone}
                onChange={(e) => setContactFields((p) => ({ ...p, telefone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={contactFields.cidade}
                onChange={(e) => setContactFields((p) => ({ ...p, cidade: e.target.value }))}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={contactFields.estado}
                onChange={(e) => setContactFields((p) => ({ ...p, estado: e.target.value }))}
                placeholder="UF"
              />
            </div>

            {/* LinkedIn field */}
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-[#0077B5]" />
                LinkedIn (opcional)
              </Label>
              <Input
                value={contactFields.linkedin}
                onChange={(e) => setContactFields((p) => ({ ...p, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/perfil"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Criar contato</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
