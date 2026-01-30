import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, User, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChangeLogEntry, roleLabels } from "@/types/permissions";

interface ChangeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: ChangeLogEntry[];
  entityName: string;
  fieldFilter?: string;
}

export function ChangeHistoryDialog({
  open,
  onOpenChange,
  history,
  entityName,
  fieldFilter,
}: ChangeHistoryDialogProps) {
  const filteredHistory = fieldFilter
    ? history.filter((h) => h.fieldName === fieldFilter)
    : history;

  const groupedByDate = filteredHistory.reduce((acc, entry) => {
    const dateKey = format(entry.timestamp, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, ChangeLogEntry[]>);

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Alterações
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {entityName}
            {fieldFilter && ` • Campo: ${fieldFilter}`}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => (
                <div key={dateKey}>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-3">
                    {format(new Date(dateKey), "EEEE, dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <div className="space-y-3">
                    {groupedByDate[dateKey].map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-muted/30 rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
                              <User className="w-4 h-4 text-secondary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{entry.userName}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {roleLabels[entry.userRole]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(entry.timestamp, "HH:mm")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase">
                            {entry.fieldLabel}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-destructive/10 text-destructive rounded line-through">
                              {entry.oldValue || "—"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="px-2 py-1 bg-success/10 text-success rounded">
                              {entry.newValue || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
