import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from "pdf-lib"
import * as FileSystem from "expo-file-system/legacy"
import { Asset } from "expo-asset"
import { encode, decode } from "base64-arraybuffer"
import { getLocalAssetModuleId } from "../localAssets"

export type CalculatorPdfPayload = {
  companyName?: string
  companyExtra?: string
  orderTitle?: string
  orderDateLabel?: string
  orderDateValue?: string
  currencyCode?: string
  fileBaseName?: string
  sectionId?: number
  sectionType?: string
  variantIndex?: number
  sliderValue?: number
  linearWeightKgPerM: number
  actualLinearWeightKgPerM?: number
  lengthMeters: number
  unitWeightKg: number
  required: number
  unitPricePerPiece: number
  totalWeightKg: number
  totalPrice: number
  sectorBigImg?: string | null
}

function safeNum(value: number | null | undefined, fractionDigits = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return ""
  return value.toFixed(fractionDigits)
}

const BASE_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://iron-metal.net"

const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || "ironmetal"
const BASE_APP_URL = `${APP_SCHEME}://`

function base64UrlEncodeUtf8(value: string): string {
  try {
    // Prefer TextEncoder when available
    const encoder = new TextEncoder()
    const bytes = encoder.encode(value)
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    const b64 = encode(buffer)
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  } catch {
    // Fallback: keep it simple (will be larger due to encodeURIComponent)
    return encodeURIComponent(value)
  }
}

function sanitizePdfText(text: string): string {
  return String(text || "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/⁴/g, "4")
    .replace(/[\u0000-\u0008\u000B-\u001F]/g, " ")
}

function truncate(text: string, max: number): string {
  const s = sanitizePdfText(text)
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)) + "…"
}

function buildQrModules(value: string, levelInput: "L" | "M" | "Q" | "H" = "M"): boolean[][] | null {
  try {
    const QRCode = require("qrcode-terminal/vendor/QRCode")
    const QRErrorCorrectLevel = require("qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel")

    let level = QRErrorCorrectLevel.M
    if (levelInput === "L") level = QRErrorCorrectLevel.L
    else if (levelInput === "Q") level = QRErrorCorrectLevel.Q
    else if (levelInput === "H") level = QRErrorCorrectLevel.H

    const qr = new QRCode(-1, level)
    qr.addData(value)
    qr.make()

    const modules = qr.modules
    if (!Array.isArray(modules) || !modules.length) return null

    return modules.map((row: any) => (Array.isArray(row) ? row.map((v: any) => !!v) : []))
  } catch (error) {
    console.warn("[calculator-pdf] failed to generate QR modules", error)
    return null
  }
}

function drawQrCode(page: any, modules: boolean[][], x: number, y: number, size: number): void {
  const moduleCount = modules.length
  if (!moduleCount) return

  const quietZone = 4
  const total = moduleCount + quietZone * 2
  const cell = size / total

  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: rgb(1, 1, 1),
  })

  const yTop = y + size

  for (let row = 0; row < moduleCount; row++) {
    const rowData = modules[row]
    if (!rowData) continue

    for (let col = 0; col < moduleCount; col++) {
      if (!rowData[col]) continue

      const px = x + (col + quietZone) * cell
      const py = yTop - (row + quietZone + 1) * cell

      page.drawRectangle({
        x: px,
        y: py,
        width: cell,
        height: cell,
        color: rgb(0, 0, 0),
      })
    }
  }
}

function drawClickIndicator(page: any, x: number, y: number, size: number, color: any) {
  const s = size
  const stroke = Math.max(1, s * 0.12)

  const boxX = x + s * 0.1
  const boxY = y + s * 0.1
  const boxS = s * 0.62

  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxS,
    height: boxS,
    color: rgb(1, 1, 1),
    borderColor: color,
    borderWidth: stroke,
  })

  const arrowEndX = x + s * 0.92
  const arrowEndY = y + s * 0.92
  const arrowStartX = boxX + boxS * 0.42
  const arrowStartY = boxY + boxS * 0.42

  page.drawLine({
    start: { x: arrowStartX, y: arrowStartY },
    end: { x: arrowEndX, y: arrowEndY },
    thickness: stroke,
    color,
  })

  page.drawLine({
    start: { x: arrowEndX - s * 0.3, y: arrowEndY },
    end: { x: arrowEndX, y: arrowEndY },
    thickness: stroke,
    color,
  })

  page.drawLine({
    start: { x: arrowEndX, y: arrowEndY - s * 0.3 },
    end: { x: arrowEndX, y: arrowEndY },
    thickness: stroke,
    color,
  })
}

