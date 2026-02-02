import { Material } from "@/types/materials";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Presentation,
  Video,
  Image,
  Link2,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const typeIcons = {
  pdf: FileText,
  ppt: Presentation,
  video: Video,
  imagem: Image,
  link: Link2,
  documento: FileSpreadsheet,
};

interface MaterialViewerDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: (material: Material) => void;
}

export function MaterialViewerDialog({
  material,
  open,
  onOpenChange,
  onDownload,
}: MaterialViewerDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  if (!material) return null;

  const TypeIcon = typeIcons[material.tipo];

  const handleDownload = async () => {
    if (!material.url || material.url === "#") {
      toast({
        title: "Download não disponível",
        description: "Este material não possui arquivo para download.",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);
    try {
      // Check if it's a Supabase storage URL
      if (material.url.includes("supabase") && material.url.includes("/storage/")) {
        // Extract the path from the URL
        const urlParts = material.url.split("/storage/v1/object/public/");
        if (urlParts.length > 1) {
          const pathWithBucket = urlParts[1];
          const [bucket, ...pathParts] = pathWithBucket.split("/");
          const filePath = pathParts.join("/");

          // Generate a signed URL for secure download
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600); // 1 hour expiry

          if (signedUrlError) {
            throw signedUrlError;
          }

          if (signedUrlData?.signedUrl) {
            // Open the signed URL for download
            const link = document.createElement("a");
            link.href = signedUrlData.signedUrl;
            link.download = material.arquivoNome || material.titulo;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
              title: "Download iniciado",
              description: `Baixando "${material.arquivoNome || material.titulo}"`,
            });
            return;
          }
        }
      }

      // For external URLs or non-Supabase storage, try to open/download directly
      const link = document.createElement("a");
      link.href = material.url;
      link.download = material.arquivoNome || material.titulo;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download iniciado",
        description: `Baixando "${material.arquivoNome || material.titulo}"`,
      });
    } catch (error: any) {
      console.error("Error downloading material:", error);
      toast({
        title: "Erro ao baixar",
        description: error.message || "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
      
      // Fallback: try to open the URL directly
      if (material.url) {
        window.open(material.url, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  };

  const renderContent = () => {
    // For videos (YouTube, Vimeo, etc.)
    if (material.tipo === "video" && material.url) {
      // Convert YouTube URL to embed format
      let embedUrl = material.url;
      if (material.url.includes("youtube.com/watch")) {
        const videoId = new URL(material.url).searchParams.get("v");
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (material.url.includes("youtu.be/")) {
        const videoId = material.url.split("youtu.be/")[1]?.split("?")[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (material.url.includes("vimeo.com/")) {
        const videoId = material.url.split("vimeo.com/")[1]?.split("?")[0];
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // For images
    if (material.tipo === "imagem" && material.url) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
          <img
            src={material.url}
            alt={material.titulo}
            className="max-w-full max-h-[60vh] object-contain rounded"
          />
        </div>
      );
    }

    // For PDFs
    if (material.tipo === "pdf" && material.url && material.url !== "#") {
      return (
        <div className="w-full h-[60vh] rounded-lg overflow-hidden">
          <iframe
            src={material.url}
            className="w-full h-full"
            title={material.titulo}
          />
        </div>
      );
    }

    // For links
    if (material.tipo === "link" && material.url) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-muted/30 rounded-lg">
          <Link2 className="w-16 h-16 text-primary mb-4" />
          <p className="text-center text-muted-foreground mb-4">
            Este material é um link externo
          </p>
          <Button onClick={() => window.open(material.url, "_blank")}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Link Externo
          </Button>
        </div>
      );
    }

    // Default fallback for files without preview
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-muted/30 rounded-lg">
        <TypeIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">{material.arquivoNome || material.titulo}</p>
        <p className="text-center text-muted-foreground mb-4">
          Visualização não disponível para este tipo de arquivo
        </p>
        <div className="flex gap-2">
          {material.url && material.url !== "#" && (
            <Button onClick={() => window.open(material.url, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em Nova Aba
            </Button>
          )}
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Baixar Arquivo
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <TypeIcon className="w-5 h-5 text-primary" />
              {material.titulo}
            </DialogTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {material.tags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {material.descricao}
          </p>
          {renderContent()}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Versão {material.versao} • Atualizado por {material.atualizadoPor}
          </div>
          <div className="flex gap-2">
            {material.tipo !== "link" && material.tipo !== "video" && (
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Baixar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
