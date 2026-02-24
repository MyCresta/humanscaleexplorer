import type { CategoryModel, Gender, LocationId } from "../model";

export const scienceModelDoc = {
  version: "1.0",
  summary: "Core math and conversion rules used by Human Comparator.",
  formulas: {
    annualEstimate:
      "annual = annualBase * ageFactor(age) * genderFactor(gender) * locationFactor(location)",
    lifetimeEstimate: "lifetime = annual * age",
    litersFromMass: "liters = massKg / kgPerLiter",
    massFromLiters: "massKg = liters * kgPerLiter",
    visualVolumeFromMass: "visualLiters = massKg / bulkKgPerLiter",
    geometricItemVolume:
      "itemVolumeM3 = count * PI * (outerRadius^2 - innerRadius^2) * itemHeight"
  },
  notes: [
    "Count categories can use geometric volume directly (real-size items).",
    "Bulk density is used for packed solids to avoid unrealistically dense visuals."
  ]
} as const;

export function computeAnnualEstimate(params: {
  age: number;
  gender: Gender;
  location: LocationId;
  category: CategoryModel;
}): number {
  const category = params.category;
  const ageFactor = category.ageMultiplier ? category.ageMultiplier(params.age) : 1;
  const genderFactor = category.genderMultiplier?.[params.gender] ?? 1;
  const locationFactor = category.locationMultiplier?.[params.location] ?? 1;
  return category.annualBase * ageFactor * genderFactor * locationFactor;
}

export function computeLifetimeEstimate(annual: number, age: number): number {
  return annual * age;
}

export function convertToLiters(
  value: number,
  unit: string,
  kgPerLiter = 1,
  kgPerUnit?: number
): number {
  if (unit === "L") return value;
  if (unit === "kg") return value / kgPerLiter;
  if (unit === "g") return (value / 1000) / kgPerLiter;
  if (unit === "count") {
    if (!kgPerUnit) return value;
    return (value * kgPerUnit) / kgPerLiter;
  }
  return value;
}

export function convertToKilograms(
  value: number,
  unit: string,
  kgPerLiter = 1,
  kgPerUnit?: number
): number {
  if (unit === "kg") return value;
  if (unit === "g") return value / 1000;
  if (unit === "L") return value * kgPerLiter;
  if (unit === "count") return value * (kgPerUnit ?? 0);
  return value;
}
