import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

export interface CompanyOption {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
}

export interface SelectedCompanyData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  isManual: boolean;
}

interface CompanyLinkSelectorProps {
  existingCompanies: CompanyOption[];
  value: SelectedCompanyData;
  onChange: (data: SelectedCompanyData) => void;
  /** Label above the selector */
  label?: string;
  /** Default values to pre-fill when "Cadastrar nova empresa" is selected */
  defaultManualValues?: { razaoSocial?: string; nomeFantasia?: string; cnpj?: string };
}

const MANUAL_OPTION_VALUE = "__MANUAL__";

export function CompanyLinkSelector({
  existingCompanies,
  value,
  onChange,
  label = "Empresa",
  defaultManualValues,
}: CompanyLinkSelectorProps) {
  const [open, setOpen] = useState(false);

  const displayLabel = useMemo(() => {
    if (value.isManual && value.razaoSocial) return `Nova: ${value.razaoSocial}`;
    if (value.isManual) return "Cadastrar nova empresa";
    if (value.razaoSocial) return value.nomeFantasia || value.razaoSocial;
    return "Selecionar empresa...";
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === MANUAL_OPTION_VALUE) {
      onChange({
        razaoSocial: defaultManualValues?.razaoSocial || "",
        nomeFantasia: defaultManualValues?.nomeFantasia || "",
        cnpj: defaultManualValues?.cnpj || "",
        isManual: true,
      });
    } else {
      const company = existingCompanies.find((c) => c.razaoSocial === selectedValue);
      if (company) {
        onChange({
          razaoSocial: company.razaoSocial,
          nomeFantasia: company.nomeFantasia || "",
          cnpj: company.cnpj,
          isManual: false,
        });
      }
    }
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label} *</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {displayLabel}
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
                    onSelect={() => handleSelect(MANUAL_OPTION_VALUE)}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value.isManual ? "opacity-100" : "opacity-0")}
                    />
                    <span className="text-primary font-medium">+ Cadastrar nova empresa</span>
                  </CommandItem>
                  {existingCompanies.map((company) => (
                    <CommandItem
                      key={company.cnpj}
                      value={company.razaoSocial}
                      onSelect={() => handleSelect(company.razaoSocial)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !value.isManual && value.razaoSocial === company.razaoSocial
                            ? "opacity-100"
                            : "opacity-0"
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

      {value.isManual && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 sm:col-span-2">
            <Label>Razão Social *</Label>
            <Input
              value={value.razaoSocial}
              onChange={(e) => onChange({ ...value, razaoSocial: e.target.value })}
              placeholder="Razão social da empresa"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input
              value={value.nomeFantasia}
              onChange={(e) => onChange({ ...value, nomeFantasia: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input
              value={value.cnpj}
              onChange={(e) => onChange({ ...value, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>
      )}

      {!value.isManual && value.razaoSocial && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-sm font-medium">{value.razaoSocial}</p>
          {value.nomeFantasia && (
            <p className="text-sm text-muted-foreground">{value.nomeFantasia}</p>
          )}
          <p className="text-xs font-mono text-muted-foreground">{value.cnpj}</p>
        </div>
      )}
    </div>
  );
}
