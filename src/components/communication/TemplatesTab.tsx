import { useState, useRef } from "react";
import { useMessageTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useEmailOutreach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Mail, Eye, Code, Type, Image, LayoutGrid, Link } from "lucide-react";
import { format } from "date-fns";

function RichBodyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const execCommand = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      execCommand("insertImage", dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleInsertImageUrl = () => {
    const url = prompt("Cole a URL da imagem:");
    if (url) execCommand("insertImage", url);
  };

  const handleInsertLink = () => {
    const url = prompt("Cole a URL do link:");
    if (url) execCommand("createLink", url);
  };

  const handleInsertCard = () => {
    const cardHtml = `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:8px 0;background:#f8fafc;">
      <h3 style="margin:0 0 8px 0;font-size:16px;color:#1a202c;">Título do Card</h3>
      <p style="margin:0;font-size:14px;color:#4a5568;">Descrição do conteúdo. Edite conforme necessário.</p>
    </div>`;
    execCommand("insertHTML", cardHtml);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          execCommand("insertImage", dataUrl);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 border rounded-t-md p-1.5 bg-muted/50">
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")} className="h-7 px-2 text-xs font-bold">B</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")} className="h-7 px-2 text-xs italic">I</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("underline")} className="h-7 px-2 text-xs underline">U</Button>
        <div className="w-px bg-border mx-1" />
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h2")} className="h-7 px-2 text-xs">H2</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h3")} className="h-7 px-2 text-xs">H3</Button>
        <div className="w-px bg-border mx-1" />
        <Button type="button" variant="ghost" size="sm" onClick={handleInsertImage} className="h-7 px-2 gap-1 text-xs">
          <Image className="w-3 h-3" /> Imagem
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleInsertImageUrl} className="h-7 px-2 gap-1 text-xs">
          <Link className="w-3 h-3" /> Img URL
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleInsertLink} className="h-7 px-2 gap-1 text-xs">
          <Link className="w-3 h-3" /> Link
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleInsertCard} className="h-7 px-2 gap-1 text-xs">
          <LayoutGrid className="w-3 h-3" /> Card
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] border border-t-0 rounded-b-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-2"
        dangerouslySetInnerHTML={{ __html: value }}
        onBlur={() => {
          if (editorRef.current) onChange(editorRef.current.innerHTML);
        }}
        onPaste={handlePaste}
      />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
      <p className="text-xs text-muted-foreground">
        Cole imagens diretamente do clipboard ou insira via botões. Suporta cards, figuras e formatação rica.
      </p>
    </div>
  );
}

export function TemplatesTab() {
  const { data: templates, isLoading } = useMessageTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", channel: "email" });
  const [editorMode, setEditorMode] = useState<"visual" | "code" | "preview">("visual");

  const openNew = () => {
    setEditingTemplate(null);
    setForm({ name: "", subject: "", body: "", channel: "email" });
    setEditorMode("visual");
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingTemplate(t);
    setForm({ name: t.name, subject: t.subject || "", body: t.body, channel: t.channel });
    setEditorMode("visual");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.body) return;
    if (editingTemplate) {
      await updateMutation.mutateAsync({ id: editingTemplate.id, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Email</h3>
        <Button onClick={openNew} size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Template</Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Variáveis disponíveis: <code className="text-xs bg-muted px-1 rounded">{"{{nome}}"}</code>{" "}
        <code className="text-xs bg-muted px-1 rounded">{"{{empresa}}"}</code>{" "}
        <code className="text-xs bg-muted px-1 rounded">{"{{cidade}}"}</code>{" "}
        <code className="text-xs bg-muted px-1 rounded">{"{{estado}}"}</code>
      </p>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium">{t.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <Mail className="w-3 h-3 mr-1" /> Email
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {t.subject && <p className="text-xs text-muted-foreground">Assunto: {t.subject}</p>}
                <div className="text-xs line-clamp-3" dangerouslySetInnerHTML={{ __html: t.body }} />
                <p className="text-xs text-muted-foreground">
                  {format(new Date(t.created_at), "dd/MM/yyyy")}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t.id)} className="text-destructive">
                    <Trash2 className="w-3 h-3 mr-1" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates?.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">Nenhum template criado ainda.</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
            <DialogDescription>Configure o nome, assunto e corpo do email com suporte a imagens e cards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome do template</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Apresentação Loft" />
            </div>
            <div>
              <label className="text-sm font-medium">Assunto do email</label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Oportunidade de parceria" />
            </div>
            <div>
              <label className="text-sm font-medium">Corpo do email</label>
              <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="visual" className="gap-1"><Type className="w-3 h-3" /> Visual</TabsTrigger>
                  <TabsTrigger value="code" className="gap-1"><Code className="w-3 h-3" /> HTML</TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1"><Eye className="w-3 h-3" /> Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="visual">
                  <RichBodyEditor value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
                </TabsContent>
                <TabsContent value="code">
                  <Textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={12}
                    className="font-mono text-xs"
                    placeholder="<p>Olá {{nome}}, gostaria de apresentar...</p>"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="border rounded-md p-4 min-h-[200px] bg-white text-black prose prose-sm max-w-none">
                    {form.body ? (
                      <div dangerouslySetInnerHTML={{ __html: form.body }} />
                    ) : (
                      <p className="text-muted-foreground">Nenhum conteúdo para visualizar</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.body}>
              {editingTemplate ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
