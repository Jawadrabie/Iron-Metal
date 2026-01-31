import type { Dims } from "../../hooks/useSidebarCalculations"

export const DIM_UNITS = ["mm", "m", "ft", "in"] as const
export const LENGTH_UNITS = ["m", "mm"] as const

export const DEFAULT_DIMS: Dims = {
  h: null,
  w: null,
  th: null,
  t: null,
  unit: "mm",
  density: "7.85",
}

export const DENSITIES = [
  { label: "Steel", value: "7.85" },
  { label: "Stainless Steel (SS)", value: "8.1" },
  { label: "Chromium (Cr)", value: "7.19" },
  { label: "Aluminum (Al)", value: "2.7" },
  { label: "Copper (Cu)", value: "8.96" },
  { label: "Brass (Alloy)", value: "8.73" },
  { label: "Lead (Pb)", value: "11.34" },
  { label: "Zinc (Zn)", value: "7.14" },
  { label: "Nickel (Ni)", value: "8.9" },
  { label: "Titanium (Ti)", value: "4.51" },
  { label: "Gold (Au)", value: "19.32" },
  { label: "Silver (Ag)", value: "10.49" },
  { label: "Sterling Silver", value: "10.36" },
  { label: "Platinum (Pt)", value: "21.45" },
  { label: "Bronze (Alloy)", value: "8.9" },
  { label: "Tin (Sn)", value: "7.31" },
]

export const CURRENCY_OPTIONS = ["SAR", "USD", "EUR", "AED", "EGP"]

export const isDimsSection = (id: number | null) => id === 13 || id === 15 || id === 16
