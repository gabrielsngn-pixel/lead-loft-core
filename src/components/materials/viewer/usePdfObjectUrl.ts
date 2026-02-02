import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Material } from "@/types/materials";
import { parseStorageObjectUrl } from "./parseStorageObjectUrl";

interface UsePdfObjectUrlResult {
  url: string | null;
  loading: boolean;
  error: Error | null;
  isFromStorage: boolean;
}

/**
 * Workaround for Chrome iframe blocking (X-Frame-Options) when embedding
 * storage-hosted PDFs: we download as Blob and render via blob: URL.
 */
export function usePdfObjectUrl(
  material: Material | null,
  enabled: boolean
): UsePdfObjectUrlResult {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const storageRef = useMemo(() => {
    if (!material?.url) return null;
    return parseStorageObjectUrl(material.url);
  }, [material?.url]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    // Only applies to PDFs
    if (!enabled || !material || material.tipo !== "pdf" || !material.url) {
      setLoading(false);
      setError(null);
      setObjectUrl(null);
      return;
    }

    // For non-storage URLs, we just use the URL directly.
    if (!storageRef) {
      setLoading(false);
      setError(null);
      setObjectUrl(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    (async () => {
      try {
        const { data, error } = await supabase.storage
          .from(storageRef.bucket)
          .download(storageRef.path);

        if (error) throw error;
        if (!data) throw new Error("Arquivo não encontrado.");
        const next = URL.createObjectURL(data);
        if (!cancelled) setObjectUrl(next);
      } catch (e: any) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, material?.id, material?.tipo, material?.url, storageRef?.bucket, storageRef?.path]);

  return {
    url: storageRef ? objectUrl : material?.url ?? null,
    loading,
    error,
    isFromStorage: Boolean(storageRef),
  };
}
