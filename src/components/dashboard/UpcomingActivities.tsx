import { Activity } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Phone, Mail, Users, MapPin, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UpcomingActivitiesProps {
  activities: Activity[];
}

const activityIcons = {
  ligacao: Phone,
  email: Mail,
  reuniao: Users,
  visita: MapPin,
  tarefa: CheckSquare,
};

const activityColors = {
  ligacao: "bg-blue-100 text-blue-600",
  email: "bg-purple-100 text-purple-600",
  reuniao: "bg-primary/10 text-primary",
  visita: "bg-success/10 text-success",
  tarefa: "bg-warning/30 text-warning-foreground",
};

export function UpcomingActivities({ activities }: UpcomingActivitiesProps) {
  return (
    <div className="stat-card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Próximas Atividades</h3>
          <p className="text-sm text-muted-foreground">Suas tarefas agendadas</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          Ver agenda
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.tipo];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 px-6 table-row-hover animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Checkbox
                checked={activity.concluida}
                className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
              />
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg",
                  activityColors[activity.tipo]
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-foreground",
                    activity.concluida && "line-through text-muted-foreground"
                  )}
                >
                  {activity.titulo}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(activity.dataAgendada, "dd 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}