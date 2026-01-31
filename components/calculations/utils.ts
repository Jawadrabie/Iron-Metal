export const convertFromKgM3 = (value: number, unit: string) => {
  switch (unit) {
    case "lb_ft3":
      return value / 16.018463
    case "lb_yd3":
      return value / 0.593276
    case "g_cm3":
      return value / 1000
    case "g_m3":
      return value * 1000
    default:
      return value
  }
}

export const formatDensity = (value: number, unit: string) => {
  if (unit === "g_cm3") return value.toFixed(3)
  if (unit === "lb_ft3" || unit === "lb_yd3") return value.toFixed(2)
  return value.toFixed(0)
}
