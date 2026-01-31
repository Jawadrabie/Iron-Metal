import { useMemo } from "react"

export type Dims = {
  h: number | null
  w: number | null
  th: number | null
  t?: number | null
  unit?: "mm" | "m" | "ft" | "in"
  density?: string
}

export const toMeters = (val: number | null | undefined, unit?: string): number => {
  if (val == null || Number.isNaN(val as any)) return 0
  const n = Number(val)
  switch (unit) {
    case "mm":
      return n / 1000
    case "ft":
      return n * 0.3048
    case "in":
      return n * 0.0254
    case "m":
    default:
      return n
  }
}

export const densityToKgPerM3 = (d?: string): number => {
  const n = parseFloat(d ?? "")
  if (Number.isNaN(n)) return 0
  return n * 1000
}

export const useSidebarCalculations = (opts: {
  dims?: Dims
  weightPerMeter?: number | null
  pricePerKg: number
  lengthMeters: number
  required: number
}) => {
  const { dims, weightPerMeter, pricePerKg, lengthMeters, required } = opts

  const isDimsMode = !!(dims && (dims.h != null || dims.w != null || dims.th != null))

  return useMemo(() => {
    let kgPerM = 0
    let pieceKg = 0

    if (isDimsMode && dims) {
      const w_m = toMeters(dims.w ?? 0, dims.unit)
      const th_m = toMeters(dims.th ?? 0, dims.unit)
      const t_m = toMeters(dims.t ?? 0, dims.unit)
      const h_m = toMeters(dims.h ?? 0, dims.unit)
      const effectiveWidth_m = w_m + (t_m > 0 ? t_m : 0)

      const volume_m3 = h_m * th_m * effectiveWidth_m
      const rho = densityToKgPerM3(dims.density)
      pieceKg = volume_m3 * rho
      kgPerM = 0
    } else {
      if (typeof weightPerMeter === "number" && weightPerMeter > 0) {
        kgPerM = weightPerMeter
      } else {
        kgPerM = 0
      }
      pieceKg = Math.max(0, kgPerM) * Math.max(0, lengthMeters)
    }

    const safePricePerKg = Math.max(0, Number.isFinite(pricePerKg) ? pricePerKg : 0)
    const safeRequired = Math.max(0, Number.isFinite(required) ? required : 0)

    const priceOfPiece = pieceKg * safePricePerKg
    const totalWeightKg = pieceKg * safeRequired
    const totalPrice = priceOfPiece * safeRequired

    return {
      isDimsMode,
      linearMeterWeightKgPerM: kgPerM,
      weightOfPieceKg: pieceKg,
      priceOfPiece,
      totalWeightKg,
      totalPrice,
    }
  }, [isDimsMode, dims, weightPerMeter, lengthMeters, pricePerKg, required])
}
