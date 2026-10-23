import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string"

const PREFIX = "#card="

export function encodeCardHash(source: string): string {
  return PREFIX + compressToEncodedURIComponent(source)
}

export function decodeCardHash(hash: string): string | null {
  if (!hash.startsWith(PREFIX)) return null
  return decompressFromEncodedURIComponent(hash.slice(PREFIX.length)) || null
}

export function shareUrl(source: string): string {
  const { origin, pathname, search } = window.location
  return origin + pathname + search + encodeCardHash(source)
}
