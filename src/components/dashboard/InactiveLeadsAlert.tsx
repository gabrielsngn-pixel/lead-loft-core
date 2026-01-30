import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { differenceInDays } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";

interface InactiveLeadsAlertProps {
  leads: Lead[];
  daysThreshold?: number;
}

export function InactiveLeadsAlert({ leads, daysThreshold = 7 }: InactiveLeadsAlertProps) {
  const today = new Date();
  
  const inactiveLeads = leads
    .filter(lead => {
      const daysSinceInteraction = differenceInDays(today, lead.dataUltimaInteracao);
      return daysSinceInteraction >= daysThreshold && lead.status !== "ganho" && lead.status !== "perdido";
    })
    .sort((a, b) => a.dataUltimaInteracao.getTime() - b.dataUltimaInteracao.getTime())
    .slice(0, 5);

  return (
    <Card className="stat-card p-0 border-warning/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-foreground" />
          Leads sem atividade ({daysThreshold}+ dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inactiveLeads.length > 0 ? (
          <div className="space-y-3">
            {inactiveLeads.map((lead) => {
              const daysSince = differenceInDays(today, lead.dataUltimaInteracao);
              return (
                <div 
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-warning/10 hover:bg-warning/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {lead.nomeFantasia || lead.razaoSocial}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.responsavelNome || "Sem responsável"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs flex items-center gap-1 text-warning-foreground border-warning/30">
                    <Clock className="w-3 h-3" />
                    {daysSince} dias
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-10 h-10 text-success/30 mb-2" />
            <p className="text-sm text-success">Todos os leads estão ativos!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
