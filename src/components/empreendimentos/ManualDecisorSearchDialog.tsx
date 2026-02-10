import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { EmpreendimentoDecisor } from "@/types/empreendimentos";

interface ManualDecisorSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimentoId: string;
  existingDecisores: EmpreendimentoDecisor[];
  onAddDecisor: (decisor: Partial<EmpreendimentoDecisor>) => void;
}

interface SearchResult {
  id: string;
  nome: string;
  cargo: string | null;
  empresa: string;
  email: string | null;
  telefone: string | null;
  linkedin: string | null;
  tipo: "prospect" | "contato_ativo";
  consultor_responsavel_id: string | null;
  consultor_responsavel_nome: string | null;
  origem?: string | null;
}

export function ManualDecisorSearchDialog({
  open,
  onOpenChange,
  empreendimentoId,
  existingDecisores,
  onAddDecisor,
}: ManualDecisorSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [linked, setLinked] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) return;
    setIsSearching(true);
    setLinked(new Set());

    const term = `%${searchTerm.trim()}%`;

    const [prospectsRes, leadsRes] = await Promise.all([
      supabase
        .from("prospects")
        .select("id, nome_completo, cargo, empresa, email, telefone, linkedin_url, consultor_responsavel_id, consultor_responsavel_nome, origem")
        .or(`nome_completo.ilike.${term},email.ilike.${term},empresa.ilike.${term}`)
        .limit(20),
      supabase
        .from("leads")
        .select("id, nome_contato, razao_social, email, telefone, linkedin, responsavel_id, responsavel_nome")
        .not("responsavel_id", "is", null)
        .or(`nome_contato.ilike.${term},email.ilike.${term},razao_social.ilike.${term}`)
        .limit(20),
    ]);

    const mapped: SearchResult[] = [
      ...(prospectsRes.data || []).map((p) => ({
        id: p.id,
        nome: p.nome_completo,
        cargo: p.cargo,
        empresa: p.empresa,
        email: p.email,
        telefone: p.telefone,
        linkedin: p.linkedin_url,
        tipo: "prospect" as const,
        consultor_responsavel_id: p.consultor_responsavel_id,
        consultor_responsavel_nome: p.consultor_responsavel_nome,
        origem: p.origem,
      })),
      ...(leadsRes.data || []).map((l) => ({
        id: l.id,
        nome: l.nome_contato || l.razao_social,
        cargo: null,
        empresa: l.razao_social,
        email: l.email,
        telefone: l.telefone,
        linkedin: l.linkedin,
        tipo: "contato_ativo" as const,
        consultor_responsavel_id: l.responsavel_id,
        consultor_responsavel_nome: l.responsavel_nome,
      })),
    ];

    setResults(mapped);
    setIsSearching(false);
  };

  const isAlreadyLinked = (result: SearchResult) => {
    if (result.tipo === "prospect") {
      return existingDecisores.some((d) => d.prospect_id === result.id);
    }
    return existingDecisores.some((d) => d.lead_id === result.id);
  };

  const handleLink = (result: SearchResult) => {
    onAddDecisor({
      empreendimento_id: empreendimentoId,
      prospect_id: result.tipo === "prospect" ? result.id : undefined,
      lead_id: result.tipo === "contato_ativo" ? result.id : undefined,
      nome: result.nome,
      cargo: result.cargo,
      empresa: result.empresa,
      tipo_vinculo: result.tipo,
      origem: result.origem || undefined,
      email: result.email,
      telefone: result.telefone,
      linkedin: result.linkedin,
      consultor_responsavel_id: result.consultor_responsavel_id,
      consultor_responsavel_nome: result.consultor_responsavel_nome,
    });
    setLinked((prev) => new Set(prev).add(result.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buscar Decisor</DialogTitle>
          <DialogDescription>
            Busque por nome, e-mail ou empresa nos Prospects e Contatos Ativos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Nome, e-mail ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching || searchTerm.trim().length < 2}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <div className="space-y-2 mt-2">
          {results.length === 0 && !isSearching && searchTerm && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum resultado encontrado.
            </p>
          )}
          {results.map((r) => {
            const already = isAlreadyLinked(r) || linked.has(r.id);
            return (
              <div
                key={`${r.tipo}-${r.id}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{r.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.cargo && `${r.cargo} — `}{r.empresa}
                  </p>
                  {r.email && <p className="text-xs text-muted-foreground truncate">{r.email}</p>}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {r.tipo === "prospect" ? "Prospect" : "Contato Ativo"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={already ? "secondary" : "default"}
                    disabled={already}
                    onClick={() => handleLink(r)}
                  >
                    {already ? "Vinculado" : <><UserPlus className="w-3 h-3 mr-1" /> Vincular</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
