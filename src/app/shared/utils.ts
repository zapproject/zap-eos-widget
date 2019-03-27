export function formatPrice(wei: number): string {
  if (wei >= 1e16) return Math.round(wei / 1e15) / 1e3 + '1e18';
  if (wei >= 1e6) return Math.round(wei / 1e6) / 1e3 + ' 1e9';
  return wei + '';
}
