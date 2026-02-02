import { useState } from "react";
import { MaterialCategory, MaterialType, MaterialAudience } from "@/types/materials";
import { useMaterials } from "@/hooks/useMaterials";
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
import { Upload, Link2, FileUp, Loader2 } from "lucide-react";

interface UploadMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: MaterialCategory;
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

export function UploadMaterialDialog({
  open,
  onOpenChange,
  defaultCategory = "treinamento",
  onSuccess,
}: UploadMaterialDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<MaterialCategory>(defaultCategory);
  const [tipo, setTipo] = useState<MaterialType>("pdf");
  const [publicoAlvo, setPublicoAlvo] = useState<MaterialAudience>("todos");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [recomendado, setRecomendado] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { createMaterial } = useMaterials();

  const isLinkType = tipo === "link" || tipo === "video";

  const handleSubmit = async () => {
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

    // For now, allow creating without file (URL-based materials)
    // File upload to storage can be added later

    setSaving(true);
    try {
      const result = await createMaterial({
        titulo,
        descricao: descricao || undefined,
        categoria,
        tipo,
        publico_alvo: publicoAlvo,
        url: url || undefined,
        arquivo_nome: file?.name,
        arquivo_tamanho: file?.size,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        recomendado,
      });

      if (result) {
        // Reset form
        setTitulo("");
        setDescricao("");
        setUrl("");
        setTags("");
        setRecomendado(false);
        setFile(null);
        onSuccess?.();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-detect type from extension
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") setTipo("pdf");
      else if (ext === "ppt" || ext === "pptx") setTipo("ppt");
      else if (ext === "doc" || ext === "docx" || ext === "xlsx" || ext === "xls") setTipo("documento");
      else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) setTipo("imagem");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Adicionar Material
          </DialogTitle>
          <DialogDescription>
            Adicione um novo material à biblioteca.
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

          {/* File Upload or URL */}
          {isLinkType ? (
            <div className="space-y-2">
              <Label htmlFor="url" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                URL *
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Arquivo *
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p>Clique para selecionar ou arraste um arquivo</p>
                      <p className="text-xs mt-1">PDF, PPT, DOC, XLSX, Imagens (máx. 20MB)</p>
                    </div>
                  )}
                </label>
              </div>
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
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {saving ? "Salvando..." : "Adicionar Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
