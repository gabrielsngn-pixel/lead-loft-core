import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  Target,
  PiggyBank,
  BadgeDollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ViabilidadeResults } from "@/lib/viabilidade";
import { cn } from "@/lib/utils";

interface ResultadosCardProps {
  results: ViabilidadeResults;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const resultadoConfig = {
  viavel: {
    label: "Viável",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
    bgGradient: "from-green-500/10 to-emerald-500/10",
  },
  inviavel: {
    label: "Inviável",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    bgGradient: "from-red-500/10 to-rose-500/10",
  },
  condicional: {
    label: "Condicional",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
    bgGradient: "from-amber-500/10 to-yellow-500/10",
  },
};

const recomendacaoConfig = {
  simples: { label: "Recomendado", color: "bg-green-100 text-green-800" },
  media: { label: "Com Ressalvas", color: "bg-amber-100 text-amber-800" },
  nao: { label: "Não Recomendado", color: "bg-red-100 text-red-800" },
};

export function ResultadosCard({ results }: ResultadosCardProps) {
  const config = resultadoConfig[results.resultado];
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Card Principal de Resultado */}
      <Card className={cn("overflow-hidden border-2", {
        "border-green-200": results.resultado === "viavel",
        "border-red-200": results.resultado === "inviavel",
        "border-amber-200": results.resultado === "condicional",
      })}>
        <div className={cn("p-6 bg-gradient-to-br", config.bgGradient)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-full", config.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{config.label}</h2>
                <Badge className={recomendacaoConfig[results.recomendacao].color}>
                  {recomendacaoConfig[results.recomendacao].label}
                </Badge>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {results.analise}
          </p>
        </div>
      </Card>

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BadgeDollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VGV</p>
                <p className="text-lg font-bold">{formatCurrency(results.vgv)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <PiggyBank className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                <p className={cn("text-lg font-bold", results.lucroLiquido >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(results.lucroLiquido)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margem Líquida</p>
                <p className={cn("text-lg font-bold", results.margemLiquida >= 15 ? "text-green-600" : results.margemLiquida >= 10 ? "text-amber-600" : "text-red-600")}>
                  {results.margemLiquida.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">TIR (a.a.)</p>
                <p className={cn("text-lg font-bold", results.tir >= 15 ? "text-green-600" : results.tir >= 10 ? "text-amber-600" : "text-red-600")}>
                  {results.tir.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Custos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Composição de Custos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Terreno</span>
              <span className="font-medium">{formatCurrency(results.custoTerreno)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Obra</span>
              <span className="font-medium">{formatCurrency(results.custoObra)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Incorporação</span>
              <span className="font-medium">{formatCurrency(results.custoIncorporacao)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comissão de Vendas</span>
              <span className="font-medium">{formatCurrency(results.custoComissaoVendas)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Marketing</span>
              <span className="font-medium">{formatCurrency(results.custoMarketing)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Administrativo</span>
              <span className="font-medium">{formatCurrency(results.custoAdministrativo)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Financeiro</span>
              <span className="font-medium">{formatCurrency(results.custoFinanceiro)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Custo Total</span>
              <span>{formatCurrency(results.custoTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Indicadores Secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Payback</p>
            <p className="text-xl font-bold">{results.paybackMeses}</p>
            <p className="text-xs text-muted-foreground">meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">ROI Anual</p>
            <p className="text-xl font-bold">{results.roiAnual.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">retorno</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Custo/m²</p>
            <p className="text-xl font-bold">{formatCurrency(results.custoM2Construido)}</p>
            <p className="text-xs text-muted-foreground">construído</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Lucro/m²</p>
            <p className="text-xl font-bold">{formatCurrency(results.lucroM2)}</p>
            <p className="text-xs text-muted-foreground">área privativa</p>
          </CardContent>
        </Card>
      </div>

      {/* Impostos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Impostos Estimados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">PIS</p>
              <p className="font-medium">{formatCurrency(results.impostosPis)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">COFINS</p>
              <p className="font-medium">{formatCurrency(results.impostosCofins)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">IRPJ + CSLL</p>
              <p className="font-medium">{formatCurrency(results.impostosIrpjCsll)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="font-bold">{formatCurrency(results.impostosTotais)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
