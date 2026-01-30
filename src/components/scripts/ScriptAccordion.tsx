import { useState } from "react";
import {
  MessageCircle,
  Users,
  HelpCircle,
  Target,
  Lightbulb,
  CheckCircle,
  Copy,
  Check,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScriptSection, ScriptContent } from "@/types/scripts";
import { cn } from "@/lib/utils";

interface ScriptAccordionProps {
  sections: ScriptSection[];
  onQuestionToggle?: (sectionId: string, questionIndex: number, answered: boolean) => void;
  answeredQuestions?: Record<string, number[]>;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Users,
  HelpCircle,
  Target,
  Lightbulb,
  CheckCircle,
};

export function ScriptAccordion({
  sections,
  onQuestionToggle,
  answeredQuestions = {},
}: ScriptAccordionProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const renderContent = (
    content: ScriptContent,
    sectionId: string,
    index: number
  ) => {
    const isAnswered = answeredQuestions[sectionId]?.includes(index);

    switch (content.type) {
      case "text":
        return (
          <div className="relative group">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {content.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy(content.content, `${sectionId}-${index}`)}
            >
              {copiedItem === `${sectionId}-${index}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );

      case "highlight":
        return (
          <div className="relative group">
            <Card className="bg-primary/10 border-primary/20 p-3">
              <div className="flex items-start gap-2">
                <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium text-primary">
                  {content.content}
                </p>
              </div>
            </Card>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy(content.content, `${sectionId}-${index}`)}
            >
              {copiedItem === `${sectionId}-${index}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );

      case "bullets":
        return (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {content.content}
            </p>
            <ul className="space-y-1.5 ml-4">
              {content.subItems?.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-foreground/80 flex items-start gap-2 group/item"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="flex-1">{item}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => handleCopy(item, `${sectionId}-${index}-${i}`)}
                  >
                    {copiedItem === `${sectionId}-${index}-${i}` ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        );

      case "question":
        return (
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors group",
              isAnswered
                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                : "bg-muted/50 border-border hover:bg-muted"
            )}
          >
            <Checkbox
              checked={isAnswered}
              onCheckedChange={(checked) =>
                onQuestionToggle?.(sectionId, index, checked as boolean)
              }
              className="mt-0.5"
            />
            <p
              className={cn(
                "text-sm flex-1",
                isAnswered && "line-through text-muted-foreground"
              )}
            >
              {content.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={() => handleCopy(content.content, `${sectionId}-${index}`)}
            >
              {copiedItem === `${sectionId}-${index}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );

      case "stat":
        return (
          <div className="relative group">
            <Card className="bg-accent/50 border-accent p-3">
              <p className="text-sm font-mono text-foreground/90 text-center">
                {content.content}
              </p>
            </Card>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleCopy(content.content, `${sectionId}-${index}`)}
            >
              {copiedItem === `${sectionId}-${index}` ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Accordion type="multiple" className="space-y-3">
      {sections.map((section, sectionIndex) => {
        const Icon = iconMap[section.icon] || MessageCircle;
        const questionCount = section.content.filter(
          (c) => c.type === "question"
        ).length;
        const answeredCount =
          answeredQuestions[section.id]?.length || 0;

        return (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {sectionIndex + 1}. {section.title}
                    </span>
                    {questionCount > 0 && (
                      <Badge
                        variant={
                          answeredCount === questionCount
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {answeredCount}/{questionCount}
                      </Badge>
                    )}
                  </div>
                  {section.keyPhrases && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {section.keyPhrases[0]}
                    </p>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4 pt-2">
                {/* Key Phrases */}
                {section.keyPhrases && section.keyPhrases.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-3 border-b border-border">
                    {section.keyPhrases.map((phrase, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() =>
                          handleCopy(phrase, `${section.id}-phrase-${i}`)
                        }
                      >
                        {copiedItem === `${section.id}-phrase-${i}` ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="space-y-4">
                  {section.content.map((content, index) => (
                    <div key={index}>
                      {renderContent(content, section.id, index)}
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
