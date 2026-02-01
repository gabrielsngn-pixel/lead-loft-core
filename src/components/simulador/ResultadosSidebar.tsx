import { AlertTriangle, CheckCircle2, XCircle, Info, FileCheck2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SimuladorResults, formatCurrency, formatPercent, type RegistroTipo } from "@/lib/simulador";

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
    viavel: {
      label: "Viável",
      icon: CheckCircle2,
      bgColor: "bg-success",
      textColor: "text-success",
      borderColor: "border-success",
      lightBg: "bg-success/10",
    },
    limite: {
      label: "Margem no limite",
      icon: AlertTriangle,
      bgColor: "bg-warning",
      textColor: "text-warning-foreground",
      borderColor: "border-warning",
      lightBg: "bg-warning/80",
    },
    inviavel: {
      label: "Inviável",
      icon: XCircle,
      bgColor: "bg-destructive",
      textColor: "text-destructive",
      borderColor: "border-destructive",
      lightBg: "bg-destructive/10",
    },
  };

  const config = statusConfig[results.status];
  const StatusIcon = config.icon;

  // Calculate derived values
  const receitaBrutaPct = vgv > 0 ? (results.receitaBrutaTotal / vgv) * 100 : 0;
  const impostosPct = receitaBrutaPct * 0.101;
  const impostosVal = results.receitaBrutaTotal * 0.101;
  const receitaLiquidaPct = receitaBrutaPct * 0.899;
  const receitaLoftPct = receitaLiquidaPct * 0.5;
  const receitaCREPct = receitaLiquidaPct * 0.5;
  const custoOperacionalPct = 0.24;
  const custoOperacionalVal = vgv * 0.0024;

  return (
    <div className="space-y-4">
      {/* Status Principal */}
      <Card className={cn("border-2", config.borderColor)}>
        <CardContent className={cn("p-4", config.lightBg)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={cn("w-5 h-5", config.textColor)} />
              <div>
                <p className={cn("font-semibold", config.textColor)}>{config.label}</p>
                <p className="text-sm text-muted-foreground">{results.mensagem}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-3xl font-bold", {
                "text-success": results.status === "viavel",
                "text-foreground": results.status === "limite",
                "text-destructive": results.status === "inviavel",
              })}>
                {formatPercent(results.margemLoft)}
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
                  {formatPercent(receitaBrutaPct)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaBrutaTotal)})
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Impostos (10,1%)</p>
                <p className="text-xl font-bold">
                  {formatPercent(impostosPct)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(impostosVal)})
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Receita líquida total</p>
                <p className="text-xl font-bold">
                  {formatPercent(receitaLiquidaPct)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaLiquidaTotal)})
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
                  {formatPercent(receitaLoftPct)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaLoft)})
                  </span>
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Receita líquida CRE (comissão)</p>
                <p className="text-xl font-bold">
                  {formatPercent(receitaCREPct)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({formatCurrency(results.receitaCRE)})
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
                {formatPercent(custoOperacionalPct)}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({formatCurrency(custoOperacionalVal)})
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
                    {formatCurrency(results.receitaRegistroLoft)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Margem Final Loft */}
          <div className="p-4 bg-success/10 rounded-lg border border-success/20 mt-4">
            <p className="text-sm text-muted-foreground">Margem final Loft</p>
            <p className={cn("text-2xl font-bold", {
              "text-success": results.status === "viavel",
              "text-warning-foreground": results.status === "limite",
              "text-destructive": results.status === "inviavel",
            })}>
              {formatPercent(results.margemLoft)}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({formatCurrency((results.margemLoft / 100) * vgv)})
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Aprovar */}
      {results.status !== "inviavel" && onAprovar && (
        <Button 
          onClick={onAprovar}
          disabled={!canAprovar}
          className="w-full h-12 text-base gap-2 bg-secondary hover:bg-secondary/90"
        >
          <FileCheck2 className="w-5 h-5" />
          Aprovar Simulação
        </Button>
      )}

      {/* Margem Mínima */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Margem mínima exigida: {formatPercent(results.margemMinima)}.</p>
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
