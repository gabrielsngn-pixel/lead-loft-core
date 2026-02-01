import { useState } from "react";
import {
  Building2,
  MapPin,
  DollarSign,
  Percent,
  Calendar,
  Calculator,
  HelpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import type { ViabilidadeInputs } from "@/lib/viabilidade";

interface SimuladorFormProps {
  inputs: ViabilidadeInputs;
  onChange: (inputs: ViabilidadeInputs) => void;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const parseNumber = (value: string): number => {
  const cleaned = value.replace(/\D/g, "");
  return parseInt(cleaned, 10) || 0;
};

const InputWithTooltip = ({
  label,
  tooltip,
  value,
  onChange,
  prefix,
  suffix,
  type = "currency",
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  type?: "currency" | "number" | "percent";
}) => {
  const displayValue = type === "currency" ? formatNumber(value) : value.toString();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            if (type === "currency") {
              onChange(parseNumber(e.target.value));
            } else if (type === "percent") {
              const val = parseFloat(e.target.value.replace(",", ".")) || 0;
              onChange(val);
            } else {
              onChange(parseInt(e.target.value, 10) || 0);
            }
          }}
          className={prefix ? "pl-10" : suffix ? "pr-10" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export function SimuladorForm({ inputs, onChange }: SimuladorFormProps) {
  const updateField = <K extends keyof ViabilidadeInputs>(
    field: K,
    value: ViabilidadeInputs[K]
  ) => {
    onChange({ ...inputs, [field]: value });
  };

  return (
    <Tabs defaultValue="terreno" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="terreno" className="text-xs sm:text-sm">
          <Building2 className="w-4 h-4 mr-1.5 hidden sm:inline" />
          Terreno
        </TabsTrigger>
        <TabsTrigger value="projeto" className="text-xs sm:text-sm">
          <MapPin className="w-4 h-4 mr-1.5 hidden sm:inline" />
          Projeto
        </TabsTrigger>
        <TabsTrigger value="custos" className="text-xs sm:text-sm">
          <DollarSign className="w-4 h-4 mr-1.5 hidden sm:inline" />
          Custos
        </TabsTrigger>
        <TabsTrigger value="financeiro" className="text-xs sm:text-sm">
          <Percent className="w-4 h-4 mr-1.5 hidden sm:inline" />
          Financeiro
        </TabsTrigger>
      </TabsList>

      <TabsContent value="terreno" className="mt-4 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Dados do Terreno</CardTitle>
            <CardDescription>
              Informações sobre o terreno do empreendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InputWithTooltip
              label="Área do Terreno (m²)"
              tooltip="Área total do terreno em metros quadrados"
              value={inputs.areaTerreno}
              onChange={(v) => updateField("areaTerreno", v)}
              suffix="m²"
              type="number"
            />
            <InputWithTooltip
              label="Custo do Terreno"
              tooltip="Valor total de aquisição do terreno"
              value={inputs.custoTerreno}
              onChange={(v) => updateField("custoTerreno", v)}
              prefix="R$"
              type="currency"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="projeto" className="mt-4 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Projeto Arquitetônico</CardTitle>
            <CardDescription>
              Áreas e quantidade de unidades do empreendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InputWithTooltip
              label="Área Privativa Total (m²)"
              tooltip="Soma de todas as áreas privativas vendáveis"
              value={inputs.areaPrivativa}
              onChange={(v) => updateField("areaPrivativa", v)}
              suffix="m²"
              type="number"
            />
            <InputWithTooltip
              label="Área Comum (m²)"
              tooltip="Áreas de uso comum (halls, circulações, lazer)"
              value={inputs.areaComum}
              onChange={(v) => updateField("areaComum", v)}
              suffix="m²"
              type="number"
            />
            <InputWithTooltip
              label="Número de Unidades"
              tooltip="Quantidade total de unidades no empreendimento"
              value={inputs.numUnidades}
              onChange={(v) => updateField("numUnidades", v)}
              type="number"
            />
            <InputWithTooltip
              label="Preço de Venda (R$/m²)"
              tooltip="Valor médio de venda por m² de área privativa"
              value={inputs.precoM2}
              onChange={(v) => updateField("precoM2", v)}
              prefix="R$"
              suffix="/m²"
              type="currency"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="custos" className="mt-4 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Custos de Construção</CardTitle>
            <CardDescription>
              Custos diretos e taxas sobre o empreendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InputWithTooltip
              label="Custo de Construção (R$/m²)"
              tooltip="Custo médio de construção por m² (CUB + BDI)"
              value={inputs.custoConstrucaoM2}
              onChange={(v) => updateField("custoConstrucaoM2", v)}
              prefix="R$"
              suffix="/m²"
              type="currency"
            />
            
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Taxa de Incorporação</Label>
                  <span className="text-sm font-medium">{inputs.taxaIncorporacao}%</span>
                </div>
                <Slider
                  value={[inputs.taxaIncorporacao]}
                  onValueChange={([v]) => updateField("taxaIncorporacao", v)}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Comissão de Vendas</Label>
                  <span className="text-sm font-medium">{inputs.taxaComissaoVendas}%</span>
                </div>
                <Slider
                  value={[inputs.taxaComissaoVendas]}
                  onValueChange={([v]) => updateField("taxaComissaoVendas", v)}
                  min={2}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Marketing</Label>
                  <span className="text-sm font-medium">{inputs.taxaMarketing}%</span>
                </div>
                <Slider
                  value={[inputs.taxaMarketing]}
                  onValueChange={([v]) => updateField("taxaMarketing", v)}
                  min={1}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Taxa Administrativa</Label>
                  <span className="text-sm font-medium">{inputs.taxaAdministrativa}%</span>
                </div>
                <Slider
                  value={[inputs.taxaAdministrativa]}
                  onValueChange={([v]) => updateField("taxaAdministrativa", v)}
                  min={3}
                  max={12}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="financeiro" className="mt-4 space-y-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Parâmetros Financeiros</CardTitle>
            <CardDescription>
              Prazos, financiamento e impostos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InputWithTooltip
              label="Prazo de Obra (meses)"
              tooltip="Tempo estimado para conclusão da construção"
              value={inputs.prazoObra}
              onChange={(v) => updateField("prazoObra", v)}
              suffix="meses"
              type="number"
            />
            <InputWithTooltip
              label="Prazo de Vendas (meses)"
              tooltip="Tempo estimado para vender todas as unidades"
              value={inputs.prazoVendas}
              onChange={(v) => updateField("prazoVendas", v)}
              suffix="meses"
              type="number"
            />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Taxa de Financiamento (a.a.)</Label>
                <span className="text-sm font-medium">{inputs.taxaFinanciamento}%</span>
              </div>
              <Slider
                value={[inputs.taxaFinanciamento]}
                onValueChange={([v]) => updateField("taxaFinanciamento", v)}
                min={8}
                max={20}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">% Financiado</Label>
                <span className="text-sm font-medium">{inputs.percentualFinanciado}%</span>
              </div>
              <Slider
                value={[inputs.percentualFinanciado]}
                onValueChange={([v]) => updateField("percentualFinanciado", v)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2 pt-4 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Impostos (Lucro Presumido)
              </h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">IRPJ + CSLL</Label>
                    <span className="text-sm font-medium">{inputs.irpjCsll}%</span>
                  </div>
                  <Slider
                    value={[inputs.irpjCsll]}
                    onValueChange={([v]) => updateField("irpjCsll", v)}
                    min={4}
                    max={10}
                    step={0.01}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">PIS</Label>
                    <span className="text-sm font-medium">{inputs.pis}%</span>
                  </div>
                  <Slider
                    value={[inputs.pis]}
                    onValueChange={([v]) => updateField("pis", v)}
                    min={0.5}
                    max={1.65}
                    step={0.01}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">COFINS</Label>
                    <span className="text-sm font-medium">{inputs.cofins}%</span>
                  </div>
                  <Slider
                    value={[inputs.cofins]}
                    onValueChange={([v]) => updateField("cofins", v)}
                    min={2}
                    max={7.6}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
