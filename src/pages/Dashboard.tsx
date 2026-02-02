import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { ActivitiesByConsultorChart } from "@/components/dashboard/ActivitiesByConsultorChart";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { InactiveLeadsAlert } from "@/components/dashboard/InactiveLeadsAlert";
import { useLeads } from "@/hooks/useLeads";
import { useNegotiations } from "@/hooks/useNegotiations";
import { mockActivities, mockUsers } from "@/data/mockData";
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  TrendingUp,
  UserCheck,
  Calendar,
  Loader2,
} from "lucide-react";

const Dashboard = () => {
  const { leads, loading: leadsLoading } = useLeads();
  const { negotiations, loading: negotiationsLoading } = useNegotiations();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Calculate real stats from data
  const repositorioLeads = leads.filter(l => !l.responsavelId).length;
  const activeContacts = leads.filter(lead => lead.responsavelId);
  const leadsNovos = leads.filter(l => l.status === "novo").length;
  const negociacoesAtivas = negotiations.length;
  const valorPipeline = negotiations.reduce((sum, n) => sum + n.valor, 0);
  const receitaPotencial = negotiations.reduce((sum, n) => sum + (n.valor * n.probabilidade / 100), 0);
  
  // Calculate conversion rate (ganho / total that have been through the process)
  const leadsGanhos = leads.filter(l => l.status === "ganho").length;
  const leadsProcessados = leads.filter(l => l.status === "ganho" || l.status === "perdido").length;
  const taxaConversao = leadsProcessados > 0 ? (leadsGanhos / leadsProcessados) * 100 : 0;

  // Count meetings in next 7 days (still from mock for now - activities not yet persisted)
  const today = new Date();
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const reunioesProximos7Dias = mockActivities.filter(a => 
    a.tipo === "reuniao" && 
    !a.concluida && 
    a.dataAgendada >= today && 
    a.dataAgendada <= next7Days
  ).length;

  const isLoading = leadsLoading || negotiationsLoading;

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
      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Repositório de Leads"
          value={repositorioLeads}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Contatos Ativos"
          value={activeContacts.length}
          icon={<UserCheck className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Negociações Ativas"
          value={negociacoesAtivas}
          icon={<Handshake className="w-6 h-6" />}
        />
        <StatCard
          title="Receita Potencial"
          value={formatCurrency(receitaPotencial)}
          icon={<DollarSign className="w-6 h-6" />}
          variant="secondary"
        />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Leads Novos"
          value={leadsNovos}
          icon={<UserPlus className="w-6 h-6" />}
        />
        <StatCard
          title="Valor Pipeline"
          value={formatCurrency(valorPipeline)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Taxa Conversão"
          value={`${taxaConversao.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Reuniões Próx. 7 dias"
          value={reunioesProximos7Dias}
          icon={<Calendar className="w-6 h-6" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatusPieChart leads={activeContacts} />
        <ActivitiesByConsultorChart activities={mockActivities} users={mockUsers} />
        <UpcomingMeetings activities={mockActivities} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Pipeline */}
        <div className="lg:col-span-2">
          <PipelineChart negotiations={negotiations} />
        </div>

        {/* Right Column - Inactive Leads Alert */}
        <div>
          <InactiveLeadsAlert leads={activeContacts} daysThreshold={7} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads leads={leads} />
        <UpcomingActivities activities={mockActivities} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
