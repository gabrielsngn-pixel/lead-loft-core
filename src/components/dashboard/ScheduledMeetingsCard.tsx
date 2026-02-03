import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { Calendar, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format, startOfDay, endOfDay, addDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ScheduledMeetingsCardProps {
  contatos: Lead[];
}

export function ScheduledMeetingsCard({ contatos }: ScheduledMeetingsCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const today = new Date();
  const todayStart = startOfDay(today);
  const next7Days = endOfDay(addDays(todayStart, 7));
  
  // Get all contacts with meetings in the next 7 days
  const contatosComReuniaoAgendada = contatos
    .filter(c => {
      if (!c.proximaReuniao) return false;
      const reuniaoDate = startOfDay(c.proximaReuniao);
      return reuniaoDate >= todayStart && reuniaoDate <= next7Days;
    })
    .sort((a, b) => {
      if (!a.proximaReuniao || !b.proximaReuniao) return 0;
      return a.proximaReuniao.getTime() - b.proximaReuniao.getTime();
    });

  const count = contatosComReuniaoAgendada.length;

  return (
    <Card className="stat-card p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Reuniões Agendadas (7d)</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs leading-relaxed">
                <p>Quantidade de contatos com reuniões agendadas nos próximos 7 dias (janela D+7). Cada registro de contato é contabilizado individualmente.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="secondary" className="ml-auto text-lg font-bold">
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count > 0 ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              <span>Ver detalhes</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {expanded && (
              <div className="space-y-2 pt-2 animate-fade-in">
                {contatosComReuniaoAgendada.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contact.nomeFantasia || contact.razaoSocial}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {contact.proximaReuniao && format(contact.proximaReuniao, "EEEE, dd/MM", { locale: ptBR })}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {contact.responsavelNome?.split(" ")[0]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma reunião agendada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
