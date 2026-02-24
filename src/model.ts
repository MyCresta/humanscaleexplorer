import {
  computeAnnualEstimate,
  computeLifetimeEstimate,
  convertToKilograms,
  convertToLiters
} from "./config/scienceModel";

export type Gender = "female" | "male" | "unspecified";
export type LocationId = "Global" | "US" | "EU" | "Asia";
export type ConfidenceLevel = "high" | "medium" | "low";
export type MaterialState = "liquid" | "solid";

export type MainCategoryId =
  | "municipal_waste"
  | "food"
  | "body_outputs"
  | "drinks"
  | "water_consumption"
  | "sanitation_flush"
  | "lifestyle_items"
  | "transport"
  | "personal_care";

export type MainCategoryMeta = {
  id: MainCategoryId;
  label: string;
};

export type CategoryModel = {
  id: string;
  mainCategory: MainCategoryId;
  subCategory: string;
  subLabel: string;
  isDefault?: boolean;
  label: string;
  unit: string;
  annualBase: number;
  itemMassKg?: number;
  itemRadiusMeters?: number;
  itemHeightMeters?: number;
  itemInnerRadiusMeters?: number;
  maxVisualItems?: number;
  itemSurface?: "aluminum" | "paper";
  itemColor?: string;
  itemLabelBandColor?: string;
  itemStackStyle?: "pyramid" | "chips_columns";
  kgPerLiter?: number;
  bulkKgPerLiter?: number;
  materialState?: MaterialState;
  ageMultiplier?: (age: number) => number;
  genderMultiplier?: Partial<Record<Gender, number>>;
  locationMultiplier?: Record<LocationId, number>;
  confidence: ConfidenceLevel;
  sourceLabel: string;
  sourceUrl: string;
  notes?: string;
  color: string;
};

export const locations: LocationId[] = ["Global", "US", "EU", "Asia"];

export const averageHeightsByLocation: Record<LocationId, { female: number; male: number; unspecified: number }> = {
  Global: { female: 1.59, male: 1.71, unspecified: 1.65 },
  US: { female: 1.62, male: 1.76, unspecified: 1.69 },
  EU: { female: 1.65, male: 1.78, unspecified: 1.72 },
  Asia: { female: 1.56, male: 1.69, unspecified: 1.63 }
};

export const mainCategories: MainCategoryMeta[] = [
  { id: "municipal_waste", label: "Municipal Waste" },
  { id: "food", label: "Food" },
  { id: "body_outputs", label: "Body Outputs" },
  { id: "drinks", label: "Drinks" },
  { id: "water_consumption", label: "Water Consumption" },
  { id: "sanitation_flush", label: "Toilet Flush Comparison" },
  { id: "lifestyle_items", label: "Lifestyle Items" },
  { id: "transport", label: "Transport" },
  { id: "personal_care", label: "Personal Care" }
];

