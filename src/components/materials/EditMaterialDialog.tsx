import { useState, useEffect } from "react";
import { MaterialCategory, MaterialType, MaterialAudience } from "@/types/materials";
import { DbMaterial, useMaterials } from "@/hooks/useMaterials";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Edit, Loader2 } from "lucide-react";

interface EditMaterialDialogProps {
  material: DbMaterial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const categoryLabels: Record<MaterialCategory, string> = {
  treinamento: "Treinamentos",
  prospeccao: "Marketing e Trade",
  institucional: "Institucional",
};

const typeLabels: Record<MaterialType, string> = {
  pdf: "PDF",
  ppt: "Apresentação (PPT/PPTX)",
  video: "Vídeo (Link)",
  imagem: "Imagem",
  link: "Link Externo",
  documento: "Documento (DOC/XLSX)",
};

const audienceLabels: Record<MaterialAudience, string> = {
  sdr: "SDR",
  consultor: "Consultor",
  gestor: "Gestor",
  todos: "Todos",
};

export function EditMaterialDialog({
  material,
  open,
  onOpenChange,
  onSuccess,
}: EditMaterialDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<MaterialCategory>("treinamento");
  const [tipo, setTipo] = useState<MaterialType>("pdf");
  const [publicoAlvo, setPublicoAlvo] = useState<MaterialAudience>("todos");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [recomendado, setRecomendado] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { updateMaterial } = useMaterials();

  // Load material data when dialog opens
  useEffect(() => {
    if (material) {
      setTitulo(material.titulo);
      setDescricao(material.descricao || "");
      setCategoria(material.categoria as MaterialCategory);
      setTipo(material.tipo as MaterialType);
      setPublicoAlvo(material.publico_alvo as MaterialAudience);
      setUrl(material.url || "");
      setTags((material.tags || []).join(", "));
      setRecomendado(material.recomendado);
    }
  }, [material]);

  const isLinkType = tipo === "link" || tipo === "video";

  const handleSubmit = async () => {
    if (!material) return;
    
    if (!titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (isLinkType && !url.trim()) {
      toast({
        title: "Erro",
        description: "A URL é obrigatória para este tipo de material.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateMaterial(material.id, {
        titulo,
        descricao: descricao || undefined,
        categoria,
        tipo,
        publico_alvo: publicoAlvo,
        url: url || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        recomendado,
      });

      toast({
        title: "Material atualizado",
        description: `"${titulo}" foi atualizado com sucesso.`,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating material:", error);
      toast({
        title: "Erro ao atualizar material",
        description: error.message || "Ocorreu um erro ao salvar o material.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Editar Material
          </DialogTitle>
          <DialogDescription>
            Edite as informações do material.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Nome do material"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Breve descrição do material..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Category and Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as MaterialCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as MaterialType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Select value={publicoAlvo} onValueChange={(v) => setPublicoAlvo(v as MaterialAudience)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(audienceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL for link types */}
          {isLinkType && (
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              placeholder="onboarding, processo, novo colaborador"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Recommended */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recomendado"
              checked={recomendado}
              onCheckedChange={(checked) => setRecomendado(checked as boolean)}
            />
            <Label htmlFor="recomendado" className="text-sm font-normal">
              Destacar como material recomendado
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="btn-cta" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
