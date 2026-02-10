import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Empreendimento } from "@/types/empreendimentos";

interface Consultor {
  user_id: string;
  nome: string;
  role: string;
}

interface AssignEmpreendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimento: Empreendimento;
  onUpdate: (data: Partial<Empreendimento> & { id: string }) => void;
}

export function AssignEmpreendimentoDialog({
  open,
  onOpenChange,
  empreendimento,
  onUpdate,
}: AssignEmpreendimentoDialogProps) {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [selectedConsultor, setSelectedConsultor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (open) {
      loadConsultores();
      setSelectedConsultor("");
    }
  }, [open]);

  const loadConsultores = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, nome, role")
      .in("role", ["consultor", "sdr", "gestor", "master"])
      .order("nome");
    setConsultores(data || []);
    setIsLoading(false);
  };

  const handleAssign = async () => {
    const consultor = consultores.find((c) => c.user_id === selectedConsultor);
    if (!consultor || !profile) return;

    setIsAssigning(true);

    try {
      // 1. Update the empreendimento itself
      onUpdate({
        id: empreendimento.id,
        consultor_responsavel_id: consultor.user_id,
        consultor_responsavel_nome: consultor.nome,
        status: empreendimento.status === "mapeado" ? "em_contato" : empreendimento.status,
      } as any);

      // 2. Get all linked decisores
      const { data: decisores } = await supabase
        .from("empreendimento_decisores")
        .select("*")
        .eq("empreendimento_id", empreendimento.id);

      if (decisores && decisores.length > 0) {
        // Update decisores with consultant info
        await supabase
          .from("empreendimento_decisores")
          .update({
            consultor_responsavel_id: consultor.user_id,
            consultor_responsavel_nome: consultor.nome,
          })
          .eq("empreendimento_id", empreendimento.id);

        // 3. Check if there's already a contato ativo (lead) with the same razão social (construtora)
        const construtoraNormalized = empreendimento.construtora.trim().toLowerCase();
        const { data: existingLeads } = await supabase
          .from("leads")
          .select("id, razao_social, cnpj")
          .ilike("razao_social", construtoraNormalized);

        const existingCnpj = existingLeads?.[0]?.cnpj || "00.000.000/0000-00";

        // 4. For each decisor, create a contato ativo (lead with responsavel_id)
        for (const decisor of decisores) {
          // Check if this decisor already has a lead record
          if (decisor.lead_id) continue;

          // Check if a lead already exists for this person (by email)
          if (decisor.email) {
            const { data: existingByEmail } = await supabase
              .from("leads")
              .select("id")
              .eq("email", decisor.email)
              .not("responsavel_id", "is", null)
              .limit(1);

            if (existingByEmail && existingByEmail.length > 0) {
              // Update decisor to link to existing lead
              await supabase
                .from("empreendimento_decisores")
                .update({ lead_id: existingByEmail[0].id, tipo_vinculo: "contato_ativo" })
                .eq("id", decisor.id);
              continue;
            }
          }

          // Create new contato ativo
          const { data: newLead } = await supabase
            .from("leads")
            .insert({
              razao_social: empreendimento.construtora,
              nome_contato: decisor.nome,
              email: decisor.email || "sem-email@pendente.com",
              telefone: decisor.telefone || "0000000000",
              cidade: empreendimento.cidade,
              estado: empreendimento.estado,
              cnpj: existingCnpj,
              responsavel_id: consultor.user_id,
              responsavel_nome: consultor.nome,
              linkedin: decisor.linkedin,
              origem: "empreendimento",
              status: "novo",
              prioridade: "media",
              tipo_empresa: "incorporadora",
              criado_por: profile.user_id,
              criado_por_nome: profile.nome,
              observacoes: `Contato criado automaticamente a partir do empreendimento "${empreendimento.nome_empreendimento}".`,
            } as any)
            .select("id")
            .single();

          if (newLead) {
            // Update decisor to link to the new lead
            await supabase
              .from("empreendimento_decisores")
              .update({ lead_id: newLead.id, tipo_vinculo: "contato_ativo" })
              .eq("id", decisor.id);

            // If decisor was a prospect, mark as converted
            if (decisor.prospect_id) {
              await supabase
                .from("prospects")
                .update({
                  status: "convertido",
                  contato_ativo_id: newLead.id,
                  convertido_em: new Date().toISOString(),
                  consultor_responsavel_id: consultor.user_id,
                  consultor_responsavel_nome: consultor.nome,
                })
                .eq("id", decisor.prospect_id);
            }
          }
        }
      }

      toast({ title: `Empreendimento atribuído a ${consultor.nome}`, description: "Contatos ativos criados para os decisores vinculados." });
    } catch (error: any) {
      toast({ title: "Erro ao atribuir", description: error.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir a Consultor</DialogTitle>
          <DialogDescription>
            Selecione o consultor responsável por "{empreendimento.nome_empreendimento}".
            Os decisores vinculados serão criados como Contatos Ativos.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Consultor</Label>
              <Select value={selectedConsultor} onValueChange={setSelectedConsultor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor..." />
                </SelectTrigger>
                <SelectContent>
                  {consultores.map((c) => (
                    <SelectItem key={c.user_id} value={c.user_id}>
                      {c.nome} ({c.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {empreendimento.consultor_responsavel_nome && (
              <p className="text-sm text-muted-foreground">
                Atualmente atribuído a: <strong>{empreendimento.consultor_responsavel_nome}</strong>
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssign} disabled={!selectedConsultor || isAssigning}>
                {isAssigning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atribuindo...</> : "Atribuir"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
