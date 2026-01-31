export const normalizeNumericInput = (value: any) => {
  if (value == null) return ""
  let s = String(value)

  const arabicIndic = "٠١٢٣٤٥٦٧٨٩"
  const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹"
  s = s
    .split("")
    .map((ch) => {
      const idx1 = arabicIndic.indexOf(ch)
      if (idx1 >= 0) return String(idx1)
      const idx2 = easternArabicIndic.indexOf(ch)
      if (idx2 >= 0) return String(idx2)
      return ch
    })
    .join("")

  s = s.replace(/\s+/g, "")
  s = s.replace(/٫/g, ".")
  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(/,/g, ".")
  } else {
    s = s.replace(/,/g, "")
  }

  return s
}

export const toNumber = (value: any) => {
  const n = parseFloat(normalizeNumericInput(value))
  return Number.isFinite(n) ? n : 0
}
