import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMessageTemplates, sendEmail, resolveTemplateVariables } from "@/hooks/useEmailOutreach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Send, Search, Users } from "lucide-react";

export function BulkDispatchTab() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: templates } = useMessageTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, sent: 0, failed: 0 });

  // Fetch contacts (leads with responsavel_id = has owner = contatos ativos)
  const { data: leads } = useQuery({
    queryKey: ["bulk_leads", search],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("id, razao_social, nome_contato, email, cidade, estado")
        .not("responsavel_id", "is", null)
        .not("email", "is", null)
        .order("razao_social");
      if (search) {
        query = query.or(`razao_social.ilike.%${search}%,nome_contato.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const toggleLead = (id: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!leads) return;
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
    }
  };

  const template = templates?.find((t: any) => t.id === selectedTemplate);

  const handleDispatch = async () => {
    if (!template || selectedLeads.size === 0 || !user) return;
    setConfirmOpen(false);
    setSending(true);

    const targetLeads = leads?.filter((l) => selectedLeads.has(l.id)) || [];
    const total = targetLeads.length;
    let sent = 0;
    let failed = 0;

    // Create bulk dispatch log
    const { data: dispatchLog } = await supabase
      .from("bulk_dispatch_logs" as any)
      .insert({
        user_id: user.id,
        user_nome: profile?.nome || "",
        channel: "email",
        template_id: template.id,
        total_leads: total,
        status: "processing",
        started_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    const dispatchId = (dispatchLog as any)?.id;

    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      const resolvedBody = resolveTemplateVariables(template.body, lead);
      const resolvedSubject = resolveTemplateVariables(template.subject || "", lead);

      try {
        await sendEmail({
          to: lead.email,
          subject: resolvedSubject,
          body: resolvedBody,
          lead_id: lead.id,
          template_id: template.id,
          bulk_dispatch_id: dispatchId,
        });
        sent++;
      } catch {
        failed++;
      }

      setProgress({ current: i + 1, total, sent, failed });
      // Delay between sends
      if (i < targetLeads.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Update dispatch log
    if (dispatchId) {
      await supabase
        .from("bulk_dispatch_logs" as any)
        .update({
          sent_count: sent,
          failed_count: failed,
          status: "completed",
          completed_at: new Date().toISOString(),
        } as any)
        .eq("id", dispatchId);
    }

    setSending(false);
    setSelectedLeads(new Set());
    qc.invalidateQueries({ queryKey: ["message_logs"] });
    qc.invalidateQueries({ queryKey: ["bulk_dispatch_logs"] });
    toast.success(`Disparo concluído: ${sent} enviados, ${failed} falhas`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Disparo em Massa</h3>

      {sending ? (
        <Card>
          <CardContent className="py-6 space-y-4">
            <p className="text-sm font-medium">Enviando emails...</p>
            <Progress value={(progress.current / progress.total) * 100} />
            <p className="text-sm text-muted-foreground">
              {progress.current}/{progress.total} — ✅ {progress.sent} enviados, ❌ {progress.failed} falhas
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Template selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">1. Selecione o template</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um template de email" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.filter((t: any) => t.channel === "email").map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <p className="font-medium">Assunto: {template.subject}</p>
                  <p className="mt-1 text-muted-foreground line-clamp-3">{template.body}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                2. Selecione os contatos
                <Badge variant="secondary">{selectedLeads.size} selecionados</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, empresa ou email..."
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  <Users className="w-4 h-4 mr-1" />
                  {selectedLeads.size === leads?.length ? "Desmarcar" : "Selecionar"} todos
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                {leads?.map((lead) => (
                  <label
                    key={lead.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => toggleLead(lead.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.razao_social}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.nome_contato} — {lead.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{lead.cidade}/{lead.estado}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Send button */}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!selectedTemplate || selectedLeads.size === 0}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar para {selectedLeads.size} contato{selectedLeads.size !== 1 ? "s" : ""}
          </Button>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar disparo</DialogTitle>
              </DialogHeader>
              <p className="text-sm">
                Serão enviados <strong>{selectedLeads.size} emails</strong> usando o template{" "}
                <strong>{template?.name}</strong>.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                <Button onClick={handleDispatch}>Confirmar envio</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
