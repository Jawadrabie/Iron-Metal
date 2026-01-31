import { useEffect } from "react"
import { InteractionManager } from "react-native"

import type { Section, Variant } from "../types/sections"
import { prefetchLocalAssets } from "../lib/localAssets"

const collectVariants = (sections: Section[]): Variant[] => {
  return sections.flatMap((section) => {
    if (section.variants?.length) return section.variants
    if (section.types?.length) {
      return section.types.flatMap((type) => type.variants ?? [])
    }
    return []
  })
}

const collectVariantAssetPaths = (variants: Variant[]) => {
  const deduped = new Set<string>()
  variants.forEach((variant) => {
    if (variant.bigImg) deduped.add(variant.bigImg)
    if (variant.img) deduped.add(variant.img)
  })
  return Array.from(deduped)
}

const CHUNK_SIZE = 8
const CHUNK_DELAY_MS = 120

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useAssetWarmup(sections: Section[]) {
  useEffect(() => {
    if (!sections.length) return
    const variants = collectVariants(sections)
    const paths = collectVariantAssetPaths(variants)
    if (!paths.length) return

    let cancelled = false

    const schedule = InteractionManager.runAfterInteractions(() => {
      ;(async () => {
        for (let i = 0; i < paths.length && !cancelled; i += CHUNK_SIZE) {
          const chunk = paths.slice(i, i + CHUNK_SIZE)
          await prefetchLocalAssets(chunk).catch(() => undefined)
          if (paths.length > CHUNK_SIZE && !cancelled) {
            await delay(CHUNK_DELAY_MS)
          }
        }
      })()
    })

    return () => {
      cancelled = true
      schedule?.cancel?.()
    }
  }, [sections])
}

