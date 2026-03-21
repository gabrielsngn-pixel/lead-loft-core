import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail } from "@/hooks/useEmailOutreach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, SendHorizonal, Eye, Code, Type } from "lucide-react";

const ALLOWED_DOMAINS = ["outreach.loftinsights.com.br"];

export function CommSettingsTab() {
  const { user, profile } = useAuth();
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [signatureHtml, setSignatureHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const defaultSenderEmail = profile
    ? `${(profile.email || "").split("@")[0]}@outreach.loftinsights.com.br`
    : "";

  useEffect(() => {
    if (profile) {
      setSenderName((profile as any).sender_name || profile.nome || "");
      setSenderEmail((profile as any).sender_email || defaultSenderEmail);
      setReplyTo((profile as any).reply_to_email || profile.email || "");
      setSignatureHtml((profile as any).email_signature_html || "");
    }
  }, [profile]);

  const domainValid = !senderEmail || ALLOWED_DOMAINS.includes(senderEmail.split("@")[1] || "");

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        sender_name: senderName,
        sender_email: senderEmail,
        reply_to_email: replyTo,
        email_signature_html: signatureHtml,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar configurações");
    else toast.success("Configurações salvas");
  };

  const handleTest = async () => {
    if (!user?.email) return;
    setTesting(true);
    try {
      await sendEmail({
        to: user.email,
        subject: "Email de teste — Loft Incorporações",
        body: "Este é um email de teste para validar sua configuração de identidade e assinatura.\n\nSe você recebeu este email, tudo está funcionando corretamente.",
      });
      toast.success(`Email de teste enviado para ${user.email}`);
    } catch (e: any) {
      toast.error(e.message);
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
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
            <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder={defaultSenderEmail || "seunome@outreach.loftinsights.com.br"} />
            {!domainValid && (
              <p className="text-xs text-destructive mt-1">Domínio não permitido. Use: {ALLOWED_DOMAINS.join(", ")}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Deve usar domínio verificado no provedor de email</p>
          </div>
          <div>
            <label className="text-sm font-medium">Reply-To (respostas vão para)</label>
            <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="seu@email.com" />
            <p className="text-xs text-muted-foreground mt-1">As respostas dos contatos serão enviadas para este endereço</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assinatura de Email</CardTitle>
          <p className="text-xs text-muted-foreground">Será adicionada automaticamente ao final de cada email enviado</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="code">
            <TabsList>
              <TabsTrigger value="visual" className="gap-1"><Type className="w-3 h-3" /> Visual</TabsTrigger>
              <TabsTrigger value="code" className="gap-1"><Code className="w-3 h-3" /> HTML</TabsTrigger>
              <TabsTrigger value="preview" className="gap-1"><Eye className="w-3 h-3" /> Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="visual">
              <div
                contentEditable
                className="min-h-[150px] border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                dangerouslySetInnerHTML={{ __html: signatureHtml }}
                onBlur={(e) => setSignatureHtml(e.currentTarget.innerHTML)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Edite visualmente — cole imagens, logos ou formate texto diretamente
              </p>
            </TabsContent>
            <TabsContent value="code">
              <Textarea
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder={'<table>\n  <tr>\n    <td><img src="https://..." width="80" /></td>\n    <td>\n      <strong>Seu Nome</strong><br/>\n      Cargo | Empresa<br/>\n      (11) 99999-9999\n    </td>\n  </tr>\n</table>'}
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-md p-4 min-h-[150px] bg-white text-black">
                {signatureHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma assinatura configurada</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving || !domainValid}>
          <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          <SendHorizonal className="w-4 h-4 mr-1" /> {testing ? "Enviando..." : "Enviar email teste"}
        </Button>
      </div>
    </div>
  );
}
