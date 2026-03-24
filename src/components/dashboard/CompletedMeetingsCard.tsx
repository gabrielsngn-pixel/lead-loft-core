import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { CalendarCheck, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
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

interface CompletedMeetingsCardProps {
  contatos: Lead[];
}

export function CompletedMeetingsCard({ contatos }: CompletedMeetingsCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const today = new Date();
  const sevenDaysAgo = startOfDay(subDays(today, 7));
  
  const todayStart = startOfDay(today);
  
  // Get all contacts with meetings completed (past dates within last 7 days)
  // Check BOTH ultimaReuniao and proximaReuniao - if the date is in the past, it counts as completed
  const contatosComReuniaoRealizada = contatos
    .filter(c => {
      const ultimaPassada = c.ultimaReuniao && startOfDay(c.ultimaReuniao) >= sevenDaysAgo && startOfDay(c.ultimaReuniao) <= todayStart;
      const proximaPassada = c.proximaReuniao && startOfDay(c.proximaReuniao) >= sevenDaysAgo && startOfDay(c.proximaReuniao) <= todayStart;
      return ultimaPassada || proximaPassada;
    })
    .sort((a, b) => {
      const getDate = (c: Lead) => {
        const ultPassada = c.ultimaReuniao && startOfDay(c.ultimaReuniao) <= todayStart && c.ultimaReuniao >= sevenDaysAgo ? c.ultimaReuniao : null;
        const proxPassada = c.proximaReuniao && startOfDay(c.proximaReuniao) <= todayStart && c.proximaReuniao >= sevenDaysAgo ? c.proximaReuniao : null;
        return ultPassada || proxPassada;
      };
      const dateA = getDate(a);
      const dateB = getDate(b);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

  const count = contatosComReuniaoRealizada.length;

  return (
    <Card className="stat-card p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" />
          <span>Reuniões Realizadas (7d)</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] text-xs leading-relaxed">
                <p>Quantidade de contatos com reuniões realizadas nos últimos 7 dias (janela D-7). Cada registro de contato é contabilizado individualmente.</p>
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
                {contatosComReuniaoRealizada.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contact.nomeFantasia || contact.razaoSocial}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const ultPassada = contact.ultimaReuniao && startOfDay(contact.ultimaReuniao) <= todayStart && contact.ultimaReuniao >= sevenDaysAgo ? contact.ultimaReuniao : null;
                          const proxPassada = contact.proximaReuniao && startOfDay(contact.proximaReuniao) <= todayStart && contact.proximaReuniao >= sevenDaysAgo ? contact.proximaReuniao : null;
                          const meetingDate = ultPassada || proxPassada;
                          return meetingDate ? format(meetingDate, "EEEE, dd/MM", { locale: ptBR }) : "";
                        })()}
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
            <CalendarCheck className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma reunião realizada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
