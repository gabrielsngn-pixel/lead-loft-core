import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { AlertCircle, Calendar, Activity } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ContactsWithoutActionAlertProps {
  contacts: Lead[];
}

export function ContactsWithoutActionAlert({ contacts }: ContactsWithoutActionAlertProps) {
  const today = new Date();
  
  // Contacts without next meeting or next activity scheduled
  const contactsWithoutAction = contacts
    .filter(contact => {
      // Contact must not have either:
      // - a future meeting scheduled
      // - a future activity scheduled
      const hasFutureMeeting = contact.proximaReuniao && contact.proximaReuniao > today;
      const hasFutureActivity = contact.proximaAtividade && contact.proximaAtividade > today;
      return !hasFutureMeeting && !hasFutureActivity;
    })
    .slice(0, 5);

  return (
    <Card className="stat-card p-0 border-warning/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning-foreground" />
          <span>Contatos sem próxima ação</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
                Contatos ativos que não possuem reunião futura ou atividade programada. 
                Risco de pipeline estagnado.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contactsWithoutAction.length > 0 ? (
          <div className="space-y-3">
            {contactsWithoutAction.map((contact) => (
              <div 
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {contact.nomeFantasia || contact.razaoSocial}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contact.responsavelNome || "Sem responsável"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs flex items-center gap-1 text-warning-foreground border-warning/30">
                    <Calendar className="w-3 h-3" />
                    Sem agenda
                  </Badge>
                </div>
              </div>
            ))}
            {contacts.filter(c => !c.proximaReuniao && !c.proximaAtividade).length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{contacts.filter(c => !c.proximaReuniao && !c.proximaAtividade).length - 5} outros contatos
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="w-10 h-10 text-success/30 mb-2" />
            <p className="text-sm text-success">Todos os contatos têm ação programada!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
