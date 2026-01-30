import { useState } from "react";
import { 
  BookOpen, 
  Play, 
  RotateCcw, 
  History, 
  Building2,
  MessageSquareText
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScriptAccordion } from "@/components/scripts/ScriptAccordion";
import { UseScriptDialog } from "@/components/scripts/UseScriptDialog";
import { ScriptToPdfButton } from "@/components/scripts/ScriptToPdfButton";
import { scriptSections } from "@/types/scripts";
import { toast } from "@/hooks/use-toast";

export default function Script() {
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, number[]>>({});
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [usageHistory, setUsageHistory] = useState<Array<{
    date: Date;
    lead?: string;
    questionsAnswered: number;
  }>>([
    { date: new Date(2026, 0, 28), lead: "Construtora ABC", questionsAnswered: 6 },
    { date: new Date(2026, 0, 27), lead: "Incorporadora XYZ", questionsAnswered: 8 },
    { date: new Date(2026, 0, 25), lead: "Grupo Imobiliário Delta", questionsAnswered: 5 },
  ]);

  const handleQuestionToggle = (sectionId: string, questionIndex: number, answered: boolean) => {
    setAnsweredQuestions((prev) => {
      const current = prev[sectionId] || [];
      if (answered) {
        return { ...prev, [sectionId]: [...current, questionIndex] };
      }
      return { ...prev, [sectionId]: current.filter((i) => i !== questionIndex) };
    });
  };

  const handleReset = () => {
    setAnsweredQuestions({});
    toast({
      title: "Script reiniciado",
      description: "Todas as marcações foram removidas.",
    });
  };

  const handleUseScript = (data: {
    leadId?: string;
    reuniaoId?: string;
    notas: string;
  }) => {
    const totalAnswered = Object.values(answeredQuestions).reduce(
      (acc, arr) => acc + arr.length,
      0
    );
    
    setUsageHistory((prev) => [
      { 
        date: new Date(), 
        lead: data.leadId ? "Contato vinculado" : undefined, 
        questionsAnswered: totalAnswered 
      },
      ...prev
    ]);
    
    // Reset after use
    setAnsweredQuestions({});
  };

  const totalQuestions = scriptSections.reduce(
    (acc, section) => acc + section.content.filter((c) => c.type === "question").length,
    0
  );

  const totalAnswered = Object.values(answeredQuestions).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <MessageSquareText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Script de Atendimento
              </h1>
              <p className="text-muted-foreground">
                Roteiro comercial baseado na proposta de valor Loft
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ScriptToPdfButton />
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </Button>
            <Button 
              onClick={() => setUseDialogOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4" />
              Usar na Reunião
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Script Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Progress Card */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Progresso da Sessão</p>
                      <p className="text-xs text-muted-foreground">
                        Marque as perguntas conforme responder
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {totalAnswered}/{totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground">perguntas</p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Script Accordion */}
            <ScriptAccordion
              sections={scriptSections}
              onQuestionToggle={handleQuestionToggle}
              answeredQuestions={answeredQuestions}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Tips */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Dicas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">1</span>
                    <p className="text-muted-foreground">Clique nas frases-chave para copiar</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">2</span>
                    <p className="text-muted-foreground">Marque perguntas respondidas</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">3</span>
                    <p className="text-muted-foreground">Use o botão "Usar na Reunião" para vincular ao CRM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Histórico de Uso
                </CardTitle>
                <CardDescription>
                  Últimas sessões do script
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageHistory.slice(0, 5).map((usage, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{usage.lead || "Uso livre"}</p>
                        <p className="text-xs text-muted-foreground">
                          {usage.date.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {usage.questionsAnswered} perguntas
                      </Badge>
                    </div>
                  ))}
                  
                  {usageHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum uso registrado ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="text-center space-y-1">
                  <p className="text-3xl font-bold text-primary">{usageHistory.length}</p>
                  <p className="text-sm text-muted-foreground">sessões este mês</p>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">
                      {Math.round(usageHistory.reduce((acc, u) => acc + u.questionsAnswered, 0) / (usageHistory.length || 1))}
                    </p>
                    <p className="text-xs text-muted-foreground">média perguntas</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {usageHistory.filter(u => u.lead).length}
                    </p>
                    <p className="text-xs text-muted-foreground">vinculados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UseScriptDialog
        open={useDialogOpen}
        onOpenChange={setUseDialogOpen}
        answeredQuestions={answeredQuestions}
        onConfirm={handleUseScript}
      />
    </AppLayout>
  );
}
