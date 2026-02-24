function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}

export function formatAdaptive(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs < 1) return formatNumber(value, 3);
  if (abs < 10) return formatNumber(value, 2);
  if (abs < 1000) return formatNumber(value, 1);
  return formatNumber(value, 2);
}

export function formatMass(kg: number): string {
  if (Math.abs(kg) >= 1000) return `${formatAdaptive(kg / 1000)} tonnes`;
  return `${formatAdaptive(kg)} kg`;
}

export function formatLiters(liters: number): string {
  return `${formatAdaptive(liters)} L`;
}
