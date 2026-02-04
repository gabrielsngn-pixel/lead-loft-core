import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useProspectMetrics } from "@/hooks/useProspectMetrics";
import { 
  UserSearch, 
  UserCheck, 
  TrendingUp, 
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ProspectMetricsSection() {
  const { 
    importadosUltimos7Dias, 
    convertidosUltimos7Dias, 
    taxaConversao, 
    semAtividade7Dias,
    loading,
  } = useProspectMetrics();

  if (loading) {
    return (
      <Card className="stat-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserSearch className="w-5 h-5" />
            Prospecção Ativa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserSearch className="w-5 h-5" />
          Prospecção Ativa
        </h2>
        <Link to="/prospects">
          <Button variant="outline" size="sm">Ver Prospects</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prospects Importados (7d)"
          value={importadosUltimos7Dias}
          icon={<UserSearch className="w-6 h-6" />}
          tooltip="Prospects importados nos últimos 7 dias via CSV"
        />
        <MetricCard
          title="Prospects Convertidos (7d)"
          value={convertidosUltimos7Dias}
          icon={<UserCheck className="w-6 h-6" />}
          variant="primary"
          tooltip="Prospects convertidos em Contato Ativo nos últimos 7 dias"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${taxaConversao.toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="secondary"
          tooltip="Percentual de prospects convertidos em relação ao total"
        />
        <MetricCard
          title="Sem Atividade (7d)"
          value={semAtividade7Dias}
          icon={<AlertCircle className="w-6 h-6" />}
          variant={semAtividade7Dias > 0 ? "primary" : "secondary"}
          tooltip="Prospects ativos sem atividade há mais de 7 dias"
        />
      </div>
    </div>
  );
}
