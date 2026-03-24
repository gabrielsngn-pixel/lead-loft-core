import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingDown, AlertTriangle, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeletedContact {
  id: string;
  razao_social: string;
  nome_contato: string | null;
  justificativa: string;
  excluido_por_nome: string;
  created_at: string;
  tipo_empresa: string | null;
  cidade: string | null;
  estado: string | null;
  responsavel_nome: string | null;
}

interface DiscardedProspect {
  id: string;
  nome_completo: string;
  empresa: string;
  observacoes: string | null;
  atualizado_por_nome: string | null;
  updated_at: string;
}

interface LossCategory {
  motivo: string;
  quantidade: number;
  percentual: number;
}

export default function InteligenciaPerda() {
  const [deletedContacts, setDeletedContacts] = useState<DeletedContact[]>([]);
  const [discardedProspects, setDiscardedProspects] = useState<DiscardedProspect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [contactsRes, prospectsRes] = await Promise.all([
        supabase
          .from("deleted_contacts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("prospects")
          .select("*")
          .eq("status", "descartado")
          .order("updated_at", { ascending: false }),
      ]);

      if (contactsRes.data) setDeletedContacts(contactsRes.data);
      if (prospectsRes.data) setDiscardedProspects(prospectsRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Build loss categories from justificativas
  const allReasons = [
    ...deletedContacts.map((c) => c.justificativa?.trim() || "Sem justificativa"),
    ...discardedProspects.map((p) => p.observacoes?.trim() || "Sem justificativa"),
  ];

  const reasonCounts: Record<string, number> = {};
  allReasons.forEach((r) => {
    const key = r.length > 60 ? r.substring(0, 60) + "…" : r;
    reasonCounts[key] = (reasonCounts[key] || 0) + 1;
  });

  const total = allReasons.length;
  const categories: LossCategory[] = Object.entries(reasonCounts)
    .map(([motivo, quantidade]) => ({
      motivo,
      quantidade,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // Last 10 combined
  const recentLosses = [
    ...deletedContacts.slice(0, 10).map((c) => ({
      id: c.id,
      nome: c.nome_contato || c.razao_social,
      empresa: c.razao_social,
      motivo: c.justificativa,
      responsavel: c.excluido_por_nome,
      data: c.created_at,
      tipo: "Contato" as const,
    })),
    ...discardedProspects.slice(0, 10).map((p) => ({
      id: p.id,
      nome: p.nome_completo,
      empresa: p.empresa,
      motivo: p.observacoes || "Sem justificativa",
      responsavel: p.atualizado_por_nome || "—",
      data: p.updated_at,
      tipo: "Prospect" as const,
    })),
  ]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inteligência de Perda</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise consolidada de contatos e prospects excluídos ou perdidos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                  <p className="text-xs text-muted-foreground">Total de Perdas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{deletedContacts.length}</p>
                  <p className="text-xs text-muted-foreground">Contatos Excluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{discardedProspects.length}</p>
                  <p className="text-xs text-muted-foreground">Prospects Descartados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Motivos Distintos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loss by Reason */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivos de Perda</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
            ) : (
              <div className="space-y-3">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground truncate pr-2">{cat.motivo}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {cat.quantidade} ({cat.percentual}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive/70 rounded-full transition-all"
                          style={{ width: `${cat.percentual}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas 10 Perdas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLosses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  recentLosses.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{item.empresa}</TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === "Contato" ? "destructive" : "secondary"} className="text-xs">
                          {item.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {item.motivo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.responsavel}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
