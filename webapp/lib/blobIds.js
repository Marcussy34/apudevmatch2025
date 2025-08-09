const keyFor = (addr) => `WALRUS_BLOB_IDS:${addr.toLowerCase()}`;

export function addBlobRef(addr, ref) {
  try {
    const k = keyFor(addr);
    const arr = JSON.parse(sessionStorage.getItem(k) || "[]");
    const list = Array.isArray(arr)
      ? typeof arr[0] === "string"
        ? arr.map((s) => ({ blobId: s, idHex: "" }))
        : arr
      : [];
    const idx = list.findIndex((r) => r.blobId === ref.blobId);
    if (idx >= 0) list[idx] = ref;
    else list.push(ref);
    sessionStorage.setItem(k, JSON.stringify(list));
  } catch {}
}

export function getBlobRefs(addr) {
  try {
    const k = keyFor(addr);
    const arr = JSON.parse(sessionStorage.getItem(k) || "[]");
    if (!Array.isArray(arr)) return [];
    return typeof arr[0] === "string"
      ? arr.map((s) => ({ blobId: s, idHex: "" }))
      : arr;
  } catch {
    return [];
  }
}