export const categories: CategoryModel[] = [
  {
    id: "municipal_total",
    mainCategory: "municipal_waste",
    subCategory: "total",
    subLabel: "Total",
    isDefault: true,
    label: "Municipal Waste (Total)",
    unit: "kg",
    annualBase: 290,
    kgPerLiter: 0.13,
    bulkKgPerLiter: 0.08,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 20)),
    genderMultiplier: { female: 0.97, male: 1.03, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.4, EU: 1.1, Asia: 0.8 },
    confidence: "high",
    sourceLabel: "US EPA MSW and global comparatives",
    sourceUrl: "https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/national-overview-facts-and-figures-materials",
    color: "#c98b3a"
  },
  {
    id: "municipal_plastic",
    mainCategory: "municipal_waste",
    subCategory: "plastic",
    subLabel: "Plastic",
    label: "Plastic Waste",
    unit: "kg",
    annualBase: 36,
    kgPerLiter: 0.96,
    bulkKgPerLiter: 0.12,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 20)),
    genderMultiplier: { female: 0.98, male: 1.02, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.35, EU: 1.05, Asia: 0.8 },
    confidence: "medium",
    sourceLabel: "Derived from MSW plastic shares",
    sourceUrl: "https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/plastics-material-specific-data",
    color: "#d59a57"
  },
  {
    id: "municipal_metal",
    mainCategory: "municipal_waste",
    subCategory: "metal",
    subLabel: "Metal",
    label: "Metal Waste",
    unit: "kg",
    annualBase: 24,
    kgPerLiter: 2.8,
    bulkKgPerLiter: 0.9,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 20)),
    genderMultiplier: { female: 0.98, male: 1.02, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 1.1, Asia: 0.85 },
    confidence: "medium",
    sourceLabel: "Derived from MSW metal shares",
    sourceUrl: "https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/national-overview-facts-and-figures-materials",
    color: "#9da8b4"
  },
  {
    id: "municipal_batteries",
    mainCategory: "municipal_waste",
    subCategory: "batteries",
    subLabel: "Batteries",
    label: "Battery Waste",
    unit: "kg",
    annualBase: 2.5,
    kgPerLiter: 2.3,
    bulkKgPerLiter: 1.2,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 20)),
    genderMultiplier: { female: 1, male: 1, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.25, EU: 1.1, Asia: 0.9 },
    confidence: "low",
    sourceLabel: "Consumer battery waste approximations",
    sourceUrl: "https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/national-overview-facts-and-figures-materials",
    notes: "High regional uncertainty. Treated as indicative.",
    color: "#8f96a0"
  },
  {
    id: "food_consumed",
    mainCategory: "food",
    subCategory: "total_consumed",
    subLabel: "Total Consumed",
    isDefault: true,
    label: "Food Consumed",
    unit: "kg",
    annualBase: 550,
    kgPerLiter: 0.8,
    bulkKgPerLiter: 0.55,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.35, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.9, male: 1.1, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.05, EU: 1.0, Asia: 0.95 },
    confidence: "medium",
    sourceLabel: "Food supply and consumption composites",
    sourceUrl: "https://www.fao.org/faostat/en/#data/FBS",
    color: "#63a35c"
  },
  {
    id: "food_waste_fresh",
    mainCategory: "food",
    subCategory: "fresh_food_waste",
    subLabel: "Fresh Food Waste",
    label: "Fresh Food Waste",
    unit: "kg",
    annualBase: 79,
    kgPerLiter: 0.75,
    bulkKgPerLiter: 0.45,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.3, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.98, male: 1.02, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.15, EU: 1.0, Asia: 0.85 },
    confidence: "high",
    sourceLabel: "UNEP Food Waste Index",
    sourceUrl: "https://www.unep.org/resources/publication/food-waste-index-report-2024",
    color: "#79b26b"
  },
  {
    id: "body_urine",
    mainCategory: "body_outputs",
    subCategory: "urine",
    subLabel: "Urine",
    isDefault: true,
    label: "Urine",
    unit: "L",
    annualBase: 500,
    kgPerLiter: 1.03,
    bulkKgPerLiter: 1.03,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.25, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.93, male: 1.07, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1, EU: 1, Asia: 1 },
    confidence: "high",
    sourceLabel: "Clinical urine output averages",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK507843/",
    color: "#f0d14a"
  },
  {
    id: "body_feces",
    mainCategory: "body_outputs",
    subCategory: "feces",
    subLabel: "Feces",
    label: "Feces",
    unit: "kg",
    annualBase: 52,
    kgPerLiter: 1.03,
    bulkKgPerLiter: 0.95,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.25, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.92, male: 1.08, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1, EU: 1, Asia: 1 },
    confidence: "medium",
    sourceLabel: "Clinical stool output ranges",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK459344/",
    color: "#8e5e3a"
  },
  {
    id: "body_hair",
    mainCategory: "body_outputs",
    subCategory: "hair",
    subLabel: "Hair",
    label: "Hair",
    unit: "g",
    annualBase: 95,
    kgPerLiter: 0.5,
    bulkKgPerLiter: 0.03,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.35, Math.min(1, age / 20)),
    genderMultiplier: { female: 0.96, male: 1.04, unspecified: 1 },
    confidence: "medium",
    sourceLabel: "Hair growth and density assumptions",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK513312/",
    color: "#5a412b"
  },
  {
    id: "body_nails",
    mainCategory: "body_outputs",
    subCategory: "nails",
    subLabel: "Nails",
    label: "Nails",
    unit: "g",
    annualBase: 38,
    kgPerLiter: 1.3,
    bulkKgPerLiter: 0.6,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.35, Math.min(1, age / 20)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    confidence: "medium",
    sourceLabel: "Nail growth clinical averages",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18689653/",
    color: "#bfc8d5"
  },
  {
    id: "drinks_total",
    mainCategory: "drinks",
    subCategory: "total",
    subLabel: "Total Drinks",
    isDefault: true,
    label: "Total Fluid Intake",
    unit: "L",
    annualBase: 900,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.35, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.92, male: 1.08, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.05, EU: 1, Asia: 0.95 },
    confidence: "medium",
    sourceLabel: "Hydration and beverage intake composites",
    sourceUrl: "https://www.cdc.gov/nchs/products/databriefs/db242.htm",
    color: "#55b7ff"
  },
  {
    id: "drinks_water",
    mainCategory: "drinks",
    subCategory: "water",
    subLabel: "Water",
    label: "Drinking Water",
    unit: "L",
    annualBase: 620,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.35, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.92, male: 1.08, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.05, EU: 1, Asia: 0.95 },
    confidence: "medium",
    sourceLabel: "Population hydration references",
    sourceUrl: "https://www.cdc.gov/nchs/products/databriefs/db242.htm",
    color: "#7ec8ff"
  },
  {
    id: "drinks_coffee",
    mainCategory: "drinks",
    subCategory: "coffee",
    subLabel: "Coffee",
    label: "Coffee Intake",
    unit: "L",
    annualBase: 120,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.1, Math.min(1, age / 22)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.1, EU: 1.2, Asia: 0.7 },
    confidence: "medium",
    sourceLabel: "Global coffee consumption statistics",
    sourceUrl: "https://www.ico.org/",
    color: "#9d6a4a"
  },
  {
    id: "drinks_beer",
    mainCategory: "drinks",
    subCategory: "beer",
    subLabel: "Beer",
    label: "Beer Intake",
    unit: "L",
    annualBase: 75,
    kgPerLiter: 1.01,
    bulkKgPerLiter: 1.01,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0, Math.min(1, (age - 16) / 15)),
    genderMultiplier: { female: 0.7, male: 1.3, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.0, EU: 1.2, Asia: 0.65 },
    confidence: "medium",
    sourceLabel: "WHO alcohol consumption",
    sourceUrl: "https://www.who.int/en/news-room/fact-sheets/detail/alcohol",
    color: "#d8b451"
  },
  {
    id: "drinks_vodka",
    mainCategory: "drinks",
    subCategory: "vodka_spirits",
    subLabel: "Vodka/Spirits",
    label: "Vodka/Spirits Intake",
    unit: "L",
    annualBase: 12,
    kgPerLiter: 0.95,
    bulkKgPerLiter: 0.95,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0, Math.min(1, (age - 16) / 15)),
    genderMultiplier: { female: 0.7, male: 1.3, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 0.85, EU: 1.0, Asia: 0.6 },
    confidence: "low",
    sourceLabel: "Spirits market and alcohol composites",
    sourceUrl: "https://www.who.int/en/news-room/fact-sheets/detail/alcohol",
    notes: "Highly region-specific; shown as indicative average.",
    color: "#cfd6de"
  },
  {
    id: "transport_fuel",
    mainCategory: "transport",
    subCategory: "fuel_vehicle",
    subLabel: "Vehicle Fuel",
    isDefault: true,
    label: "Vehicle Travel Fuel",
    unit: "L",
    annualBase: 520,
    kgPerLiter: 0.74,
    bulkKgPerLiter: 0.74,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0, Math.min(1, (age - 16) / 12)),
    genderMultiplier: { female: 0.85, male: 1.15, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.5, EU: 0.8, Asia: 0.7 },
    confidence: "medium",
    sourceLabel: "Transport fuel and distance composites",
    sourceUrl: "https://ourworldindata.org/transport",
    color: "#7f8a95"
  },
  {
    id: "water_total",
    mainCategory: "water_consumption",
    subCategory: "total",
    subLabel: "Total Household Water",
    isDefault: true,
    label: "Total Household Water Consumption",
    unit: "L",
    annualBase: 95000,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 0.9, Asia: 0.7 },
    confidence: "medium",
    sourceLabel: "EPA WaterSense household water use",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    color: "#4ba3f2"
  },
  {
    id: "water_shower",
    mainCategory: "water_consumption",
    subCategory: "shower",
    subLabel: "Shower",
    label: "Shower/Bath Water",
    unit: "L",
    annualBase: 33000,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 0.92, Asia: 0.72 },
    confidence: "medium",
    sourceLabel: "EPA WaterSense indoor use breakdown",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    color: "#5cb5ff"
  },
  {
    id: "water_toilet",
    mainCategory: "water_consumption",
    subCategory: "toilet",
    subLabel: "Toilet",
    label: "Toilet Flushing Water",
    unit: "L",
    annualBase: 26000,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.18, EU: 0.9, Asia: 0.72 },
    confidence: "medium",
    sourceLabel: "EPA WaterSense indoor use breakdown",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    color: "#6ec0ff"
  },
  {
    id: "water_laundry",
    mainCategory: "water_consumption",
    subCategory: "laundry",
    subLabel: "Laundry",
    label: "Laundry Water",
    unit: "L",
    annualBase: 14500,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.15, EU: 0.95, Asia: 0.78 },
    confidence: "medium",
    sourceLabel: "EPA WaterSense indoor use breakdown",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    color: "#7dc9ff"
  },
  {
    id: "water_cleaning",
    mainCategory: "water_consumption",
    subCategory: "cleaning",
    subLabel: "Cleaning",
    label: "Home Cleaning Water",
    unit: "L",
    annualBase: 8500,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 0.92, Asia: 0.75 },
    confidence: "low",
    sourceLabel: "Derived from indoor-use remainder estimates",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    notes: "Cleaning split is an estimate from residual indoor use shares.",
    color: "#8fd3ff"
  },
  {
    id: "water_dishwashing",
    mainCategory: "water_consumption",
    subCategory: "dishwashing",
    subLabel: "Dishwashing",
    label: "Dishwashing Water",
    unit: "L",
    annualBase: 13000,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.2, Math.min(1, age / 18)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 0.93, Asia: 0.76 },
    confidence: "medium",
    sourceLabel: "EPA WaterSense indoor use breakdown",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    color: "#a1dbff"
  },
  {
    id: "flush_urine_compare",
    mainCategory: "sanitation_flush",
    subCategory: "urine_flush",
    subLabel: "Urine vs Flush Water",
    isDefault: true,
    label: "Flush Water for Urination",
    unit: "L",
    annualBase: 10950,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.15, Math.min(1, age / 16)),
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.05, EU: 1.0, Asia: 0.95 },
    confidence: "medium",
    sourceLabel: "Toilet flush volume assumptions (6 L/flush, ~5 flushes/day)",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    notes: "Indicative model using modern toilet flow assumptions and average daily urination frequency.",
    color: "#4f9fe8"
  },
  {
    id: "flush_feces_compare",
    mainCategory: "sanitation_flush",
    subCategory: "feces_flush",
    subLabel: "Feces vs Flush Water",
    label: "Flush Water for Defecation",
    unit: "L",
    annualBase: 4380,
    kgPerLiter: 1,
    bulkKgPerLiter: 1,
    materialState: "liquid",
    ageMultiplier: (age) => Math.max(0.15, Math.min(1, age / 16)),
    genderMultiplier: { female: 0.98, male: 1.02, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.05, EU: 1.0, Asia: 0.95 },
    confidence: "medium",
    sourceLabel: "Toilet flush volume assumptions (6 L/flush, ~2 flushes/day)",
    sourceUrl: "https://www.epa.gov/watersense/statistics-and-facts",
    notes: "Indicative model using modern toilet flow assumptions and average daily bowel movement frequency.",
    color: "#3f8fda"
  },
  {
    id: "item_soda_cans",
    mainCategory: "lifestyle_items",
    subCategory: "soda_cans",
    subLabel: "Soda Cans",
    isDefault: true,
    label: "Soda Cans Consumed",
    unit: "count",
    annualBase: 220,
    itemMassKg: 0.37,
    itemRadiusMeters: 0.033,
    itemHeightMeters: 0.122,
    itemInnerRadiusMeters: 0,
    maxVisualItems: 2800,
    itemSurface: "aluminum",
    itemColor: "#f5f8ff",
    itemLabelBandColor: "#c72f2f",
    kgPerLiter: 0.95,
    bulkKgPerLiter: 0.36,
    materialState: "solid",
    ageMultiplier: (age) => {
      if (age < 4) return 0;
      if (age < 12) return ((age - 4) / 8) * 0.12;
      if (age < 18) return 0.12 + ((age - 12) / 6) * 0.28;
      if (age < 25) return 0.4 + ((age - 18) / 7) * 0.6;
      return 1;
    },
    genderMultiplier: { female: 0.9, male: 1.1, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.25, EU: 0.85, Asia: 0.75 },
    confidence: "medium",
    sourceLabel: "Beverage consumption composites",
    sourceUrl: "https://www.statista.com/statistics/281194/per-capita-consumption-of-soft-drinks-in-selected-countries/",
    notes: "Model assumes 330 ml can equivalent. Child/teen intake is strongly downscaled before adulthood. Scene uses can-sized instanced objects in a pile.",
    color: "#cf4545"
  },
  {
    id: "item_toilet_rolls",
    mainCategory: "lifestyle_items",
    subCategory: "toilet_rolls",
    subLabel: "Toilet Rolls",
    label: "Toilet Paper Rolls Used",
    unit: "count",
    annualBase: 120,
    itemMassKg: 0.11,
    itemRadiusMeters: 0.057,
    itemHeightMeters: 0.1,
    itemInnerRadiusMeters: 0.023,
    maxVisualItems: 2400,
    itemSurface: "paper",
    itemColor: "#f2efe8",
    kgPerLiter: 0.1,
    bulkKgPerLiter: 0.07,
    materialState: "solid",
    ageMultiplier: (age) => {
      if (age < 3) return 0;
      if (age < 12) return 0.18 + ((age - 3) / 9) * 0.42;
      if (age < 18) return 0.6 + ((age - 12) / 6) * 0.3;
      if (age < 25) return 0.9 + ((age - 18) / 7) * 0.1;
      return 1;
    },
    genderMultiplier: { female: 1.02, male: 0.98, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.12, EU: 1.0, Asia: 0.8 },
    confidence: "medium",
    sourceLabel: "Household toilet paper consumption estimates",
    sourceUrl: "https://www.statista.com/",
    notes: "Approximate per-person roll consumption. Visualized as real-sized roll cylinders in a pile.",
    color: "#d8d2c8"
  },
  {
    id: "item_pizzas",
    mainCategory: "lifestyle_items",
    subCategory: "pizzas",
    subLabel: "Pizzas",
    label: "Pizzas Consumed",
    unit: "count",
    annualBase: 26,
    itemMassKg: 0.72,
    itemRadiusMeters: 0.16,
    itemHeightMeters: 0.028,
    itemInnerRadiusMeters: 0,
    maxVisualItems: 1800,
    itemSurface: "paper",
    itemColor: "#d6b27a",
    itemStackStyle: "chips_columns",
    kgPerLiter: 0.92,
    bulkKgPerLiter: 0.6,
    materialState: "solid",
    ageMultiplier: (age) => {
      if (age < 5) return 0.02;
      if (age < 12) return 0.25 + ((age - 5) / 7) * 0.25;
      if (age < 18) return 0.5 + ((age - 12) / 6) * 0.35;
      if (age < 25) return 0.85 + ((age - 18) / 7) * 0.15;
      return 1;
    },
    genderMultiplier: { female: 0.95, male: 1.05, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.15, EU: 1.0, Asia: 0.75 },
    confidence: "medium",
    sourceLabel: "Pizza consumption composites",
    sourceUrl: "https://www.statista.com/",
    notes: "Pizzas are stacked in chip-like columns. Each stack fills bottom-up, then next stack starts.",
    color: "#c9964f"
  },
  {
    id: "personal_care_total",
    mainCategory: "personal_care",
    subCategory: "total",
    subLabel: "Total",
    isDefault: true,
    label: "Personal Care Products (Total)",
    unit: "kg",
    annualBase: 24,
    kgPerLiter: 1.0,
    bulkKgPerLiter: 0.9,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.25, Math.min(1, age / 18)),
    genderMultiplier: { female: 1.2, male: 0.8, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 1.05, Asia: 0.85 },
    confidence: "low",
    sourceLabel: "Personal care market usage estimates",
    sourceUrl: "https://www.statista.com/topics/3137/personal-care/",
    notes: "Estimated from market-volume proxies; high uncertainty.",
    color: "#f08fb7"
  },
  {
    id: "personal_care_toothpaste",
    mainCategory: "personal_care",
    subCategory: "toothpaste",
    subLabel: "Toothpaste",
    label: "Toothpaste Used",
    unit: "kg",
    annualBase: 1.2,
    kgPerLiter: 1.3,
    bulkKgPerLiter: 1.15,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.3, Math.min(1, age / 16)),
    genderMultiplier: { female: 1.0, male: 1.0, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.1, EU: 1.0, Asia: 0.85 },
    confidence: "medium",
    sourceLabel: "Dental hygiene product use assumptions",
    sourceUrl: "https://www.fdiworlddental.org/",
    color: "#f2a7c8"
  },
  {
    id: "personal_care_shower_gel",
    mainCategory: "personal_care",
    subCategory: "shower_gel",
    subLabel: "Shower Gel",
    label: "Shower Gel/Soap Used",
    unit: "kg",
    annualBase: 7.5,
    kgPerLiter: 1.02,
    bulkKgPerLiter: 0.96,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.3, Math.min(1, age / 16)),
    genderMultiplier: { female: 1.1, male: 0.9, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.15, EU: 1.0, Asia: 0.8 },
    confidence: "low",
    sourceLabel: "Personal care product use proxies",
    sourceUrl: "https://www.statista.com/topics/3137/personal-care/",
    color: "#f5b3d0"
  },
  {
    id: "personal_care_lotion",
    mainCategory: "personal_care",
    subCategory: "lotion",
    subLabel: "Lotion",
    label: "Lotion/Cream Used",
    unit: "kg",
    annualBase: 3.8,
    kgPerLiter: 0.95,
    bulkKgPerLiter: 0.9,
    materialState: "solid",
    ageMultiplier: (age) => Math.max(0.25, Math.min(1, age / 18)),
    genderMultiplier: { female: 1.25, male: 0.75, unspecified: 1 },
    locationMultiplier: { Global: 1, US: 1.2, EU: 1.05, Asia: 0.8 },
    confidence: "low",
    sourceLabel: "Cosmetics usage market proxies",
    sourceUrl: "https://www.statista.com/topics/3137/personal-care/",
    color: "#f7c2db"
  }
];

