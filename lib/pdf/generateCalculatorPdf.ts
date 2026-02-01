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

function sanitizePdfText(text: string): string {
  return text.replace(/[\u0000-\u001F]/g, " ")
}

function buildQrModules(value: string): boolean[][] | null {
  try {
    const QRCode = require("qrcode-terminal/vendor/QRCode")
    const QRErrorCorrectLevel = require("qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel")

    const qr = new QRCode(-1, QRErrorCorrectLevel.M)
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

  const marginX = 50
  let y = height - 32 - 34

  const purple = rgb(43 / 255, 31 / 255, 93 / 255)
  const orange = rgb(240 / 255, 140 / 255, 33 / 255)
  const gray = rgb(0.25, 0.25, 0.25)

  const companyName = data.companyName ?? "Iron & Metal"
  const companyExtra = data.companyExtra ?? ""
  const orderTitle = data.orderTitle || "THE ORDER"
  const orderDateLabel = data.orderDateLabel || "The order Date"
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
  y -= 18
  if (companyExtra.trim().length > 0) {
    page.drawText(companyExtra, {
      x: companyNameX,
      y,
      size: 10,
      font,
      color: gray,
    })
  }

  // Header: order date (right)
  const dateLabelSize = 9
  const dateValueSize = 11
  const dateLabelWidth = font.widthOfTextAtSize(orderDateLabel, dateLabelSize)
  const dateValueWidth = boldFont.widthOfTextAtSize(orderDateValue, dateValueSize)
  const rightX = width - marginX - Math.max(dateLabelWidth, dateValueWidth)

  const dateTopY = height - 32 - 34
  page.drawText(orderDateLabel, {
    x: rightX,
    y: dateTopY,
    size: dateLabelSize,
    font,
    color: gray,
  })
  page.drawText(orderDateValue, {
    x: rightX,
    y: dateTopY - 14,
    size: dateValueSize,
    font: boldFont,
    color: gray,
  })

  // THE ORDER badge
  const badgeWidth = 140
  const badgeHeight = 32
  const badgeX = width - marginX - badgeWidth
  const badgeY = dateTopY - 50

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: purple,
  })

  const titleWidth = boldFont.widthOfTextAtSize(orderTitle, 14)
  page.drawText(orderTitle, {
    x: badgeX + (badgeWidth - titleWidth) / 2,
    y: badgeY + 9,
    size: 14,
    font: boldFont,
    color: rgb(1, 1, 1),
  })

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
        const moduleId = getLocalAssetModuleId(path)
        if (!moduleId) return startY

        image = await embedImageFromAsset(pdfDoc, moduleId)
      }

      if (!image) return startY

      const imgWidth = 140
      const scale = imgWidth / image.width
      const imgHeight = image.height * scale

      const x = marginX
      const yImg = startY - imgHeight

      page.drawImage(image, {
        x,
        y: yImg,
        width: imgWidth,
        height: imgHeight,
      })

      return yImg - 24
    } catch (error) {
      console.warn("[calculator-pdf] failed to embed sector image", error)
      return startY
    }
  }

  y = await embedSectorImageIfAvailable(badgeY - 40)

  // Summary card
  const cardX = marginX
  const cardWidth = width - marginX * 2
  const summaryHeaderHeight = 24
  const rowHeight = 18

  const summaryHeaderY = y - summaryHeaderHeight

  // Summary header background
  page.drawRectangle({
    x: cardX,
    y: summaryHeaderY,
    width: cardWidth,
    height: summaryHeaderHeight,
    color: orange,
  })

  page.drawText("Summary", {
    x: cardX + 12,
    y: summaryHeaderY + 7,
    size: 12,
    font: boldFont,
    color: rgb(1, 1, 1),
  })

  const shouldShowActualLinearWeight =
    typeof data.actualLinearWeightKgPerM === "number" &&
    Number.isFinite(data.actualLinearWeightKgPerM) &&
    Math.abs(data.actualLinearWeightKgPerM - data.linearWeightKgPerM) > 1e-9

  const leftCol = [
    { label: "Linear Weight", value: `${safeNum(data.linearWeightKgPerM)} kg/m` },
    ...(shouldShowActualLinearWeight
      ? [{ label: "Actual Linear Weight", value: `${safeNum(data.actualLinearWeightKgPerM)} kg/m` }]
      : []),
    { label: "Unit Weight", value: `${safeNum(data.unitWeightKg)} kg` },
    { label: "Total Weight", value: `${safeNum(data.totalWeightKg)} kg` },
  ]

  const rightCol = [
    { label: "Length", value: `${safeNum(data.lengthMeters)} m` },
    { label: "Required", value: safeNum(data.required, 0) },
    { label: "Total", value: safeNum(data.totalPrice) },
  ]

  const rowsCount = Math.max(leftCol.length, rightCol.length)
  const summaryBodyHeight = Math.max(76, (rowsCount - 1) * rowHeight + 40)

  const summaryBodyY = summaryHeaderY - summaryBodyHeight
  page.drawRectangle({
    x: cardX,
    y: summaryBodyY,
    width: cardWidth,
    height: summaryBodyHeight,
    color: rgb(1, 1, 1),
  })
  const colWidth = cardWidth / 2

  for (let i = 0; i < rowsCount; i += 1) {
    const rowY = summaryBodyY + summaryBodyHeight - 16 - i * rowHeight
    const l = leftCol[i]
    const r = rightCol[i]

    if (l) {
      page.drawText(l.label, {
        x: cardX + 8,
        y: rowY,
        size: 9,
        font,
        color: rgb(0.45, 0.45, 0.45),
      })
      const leftValueWidth = boldFont.widthOfTextAtSize(l.value, 9)
      page.drawText(l.value, {
        x: cardX + colWidth - 8 - leftValueWidth,
        y: rowY,
        size: 9,
        font: boldFont,
        color: gray,
      })
    }

    if (r) {
      page.drawText(r.label, {
        x: cardX + colWidth + 8,
        y: rowY,
        size: 9,
        font,
        color: rgb(0.45, 0.45, 0.45),
      })
      const rightValueWidth = boldFont.widthOfTextAtSize(r.value, 9)
      page.drawText(r.value, {
        x: cardX + cardWidth - 8 - rightValueWidth,
        y: rowY,
        size: 9,
        font: boldFont,
        color: gray,
      })
    }
  }

  // Move below summary card
  y = summaryBodyY - 40

  // Items table header
  const tableX = cardX
  const tableWidth = cardWidth
  const headerRowHeight = 22

  const headers = ["#", "Description", "Qty", "Unit", "Weight (kg)"]
  const colWidths = [24, tableWidth - (24 + 40 + 40 + 70), 40, 40, 70]

  let colX = tableX
  headers.forEach((header, index) => {
    const bg = index === 1 ? orange : purple
    page.drawRectangle({
      x: colX,
      y: y - headerRowHeight,
      width: colWidths[index],
      height: headerRowHeight,
      color: bg,
    })
    const textWidth = boldFont.widthOfTextAtSize(header, 9)
    page.drawText(header, {
      x: colX + (colWidths[index] - textWidth) / 2,
      y: y - headerRowHeight + 7,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    colX += colWidths[index]
  })

  // Single row of data
  const dataRowY = y - headerRowHeight - 18

  colX = tableX

  const description = data.lengthMeters && data.linearWeightKgPerM
    ? `Linear Item — ${safeNum(data.lengthMeters)} m, ${safeNum(data.linearWeightKgPerM)} kg/m`
    : "Linear Item"

  const rowValues = [
    "1",
    description,
    safeNum(data.required, 0),
    "pcs",
    safeNum(data.unitWeightKg),
  ]

  rowValues.forEach((value, index) => {
    const widthForCol = colWidths[index]
    page.drawText(value, {
      x: colX + 6,
      y: dataRowY,
      size: 9,
      font,
      color: gray,
    })
    page.drawRectangle({
      x: colX,
      y: dataRowY - 4,
      width: widthForCol,
      height: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    })
    colX += widthForCol
  })

  // Totals row
  const totalLabel = "Total Weight (kg):"
  const totalLabelSize = 10
  const totalLabelY = dataRowY - 40

  page.drawText(totalLabel, {
    x: cardX,
    y: totalLabelY,
    size: totalLabelSize,
    font,
    color: gray,
  })

  const totalValueText = safeNum(data.totalWeightKg)
  const totalValueWidth = boldFont.widthOfTextAtSize(totalValueText, totalLabelSize)
  page.drawText(totalValueText, {
    x: cardX + 150,
    y: totalLabelY,
    size: totalLabelSize,
    font: boldFont,
    color: gray,
  })

  try {
    const footerPrefixRaw = "Free platform for all steel sections \u0013 weight, price, and specifications \u0013 "
    const footerLinkRaw = "click here"

    const footerPrefix = sanitizePdfText(footerPrefixRaw)
    const footerLinkText = sanitizePdfText(footerLinkRaw)
    const footerText = `${footerPrefix}${footerLinkText}`

    const footerIconSize = 9
    const footerIconGap = 4
    const footerIconWidth = footerIconGap + footerIconSize

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

    const query = params.join("&")
    const targetUrl = query ? `${BASE_SITE_URL}/?${query}` : `${BASE_SITE_URL}/`
    const qrTargetUrl = targetUrl

    const qrModules = buildQrModules(qrTargetUrl)
    const qrSize = 64
    const qrGap = 10
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

    const qrY = qrModules ? Math.max(8, footerY - (qrSize - footerSize) / 2) : 0

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
          URI: PDFString.of(targetUrl),
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
