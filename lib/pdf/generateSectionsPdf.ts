import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from "pdf-lib"
import * as FileSystem from "expo-file-system/legacy"
import { Asset } from "expo-asset"
import { decode, encode } from "base64-arraybuffer"

import type { SectionCartItem } from "../../types/cart"
import { GROUPS, LABELS } from "../sectionInfoSchema"
import { getLocalAssetModuleId } from "../localAssets"

const PDF_HEADER_TITLE = "Iron & Metal"
const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 32

const BASE_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://iron-metal.net"

const SECTIONS_PDF_IMAGE_DEBUG = false

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
    console.warn("[sections-pdf] failed to generate QR modules", error)
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

function drawQrCode(
  page: any,
  modules: boolean[][],
  x: number,
  y: number,
  size: number,
): void {
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

function extractCodeToken(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim().toLowerCase().split(/\s+/)[0] || ""
}

function resolveFlagByCode(code: string, flags: Record<string, any>) {
  if (!code) return null
  return flags[code] ?? null
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

// pdf-lib مع خطوط StandardFonts (WinAnsi) لا تدعم رموز الأس مثل ² ³ ⁴
// وبعض محارف التحكم (0x00-0x1F) غير قابلة للترميز أصلاً
// لذلك نزيلها/نستبدلها قبل الرسم داخل الـ PDF فقط حتى لا يحدث خطأ
function sanitizePdfText(text: string): string {
  return text
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/⁴/g, "4")
    // إزالة محارف التحكم غير القابلة للترميز في WinAnsi (باستثناء \n إن وُجد)
    .replace(/[\u0000-\u0008\u000B-\u001F]/g, " ")
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

    // للملفات المحلية أو مسار asset:/ نستخدم expo-file-system مع base64
    // المحاولة الأولى: القراءة مباشرة من الـ URI (file:/, asset:/، أو resource مثل assets_icons_hinfo)
    const uriCandidates = (() => {
      const candidates: string[] = [uri]
      if (uri.includes("%25")) {
        const once = uri.replace(/%25([0-9a-fA-F]{2})/g, "%$1")
        if (once !== uri) candidates.push(once)
      }
      return Array.from(new Set(candidates))
    })()

    for (const candidate of uriCandidates) {
      try {
        const base64 = await FileSystem.readAsStringAsync(candidate, {
          encoding: "base64" as any,
        })
        return new Uint8Array(decode(base64) as ArrayBuffer)
      } catch {
        // ignore
      }
    }

    // المحاولة الثانية: على أندرويد قد يكون uri اسم مورد داخلي مثل assets_icons_hinfo
    // في هذه الحالة نحاول نسخ المورد إلى ملف حقيقي داخل cache ثم نقرأه كـ base64
    const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory
    if (!dir || !(FileSystem as any).copyAsync) {
      return null
    }

    for (const candidate of uriCandidates) {
      const safeName = String(candidate).replace(/[^a-zA-Z0-9._-]/g, "_")
      const target = `${dir}pdf-img-${safeName}`

      try {
        await (FileSystem as any).copyAsync({ from: candidate, to: target })
        const base64Copied = await FileSystem.readAsStringAsync(target, {
          encoding: "base64" as any,
        })
        return new Uint8Array(decode(base64Copied) as ArrayBuffer)
      } catch {
        // ignore
      }
    }

    if (SECTIONS_PDF_IMAGE_DEBUG) {
      console.warn("[sections-pdf] failed to read image uri", uri)
    }
    return null
  } catch (error) {
    if (SECTIONS_PDF_IMAGE_DEBUG) {
      console.warn("[sections-pdf] failed to read image uri", uri, error)
    }
    return null
  }
}

async function drawImageDebugPlaceholder(
  pdfDoc: PDFDocument,
  page: any,
  yStart: number,
  infoRef: string,
  uri: string | null,
  stage: string,
): Promise<number> {
  try {
    const debugFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const raw = `[debug:image] ${stage} info=${infoRef || "-"} uri=${uri || "-"}`
    const text = sanitizePdfText(raw).slice(0, 180)
    const y = yStart - 10
    page.drawText(text, {
      x: MARGIN,
      y,
      size: 7,
      font: debugFont,
      color: rgb(1, 0, 0),
    })
    return y - 14
  } catch {
    return yStart
  }
}

