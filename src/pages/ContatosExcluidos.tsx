import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Search, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeletedContact {
  id: string;
  lead_id: string;
  razao_social: string;
  nome_fantasia: string | null;
  nome_contato: string | null;
  email: string | null;
  telefone: string | null;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  tipo_empresa: string | null;
  responsavel_nome: string | null;
  justificativa: string;
  excluido_por_nome: string;
  created_at: string;
}

const ContatosExcluidos = () => {
  const [records, setRecords] = useState<DeletedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      const { data } = await supabase
        .from("deleted_contacts")
        .select("*")
        .order("created_at", { ascending: false });
      setRecords((data as DeletedContact[]) || []);
      setLoading(false);
    };
    fetchRecords();
  }, []);

  const filtered = records.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.razao_social.toLowerCase().includes(term) ||
      r.nome_fantasia?.toLowerCase().includes(term) ||
      r.nome_contato?.toLowerCase().includes(term) ||
      r.excluido_por_nome.toLowerCase().includes(term) ||
      r.justificativa.toLowerCase().includes(term)
    );
  });

  return (
    <AppLayout title="Contatos Excluídos" subtitle="Repositório de contatos ativos removidos">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="gap-1">
          <Shield className="w-3 h-3" />
          Master
        </Badge>
        <Badge variant="secondary">{records.length} exclusões registradas</Badge>
      </div>

      <div className="stat-card mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, contato, responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Data Exclusão</TableHead>
                <TableHead className="font-semibold">Empresa</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">Consultor</TableHead>
                <TableHead className="font-semibold">Excluído por</TableHead>
                <TableHead className="font-semibold">Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{record.nome_fantasia || record.razao_social}</div>
                    {record.cnpj && <div className="text-xs text-muted-foreground font-mono">{record.cnpj}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{record.nome_contato || "—"}</TableCell>
                  <TableCell className="text-sm">{record.responsavel_nome || "—"}</TableCell>
                  <TableCell className="text-sm">{record.excluido_por_nome}</TableCell>
                  <TableCell className="text-sm max-w-[300px]">
                    <p className="truncate" title={record.justificativa}>{record.justificativa}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ContatosExcluidos;
