import { AlertTriangle, CheckCircle2, XCircle, Info, FileCheck2, Sparkles, FileSignature } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SimuladorResults, formatCurrency, formatPercent, type RegistroTipo, CONSTANTS } from "@/lib/simulador";

interface ResultadosSidebarProps {
  results: SimuladorResults;
  registroTipo: RegistroTipo;
  vgv: number;
  onAprovar?: () => void;
  canAprovar?: boolean;
}

export function ResultadosSidebar({ 
  results, 
  registroTipo, 
  vgv,
  onAprovar, 
  canAprovar = true 
}: ResultadosSidebarProps) {
  const statusConfig = {
    viable: {
      label: "Viável",
      icon: CheckCircle2,
      textColor: "text-success",
      borderColor: "border-success",
      lightBg: "bg-success/10",
    },
    limit: {
      label: "Margem no limite",
      icon: AlertTriangle,
      textColor: "text-warning-foreground",
      borderColor: "border-warning",
      lightBg: "bg-warning/80",
    },
    inviable: {
      label: "Inviável",
      icon: XCircle,
      textColor: "text-destructive",
      borderColor: "border-destructive",
      lightBg: "bg-destructive/10",
    },
  };

  const config = statusConfig[results.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Status Principal */}
      <Card className={cn("border-2", config.borderColor)}>
        <CardContent className={cn("p-4", config.lightBg)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("w-5 h-5", config.textColor)} />
              <div>
                <p className={cn("font-semibold", config.textColor)}>{results.statusLabel}</p>
                <p className="text-sm text-muted-foreground">
                  Margem próxima ao mínimo de {formatPercent(CONSTANTS.MIN_MARGIN * 100)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-3xl font-bold", {
                "text-success": results.status === "viable",
                "text-foreground": results.status === "limit",
                "text-destructive": results.status === "inviable",
              })}>
                {formatPercent(results.margemFinalPercent)}
              </p>
              <p className="text-xs text-muted-foreground">Margem final</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coparticipação Info */}
      <Card className="bg-success/5 border-success/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-success mt-0.5" />
            <div>
              <p className="font-medium text-success">Modelo de Coparticipação (Loft / CRE)</p>
              <p className="text-sm text-muted-foreground mt-1">
                A receita de comissão e registro é compartilhada entre Loft e CRE (50% / 50%). 
                A viabilidade considera exclusivamente a margem da Loft.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileCheck2 className="w-4 h-4" />
            Resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Comissão Bancária Ponderada */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Comissão bancária ponderada</p>
            <p className="text-2xl font-bold">{formatPercent(results.taxaPonderadaBanco)}</p>
          </div>

          {/* RECEITAS */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">RECEITAS</p>
            
            <div className="space-y-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Receita bruta</p>
                <p className="text-xl font-bold">
                  {formatPercent(results.receitaBrutaPercent)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaBrutaCurrency)})
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Impostos (10,1%)</p>
                <p className="text-xl font-bold">
                  {formatPercent(results.impostoPercent)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.impostoCurrency)})
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Receita operacional</p>
                <p className="text-xl font-bold">
                  {formatPercent(results.receitaLiquidaTotalPercent)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaLiquidaTotalCurrency)})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* COPARTICIPAÇÃO */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">COPARTICIPAÇÃO (50% / 50%)</p>
            
            <div className="space-y-2">
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <p className="text-sm text-muted-foreground">Receita líquida Loft (comissão)</p>
                <p className="text-xl font-bold text-success">
                  {formatPercent(results.receitaLiquidaLoftPercent)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaLiquidaLoftCurrency)})
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Receita líquida CRE (comissão)</p>
                <p className="text-xl font-bold">
                  {formatPercent(results.receitaLiquidaCREPercent)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaLiquidaCRECurrency)})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOS LOFT */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">CUSTOS LOFT (100%)</p>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Custos operacionais (0,24%)</p>
              <p className="text-xl font-bold">
                {formatPercent(results.custosOperacionaisPercent)}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({formatCurrency(results.custosOperacionaisCurrency)})
                </span>
              </p>
            </div>
          </div>

          {/* Receita de Registro (se internalizado) */}
          {registroTipo === "internalizado" && results.receitaRegistroTotal > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">RECEITA DE REGISTRO</p>
              
              <div className="space-y-2">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Receita Loft (50%)</p>
                  <p className="text-xl font-bold text-primary">
                    {formatPercent(results.receitaRegistroLoftPercent)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({formatCurrency(results.receitaRegistroLoft)})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Margem Final Loft */}
          <div className="p-4 bg-success/10 rounded-lg border border-success/20 mt-4">
            <p className="text-sm text-muted-foreground">Margem final Loft</p>
            <p className={cn("text-2xl font-bold", {
              "text-success": results.status === "viable",
              "text-warning-foreground": results.status === "limit",
              "text-destructive": results.status === "inviable",
            })}>
              {formatPercent(results.margemFinalPercent)}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({formatCurrency(results.margemFinalCurrency)})
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {results.alerts.length > 0 && (
        <div className="space-y-2">
          {results.alerts.map((alert, idx) => (
            <Alert 
              key={idx} 
              className={cn({
                "bg-success/10 border-success/30": alert.type === "success",
                "bg-warning/10 border-warning/30": alert.type === "warning",
                "bg-destructive/10 border-destructive/30": alert.type === "error",
              })}
            >
              {alert.type === "success" && <CheckCircle2 className="h-4 w-4 text-success" />}
              {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-warning" />}
              {alert.type === "error" && <XCircle className="h-4 w-4 text-destructive" />}
              <AlertDescription className="text-sm">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Botão Aprovar Simulação */}
      {results.status !== "inviable" && onAprovar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  onClick={onAprovar}
                  disabled={!canAprovar}
                  className="w-full h-12 text-base gap-2 bg-secondary hover:bg-secondary/90"
                >
                  <FileSignature className="w-5 h-5" />
                  Aprovar Simulação
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">
                Quando aplicável, a cobrança do registro ao cliente final é realizada pela 
                incorporadora, que se compromete contratualmente a repassar os valores devidos à Loft.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Margem Mínima */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Margem mínima exigida: {formatPercent(CONSTANTS.MIN_MARGIN * 100)}.</p>
              <p className="text-sm text-muted-foreground">
                Projetos abaixo desse patamar não são aprovados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
