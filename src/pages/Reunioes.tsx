import { useState } from "react";
import { Plus, FileText, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingMinutesForm } from "@/components/meetings/MeetingMinutesForm";
import { MeetingsList } from "@/components/meetings/MeetingsList";
import { MeetingViewDialog } from "@/components/meetings/MeetingViewDialog";
import { GenerateFromScheduleDialog } from "@/components/meetings/GenerateFromScheduleDialog";
import { MeetingMinutes } from "@/types/meetings";
import { useMeetings } from "@/hooks/useMeetings";

export default function Reunioes() {
  const { meetings, loading, createMeeting, deleteMeeting, archiveMeeting } = useMeetings();
  const [activeTab, setActiveTab] = useState<"lista" | "nova">("lista");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinutes | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<Partial<MeetingMinutes> | undefined>();

  const handleSaveMinutes = async (data: Partial<MeetingMinutes>) => {
    const result = await createMeeting({
      leadId: data.leadId,
      negociacaoId: data.negociacaoId,
      empresa: data.empresa || "",
      cnpj: data.cnpj || "",
      tipoReuniao: data.tipoReuniao || "apresentacao",
      dataReuniao: data.dataReuniao || new Date(),
      horaInicio: data.horaInicio,
      horaFim: data.horaFim,
      consultorNome: data.consultorNome || "",
      participantes: data.participantes || [],
      objetivos: data.objetivos,
      pauta: data.pauta,
      discussao: data.discussao,
      decisoes: data.decisoes,
      proximosPassos: data.proximosPassos,
      observacoes: data.observacoes,
      status: data.status || "realizada",
      vinculadaContato: !!data.leadId,
    });

    if (result) {
      setActiveTab("lista");
      setPrefilledData(undefined);
    }
  };

  const handleViewMeeting = (meeting: MeetingMinutes) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const handleArchiveMeeting = async (meetingId: string) => {
    await archiveMeeting(meetingId);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    await deleteMeeting(meetingId);
  };

  const handleGenerateFromSchedule = (data: Partial<MeetingMinutes>) => {
    setPrefilledData(data);
    setActiveTab("nova");
  };

  const handleNewMeeting = () => {
    setPrefilledData(undefined);
    setActiveTab("nova");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Reuniões & Atas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie atas de reunião com identidade visual padronizada
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GenerateFromScheduleDialog onGenerate={handleGenerateFromSchedule} />
            <Button onClick={handleNewMeeting} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Nova Ata
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "lista" | "nova")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="lista" className="gap-2">
              <FileText className="w-4 h-4" />
              Repositório
            </TabsTrigger>
            <TabsTrigger value="nova" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Ata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-6">
            <MeetingsList
              meetings={meetings}
              onView={handleViewMeeting}
              onArchive={handleArchiveMeeting}
              onDelete={handleDeleteMeeting}
            />
          </TabsContent>

          <TabsContent value="nova" className="mt-6">
            <MeetingMinutesForm
              initialData={prefilledData}
              onSave={handleSaveMinutes}
              onExportPdf={(data) => console.log("Export PDF:", data)}
            />
          </TabsContent>
        </Tabs>

        {/* View Dialog */}
        <MeetingViewDialog
          meeting={selectedMeeting}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
