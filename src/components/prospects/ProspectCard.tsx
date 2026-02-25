import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Building2,
  Mail,
  Phone,
  Linkedin,
  MoreHorizontal,
  UserCheck,
  Users,
  Trash2,
  MessageCircle,
  Calendar,
  FileText,
  Lock,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { Prospect, PROSPECT_STATUS_CONFIG } from "@/types/prospects";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProspectCardProps {
  prospect: Prospect;
  onUpdateStatus: (id: string, status: Prospect["status"]) => void;
  onConvert: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onAddActivity: (prospect: Prospect) => void;
  onAssign?: (prospect: Prospect) => void;
  canAssign?: boolean;
  onRequestDelete?: (prospect: Prospect) => void;
  onRequestNewDecisor?: (prospect: Prospect) => void;
  onRequestDeleteAndNewDecisor?: (prospect: Prospect) => void;
}

export function ProspectCard({
  prospect,
  onUpdateStatus,
  onConvert,
  onDelete,
  onAddActivity,
  onAssign,
  canAssign = false,
  onRequestDelete,
  onRequestNewDecisor,
  onRequestDeleteAndNewDecisor,
}: ProspectCardProps) {
  const { isMaster } = useAuth();
  const statusConfig = PROSPECT_STATUS_CONFIG[prospect.status];
  const isConverted = prospect.status === "convertido";

  return (
    <Card className={cn(
      "stat-card overflow-hidden transition-all duration-200 hover:shadow-lg",
      isConverted && "opacity-75 bg-muted/50"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {prospect.nomeCompleto}
              </h3>
              <p className="text-xs text-muted-foreground">{prospect.cargo}</p>
            </div>
          </div>
          
          {!isConverted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddActivity(prospect)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Registrar Atividade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConvert(prospect)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Apropriar para mim
                </DropdownMenuItem>
                {canAssign && onAssign && (
                  <DropdownMenuItem onClick={() => onAssign(prospect)}>
                    <Users className="w-4 h-4 mr-2" />
                    Atribuir a consultor
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onRequestDelete && (
                  <DropdownMenuItem onClick={() => onRequestDelete(prospect)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir prospect
                  </DropdownMenuItem>
                )}
                {onRequestNewDecisor && (
                  <DropdownMenuItem onClick={() => onRequestNewDecisor(prospect)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar novo decisor
                  </DropdownMenuItem>
                )}
                {onRequestDeleteAndNewDecisor && (
                  <DropdownMenuItem onClick={() => onRequestDeleteAndNewDecisor(prospect)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Excluir e cadastrar novo decisor
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onUpdateStatus(prospect.id, "em_contato")}
                >
                  Marcar: Em Contato
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-muted-foreground"
                  onClick={() => onUpdateStatus(prospect.id, "reuniao_agendada")}
                >
                  Marcar: Reunião Agendada
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-muted-foreground"
                  onClick={() => onUpdateStatus(prospect.id, "reuniao_realizada")}
                >
                  Marcar: Reunião Realizada
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-muted-foreground"
                  onClick={() => onUpdateStatus(prospect.id, "qualificado")}
                >
                  Marcar: Qualificado
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-muted-foreground"
                  onClick={() => onUpdateStatus(prospect.id, "descartado")}
                >
                  Marcar: Descartado
                </DropdownMenuItem>
                {isMaster && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete(prospect.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Company */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground line-clamp-1">{prospect.empresa}</span>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <a 
              href={`mailto:${prospect.email}`} 
              className="text-primary hover:underline truncate"
            >
              {prospect.email}
            </a>
          </div>
          {prospect.telefone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{prospect.telefone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Linkedin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <a 
              href={prospect.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              Ver Perfil
            </a>
          </div>
        </div>

        {/* Status & Info */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Badge className={cn("text-white text-xs", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(prospect.dataImportacao, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>

        {/* Converted Info */}
        {isConverted && prospect.consultorResponsavelNome && (
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Apropriado por: {prospect.consultorResponsavelNome}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
