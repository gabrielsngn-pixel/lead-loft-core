import { useState } from "react";
import { Lead } from "@/types/crm";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, X, ChevronUp, ChevronDown } from "lucide-react";
import { format, addDays, startOfDay, endOfDay } from "date-fns";

interface TomorrowMeetingsAlertProps {
  contatos: Lead[];
}

export function TomorrowMeetingsAlert({ contatos }: TomorrowMeetingsAlertProps) {
  const { profile, isMaster, isGestor } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const tomorrow = addDays(new Date(), 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  const tomorrowMeetings = contatos.filter((c) => {
    if (!c.proximaReuniao) return false;
    return c.proximaReuniao >= tomorrowStart && c.proximaReuniao <= tomorrowEnd;
  });

  const isConsultorOrSDR = !isMaster && !isGestor;
  const relevantMeetings = isConsultorOrSDR
    ? tomorrowMeetings.filter((c) => c.responsavelId === profile?.user_id)
    : tomorrowMeetings;

  if (relevantMeetings.length === 0 || dismissed) return null;

  const title = isMaster || isGestor
    ? "Consultores com reuniões amanhã"
    : "Suas reuniões amanhã";

  const byConsultor = new Map<string, Lead[]>();
  relevantMeetings.forEach((m) => {
    const key = m.responsavelNome || "Sem consultor";
    if (!byConsultor.has(key)) byConsultor.set(key, []);
    byConsultor.get(key)!.push(m);
  });

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
      <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl border border-primary/20 w-80 overflow-hidden">
        {/* Header - always visible */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold text-sm">{title}</span>
            <Badge variant="secondary" className="text-xs font-bold">
              {relevantMeetings.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              className="rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="bg-background text-foreground p-3 space-y-2 max-h-64 overflow-y-auto border-t border-border">
            {(isMaster || isGestor) ? (
              Array.from(byConsultor.entries()).map(([consultor, meetings]) => (
                <div key={consultor} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-xs">{consultor}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{meetings.length}</Badge>
                  </div>
                  {meetings.map((m) => (
                    <div key={m.id} className="ml-5 p-1.5 rounded bg-muted/40 text-xs">
                      <div className="font-medium">{m.nomeFantasia || m.razaoSocial}</div>
                      {m.proximaReuniao && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(m.proximaReuniao, "HH:mm")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              relevantMeetings.map((m) => (
                <div key={m.id} className="p-2 rounded bg-muted/40 text-xs">
                  <div className="font-medium">{m.nomeFantasia || m.razaoSocial}</div>
                  {m.proximaReuniao && (
                    <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(m.proximaReuniao, "HH:mm")}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