export function getMainCategoryLabel(mainCategory: MainCategoryId): string {
  return mainCategories.find((m) => m.id === mainCategory)?.label ?? mainCategory;
}

export function getSubCategories(mainCategory: MainCategoryId): CategoryModel[] {
  return categories.filter((c) => c.mainCategory === mainCategory);
}

export function getDefaultCategory(mainCategory: MainCategoryId): CategoryModel {
  const group = getSubCategories(mainCategory);
  const fallback = group[0];
  const selected = group.find((c) => c.isDefault);
  if (!fallback) throw new Error(`No categories found for main category: ${mainCategory}`);
  return selected ?? fallback;
}

export function findCategoryById(categoryId: string): CategoryModel | undefined {
  return categories.find((c) => c.id === categoryId);
}

export function estimateCategoryValue(params: {
  age: number;
  gender: Gender;
  location: LocationId;
  category: CategoryModel;
}) {
  const category = params.category;
  const annual = computeAnnualEstimate(params);
  const lifetimeEstimate = computeLifetimeEstimate(annual, params.age);
  return { category, annual, lifetimeEstimate };
}

export function toLiters(value: number, unit: string, kgPerLiter = 1, kgPerUnit?: number): number {
  return convertToLiters(value, unit, kgPerLiter, kgPerUnit);
}

export function toKilograms(value: number, unit: string, kgPerLiter = 1, kgPerUnit?: number): number {
  return convertToKilograms(value, unit, kgPerLiter, kgPerUnit);
}
