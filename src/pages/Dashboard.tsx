import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { UpcomingActivities } from "@/components/dashboard/UpcomingActivities";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import {
  mockLeads,
  mockActivities,
  mockNegotiations,
  mockDashboardStats,
} from "@/data/mockData";
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  TrendingUp,
  CalendarCheck,
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

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu CRM">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Total de Leads"
          value={mockDashboardStats.totalLeads}
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Leads Novos"
          value={mockDashboardStats.leadsNovos}
          icon={<UserPlus className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Negociações Ativas"
          value={mockDashboardStats.negociacoesAtivas}
          icon={<Handshake className="w-6 h-6" />}
        />
        <StatCard
          title="Valor Pipeline"
          value={formatCurrency(mockDashboardStats.valorPipeline)}
          icon={<DollarSign className="w-6 h-6" />}
          variant="secondary"
        />
        <StatCard
          title="Taxa Conversão"
          value={`${mockDashboardStats.taxaConversao}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 3.2, isPositive: true }}
        />
        <StatCard
          title="Atividades Hoje"
          value={mockDashboardStats.atividadesHoje}
          icon={<CalendarCheck className="w-6 h-6" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Leads */}
        <div className="lg:col-span-2">
          <RecentLeads leads={mockLeads} />
        </div>

        {/* Right Column - Pipeline Chart */}
        <div>
          <PipelineChart negotiations={mockNegotiations} />
        </div>
      </div>

      {/* Bottom Section - Upcoming Activities */}
      <div className="mt-6">
        <UpcomingActivities activities={mockActivities} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;