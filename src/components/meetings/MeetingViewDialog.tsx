import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Calendar, Clock, Users, FileDown, History, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MeetingMinutes, meetingTypeLabels, meetingStatusLabels } from "@/types/meetings";

interface MeetingViewDialogProps {
  meeting: MeetingMinutes | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportPdf?: (meeting: MeetingMinutes) => void;
}

export function MeetingViewDialog({ meeting, open, onOpenChange, onExportPdf }: MeetingViewDialogProps) {
  if (!meeting) return null;

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf(meeting);
    }
    // Simple PDF export using print
    const printContent = document.getElementById("meeting-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ata de Reunião - ${meeting.empresa}</title>
              <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #FF774A; font-size: 24px; margin-bottom: 8px; }
                h2 { color: #115644; font-size: 18px; margin-top: 24px; margin-bottom: 12px; }
                .header { border-bottom: 2px solid #FF774A; padding-bottom: 16px; margin-bottom: 24px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
                .info-item { padding: 8px 0; }
                .info-label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
                .info-value { color: #333; margin-top: 4px; }
                .section { margin-bottom: 20px; }
                .section-content { background: #f9f9f9; padding: 12px; border-radius: 8px; white-space: pre-wrap; }
                .participants { display: flex; flex-wrap: wrap; gap: 8px; }
                .participant { background: #e0e0e0; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
                .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Ata de Reunião</h1>
                <p style="color: #666;">Loft CRM</p>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Empresa</div>
                  <div class="info-value">${meeting.empresa}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">CNPJ</div>
                  <div class="info-value">${meeting.cnpj}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Data</div>
                  <div class="info-value">${format(meeting.dataReuniao, "dd/MM/yyyy", { locale: ptBR })}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Horário</div>
                  <div class="info-value">${meeting.horaInicio}${meeting.horaFim ? ` - ${meeting.horaFim}` : ""}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Tipo</div>
                  <div class="info-value">${meetingTypeLabels[meeting.tipoReuniao]}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Consultor</div>
                  <div class="info-value">${meeting.consultorNome}</div>
                </div>
              </div>
              <h2>Participantes</h2>
              <div class="participants">
                ${meeting.participantes.map((p) => `<span class="participant">${p}</span>`).join("")}
              </div>
              ${meeting.objetivos ? `<h2>Objetivos</h2><div class="section-content">${meeting.objetivos}</div>` : ""}
              ${meeting.pauta ? `<h2>Pauta</h2><div class="section-content">${meeting.pauta}</div>` : ""}
              ${meeting.discussao ? `<h2>Discussão</h2><div class="section-content">${meeting.discussao}</div>` : ""}
              ${meeting.decisoes ? `<h2>Decisões</h2><div class="section-content">${meeting.decisoes}</div>` : ""}
              ${meeting.proximosPassos ? `<h2>Próximos Passos</h2><div class="section-content">${meeting.proximosPassos}</div>` : ""}
              ${meeting.observacoes ? `<h2>Observações</h2><div class="section-content">${meeting.observacoes}</div>` : ""}
              <div class="footer">
                <p>Ata armazenada em: ${format(meeting.dataArmazenamento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl">{meeting.empresa}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">{meeting.cnpj}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{meetingTypeLabels[meeting.tipoReuniao]}</Badge>
              <Badge
                className={
                  meeting.status === "realizada"
                    ? "bg-green-100 text-green-800"
                    : meeting.status === "agendada"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-muted"
                }
              >
                {meetingStatusLabels[meeting.status]}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4" id="meeting-content">
          <div className="space-y-6 py-4">
            {/* Meeting Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Data</p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {format(meeting.dataReuniao, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Horário</p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {meeting.horaInicio}
                  {meeting.horaFim && ` - ${meeting.horaFim}`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Consultor</p>
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {meeting.consultorNome}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Armazenada</p>
                <p className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  {format(meeting.dataArmazenamento, "dd/MM", { locale: ptBR })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Participants */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">Participantes</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.participantes.map((p, i) => (
                  <Badge key={i} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content Sections */}
            {meeting.objetivos && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Objetivos</h3>
                <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg">{meeting.objetivos}</p>
              </div>
            )}

            {meeting.pauta && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Pauta</h3>
                <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {meeting.pauta}
                </p>
              </div>
            )}

            {meeting.discussao && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Discussão</h3>
                <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {meeting.discussao}
                </p>
              </div>
            )}

            {meeting.decisoes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Decisões</h3>
                <p className="text-sm leading-relaxed bg-primary/5 border border-primary/20 p-3 rounded-lg whitespace-pre-wrap">
                  {meeting.decisoes}
                </p>
              </div>
            )}

            {meeting.proximosPassos && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Próximos Passos</h3>
                <p className="text-sm leading-relaxed bg-accent/50 p-3 rounded-lg whitespace-pre-wrap">
                  {meeting.proximosPassos}
                </p>
              </div>
            )}

            {meeting.observacoes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">Observações</h3>
                <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {meeting.observacoes}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleExportPdf} className="gap-2 bg-primary hover:bg-primary/90">
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
