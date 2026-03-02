import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExportImportButtons } from "@/components/shared/ExportImportButtons";
import { mockUsers } from "@/data/mockData";
import { Activity, ActivityCategory, ActivityStatus } from "@/types/crm";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useActivities } from "@/hooks/useActivities";
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
  Edit,
  Trash2,
  Loader2,
  Undo2,
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
  comercial: "bg-primary/10 text-primary border-primary/20",
  trade_marketing: "bg-secondary/10 text-secondary border-secondary/20",
  tecnologia: "bg-blue-100 text-blue-600 border-blue-200",
  cre: "bg-amber-100 text-amber-700 border-amber-200",
};

const statusAndamentoLabels: Record<ActivityStatus, string> = {
  concluida: "Concluída",
  atrasada: "Atrasada",
  em_andamento: "Em Andamento",
  parada: "Parada",
};

const statusAndamentoColors: Record<ActivityStatus, string> = {
  concluida: "bg-success/10 text-success border-success/20",
  atrasada: "bg-destructive/10 text-destructive border-destructive/20",
  em_andamento: "bg-blue-100 text-blue-600 border-blue-200",
  parada: "bg-warning/30 text-warning-foreground border-warning/30",
};

const exportColumns = [
  { key: "titulo", label: "Título", required: true },
  { key: "tipo", label: "Tipo", required: true },
  { key: "categoria", label: "Categoria" },
  { key: "dataAgendada", label: "Data Agendada", required: true },
  { key: "responsavelNome", label: "Responsável" },
  { key: "statusAndamento", label: "Status" },
  { key: "descricao", label: "Comentário" },
];

