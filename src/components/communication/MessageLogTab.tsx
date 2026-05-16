import { useState, useMemo } from "react";
import { useMessageLogs } from "@/hooks/useEmailOutreach";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sent: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregue", variant: "default" },
  read: { label: "Lido", variant: "default" },
  replied: { label: "Respondido", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
};

export function MessageLogTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: logs, isLoading } = useMessageLogs(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico de Mensagens</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
            <SelectItem value="read">Lidos</SelectItem>
            <SelectItem value="replied">Respondidos</SelectItem>
            <SelectItem value="failed">Falhas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remetente</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log: any) => {
                const sc = statusConfig[log.status] || { label: log.status, variant: "outline" as const };
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.recipient}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{log.subject}</TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.sender_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.sent_at ? format(new Date(log.sent_at), "dd/MM/yyyy HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma mensagem encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
