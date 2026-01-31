import { Image } from "react-native"

import { resolveLocalAssetUri } from "../../lib/localAssets"

type MaskedSectionImageProps = {
  uri?: string | null
  fallbackUri?: string | null
  width?: number
  height?: number
  color?: string
}

export function MaskedSectionImage({
  uri,
  fallbackUri,
  width = 320,
  height = 240,
  color = "#000000",
}: MaskedSectionImageProps) {
  const targetPath = uri || fallbackUri
  if (!targetPath) return null
  const normalizedPath = targetPath.toLowerCase()
  const shouldForceBlack =
    normalizedPath === "/icons/b-pb.svg" ||
    normalizedPath === "/icons/b-sb.svg" ||
    normalizedPath === "/icons/b-rb.svg"
  const shouldDisableTint =
    normalizedPath === "/icons/b-pipe.svg" ||
    normalizedPath === "/icons/b-rhe.svg" ||
    normalizedPath === "/icons/b-she.svg"

  const effectiveColor = shouldForceBlack ? "#000000" : color

  const resolved = resolveLocalAssetUri(targetPath)
  if (!resolved) return null

  return (
    <Image
      source={{ uri: resolved }}
      fadeDuration={0}
      style={{
        width,
        height,
        resizeMode: "contain",
        tintColor: shouldDisableTint ? undefined : effectiveColor,
      }}
    />
  )
}

