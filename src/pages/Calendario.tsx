import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportImportButtons } from "@/components/shared/ExportImportButtons";
import { mockActivities, mockUsers } from "@/data/mockData";
import { Activity, ActivityCategory } from "@/types/crm";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Phone, 
  Mail, 
  Users, 
  MapPin, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Clock,
  Download,
  Edit,
  Trash2,
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  addDays,
} from "date-fns";
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

const categoryLabels: Record<ActivityCategory, string> = {
  comercial: "Comercial",
  trade_marketing: "Trade e Marketing",
  tecnologia: "Tecnologia",
  cre: "CRE",
};

const categoryColors: Record<ActivityCategory, string> = {
  comercial: "bg-primary/10 text-primary",
  trade_marketing: "bg-secondary/10 text-secondary",
  tecnologia: "bg-blue-100 text-blue-600",
  cre: "bg-amber-100 text-amber-700",
};

const exportColumns = [
  { key: "titulo", label: "Título", required: true },
  { key: "tipo", label: "Tipo", required: true },
  { key: "categoria", label: "Categoria" },
  { key: "dataAgendada", label: "Data Agendada", required: true },
  { key: "responsavelNome", label: "Responsável" },
  { key: "concluida", label: "Status" },
  { key: "descricao", label: "Comentário" },
];

const Calendario = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities] = useState<Activity[]>(mockActivities);
  const [consultorFilter, setConsultorFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("consultor");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const filteredActivities = activities.filter(activity => {
    if (consultorFilter === "all") return true;
    return activity.responsavelId === consultorFilter;
  });

  const getActivitiesForDate = (date: Date) => {
    return filteredActivities.filter((activity) =>
      isSameDay(activity.dataAgendada, date)
    );
  };

  const selectedActivities = getActivitiesForDate(selectedDate);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Timeline view - next 14 days
  const timelineDays = eachDayOfInterval({
    start: new Date(),
    end: addDays(new Date(), 13),
  });

  const renderCalendarView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <div className="stat-card">
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

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {activityLabels[activity.tipo]}
                      </Badge>
                      <Badge className={cn("text-xs", categoryColors[activity.categoria])}>
                        {categoryLabels[activity.categoria]}
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
                    {activity.responsavelNome && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.responsavelNome}
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
  );

  const renderTimelineView = () => (
    <div className="stat-card">
      <div className="space-y-4">
        {timelineDays.map((day) => {
          const dayActivities = getActivitiesForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toISOString()} className="border-l-2 border-border pl-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-3 h-3 rounded-full -ml-[21px]",
                  isToday ? "bg-primary" : "bg-muted-foreground/30"
                )} />
                <h4 className={cn(
                  "font-semibold",
                  isToday && "text-primary"
                )}>
                  {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h4>
                {isToday && (
                  <Badge className="bg-primary text-primary-foreground text-xs">Hoje</Badge>
                )}
              </div>
              
              {dayActivities.length > 0 ? (
                <div className="space-y-2 ml-2">
                  {dayActivities.map((activity) => {
                    const Icon = activityIcons[activity.tipo];
                    return (
                      <div 
                        key={activity.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg border",
                          activityColors[activity.tipo]
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.titulo}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(activity.dataAgendada, "HH:mm")}
                            <span>•</span>
                            {activity.responsavelNome}
                          </div>
                        </div>
                        <Badge className={cn("text-xs", categoryColors[activity.categoria])}>
                          {categoryLabels[activity.categoria]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 ml-2">Sem atividades</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="stat-card p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Data</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Categoria</TableHead>
            <TableHead className="font-semibold">Título</TableHead>
            <TableHead className="font-semibold">Responsável</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Comentário</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredActivities
            .sort((a, b) => a.dataAgendada.getTime() - b.dataAgendada.getTime())
            .map((activity) => {
              const Icon = activityIcons[activity.tipo];
              return (
                <TableRow key={activity.id} className="table-row-hover">
                  <TableCell className="font-medium">
                    {format(activity.dataAgendada, "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-lg border",
                        activityColors[activity.tipo]
                      )}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-sm">{activityLabels[activity.tipo]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", categoryColors[activity.categoria])}>
                      {categoryLabels[activity.categoria]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{activity.titulo}</TableCell>
                  <TableCell className="text-sm">{activity.responsavelNome || "—"}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={activity.concluida ? "secondary" : "outline"}
                      className={cn(
                        "text-xs",
                        activity.concluida && "bg-success/10 text-success"
                      )}
                    >
                      {activity.concluida ? "Concluída" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {activity.descricao || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AppLayout title="Calendário Unificado" subtitle="Gerencie atividades e compromissos">
      {/* Filters and Actions */}
      <div className="stat-card mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={consultorFilter} onValueChange={setConsultorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por consultor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Consultores</SelectItem>
                {mockUsers.filter(u => u.role === "consultor").map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">
              {filteredActivities.length} atividades
            </Badge>
          </div>
          <ExportImportButtons
            moduleName="atividades"
            data={filteredActivities}
            columns={exportColumns}
            templateFields={exportColumns}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="consultor" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Por Consultor</span>
          </TabsTrigger>
          <TabsTrigger value="geral" className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="planilha" className="flex items-center gap-1">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Planilha</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultor" className="space-y-6">
          {renderCalendarView()}
        </TabsContent>

        <TabsContent value="geral" className="space-y-6">
          {renderCalendarView()}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {renderTimelineView()}
        </TabsContent>

        <TabsContent value="planilha" className="space-y-6">
          {renderTableView()}
        </TabsContent>
      </Tabs>

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
          <div className="border-l border-border mx-2" />
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Badge key={key} className={cn("text-xs", categoryColors[key as ActivityCategory])}>
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendario;
