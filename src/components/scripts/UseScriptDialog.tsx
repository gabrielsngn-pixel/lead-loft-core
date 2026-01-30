import { useState } from "react";
import { FileText, Link2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { mockLeads } from "@/data/mockData";
import { mockMeetingMinutes } from "@/data/mockMeetings";

interface UseScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredQuestions: Record<string, number[]>;
  onConfirm: (data: {
    leadId?: string;
    reuniaoId?: string;
    notas: string;
  }) => void;
}

export function UseScriptDialog({
  open,
  onOpenChange,
  answeredQuestions,
  onConfirm,
}: UseScriptDialogProps) {
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [selectedReuniao, setSelectedReuniao] = useState<string>("");
  const [notas, setNotas] = useState("");

  const totalAnswered = Object.values(answeredQuestions).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  const handleConfirm = () => {
    onConfirm({
      leadId: selectedLead || undefined,
      reuniaoId: selectedReuniao || undefined,
      notas,
    });

    toast({
      title: "Script registrado!",
      description: "O uso do script foi vinculado ao contato/reunião selecionado.",
    });

    setSelectedLead("");
    setSelectedReuniao("");
    setNotas("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Usar este Script
          </DialogTitle>
          <DialogDescription>
            Vincule o uso deste script a um contato ou reunião para acompanhar a
            efetividade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumo */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Badge variant="secondary">
              {totalAnswered} perguntas respondidas
            </Badge>
            <span className="text-sm text-muted-foreground">nesta sessão</span>
          </div>

          {/* Vincular a Contato */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Vincular a Contato
            </Label>
            <Select value={selectedLead} onValueChange={setSelectedLead}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar contato..." />
              </SelectTrigger>
              <SelectContent>
                {mockLeads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nomeFantasia || lead.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vincular a Reunião */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vincular a Reunião
            </Label>
            <Select value={selectedReuniao} onValueChange={setSelectedReuniao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar reunião..." />
              </SelectTrigger>
              <SelectContent>
                {mockMeetingMinutes.map((meeting) => (
                  <SelectItem key={meeting.id} value={meeting.id}>
                    {meeting.empresa} -{" "}
                    {new Date(meeting.dataReuniao).toLocaleDateString("pt-BR")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas da sessão</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observações sobre a conversa, feedback do cliente..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <FileText className="h-4 w-4" />
            Registrar Uso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
