import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BankMix,
  CaixaSubMix,
  CAIXA_MODELS,
  validarMixBancario,
  validarSubMixCaixa,
  BANK_RATES,
} from "@/lib/simulador";

interface BankMixSelectorProps {
  bankMix: BankMix;
  caixaSubMix: CaixaSubMix;
  onBankMixChange: (mix: BankMix) => void;
  onCaixaSubMixChange: (subMix: CaixaSubMix) => void;
  ticketMedio: number;
}

export function BankMixSelector({
  bankMix,
  caixaSubMix,
  onBankMixChange,
  onCaixaSubMixChange,
  ticketMedio,
}: BankMixSelectorProps) {
  const totalBankMix = bankMix.itau + bankMix.santander + bankMix.bradesco + bankMix.caixa;
  const isValidBankMix = validarMixBancario(bankMix);

  const totalCaixaSubMix =
    caixaSubMix.individual_spbe +
    caixaSubMix.alocacao_spbe +
    caixaSubMix.individual_mcmv +
    caixaSubMix.alocacao_mcmv;
  const isValidCaixaSubMix = validarSubMixCaixa(caixaSubMix);
  const showCaixaSubMix = bankMix.caixa > 0;

  const updateBankMix = (key: keyof BankMix, value: number) => {
    onBankMixChange({ ...bankMix, [key]: Math.max(0, Math.min(100, value)) });
  };

  const updateCaixaSubMix = (key: keyof CaixaSubMix, value: number) => {
    onCaixaSubMixChange({ ...caixaSubMix, [key]: Math.max(0, Math.min(100, value)) });
  };

  return (
    <div className="space-y-6">
      {/* Mix Bancário Principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Mix Bancário</CardTitle>
            <Badge
              variant={isValidBankMix ? "default" : "destructive"}
              className={cn(
                isValidBankMix && "bg-[#115644] hover:bg-[#115644]/90"
              )}
            >
              {isValidBankMix ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  100%
                </span>
              ) : (
                `${totalBankMix.toFixed(0)}%`
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Itaú */}
          <div className="grid grid-cols-[1fr,80px] gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Itaú</Label>
                <span className="text-xs text-muted-foreground">{BANK_RATES.itau}%</span>
              </div>
              <Slider
                value={[bankMix.itau]}
                onValueChange={([v]) => updateBankMix("itau", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="relative">
              <Input
                type="number"
                value={bankMix.itau}
                onChange={(e) => updateBankMix("itau", parseFloat(e.target.value) || 0)}
                className="pr-6 text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>

          {/* Santander */}
          <div className="grid grid-cols-[1fr,80px] gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Santander</Label>
                <span className="text-xs text-muted-foreground">{BANK_RATES.santander}%</span>
              </div>
              <Slider
                value={[bankMix.santander]}
                onValueChange={([v]) => updateBankMix("santander", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="relative">
              <Input
                type="number"
                value={bankMix.santander}
                onChange={(e) => updateBankMix("santander", parseFloat(e.target.value) || 0)}
                className="pr-6 text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>

          {/* Bradesco */}
          <div className="grid grid-cols-[1fr,80px] gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Bradesco</Label>
                <span className="text-xs text-muted-foreground">{BANK_RATES.bradesco}%</span>
              </div>
              <Slider
                value={[bankMix.bradesco]}
                onValueChange={([v]) => updateBankMix("bradesco", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="relative">
              <Input
                type="number"
                value={bankMix.bradesco}
                onChange={(e) => updateBankMix("bradesco", parseFloat(e.target.value) || 0)}
                className="pr-6 text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>

          {/* Caixa */}
          <div className="grid grid-cols-[1fr,80px] gap-4 items-center">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-[#FF774A]">Caixa Econômica</Label>
                <span className="text-xs text-muted-foreground">variável</span>
              </div>
              <Slider
                value={[bankMix.caixa]}
                onValueChange={([v]) => updateBankMix("caixa", v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="relative">
              <Input
                type="number"
                value={bankMix.caixa}
                onChange={(e) => updateBankMix("caixa", parseFloat(e.target.value) || 0)}
                className="pr-6 text-right"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>

          {!isValidBankMix && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O mix bancário deve somar exatamente 100%. Atual: {totalBankMix.toFixed(0)}%
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sub-Mix Caixa */}
      {showCaixaSubMix && (
        <Card className="border-[#FF774A]/30 bg-[#FF774A]/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#FF774A]">
                Distribuição dos Produtos CAIXA
              </CardTitle>
              <Badge
                variant={isValidCaixaSubMix ? "default" : "destructive"}
                className={cn(
                  isValidCaixaSubMix && "bg-[#FF774A] hover:bg-[#FF774A]/90"
                )}
              >
                {isValidCaixaSubMix ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    100%
                  </span>
                ) : (
                  `${totalCaixaSubMix.toFixed(0)}%`
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {CAIXA_MODELS.map((model) => {
              const key = model.id as keyof CaixaSubMix;
              const value = caixaSubMix[key];
              const tetoLabel = model.ceiling
                ? `teto R$ ${model.ceiling.toLocaleString("pt-BR")}`
                : "sem teto";

              return (
                <div key={model.id} className="grid grid-cols-[1fr,80px] gap-4 items-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{model.label}</Label>
                      <span className="text-xs text-muted-foreground">
                        {model.rate}% · {tetoLabel}
                      </span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => updateCaixaSubMix(key, v)}
                      min={0}
                      max={100}
                      step={5}
                      className="[&_[data-orientation=horizontal]]:bg-[#FF774A]/20"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateCaixaSubMix(key, parseFloat(e.target.value) || 0)}
                      className="pr-6 text-right"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              );
            })}

            {!isValidCaixaSubMix && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A distribuição Caixa deve somar 100%. Atual: {totalCaixaSubMix.toFixed(0)}%
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
