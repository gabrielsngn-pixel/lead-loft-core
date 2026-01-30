import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "@/types/crm";
import { format, isWithinInterval, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingMeetingsProps {
  activities: Activity[];
}

export function UpcomingMeetings({ activities }: UpcomingMeetingsProps) {
  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7));
  
  const upcomingMeetings = activities
    .filter(a => 
      a.tipo === "reuniao" && 
      !a.concluida &&
      isWithinInterval(a.dataAgendada, { start: today, end: nextWeek })
    )
    .sort((a, b) => a.dataAgendada.getTime() - b.dataAgendada.getTime())
    .slice(0, 5);

  return (
    <Card className="stat-card p-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Reuniões - Próximos 7 dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingMeetings.length > 0 ? (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div 
                key={meeting.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{meeting.titulo}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(meeting.dataAgendada, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {meeting.responsavelNome?.split(" ")[0]}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma reunião agendada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
