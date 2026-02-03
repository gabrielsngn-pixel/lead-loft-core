import { useState, useMemo } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Lead, CompanyType } from "@/types/crm";
import { Check, ChevronsUpDown, Linkedin } from "lucide-react";

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

const MANUAL_OPTION_VALUE = "__MANUAL__";

export function CreateContactDialog({
  open,
  onOpenChange,
  onCreateContact,
  existingCompanies,
}: CreateContactDialogProps) {
  const [formData, setFormData] = useState<NewContactData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    nomeContato: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    tipoEmpresa: "incorporadora",
    linkedin: "",
  });

  const [companySelectOpen, setCompanySelectOpen] = useState(false);
  const [selectedCompanyValue, setSelectedCompanyValue] = useState<string>("");
  const [isManualEntry, setIsManualEntry] = useState(false);

  const handleSelectCompany = (value: string) => {
    if (value === MANUAL_OPTION_VALUE) {
      setIsManualEntry(true);
      setSelectedCompanyValue("");
      setFormData((p) => ({
        ...p,
        razaoSocial: "",
        nomeFantasia: "",
        cnpj: "",
      }));
    } else {
      setIsManualEntry(false);
      setSelectedCompanyValue(value);
      const company = existingCompanies.find((c) => c.razaoSocial === value);
      if (company) {
        setFormData((p) => ({
          ...p,
          razaoSocial: company.razaoSocial,
          nomeFantasia: company.nomeFantasia || "",
          cnpj: company.cnpj,
        }));
      }
    }
    setCompanySelectOpen(false);
  };

  const handleSubmit = async () => {
    await onCreateContact(formData);
    // Reset form
    setFormData({
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      nomeContato: "",
      email: "",
      telefone: "",
      cidade: "",
      estado: "",
      tipoEmpresa: "incorporadora",
      linkedin: "",
    });
    setSelectedCompanyValue("");
    setIsManualEntry(false);
  };

  const selectedCompanyLabel = useMemo(() => {
    if (isManualEntry) return "Cadastrar nova empresa";
    if (!selectedCompanyValue) return "Selecionar empresa...";
    const company = existingCompanies.find((c) => c.razaoSocial === selectedCompanyValue);
    return company?.nomeFantasia || company?.razaoSocial || selectedCompanyValue;
  }, [selectedCompanyValue, isManualEntry, existingCompanies]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
          <DialogDescription>
            Crie um contato ativo (já atribuído a você) para seguir a jornada comercial.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company Selection */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Empresa *</Label>
            <Popover open={companySelectOpen} onOpenChange={setCompanySelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companySelectOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedCompanyLabel}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar empresa..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value={MANUAL_OPTION_VALUE}
                        onSelect={() => handleSelectCompany(MANUAL_OPTION_VALUE)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isManualEntry ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-primary font-medium">+ Cadastrar nova empresa</span>
                      </CommandItem>
                      {existingCompanies.map((company) => (
                        <CommandItem
                          key={company.cnpj}
                          value={company.razaoSocial}
                          onSelect={() => handleSelectCompany(company.razaoSocial)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCompanyValue === company.razaoSocial ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{company.nomeFantasia || company.razaoSocial}</span>
                            <span className="text-xs text-muted-foreground">{company.cnpj}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Manual entry fields - only show when manual mode */}
          {isManualEntry && (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label>Razão Social *</Label>
                <Input
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData((p) => ({ ...p, razaoSocial: e.target.value }))}
                  placeholder="Razão social da incorporadora"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData((p) => ({ ...p, nomeFantasia: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData((p) => ({ ...p, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </>
          )}

          {/* Show selected company info when not manual */}
          {!isManualEntry && selectedCompanyValue && (
            <div className="space-y-2 sm:col-span-2 bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-medium">{formData.razaoSocial}</p>
              {formData.nomeFantasia && (
                <p className="text-sm text-muted-foreground">{formData.nomeFantasia}</p>
              )}
              <p className="text-xs font-mono text-muted-foreground">{formData.cnpj}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={formData.tipoEmpresa}
              onValueChange={(v) => setFormData((p) => ({ ...p, tipoEmpresa: v as CompanyType }))}
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
              value={formData.nomeContato}
              onChange={(e) => setFormData((p) => ({ ...p, nomeContato: e.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone *</Label>
            <Input
              value={formData.telefone}
              onChange={(e) => setFormData((p) => ({ ...p, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              value={formData.cidade}
              onChange={(e) => setFormData((p) => ({ ...p, cidade: e.target.value }))}
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Input
              value={formData.estado}
              onChange={(e) => setFormData((p) => ({ ...p, estado: e.target.value }))}
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
              value={formData.linkedin}
              onChange={(e) => setFormData((p) => ({ ...p, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/perfil"
            />
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
