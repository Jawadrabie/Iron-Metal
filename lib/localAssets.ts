import { Image } from "react-native"
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system/legacy"

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`)

// خريطة الأيقونات المحلية (لكل حرف نذكر إن كان Icon أو bigImg)
const LOCAL_ASSET_MAP: Record<string, number> = {
  // HP (حرف H) - أيقونات عادية
  "/icons/1.svg": require("../assets/icon/1.png.png"), // HP icon
  "/icons/s-hp1.svg": require("../assets/icon/s-hp1.png.png"), // HP icon
  "/icons/s-hp2.svg": require("../assets/icon/s-hp2.png.png"), // HP icon
  "/icons/s-hp3.svg": require("../assets/icon/s-hp3.png.png"), // HP icon
  "/icons/s-hp4.svg": require("../assets/icon/s-hp1.png.png"), // HP icon
  // HP (حرف H) - bigImg
  "/icons/b-hp1.svg": require("../assets/icon/b-hp1.png"), // HP bigImg
  "/icons/b-hp2.svg": require("../assets/icon/b-hp2.png"), // HP bigImg
  "/icons/b-hp3.svg": require("../assets/icon/b-hp3.png"), // HP bigImg
  "/icons/b-hp4.svg": require("../assets/icon/b-hp1.png"), // HP bigImg

  // IPE (حرف I) - أيقونات عادية
  "/icons/2.svg": require("../assets/icon/2.png.png"), // IPE icon
  "/icons/I1.svg": require("../assets/icon/I1.png"), // IPE icon
  "/icons/I2.svg": require("../assets/icon/I2.png"), // IPE icon
  "/icons/I3.svg": require("../assets/icon/I3.png"), // IPE icon
  "/icons/I4.svg": require("../assets/icon/I4.png"), // IPE icon
  "/icons/ipe.svg": require("../assets/icons/ipe.svg"), // IPE icon (alias)
  // IPE (حرف I) - bigImg
  "/icons/ip1.svg": require("../assets/icon/ip1.png"), // IPE bigImg (PNG on mobile)
  "/icons/ip1-1.svg": require("../assets/icon/ip1.png"), // IPE bigImg (PNG on mobile, alias if used)
  "/icons/ip2.svg": require("../assets/icon/ip2.png"), // IPE bigImg (PNG on mobile)
  "/icons/ip3.svg": require("../assets/icon/ip3.png"), // IPE bigImg (PNG on mobile)
  "/icons/ip4.svg": require("../assets/icon/ip4.png"), // UB icon
  "/icons/JIS_I.svg": require("../assets/icons/JIS_I.svg"), // IPE icon (JIS)
  "/icons/RSJ.svg": require("../assets/icons/RSJ.svg"), // IPE icon (RSJ)
  "/icons/UKB.svg": require("../assets/icons/UKB.svg"), // IPE icon (UKB)

  // U Channel (حرف U) - أيقونات عادية
  "/icons/3.svg": require("../assets/icon/3.1.png"), // U icon (PNG)
  "/icons/u1.svg": require("../assets/icon/u1.png"), // U icon (PNG)
  "/icons/u2.svg": require("../assets/icon/u2.png"), // U icon (PNG)
  "/icons/u3.svg": require("../assets/icon/u3.png"), // U icon (SVG)
  "/icons/u4.svg": require("../assets/icon/u4.png"), // U icon (SVG)
  "/icons/u5.svg": require("../assets/icon/u5.png"), // U icon (SVG)
  // U Channel (حرف U) - bigImg
  "/icons/b-u1.svg": require("../assets/icon/b-u1.png"), // U bigImg
  "/icons/b-u2.svg": require("../assets/icon/b-u2.png"), // U bigImg
  "/icons/b-u3.svg": require("../assets/icon/b-u3.png"), // U bigImg
  "/icons/b-u4.svg": require("../assets/icon/b-u4.png"), // U bigImg
  "/icons/b-u5.svg": require("../assets/icon/b-u5.png"), // U bigImg
  "/icons/b-uc.svg": require("../assets/icons/b-uc.svg"), // U channel bigImg (alias)

  // EA (زاوية حرف L) - أيقونات عادية
  "/icons/4.svg": require("../assets/icon/4.1.png"), // EA icon (PNG)
  "/icons/s-ea.svg": require("../assets/icon/b-ea.png"), // EA small variant uses big PNG
  // EA - bigImg
  "/icons/b-ea.svg": require("../assets/icon/b-ea.png"), // EA bigImg

  // UA (زاوية متساوية) - أيقونات عادية
  "/icons/5.svg": require("../assets/icons/5.svg"), // UA icon
  "/icons/s-ua.svg": require("../assets/icon/b-ua.png"), // UA icon
  // UA - bigImg
  "/icons/b-ua.svg": require("../assets/icon/b-ua.png"), // UA bigImg

  // T Section (حرف T) - أيقونات عادية
  "/icons/6.svg": require("../assets/icon/6.png"), // T icon (SVG, allows filled interior)
  "/icons/s-t.svg": require("../assets/icon/b-t2.png"), // T Equal small icon uses b-t2 PNG (shared with TB symbol)
  "/icons/s-tb.svg": require("../assets/icon/s-t2.png"), // TB variants small icon uses s-t2 PNG
  // T - bigImg
  "/icons/b-t.svg": require("../assets/icon/s-t2.png"), // TB bigImg uses s-t2 PNG
  "/icons/b-t2.svg": require("../assets/icon/b-t2.png"), // T Equal bigImg uses b-t2 PNG

  // SHE (أنبوب مربع) - أيقونات عادية
  "/icons/7.svg": require("../assets/icon/7.png"), // SHE icon (SVG)
  "/icons/s-she.svg": require("../assets/icon/7.png"), // SHE icon (PNG)
  // SHE - bigImg
  "/icons/b-she.svg": require("../assets/icon/b-she.png"), // SHE bigImg (PNG)
  // SHE - PDF-only bigImg override
  "/icons/pdf-b-she.svg": require("../assets/icon/b-she2.png"),

  // RHE (أنبوب مستطيل) - أيقونات عادية
  "/icons/8.svg": require("../assets/icon/8.png"), // RHE icon (PNG)
  "/icons/s-rhe.svg": require("../assets/icon/b-rhe.png"), // RHE icon (PNG)
  // RHE - bigImg
  "/icons/b-rhe.svg": require("../assets/icon/b-rhe.png"), // RHE bigImg (PNG)
  // RHE - PDF-only bigImg override
  "/icons/pdf-b-rhe.svg": require("../assets/icon/b-rhe2.png"),

  // PB (مقطع مسدس) - أيقونات عادية
  "/icons/9.svg": require("../assets/icon/9.png"), // PB icon (PNG)
  "/icons/s-pb.svg": require("../assets/icon/b-pb.png"), // PB icon (PNG)
  // PB - bigImg
  "/icons/b-pb.svg": require("../assets/icon/b-pb.png"), // PB bigImg

  // SB (قضيب مربع) - أيقونات عادية
  "/icons/10.svg": require("../assets/icon/b-sb.png"), // SB icon (PNG)
  "/icons/s-sb.svg": require("../assets/icon/b-sb.png"), // SB icon (PNG)
  // SB - bigImg
  "/icons/b-sb.svg": require("../assets/icon/b-sb.png"), // SB bigImg

  // RB (قضيب دائري) - أيقونات عادية
  "/icons/11.svg": require("../assets/icon/b-rb.png"), // RB icon (PNG)
  "/icons/s-rb.svg": require("../assets/icon/b-rb.png"), // RB icon (PNG)
  // RB - bigImg
  "/icons/b-rb.svg": require("../assets/icon/b-rb.png"), // RB bigImg

  // S (قضيب مسطح) - أيقونات عادية
  "/icons/12.svg": require("../assets/icon/b-sb.png"), // S icon (PNG placeholder)
  "/icons/s-s.svg": require("../assets/icon/b-sb.png"), // S icon (PNG placeholder)
  // S - bigImg
  "/icons/b-s.svg": require("../assets/icons/b-s.svg"), // S bigImg

  // Strip / K - أيقونات عادية
  "/icons/13.svg": require("../assets/icon/b-k.png"), // Strip icon (PNG)
  "/icons/s-k.svg": require("../assets/icon/b-k.png"), // Strip icon (PNG)
  // Strip / K - bigImg (نفس الملف للأيقونة والقسم)
  "/icons/b-k.svg": require("../assets/icon/b-k.png"), // Strip bigImg (PNG)

  // Pipe (حرف P) - أيقونات عادية
  "/icons/i16.svg": require("../assets/icon/i16.png"), // Pipe icon (PNG)
  "/icons/s-pipe.svg": require("../assets/icon/b-pipe.png"), // Pipe icon (PNG)
  // Pipe - bigImg
  "/icons/b-pipe.svg": require("../assets/icon/b-pipe.png"), // Pipe bigImg (PNG)
  // Pipe - PDF-only bigImg overrides
  "/icons/pdf-b-pipe.svg": require("../assets/icon/b-pipe2.png"),
 
  // Z Section - أيقونات عادية
  "/icons/i15.svg": require("../assets/icon/b-z.png"), // Z icon (PNG)
  "/icons/s-z.svg": require("../assets/icon/b-z.png"), // Z icon (PNG)
  // Z - bigImg
  "/icons/b-z.svg": require("../assets/icon/b-z.png"), // Z bigImg (PNG)

  // C Section - أيقونات عادية
  "/icons/i14.svg": require("../assets/icon/b-c.png"), // C icon (PNG)
  "/icons/s-c.svg": require("../assets/icon/b-c.png"), // C icon (PNG)
  // C - bigImg
  "/icons/b-c.svg": require("../assets/icon/b-c.png"), // C bigImg (PNG)

  // أعلام الدول (أيقونات عادية)
  "/icons/eu.png": require("../assets/icons/eu.png"), // EU flag icon
  "/icons/jp.png": require("../assets/icons/jp.png"), // JP flag icon
  "/icons/uk.png": require("../assets/icons/uk.png"), // UK flag icon
  "/icons/us.png": require("../assets/icons/us.png"), // US flag icon
  // Detail info images
  "/icons/h-info.png": require("../assets/icons/h-info.png"), // H section info image
  "/icons/I-info.png": require("../assets/icons/I-info.png"), // I section info image
  "/icons/c-info.png": require("../assets/icons/c-info.png"), // C section info image
  "/icons/le-info.png": require("../assets/icons/le-info.png"), // LE section info image
  "/icons/ln-info.png": require("../assets/icons/ln-info.png"), // LN section info image
  "/icons/o-info.png": require("../assets/icons/o-info.png"), // O section info image
  "/icons/s-info.png": require("../assets/icons/s-info.png"), // S section info image
  "/icons/ss-info.png": require("../assets/icons/ss-info.png"), // SS section info image
  "/icons/t-info.png": require("../assets/icons/t-info.png"), // T section info image
  "/icons/logo.svg": require("../assets/icons/logo.svg"),
  "/icons/IRON&METAL.svg": require("../assets/icons/IRON&METAL.svg"), // Main app bar logo
  "/icons/square I.svg": require("../assets/icons/square I.svg"),
  "/icons/I.svg": require("../assets/icons/I.svg"),
  "/icons/square M.svg": require("../assets/icons/square M.svg"),
  "/icons/M.svg": require("../assets/icons/M.svg"),
  "/icons/&.svg": require("../assets/icons/&.svg"),

  // Calculator Icons
  "/icons/calculators/20.png": require("../assets/icons/calculators/20.png"),
  "/icons/calculators/21.png": require("../assets/icons/calculators/21.png"),
  "/icons/calculators/22.png": require("../assets/icons/calculators/22.png"),
  "/icons/calculators/23.png": require("../assets/icons/calculators/23.png"),
  "/icons/calculators/24.png": require("../assets/icons/calculators/24.png"),
  "/icons/calculators/25.png": require("../assets/icons/calculators/25.png"),
  "/icons/calculators/26.png": require("../assets/icons/calculators/26.png"),
  "/icons/calculators/27.png": require("../assets/icons/calculators/27.png"),
  "/icons/calculators/28.png": require("../assets/icons/calculators/28.png"),
  "/icons/calculators/29.png": require("../assets/icons/calculators/29.png"),
  "/icons/calculators/30.png": require("../assets/icons/calculators/30.png"),
  "/icons/calculators/31.png": require("../assets/icons/calculators/31.png"),
  "/icons/calculators/32.png": require("../assets/icons/calculators/32.png"),
  "/icons/calculators/33.png": require("../assets/icons/calculators/33.png"),
  "/icons/calculators/34.png": require("../assets/icons/calculators/34.png"),
  "/icons/calculators/35.png": require("../assets/icons/calculators/35.png"),
  "/icons/calculators/36.png": require("../assets/icons/calculators/36.png"),
  "/icons/calculators/37.png": require("../assets/icons/calculators/37.png"),
  "/icons/calculators/38.png": require("../assets/icons/calculators/38.png"),
  "/icons/calculators/39.png": require("../assets/icons/calculators/39.png"),
  "/icons/calculators/40.png": require("../assets/icons/calculators/40.png"),
  "/icons/calculators/41.png": require("../assets/icons/calculators/41.png"),
  "/icons/calculators/42.png": require("../assets/icons/calculators/42.png"),
  "/icons/calculators/43.png": require("../assets/icons/calculators/43.png"),
  "/icons/calculators/44.png": require("../assets/icons/calculators/44.png"),
  
  // High-res calculator previews (.1 variants)
  "/icons/calculators/20.1.png": require("../assets/icons/calculators/20.1.png"),
  "/icons/calculators/21.1.png": require("../assets/icons/calculators/21.1.png"),
  "/icons/calculators/22.1.png": require("../assets/icons/calculators/22.1.png"),
  "/icons/calculators/23.1.png": require("../assets/icons/calculators/23.1.png"),
  "/icons/calculators/26.1.png": require("../assets/icons/calculators/26.1.png"),
  "/icons/calculators/28.1.png": require("../assets/icons/calculators/28.1.png"),
  "/icons/calculators/31.1.png": require("../assets/icons/calculators/31.1.png"),
  "/icons/calculators/32.1.png": require("../assets/icons/calculators/32.1.png"),
  "/icons/calculators/33.1.png": require("../assets/icons/calculators/33.1.png"),
  "/icons/calculators/34.1.png": require("../assets/icons/calculators/34.1.png"),
  "/icons/calculators/35.1.png": require("../assets/icons/calculators/35.1.png"),
  "/icons/calculators/37.1.png": require("../assets/icons/calculators/37.1.png"),
  "/icons/calculators/39.1.png": require("../assets/icons/calculators/39.1.png"),
  "/icons/calculators/42.1.png": require("../assets/icons/calculators/42.1.png"),
  "/icons/calculators/44.1.png": require("../assets/icons/calculators/44.1.png"),
  "/icons/calculators/27.1.png": require("../assets/icons/calculators/27.1.png"),

}

export const ALL_LOCAL_ASSET_PATHS = Object.keys(LOCAL_ASSET_MAP)

const getLocalAssetModule = (path?: string | null) => {
  if (!path) return undefined
  return LOCAL_ASSET_MAP[normalizePath(path)]
}

export const getLocalAssetModuleId = (path?: string | null) => getLocalAssetModule(path)

const downloadCache = new Map<string, Promise<void>>()

const ensureAssetDownloaded = (path?: string | null) => {
  const moduleId = getLocalAssetModule(path)
  if (!moduleId) return Promise.resolve()

  const normalized = normalizePath(path!)
  const asset = Asset.fromModule(moduleId)
  if (asset.localUri) return Promise.resolve()

  if (downloadCache.has(normalized)) {
    return downloadCache.get(normalized) as Promise<void>
  }

  const pending = (asset.downloadAsync?.() ?? Promise.resolve(undefined))
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      downloadCache.delete(normalized)
    })

  downloadCache.set(normalized, pending)
  return pending
}

const svgTextCache = new Map<string, Promise<string | null>>()
const persistentSvgCache = new Map<string, Promise<string | null>>()
const SVG_CACHE_DIR = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}svg-cache/` : null
let ensureSvgCacheDirPromise: Promise<string | null> | null = null

