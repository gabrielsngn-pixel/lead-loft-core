import { useMemo } from "react";
import { Lead } from "@/types/crm";
import { Negotiation } from "@/types/crm";
import { MeetingMinutes } from "@/types/meetings";
import { differenceInDays, subDays, startOfDay, endOfDay, addDays, isWithinInterval } from "date-fns";

interface DashboardMetricsInput {
  leads: Lead[];
  negotiations: Negotiation[];
  meetings: MeetingMinutes[];
}

export function useDashboardMetrics({ leads, negotiations, meetings }: DashboardMetricsInput) {
  return useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);
    const next7Days = endOfDay(addDays(startOfDay(today), 7));
    
    // 1. Leads em Qualificação (não convertidos em contatos - sem responsável)
    const leadsEmQualificacao = leads.filter(l => !l.responsavelId).length;
    
    // 2. Leads Novos (últimos 7 dias)
    const leadsNovos7Dias = leads.filter(l => l.dataCriacao >= sevenDaysAgo).length;
    
    // 3. Contatos Ativos (leads com responsável)
    const contatosAtivos = leads.filter(l => l.responsavelId);
    const totalContatosAtivos = contatosAtivos.length;
    
    // 4. Valor do Pipeline (soma das negociações ativas)
    const activeNegotiationStages = ["proposta_aprovada", "proposta_enviada", "em_negociacao"];
    const negociacoesAtivas = negotiations.filter(n => 
      activeNegotiationStages.includes(n.etapa)
    );
    const valorPipeline = negociacoesAtivas.reduce((sum, n) => sum + n.valor, 0);
    
    // 5. Leads convertidos em Contato (últimos 7 dias)
    // Considera leads que ganharam responsável nos últimos 7 dias
    // Exclui se já existe outro contato da mesma empresa (mesmo CNPJ)
    const cnpjsAntigos = new Set(
      leads
        .filter(l => l.responsavelId && l.dataCriacao < sevenDaysAgo)
        .map(l => l.cnpj)
    );
    
    const leadsConvertidos7Dias = leads.filter(l => {
      // Tem responsável (é contato)
      if (!l.responsavelId) return false;
      // Data de última interação (quando foi convertido) nos últimos 7 dias
      // Como não temos data exata de conversão, usamos dataUltimaInteracao >= sevenDaysAgo
      // e dataCriacao pode ser antiga (lead que foi apropriado) ou recente (novo contato)
      const foiConvertidoRecentemente = l.dataUltimaInteracao >= sevenDaysAgo;
      // Não contar se CNPJ já existia como contato antes
      const ehNovaEmpresa = !cnpjsAntigos.has(l.cnpj);
      return foiConvertidoRecentemente && ehNovaEmpresa;
    }).length;
    
    // 6. Margem Ponderada (%) das Propostas em Negociação
    // (margem * valor) / valor total
    const margemPonderada = negociacoesAtivas.length > 0
      ? negociacoesAtivas.reduce((sum, n) => {
          const margem = n.margemEstimada ?? 0;
          return sum + (margem * n.valor);
        }, 0) / valorPipeline
      : 0;
    
    // 7. Reuniões realizadas (últimos 7 dias)
    // Reunião realizada = status "realizada"
    const reunioesRealizadas7Dias = meetings.filter(m => 
      m.status === "realizada" && 
      m.dataReuniao >= sevenDaysAgo
    ).length;
    
    // 8. Reuniões agendadas (próximos 7 dias)
    const reunioesAgendadas7Dias = meetings.filter(m => 
      m.status === "agendada" && 
      isWithinInterval(m.dataReuniao, { start: startOfDay(today), end: next7Days })
    ).length;
    
    // 9. Tempo médio Lead → Contato (dias) - Opcional
    const leadsConvertidosTotal = leads.filter(l => l.responsavelId);
    const tempoMedioConversao = leadsConvertidosTotal.length > 0
      ? leadsConvertidosTotal.reduce((sum, l) => {
          // Diferença entre última interação (conversão) e criação
          const dias = differenceInDays(l.dataUltimaInteracao, l.dataCriacao);
          return sum + dias;
        }, 0) / leadsConvertidosTotal.length
      : 0;
    
    // 10. Contatos sem próxima ação definida
    const contatosSemAcao = contatosAtivos.filter(c => {
      const hasFutureMeeting = c.proximaReuniao && c.proximaReuniao > today;
      const hasFutureActivity = c.proximaAtividade && c.proximaAtividade > today;
      return !hasFutureMeeting && !hasFutureActivity;
    }).length;
    
    return {
      // Métricas principais
      leadsEmQualificacao,
      leadsNovos7Dias,
      totalContatosAtivos,
      valorPipeline,
      leadsConvertidos7Dias,
      margemPonderada,
      reunioesRealizadas7Dias,
      reunioesAgendadas7Dias,
      
      // Métricas opcionais
      tempoMedioConversao,
      contatosSemAcao,
      
      // Dados para componentes
      contatosAtivos,
      negociacoesAtivas,
    };
  }, [leads, negotiations, meetings]);
}
