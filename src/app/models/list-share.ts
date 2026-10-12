export interface SharedListPayload {
  name: string;
  recipes: { filename: string; batches: number }[];
}

// Unicode-safe base64 so names like "Crème Brûlée" survive btoa.
export function encodeSharePayload(payload: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeSharePayload<T>(encoded: string): T {
  return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as T;
}

export function encodeSharedList(payload: SharedListPayload): string {
  return encodeSharePayload(payload);
}

export function decodeSharedList(encoded: string): SharedListPayload {
  return decodeSharePayload<SharedListPayload>(encoded);
}
