import type { DensityGroup, DensityUnit } from "./types"

export const DIM_UNITS = ["mm", "m", "ft", "in"] as const
export type DimUnit = (typeof DIM_UNITS)[number]

export const DENSITY_GROUPS: DensityGroup[] = [
  {
    label: "Aluminum & Alloys",
    items: [
      { label: "Aluminum (average)", value: 2700 },
      { label: "Aluminum 1050", value: 2710 },
      { label: "Aluminum 1100", value: 2710 },
      { label: "Aluminum 3003", value: 2730 },
      { label: "Aluminum 3103", value: 2730 },
      { label: "Aluminum 5005", value: 2700 },
      { label: "Aluminum 5052", value: 2680 },
      { label: "Aluminum 5083", value: 2660 },
      { label: "Aluminum 5251", value: 2690 },
      { label: "Aluminum 5454", value: 2690 },
      { label: "Aluminum 5754", value: 2670 },
      { label: "Aluminum 6005", value: 2700 },
      { label: "Aluminum 6061", value: 2700 },
      { label: "Aluminum 6063", value: 2690 },
      { label: "Aluminum 6082", value: 2700 },
      { label: "Aluminum 7075", value: 2810 },
    ],
  },
  {
    label: "Steel & Iron",
    items: [
      { label: "Carbon Steel", value: 7850 },
      { label: "Mild Steel", value: 7850 },
      { label: "Structural Steel", value: 7850 },
      { label: "Cast Iron", value: 7200 },
      { label: "Ductile Iron", value: 7100 },
    ],
  },
  {
    label: "Stainless Steel",
    items: [
      { label: "Stainless Steel 201", value: 7800 },
      { label: "Stainless Steel 304", value: 8000 },
      { label: "Stainless Steel 304L", value: 8000 },
      { label: "Stainless Steel 316", value: 8000 },
      { label: "Stainless Steel 316L", value: 8000 },
      { label: "Stainless Steel 430", value: 7700 },
    ],
  },
  {
    label: "Copper & Copper Alloys",
    items: [
      { label: "Copper", value: 8960 },
      { label: "Brass (average)", value: 8500 },
      { label: "Admiralty Brass", value: 8530 },
      { label: "Naval Brass", value: 8470 },
      { label: "Bronze (average)", value: 8800 },
      { label: "Phosphor Bronze", value: 8900 },
      { label: "Beryllium Copper", value: 8250 },
    ],
  },
  {
    label: "Titanium & Special Metals",
    items: [
      { label: "Titanium Grade 2", value: 4510 },
      { label: "Titanium Grade 5 (Ti-6Al-4V)", value: 4430 },
      { label: "Nickel", value: 8900 },
      { label: "Inconel 625", value: 8440 },
      { label: "Inconel 718", value: 8190 },
    ],
  },
  {
    label: "Other Metals",
    items: [
      { label: "Zinc", value: 7140 },
      { label: "Lead", value: 11340 },
      { label: "Tin", value: 7310 },
      { label: "Magnesium", value: 1740 },
      { label: "Beryllium", value: 1850 },
      { label: "Antimony", value: 6680 },
      { label: "Babbitt", value: 7400 },
    ],
  },
]

export const DENSITY_UNITS: DensityUnit[] = [
  { label: "kg/m³", value: "kg_m3" },
  { label: "lb/ft³", value: "lb_ft3" },
  { label: "lb/yd³", value: "lb_yd3" },
  { label: "g/cm³", value: "g_cm3" },
  { label: "g/m³", value: "g_m3" },
]
