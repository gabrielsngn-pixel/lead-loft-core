import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  User,
} from "lucide-react";
import type { Empreendimento } from "@/types/empreendimentos";
import {
  statusEmpreendimentoLabels,
  statusEmpreendimentoColors,
  tipoEmpreendimentoLabels,
  type EmpreendimentoStatus,
  type TipoEmpreendimento,
} from "@/types/empreendimentos";
import { cn } from "@/lib/utils";

interface EmpreendimentoCardProps {
  empreendimento: Empreendimento;
  onClick: (emp: Empreendimento) => void;
}

const formatCurrency = (val: number) =>
  `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

export function EmpreendimentoCard({ empreendimento: emp, onClick }: EmpreendimentoCardProps) {
  const statusColor = statusEmpreendimentoColors[emp.status as EmpreendimentoStatus] || "";
  const statusLabel = statusEmpreendimentoLabels[emp.status as EmpreendimentoStatus] || emp.status;
  const tipoLabel = tipoEmpreendimentoLabels[emp.tipo_empreendimento as TipoEmpreendimento] || emp.tipo_empreendimento;

  return (
    <Card
      className="stat-card overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
      onClick={() => onClick(emp)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {emp.nome_empreendimento}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{emp.construtora}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
            {tipoLabel}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 mb-2 text-sm">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground line-clamp-1">{emp.cidade}/{emp.estado}</span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-3 text-xs">
          {emp.mes_ano_habitese && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">Habite-se: {emp.mes_ano_habitese}</span>
            </div>
          )}
          {emp.vgv_estimado && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{formatCurrency(emp.vgv_estimado)}</span>
            </div>
          )}
          {emp.consultor_responsavel_nome && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{emp.consultor_responsavel_nome}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Badge className={cn("text-xs", statusColor)}>
            {statusLabel}
          </Badge>
          {emp.ticket_medio ? (
            <span className="text-xs text-muted-foreground">
              Ticket: {formatCurrency(emp.ticket_medio)}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
