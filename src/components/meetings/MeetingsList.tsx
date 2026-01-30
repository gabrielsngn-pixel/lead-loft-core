import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, FileText, Calendar, Building2, User, Archive, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingMinutes, MeetingType, meetingTypeLabels, meetingStatusLabels } from "@/types/meetings";
import { cn } from "@/lib/utils";

interface MeetingsListProps {
  meetings: MeetingMinutes[];
  onView: (meeting: MeetingMinutes) => void;
  onArchive?: (meetingId: string) => void;
}

export function MeetingsList({ meetings, onView, onArchive }: MeetingsListProps) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<MeetingType | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [showArchived, setShowArchived] = useState(false);

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      meeting.empresa.toLowerCase().includes(search.toLowerCase()) ||
      meeting.cnpj.includes(search) ||
      meeting.consultorNome.toLowerCase().includes(search.toLowerCase());

    const matchesTipo = tipoFilter === "todos" || meeting.tipoReuniao === tipoFilter;
    const matchesStatus = statusFilter === "todos" || meeting.status === statusFilter;
    const matchesArchived = showArchived ? meeting.arquivada : !meeting.arquivada;

    return matchesSearch && matchesTipo && matchesStatus && matchesArchived;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "realizada":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "agendada":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "reagendada":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Repositório de Reuniões
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              {showArchived ? "Ver Ativas" : "Ver Arquivadas"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, CNPJ ou consultor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as MeetingType | "todos")}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tipo de reunião" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(meetingTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(meetingStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Consultor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Armazenada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma ata encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((meeting, index) => (
                  <TableRow
                    key={meeting.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {meeting.empresa}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{meeting.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{meetingTypeLabels[meeting.tipoReuniao]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(meeting.dataReuniao, "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {meeting.consultorNome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(meeting.status)}>
                        {meetingStatusLabels[meeting.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(meeting.dataArmazenamento, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onView(meeting)} className="gap-1">
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                        {onArchive && !meeting.arquivada && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onArchive(meeting.id)}
                            className="gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>
            {filteredMeetings.length} ata{filteredMeetings.length !== 1 ? "s" : ""} encontrada
            {filteredMeetings.length !== 1 ? "s" : ""}
          </span>
          <span>
            {meetings.filter((m) => !m.arquivada).length} ativas •{" "}
            {meetings.filter((m) => m.arquivada).length} arquivadas
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
