import { useEffect, useState } from "react";
import { Lead } from "@/types/crm";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TomorrowMeetingsAlertProps {
  contatos: Lead[];
}

export function TomorrowMeetingsAlert({ contatos }: TomorrowMeetingsAlertProps) {
  const { profile, isMaster, isGestor } = useAuth();
  const [open, setOpen] = useState(false);

  const tomorrow = addDays(new Date(), 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  const tomorrowMeetings = contatos.filter((c) => {
    if (!c.proximaReuniao) return false;
    return c.proximaReuniao >= tomorrowStart && c.proximaReuniao <= tomorrowEnd;
  });

  // For consultores: only show their own meetings
  const isConsultorOrSDR = !isMaster && !isGestor;
  const relevantMeetings = isConsultorOrSDR
    ? tomorrowMeetings.filter((c) => c.responsavelId === profile?.user_id)
    : tomorrowMeetings;

  // Only show once per session
  useEffect(() => {
    if (relevantMeetings.length === 0) return;
    const sessionKey = `tomorrow_meetings_alert_${format(new Date(), "yyyy-MM-dd")}`;
    if (!sessionStorage.getItem(sessionKey)) {
      setOpen(true);
      sessionStorage.setItem(sessionKey, "shown");
    }
  }, [relevantMeetings.length]);

  if (relevantMeetings.length === 0) return null;

  const title = isMaster || isGestor
    ? "Seus consultores têm reuniões agendadas para amanhã"
    : "Você tem reuniões agendadas para amanhã";

  // Group by consultant for master/gestor view
  const byConsultor = new Map<string, Lead[]>();
  relevantMeetings.forEach((m) => {
    const key = m.responsavelNome || "Sem consultor";
    if (!byConsultor.has(key)) byConsultor.set(key, []);
    byConsultor.get(key)!.push(m);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Reuniões Amanhã
          </DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {(isMaster || isGestor) ? (
            Array.from(byConsultor.entries()).map(([consultor, meetings]) => (
              <div key={consultor} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{consultor}</span>
                  <Badge variant="secondary" className="text-xs">{meetings.length}</Badge>
                </div>
                {meetings.map((m) => (
                  <div key={m.id} className="ml-6 p-2 rounded-lg bg-muted/30 text-sm">
                    <div className="font-medium">{m.nomeFantasia || m.razaoSocial}</div>
                    {m.nomeContato && <div className="text-xs text-muted-foreground">{m.nomeContato}</div>}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {m.proximaReuniao && format(m.proximaReuniao, "HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            relevantMeetings.map((m) => (
              <div key={m.id} className="p-3 rounded-lg bg-muted/30">
                <div className="font-medium text-sm">{m.nomeFantasia || m.razaoSocial}</div>
                {m.nomeContato && <div className="text-xs text-muted-foreground">{m.nomeContato}</div>}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {m.proximaReuniao && format(m.proximaReuniao, "HH:mm")}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={() => setOpen(false)}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
