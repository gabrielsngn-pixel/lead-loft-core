import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingMinutesForm } from "@/components/meetings/MeetingMinutesForm";
import { MeetingsList } from "@/components/meetings/MeetingsList";
import { MeetingViewDialog } from "@/components/meetings/MeetingViewDialog";
import { GenerateFromScheduleDialog } from "@/components/meetings/GenerateFromScheduleDialog";
import { MeetingMinutes } from "@/types/meetings";
import { mockMeetingMinutes } from "@/data/mockMeetings";
import { toast } from "@/hooks/use-toast";

export default function Reunioes() {
  const [meetings, setMeetings] = useState<MeetingMinutes[]>(mockMeetingMinutes);
  const [activeTab, setActiveTab] = useState<"lista" | "nova">("lista");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinutes | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<Partial<MeetingMinutes> | undefined>();

  const handleSaveMinutes = (data: Partial<MeetingMinutes>) => {
    const newMeeting = data as MeetingMinutes;
    setMeetings((prev) => {
      const existing = prev.findIndex((m) => m.id === newMeeting.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newMeeting;
        return updated;
      }
      return [newMeeting, ...prev];
    });
    setActiveTab("lista");
    setPrefilledData(undefined);
  };

  const handleViewMeeting = (meeting: MeetingMinutes) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const handleArchiveMeeting = (meetingId: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, arquivada: true } : m))
    );
    toast({
      title: "Ata arquivada",
      description: "A ata foi movida para o arquivo.",
    });
  };

  const handleGenerateFromSchedule = (data: Partial<MeetingMinutes>) => {
    setPrefilledData(data);
    setActiveTab("nova");
  };

  const handleNewMeeting = () => {
    setPrefilledData(undefined);
    setActiveTab("nova");
  };

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
