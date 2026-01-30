import { useState } from "react";
import { Material } from "@/types/materials";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, User, FileText } from "lucide-react";

interface VersionHistoryDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistoryDialog({
  material,
  open,
  onOpenChange,
}: VersionHistoryDialogProps) {
  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Versões
          </DialogTitle>
          <DialogDescription>{material.titulo}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {material.historicoVersoes.map((versao, index) => (
              <div
                key={versao.versao}
                className="relative pl-6 pb-4 border-l-2 border-border last:border-l-0"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                
                <div className="flex items-start justify-between mb-1">
                  <Badge 
                    variant={index === 0 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    v{versao.versao}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(versao.data, "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="w-3 h-3" />
                  {versao.autor}
                </div>
                
                {versao.descricao && (
                  <p className="text-sm text-foreground">{versao.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
