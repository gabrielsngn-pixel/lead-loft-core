import { Lead } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentLeadsProps {
  leads: Lead[];
}

const statusConfig = {
  novo: { label: "Novo", className: "badge-new" },
  qualificado: { label: "Qualificado", className: "badge-qualified" },
  proposta: { label: "Proposta", className: "badge-proposal" },
  ganho: { label: "Ganho", className: "badge-won" },
  perdido: { label: "Perdido", className: "badge-lost" },
};

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <div className="stat-card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Leads Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimos leads cadastrados</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          Ver todos
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="divide-y divide-border">
        {leads.slice(0, 5).map((lead, index) => (
          <div
            key={lead.id}
            className="flex items-center gap-4 p-4 px-6 table-row-hover animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/10">
              <Building2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {lead.nomeFantasia || lead.razaoSocial}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{lead.cidade}/{lead.estado}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(lead.dataUltimaInteracao, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <Badge className={cn("badge-status", statusConfig[lead.status].className)}>
              {statusConfig[lead.status].label}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}