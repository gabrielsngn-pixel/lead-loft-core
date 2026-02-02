export interface StorageObjectRef {
  bucket: string;
  path: string;
}

/**
 * Parses Supabase Storage public/signed object URLs.
 * Supports:
 *  - /storage/v1/object/public/{bucket}/{path}
 *  - /storage/v1/object/sign/{bucket}/{path}?token=...
 */
export function parseStorageObjectUrl(url: string): StorageObjectRef | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/storage/v1/object/");
    if (parts.length < 2) return null;

    const rest = parts[1]; // e.g. public/materials/a/b.pdf OR sign/materials/a/b.pdf
    const segs = rest.split("/").filter(Boolean);
    if (segs.length < 3) return null;

    const mode = segs[0];
    if (mode !== "public" && mode !== "sign") return null;

    const bucket = segs[1];
    const path = segs.slice(2).join("/");
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}