const ensureSvgCacheDir = () => {
  if (!SVG_CACHE_DIR) return Promise.resolve(null)
  if (!ensureSvgCacheDirPromise) {
    ensureSvgCacheDirPromise = FileSystem.getInfoAsync(SVG_CACHE_DIR)
      .then(async (info) => {
        if (!info.exists) {
          try {
            await FileSystem.makeDirectoryAsync(SVG_CACHE_DIR, { intermediates: true })
          } catch (error) {
            console.warn("localAssets: failed to create svg cache dir", error)
            return null
          }
        }
        return SVG_CACHE_DIR
      })
      .catch(async () => {
        try {
          await FileSystem.makeDirectoryAsync(SVG_CACHE_DIR, { intermediates: true })
          return SVG_CACHE_DIR
        } catch {
          return null
        }
      })
  }
  return ensureSvgCacheDirPromise
}

const toSafeFileName = (path: string) => normalizePath(path).replace(/[^a-zA-Z0-9._-]/g, "_")
const getSvgCacheFilePath = (path: string) => {
  if (!SVG_CACHE_DIR) return null
  return `${SVG_CACHE_DIR}${toSafeFileName(path)}`
}

const isSvgPath = (path?: string | null) => {
  if (!path) return false
  return normalizePath(path).toLowerCase().endsWith(".svg")
}

