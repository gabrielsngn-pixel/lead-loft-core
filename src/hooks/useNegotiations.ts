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
  // Novos campos de indicadores
  viabilidade_id: string | null;
  margem_estimada: number | null;
  comissao_incorporador: number | null;
  registro_valor: number | null;
  registro_tipo: string | null;
  receita_registro_loft_percent: number | null;
  despesas_operacionais: number | null;
  unidades: number | null;
  ticket_medio: number | null;
  vgv_total: number | null;
  comissao_bancaria_ponderada: number | null;
}

import { NegotiationStage } from "@/types/crm";

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
    // Novos campos de indicadores
    viabilidadeId: row.viabilidade_id || undefined,
    margemEstimada: row.margem_estimada ?? undefined,
    comissaoIncorporador: row.comissao_incorporador ?? undefined,
    registroValor: row.registro_valor ?? undefined,
    registroTipo: row.registro_tipo ?? undefined,
    receitaRegistroLoftPercent: row.receita_registro_loft_percent ?? undefined,
    despesasOperacionais: row.despesas_operacionais ?? undefined,
    unidades: row.unidades ?? undefined,
    ticketMedio: row.ticket_medio ?? undefined,
    vgvTotal: row.vgv_total ?? undefined,
    comissaoBancariaPonderada: row.comissao_bancaria_ponderada ?? undefined,
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
    // Indicadores do simulador
    viabilidadeId?: string;
    margemEstimada?: number;
    comissaoIncorporador?: number;
    registroValor?: number;
    registroTipo?: string;
    receitaRegistroLoftPercent?: number;
    despesasOperacionais?: number;
    unidades?: number;
    ticketMedio?: number;
    vgvTotal?: number;
    comissaoBancariaPonderada?: number;
  }) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from("negotiations")
      .insert({
        lead_id: input.leadId,
        titulo: input.titulo,
        valor: input.valor,
        etapa: input.etapa || "proposta_aprovada",
        probabilidade: input.probabilidade ?? 20,
        data_previsao_fechamento: input.dataPrevisaoFechamento?.toISOString() || null,
        criado_por: profile.user_id,
        criado_por_nome: profile.nome,
        // Indicadores do simulador
        viabilidade_id: input.viabilidadeId || null,
        margem_estimada: input.margemEstimada ?? null,
        comissao_incorporador: input.comissaoIncorporador ?? null,
        registro_valor: input.registroValor ?? null,
        registro_tipo: input.registroTipo ?? null,
        receita_registro_loft_percent: input.receitaRegistroLoftPercent ?? null,
        despesas_operacionais: input.despesasOperacionais ?? null,
        unidades: input.unidades ?? null,
        ticket_medio: input.ticketMedio ?? null,
        vgv_total: input.vgvTotal ?? null,
        comissao_bancaria_ponderada: input.comissaoBancariaPonderada ?? null,
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
