import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Activity, ActivityCategory, ActivityStatus } from "@/types/crm";

interface DbActivity {
  id: string;
  lead_id: string | null;
  negociacao_id: string | null;
  tipo: string;
  categoria: string;
  titulo: string;
  descricao: string | null;
  data_agendada: string;
  data_conclusao: string | null;
  concluida: boolean;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  comentario: string | null;
  status_andamento: string;
  criado_por: string;
  criado_por_nome: string;
  created_at: string;
  updated_at: string;
}

const mapDbToActivity = (db: DbActivity): Activity => ({
  id: db.id,
  leadId: db.lead_id || undefined,
  negociacaoId: db.negociacao_id || undefined,
  tipo: db.tipo as Activity["tipo"],
  categoria: db.categoria as ActivityCategory,
  titulo: db.titulo,
  descricao: db.descricao || undefined,
  dataAgendada: new Date(db.data_agendada),
  dataConclusao: db.data_conclusao ? new Date(db.data_conclusao) : undefined,
  concluida: db.concluida,
  responsavelId: db.responsavel_id || "",
  responsavelNome: db.responsavel_nome || undefined,
  comentario: db.comentario || undefined,
  statusAndamento: (db.status_andamento as ActivityStatus) || "em_andamento",
});

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("data_agendada", { ascending: true });

      if (error) throw error;

      setActivities((data || []).map(mapDbToActivity));
    } catch (err: any) {
      console.error("Error fetching activities:", err);
      toast({
        title: "Erro ao carregar atividades",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = async (activity: Omit<Activity, "id">) => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar atividades.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          lead_id: activity.leadId || null,
          negociacao_id: activity.negociacaoId || null,
          tipo: activity.tipo,
          categoria: activity.categoria,
          titulo: activity.titulo,
          descricao: activity.descricao || null,
          data_agendada: activity.dataAgendada.toISOString(),
          data_conclusao: activity.dataConclusao?.toISOString() || null,
          concluida: activity.concluida,
          responsavel_id: activity.responsavelId || null,
          responsavel_nome: activity.responsavelNome || null,
          comentario: activity.comentario || null,
          status_andamento: activity.statusAndamento || "em_andamento",
          criado_por: profile.user_id,
          criado_por_nome: profile.nome,
        })
        .select()
        .single();

      if (error) throw error;

      const newActivity = mapDbToActivity(data);
      setActivities((prev) => [...prev, newActivity]);
      
      return newActivity;
    } catch (err: any) {
      console.error("Error creating activity:", err);
      toast({
        title: "Erro ao criar atividade",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.leadId !== undefined) dbUpdates.lead_id = updates.leadId || null;
      if (updates.negociacaoId !== undefined) dbUpdates.negociacao_id = updates.negociacaoId || null;
      if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
      if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
      if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
      if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao || null;
      if (updates.dataAgendada !== undefined) dbUpdates.data_agendada = updates.dataAgendada.toISOString();
      if (updates.dataConclusao !== undefined) dbUpdates.data_conclusao = updates.dataConclusao?.toISOString() || null;
      if (updates.concluida !== undefined) dbUpdates.concluida = updates.concluida;
      if (updates.responsavelId !== undefined) dbUpdates.responsavel_id = updates.responsavelId || null;
      if (updates.responsavelNome !== undefined) dbUpdates.responsavel_nome = updates.responsavelNome || null;
      if (updates.comentario !== undefined) dbUpdates.comentario = updates.comentario || null;
      if (updates.statusAndamento !== undefined) dbUpdates.status_andamento = updates.statusAndamento;

      const { data, error } = await supabase
        .from("activities")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const updatedActivity = mapDbToActivity(data);
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? updatedActivity : a))
      );

      return updatedActivity;
    } catch (err: any) {
      console.error("Error updating activity:", err);
      toast({
        title: "Erro ao atualizar atividade",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setActivities((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: any) {
      console.error("Error deleting activity:", err);
      toast({
        title: "Erro ao excluir atividade",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleComplete = async (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return null;

    return updateActivity(id, {
      concluida: !activity.concluida,
      dataConclusao: !activity.concluida ? new Date() : undefined,
    });
  };

  return {
    activities,
    loading,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleComplete,
    refetch: fetchActivities,
  };
}
