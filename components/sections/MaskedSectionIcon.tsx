import { useEffect, useRef, useState } from "react"
import { Image } from "react-native"
import { SvgXml } from "react-native-svg"

import { getLocalSvgXml, resolveLocalAssetUri } from "../../lib/localAssets"

type MaskedSectionIconProps = {
  uri?: string | null
  size?: number
  color?: string
}

const tintSvgStrokes = (svg: string, color: string) => svg.replace(/stroke="(?!none)(.*?)"/gi, () => `stroke="${color}"`)

export function MaskedSectionIcon({ uri, size = 40, color = "#000000" }: MaskedSectionIconProps) {
  const [renderState, setRenderState] = useState<{
    uri: string
    resolvedUri: string
    isVector: boolean
    svgXml: string | null
  } | null>(null)
  const latestUriRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!uri) {
      latestUriRef.current = null
      setRenderState(null)
      return
    }

    latestUriRef.current = uri

    const local = resolveLocalAssetUri(uri)
    if (!local) {
      setRenderState(null)
      return
    }

    // إذا كان الملف النهائي ما يزال SVG حقيقي، نحمّله كـ SVG
    if (local.toLowerCase().endsWith(".svg")) {
      getLocalSvgXml(uri).then((xml) => {
        if (isMounted) {
          if (latestUriRef.current !== uri) return
          if (!xml) return
          setRenderState({ uri, resolvedUri: local, isVector: true, svgXml: xml })
        }
      })
    } else {
      // إذا كان الملف النهائي PNG/JPG ... لا نستخدم SVG إطلاقًا
      setRenderState({ uri, resolvedUri: local, isVector: false, svgXml: null })
    }

    return () => {
      isMounted = false
    }
  }, [uri])

  if (!renderState) return null

  const normalizedUri = renderState.uri.toLowerCase()
  const shouldForceAlwaysBlack =
    normalizedUri === "/icons/9.svg" ||
    normalizedUri === "/icons/10.svg" ||
    normalizedUri === "/icons/11.svg" ||
    normalizedUri === "/icons/s-pb.svg" ||
    normalizedUri === "/icons/s-sb.svg" ||
    normalizedUri === "/icons/s-rb.svg"
  const shouldForceSolidBlack =
    normalizedUri === "/icons/3.svg" ||
    normalizedUri === "/icons/4.svg" ||
    normalizedUri === "/icons/6.svg"
  const shouldForceStrokeTint = normalizedUri === "/icons/i16.svg"
  const effectiveColor = shouldForceAlwaysBlack ? "#000000" : (color ?? "#000000")
  const shouldDisableTintForRaster =
    normalizedUri === "/icons/7.svg" ||
    normalizedUri === "/icons/s-she.svg" ||
    normalizedUri === "/icons/8.svg" ||
    normalizedUri === "/icons/i16.svg"

  if (renderState.isVector) {
    if (!renderState.svgXml) return null
    let coloredSvg = renderState.svgXml
    if (shouldForceSolidBlack || shouldForceAlwaysBlack) {
      coloredSvg = fillSvgOutsideMasks(coloredSvg, effectiveColor)
    } else if (shouldForceStrokeTint) {
      coloredSvg = tintSvgStrokes(coloredSvg, effectiveColor)
    }
    return <SvgXml xml={coloredSvg} width={size} height={size} />
  }

  // للـ PNG / raster نعرض الصورة مباشرة مع tintColor بدون SVG أو MaskedView
  return (
    <Image
      source={{ uri: renderState.resolvedUri }}
      fadeDuration={0}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
        tintColor: shouldDisableTintForRaster ? undefined : effectiveColor,
      }}
    />
  )
}

const MASK_PLACEHOLDER_PREFIX = "__MASK_SECTION_PLACEHOLDER__"

const fillSvgOutsideMasks = (svg: string, color: string) => {
  const masks: string[] = []
  let working = svg.replace(/<mask[\s\S]*?<\/mask>/gi, (match) => {
    const token = `${MASK_PLACEHOLDER_PREFIX}${masks.length}__`
    masks.push(match)
    return token
  })

  working = working.replace(/(fill|stroke)="(?!none)(.*?)"/gi, (_, attr) => `${attr}="${color}"`)

  masks.forEach((maskContent, index) => {
    const token = `${MASK_PLACEHOLDER_PREFIX}${index}__`
    working = working.replace(token, maskContent)
  })

  return working
}


