import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Empreendimento, EmpreendimentoDecisor, EmpreendimentoImportLog } from "@/types/empreendimentos";

export function useEmpreendimentos() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const empreendimentosQuery = useQuery({
    queryKey: ["empreendimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empreendimentos")
        .select("*")
        .order("data_habitese", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as unknown as Empreendimento[];
    },
  });

  const createEmpreendimento = useMutation({
    mutationFn: async (emp: Partial<Empreendimento>) => {
      const chaveUnica = `${(emp.nome_empreendimento || "").trim().toLowerCase()}|${(emp.cidade || "").trim().toLowerCase()}`;
      const { data, error } = await supabase
        .from("empreendimentos")
        .insert({
          ...emp,
          chave_unica: chaveUnica,
          importado_por: profile?.user_id,
          importado_por_nome: profile?.nome,
          fonte_importacao: "manual",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empreendimentos"] });
      toast({ title: "Empreendimento criado com sucesso" });
    },
    onError: (error: any) => {
      const isDuplicate = error?.message?.includes("empreendimentos_chave_unica_unique");
      toast({
        title: isDuplicate ? "Empreendimento duplicado" : "Erro ao criar",
        description: isDuplicate
          ? "Já existe um empreendimento com esse nome nessa cidade."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const updateEmpreendimento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Empreendimento> & { id: string }) => {
      const { data, error } = await supabase
        .from("empreendimentos")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empreendimentos"] });
      toast({ title: "Empreendimento atualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteEmpreendimento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empreendimentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empreendimentos"] });
      toast({ title: "Empreendimento excluído" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const importEmpreendimentos = useMutation({
    mutationFn: async ({
      records,
      fonte,
    }: {
      records: Partial<Empreendimento>[];
      fonte: string;
    }) => {
      let imported = 0;
      let ignored = 0;
      const errors: string[] = [];

      for (const record of records) {
        const chaveUnica = `${(record.nome_empreendimento || "").trim().toLowerCase()}|${(record.cidade || "").trim().toLowerCase()}`;

        const { error } = await supabase.from("empreendimentos").insert({
          ...record,
          chave_unica: chaveUnica,
          fonte_importacao: fonte,
          importado_por: profile?.user_id,
          importado_por_nome: profile?.nome,
        } as any);

        if (error) {
          if (error.message?.includes("empreendimentos_chave_unica_unique")) {
            ignored++;
          } else {
            errors.push(`${record.nome_empreendimento}: ${error.message}`);
            ignored++;
          }
        } else {
          imported++;
        }
      }

      // Log import
      await supabase.from("empreendimento_import_logs").insert({
        fonte,
        total_registros: records.length,
        quantidade_importada: imported,
        quantidade_ignorada: ignored,
        user_id: profile?.user_id,
        user_nome: profile?.nome,
        log_erros: errors.length > 0 ? errors : null,
      } as any);

      return { imported, ignored, errors, total: records.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["empreendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["empreendimento-import-logs"] });
      toast({
        title: "Importação concluída",
        description: `${result.imported} importados, ${result.ignored} ignorados de ${result.total} registros.`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro na importação", description: error.message, variant: "destructive" });
    },
  });

  // Decisores
  const useDecisores = (empreendimentoId: string | null) =>
    useQuery({
      queryKey: ["empreendimento-decisores", empreendimentoId],
      queryFn: async () => {
        if (!empreendimentoId) return [];
        const { data, error } = await supabase
          .from("empreendimento_decisores")
          .select("*")
          .eq("empreendimento_id", empreendimentoId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as unknown as EmpreendimentoDecisor[];
      },
      enabled: !!empreendimentoId,
    });

  const findDecisores = async (construtora: string) => {
    const normalizedConstrutora = construtora.trim().toLowerCase();
    
    // Search prospects by company name
    const { data: prospects } = await supabase
      .from("prospects")
      .select("*")
      .ilike("empresa", `%${normalizedConstrutora}%`);

    // Search leads (contatos ativos) by razao_social
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .not("responsavel_id", "is", null)
      .ilike("razao_social", `%${normalizedConstrutora}%`);

    return {
      prospects: prospects || [],
      leads: leads || [],
    };
  };

  const addDecisor = useMutation({
    mutationFn: async (decisor: Partial<EmpreendimentoDecisor>) => {
      const { data, error } = await supabase
        .from("empreendimento_decisores")
        .insert(decisor as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empreendimento-decisores"] });
      toast({ title: "Decisor vinculado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao vincular decisor", description: error.message, variant: "destructive" });
    },
  });

  const removeDecisor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empreendimento_decisores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empreendimento-decisores"] });
      toast({ title: "Decisor removido" });
    },
  });

  const importLogsQuery = useQuery({
    queryKey: ["empreendimento-import-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empreendimento_import_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as EmpreendimentoImportLog[];
    },
  });

  return {
    empreendimentos: empreendimentosQuery.data || [],
    isLoading: empreendimentosQuery.isLoading,
    createEmpreendimento,
    updateEmpreendimento,
    deleteEmpreendimento,
    importEmpreendimentos,
    useDecisores,
    findDecisores,
    addDecisor,
    removeDecisor,
    importLogs: importLogsQuery.data || [],
    isLoadingLogs: importLogsQuery.isLoading,
  };
}
