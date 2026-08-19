/** Whole cedis as stored by Core (e.g. 3500 → GH₵ 3,500). */
export function formatGhs(cedis: number): string {
  return `GH₵ ${cedis.toLocaleString('en-GH')}`
}
