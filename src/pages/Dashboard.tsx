import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { ContactsWithoutActionAlert } from "@/components/dashboard/ContactsWithoutActionAlert";
import { ScheduledMeetingsCard } from "@/components/dashboard/ScheduledMeetingsCard";
import { useLeads } from "@/hooks/useLeads";
import { useNegotiations } from "@/hooks/useNegotiations";
import { useActivities } from "@/hooks/useActivities";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  TrendingUp,
  UserCheck,
  CalendarCheck,
  Percent,
  Clock,
  Loader2,
} from "lucide-react";

const Dashboard = () => {
  const { leads, loading: leadsLoading } = useLeads();
  const { negotiations, loading: negotiationsLoading } = useNegotiations();
  const { activities, loading: activitiesLoading } = useActivities();

  const metrics = useDashboardMetrics({ leads, negotiations });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get upcoming activities (not completed, future dates)
  const today = new Date();
  const upcomingActivities = activities
    .filter(a => !a.concluida && a.dataAgendada >= today)
    .sort((a, b) => a.dataAgendada.getTime() - b.dataAgendada.getTime())
    .slice(0, 5);

  const isLoading = leadsLoading || negotiationsLoading || activitiesLoading;

  if (isLoading) {
    return (
      <AppLayout title="Dashboard Executivo" subtitle="Visão gerencial do CRM">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard Executivo" subtitle="Visão gerencial do CRM">
      {/* Row 1 - Métricas de Geração de Demanda */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Leads em Qualificação"
          value={metrics.leadsEmQualificacao}
          icon={<Users className="w-6 h-6" />}
          tooltip="Quantidade total de leads que ainda não foram convertidos em Contatos Ativos (sem responsável atribuído)."
        />
        <MetricCard
          title="Leads Novos (7 dias)"
          value={metrics.leadsNovos7Dias}
          icon={<UserPlus className="w-6 h-6" />}
          tooltip="Quantidade de leads cadastrados nos últimos 7 dias (janela móvel D-7)."
        />
        <MetricCard
          title="Convertidos em Contato"
          value={metrics.leadsConvertidos7Dias}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="primary"
          tooltip="Leads que viraram contato nos últimos 7 dias. Exclui contatos de empresas que já possuíam outro contato cadastrado."
        />
        <MetricCard
          title="Contatos Ativos"
          value={metrics.totalContatosAtivos}
          icon={<UserCheck className="w-6 h-6" />}
          variant="secondary"
          tooltip="Total de contatos ativos atualmente no sistema (leads com responsável atribuído)."
        />
      </div>

      {/* Row 2 - Métricas de Pipeline e Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Valor do Pipeline"
          value={formatCurrency(metrics.valorPipeline)}
          icon={<DollarSign className="w-6 h-6" />}
          tooltip="Soma do valor das negociações ativas (propostas aprovadas, enviadas ou em negociação). Exclui concluídas ou canceladas."
        />
        <MetricCard
          title="Margem Ponderada"
          value={formatPercent(metrics.margemPonderada)}
          icon={<Percent className="w-6 h-6" />}
          tooltip="Margem média ponderada pelo valor de cada negociação ativa. Fórmula: Σ(Margem × Valor) ÷ Valor Total do Pipeline."
        />
        <MetricCard
          title="Reuniões Realizadas (7d)"
          value={metrics.reunioesRealizadas7Dias}
          icon={<CalendarCheck className="w-6 h-6" />}
          tooltip="Total de reuniões efetivamente realizadas nos últimos 7 dias. Considera apenas reuniões com status 'Realizada'."
        />
        {/* Reuniões Agendadas agora é um card com drilldown */}
      </div>

      {/* Row 3 - Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MetricCard
          title="Tempo Médio Lead → Contato"
          value={`${metrics.tempoMedioConversao.toFixed(0)} dias`}
          icon={<Clock className="w-6 h-6" />}
          tooltip="Média de dias entre a criação do lead e sua conversão em contato. Mede eficiência do time na qualificação inicial."
        />
        <MetricCard
          title="Negociações Ativas"
          value={metrics.negociacoesAtivas.length}
          icon={<Handshake className="w-6 h-6" />}
          tooltip="Quantidade de negociações em andamento (propostas aprovadas, enviadas ou em negociação)."
        />
      </div>

      {/* Row 4 - Charts & Scheduled Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <StatusPieChart leads={metrics.contatosAtivos} />
        <ScheduledMeetingsCard contatos={metrics.contatosAtivos} />
        <PipelineChart negotiations={negotiations} />
      </div>

      {/* Row 5 - Alerts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ContactsWithoutActionAlert 
          contatosAlertaSla={metrics.contatosAlertaSla} 
          contatosSemAcaoLista={metrics.contatosSemAcaoLista} 
        />
        <div className="lg:col-span-2">
          <RecentLeads leads={leads} />
        </div>
      </div>

      {/* Row 6 - Activities */}
      <div className="grid grid-cols-1">
        <UpcomingActivities activities={upcomingActivities} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
