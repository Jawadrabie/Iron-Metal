export const LABELS: Record<string, string> = {
  country: "country",
  weight: "Weight",
  h: "h",
  b: "b",
  tw: "tw",
  tf: "tf",
  r: "r",
  d: "d",
  hi: "hi",
  ss: "ss",
  A: "A",
  AL: "AL",
  Av: "Av",
  Ix: "Ix",
  Iy: "Iy",
  Sx: "Sx",
  Sy: "Sy",
  Zx: "Zx",
  Zy: "Zy",
  rx: "rx",
  ry: "ry",
  J: "J",
  Din: "Din",
}

export const GROUPS: Array<{
  title: string
  rows: Array<{ key: string; unit?: string }>
}> = [
  { title: "Weight", rows: [{ key: "weight", unit: "kg/m" }] },
  {
    title: "Size",
    rows: [
      { key: "h", unit: "mm" },
      { key: "b", unit: "mm" },
      { key: "tw", unit: "mm" },
      { key: "tf", unit: "mm" },
      { key: "r", unit: "mm" },
      { key: "d", unit: "mm" },
      { key: "hi", unit: "mm" },
      { key: "ss", unit: "mm" },
    ],
  },
  { title: "Area", rows: [{ key: "A", unit: "cm²" }] },
  { title: "Surface Area", rows: [{ key: "AL", unit: "m²" }] },
  { title: "Shear Area", rows: [{ key: "Av", unit: "cm²" }] },
  {
    title: "Moment of inertia",
    rows: [
      { key: "Ix", unit: "cm⁴" },
      { key: "Iy", unit: "cm⁴" },
    ],
  },
  {
    title: "Elastic Modulus",
    rows: [
      { key: "Sx", unit: "cm³" },
      { key: "Sy", unit: "cm³" },
    ],
  },
  {
    title: "Plastic Modulus",
    rows: [
      { key: "Zx", unit: "cm³" },
      { key: "Zy", unit: "cm³" },
    ],
  },
]
