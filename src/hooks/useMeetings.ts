import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MeetingMinutes, MeetingType, MeetingStatus } from "@/types/meetings";

export interface DbMeeting {
  id: string;
  lead_id: string | null;
  negociacao_id: string | null;
  empresa: string;
  cnpj: string;
  tipo_reuniao: string;
  data_reuniao: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  consultor_id: string | null;
  consultor_nome: string;
  participantes: string[];
  objetivos: string | null;
  pauta: string | null;
  discussao: string | null;
  decisoes: string | null;
  proximos_passos: string | null;
  observacoes: string | null;
  status: string;
  arquivada: boolean;
  vinculada_contato: boolean;
  criado_por: string;
  criado_por_nome: string;
  atualizado_por: string | null;
  atualizado_por_nome: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingInput {
  leadId?: string;
  negociacaoId?: string;
  empresa: string;
  cnpj: string;
  tipoReuniao: MeetingType;
  dataReuniao: Date;
  horaInicio?: string;
  horaFim?: string;
  consultorId?: string;
  consultorNome: string;
  participantes: string[];
  objetivos?: string;
  pauta?: string;
  discussao?: string;
  decisoes?: string;
  proximosPassos?: string;
  observacoes?: string;
  status: MeetingStatus;
  vinculadaContato?: boolean;
}

// Convert database meeting to MeetingMinutes type
export function dbToMeeting(db: DbMeeting): MeetingMinutes {
  return {
    id: db.id,
    leadId: db.lead_id || undefined,
    negociacaoId: db.negociacao_id || undefined,
    empresa: db.empresa,
    cnpj: db.cnpj,
    tipoReuniao: db.tipo_reuniao as MeetingType,
    dataReuniao: new Date(db.data_reuniao),
    horaInicio: db.hora_inicio || "",
    horaFim: db.hora_fim || undefined,
    consultorId: db.consultor_id || "",
    consultorNome: db.consultor_nome,
    participantes: db.participantes || [],
    objetivos: db.objetivos || "",
    pauta: db.pauta || "",
    discussao: db.discussao || "",
    decisoes: db.decisoes || "",
    proximosPassos: db.proximos_passos || "",
    observacoes: db.observacoes || undefined,
    status: db.status as MeetingStatus,
    dataArmazenamento: new Date(db.created_at),
    arquivada: db.arquivada,
    historico: [],
  };
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<MeetingMinutes[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("data_reuniao", { ascending: false });

      if (error) throw error;
      setMeetings((data || []).map((m) => dbToMeeting(m as DbMeeting)));
    } catch (error: any) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Erro ao carregar reuniões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createMeeting = useCallback(
    async (input: CreateMeetingInput) => {
      if (!profile) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar atas.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const newMeeting = {
          lead_id: input.leadId || null,
          negociacao_id: input.negociacaoId || null,
          empresa: input.empresa,
          cnpj: input.cnpj,
          tipo_reuniao: input.tipoReuniao,
          data_reuniao: input.dataReuniao.toISOString(),
          hora_inicio: input.horaInicio || null,
          hora_fim: input.horaFim || null,
          consultor_id: input.consultorId || profile.user_id,
          consultor_nome: input.consultorNome || profile.nome,
          participantes: input.participantes || [],
          objetivos: input.objetivos || null,
          pauta: input.pauta || null,
          discussao: input.discussao || null,
          decisoes: input.decisoes || null,
          proximos_passos: input.proximosPassos || null,
          observacoes: input.observacoes || null,
          status: input.status,
          vinculada_contato: input.vinculadaContato || false,
          criado_por: profile.user_id,
          criado_por_nome: profile.nome,
        };

        const { data, error } = await supabase
          .from("meetings")
          .insert(newMeeting)
          .select()
          .single();

        if (error) throw error;

        const meeting = dbToMeeting(data as DbMeeting);
        setMeetings((prev) => [meeting, ...prev]);
        toast({
          title: "Ata armazenada",
          description: "A ata foi salva no repositório de reuniões.",
        });
        return meeting;
      } catch (error: any) {
        console.error("Error creating meeting:", error);
        toast({
          title: "Erro ao criar ata",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [profile, toast]
  );

  const updateMeeting = useCallback(
    async (id: string, updates: Partial<CreateMeetingInput>) => {
      if (!profile) return null;

      try {
        const updateData: any = {};
        if (updates.empresa !== undefined) updateData.empresa = updates.empresa;
        if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj;
        if (updates.tipoReuniao !== undefined) updateData.tipo_reuniao = updates.tipoReuniao;
        if (updates.dataReuniao !== undefined) updateData.data_reuniao = updates.dataReuniao.toISOString();
        if (updates.horaInicio !== undefined) updateData.hora_inicio = updates.horaInicio;
        if (updates.horaFim !== undefined) updateData.hora_fim = updates.horaFim;
        if (updates.consultorNome !== undefined) updateData.consultor_nome = updates.consultorNome;
        if (updates.participantes !== undefined) updateData.participantes = updates.participantes;
        if (updates.objetivos !== undefined) updateData.objetivos = updates.objetivos;
        if (updates.pauta !== undefined) updateData.pauta = updates.pauta;
        if (updates.discussao !== undefined) updateData.discussao = updates.discussao;
        if (updates.decisoes !== undefined) updateData.decisoes = updates.decisoes;
        if (updates.proximosPassos !== undefined) updateData.proximos_passos = updates.proximosPassos;
        if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.leadId !== undefined) updateData.lead_id = updates.leadId;
        if (updates.vinculadaContato !== undefined) updateData.vinculada_contato = updates.vinculadaContato;

        updateData.atualizado_por = profile.user_id;
        updateData.atualizado_por_nome = profile.nome;

        const { data, error } = await supabase
          .from("meetings")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        const meeting = dbToMeeting(data as DbMeeting);
        setMeetings((prev) =>
          prev.map((m) => (m.id === id ? meeting : m))
        );
        return meeting;
      } catch (error: any) {
        console.error("Error updating meeting:", error);
        toast({
          title: "Erro ao atualizar ata",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [profile, toast]
  );

  const deleteMeeting = useCallback(
    async (id: string) => {
      try {
        const meeting = meetings.find((m) => m.id === id);
        const { error } = await supabase.from("meetings").delete().eq("id", id);

        if (error) throw error;

        setMeetings((prev) => prev.filter((m) => m.id !== id));
        toast({
          title: "Ata excluída",
          description: meeting
            ? `Ata de "${meeting.empresa}" foi removida.`
            : "Ata removida com sucesso.",
        });
        return true;
      } catch (error: any) {
        console.error("Error deleting meeting:", error);
        toast({
          title: "Erro ao excluir ata",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [meetings, toast]
  );

  const archiveMeeting = useCallback(
    async (id: string) => {
      if (!profile) return;

      try {
        const { error } = await supabase
          .from("meetings")
          .update({
            arquivada: true,
            atualizado_por: profile.user_id,
            atualizado_por_nome: profile.nome,
          })
          .eq("id", id);

        if (error) throw error;

        setMeetings((prev) =>
          prev.map((m) => (m.id === id ? { ...m, arquivada: true } : m))
        );
        toast({
          title: "Ata arquivada",
          description: "A ata foi movida para o arquivo.",
        });
      } catch (error: any) {
        console.error("Error archiving meeting:", error);
        toast({
          title: "Erro ao arquivar ata",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [profile, toast]
  );

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    loading,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    archiveMeeting,
  };
}
