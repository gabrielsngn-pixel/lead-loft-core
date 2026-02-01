import { useState } from "react";
import { ChevronDown, Info, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  BankMix,
  CaixaSubMix,
  CAIXA_MODELS,
  validarMixBancario,
  validarSubMixCaixa,
  BANK_RATES,
  calcularTaxaPonderadaCaixa,
} from "@/lib/simulador";

interface BankMixCardProps {
  bankMix: BankMix;
  caixaSubMix: CaixaSubMix;
  onBankMixChange: (mix: BankMix) => void;
  onCaixaSubMixChange: (subMix: CaixaSubMix) => void;
  ticketMedio: number;
}

export function BankMixCard({
  bankMix,
  caixaSubMix,
  onBankMixChange,
  onCaixaSubMixChange,
  ticketMedio,
}: BankMixCardProps) {
  const [caixaOpen, setCaixaOpen] = useState(true);
  
  const totalBankMix = bankMix.itau + bankMix.santander + bankMix.bradesco + bankMix.caixa;
  const isValidBankMix = validarMixBancario(bankMix);

  const totalCaixaSubMix =
    caixaSubMix.individual_spbe +
    caixaSubMix.alocacao_spbe +
    caixaSubMix.individual_mcmv +
    caixaSubMix.alocacao_mcmv;
  const isValidCaixaSubMix = validarSubMixCaixa(caixaSubMix);
  const showCaixaSubMix = bankMix.caixa > 0;

  const taxaCaixa = calcularTaxaPonderadaCaixa(caixaSubMix, ticketMedio);
  
  // Calculate weighted rate
  const taxaPonderada = 
    (bankMix.itau / 100) * BANK_RATES.itau +
    (bankMix.santander / 100) * BANK_RATES.santander +
    (bankMix.bradesco / 100) * BANK_RATES.bradesco +
    (bankMix.caixa / 100) * taxaCaixa.taxaEfetiva;

  const updateBankMix = (key: keyof BankMix, value: number) => {
    onBankMixChange({ ...bankMix, [key]: Math.max(0, Math.min(100, value)) });
  };

  const updateCaixaSubMix = (key: keyof CaixaSubMix, value: number) => {
    onCaixaSubMixChange({ ...caixaSubMix, [key]: Math.max(0, Math.min(100, value)) });
  };

  const banks = [
    { id: "itau", name: "Itaú", rate: BANK_RATES.itau, value: bankMix.itau },
    { id: "santander", name: "Santander", rate: BANK_RATES.santander, value: bankMix.santander },
    { id: "bradesco", name: "Bradesco", rate: BANK_RATES.bradesco, value: bankMix.bradesco },
    { id: "caixa", name: "Caixa", rate: null, value: bankMix.caixa },
  ];

  return (
    <div className="space-y-4">
      {/* Mix Bancário Ponderado */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Mix Bancário Ponderado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Badge */}
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg",
            isValidBankMix 
              ? "bg-success/10 text-success" 
              : "bg-destructive/10 text-destructive"
          )}>
            {isValidBankMix ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isValidBankMix 
                ? "Soma: 100% — Configuração válida" 
                : `Soma: ${totalBankMix}% — Deve totalizar 100%`
              }
            </span>
          </div>

          {/* Bank Inputs Grid */}
          <div className="grid grid-cols-2 gap-4">
            {banks.map((bank) => (
              <div key={bank.id} className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {bank.name} {bank.rate ? `(${bank.rate}%)` : ""}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={bank.value || ""}
                    onChange={(e) => updateBankMix(bank.id as keyof BankMix, parseFloat(e.target.value) || 0)}
                    className="pr-8 bg-background"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição dos Produtos CAIXA */}
      {showCaixaSubMix && (
        <Collapsible open={caixaOpen} onOpenChange={setCaixaOpen}>
          <Card className="border shadow-sm">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-success">
                    <CreditCard className="w-4 h-4" />
                    Distribuição dos Produtos CAIXA (%)
                  </CardTitle>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    caixaOpen && "rotate-180"
                  )} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                {/* Caixa Validation Badge */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg",
                  isValidCaixaSubMix 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {isValidCaixaSubMix ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {isValidCaixaSubMix 
                      ? "Mix Caixa: 100% — Válido" 
                      : `Mix Caixa: ${totalCaixaSubMix}% — Deve totalizar 100%`
                    }
                  </span>
                </div>

                {/* Caixa Products Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {CAIXA_MODELS.map((model) => {
                    const key = model.id as keyof CaixaSubMix;
                    const value = caixaSubMix[key];
                    const tetoLabel = model.ceiling
                      ? `(até R$ ${model.ceiling.toLocaleString("pt-BR")})`
                      : "";
                    
                    // Calculate effective rate for this model
                    const taxaEfetiva = model.ceiling
                      ? Math.min(model.rate, (model.ceiling / ticketMedio) * 100)
                      : model.rate;

                    return (
                      <div key={model.id} className="space-y-1">
                        <Label className="text-sm text-muted-foreground">
                          {model.label} <span className="text-xs">{tetoLabel}</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={value || ""}
                            onChange={(e) => updateCaixaSubMix(key, parseFloat(e.target.value) || 0)}
                            className="pr-8 bg-background"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Taxa: {model.rate}%
                          {model.ceiling && taxaEfetiva < model.rate && (
                            <span className="text-primary font-medium"> (R$ {model.ceiling.toLocaleString("pt-BR")}/un)</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Taxa Média Efetiva CAIXA */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Taxa Média Efetiva CAIXA</span>
                    <span className="text-xl font-bold">{taxaCaixa.taxaEfetiva.toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {CAIXA_MODELS.map((model) => {
                      const key = model.id as keyof CaixaSubMix;
                      const pct = caixaSubMix[key];
                      if (pct === 0) return null;
                      
                      const taxaEfetiva = model.ceiling && ticketMedio > 0
                        ? Math.min(model.rate, (model.ceiling / ticketMedio) * 100)
                        : model.rate;
                      const contrib = (pct / 100) * taxaEfetiva;
                      const hasWarning = model.ceiling && taxaEfetiva < model.rate;

                      return (
                        <div key={model.id} className="flex items-center gap-1">
                          <span>• {model.label}: {pct}% × {taxaEfetiva.toFixed(2)}% = {contrib.toFixed(2)}%</span>
                          {hasWarning && <AlertTriangle className="w-3 h-3 text-warning" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {taxaCaixa.tetoAplicado && (
                  <Alert className="bg-warning/10 border-warning/30">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm">
                      Um ou mais produtos CAIXA tiveram a remuneração limitada ao teto máximo por unidade.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Comissão Bancária Ponderada - Summary */}
      <Card className="bg-muted/30 border shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comissão Bancária Ponderada</p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {bankMix.itau > 0 && (
                  <p>• Itaú: {bankMix.itau}% × {BANK_RATES.itau}% = {(bankMix.itau / 100 * BANK_RATES.itau).toFixed(2)}%</p>
                )}
                {bankMix.santander > 0 && (
                  <p>• Santander: {bankMix.santander}% × {BANK_RATES.santander}% = {(bankMix.santander / 100 * BANK_RATES.santander).toFixed(2)}%</p>
                )}
                {bankMix.bradesco > 0 && (
                  <p>• Bradesco: {bankMix.bradesco}% × {BANK_RATES.bradesco}% = {(bankMix.bradesco / 100 * BANK_RATES.bradesco).toFixed(2)}%</p>
                )}
                {bankMix.caixa > 0 && (
                  <p className="flex items-center gap-1">
                    • Caixa: {bankMix.caixa}% × {taxaCaixa.taxaEfetiva.toFixed(2)}% = {(bankMix.caixa / 100 * taxaCaixa.taxaEfetiva).toFixed(2)}%
                    {taxaCaixa.tetoAplicado && <AlertTriangle className="w-3 h-3 text-warning" />}
                  </p>
                )}
              </div>
            </div>
            <span className="text-2xl font-bold text-primary">{taxaPonderada.toFixed(2)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
