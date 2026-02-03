import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { AlertCircle, AlertTriangle, Calendar, Activity, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContactsWithoutActionAlertProps {
  contatosAlertaSla: Lead[];
  contatosSemAcaoLista: Lead[];
}

export function ContactsWithoutActionAlert({ contatosAlertaSla, contatosSemAcaoLista }: ContactsWithoutActionAlertProps) {
  const today = new Date();
  
  // Combine both lists, SLA alerts first
  const hasAlerts = contatosAlertaSla.length > 0 || contatosSemAcaoLista.length > 0;

  return (
    <Card className="stat-card p-0 border-warning/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning-foreground" />
          <span>Alertas de Atendimento</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs leading-relaxed">
                <p className="font-semibold mb-1">Alerta de SLA:</p>
                <p className="mb-2">Contatos com última reunião há mais de 10 dias e sem nova reunião agendada.</p>
                <p className="font-semibold mb-1">Sem próxima ação:</p>
                <p>Contatos sem reunião futura ou atividade programada.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAlerts ? (
          <div className="space-y-3">
            {/* SLA Alerts - Priority */}
            {contatosAlertaSla.slice(0, 3).map((contact) => {
              const diasSemReuniao = contact.ultimaReuniao 
                ? differenceInDays(today, contact.ultimaReuniao)
                : 0;
              
              return (
                <div 
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors border-l-4 border-l-destructive"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {contact.nomeFantasia || contact.razaoSocial}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.responsavelNome || "Sem responsável"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      SLA: {diasSemReuniao}d
                    </Badge>
                  </div>
                </div>
              );
            })}
            
            {/* Contacts without action */}
            {contatosSemAcaoLista.slice(0, 3 - Math.min(contatosAlertaSla.length, 3)).map((contact) => (
              <div 
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {contact.nomeFantasia || contact.razaoSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contact.responsavelNome || "Sem responsável"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs flex items-center gap-1 text-warning-foreground border-warning/30">
                    <Calendar className="w-3 h-3" />
                    Sem agenda
                  </Badge>
                </div>
              </div>
            ))}
            
            {(contatosAlertaSla.length + contatosSemAcaoLista.length) > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{(contatosAlertaSla.length + contatosSemAcaoLista.length) - 3} outros alertas
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="w-10 h-10 text-success/30 mb-2" />
            <p className="text-sm text-success">Todos os contatos estão em dia!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
