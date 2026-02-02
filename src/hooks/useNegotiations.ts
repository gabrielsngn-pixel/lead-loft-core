import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Negotiation, Lead } from "@/types/crm";
import { useLeads } from "./useLeads";

interface NegotiationRow {
  id: string;
  lead_id: string;
  titulo: string;
  valor: number;
  etapa: string;
  probabilidade: number;
  data_previsao_fechamento: string | null;
  created_at: string;
  updated_at: string;
}

type NegotiationStage = "qualificacao" | "proposta" | "negociacao" | "fechamento";

function rowToNegotiation(row: NegotiationRow, lead: Lead | undefined): Negotiation {
  const dummyLead: Lead = lead ?? {
    id: row.lead_id,
    cnpj: "",
    razaoSocial: "Lead desconhecido",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    origem: "outro",
    status: "novo",
    prioridade: "media",
    tipoEmpresa: "outro",
    dataCriacao: new Date(),
    dataUltimaInteracao: new Date(),
  };

  return {
    id: row.id,
    leadId: row.lead_id,
    lead: dummyLead,
    titulo: row.titulo,
    valor: Number(row.valor),
    etapa: row.etapa as NegotiationStage,
    probabilidade: row.probabilidade,
    dataPrevisaoFechamento: row.data_previsao_fechamento
      ? new Date(row.data_previsao_fechamento)
      : undefined,
    dataCriacao: new Date(row.created_at),
    dataAtualizacao: new Date(row.updated_at),
  };
}

export function useNegotiations() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { leads } = useLeads();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNegotiations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("negotiations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar negociações:", error);
      toast({ title: "Erro ao carregar negociações", variant: "destructive" });
      setLoading(false);
      return;
    }
    const rows = data as NegotiationRow[];
    setNegotiations(rows.map((r) => rowToNegotiation(r, leads.find((l) => l.id === r.lead_id))));
    setLoading(false);
  }, [toast, leads]);

  useEffect(() => {
    if (leads.length > 0) {
      fetchNegotiations();
    }
  }, [fetchNegotiations, leads]);

  const createNegotiation = async (input: {
    leadId: string;
    titulo: string;
    valor: number;
    etapa?: NegotiationStage;
    probabilidade?: number;
    dataPrevisaoFechamento?: Date;
  }) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from("negotiations")
      .insert({
        lead_id: input.leadId,
        titulo: input.titulo,
        valor: input.valor,
        etapa: input.etapa || "qualificacao",
        probabilidade: input.probabilidade ?? 20,
        data_previsao_fechamento: input.dataPrevisaoFechamento?.toISOString() || null,
        criado_por: profile.user_id,
        criado_por_nome: profile.nome,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar negociação:", error);
      throw error;
    }
    const leadObj = leads.find((l) => l.id === input.leadId);
    const newNeg = rowToNegotiation(data as NegotiationRow, leadObj);
    setNegotiations((prev) => [newNeg, ...prev]);
    return newNeg;
  };

  const updateNegotiation = async (neg: Negotiation) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { error } = await supabase
      .from("negotiations")
      .update({
        titulo: neg.titulo,
        valor: neg.valor,
        etapa: neg.etapa,
        probabilidade: neg.probabilidade,
        data_previsao_fechamento: neg.dataPrevisaoFechamento?.toISOString() || null,
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", neg.id);

    if (error) {
      console.error("Erro ao atualizar negociação:", error);
      throw error;
    }
    setNegotiations((prev) =>
      prev.map((n) => (n.id === neg.id ? { ...neg, dataAtualizacao: new Date() } : n))
    );
  };

  const deleteNegotiation = async (id: string) => {
    const { error } = await supabase.from("negotiations").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir negociação:", error);
      throw error;
    }
    setNegotiations((prev) => prev.filter((n) => n.id !== id));
  };

  return { negotiations, loading, fetchNegotiations, createNegotiation, updateNegotiation, deleteNegotiation };
}
