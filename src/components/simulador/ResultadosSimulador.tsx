import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  Percent,
  Info,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SimuladorResults, formatCurrency, formatPercent, CONSTANTS, BANK_RATES } from "@/lib/simulador";

interface ResultadosSimuladorProps {
  results: SimuladorResults;
  registroTipo: "parceiro" | "internalizado" | "sem_registro";
}

export function ResultadosSimulador({ results, registroTipo }: ResultadosSimuladorProps) {
  const statusConfig = {
    viable: {
      label: "Viável",
      icon: CheckCircle2,
      color: "bg-success text-white",
      borderColor: "border-success",
      bgColor: "bg-success/5",
    },
    limit: {
      label: "No Limite",
      icon: AlertTriangle,
      color: "bg-warning text-white",
      borderColor: "border-warning",
      bgColor: "bg-warning/5",
    },
    inviable: {
      label: "Inviável",
      icon: XCircle,
      color: "bg-destructive text-white",
      borderColor: "border-destructive",
      bgColor: "bg-destructive/5",
    },
  };

  const config = statusConfig[results.status];
  const StatusIcon = config.icon;

  // Calcular se há receita Caixa
  const temReceitaCaixa = results.receitaPorBanco.caixa > 0;

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
                <p className="mt-2 text-sm text-muted-foreground">{results.statusLabel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Margem Loft</p>
              <p className={cn("text-4xl font-bold font-display", {
                "text-success": results.status === "viable",
                "text-warning-foreground": results.status === "limit",
                "text-destructive": results.status === "inviable",
              })}>
                {formatPercent(results.margemFinalPercent)}
              </p>
              <p className="text-xs text-muted-foreground">mínimo: {formatPercent(CONSTANTS.MIN_MARGIN * 100)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Breakdown de Receita por Banco */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4" />
            Receita por Banco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Itaú */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Itaú ({BANK_RATES.itau * 100}%)</p>
              <p className="font-bold text-lg">{formatCurrency(results.receitaPorBanco.itau)}</p>
              <p className="text-xs text-muted-foreground">{results.receitaPorBancoPercent.itau.toFixed(3)}% VGV</p>
            </div>
            
            {/* Santander */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Santander ({BANK_RATES.santander * 100}%)</p>
              <p className="font-bold text-lg">{formatCurrency(results.receitaPorBanco.santander)}</p>
              <p className="text-xs text-muted-foreground">{results.receitaPorBancoPercent.santander.toFixed(3)}% VGV</p>
            </div>
            
            {/* Bradesco */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Bradesco ({BANK_RATES.bradesco * 100}%)</p>
              <p className="font-bold text-lg">{formatCurrency(results.receitaPorBanco.bradesco)}</p>
              <p className="text-xs text-muted-foreground">{results.receitaPorBancoPercent.bradesco.toFixed(3)}% VGV</p>
            </div>
            
            {/* Caixa */}
            <div className={cn(
              "p-3 rounded-lg",
              results.caixaRemunerada ? "bg-muted/30" : "bg-warning/10 border border-warning/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                Caixa
                {!results.caixaRemunerada && (
                  <span className="text-warning">(não remunerada)</span>
                )}
              </p>
              <p className={cn(
                "font-bold text-lg",
                !results.caixaRemunerada && "text-muted-foreground"
              )}>
                {formatCurrency(results.receitaPorBanco.caixa)}
              </p>
              <p className="text-xs text-muted-foreground">{results.receitaPorBancoPercent.caixa.toFixed(3)}% VGV</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="w-5 h-5 text-primary" />
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
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Bruta</p>
                <p className="text-xl font-bold">{formatCurrency(results.receitaBrutaCurrency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingUp className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comissão Incorp.</p>
                <p className="text-xl font-bold text-destructive">
                  -{formatCurrency(results.custoComissaoIncorporador)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Operacional</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(results.receitaLiquidaTotalCurrency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receita de Registro (se internalizado) */}
      {registroTipo === "internalizado" && results.receitaRegistroTotal > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
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
                <p className="font-bold text-lg text-success">
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
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning-foreground">Teto aplicado na Caixa</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            A taxa efetiva da Caixa ({formatPercent(results.taxaEfetivaCaixa)}) foi limitada pelo teto de remuneração por unidade.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta Caixa Não Remunerada */}
      {!results.caixaRemunerada && results.receitaPorBancoPercent.caixa === 0 && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning-foreground">Operação com Caixa sem remuneração</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            A comissão do incorporador foi aplicada apenas sobre os bancos remunerados (Itaú, Santander, Bradesco).
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta Projeto sem Registro */}
      {registroTipo === "sem_registro" && results.status !== "viable" && (
        <Alert className="border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Projeto sem registro</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Projetos sem registro são mais sensíveis à comissão do incorporador. Considere reduzir a comissão para melhorar a margem.
          </AlertDescription>
        </Alert>
      )}

      {/* Rodapé CFO */}
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Margem mínima exigida pela governança: <span className="font-semibold">{formatPercent(CONSTANTS.MIN_MARGIN * 100)}</span>
        </p>
      </div>
    </div>
  );
}
