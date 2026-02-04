import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subDays, isAfter } from "date-fns";

interface ProspectRow {
  id: string;
  status: string;
  data_importacao: string;
  convertido_em: string | null;
  updated_at: string;
}

interface ProspectMetrics {
  importadosUltimos7Dias: number;
  convertidosUltimos7Dias: number;
  taxaConversao: number;
  semAtividade7Dias: number;
  loading: boolean;
}

export function useProspectMetrics(): ProspectMetrics {
  const [prospects, setProspects] = useState<ProspectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prospects")
      .select("id, status, data_importacao, convertido_em, updated_at");

    if (error) {
      console.error("Erro ao buscar prospects para métricas:", error);
      setLoading(false);
      return;
    }

    setProspects(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  return useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);

    const importadosUltimos7Dias = prospects.filter(
      p => isAfter(new Date(p.data_importacao), sevenDaysAgo)
    ).length;

    const convertidosUltimos7Dias = prospects.filter(
      p => p.status === "convertido" && p.convertido_em && isAfter(new Date(p.convertido_em), sevenDaysAgo)
    ).length;

    const totalConvertidos = prospects.filter(p => p.status === "convertido").length;
    const taxaConversao = prospects.length > 0 
      ? (totalConvertidos / prospects.length) * 100 
      : 0;

    const semAtividade7Dias = prospects.filter(
      p => p.status !== "convertido" && p.status !== "descartado" && !isAfter(new Date(p.updated_at), sevenDaysAgo)
    ).length;

    return {
      importadosUltimos7Dias,
      convertidosUltimos7Dias,
      taxaConversao,
      semAtividade7Dias,
      loading,
    };
  }, [prospects, loading]);
}
