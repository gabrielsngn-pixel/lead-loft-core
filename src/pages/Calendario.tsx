import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { mockActivities } from "@/data/mockData";
import { Activity } from "@/types/crm";
import { cn } from "@/lib/utils";
import { Plus, Phone, Mail, Users, MapPin, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityIcons = {
  ligacao: Phone,
  email: Mail,
  reuniao: Users,
  visita: MapPin,
  tarefa: CheckSquare,
};

const activityColors = {
  ligacao: "bg-blue-100 text-blue-600 border-blue-200",
  email: "bg-purple-100 text-purple-600 border-purple-200",
  reuniao: "bg-primary/10 text-primary border-primary/20",
  visita: "bg-success/10 text-success border-success/20",
  tarefa: "bg-warning/30 text-warning-foreground border-warning/30",
};

const activityLabels = {
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  visita: "Visita",
  tarefa: "Tarefa",
};

const Calendario = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities] = useState<Activity[]>(mockActivities);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getActivitiesForDate = (date: Date) => {
    return activities.filter((activity) =>
      isSameDay(activity.dataAgendada, date)
    );
  };

  const selectedActivities = getActivitiesForDate(selectedDate);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  // Get the first day of the month and calculate padding
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <AppLayout title="Calendário" subtitle="Gerencie suas atividades e compromissos">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="stat-card">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold capitalize">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding for first week */}
              {paddingDays.map((i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}

              {/* Days */}
              {days.map((day, index) => {
                const dayActivities = getActivitiesForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-lg transition-all duration-200 relative",
                      "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                      isToday && !isSelected && "ring-2 ring-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        !isSameMonth(day, currentDate) && "text-muted-foreground/50"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayActivities.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayActivities.slice(0, 3).map((activity, i) => (
                          <div
                            key={activity.id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-primary-foreground" : "bg-primary"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activities Panel */}
        <div className="stat-card p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedActivities.length} atividade{selectedActivities.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {selectedActivities.length > 0 ? (
              selectedActivities.map((activity) => {
                const Icon = activityIcons[activity.tipo];
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 table-row-hover"
                  >
                    <Checkbox
                      checked={activity.concluida}
                      className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
                    />
                    <div
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg border",
                        activityColors[activity.tipo]
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {activityLabels[activity.tipo]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(activity.dataAgendada, "HH:mm")}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "font-medium text-sm",
                          activity.concluida && "line-through text-muted-foreground"
                        )}
                      >
                        {activity.titulo}
                      </p>
                      {activity.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <CheckSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhuma atividade agendada
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Clique em "Nova" para adicionar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Legend */}
      <div className="mt-6 stat-card">
        <h3 className="font-semibold mb-4">Legenda de Atividades</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(activityLabels).map(([key, label]) => {
            const Icon = activityIcons[key as keyof typeof activityIcons];
            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg border",
                    activityColors[key as keyof typeof activityColors]
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendario;