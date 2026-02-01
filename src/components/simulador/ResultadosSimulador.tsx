import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  Percent,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SimuladorResults, formatCurrency, formatPercent } from "@/lib/simulador";

interface ResultadosSimuladorProps {
  results: SimuladorResults;
  registroTipo: "parceiro" | "internalizado" | "sem_registro";
}

export function ResultadosSimulador({ results, registroTipo }: ResultadosSimuladorProps) {
  const statusConfig = {
    viavel: {
      label: "Viável",
      icon: CheckCircle2,
      color: "bg-[#115644] text-white",
      borderColor: "border-[#115644]",
      bgColor: "bg-[#115644]/5",
    },
    limite: {
      label: "No Limite",
      icon: AlertTriangle,
      color: "bg-amber-500 text-white",
      borderColor: "border-amber-500",
      bgColor: "bg-amber-500/5",
    },
    inviavel: {
      label: "Inviável",
      icon: XCircle,
      color: "bg-red-500 text-white",
      borderColor: "border-red-500",
      bgColor: "bg-red-500/5",
    },
  };

  const config = statusConfig[results.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Card Principal de Status */}
      <Card className={cn("overflow-hidden border-2", config.borderColor)}>
        <div className={cn("p-6", config.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-full", config.color)}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <Badge className={cn("text-lg px-4 py-1", config.color)}>
                  {config.label}
                </Badge>
                <p className="mt-2 text-sm text-muted-foreground">{results.mensagem}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Margem Loft</p>
              <p className={cn("text-4xl font-bold font-display", {
                "text-[#115644]": results.status === "viavel",
                "text-amber-600": results.status === "limite",
                "text-red-600": results.status === "inviavel",
              })}>
                {formatPercent(results.margemLoft)}
              </p>
              <p className="text-xs text-muted-foreground">mínimo: {formatPercent(results.margemMinima)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FF774A]/10">
                <Percent className="w-5 h-5 text-[#FF774A]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Ponderada</p>
                <p className="text-xl font-bold">{formatPercent(results.taxaPonderadaBanco)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#115644]/10">
                <DollarSign className="w-5 h-5 text-[#115644]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Bruta</p>
                <p className="text-xl font-bold">{formatCurrency(results.receitaBrutaTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comissão Incorp.</p>
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(results.custoComissaoIncorporador)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#115644]/10">
                <DollarSign className="w-5 h-5 text-[#115644]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Líquida</p>
                <p className="text-xl font-bold text-[#115644]">
                  {formatCurrency(results.receitaLiquidaTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita de Registro (se internalizado) */}
      {registroTipo === "internalizado" && results.receitaRegistroTotal > 0 && (
        <Card className="border-[#FF774A]/30 bg-[#FF774A]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[#FF774A]">
              <Info className="w-4 h-4" />
              Receita Incremental de Registro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-bold text-lg">{formatCurrency(results.receitaRegistroTotal)}</p>
              </div>
              <div className="border-x">
                <p className="text-xs text-muted-foreground mb-1">Receita Loft</p>
                <p className="font-bold text-lg text-[#115644]">
                  {formatCurrency(results.receitaRegistroLoft)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">50%</p>
                <p className="font-bold text-lg text-muted-foreground">Coparticipação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta Caixa com Teto */}
      {results.caixaTetoAplicado && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Teto aplicado na Caixa</AlertTitle>
          <AlertDescription className="text-amber-700">
            A taxa efetiva da Caixa ({formatPercent(results.taxaEfetivaCaixa)}) foi limitada pelo teto de remuneração por unidade.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta Projeto sem Registro */}
      {registroTipo === "sem_registro" && results.status !== "viavel" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Projeto sem registro</AlertTitle>
          <AlertDescription className="text-red-700">
            Projetos sem registro são mais sensíveis à comissão do incorporador. Considere reduzir a comissão para melhorar a margem.
          </AlertDescription>
        </Alert>
      )}

      {/* Rodapé CFO */}
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Margem mínima exigida pela governança: <span className="font-semibold">{formatPercent(results.margemMinima)}</span>
        </p>
      </div>
    </div>
  );
}
