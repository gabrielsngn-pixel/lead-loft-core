import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/simulador";

interface EstruturaProjetoProps {
  unidades: number;
  vgv: number;
  onUnidadesChange: (value: number) => void;
  onVgvChange: (value: number) => void;
}

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const parseNumber = (value: string): number => parseInt(value.replace(/\D/g, ""), 10) || 0;

export function EstruturaProjeto({
  unidades,
  vgv,
  onUnidadesChange,
  onVgvChange,
}: EstruturaProjetoProps) {
  const ticketMedio = unidades > 0 ? vgv / unidades : 0;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Estrutura do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quantidade de Unidades */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Quantidade de unidades</Label>
          <Input
            type="number"
            value={unidades || ""}
            onChange={(e) => onUnidadesChange(parseInt(e.target.value) || 0)}
            className="bg-background"
            placeholder="0"
          />
        </div>

        {/* VGV */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">VGV total do projeto (R$)</Label>
          <Input
            type="text"
            value={`R$ ${formatNumber(vgv)}`}
            onChange={(e) => onVgvChange(parseNumber(e.target.value))}
            className="bg-background"
            placeholder="R$ 0"
          />
        </div>

        {/* Ticket Médio */}
        <div className="p-4 bg-accent/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Ticket médio</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(ticketMedio)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