const readSvgFromModule = async (path?: string | null): Promise<string | null> => {
  if (!path) return null
  const moduleId = getLocalAssetModule(path)
  if (!moduleId) {
    console.warn("getLocalSvgXml: no module found for path", path)
    return null
  }

  const asset = Asset.fromModule(moduleId)
  if (!asset.localUri && asset.downloadAsync) {
    try {
      await asset.downloadAsync()
    } catch (error) {
      console.warn("getLocalSvgXml: failed to download asset for path", path, error)
      return null
    }
  }

  const uri = asset.localUri
  if (!uri) return null

  try {
    const contents = await FileSystem.readAsStringAsync(uri)
    return contents
  } catch (error) {
    console.warn("getLocalSvgXml: failed to read svg from uri", uri, error)
    return null
  }
}

const readPersistedSvg = async (path?: string | null): Promise<string | null> => {
  if (!path) return null
  const cacheDir = await ensureSvgCacheDir()
  if (!cacheDir) return null
  const filePath = getSvgCacheFilePath(path)
  if (!filePath) return null

  try {
    const info = await FileSystem.getInfoAsync(filePath)
    if (!info.exists) return null
    return await FileSystem.readAsStringAsync(filePath)
  } catch (error) {
    console.warn("getLocalSvgXml: failed to read cached svg", filePath, error)
    return null
  }
}

