const keyFor = (addr: string) => `WALRUS_BLOB_IDS:${addr.toLowerCase()}`;

export type BlobRef = { blobId: string; idHex: string };

export function addBlobId(addr: string, blobId: string) {
  try {
    const k = keyFor(addr);
    const arr: BlobRef[] | string[] = JSON.parse(
      sessionStorage.getItem(k) || "[]"
    );
    // Back-compat: if array of strings, convert
    const list: BlobRef[] = Array.isArray(arr)
      ? typeof (arr as any)[0] === "string"
        ? (arr as string[]).map((s) => ({ blobId: s, idHex: "" }))
        : (arr as BlobRef[])
      : [];
    if (!list.find((r) => r.blobId === blobId))
      list.push({ blobId, idHex: "" });
    sessionStorage.setItem(k, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function getBlobIds(addr: string): string[] {
  try {
    const k = keyFor(addr);
    const arr: BlobRef[] | string[] = JSON.parse(
      sessionStorage.getItem(k) || "[]"
    );
    if (!Array.isArray(arr)) return [];
    return (arr as any[]).map((x) =>
      typeof x === "string" ? x : (x as BlobRef).blobId
    );
  } catch {
    return [];
  }
}

export function clearBlobIds(addr: string) {
  try {
    sessionStorage.removeItem(keyFor(addr));
  } catch {
    // ignore
  }
}

export function addBlobRef(addr: string, ref: BlobRef) {
  try {
    const k = keyFor(addr);
    const arr: BlobRef[] | string[] = JSON.parse(
      sessionStorage.getItem(k) || "[]"
    );
    const list: BlobRef[] = Array.isArray(arr)
      ? typeof (arr as any)[0] === "string"
        ? (arr as string[]).map((s) => ({ blobId: s, idHex: "" }))
        : (arr as BlobRef[])
      : [];
    const idx = list.findIndex((r) => r.blobId === ref.blobId);
    if (idx >= 0) list[idx] = ref;
    else list.push(ref);
    sessionStorage.setItem(k, JSON.stringify(list));
  } catch {}
}

export function getBlobRefs(addr: string): BlobRef[] {
  try {
    const k = keyFor(addr);
    const arr: BlobRef[] | string[] = JSON.parse(
      sessionStorage.getItem(k) || "[]"
    );
    if (!Array.isArray(arr)) return [];
    return typeof (arr as any)[0] === "string"
      ? (arr as string[]).map((s) => ({ blobId: s, idHex: "" }))
      : (arr as BlobRef[]);
  } catch {
    return [];
  }
}
