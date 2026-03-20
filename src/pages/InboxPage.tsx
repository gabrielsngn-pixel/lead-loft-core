import { useState } from "react";
import { useMessageLogs } from "@/hooks/useEmailOutreach";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Mail } from "lucide-react";
import { format } from "date-fns";

const statusStyles: Record<string, { label: string; className: string }> = {
  sent: { label: "Enviado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  delivered: { label: "Entregue", className: "bg-blue-100 text-blue-800 border-blue-200" },
  read: { label: "Lido", className: "bg-green-100 text-green-800 border-green-200" },
  replied: { label: "Respondido", className: "bg-primary/10 text-primary border-primary/20" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function InboxPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const { data: logs, isLoading } = useMessageLogs(
    filter !== "all" ? { status: filter, channel: "email" } : { channel: "email" }
  );

  const filtered = logs?.filter((l: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.recipient?.toLowerCase().includes(s) ||
      l.subject?.toLowerCase().includes(s) ||
      l.sender_name?.toLowerCase().includes(s)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground text-sm">Acompanhe todos os emails enviados</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {["all", "sent", "delivered", "read", "replied", "failed"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todos" : statusStyles[f]?.label || f}
            </Button>
          ))}
          <div className="relative flex-1 min-w-[200px] ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por destinatário, assunto..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {filtered?.map((email: any) => {
              const st = statusStyles[email.status] || statusStyles.sent;
              return (
                <Card
                  key={email.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEmail(email)}
                >
                  <CardContent className="py-3 px-4 flex items-center gap-4">
                    <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{email.recipient}</span>
                        <Badge variant="outline" className={`text-xs ${st.className}`}>
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-sm truncate">{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{email.body?.substring(0, 100)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {email.sent_at ? format(new Date(email.sent_at), "dd/MM HH:mm") : "—"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum email encontrado.</p>
            )}
          </div>
        )}

        <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedEmail?.subject}</DialogTitle>
            </DialogHeader>
            {selectedEmail && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>De: {selectedEmail.sender_name} &lt;{selectedEmail.sender_email}&gt;</span>
                  <span>Para: {selectedEmail.recipient}</span>
                  <span>Reply-To: {selectedEmail.reply_to}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedEmail.sent_at && format(new Date(selectedEmail.sent_at), "dd/MM/yyyy HH:mm")}
                </div>
                <div className="border-t pt-3">
                  <div className="whitespace-pre-wrap text-sm">{selectedEmail.body}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
