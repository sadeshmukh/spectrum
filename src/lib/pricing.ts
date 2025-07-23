export function calculatePriceCap(actualPrice: number): number {
  const multiplier = 1 + Math.random() * 2;
  const rawCap = actualPrice * multiplier;

  if (rawCap < 50) return Math.ceil(rawCap / 5) * 5;
  if (rawCap < 200) return Math.ceil(rawCap / 10) * 10;
  if (rawCap < 1000) return Math.ceil(rawCap / 25) * 25;
  if (rawCap < 5000) return Math.ceil(rawCap / 100) * 100;
  return Math.ceil(rawCap / 500) * 500;
}
