export interface SharedListPayload {
  name: string;
  recipes: { filename: string; batches: number }[];
}

export function encodeSharedList(payload: SharedListPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeSharedList(encoded: string): SharedListPayload {
  return JSON.parse(
    decodeURIComponent(escape(atob(encoded))),
  ) as SharedListPayload;
}