// نستخدم تنسيق تاريخ ثابت بأرقام إنجليزية فقط لتجنب مشاكل ترميز WinAnsi في pdf-lib
function formatDateEn(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear().toString()
  return `${d}/${m}/${y}`
}

function normalizeToFileUri(value: string): string {
  if (value.startsWith("file:")) return value
  if (value.startsWith("/")) return `file://${value}`
  return value
}

function isAbsoluteLocalFilePath(value: string): boolean {
  if (!value.startsWith("/")) return false
  if (value.startsWith("/icons/")) return false
  return true
}

async function loadImageBytesFromUri(uri: string): Promise<Uint8Array | null> {
  try {
    if (uri.startsWith("http:") || uri.startsWith("https:")) {
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory
      const downloader = (FileSystem as any).downloadAsync
      if (dir && downloader) {
        const safeName = String(uri).replace(/[^a-zA-Z0-9._-]/g, "_")
        const target = `${dir}pdf-img-${safeName}`

        try {
          await downloader(uri, target)
          const base64Downloaded = await FileSystem.readAsStringAsync(target, {
            encoding: (FileSystem as any).EncodingType?.Base64 ?? ("base64" as any),
          })
          return new Uint8Array(decode(base64Downloaded) as ArrayBuffer)
        } catch {
          // ignore
        }
      }

      try {
        const response = await fetch(uri)
        if (!response.ok) return null
        const buffer = await response.arrayBuffer()
        return new Uint8Array(buffer)
      } catch {
        return null
      }
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: (FileSystem as any).EncodingType?.Base64 ?? ("base64" as any),
      })
      return new Uint8Array(decode(base64) as ArrayBuffer)
    } catch {
      // ignore
    }

    const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory
    if (!dir || !(FileSystem as any).copyAsync) {
      return null
    }

    const safeName = String(uri).replace(/[^a-zA-Z0-9._-]/g, "_")
    const target = `${dir}pdf-img-${safeName}`

    try {
      await (FileSystem as any).copyAsync({ from: uri, to: target })
      const base64Copied = await FileSystem.readAsStringAsync(target, {
        encoding: (FileSystem as any).EncodingType?.Base64 ?? ("base64" as any),
      })
      return new Uint8Array(decode(base64Copied) as ArrayBuffer)
    } catch {
      return null
    }
  } catch {
    return null
  }
}

async function embedImageFromAsset(pdfDoc: PDFDocument, moduleId: number) {
  const asset = Asset.fromModule(moduleId)

  // 🔴 مهم جدًا لنسخة APK
  try {
    await asset.downloadAsync()
  } catch {
    // ignore
  }

  const uri = asset.localUri ?? asset.uri
  if (!uri) return null

  const bytes = await loadImageBytesFromUri(uri)
  if (!bytes) return null

  try {
    return await (pdfDoc as any).embedPng(bytes)
  } catch {
    try {
      return await (pdfDoc as any).embedJpg(bytes)
    } catch {
      return null
    }
  }
}