async function embedInfoImage(
  pdfDoc: PDFDocument,
  page: any,
  infoRef: string,
  yStart: number,
): Promise<number> {
  if (!infoRef) return yStart

  try {
    let uri: string | null = null

    // إذا كانت القيمة مسارًا مباشرًا (من إصدارات سابقة: file:/asset:/)
    if (
      infoRef.startsWith("file:") ||
      infoRef.startsWith("asset:") ||
      infoRef.startsWith("content:") ||
      isAbsoluteLocalFilePath(infoRef)
    ) {
      uri = normalizeToFileUri(infoRef)
    } else {
      // القيمة الجديدة هي مسار أيقونة مثل /icons/h-info.png
      const moduleId = getLocalAssetModuleId(infoRef)
      if (!moduleId) {
        return await drawImageDebugPlaceholder(pdfDoc, page, yStart, infoRef, null, "no-module")
      }

      const asset = Asset.fromModule(moduleId)
      if (!asset.localUri && asset.downloadAsync) {
        try {
          await asset.downloadAsync()
        } catch (error) {
          if (SECTIONS_PDF_IMAGE_DEBUG) {
            console.warn("[sections-pdf] failed to download asset", infoRef, error)
          }
          return SECTIONS_PDF_IMAGE_DEBUG
            ? await drawImageDebugPlaceholder(pdfDoc, page, yStart, infoRef, null, "download-error")
            : yStart
        }
      }

      uri = asset.localUri ?? asset.uri ?? null
    }

    if (!uri) {
      return SECTIONS_PDF_IMAGE_DEBUG
        ? await drawImageDebugPlaceholder(pdfDoc, page, yStart, infoRef, null, "no-uri")
        : yStart
    }

    const bytes = await loadImageBytesFromUri(uri)
    if (!bytes) {
      return SECTIONS_PDF_IMAGE_DEBUG
        ? await drawImageDebugPlaceholder(pdfDoc, page, yStart, infoRef, uri, "no-bytes")
        : yStart
    }

    let image
    try {
      // نحاول أولاً كـ PNG
      image = await (pdfDoc as any).embedPng(bytes)
    } catch {
      image = await (pdfDoc as any).embedJpg(bytes)
    }

    const { width } = page.getSize()
    const maxWidth = Math.max(0, width - MARGIN * 2)
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
    const y = yStart - imgHeight

    page.drawImage(image, {
      x,
      y,
      width: imgWidth,
      height: imgHeight,
    })

    return y - 10
  } catch (error) {
    if (SECTIONS_PDF_IMAGE_DEBUG) {
      console.warn("[sections-pdf] failed to embed info image", infoRef, error)
      return await drawImageDebugPlaceholder(pdfDoc, page, yStart, infoRef, null, "exception")
    }
    return yStart
  }
}

