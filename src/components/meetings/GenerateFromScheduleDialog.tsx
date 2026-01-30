import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Wand2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockActivities, mockLeads } from "@/data/mockData";
import { Activity } from "@/types/crm";
import { MeetingMinutes } from "@/types/meetings";

interface GenerateFromScheduleDialogProps {
  onGenerate: (data: Partial<MeetingMinutes>) => void;
}

export function GenerateFromScheduleDialog({ onGenerate }: GenerateFromScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Filter for meeting type activities
  const meetingActivities = mockActivities.filter(
    (a) => a.tipo === "reuniao" && !a.concluida
  );

  const handleSelect = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleGenerate = () => {
    if (!selectedActivity) return;

    const lead = mockLeads.find((l) => l.id === selectedActivity.leadId);

    const prefilledData: Partial<MeetingMinutes> = {
      leadId: selectedActivity.leadId,
      empresa: lead?.nomeFantasia || lead?.razaoSocial || "",
      cnpj: lead?.cnpj || "",
      dataReuniao: selectedActivity.dataAgendada,
      horaInicio: format(selectedActivity.dataAgendada, "HH:mm"),
      consultorId: selectedActivity.responsavelId,
      consultorNome: selectedActivity.responsavelNome || "",
      participantes: [
        selectedActivity.responsavelNome || "",
        lead?.nomeContato || "",
      ].filter(Boolean),
      objetivos: selectedActivity.descricao || selectedActivity.titulo,
      tipoReuniao: "apresentacao",
    };

    onGenerate(prefilledData);
    setOpen(false);
    setSelectedActivity(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="w-4 h-4" />
          Gerar a partir de agendamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Selecionar Reunião Agendada
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {meetingActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma reunião agendada encontrada
              </div>
            ) : (
              meetingActivities.map((activity) => {
                const lead = mockLeads.find((l) => l.id === activity.leadId);
                const isSelected = selectedActivity?.id === activity.id;

                return (
                  <div
                    key={activity.id}
                    onClick={() => handleSelect(activity)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {lead?.nomeFantasia || lead?.razaoSocial || "Empresa não vinculada"}
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.titulo}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {format(activity.dataAgendada, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {activity.responsavelNome}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedActivity}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Wand2 className="w-4 h-4" />
            Gerar Ata
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
