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
import { Prospect } from "@/types/prospects";
import { UserCheck } from "lucide-react";

interface ConvertProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  onConfirm: () => void;
}

export function ConvertProspectDialog({
  open,
  onOpenChange,
  prospect,
  onConfirm,
}: ConvertProspectDialogProps) {
  if (!prospect) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle>Apropriar Prospect</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a apropriar o prospect <strong>{prospect.nomeCompleto}</strong> ({prospect.empresa}).
            </p>
            <p className="text-sm">
              Esta ação irá:
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Criar um novo registro em <strong>Contatos Ativos</strong></li>
              <li>Vincular você como consultor responsável</li>
              <li>Marcar o prospect como <strong>Convertido</strong></li>
              <li>Bloquear edições futuras neste prospect</li>
            </ul>
            <p className="text-sm text-warning font-medium mt-2">
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Apropriar Prospect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
