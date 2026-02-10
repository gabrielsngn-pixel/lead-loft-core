import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserPlus, Trash2, ExternalLink, Search, Users, UserCheck } from "lucide-react";
import { format } from "date-fns";
import type { Empreendimento, EmpreendimentoDecisor } from "@/types/empreendimentos";
import { ManualDecisorSearchDialog } from "./ManualDecisorSearchDialog";
import { AssignEmpreendimentoDialog } from "./AssignEmpreendimentoDialog";
import {
  statusEmpreendimentoLabels,
  statusEmpreendimentoColors,
  tipoEmpreendimentoLabels,
  type EmpreendimentoStatus,
  type TipoEmpreendimento,
} from "@/types/empreendimentos";

interface EmpreendimentoDetailDialogProps {
  empreendimento: Empreendimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisores: EmpreendimentoDecisor[];
  isLoadingDecisores: boolean;
  onUpdate: (data: Partial<Empreendimento> & { id: string }) => void;
  onDelete: (id: string) => void;
  onAddDecisor: (decisor: Partial<EmpreendimentoDecisor>) => void;
  onRemoveDecisor: (id: string) => void;
  onFindDecisores: (construtora: string) => Promise<{ prospects: any[]; leads: any[] }>;
  canEdit: boolean;
  canDelete: boolean;
}

