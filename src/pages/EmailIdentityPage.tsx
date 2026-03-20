import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail } from "@/hooks/useEmailOutreach";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, SendHorizonal, Eye, Code, Type } from "lucide-react";

const ALLOWED_DOMAINS = ["outreach.loftinsights.com.br"];

export default function EmailIdentityPage() {
  const { user, profile } = useAuth();
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [signatureHtml, setSignatureHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (profile) {
      setSenderName((profile as any).sender_name || profile.nome || "");
      setSenderEmail((profile as any).sender_email || "");
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
    if (error) toast.error("Erro ao salvar");
    else toast.success("Identidade salva com sucesso");
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
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Identidade de Email</h1>
          <p className="text-muted-foreground text-sm">Configure como seus emails serão exibidos para os destinatários</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dados do remetente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do remetente</label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email de envio</label>
              <Input
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="contato@outreach.loftinsights.com.br"
              />
              {!domainValid && (
                <p className="text-xs text-destructive mt-1">
                  Domínio não permitido. Use: {ALLOWED_DOMAINS.join(", ")}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Reply-To</label>
              <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="seu@email.com" />
              <p className="text-xs text-muted-foreground mt-1">Respostas serão direcionadas para este email</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assinatura HTML</CardTitle>
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
                  className="min-h-[150px] border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  dangerouslySetInnerHTML={{ __html: signatureHtml }}
                  onBlur={(e) => setSignatureHtml(e.currentTarget.innerHTML)}
                />
              </TabsContent>
              <TabsContent value="code">
                <Textarea
                  value={signatureHtml}
                  onChange={(e) => setSignatureHtml(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder="<table><tr><td>Sua assinatura HTML aqui</td></tr></table>"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-md p-4 min-h-[150px]">
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
    </AppLayout>
  );
}
