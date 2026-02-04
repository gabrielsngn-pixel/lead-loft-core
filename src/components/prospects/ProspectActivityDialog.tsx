import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar, 
  FileText,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Prospect, 
  ProspectActivity, 
  ProspectActivityType,
  PROSPECT_ACTIVITY_TYPE_CONFIG,
} from "@/types/prospects";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProspectActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
  onAddActivity: (
    prospectId: string,
    tipo: ProspectActivityType,
    titulo: string,
    descricao?: string
  ) => Promise<ProspectActivity>;
  getActivities: (prospectId: string) => Promise<ProspectActivity[]>;
}

const ActivityIcon = ({ tipo }: { tipo: ProspectActivityType }) => {
  switch (tipo) {
    case "ligacao":
      return <Phone className="w-4 h-4" />;
    case "email":
      return <Mail className="w-4 h-4" />;
    case "whatsapp":
      return <MessageCircle className="w-4 h-4" />;
    case "reuniao":
      return <Calendar className="w-4 h-4" />;
    case "upload_ata":
      return <FileText className="w-4 h-4" />;
  }
};

export function ProspectActivityDialog({
  open,
  onOpenChange,
  prospect,
  onAddActivity,
  getActivities,
}: ProspectActivityDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [tipo, setTipo] = useState<ProspectActivityType>("ligacao");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ProspectActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (open && prospect) {
      setActiveTab("new");
      setTipo("ligacao");
      setTitulo("");
      setDescricao("");
      loadActivities();
    }
  }, [open, prospect]);

  const loadActivities = async () => {
    if (!prospect) return;
    setLoadingActivities(true);
    try {
      const data = await getActivities(prospect.id);
      setActivities(data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospect || !titulo.trim()) return;

    setLoading(true);
    try {
      await onAddActivity(prospect.id, tipo, titulo.trim(), descricao.trim() || undefined);
      toast({
        title: "Atividade registrada",
        description: "A atividade foi registrada com sucesso",
      });
      setTitulo("");
      setDescricao("");
      loadActivities();
      setActiveTab("history");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar atividade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atividades - {prospect?.nomeCompleto}</DialogTitle>
          <DialogDescription>
            Registre atividades realizadas com este prospect
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "new" | "history")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Nova Atividade</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Atividade</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as ProspectActivityType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROSPECT_ACTIVITY_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Primeira ligação de contato"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes da atividade..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !titulo.trim()}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar Atividade
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loadingActivities ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma atividade registrada
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded bg-primary/10">
                          <ActivityIcon tipo={activity.tipo} />
                        </div>
                        <span className="font-medium text-sm">{activity.titulo}</span>
                      </div>
                      {activity.descricao && (
                        <p className="text-sm text-muted-foreground ml-8 mb-2">
                          {activity.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-4 ml-8 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(activity.dataAtividade, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        <span>{activity.responsavelNome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
