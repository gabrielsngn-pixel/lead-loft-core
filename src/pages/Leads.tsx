import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportImportButtons } from "@/components/shared/ExportImportButtons";
import { mockLeads } from "@/data/mockData";
import { Lead, LeadStatus, Priority, CompanyType } from "@/types/crm";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  Building2,
  Landmark,
  PiggyBank,
  Share2,
  HelpCircle,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  novo: { label: "Novo", className: "badge-new" },
  qualificado: { label: "Qualificado", className: "badge-qualified" },
  proposta: { label: "Proposta", className: "badge-proposal" },
  ganho: { label: "Ganho", className: "badge-won" },
  perdido: { label: "Perdido", className: "badge-lost" },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-destructive/10 text-destructive" },
  media: { label: "Média", className: "bg-warning/30 text-warning-foreground" },
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

const companyTypeConfig: Record<CompanyType, { label: string; icon: typeof Building2 }> = {
  incorporadora: { label: "Incorporadora", icon: Building2 },
  banco: { label: "Banco", icon: Landmark },
  fundo: { label: "Fundo", icon: PiggyBank },
  canal: { label: "Canal", icon: Share2 },
  outro: { label: "Outro", icon: HelpCircle },
};

const origemLabels = {
  site: "Site",
  indicacao: "Indicação",
  evento: "Evento",
  parceiro: "Parceiro",
  outbound: "Outbound",
  outro: "Outro",
};

const exportColumns = [
  { key: "cnpj", label: "CNPJ", required: true },
  { key: "razaoSocial", label: "Razão Social", required: true },
  { key: "nomeFantasia", label: "Nome Fantasia" },
  { key: "nomeContato", label: "Nome Contato" },
  { key: "email", label: "Email", required: true },
  { key: "telefone", label: "Telefone", required: true },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado" },
  { key: "origem", label: "Origem" },
  { key: "status", label: "Status" },
  { key: "prioridade", label: "Prioridade" },
  { key: "tipoEmpresa", label: "Tipo Empresa" },
  { key: "valorEstimado", label: "Valor Estimado" },
];

const Leads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesTipo = tipoFilter === "all" || lead.tipoEmpresa === tipoFilter;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleImport = (data: any[]) => {
    // Check for duplicates by CNPJ
    const existingCNPJs = new Set(leads.map(l => l.cnpj.replace(/[^\d]/g, "")));
    const newLeads = data.filter(row => {
      const cnpj = row.cnpj?.replace(/[^\d]/g, "");
      return cnpj && !existingCNPJs.has(cnpj);
    });

    if (newLeads.length < data.length) {
      toast({
        title: "Alguns leads foram ignorados",
        description: `${data.length - newLeads.length} leads duplicados (mesmo CNPJ) não foram importados.`,
        variant: "destructive",
      });
    }

    // Add new leads with generated IDs
    const leadsToAdd: Lead[] = newLeads.map((row, index) => ({
      id: `imported-${Date.now()}-${index}`,
      cnpj: row.cnpj || "",
      razaoSocial: row.razaoSocial || "",
      nomeFantasia: row.nomeFantasia,
      nomeContato: row.nomeContato,
      email: row.email || "",
      telefone: row.telefone || "",
      cidade: row.cidade || "",
      estado: row.estado || "",
      origem: row.origem || "outro",
      status: row.status || "novo",
      prioridade: row.prioridade || "media",
      tipoEmpresa: row.tipoEmpresa || "outro",
      valorEstimado: row.valorEstimado ? Number(row.valorEstimado) : undefined,
      dataCriacao: new Date(),
      dataUltimaInteracao: new Date(),
    }));

    setLeads(prev => [...prev, ...leadsToAdd]);
  };

  return (
    <AppLayout title="Repositório de Leads" subtitle="Gerencie todos os leads da sua base">
      {/* Filters Bar */}
      <div className="stat-card mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <ExportImportButtons
                moduleName="leads"
                data={filteredLeads}
                columns={exportColumns}
                onImport={handleImport}
                templateFields={exportColumns}
              />
              <Button onClick={() => navigate("/leads/novo")}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(companyTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="ml-auto">
              {filteredLeads.length} leads
            </Badge>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="stat-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">CNPJ</TableHead>
              <TableHead className="font-semibold">Contato</TableHead>
              <TableHead className="font-semibold">Origem</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Prioridade</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold text-right">Valor Est.</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead, index) => {
              const TypeIcon = companyTypeConfig[lead.tipoEmpresa].icon;
              return (
                <TableRow
                  key={lead.id}
                  className="table-row-hover animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/10">
                        <TypeIcon className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {lead.nomeFantasia || lead.razaoSocial}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.cidade}/{lead.estado}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {companyTypeConfig[lead.tipoEmpresa].label}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{lead.cnpj}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{lead.nomeContato || lead.email}</p>
                      <p className="text-muted-foreground">{lead.telefone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {origemLabels[lead.origem]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("badge-status", statusConfig[lead.status].className)}>
                      {statusConfig[lead.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("badge-status", priorityConfig[lead.prioridade].className)}>
                      {priorityConfig[lead.prioridade].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.responsavelNome || (
                      <span className="text-muted-foreground text-sm">Não atribuído</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(lead.valorEstimado)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar Viabilidade">
                        <Send className="w-4 h-4 text-primary" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Apropriar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum lead encontrado
            </p>
            <p className="text-sm text-muted-foreground/70">
              Tente ajustar seus filtros de busca
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Leads;
