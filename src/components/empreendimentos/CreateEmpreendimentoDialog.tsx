import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Empreendimento } from "@/types/empreendimentos";

interface CreateEmpreendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (emp: Partial<Empreendimento>) => void;
  isLoading: boolean;
}

export function CreateEmpreendimentoDialog({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: CreateEmpreendimentoDialogProps) {
  const [form, setForm] = useState({
    nome_empreendimento: "",
    construtora: "",
    cidade: "",
    estado: "",
    data_habitese: "",
    tipo_empreendimento: "residencial",
    unidades_estimadas: "",
    ticket_medio: "",
    vgv_estimado: "",
    banco_financiador: "",
    modelo_repasse: "",
    observacoes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      nome_empreendimento: form.nome_empreendimento,
      construtora: form.construtora,
      cidade: form.cidade,
      estado: form.estado,
      data_habitese: form.data_habitese ? new Date(form.data_habitese).toISOString() : null,
      tipo_empreendimento: form.tipo_empreendimento as any,
      unidades_estimadas: form.unidades_estimadas ? parseInt(form.unidades_estimadas) : null,
      ticket_medio: form.ticket_medio ? parseFloat(form.ticket_medio) : null,
      vgv_estimado: form.vgv_estimado ? parseFloat(form.vgv_estimado) : null,
      banco_financiador: form.banco_financiador || null,
      modelo_repasse: form.modelo_repasse || null,
      observacoes: form.observacoes || null,
    });
    setForm({
      nome_empreendimento: "",
      construtora: "",
      cidade: "",
      estado: "",
      data_habitese: "",
      tipo_empreendimento: "residencial",
      unidades_estimadas: "",
      ticket_medio: "",
      vgv_estimado: "",
      banco_financiador: "",
      modelo_repasse: "",
      observacoes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Empreendimento</DialogTitle>
          <DialogDescription>Cadastre manualmente um novo empreendimento estratégico.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome do Empreendimento *</Label>
              <Input
                value={form.nome_empreendimento}
                onChange={(e) => setForm({ ...form, nome_empreendimento: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Construtora / Incorporadora *</Label>
              <Input
                value={form.construtora}
                onChange={(e) => setForm({ ...form, construtora: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Input
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data Habite-se</Label>
              <Input
                type="date"
                value={form.data_habitese}
                onChange={(e) => setForm({ ...form, data_habitese: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.tipo_empreendimento}
                onValueChange={(v) => setForm({ ...form, tipo_empreendimento: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="mcmv">MCMV</SelectItem>
                  <SelectItem value="medio_padrao">Médio Padrão</SelectItem>
                  <SelectItem value="alto_padrao">Alto Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidades estimadas</Label>
              <Input
                type="number"
                value={form.unidades_estimadas}
                onChange={(e) => setForm({ ...form, unidades_estimadas: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ticket médio (R$)</Label>
              <Input
                type="number"
                value={form.ticket_medio}
                onChange={(e) => setForm({ ...form, ticket_medio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>VGV estimado (R$)</Label>
              <Input
                type="number"
                value={form.vgv_estimado}
                onChange={(e) => setForm({ ...form, vgv_estimado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Banco financiador</Label>
              <Input
                value={form.banco_financiador}
                onChange={(e) => setForm({ ...form, banco_financiador: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Modelo de repasse</Label>
              <Select
                value={form.modelo_repasse}
                onValueChange={(v) => setForm({ ...form, modelo_repasse: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repasse">Repasse</SelectItem>
                  <SelectItem value="piloto">Piloto</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações estratégicas</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              Criar Empreendimento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