const persistSvgContents = async (path: string, contents: string | null) => {
  if (!contents) return
  const cacheDir = await ensureSvgCacheDir()
  if (!cacheDir) return

  const filePath = getSvgCacheFilePath(path)
  if (!filePath) return

  try {
    await FileSystem.writeAsStringAsync(filePath, contents, { encoding: FileSystem.EncodingType.UTF8 })
  } catch (error) {
    console.warn("getLocalSvgXml: failed to persist svg cache", filePath, error)
  }
}

const loadSvgWithPersistence = (path?: string | null): Promise<string | null> => {
  if (!path) return Promise.resolve(null)
  const normalized = normalizePath(path)
  if (persistentSvgCache.has(normalized)) {
    return persistentSvgCache.get(normalized) as Promise<string | null>
  }

  const pending = (async () => {
    const cached = await readPersistedSvg(path)
    if (cached) return cached
    const fresh = await readSvgFromModule(path)
    if (fresh) {
      persistSvgContents(path, fresh).catch(() => undefined)
    }
    return fresh
  })()

  persistentSvgCache.set(normalized, pending)
  return pending
}

export const getLocalSvgXml = (path?: string | null): Promise<string | null> => {
  if (!isSvgPath(path)) return Promise.resolve(null)
  const normalized = normalizePath(path as string)
  const existing = svgTextCache.get(normalized)
  if (existing) return existing
  const pending = loadSvgWithPersistence(path)
  svgTextCache.set(normalized, pending)
  return pending
}

export const prefetchLocalAssets = (paths: (string | null | undefined)[]) =>
  Promise.all(paths.map((path) => ensureAssetDownloaded(path)))

export const resolveLocalAssetUri = (path?: string | null) => {
  const moduleId = getLocalAssetModule(path)
  if (!moduleId) return null

  const asset = Asset.fromModule(moduleId)
  if (!asset.localUri && asset.downloadAsync) {
    // trigger download if asset not yet available locally (expo managed)
    asset.downloadAsync().catch(() => undefined)
  }

  // Expo gives us either a bundled localUri (after download) or an https uri we can use immediately
  const resolved = asset.localUri ?? asset.uri
  if (resolved) {
    return resolved
  }

  // As final fallback try Image.resolveAssetSource (works for raster assets)
  const fallback = Image.resolveAssetSource(moduleId)
  return fallback?.uri ?? null
}

export const resolveLocalBigIconUri = (path?: string | null) => resolveLocalAssetUri(path)

export const prefetchLocalSvgXml = (paths: (string | null | undefined)[]) =>
  Promise.all(
    paths
      .filter((path): path is string => Boolean(path && isSvgPath(path)))
      .map((path) => getLocalSvgXml(path)),
  )