export function EmpreendimentoDetailDialog({
  empreendimento,
  open,
  onOpenChange,
  decisores,
  isLoadingDecisores,
  onUpdate,
  onDelete,
  onAddDecisor,
  onRemoveDecisor,
  onFindDecisores,
  canEdit,
  canDelete,
}: EmpreendimentoDetailDialogProps) {
  const [status, setStatus] = useState<EmpreendimentoStatus>("mapeado");
  const [searchResults, setSearchResults] = useState<{ prospects: any[]; leads: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [manualSearchOpen, setManualSearchOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const emp = empreendimento;

  useEffect(() => {
    if (emp) setStatus(emp.status as EmpreendimentoStatus);
  }, [emp]);

  const formatCurrency = (val: number | null) =>
    val ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}` : "—";

  const bestDecisorStatus = decisores.length > 0
    ? decisores.reduce((best, d) => {
        const order = ["nao_contatado", "contato_iniciado", "reuniao_agendada", "reuniao_realizada", "em_negociacao"];
        return order.indexOf(d.status_relacionamento) > order.indexOf(best) ? d.status_relacionamento : best;
      }, "nao_contatado")
    : null;

  const statusRelLabels: Record<string, string> = {
    nao_contatado: "Não Contatado",
    contato_iniciado: "Contato Iniciado",
    reuniao_agendada: "Reunião Agendada",
    reuniao_realizada: "Reunião Realizada",
    em_negociacao: "Em Negociação",
  };

  if (!emp) return null;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as EmpreendimentoStatus);
    onUpdate({ id: emp.id, status: newStatus as EmpreendimentoStatus } as any);
  };

  const handleSearchDecisores = async () => {
    setIsSearching(true);
    const results = await onFindDecisores(emp.construtora);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAutoLink = async () => {
    if (!searchResults) return;
    const linked: string[] = [];

    for (const p of searchResults.prospects) {
      const already = decisores.some((d) => d.prospect_id === p.id);
      if (!already) {
        await onAddDecisor({
          empreendimento_id: emp.id,
          prospect_id: p.id,
          nome: p.nome_completo,
          cargo: p.cargo,
          empresa: p.empresa,
          tipo_vinculo: "prospect",
          origem: p.origem,
          email: p.email,
          telefone: p.telefone,
          linkedin: p.linkedin_url,
          consultor_responsavel_id: p.consultor_responsavel_id,
          consultor_responsavel_nome: p.consultor_responsavel_nome,
        });
        linked.push(p.nome_completo);
      }
    }

    for (const l of searchResults.leads) {
      const already = decisores.some((d) => d.lead_id === l.id);
      if (!already) {
        await onAddDecisor({
          empreendimento_id: emp.id,
          lead_id: l.id,
          nome: l.nome_contato || l.razao_social,
          cargo: null,
          empresa: l.razao_social,
          tipo_vinculo: "contato_ativo",
          email: l.email,
          telefone: l.telefone,
          linkedin: l.linkedin,
          consultor_responsavel_id: l.responsavel_id,
          consultor_responsavel_nome: l.responsavel_nome,
        });
        linked.push(l.nome_contato || l.razao_social);
      }
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
         <DialogTitle className="flex items-center gap-3">
            {emp.nome_empreendimento}
            <Badge className={statusEmpreendimentoColors[emp.status as EmpreendimentoStatus]}>
              {statusEmpreendimentoLabels[emp.status as EmpreendimentoStatus]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {emp.construtora} — {emp.cidade}/{emp.estado}
            {emp.consultor_responsavel_nome && (
              <span className="ml-2 text-xs">
                • Consultor: <strong>{emp.consultor_responsavel_nome}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
            <TabsTrigger value="decisores" className="flex-1">
              Decisores ({decisores.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {canEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusEmpreendimentoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{tipoEmpreendimentoLabels[emp.tipo_empreendimento as TipoEmpreendimento] || emp.tipo_empreendimento}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Habite-se:</span>
                <p className="font-medium">{emp.data_habitese ? format(new Date(emp.data_habitese), "MM/yyyy") : "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Unidades:</span>
                <p className="font-medium">{emp.unidades_estimadas || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ticket médio:</span>
                <p className="font-medium">{formatCurrency(emp.ticket_medio)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">VGV estimado:</span>
                <p className="font-medium">{formatCurrency(emp.vgv_estimado)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Banco:</span>
                <p className="font-medium">{emp.banco_financiador || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modelo repasse:</span>
                <p className="font-medium">{emp.modelo_repasse || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fonte:</span>
                <p className="font-medium capitalize">{emp.fonte_importacao}</p>
              </div>
            </div>

            {emp.observacoes && (
              <div>
                <span className="text-sm text-muted-foreground">Observações:</span>
                <p className="text-sm mt-1">{emp.observacoes}</p>
              </div>
            )}

            {canDelete && (
              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm" onClick={() => { onDelete(emp.id); onOpenChange(false); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir Empreendimento
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decisores" className="space-y-4">
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleSearchDecisores} disabled={isSearching}>
                  {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Buscar por construtora
                </Button>
                <Button size="sm" variant="outline" onClick={() => setManualSearchOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Buscar decisor manualmente
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAssignOpen(true)}
                  disabled={decisores.length === 0}
                  title={decisores.length === 0 ? "Vincule ao menos um decisor antes de atribuir" : ""}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Atribuir a consultor
                </Button>
              </div>
            )}

            {searchResults && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">
                    Resultados: {searchResults.prospects.length} prospects, {searchResults.leads.length} contatos ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {searchResults.prospects.length === 0 && searchResults.leads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum decisor identificado automaticamente para este empreendimento.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.prospects.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <div>
                            <span className="font-medium">{p.nome_completo}</span>
                            <span className="text-muted-foreground ml-2">{p.cargo} — {p.empresa}</span>
                            <Badge variant="outline" className="ml-2 text-xs">Prospect</Badge>
                          </div>
                        </div>
                      ))}
                      {searchResults.leads.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <div>
                            <span className="font-medium">{l.nome_contato || l.razao_social}</span>
                            <span className="text-muted-foreground ml-2">{l.razao_social}</span>
                            <Badge variant="outline" className="ml-2 text-xs">Contato Ativo</Badge>
                          </div>
                        </div>
                      ))}
                      <Button size="sm" onClick={handleAutoLink} className="mt-2">
                        <UserPlus className="w-4 h-4 mr-2" /> Vincular todos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isLoadingDecisores ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : decisores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum decisor vinculado.</p>
                <p className="text-xs">Use "Buscar decisores por empresa" para encontrar automaticamente.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decisores.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{d.nome}</p>
                          <p className="text-xs text-muted-foreground">{d.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{d.cargo || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {d.tipo_vinculo === "contato_ativo" ? "Contato Ativo" : "Prospect"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {statusRelLabels[d.status_relacionamento] || d.status_relacionamento}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => onRemoveDecisor(d.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ManualDecisorSearchDialog
        open={manualSearchOpen}
        onOpenChange={setManualSearchOpen}
        empreendimentoId={emp.id}
        existingDecisores={decisores}
        onAddDecisor={onAddDecisor}
      />

      <AssignEmpreendimentoDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        empreendimento={emp}
        onUpdate={onUpdate}
      />
    </Dialog>
  );
}