export async function generateCalculatorPdf(data: CalculatorPdfPayload): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const margin = 32
  const marginX = margin
  let y = height - margin - 34

  const purple = rgb(43 / 255, 31 / 255, 93 / 255)
  const gray = rgb(0.25, 0.25, 0.25)

  const companyName = data.companyName ?? "Iron & Metal"
  const companyExtra = data.companyExtra ?? ""
  const orderTitle = "Data Sheet | Cross-Section Properties"
  const orderDateValue = data.orderDateValue || formatDateEn(new Date())

  let headerLogo: any = null
  try {
    headerLogo = await embedImageFromAsset(pdfDoc, require("../../assets/icons/logo512x512.png"))
  } catch {
    headerLogo = null
  }

  const headerLogoHeight = 34
  const headerLogoGap = 8
  const headerLogoWidth =
    headerLogo && typeof headerLogo.width === "number" && typeof headerLogo.height === "number" && headerLogo.height
      ? (headerLogoHeight * headerLogo.width) / headerLogo.height
      : 0
  const companyNameWidth = boldFont.widthOfTextAtSize(companyName, 16)
  const headerGroupWidth = (headerLogoWidth > 0 ? headerLogoWidth + headerLogoGap : 0) + companyNameWidth
  const headerGroupX = Math.max(marginX, (width - headerGroupWidth) / 2)
  const companyNameX = headerLogoWidth > 0 ? headerGroupX + headerLogoWidth + headerLogoGap : headerGroupX

  // Header: company name + extra (left)
  if (headerLogo && headerLogoWidth > 0) {
    page.drawImage(headerLogo, {
      x: headerGroupX,
      y: y - (headerLogoHeight - 16) / 2 + 2,
      width: headerLogoWidth,
      height: headerLogoHeight,
    })
  }
  page.drawText(companyName, {
    x: companyNameX,
    y,
    size: 16,
    font: boldFont,
    color: purple,
  })

  // Header: date (right)
  const headerDateText = sanitizePdfText(orderDateValue)
  const headerDateSize = 11
  const headerDateWidth = boldFont.widthOfTextAtSize(headerDateText, headerDateSize)
  page.drawText(headerDateText, {
    x: width - marginX - headerDateWidth,
    y: y + (16 - headerDateSize) / 2,
    size: headerDateSize,
    font: boldFont,
    color: rgb(0.35, 0.35, 0.35),
  })

  const companyExtraY = y - 18
  if (companyExtra.trim().length > 0) {
    page.drawText(companyExtra, {
      x: companyNameX,
      y: companyExtraY,
      size: 10,
      font,
      color: gray,
    })
  }

  y = height - margin - 34 - 48

  const titleText = sanitizePdfText(orderTitle)
  page.drawText(titleText, {
    x: marginX,
    y,
    size: 12,
    font,
    color: rgb(0.1, 0.1, 0.1),
  })

  y -= 16

  const embedSectorImageIfAvailable = async (startY: number): Promise<number> => {
    const path = data.sectorBigImg
    if (!path) return startY

    try {
      let image: any = null

      // أولاً: إذا كان لدينا مسار ملف فعلي (نتيجة captureRef أو نظام الملفات) أو رابط مباشر
      if (
        path.startsWith("file:") ||
        path.startsWith("asset:") ||
        path.startsWith("content:") ||
        path.startsWith("http:") ||
        path.startsWith("https:") ||
        isAbsoluteLocalFilePath(path)
      ) {
        const bytes = await loadImageBytesFromUri(normalizeToFileUri(path))
        if (!bytes) return startY

        try {
          image = await (pdfDoc as any).embedPng(bytes)
        } catch {
          try {
            image = await (pdfDoc as any).embedJpg(bytes)
          } catch {
            image = null
          }
        }
      } else {
        // ثانياً: مسار أيقونة منطقي مثل /icons/b-hp1.svg -> نستخدم خريطة الأصول المحلية
        const normalized = String(path)
        const candidates: string[] = []
        if (normalized.includes("/icons/")) {
          candidates.push(normalized.replace("/icons/", "/icons/pdf-"))
        }
        candidates.push(normalized)

        for (const candidate of candidates) {
          const moduleId = getLocalAssetModuleId(candidate)
          if (!moduleId) continue
          image = await embedImageFromAsset(pdfDoc, moduleId)
          if (image) break
        }
      }

      if (!image) return startY

      const maxWidth = Math.max(0, width - marginX * 2)
      const targetWidth = Math.min(140, maxWidth)
      const scaleByWidth = targetWidth / image.width
      let imgWidth = targetWidth
      let imgHeight = image.height * scaleByWidth

      const maxHeight = 160
      if (imgHeight > maxHeight) {
        const scaleByHeight = maxHeight / image.height
        imgHeight = maxHeight
        imgWidth = image.width * scaleByHeight
      }

      const x = (width - imgWidth) / 2
      const yImg = startY - imgHeight

      page.drawImage(image, {
        x,
        y: yImg,
        width: imgWidth,
        height: imgHeight,
      })

      return yImg - 10
    } catch (error) {
      console.warn("[calculator-pdf] failed to embed sector image", error)
      return startY
    }
  }

  y = await embedSectorImageIfAvailable(y)

  type ContentRow =
    | { type: "section"; label: string }
    | { type: "row"; label: string; value: string }

  const shouldShowActualLinearWeight =
    typeof data.actualLinearWeightKgPerM === "number" &&
    Number.isFinite(data.actualLinearWeightKgPerM) &&
    Math.abs(data.actualLinearWeightKgPerM - data.linearWeightKgPerM) > 1e-9
    && data.actualLinearWeightKgPerM !== 0

  const description =
    data.lengthMeters && data.linearWeightKgPerM
      ? `Linear Item — ${safeNum(data.lengthMeters)} m, ${safeNum(data.linearWeightKgPerM)} kg/m`
      : "Linear Item"

  const currencySuffix = data.currencyCode ? ` ${sanitizePdfText(data.currencyCode)}` : ""

  const rows: ContentRow[] = [
    { type: "section", label: "Item" },
    { type: "row", label: "Description", value: description },
    { type: "row", label: "Length", value: `${safeNum(data.lengthMeters)} m` },
    { type: "row", label: "Required", value: safeNum(data.required, 0) },
    { type: "row", label: "Unit", value: "pcs" },
    { type: "section", label: "Weights" },
    { type: "row", label: "Linear Weight", value: `${safeNum(data.linearWeightKgPerM)} kg/m` },
    ...(shouldShowActualLinearWeight
      ? [{ type: "row" as const, label: "Actual Linear Weight", value: `${safeNum(data.actualLinearWeightKgPerM)} kg/m` }]
      : []),
    { type: "row", label: "Unit Weight", value: `${safeNum(data.unitWeightKg)} kg` },
    { type: "row", label: "Total Weight", value: `${safeNum(data.totalWeightKg)} kg` },
    { type: "section", label: "Pricing" },
    { type: "row", label: "Unit Price", value: `${safeNum(data.unitPricePerPiece)}${currencySuffix}` },
    { type: "row", label: "Total Price", value: `${safeNum(data.totalPrice)}${currencySuffix}` },
  ]

  const tableWidth = width - marginX * 2
  const col1Width = tableWidth * 0.5

  const headerHeight = 18
  const sectionHeight = 16
  const rowHeight = 14

  const drawTableHeader = (yTop: number) => {
    page.drawRectangle({
      x: marginX,
      y: yTop - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.94, 0.94, 0.94),
    })

    const headerY = yTop - headerHeight / 2 - 4

    page.drawText("Property", {
      x: marginX + 4,
      y: headerY,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })

    page.drawText("Value", {
      x: marginX + col1Width + 4,
      y: headerY,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })

    return yTop - headerHeight - 4
  }

  y = drawTableHeader(y)

  let zebra = 0
  let lastRowType: "section" | "row" | null = null

  for (const r of rows) {
    const minY = margin + 90
    const sectionGap = r.type === "section" && lastRowType === "row" ? 6 : 0
    const requiredHeight = (r.type === "section" ? sectionHeight : rowHeight) + sectionGap
    if (y - requiredHeight < minY) break

    if (r.type === "section") {
      if (sectionGap) y -= sectionGap
      const label = truncate(r.label, 60)

      page.drawRectangle({
        x: marginX,
        y: y - sectionHeight + 2,
        width: tableWidth,
        height: sectionHeight,
        color: rgb(0.92, 0.92, 0.92),
      })

      page.drawText(label, {
        x: marginX + 4,
        y: y - sectionHeight / 2 - 4,
        size: 10,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      })

      y -= sectionHeight
      zebra = 0
      lastRowType = "section"
      continue
    }

    const label = truncate(r.label, 48)
    const value = truncate(r.value, 48)

    if (zebra % 2 === 0) {
      page.drawRectangle({
        x: marginX,
        y: y - rowHeight + 2,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }

    page.drawText(label, {
      x: marginX + 4,
      y: y - rowHeight / 2 - 4,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    })

    page.drawText(value, {
      x: marginX + col1Width + 4,
      y: y - rowHeight / 2 - 4,
      size: 9,
      font,
      color: rgb(0.1, 0.1, 0.1),
    })

    y -= rowHeight
    zebra += 1
    lastRowType = "row"
  }

  try {
    const footerPrefixRaw = "Free platform for all steel sections \u0013 weight, price, and specifications \u0013 "
    const footerLinkRaw = "click here"

    const footerPrefix = sanitizePdfText(footerPrefixRaw)
    const footerLinkText = sanitizePdfText(footerLinkRaw)
    const footerText = `${footerPrefix}${footerLinkText}`

    const footerIconSize = 9
    const footerIconGap = 4
    const footerIconWidth = footerIconGap + footerIconSize


    // Build deep link for app: open selected section + open calculator modal with prefilled values
    const params: string[] = []
    if (typeof data.sectionId === "number" && Number.isFinite(data.sectionId)) {
      params.push(`sid=${encodeURIComponent(String(data.sectionId))}`)
    }
    if (data.sectionType) {
      params.push(`type=${encodeURIComponent(data.sectionType)}`)
    }
    if (typeof data.variantIndex === "number" && Number.isFinite(data.variantIndex)) {
      params.push(`vi=${encodeURIComponent(String(data.variantIndex))}`)
    }
    if (typeof data.sliderValue === "number" && Number.isFinite(data.sliderValue)) {
      params.push(`sv=${encodeURIComponent(String(data.sliderValue))}`)
    }

    // Tell the app to open the calculator modal automatically
    // params.push("cm=1") -> Disabled per user request (only prefill, do not auto-open)

    // Include all calculator modal fields in calcInputs for deep link
    const calcInputs: Record<string, string | number> = {}
    if (typeof data.linearWeightKgPerM === "number" && Number.isFinite(data.linearWeightKgPerM)) {
      calcInputs.linearWeightKgPerM = data.linearWeightKgPerM
    }
    if (shouldShowActualLinearWeight && typeof data.actualLinearWeightKgPerM === "number" && Number.isFinite(data.actualLinearWeightKgPerM)) {
      calcInputs.actualLinearWeightKgPerM = data.actualLinearWeightKgPerM
    }
    if (typeof data.lengthMeters === "number" && Number.isFinite(data.lengthMeters)) {
      calcInputs.lengthMeters = data.lengthMeters
      calcInputs.lengthUnit = "m"
    }
    if (typeof data.unitWeightKg === "number" && Number.isFinite(data.unitWeightKg)) {
      calcInputs.unitWeightKg = data.unitWeightKg
    }
    if (typeof data.required === "number" && Number.isFinite(data.required)) {
      calcInputs.required = data.required
    }
    if (typeof data.unitPricePerPiece === "number" && Number.isFinite(data.unitPricePerPiece)) {
      calcInputs.unitPricePerPiece = data.unitPricePerPiece
    }
    if (typeof data.totalWeightKg === "number" && Number.isFinite(data.totalWeightKg)) {
      calcInputs.totalWeightKg = data.totalWeightKg
    }
    if (typeof data.totalPrice === "number" && Number.isFinite(data.totalPrice)) {
      calcInputs.totalPrice = data.totalPrice
    }
    // Also include pricePerKg for convenience
    if (
      typeof data.unitWeightKg === "number" && Number.isFinite(data.unitWeightKg) &&
      typeof data.unitPricePerPiece === "number" && Number.isFinite(data.unitPricePerPiece) &&
      data.unitWeightKg > 0
    ) {
      const pricePerKg = data.unitPricePerPiece / data.unitWeightKg
      if (Number.isFinite(pricePerKg) && pricePerKg >= 0) {
        calcInputs.pricePerKg = pricePerKg
      }
    }
    if (Object.keys(calcInputs).length > 0) {
      const encoded = base64UrlEncodeUtf8(JSON.stringify(calcInputs))
      params.push(`i=${encoded}`)
    }

    const query = params.join("&")
    const targetUrl = query ? `${BASE_APP_URL}?${query}` : BASE_APP_URL
    const clickUrl = query ? `${BASE_SITE_URL}/open?${query}` : `${BASE_SITE_URL}/open`


    // Lower error correction => fewer modules => less dense QR (easier to scan)
    const qrModules = buildQrModules(targetUrl, "L")
    const qrGap = 10

    // Keep QR physical size consistent with sections PDF (fixed 64 points)
    const qrSize = 64
    const footerMargin = 32
    const qrX = width - footerMargin - qrSize

    const footerSize = 9
    const footerPrefixWidth = font.widthOfTextAtSize(footerPrefix, footerSize)
    const footerLinkTextWidth = font.widthOfTextAtSize(footerLinkText, footerSize)
    const footerWidth = font.widthOfTextAtSize(footerText, footerSize) + footerIconWidth
    const footerY = footerMargin

    const footerTextAreaWidth = qrModules
      ? Math.max(0, width - footerMargin * 2 - (qrSize + qrGap))
      : Math.max(0, width - footerMargin * 2)
    const footerTextAreaX = footerMargin
    const footerTextAreaRight = footerTextAreaX + footerTextAreaWidth

    let footerX = footerTextAreaX + (footerTextAreaWidth - footerWidth) / 2
    const footerMaxX = Math.max(footerTextAreaX, footerTextAreaRight - footerWidth)
    footerX = Math.max(footerTextAreaX, footerX)
    footerX = Math.min(footerMaxX, footerX)
    if (!Number.isFinite(footerX)) footerX = footerTextAreaX

    // رفع الـ QR code قليلاً عن الحافة السفلية (20 بدلاً من 8) لتجنب القص في بعض الطابعات
    const qrY = qrModules ? Math.max(20, footerY - (qrSize - footerSize) / 2) : 0

    page.drawText(footerText, {
      x: footerX,
      y: footerY,
      size: footerSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })

    drawClickIndicator(
      page,
      footerX + footerPrefixWidth + footerLinkTextWidth + footerIconGap,
      footerY - 1,
      footerIconSize,
      rgb(0.4, 0.4, 0.4),
    )

    if (qrModules) {
      drawQrCode(page, qrModules, qrX, qrY, qrSize)
    }

    try {
      const pageRef = (page as any)?.ref ?? (page as any)?.node?.ref

      const linkTextWidth = footerLinkTextWidth

      const clickPaddingX = 6
      const clickPaddingY = 6

      const maxClickX2 = qrModules ? qrX - 2 : width

      const clickX1 = Math.max(0, footerX + footerPrefixWidth - clickPaddingX)
      const clickX2 = Math.min(
        maxClickX2,
        footerX + footerPrefixWidth + linkTextWidth + footerIconWidth + clickPaddingX,
      )
      const clickY1 = Math.max(0, footerY - clickPaddingY)
      const clickY2 = Math.min(height, footerY + footerSize + clickPaddingY)

      const clickAnnotationDict: Record<string, any> = {
        Type: PDFName.of("Annot"),
        Subtype: PDFName.of("Link"),
        Rect: [Math.round(clickX1), Math.round(clickY1), Math.round(clickX2), Math.round(clickY2)],
        Border: [0, 0, 0],
        A: {
          S: PDFName.of("URI"),
          // Use https:// link for maximum PDF viewer compatibility
          URI: PDFString.of(clickUrl),
        },
      }

      if (pageRef) {
        clickAnnotationDict.P = pageRef
      }

      const clickRef = pdfDoc.context.register(pdfDoc.context.obj(clickAnnotationDict))
      page.node.addAnnot(clickRef)

      if (qrModules) {
        const qrAnnotationDict: Record<string, any> = {
          Type: PDFName.of("Annot"),
          Subtype: PDFName.of("Link"),
          Rect: [
            Math.round(qrX),
            Math.round(qrY),
            Math.round(qrX + qrSize),
            Math.round(qrY + qrSize),
          ],
          Border: [0, 0, 0],
          A: {
            S: PDFName.of("URI"),
            URI: PDFString.of(targetUrl),
          },
        }

        if (pageRef) {
          qrAnnotationDict.P = pageRef
        }

        const qrRef = pdfDoc.context.register(pdfDoc.context.obj(qrAnnotationDict))
        page.node.addAnnot(qrRef)
      }
    } catch (error) {
      console.warn("[calculator-pdf] failed to add footer link annotation", error)
    }
  } catch (error) {
    console.warn("[calculator-pdf] failed to add footer", error)
  }

  const pdfBytes = await pdfDoc.save()
  const buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
  const pdfBase64 = encode(buffer)

  const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory

  // في بعض المنصات (مثل الويب) قد لا تكون مجلدات النظام متاحة
  // في هذه الحالة نعيد data URL بدلاً من رمي خطأ
  if (!dir) {
    return `data:application/pdf;base64,${pdfBase64}`
  }

  const baseName = data.fileBaseName || `calculator-order-${Date.now()}`
  const safeName = String(baseName).replace(/[^a-zA-Z0-9._&-]/g, "_") + ".pdf"
  const fileUri = dir + safeName

  await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
    encoding: "base64" as any,
  })

  return fileUri
}
