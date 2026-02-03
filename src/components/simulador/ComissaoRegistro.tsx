import { FileText, Percent, Building, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, REGISTRO_OPTIONS, type RegistroTipo } from "@/lib/simulador";
import { cn } from "@/lib/utils";

interface ComissaoRegistroProps {
  comissaoIncorporador: number;
  registroTipo: RegistroTipo;
  valorRegistroPorUnidade: number;
  unidades: number;
  remunerarCaixa: boolean;
  caixaMixPercent: number;
  onComissaoChange: (value: number) => void;
  onRegistroTipoChange: (value: RegistroTipo) => void;
  onValorRegistroChange: (value: number) => void;
  onRemunerarCaixaChange: (value: boolean) => void;
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const parseNumber = (value: string): number => parseInt(value.replace(/\D/g, ""), 10) || 0;

export function ComissaoRegistro({
  comissaoIncorporador,
  registroTipo,
  valorRegistroPorUnidade,
  unidades,
  remunerarCaixa,
  caixaMixPercent,
  onComissaoChange,
  onRegistroTipoChange,
  onValorRegistroChange,
  onRemunerarCaixaChange,
}: ComissaoRegistroProps) {
  return (
    <div className="space-y-4">
      {/* Remunerar Caixa - NOVA VARIÁVEL OBRIGATÓRIA */}
      {caixaMixPercent > 0 && (
        <Card className={cn(
          "border shadow-sm transition-colors",
          !remunerarCaixa && "border-warning/50 bg-warning/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="w-4 h-4" />
              Remuneração Caixa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-medium">Remunerar Caixa?</Label>
                <p className="text-xs text-muted-foreground">
                  {caixaMixPercent}% do mix está alocado na Caixa
                </p>
              </div>
              <Switch
                checked={remunerarCaixa}
                onCheckedChange={onRemunerarCaixaChange}
              />
            </div>
            
            {!remunerarCaixa && (
              <Alert className="border-warning/30 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm">
                  Operação com Caixa <strong>sem remuneração</strong>. 
                  A comissão do incorporador não incidirá sobre as unidades Caixa.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comissão do Incorporador */}
      <Card className="border shadow-sm">
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Comissão do incorporador</Label>
            <span className="text-xl font-bold text-primary">{comissaoIncorporador.toFixed(2)}%</span>
          </div>
          
          <div className="relative pt-2">
            <Slider
              value={[comissaoIncorporador]}
              onValueChange={([v]) => onComissaoChange(v)}
              min={0}
              max={1}
              step={0.01}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
            />
            {/* Gradient track */}
            <div 
              className="absolute inset-x-0 top-[10px] h-2 rounded-full -z-10"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${comissaoIncorporador * 100}%, hsl(var(--success)) ${comissaoIncorporador * 100}%, hsl(var(--success)) 100%)`
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>1%</span>
          </div>
        </CardContent>
      </Card>

      {/* Registro */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Registro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Tipo de registro</Label>
            <Select value={registroTipo} onValueChange={onRegistroTipoChange}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTRO_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor do Registro (quando internalizado) */}
          {registroTipo === "internalizado" && (
            <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-sm text-muted-foreground">Valor do registro por unidade (R$)</Label>
              <Input
                type="text"
                value={`R$ ${formatNumber(valorRegistroPorUnidade)}`}
                onChange={(e) => onValorRegistroChange(parseNumber(e.target.value))}
                className="bg-background"
              />
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(valorRegistroPorUnidade * unidades)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
