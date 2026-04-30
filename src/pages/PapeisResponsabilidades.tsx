import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  usePlaybookRoles,
  PlaybookRole,
  PlaybookStage,
  PlaybookCard,
  PlaybookIndicator,
  PlaybookRisk,
  PlaybookSimpleItem,
} from "@/hooks/usePlaybookRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Target,
  Activity,
  AlertTriangle,
  XCircle,
  Sparkles,
  Quote,
  Pencil,
  Copy,
  CheckCircle2,
  Layers as LayersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function PapeisResponsabilidades() {
  const { isGestor } = useAuth();
  const { data: roles, isLoading, updateRole } = usePlaybookRoles();
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [draft, setDraft] = useState<PlaybookRole | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = isGestor;

  useEffect(() => {
    if (!roles || roles.length === 0) return;
    if (!selectedKey) {
      setSelectedKey(roles[0].role_key);
    }
  }, [roles, selectedKey]);

  const current = useMemo(
    () => roles?.find((r) => r.role_key === selectedKey) ?? null,
    [roles, selectedKey]
  );

  useEffect(() => {
    setDraft(current ? structuredClone(current) : null);
    setEditing(false);
  }, [current]);

  const dirty = useMemo(() => {
    if (!draft || !current) return false;
    return JSON.stringify(draft) !== JSON.stringify(current);
  }, [draft, current]);

  const update = <K extends keyof PlaybookRole>(key: K, value: PlaybookRole[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await updateRole.mutateAsync({
        id: draft.id,
        role_label: draft.role_label,
        subtitle: draft.subtitle,
        mission: draft.mission,
        mission_highlight: draft.mission_highlight,
        stages: draft.stages,
        indicators: draft.indicators,
        risks: draft.risks,
        mistakes: draft.mistakes,
        behaviors: draft.behaviors,
        guiding_quote: draft.guiding_quote,
      });
      toast({ title: "Salvo", description: "Alterações publicadas para o time." });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(current ? structuredClone(current) : null);
    setEditing(false);
  };

  if (isLoading || !draft) {
    return (
      <AppLayout>
        <div className="p-8 text-muted-foreground">Carregando playbook…</div>
      </AppLayout>
    );
  }

  // ----- Stages helpers -----
  const setStages = (stages: PlaybookStage[]) => update("stages", stages);

  const addStage = () => {
    setStages([
      ...draft.stages,
      { id: uid(), title: "Nova etapa", cards: [] },
    ]);
  };
  const removeStage = (id: string) =>
    setStages(draft.stages.filter((s) => s.id !== id));
  const renameStage = (id: string, title: string) =>
    setStages(draft.stages.map((s) => (s.id === id ? { ...s, title } : s)));
  const moveStage = (idx: number, dir: -1 | 1) =>
    setStages(move(draft.stages, idx, idx + dir));

  const addCard = (stageId: string) =>
    setStages(
      draft.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              cards: [
                ...s.cards,
                {
                  id: uid(),
                  title: "Novo card",
                  responsibilities: ["Nova responsabilidade"],
                  indicators: "",
                  notes: "",
                },
              ],
            }
          : s
      )
    );

  const updateCard = (stageId: string, cardId: string, patch: Partial<PlaybookCard>) =>
    setStages(
      draft.stages.map((s) =>
        s.id === stageId
          ? {
              ...s,
              cards: s.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
            }
          : s
      )
    );

  const removeCard = (stageId: string, cardId: string) =>
    setStages(
      draft.stages.map((s) =>
        s.id === stageId ? { ...s, cards: s.cards.filter((c) => c.id !== cardId) } : s
      )
    );

  const duplicateCard = (stageId: string, cardId: string) =>
    setStages(
      draft.stages.map((s) => {
        if (s.id !== stageId) return s;
        const idx = s.cards.findIndex((c) => c.id === cardId);
        if (idx === -1) return s;
        const copy = { ...s.cards[idx], id: uid(), title: s.cards[idx].title + " (cópia)" };
        const cards = [...s.cards];
        cards.splice(idx + 1, 0, copy);
        return { ...s, cards };
      })
    );

  const moveCard = (stageId: string, idx: number, dir: -1 | 1) =>
    setStages(
      draft.stages.map((s) =>
        s.id === stageId ? { ...s, cards: move(s.cards, idx, idx + dir) } : s
      )
    );

  return (
    <AppLayout>
      <div className="space-y-8 pb-16">
        {/* HEADER FIXO */}
        <div className="sticky top-0 z-30 -mx-6 px-6 py-4 bg-background/85 backdrop-blur border-b">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <LayersIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-display font-bold leading-tight">
                  Papéis & Responsabilidades
                </h1>
                {editing ? (
                  <Input
                    value={draft.subtitle ?? ""}
                    onChange={(e) => update("subtitle", e.target.value)}
                    className="h-7 mt-1 text-sm"
                    placeholder="Subtítulo do guia"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground truncate">
                    {draft.subtitle || "Guia operacional vivo"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.role_key} value={r.role_key}>
                      {r.role_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canEdit && !editing && (
                <Button variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
              )}
              {canEdit && editing && (
                <>
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!dirty || saving} className="gap-1.5">
                    <Save className="w-4 h-4" /> {saving ? "Salvando…" : "Salvar"}
                  </Button>
                </>
              )}
            </div>
          </div>
          {!canEdit && (
            <p className="text-xs text-muted-foreground mt-2">
              Visualização apenas. Apenas Gestores e Master podem editar.
            </p>
          )}
        </div>

        {/* MISSÃO */}
        <SectionMission draft={draft} editing={editing} onChange={update} />

        {/* RESPONSABILIDADES POR ETAPA */}
        <section className="space-y-4">
          <SectionHeader
            icon={<Target className="w-5 h-5" />}
            title="Responsabilidades por etapa"
            description="Cards editáveis organizados pelo funil comercial"
            action={
              editing && (
                <Button size="sm" variant="outline" onClick={addStage} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Nova etapa
                </Button>
              )
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {draft.stages.map((stage, sIdx) => (
              <div
                key={stage.id}
                className="rounded-xl border bg-card/40 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    Etapa {sIdx + 1}
                  </Badge>
                  {editing ? (
                    <Input
                      value={stage.title}
                      onChange={(e) => renameStage(stage.id, e.target.value)}
                      className="h-8 font-semibold"
                    />
                  ) : (
                    <h3 className="font-semibold flex-1">{stage.title}</h3>
                  )}
                  {editing && (
                    <div className="flex items-center gap-0.5">
                      <IconBtn onClick={() => moveStage(sIdx, -1)} title="Mover para cima">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn onClick={() => moveStage(sIdx, 1)} title="Mover para baixo">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        onClick={() => removeStage(stage.id)}
                        title="Excluir etapa"
                        danger
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {stage.cards.length === 0 && !editing && (
                    <p className="text-xs text-muted-foreground italic">Sem cards.</p>
                  )}
                  {stage.cards.map((card, cIdx) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      editing={editing}
                      onChange={(patch) => updateCard(stage.id, card.id, patch)}
                      onRemove={() => removeCard(stage.id, card.id)}
                      onDuplicate={() => duplicateCard(stage.id, card.id)}
                      onMoveUp={() => moveCard(stage.id, cIdx, -1)}
                      onMoveDown={() => moveCard(stage.id, cIdx, 1)}
                    />
                  ))}
                </div>

                {editing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addCard(stage.id)}
                    className="gap-1.5 self-start text-primary"
                  >
                    <Plus className="w-4 h-4" /> Novo card
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* INDICADORES */}
        <SectionIndicators
          items={draft.indicators}
          editing={editing}
          onChange={(v) => update("indicators", v)}
        />

        {/* RISCOS */}
        <SectionRisks
          items={draft.risks}
          editing={editing}
          onChange={(v) => update("risks", v)}
        />

        {/* ERROS A EVITAR */}
        <SectionSimpleList
          icon={<XCircle className="w-5 h-5 text-destructive" />}
          title="Erros a evitar"
          description="Lista limpa de comportamentos a não repetir"
          items={draft.mistakes}
          editing={editing}
          variant="mistake"
          onChange={(v) => update("mistakes", v)}
        />

        {/* COMPORTAMENTOS ESPERADOS */}
        <SectionSimpleList
          icon={<Sparkles className="w-5 h-5 text-primary" />}
          title="Comportamentos esperados"
          description="Checklist do padrão de excelência"
          items={draft.behaviors}
          editing={editing}
          variant="behavior"
          onChange={(v) => update("behaviors", v)}
        />

        {/* FRASE GUIA */}
        <section>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardContent className="p-8 md:p-10 flex gap-5">
              <Quote className="w-10 h-10 text-primary/70 shrink-0" />
              {editing ? (
                <Textarea
                  value={draft.guiding_quote ?? ""}
                  onChange={(e) => update("guiding_quote", e.target.value)}
                  placeholder="Escreva a frase guia do cargo…"
                  className="text-2xl md:text-3xl font-display font-semibold leading-snug min-h-[120px] border-0 bg-transparent focus-visible:ring-0 p-0 resize-none"
                />
              ) : (
                <p className="text-2xl md:text-3xl font-display font-semibold leading-snug">
                  {draft.guiding_quote || (
                    <span className="text-muted-foreground italic text-base font-normal">
                      Sem frase guia definida.
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {draft.updated_by_nome && (
          <p className="text-xs text-muted-foreground text-right">
            Última atualização por {draft.updated_by_nome} em{" "}
            {new Date(draft.updated_at).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </AppLayout>
  );
}

/* -------------------- Subcomponentes -------------------- */

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-foreground/80">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        danger && "hover:text-destructive hover:bg-destructive/10"
      )}
    >
      {children}
    </button>
  );
}

function SectionMission({
  draft,
  editing,
  onChange,
}: {
  draft: PlaybookRole;
  editing: boolean;
  onChange: <K extends keyof PlaybookRole>(k: K, v: PlaybookRole[K]) => void;
}) {
  const highlight = draft.mission_highlight ?? "default";
  const styles: Record<string, string> = {
    default: "from-muted/40 via-background to-background border-border",
    primary: "from-primary/15 via-background to-background border-primary/30",
    success: "from-emerald-500/10 via-background to-background border-emerald-500/30",
    warning: "from-amber-500/10 via-background to-background border-amber-500/30",
  };
  return (
    <Card className={cn("bg-gradient-to-br border", styles[highlight] || styles.default)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
              Missão do cargo
            </Badge>
            {editing ? (
              <Input
                value={draft.role_label}
                onChange={(e) => onChange("role_label", e.target.value)}
                className="h-8 w-[260px] font-display font-semibold"
              />
            ) : (
              <CardTitle className="text-xl font-display">{draft.role_label}</CardTitle>
            )}
          </div>
          {editing && (
            <Select
              value={highlight}
              onValueChange={(v) => onChange("mission_highlight", v)}
            >
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Neutro</SelectItem>
                <SelectItem value="primary">Destaque Loft</SelectItem>
                <SelectItem value="success">Verde</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Textarea
            value={draft.mission ?? ""}
            onChange={(e) => onChange("mission", e.target.value)}
            placeholder="Descreva a missão do cargo…"
            className="min-h-[100px] text-base"
          />
        ) : (
          <p className="text-base md:text-lg leading-relaxed">
            {draft.mission || (
              <span className="text-muted-foreground italic">Sem missão definida.</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CardItem({
  card,
  editing,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  card: PlaybookCard;
  editing: boolean;
  onChange: (patch: Partial<PlaybookCard>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const updateResp = (idx: number, value: string) => {
    const r = [...card.responsibilities];
    r[idx] = value;
    onChange({ responsibilities: r });
  };
  const addResp = () =>
    onChange({ responsibilities: [...card.responsibilities, "Nova responsabilidade"] });
  const removeResp = (idx: number) =>
    onChange({ responsibilities: card.responsibilities.filter((_, i) => i !== idx) });

  return (
    <div className="rounded-lg border bg-background p-3 space-y-2">
      <div className="flex items-start gap-2">
        {editing ? (
          <Input
            value={card.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-8 font-medium"
          />
        ) : (
          <h4 className="font-medium flex-1">{card.title}</h4>
        )}
        {editing && (
          <div className="flex items-center gap-0.5">
            <IconBtn onClick={onMoveUp} title="Subir">
              <ArrowUp className="w-3.5 h-3.5" />
            </IconBtn>
            <IconBtn onClick={onMoveDown} title="Descer">
              <ArrowDown className="w-3.5 h-3.5" />
            </IconBtn>
            <IconBtn onClick={onDuplicate} title="Duplicar">
              <Copy className="w-3.5 h-3.5" />
            </IconBtn>
            <IconBtn onClick={onRemove} title="Excluir" danger>
              <Trash2 className="w-3.5 h-3.5" />
            </IconBtn>
          </div>
        )}
      </div>

      <ul className="space-y-1.5 text-sm">
        {card.responsibilities.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
            {editing ? (
              <div className="flex-1 flex gap-1">
                <Input
                  value={r}
                  onChange={(e) => updateResp(i, e.target.value)}
                  className="h-7 text-sm"
                />
                <IconBtn onClick={() => removeResp(i)} title="Remover" danger>
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
              </div>
            ) : (
              <span>{r}</span>
            )}
          </li>
        ))}
      </ul>
      {editing && (
        <Button size="sm" variant="ghost" onClick={addResp} className="h-7 gap-1 text-xs">
          <Plus className="w-3 h-3" /> Adicionar responsabilidade
        </Button>
      )}

      <Separator className="my-2" />

      <div className="grid grid-cols-1 gap-2 text-xs">
        <Field label="Indicadores" editing={editing}>
          {editing ? (
            <Input
              value={card.indicators ?? ""}
              onChange={(e) => onChange({ indicators: e.target.value })}
              className="h-7 text-xs"
              placeholder="Ex: Taxa de qualificação > 40%"
            />
          ) : (
            <span className="text-muted-foreground">{card.indicators || "—"}</span>
          )}
        </Field>
        <Field label="Observações / regras críticas" editing={editing}>
          {editing ? (
            <Textarea
              value={card.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value })}
              className="text-xs min-h-[48px]"
              placeholder="Regras críticas, exceções, alertas…"
            />
          ) : (
            <span className="text-muted-foreground">{card.notes || "—"}</span>
          )}
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  editing,
}: {
  label: string;
  children: React.ReactNode;
  editing: boolean;
}) {
  return (
    <div className="space-y-1">
      <span
        className={cn(
          "uppercase tracking-wider text-[10px] font-medium",
          editing ? "text-foreground/70" : "text-muted-foreground/70"
        )}
      >
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function SectionIndicators({
  items,
  editing,
  onChange,
}: {
  items: PlaybookIndicator[];
  editing: boolean;
  onChange: (v: PlaybookIndicator[]) => void;
}) {
  const update = (id: string, patch: Partial<PlaybookIndicator>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Activity className="w-5 h-5" />}
        title="Indicadores associados"
        description="Métricas que o cargo deve acompanhar"
        action={
          editing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange([
                  ...items,
                  { id: uid(), name: "Novo indicador", formula: "", goal: "", frequency: "" },
                ])
              }
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo indicador
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground italic">Sem indicadores cadastrados.</p>
        )}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border bg-card/40 p-4 space-y-2">
            <div className="flex items-start gap-2">
              {editing ? (
                <Input
                  value={it.name}
                  onChange={(e) => update(it.id, { name: e.target.value })}
                  className="h-8 font-semibold"
                />
              ) : (
                <h4 className="font-semibold flex-1">{it.name}</h4>
              )}
              {editing && (
                <IconBtn
                  onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                  title="Excluir"
                  danger
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <SmallField label="Fórmula" value={it.formula ?? ""} editing={editing}
                onChange={(v) => update(it.id, { formula: v })} />
              <SmallField label="Meta" value={it.goal ?? ""} editing={editing}
                onChange={(v) => update(it.id, { goal: v })} />
              <SmallField label="Frequência" value={it.frequency ?? ""} editing={editing}
                onChange={(v) => update(it.id, { frequency: v })} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SmallField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <span className="uppercase tracking-wider text-[10px] text-muted-foreground/70">
        {label}
      </span>
      {editing ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-7 text-xs" />
      ) : (
        <p className="text-xs">{value || "—"}</p>
      )}
    </div>
  );
}

function SectionRisks({
  items,
  editing,
  onChange,
}: {
  items: PlaybookRisk[];
  editing: boolean;
  onChange: (v: PlaybookRisk[]) => void;
}) {
  const update = (id: string, patch: Partial<PlaybookRisk>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        title="Indicadores de risco"
        description="Sinais de alerta operacionais e ações recomendadas"
        action={
          editing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange([
                  ...items,
                  { id: uid(), name: "Novo risco", condition: "", impact: "", action: "" },
                ])
              }
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo risco
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground italic">Sem riscos cadastrados.</p>
        )}
        {items.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border-l-4 border-l-amber-500 border bg-card/40 p-4 space-y-2"
          >
            <div className="flex items-start gap-2">
              {editing ? (
                <Input
                  value={r.name}
                  onChange={(e) => update(r.id, { name: e.target.value })}
                  className="h-8 font-semibold"
                />
              ) : (
                <h4 className="font-semibold flex-1">{r.name}</h4>
              )}
              {editing && (
                <IconBtn
                  onClick={() => onChange(items.filter((x) => x.id !== r.id))}
                  title="Excluir"
                  danger
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
              )}
            </div>
            <div className="space-y-2 text-xs">
              <SmallTextarea label="Condição" value={r.condition ?? ""} editing={editing}
                onChange={(v) => update(r.id, { condition: v })} />
              <SmallTextarea label="Impacto" value={r.impact ?? ""} editing={editing}
                onChange={(v) => update(r.id, { impact: v })} />
              <SmallTextarea label="Ação recomendada" value={r.action ?? ""} editing={editing}
                onChange={(v) => update(r.id, { action: v })} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SmallTextarea({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <span className="uppercase tracking-wider text-[10px] text-muted-foreground/70">
        {label}
      </span>
      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs min-h-[40px]"
        />
      ) : (
        <p className="text-xs text-muted-foreground">{value || "—"}</p>
      )}
    </div>
  );
}

function SectionSimpleList({
  icon,
  title,
  description,
  items,
  editing,
  onChange,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  items: PlaybookSimpleItem[];
  editing: boolean;
  onChange: (v: PlaybookSimpleItem[]) => void;
  variant: "mistake" | "behavior";
}) {
  const update = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  return (
    <section className="space-y-4">
      <SectionHeader
        icon={icon}
        title={title}
        description={description}
        action={
          editing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange([...items, { id: uid(), text: "Novo item" }])}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          )
        }
      />
      <ul className="space-y-2 max-w-3xl">
        {items.length === 0 && !editing && (
          <p className="text-sm text-muted-foreground italic">Sem itens cadastrados.</p>
        )}
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              "flex items-start gap-3 rounded-md px-3 py-2",
              variant === "mistake" ? "bg-destructive/5" : "bg-primary/5"
            )}
          >
            {variant === "mistake" ? (
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            )}
            {editing ? (
              <Input
                value={it.text}
                onChange={(e) => update(it.id, e.target.value)}
                className="h-7 text-sm flex-1"
              />
            ) : (
              <span className="text-sm flex-1">{it.text}</span>
            )}
            {editing && (
              <IconBtn
                onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                title="Remover"
                danger
              >
                <Trash2 className="w-3.5 h-3.5" />
              </IconBtn>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
