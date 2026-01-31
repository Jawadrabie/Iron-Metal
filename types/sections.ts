// تعريف أنواع بيانات القطاعات كما في نسخة الويب
export interface Variant {
  size: string
  thickness?: number
  nameAr: string
  nameEn: string
  img: string
  bigImg: string
  name?: { ar: string; en: string }
  weight?: number
  theoreticalWeight?: number
  actualWeight?: number
  h?: number
  b?: number
  tw?: number
  tf?: number
  A?: number
  Al?: number
  r?: number
  d?: number
  hi?: number
  ss?: number
  Av?: number
  Ix?: number
  Iy?: number
  Sx?: number
  Sy?: number
  Zx?: number
  Zy?: number
  rx?: number
  ry?: number
  J?: number
  info?: string
  country?: string
}

export interface Type {
  name: string
  symbol?: string | null
  flag?: string | null
  variants: Variant[]
}

export interface Section {
  id: number
  label: string
  labelAr: string
  symbol: string
  variants?: Variant[]
  types?: Type[]
}

