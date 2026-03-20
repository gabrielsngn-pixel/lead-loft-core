import { useState } from "react";
import { useMessageTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useEmailOutreach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Mail } from "lucide-react";
import { format } from "date-fns";

export function TemplatesTab() {
  const { data: templates, isLoading } = useMessageTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", channel: "email" });

  const openNew = () => {
    setEditingTemplate(null);
    setForm({ name: "", subject: "", body: "", channel: "email" });
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingTemplate(t);
    setForm({ name: t.name, subject: t.subject || "", body: t.body, channel: t.channel });
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
                <p className="text-xs line-clamp-3">{t.body}</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
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
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Olá {{nome}}, gostaria de apresentar..."
                rows={8}
              />
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