const Calendario = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { activities, loading, createActivity, updateActivity, deleteActivity } = useActivities();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [consultorFilter, setConsultorFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("geral");
  const [isSaving, setIsSaving] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editForm, setEditForm] = useState({
    titulo: "",
    tipo: "tarefa" as Activity["tipo"],
    categoria: "comercial" as ActivityCategory,
    descricao: "",
    responsavelNome: "",
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  // New activity dialog state
  const [newActivityDialogOpen, setNewActivityDialogOpen] = useState(false);
  const [newActivityFromPlanilha, setNewActivityFromPlanilha] = useState(false);
  const [newActivityForm, setNewActivityForm] = useState({
    titulo: "",
    tipo: "tarefa" as Activity["tipo"],
    categoria: "comercial" as ActivityCategory,
    descricao: "",
    responsavelNome: "",
    dataAgendada: new Date(),
  });

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

  // Edit handlers
  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity);
    setEditForm({
      titulo: activity.titulo,
      tipo: activity.tipo,
      categoria: activity.categoria,
      descricao: activity.descricao || "",
      responsavelNome: activity.responsavelNome || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingActivity) return;

    setIsSaving(true);
    const result = await updateActivity(editingActivity.id, {
      titulo: editForm.titulo,
      tipo: editForm.tipo,
      categoria: editForm.categoria,
      descricao: editForm.descricao,
      responsavelNome: editForm.responsavelNome,
    });
    setIsSaving(false);

    if (result) {
      toast({
        title: "Atividade atualizada",
        description: `"${editForm.titulo}" foi atualizada com sucesso.`,
      });
      setEditDialogOpen(false);
      setEditingActivity(null);
    }
  };

  // New activity handlers - Visão Geral (auto-assign current user)
  const handleNewActivityClickGeral = () => {
    setNewActivityFromPlanilha(false);
    setNewActivityForm({
      titulo: "",
      tipo: "tarefa",
      categoria: "comercial",
      descricao: "",
      responsavelNome: profile?.nome || "",
      dataAgendada: selectedDate,
    });
    setNewActivityDialogOpen(true);
  };

  // New activity handlers - Planilha (manual input)
  const handleNewActivityClickPlanilha = () => {
    setNewActivityFromPlanilha(true);
    setNewActivityForm({
      titulo: "",
      tipo: "tarefa",
      categoria: "comercial",
      descricao: "",
      responsavelNome: "",
      dataAgendada: new Date(),
    });
    setNewActivityDialogOpen(true);
  };

  const handleSaveNewActivity = async () => {
    if (!newActivityForm.titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await createActivity({
      titulo: newActivityForm.titulo,
      tipo: newActivityForm.tipo,
      categoria: newActivityForm.categoria,
      descricao: newActivityForm.descricao,
      responsavelId: profile?.user_id || "",
      responsavelNome: newActivityForm.responsavelNome,
      dataAgendada: newActivityForm.dataAgendada,
      concluida: false,
      statusAndamento: "em_andamento",
    });
    setIsSaving(false);

    if (result) {
      toast({
        title: "Atividade criada",
        description: `"${newActivityForm.titulo}" foi adicionada com sucesso.`,
      });
      setNewActivityDialogOpen(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (activity: Activity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;

    setIsSaving(true);
    const success = await deleteActivity(activityToDelete.id);
    setIsSaving(false);

    if (success) {
      toast({
        title: "Atividade excluída",
        description: `"${activityToDelete.titulo}" foi removida.`,
      });
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  // Helper: check if activity is a deletion activity
  const isDeletionActivity = (activity: Activity) =>
    activity.titulo.startsWith("Exclusão de contato");

  // Handle "Não aprovar exclusão" — restore contact to consultant's base
  const handleRejectDeletion = async (activity: Activity) => {
    setIsSaving(true);
    try {
      let deletedRecord: any = null;

      // Try finding by lead_id first
      if (activity.leadId) {
        const { data } = await supabase
          .from("deleted_contacts")
          .select("*")
          .eq("lead_id", activity.leadId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        deletedRecord = data;
      }

      // Fallback: parse company name from title and search by razao_social
      if (!deletedRecord && activity.titulo.startsWith("Exclusão de contato - ")) {
        const empresaNome = activity.titulo.replace("Exclusão de contato - ", "");
        const { data } = await supabase
          .from("deleted_contacts")
          .select("*")
          .ilike("razao_social", `%${empresaNome}%`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        deletedRecord = data;
      }

      if (!deletedRecord) {
        toast({ title: "Erro", description: "Registro de exclusão não encontrado.", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      // 2. Restore lead status to "qualificado" and re-assign to original consultant
      await supabase
        .from("leads")
        .update({
          status: "qualificado",
          responsavel_id: deletedRecord.responsavel_id,
          responsavel_nome: deletedRecord.responsavel_nome,
          data_ultima_interacao: new Date().toISOString(),
        })
        .eq("id", deletedRecord.lead_id);

      // 3. Remove from deleted_contacts repository
      await supabase.from("deleted_contacts").delete().eq("id", deletedRecord.id);

      // 4. Mark activity as concluded
      await updateActivity(activity.id, {
        concluida: true,
        statusAndamento: "concluida",
        dataConclusao: new Date(),
        descricao: (activity.descricao || "") + `\n\n❌ Exclusão NÃO APROVADA por ${profile?.nome}. Contato devolvido para ${deletedRecord.responsavel_nome || "consultor"}.`,
      });

      toast({
        title: "Exclusão não aprovada",
        description: `Contato devolvido para a base de ${deletedRecord.responsavel_nome || "consultor"}.`,
      });
    } catch (err: any) {
      console.error("Erro ao rejeitar exclusão:", err);
      toast({ title: "Erro ao restaurar contato", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Group activities by category
  const activitiesByCategory = filteredActivities.reduce((acc, activity) => {
    if (!acc[activity.categoria]) {
      acc[activity.categoria] = [];
    }
    acc[activity.categoria].push(activity);
    return acc;
  }, {} as Record<ActivityCategory, Activity[]>);

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
                      {dayActivities.slice(0, 3).map((activity) => (
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
            <Button size="sm" onClick={handleNewActivityClickGeral}>
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
                    {isDeletionActivity(activity) && !activity.concluida && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={isSaving}
                        onClick={() => handleRejectDeletion(activity)}
                      >
                        <Undo2 className="w-3 h-3 mr-1" />
                        Não aprovar exclusão
                      </Button>
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
                        {isDeletionActivity(activity) && !activity.concluida && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={isSaving}
                            onClick={() => handleRejectDeletion(activity)}
                          >
                            <Undo2 className="w-3 h-3 mr-1" />
                            Não aprovar
                          </Button>
                        )}
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
    <div className="space-y-6">
      {/* Header with New Activity button */}
      <div className="flex justify-end">
        <Button onClick={handleNewActivityClickPlanilha}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Atividade
        </Button>
      </div>

      {/* Agrupado por categoria */}
      {(Object.entries(categoryLabels) as [ActivityCategory, string][]).map(([category, label]) => {
        const categoryActivities = activitiesByCategory[category] || [];
        if (categoryActivities.length === 0) return null;

        return (
          <div key={category} className="stat-card p-0 overflow-hidden">
            {/* Cabeçalho da categoria */}
            <div className={cn("px-4 py-3 border-b", categoryColors[category])}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{label}</h3>
                <Badge variant="secondary">{categoryActivities.length} atividades</Badge>
              </div>
            </div>

            {/* Tabela de atividades da categoria */}
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Título</TableHead>
                  <TableHead className="font-semibold">Responsável</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Comentário</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryActivities
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
                        <TableCell className="font-medium">{activity.titulo}</TableCell>
                        <TableCell className="text-sm">{activity.responsavelNome || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={activity.statusAndamento || "em_andamento"}
                            onValueChange={(value: ActivityStatus) => {
                              updateActivity(activity.id, { 
                                statusAndamento: value,
                                concluida: value === "concluida",
                                dataConclusao: value === "concluida" ? new Date() : undefined,
                              });
                            }}
                          >
                            <SelectTrigger className={cn(
                              "h-8 w-[140px] text-xs border",
                              statusAndamentoColors[activity.statusAndamento || "em_andamento"]
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(statusAndamentoLabels) as [ActivityStatus, string][]).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  <span className={cn("text-xs", statusAndamentoColors[key].split(" ")[1])}>
                                    {label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {activity.descricao || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              title="Editar"
                              onClick={() => handleEditClick(activity)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {isDeletionActivity(activity) && !activity.concluida && (
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10" 
                                title="Não aprovar exclusão"
                                disabled={isSaving}
                                onClick={() => handleRejectDeletion(activity)}
                              >
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive" 
                              title="Excluir"
                              onClick={() => handleDeleteClick(activity)}
                            >
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
      })}

      {/* Caso não haja atividades */}
      {Object.values(activitiesByCategory).every((arr) => arr.length === 0) && (
        <div className="stat-card text-center py-12">
          <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <AppLayout title="Calendário Unificado" subtitle="Gerencie atividades e compromissos">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando atividades...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
        <TabsList className="grid w-full max-w-md grid-cols-3">
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Atividade</DialogTitle>
            <DialogDescription>Atualize os dados da atividade selecionada.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={editForm.titulo}
                onChange={(e) => setEditForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Título da atividade"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editForm.tipo}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, tipo: v as Activity["tipo"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(activityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editForm.categoria}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, categoria: v as ActivityCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={editForm.responsavelNome}
                onChange={(e) => setEditForm((p) => ({ ...p, responsavelNome: e.target.value }))}
                placeholder="Digite o nome do responsável"
              />
            </div>

            <div className="space-y-2">
              <Label>Comentário</Label>
              <Textarea
                value={editForm.descricao}
                onChange={(e) => setEditForm((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição ou comentários..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a atividade <strong>"{activityToDelete?.titulo}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Activity Dialog */}
      <Dialog open={newActivityDialogOpen} onOpenChange={setNewActivityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
            <DialogDescription>Adicione uma nova atividade ao calendário.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={newActivityForm.titulo}
                onChange={(e) => setNewActivityForm((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Título da atividade"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newActivityForm.tipo}
                  onValueChange={(v) => setNewActivityForm((p) => ({ ...p, tipo: v as Activity["tipo"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(activityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newActivityForm.categoria}
                  onValueChange={(v) => setNewActivityForm((p) => ({ ...p, categoria: v as ActivityCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              {newActivityFromPlanilha ? (
                <Input
                  value={newActivityForm.responsavelNome}
                  onChange={(e) => setNewActivityForm((p) => ({ ...p, responsavelNome: e.target.value }))}
                  placeholder="Digite o nome do responsável"
                />
              ) : (
                <Input
                  value={newActivityForm.responsavelNome}
                  disabled
                  className="bg-muted"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="datetime-local"
                value={format(newActivityForm.dataAgendada, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setNewActivityForm((p) => ({ ...p, dataAgendada: new Date(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Comentário</Label>
              <Textarea
                value={newActivityForm.descricao}
                onChange={(e) => setNewActivityForm((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição ou comentários..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewActivityDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveNewActivity} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Atividade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Calendario;
