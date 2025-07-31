export function calculatePriceCap(actualPrice: number): number {
  if (Math.random() < 0.001) return 1000000;
  let multiplier = 1;
  if (Math.random() < 0.5) {
    // mult range 1 - 1.5
    multiplier = 1 + Math.random() * 0.5;
  } else {
    // mult range 1.5 - 3
    multiplier = 1.5 + Math.random() * 1.5;
  }
  const rawCap = actualPrice * multiplier;

  if (rawCap < 50) return Math.ceil(rawCap / 5) * 5;
  if (rawCap < 200) return Math.ceil(rawCap / 10) * 10;
  if (rawCap < 1000) return Math.ceil(rawCap / 25) * 25;
  if (rawCap < 5000) return Math.ceil(rawCap / 100) * 100;
  return Math.ceil(rawCap / 500) * 500;
}
