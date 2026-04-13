export function formatHourlyRateRange(
  priceMin: number | null,
  priceMax: number | null,
): string | null {
  if (priceMin !== null && priceMax !== null) return `${priceMin} – ${priceMax} €/h`;
  if (priceMin !== null) return `À partir de ${priceMin} €/h`;
  if (priceMax !== null) return `Jusqu'à ${priceMax} €/h`;
  return null;
}
