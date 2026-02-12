import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AiInsightBlockProps {
  text: string;
  onUpdate: (newText: string) => void;
  onDelete: () => void;
}

export function AiInsightBlock({ text, onUpdate, onDelete }: AiInsightBlockProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  if (!text) return null;

  return (
    <Card className="mt-3 bg-muted/30 border-0 group relative">
      <CardContent className="py-3">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setDraft(text); setEditing(false); }}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-[#115644] hover:bg-[#115644]/90"
                onClick={() => { onUpdate(draft); setEditing(false); }}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className="text-sm leading-relaxed text-foreground/80 italic flex-1">
              {text}
            </p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => { setDraft(text); setEditing(true); }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
