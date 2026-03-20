import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

export function CommSettingsTab() {
  const { user, profile } = useAuth();
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSenderName((profile as any).sender_name || profile.nome || "");
      setSenderEmail((profile as any).sender_email || "");
      setReplyTo((profile as any).reply_to_email || profile.email || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        sender_name: senderName,
        sender_email: senderEmail,
        reply_to_email: replyTo,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas");
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h3 className="text-lg font-semibold">Configurações de Email</h3>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Identidade do Remetente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome do remetente</label>
            <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div>
            <label className="text-sm font-medium">Email de envio</label>
            <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="contato@outreach.loftinsights.com.br" />
            <p className="text-xs text-muted-foreground mt-1">Deve usar domínio verificado no Resend</p>
          </div>
          <div>
            <label className="text-sm font-medium">Reply-To (respostas vão para)</label>
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="seu@email.com" />
            <p className="text-xs text-muted-foreground mt-1">As respostas dos contatos serão enviadas para este endereço</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
