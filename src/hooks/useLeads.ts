import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Lead, LeadStatus, Priority, CompanyType, LeadSource } from "@/types/crm";

interface LeadRow {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  nome_contato: string | null;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  origem: string;
  status: string;
  prioridade: string;
  tipo_empresa: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  observacoes: string | null;
  linkedin: string | null;
  data_criacao: string;
  data_ultima_interacao: string;
  proxima_atividade: string | null;
  proxima_reuniao: string | null;
  ultima_reuniao: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia ?? undefined,
    nomeContato: row.nome_contato ?? undefined,
    email: row.email,
    telefone: row.telefone,
    cidade: row.cidade,
    estado: row.estado,
    origem: row.origem as LeadSource,
    status: row.status as LeadStatus,
    prioridade: row.prioridade as Priority,
    tipoEmpresa: row.tipo_empresa as CompanyType,
    responsavelId: row.responsavel_id ?? undefined,
    responsavelNome: row.responsavel_nome ?? undefined,
    observacoes: row.observacoes ?? undefined,
    linkedin: row.linkedin ?? undefined,
    dataCriacao: new Date(row.data_criacao),
    dataUltimaInteracao: new Date(row.data_ultima_interacao),
    proximaAtividade: row.proxima_atividade ? new Date(row.proxima_atividade) : undefined,
    proximaReuniao: row.proxima_reuniao ? new Date(row.proxima_reuniao) : undefined,
    ultimaReuniao: row.ultima_reuniao ? new Date(row.ultima_reuniao) : undefined,
  };
}

export function useLeads() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("data_criacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar leads:", error);
      toast({ title: "Erro ao carregar leads", variant: "destructive" });
      setLoading(false);
      return;
    }
    setLeads((data as LeadRow[]).map(rowToLead));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (input: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    email: string;
    telefone: string;
    cidade: string;
    estado: string;
    origem: LeadSource | "";
    observacoes?: string;
  }) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from("leads")
      .insert({
        cnpj: input.cnpj,
        razao_social: input.razaoSocial,
        nome_fantasia: input.nomeFantasia || null,
        email: input.email,
        telefone: input.telefone,
        cidade: input.cidade,
        estado: input.estado,
        origem: input.origem || "outro",
        observacoes: input.observacoes || null,
        criado_por: profile.user_id,
        criado_por_nome: profile.nome,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar lead:", error);
      throw error;
    }
    setLeads((prev) => [rowToLead(data as LeadRow), ...prev]);
    return rowToLead(data as LeadRow);
  };

  const updateLead = async (updatedLead: Lead) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { error } = await supabase
      .from("leads")
      .update({
        cnpj: updatedLead.cnpj,
        razao_social: updatedLead.razaoSocial,
        nome_fantasia: updatedLead.nomeFantasia || null,
        nome_contato: updatedLead.nomeContato || null,
        email: updatedLead.email,
        telefone: updatedLead.telefone,
        cidade: updatedLead.cidade,
        estado: updatedLead.estado,
        origem: updatedLead.origem,
        status: updatedLead.status,
        prioridade: updatedLead.prioridade,
        tipo_empresa: updatedLead.tipoEmpresa,
        responsavel_id: updatedLead.responsavelId || null,
        responsavel_nome: updatedLead.responsavelNome || null,
        observacoes: updatedLead.observacoes || null,
        linkedin: updatedLead.linkedin || null,
        data_ultima_interacao: new Date().toISOString(),
        proxima_atividade: updatedLead.proximaAtividade?.toISOString() || null,
        proxima_reuniao: updatedLead.proximaReuniao?.toISOString() || null,
        ultima_reuniao: updatedLead.ultimaReuniao?.toISOString() || null,
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", updatedLead.id);

    if (error) {
      console.error("Erro ao atualizar lead:", error);
      throw error;
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? { ...updatedLead, dataUltimaInteracao: new Date() } : l))
    );
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir lead:", error);
      throw error;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const claimLead = async (lead: Lead) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { error } = await supabase
      .from("leads")
      .update({
        responsavel_id: profile.user_id,
        responsavel_nome: profile.nome,
        data_ultima_interacao: new Date().toISOString(),
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", lead.id);

    if (error) {
      console.error("Erro ao apropriar lead:", error);
      throw error;
    }
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, responsavelId: profile.user_id, responsavelNome: profile.nome, dataUltimaInteracao: new Date() }
          : l
      )
    );
  };

  // Assign lead to a specific consultant (Gestor/Master only)
  const assignLead = async (lead: Lead, consultantId: string, consultantName: string) => {
    if (!profile) throw new Error("Usuário não autenticado");
    const { error } = await supabase
      .from("leads")
      .update({
        responsavel_id: consultantId,
        responsavel_nome: consultantName,
        data_ultima_interacao: new Date().toISOString(),
        atualizado_por: profile.user_id,
        atualizado_por_nome: profile.nome,
      })
      .eq("id", lead.id);

    if (error) {
      console.error("Erro ao atribuir lead:", error);
      throw error;
    }
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, responsavelId: consultantId, responsavelNome: consultantName, dataUltimaInteracao: new Date() }
          : l
      )
    );
  };

  return { leads, loading, fetchLeads, createLead, updateLead, deleteLead, claimLead, assignLead };
}
