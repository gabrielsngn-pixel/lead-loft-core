import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { ActivitiesByConsultorChart } from "@/components/dashboard/ActivitiesByConsultorChart";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { InactiveLeadsAlert } from "@/components/dashboard/InactiveLeadsAlert";
import {
  mockLeads,
  mockActivities,
  mockNegotiations,
  mockDashboardStats,
  mockUsers,
} from "@/data/mockData";
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  TrendingUp,
  CalendarCheck,
  UserCheck,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Get active contacts (leads with responsible person)
  const activeContacts = mockLeads.filter(lead => lead.responsavelId);

  return (
    <AppLayout title="Dashboard Executivo" subtitle="Visão gerencial do CRM">
      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total de Leads"
          value={mockDashboardStats.totalLeads}
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Contatos Ativos"
          value={mockDashboardStats.contatosAtivos}
          icon={<UserCheck className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Negociações Ativas"
          value={mockDashboardStats.negociacoesAtivas}
          icon={<Handshake className="w-6 h-6" />}
        />
        <StatCard
          title="Receita Potencial"
          value={formatCurrency(mockDashboardStats.receitaPotencial)}
          icon={<DollarSign className="w-6 h-6" />}
          variant="secondary"
        />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Leads Novos"
          value={mockDashboardStats.leadsNovos}
          icon={<UserPlus className="w-6 h-6" />}
        />
        <StatCard
          title="Valor Pipeline"
          value={formatCurrency(mockDashboardStats.valorPipeline)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="Taxa Conversão"
          value={`${mockDashboardStats.taxaConversao}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 3.2, isPositive: true }}
        />
        <StatCard
          title="Reuniões Próx. 7 dias"
          value={mockDashboardStats.reunioesProximos7Dias}
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
          <PipelineChart negotiations={mockNegotiations} />
        </div>

        {/* Right Column - Inactive Leads Alert */}
        <div>
          <InactiveLeadsAlert leads={mockLeads} daysThreshold={7} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLeads leads={mockLeads} />
        <UpcomingActivities activities={mockActivities} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
