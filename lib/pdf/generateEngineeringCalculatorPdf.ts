import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from "pdf-lib"
import * as FileSystem from "expo-file-system/legacy"
import { Asset } from "expo-asset"
import { decode, encode } from "base64-arraybuffer"

import { getLocalAssetModuleId } from "../localAssets"

export type EngineeringPdfRow =
  | { type: "section"; label: string }
  | { type: "row"; label: string; value: string }

export type EngineeringCalculatorPdfPayload = {
  title: string
  subtitle?: string
  rows: EngineeringPdfRow[]
  currencyCode?: string
  fileBaseName?: string
  sectorImg?: string | null
}

const PDF_HEADER_TITLE = "Iron & Metal"
const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 32

const BASE_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://iron-metal.net"

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
      return null
    }
  } catch {
    return null
  }
}

async function embedImageFromAsset(pdfDoc: PDFDocument, moduleId: number) {
  const asset = Asset.fromModule(moduleId)

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
  } catch {
    return null
  }
}

function drawQrCode(page: any, modules: boolean[][], x: number, y: number, size: number): void {
  const moduleCount = modules.length
  if (!moduleCount) return

  const quietZone = 4
  const total = moduleCount + quietZone * 2
  const cell = size / total

  page.drawRectangle({ x, y, width: size, height: size, color: rgb(1, 1, 1) })

  const yTop = y + size

  for (let row = 0; row < moduleCount; row++) {
    const rowData = modules[row]
    if (!rowData) continue

    for (let col = 0; col < moduleCount; col++) {
      if (!rowData[col]) continue

      const px = x + (col + quietZone) * cell
      const py = yTop - (row + quietZone + 1) * cell

      page.drawRectangle({ x: px, y: py, width: cell, height: cell, color: rgb(0, 0, 0) })
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

async function embedSectorImage(pdfDoc: PDFDocument, page: any, path: string, yStart: number): Promise<number> {
  const normalized = String(path || "").trim()
  if (!normalized) return yStart

  try {
    let image: any = null

    if (
      normalized.startsWith("file:") ||
      normalized.startsWith("asset:") ||
      normalized.startsWith("content:") ||
      normalized.startsWith("http:") ||
      normalized.startsWith("https:") ||
      isAbsoluteLocalFilePath(normalized)
    ) {
      const bytes = await loadImageBytesFromUri(normalizeToFileUri(normalized))
      if (!bytes) return yStart
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
      const moduleId = getLocalAssetModuleId(normalized)
      if (!moduleId) return yStart
      image = await embedImageFromAsset(pdfDoc, moduleId)
    }

    if (!image) return yStart

    const { width } = page.getSize()
    const maxWidth = Math.max(0, width - MARGIN * 2)
    const targetWidth = Math.min(140, maxWidth)
    const scale = targetWidth / image.width
    const imgWidth = targetWidth
    const imgHeight = image.height * scale

    const x = (width - imgWidth) / 2
    const y = yStart - imgHeight

    page.drawImage(image, { x, y, width: imgWidth, height: imgHeight })

    return y - 12
  } catch {
    return yStart
  }
}

export async function generateEngineeringCalculatorPdf(data: EngineeringCalculatorPdfPayload): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let headerLogo: any = null
  try {
    headerLogo = await embedImageFromAsset(pdfDoc, require("../../assets/icons/logo512x512.png"))
  } catch {
    headerLogo = null
  }

  const headerSize = 16
  const headerLogoHeight = 34
  const headerLogoGap = 8

  const pages: any[] = []
  const newPage = () => {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
    pages.push(page)
    return page
  }

  let page = newPage()
  let { width, height } = page.getSize()

  let y = height - MARGIN - headerLogoHeight

  const headerText = sanitizePdfText(PDF_HEADER_TITLE)
  const headerTextWidth = fontBold.widthOfTextAtSize(headerText, headerSize)
  const headerLogoWidth =
    headerLogo && typeof headerLogo.width === "number" && typeof headerLogo.height === "number" && headerLogo.height
      ? (headerLogoHeight * headerLogo.width) / headerLogo.height
      : 0

  const headerTotalWidth = headerLogoWidth > 0 ? headerLogoWidth + headerLogoGap + headerTextWidth : headerTextWidth
  const headerX = (width - headerTotalWidth) / 2

  if (headerLogo && headerLogoWidth > 0) {
    page.drawImage(headerLogo, {
      x: headerX,
      y: y + 2,
      width: headerLogoWidth,
      height: headerLogoHeight,
    })
  }

  page.drawText(headerText, {
    x: headerLogoWidth > 0 ? headerX + headerLogoWidth + headerLogoGap : headerX,
    y: y + 10,
    size: headerSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  })

  const headerDateText = formatDateEn(new Date())
  const headerDateSize = 11
  const headerDateWidth = fontBold.widthOfTextAtSize(headerDateText, headerDateSize)
  page.drawText(headerDateText, {
    x: width - MARGIN - headerDateWidth,
    y: y + 10 + (headerSize - headerDateSize) / 2,
    size: headerDateSize,
    font: fontBold,
    color: rgb(0.35, 0.35, 0.35),
  })

  y -= 34

  const title = sanitizePdfText(data.title || "Engineering Calculator")
  page.drawText(title, {
    x: MARGIN,
    y,
    size: 16,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  })

  y -= 14

  if (data.subtitle) {
    const subtitle = sanitizePdfText(data.subtitle)
    page.drawText(subtitle, {
      x: MARGIN,
      y,
      size: 11,
      font,
      color: rgb(0.35, 0.35, 0.35),
    })
    y -= 16
  }

  if (data.sectorImg) {
    y = await embedSectorImage(pdfDoc, page, data.sectorImg, y)
  }

  const tableWidth = width - MARGIN * 2
  const col1Width = tableWidth * 0.5

  const headerHeight = 18
  const sectionHeight = 16
  const rowHeight = 14

  const drawTableHeader = (yTop: number) => {
    page.drawRectangle({
      x: MARGIN,
      y: yTop - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.94, 0.94, 0.94),
    })

    const headerY = yTop - headerHeight / 2 - 4

    page.drawText("Property", {
      x: MARGIN + 4,
      y: headerY,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })

    page.drawText("Value", {
      x: MARGIN + col1Width + 4,
      y: headerY,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })

    return yTop - headerHeight - 4
  }

  const startNewPageWithHeader = () => {
    page = newPage()
    ;({ width, height } = page.getSize())
    y = height - MARGIN
    y = drawTableHeader(y)
  }

  y = drawTableHeader(y)

  let zebra = 0
  let lastRowType: "section" | "row" | null = null

  for (const r of data.rows) {
    const minY = MARGIN + 90
    const isResultsSection = r.type === "section" && String(r.label || "").trim().toLowerCase() === "results"
    const sectionGap = isResultsSection && lastRowType === "row" ? 6 : 0
    const requiredHeight = (r.type === "section" ? sectionHeight : rowHeight) + sectionGap
    if (y - requiredHeight < minY) startNewPageWithHeader()

    if (r.type === "section") {
      if (sectionGap) y -= sectionGap
      const label = truncate(r.label, 60)

      page.drawRectangle({
        x: MARGIN,
        y: y - sectionHeight + 2,
        width: tableWidth,
        height: sectionHeight,
        color: rgb(0.92, 0.92, 0.92),
      })

      page.drawText(label, {
        x: MARGIN + 4,
        y: y - sectionHeight / 2 - 4,
        size: 10,
        font: fontBold,
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
        x: MARGIN,
        y: y - rowHeight + 2,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }

    page.drawText(label, {
      x: MARGIN + 4,
      y: y - rowHeight / 2 - 4,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    })

    page.drawText(value, {
      x: MARGIN + col1Width + 4,
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

    const qrTargetUrl = `${BASE_SITE_URL}/`
    const qrModules = buildQrModules(qrTargetUrl)
    const qrSize = 64
    const qrGap = 10
    const qrX = width - MARGIN - qrSize

    const footerSize = 9
    const footerPrefixWidth = font.widthOfTextAtSize(footerPrefix, footerSize)
    const footerLinkTextWidth = font.widthOfTextAtSize(footerLinkText, footerSize)

    const footerIconSize = 9
    const footerIconGap = 4
    const footerIconWidth = footerIconGap + footerIconSize

    const footerWidth = font.widthOfTextAtSize(footerText, footerSize) + footerIconWidth
    const footerY = MARGIN

    const footerTextAreaWidth = qrModules ? Math.max(0, width - MARGIN * 2 - (qrSize + qrGap)) : Math.max(0, width - MARGIN * 2)
    const footerTextAreaX = MARGIN
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

    drawClickIndicator(page, footerX + footerPrefixWidth + footerLinkTextWidth + footerIconGap, footerY - 1, footerIconSize, rgb(0.4, 0.4, 0.4))

    if (qrModules) {
      drawQrCode(page, qrModules, qrX, qrY, qrSize)
    }

    try {
      const pageRef = (page as any)?.ref ?? (page as any)?.node?.ref

      const clickPaddingX = 6
      const clickPaddingY = 6

      const maxClickX2 = qrModules ? qrX - 2 : width

      const clickX1 = Math.max(0, footerX + footerPrefixWidth - clickPaddingX)
      const clickX2 = Math.min(maxClickX2, footerX + footerPrefixWidth + footerLinkTextWidth + footerIconWidth + clickPaddingX)
      const clickY1 = Math.max(0, footerY - clickPaddingY)
      const clickY2 = Math.min(height, footerY + footerSize + clickPaddingY)

      const clickAnnotationDict: Record<string, any> = {
        Type: PDFName.of("Annot"),
        Subtype: PDFName.of("Link"),
        Rect: [Math.round(clickX1), Math.round(clickY1), Math.round(clickX2), Math.round(clickY2)],
        Border: [0, 0, 0],
        A: { S: PDFName.of("URI"), URI: PDFString.of(qrTargetUrl) },
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
          Rect: [Math.round(qrX), Math.round(qrY), Math.round(qrX + qrSize), Math.round(qrY + qrSize)],
          Border: [0, 0, 0],
          A: { S: PDFName.of("URI"), URI: PDFString.of(qrTargetUrl) },
        }

        if (pageRef) {
          qrAnnotationDict.P = pageRef
        }

        const qrRef = pdfDoc.context.register(pdfDoc.context.obj(qrAnnotationDict))
        page.node.addAnnot(qrRef)
      }
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }

  const pdfBytes = await pdfDoc.save()
  const buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
  const pdfBase64 = encode(buffer)

  const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory
  if (!dir) {
    return `data:application/pdf;base64,${pdfBase64}`
  }

  const baseName = data.fileBaseName || `engineering-calculator-${Date.now()}`
  const safeName = String(baseName).replace(/[^a-zA-Z0-9._&-]/g, "_") + ".pdf"
  const fileUri = dir + safeName

  await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
    encoding: "base64" as any,
  })

  return fileUri
}