export async function generateSectionsPdf(items: SectionCartItem[]): Promise<string> {
  if (!items.length) {
    throw new Error("No sections to export")
  }

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let headerLogo: any = null
  try {
    headerLogo = await embedImageFromAsset(pdfDoc, require("../../assets/icons/logo512x512.png"))
  } catch {
    headerLogo = null
  }

  const flagCache = new Map<string, any>()
  const getFlagImageForCode = async (code: string): Promise<any | null> => {
    const normalized = extractCodeToken(code)
    if (!normalized) return null

    if (flagCache.has(normalized)) {
      return flagCache.get(normalized) ?? null
    }

    const moduleId = getLocalAssetModuleId(`/icons/${normalized}.png`)
    if (!moduleId) {
      flagCache.set(normalized, null)
      return null
    }

    const embedded = await embedImageFromAsset(pdfDoc, moduleId)
    flagCache.set(normalized, embedded)
    return embedded
  }

  for (let index = 0; index < items.length; index++) {
    const item = items[index]

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
    const { width, height } = page.getSize()

    let y = height - MARGIN - 34

    // العنوان العلوي Iron & Metal في المنتصف
    const headerSize = 16
    const headerText = sanitizePdfText(PDF_HEADER_TITLE)
    const headerTextWidth = fontBold.widthOfTextAtSize(headerText, headerSize)
    const headerLogoHeight = 34
    const headerLogoGap = 8
    const headerLogoWidth =
      headerLogo && typeof headerLogo.width === "number" && typeof headerLogo.height === "number" && headerLogo.height
        ? (headerLogoHeight * headerLogo.width) / headerLogo.height
        : 0

    const headerTotalWidth = headerLogoWidth > 0 ? headerLogoWidth + headerLogoGap + headerTextWidth : headerTextWidth
    const headerX = (width - headerTotalWidth) / 2

    if (headerLogo && headerLogoWidth > 0) {
      page.drawImage(headerLogo, {
        x: headerX,
        y: y - (headerLogoHeight - headerSize) / 2 + 2,
        width: headerLogoWidth,
        height: headerLogoHeight,
      })
    }

    page.drawText(headerText, {
      x: headerLogoWidth > 0 ? headerX + headerLogoWidth + headerLogoGap : headerX,
      y,
      size: headerSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    })

    // عنوان القطاع ومعلوماته على اليسار
    y -= 48
    const title = sanitizePdfText(item.title || "Section")
    page.drawText(title, {
      x: MARGIN,
      y,
      size: 16,
      font,
      color: rgb(0.1, 0.1, 0.1),
    })

    y -= 12
    if (item.subtitle) {
      const subtitleText = sanitizePdfText(String(item.subtitle))
      const subtitleSize = 11

      const subtitleCode = extractCodeToken(item.subtitle)
      const flagImage = await getFlagImageForCode(subtitleCode)

      let subtitleX = MARGIN
      if (flagImage && typeof flagImage.width === "number" && typeof flagImage.height === "number" && flagImage.height) {
        const flagHeight = 10
        const flagWidth = (flagHeight * flagImage.width) / flagImage.height
        const flagGap = 4
        const flagY = y + (subtitleSize - flagHeight) / 2 - 2
        if (subtitleX + flagWidth + flagGap <= width - MARGIN) {
          page.drawImage(flagImage, {
            x: subtitleX,
            y: flagY,
            width: flagWidth,
            height: flagHeight,
          })
          subtitleX += flagWidth + flagGap
        }
      }

      page.drawText(subtitleText, {
        x: subtitleX,
        y,
        size: subtitleSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      })
      y -= 12
    }

    if (item.country) {
      const countryText = sanitizePdfText(String(item.country))
      const countrySize = 11

      const countryCode = extractCodeToken(item.country)
      const countryFlag = await getFlagImageForCode(countryCode)

      let countryX = MARGIN
      if (
        countryFlag &&
        typeof countryFlag.width === "number" &&
        typeof countryFlag.height === "number" &&
        countryFlag.height
      ) {
        const flagHeight = 10
        const flagWidth = (flagHeight * countryFlag.width) / countryFlag.height
        const flagGap = 4
        const flagY = y + (countrySize - flagHeight) / 2 - 2
        if (countryX + flagWidth + flagGap <= width - MARGIN) {
          page.drawImage(countryFlag, {
            x: countryX,
            y: flagY,
            width: flagWidth,
            height: flagHeight,
          })
          countryX += flagWidth + flagGap
        }
      }

      page.drawText(countryText, {
        x: countryX,
        y,
        size: countrySize,
        font,
        color: rgb(0.35, 0.35, 0.35),
      })
      y -= 16
    }

    // صورة المقطع في المنتصف إن وُجدت
    let afterImageY = y
    if (item.info) {
      afterImageY = await embedInfoImage(pdfDoc, page, item.info, y)
    }

    y = afterImageY - 4

    // بناء صفوف الجدول مثل نسخة الويب
    const rows: Array<{ label: string; value: string }> = []
    GROUPS.forEach((g) => {
      g.rows.forEach((r) => {
        const v = (item.data as any)?.[r.key]
        if (v == null || v === "") return
        const label = sanitizePdfText(LABELS[r.key] || r.key)
        const value = sanitizePdfText(`${v} ${r.unit || ""}`.trim())
        rows.push({ label, value })
      })
    })

    if (rows.length) {
      const headerHeight = 18
      const rowHeight = 14
      const tableTop = y - headerHeight
      const tableWidth = width - MARGIN * 2
      const col1Width = tableWidth * 0.5

      // خلفية الهيدر
      page.drawRectangle({
        x: MARGIN,
        y: tableTop,
        width: tableWidth,
        height: headerHeight,
        color: rgb(0.94, 0.94, 0.94),
      })

      const headerY = tableTop + headerHeight / 2 - 4
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

      let rowY = tableTop - 4

      rows.forEach((row, rowIndex) => {
        rowY -= rowHeight

        // صفوف بخلفية فاتحة متناوبة
        if (rowIndex % 2 === 0) {
          page.drawRectangle({
            x: MARGIN,
            y: rowY - 2,
            width: tableWidth,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          })
        }

        page.drawText(row.label, {
          x: MARGIN + 4,
          y: rowY,
          size: 9,
          font,
          color: rgb(0.35, 0.35, 0.35),
        })

        page.drawText(row.value, {
          x: MARGIN + col1Width + 4,
          y: rowY,
          size: 9,
          font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })
    }

    // تذييل الصفحة مع رابط قابل للنقر مثل نسخة الويب
    const footerPrefixRaw =
      "Free platform for all steel sections \u0013 weight, price, and specifications \u0013 "
    const footerLinkRaw = "click here"

    const footerPrefix = sanitizePdfText(footerPrefixRaw)
    const footerLinkText = sanitizePdfText(footerLinkRaw)
    const footerText = `${footerPrefix}${footerLinkText}`

    const footerIconSize = 9
    const footerIconGap = 4
    const footerIconWidth = footerIconGap + footerIconSize

    // إعداد رابط عميق يفتح نفس القطاع ونفس قيمة السلايدر على الموقع إن توفرت البيانات
    const params: string[] = []
    if (item.sectionId != null) params.push(`sid=${encodeURIComponent(String(item.sectionId))}`)
    if (item.sectionType) params.push(`type=${encodeURIComponent(item.sectionType)}`)
    if (typeof item.variantIndex === "number" && Number.isFinite(item.variantIndex)) {
      params.push(`vi=${encodeURIComponent(String(item.variantIndex))}`)
    }
    if (typeof item.sliderValue === "number" && Number.isFinite(item.sliderValue)) {
      params.push(`sv=${encodeURIComponent(String(item.sliderValue))}`)
    }

    const query = params.join("&")
    const targetUrl = query ? `${BASE_SITE_URL}/?${query}` : `${BASE_SITE_URL}/`

    const qrTargetUrl = targetUrl

    const qrModules = buildQrModules(qrTargetUrl)
    const qrSize = 64
    const qrGap = 10
    const qrX = width - MARGIN - qrSize

    const footerSize = 9
    const footerPrefixWidth = font.widthOfTextAtSize(footerPrefix, footerSize)
    const footerLinkTextWidth = font.widthOfTextAtSize(footerLinkText, footerSize)
    const footerWidth = font.widthOfTextAtSize(footerText, footerSize) + footerIconWidth
    const footerY = MARGIN

    const footerTextAreaWidth = qrModules
      ? Math.max(0, width - MARGIN * 2 - (qrSize + qrGap))
      : Math.max(0, width - MARGIN * 2)
    const footerTextAreaX = MARGIN
    const footerTextAreaRight = footerTextAreaX + footerTextAreaWidth

    let footerX = footerTextAreaX + (footerTextAreaWidth - footerWidth) / 2
    const footerMaxX = Math.max(footerTextAreaX, footerTextAreaRight - footerWidth)
    footerX = Math.max(footerTextAreaX, footerX)
    footerX = Math.min(footerMaxX, footerX)
    if (!Number.isFinite(footerX)) footerX = footerTextAreaX

    const qrY = qrModules ? Math.max(8, footerY - (qrSize - footerSize) / 2) : 0

    // رسم النص الكامل أولاً (مثل الويب)
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

    // إضافة Link annotation على كامل سطر الفوتر (بما يشمل "click here") مع حماية كاملة من الأخطاء
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
        Rect: [
          Math.round(clickX1),
          Math.round(clickY1),
          Math.round(clickX2),
          Math.round(clickY2),
        ],
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
      // في حال فشل إنشاء الرابط لا نمنع إنشاء الـ PDF نفسه
      console.warn("[sections-pdf] failed to add footer link annotation", error)
    }
  }

  const pdfBytes = await pdfDoc.save()
  const baseName = items.length > 1 ? "Iron&Metal_Sections" : items[0].title || "section"
  const safeName = String(baseName).replace(/[^a-zA-Z0-9._&-]/g, "_") + ".pdf"

  const buffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  )
  const pdfBase64 = encode(buffer)

  const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory

  // على بعض المنصات (مثل الويب) قد تكون مجلدات النظام غير متاحة
  // في هذه الحالة نعيد data URL بدلاً من رمي خطأ!
  if (!dir) {
    return `data:application/pdf;base64,${pdfBase64}`
  }

  const fileUri = dir + safeName

  await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
    encoding: "base64" as any,
  })

  return fileUri
}
