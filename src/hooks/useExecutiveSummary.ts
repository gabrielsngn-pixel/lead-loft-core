import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLeads } from "@/hooks/useLeads";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useProspects } from "@/hooks/useProspects";
import { useProspectMetrics } from "@/hooks/useProspectMetrics";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getISOWeek, startOfWeek, endOfWeek, addWeeks } from "date-fns";

interface ProjetoAprovado {
  id: string;
  nome_empreendimento: string;
  empresa_nome: string | null;
  data_habitese: string | null;
  vgv_estimado: number | null;
  status_contrato: string | null;
  margem_estimada: number | null;
  simulation_data: any;
}

interface AiSections {
  resumoGeral: string;
  pulsoComercial: string;
  esteiraProjetos: string;
  contasEstrategicas: string;
}

export function useExecutiveSummary() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { leads, loading: leadsLoading } = useLeads();
  const { negotiations, loading: negsLoading } = useNegotiations();
  const { prospects, loading: prospectsLoading } = useProspects();
  const { meetings, loading: meetingsLoading } = useMeetings();
  const prospectMetrics = useProspectMetrics();

  const dashMetrics = useDashboardMetrics({ leads, negotiations });

  const [projetos, setProjetos] = useState<ProjetoAprovado[]>([]);
  const [projetosLoading, setProjetosLoading] = useState(true);
  const [headNote, setHeadNote] = useState("");
  const [headNoteId, setHeadNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [aiSections, setAiSections] = useState<AiSections | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const now = new Date();
  const weekNumber = getISOWeek(now);
  const year = now.getFullYear();
  const semanaAno = `${String(weekNumber).padStart(2, "0")}/${year}`;

  // Fetch approved projects
  useEffect(() => {
    const fetchProjetos = async () => {
      setProjetosLoading(true);
      const { data, error } = await supabase
        .from("viabilidades")
        .select("id, nome_empreendimento, empresa_nome, data_habitese, vgv_estimado, status_contrato, margem_estimada, simulation_data")
        .eq("status", "aprovado");
      if (!error) setProjetos((data || []) as ProjetoAprovado[]);
      setProjetosLoading(false);
    };
    fetchProjetos();
  }, []);

  // Fetch weekly note
  useEffect(() => {
    const fetchNote = async () => {
      const { data } = await supabase
        .from("executive_weekly_notes" as any)
        .select("*")
        .eq("semana_ano", semanaAno)
        .maybeSingle();
      if (data) {
        setHeadNote((data as any).nota_head || "");
        setHeadNoteId((data as any).id);
      }
    };
    fetchNote();
  }, [semanaAno]);

  // Save weekly note
  const saveHeadNote = useCallback(async (text: string) => {
    if (!profile) return;
    setSavingNote(true);
    try {
      if (headNoteId) {
        await supabase
          .from("executive_weekly_notes" as any)
          .update({
            nota_head: text,
            atualizado_por: profile.user_id,
            atualizado_por_nome: profile.nome,
          } as any)
          .eq("id", headNoteId);
      } else {
        const { data } = await supabase
          .from("executive_weekly_notes" as any)
          .insert({
            semana_ano: semanaAno,
            nota_head: text,
            criado_por: profile.user_id,
            criado_por_nome: profile.nome,
          } as any)
          .select()
          .single();
        if (data) setHeadNoteId((data as any).id);
      }
      setHeadNote(text);
      toast({ title: "Nota salva com sucesso" });
    } catch (e) {
      toast({ title: "Erro ao salvar nota", variant: "destructive" });
    }
    setSavingNote(false);
  }, [profile, headNoteId, semanaAno, toast]);

  // Computed metrics
  const contatos = useMemo(() => leads.filter(l => l.responsavelId), [leads]);

  const META_VGV = 1_000_000_000;
  const META_UNIDADES = 2500;

  const totalVgvProjetos = useMemo(
    () => projetos.reduce((sum, p) => sum + (p.vgv_estimado || 0), 0),
    [projetos]
  );
  const totalUnidadesProjetos = useMemo(
    () => projetos.reduce((sum, p) => {
      const sim = p.simulation_data as any;
      return sum + (sim?.unidades || 0);
    }, 0),
    [projetos]
  );

  const vgvPercent = (totalVgvProjetos / META_VGV) * 100;
  const unidadesPercent = (totalUnidadesProjetos / META_UNIDADES) * 100;

  // Top contacted companies this week
  const empresasContatadas = useMemo(() => {
    const companies = contatos
      .filter(c => c.ultimaReuniao || c.proximaReuniao)
      .map(c => c.razaoSocial || c.nomeFantasia || "")
      .filter(Boolean);
    const unique = [...new Set(companies)];
    return unique.slice(0, 5).join(", ") || "N/A";
  }, [contatos]);

  // Negotiations with active stages
  const negociacoesAtivas = useMemo(
    () => negotiations.filter(n => ["proposta_aprovada", "proposta_enviada", "em_negociacao"].includes(n.etapa)),
    [negotiations]
  );

  const contratosFechados = useMemo(
    () => negotiations.filter(n => n.etapa === "proposta_ganha").length,
    [negotiations]
  );

  // Esteira data for table
  const esteiraData = useMemo(() => {
    return negociacoesAtivas.map(n => ({
      id: n.id,
      projeto: n.titulo,
      empresa: n.lead?.razaoSocial || n.lead?.nomeFantasia || "—",
      etapa: n.etapa,
      vgv: n.vgvTotal || n.valor || 0,
      probabilidade: n.probabilidade,
      proximaAcao: n.dataPrevisaoFechamento
        ? `Previsão: ${n.dataPrevisaoFechamento.toLocaleDateString("pt-BR")}`
        : "A definir",
    }));
  }, [negociacoesAtivas]);

  // Meetings drilldown: this week realized & next week scheduled
  const reunioesSemana = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return meetings
      .filter(m => {
        const d = m.dataReuniao;
        return d >= weekStart && d <= weekEnd && m.status === "realizada";
      })
      .map(m => ({
        id: m.id,
        empresa: m.empresa,
        contato: m.participantes?.[0] || "—",
        cidade: "",
        consultor: m.consultorNome,
        data: m.dataReuniao,
      }));
  }, [meetings]);

  const reunioesProximaSemana = useMemo(() => {
    const now = new Date();
    const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    return meetings
      .filter(m => {
        const d = m.dataReuniao;
        return d >= nextWeekStart && d <= nextWeekEnd && m.status === "agendada";
      })
      .map(m => ({
        id: m.id,
        empresa: m.empresa,
        contato: m.participantes?.[0] || "—",
        cidade: "",
        consultor: m.consultorNome,
        data: m.dataReuniao,
      }));
  }, [meetings]);

  // Generate AI sections
  const generateAiSummary = useCallback(async () => {
    setAiLoading(true);
    try {
      const metricsPayload = {
        receitaAcumulada: dashMetrics.valorPipeline,
        vgvPercent,
        totalUnidades: totalUnidadesProjetos,
        totalProspects: prospects.length,
        novosProspects: prospectMetrics.importadosUltimos7Dias,
        totalContatos: contatos.length,
        reunioesRealizadas: dashMetrics.reunioesRealizadas7Dias,
        reunioesAgendadas: dashMetrics.reunioesAgendadas7Dias,
        contratosFechados,
        valorPipeline: dashMetrics.valorPipeline,
        totalProjetos: projetos.length,
        vgvProjetos: totalVgvProjetos,
        negociacoesAtivas: negociacoesAtivas.length,
        empresasContatadas,
      };

      const { data, error } = await supabase.functions.invoke("generate-executive-summary", {
        body: { metrics: metricsPayload },
      });

      if (error) throw error;

      setAiSections({
        resumoGeral: data.resumoGeral || "",
        pulsoComercial: data.pulsoComercial || "",
        esteiraProjetos: data.esteiraProjetos || "",
        contasEstrategicas: data.contasEstrategicas || "",
      });
    } catch (e: any) {
      console.error("Error generating AI summary:", e);
      toast({
        title: "Erro ao gerar resumo",
        description: e?.message || "Tente novamente",
        variant: "destructive",
      });
    }
    setAiLoading(false);
  }, [dashMetrics, vgvPercent, totalUnidadesProjetos, prospects, prospectMetrics, contatos, contratosFechados, projetos, totalVgvProjetos, negociacoesAtivas, empresasContatadas, toast]);

  const loading = leadsLoading || negsLoading || prospectsLoading || projetosLoading || meetingsLoading;

  return {
    loading,
    semanaAno,
    weekNumber,
    year,
    // Dashboard metrics
    receitaOperacional: dashMetrics.valorPipeline,
    margemPonderada: dashMetrics.margemPonderada,
    // Prospects
    totalProspects: prospects.length,
    novosProspects: prospectMetrics.importadosUltimos7Dias,
    convertidos: prospectMetrics.convertidosUltimos7Dias,
    // Contacts
    totalContatos: contatos.length,
    reunioesRealizadas: dashMetrics.reunioesRealizadas7Dias,
    reunioesAgendadas: dashMetrics.reunioesAgendadas7Dias,
    contratosFechados,
    // Esteira
    totalVgvProjetos,
    totalUnidadesProjetos,
    vgvPercent,
    unidadesPercent,
    totalProjetos: projetos.length,
    esteiraData,
    // Meetings drilldown
    reunioesSemana,
    reunioesProximaSemana,
    // Head note
    headNote,
    saveHeadNote,
    savingNote,
    // AI
    aiSections,
    aiLoading,
    generateAiSummary,
    // Meta
    META_VGV,
    META_UNIDADES,
  };
}
