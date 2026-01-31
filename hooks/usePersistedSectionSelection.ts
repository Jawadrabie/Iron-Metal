import { useCallback, useEffect, useRef, useState } from "react"
import { InteractionManager } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

import type { Section } from "../types/sections"
import { prefetchLocalAssets } from "../lib/localAssets"

type UsePersistedSectionSelectionParams = {
  sections: Section[]
  selectedSectionId: number | null
  onSectionChange: (id: number) => void
}

const PINNED_KEY = "pinnedSectionId"
const SELECTED_KEY = "selectedSectionId"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function usePersistedSectionSelection({
  sections,
  selectedSectionId,
  onSectionChange,
}: UsePersistedSectionSelectionParams) {
  const [pinnedSectionId, setPinnedSectionId] = useState<number | null>(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current) return
    if (!sections.length) return
    hydratedRef.current = true

    let isMounted = true
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const entries = await AsyncStorage.multiGet([PINNED_KEY, SELECTED_KEY])
        if (!isMounted) return

        const pinnedRaw = entries.find(([key]) => key === PINNED_KEY)?.[1]
        const selectedRaw = entries.find(([key]) => key === SELECTED_KEY)?.[1]

        if (pinnedRaw != null) {
          const parsed = Number(pinnedRaw)
          if (!Number.isNaN(parsed)) {
            const exists = sections.some((s) => s.id === parsed)
            if (exists) {
              setPinnedSectionId(parsed)
              if (parsed !== selectedSectionId) {
                onSectionChange(parsed)
              }
              return
            }

            setPinnedSectionId(null)
            AsyncStorage.removeItem(PINNED_KEY).catch(() => undefined)
          }
        }

        if (selectedRaw != null) {
          const parsed = Number(selectedRaw)
          if (!Number.isNaN(parsed) && parsed !== selectedSectionId) {
            onSectionChange(parsed)
          }
        }
      } catch (error) {
        console.warn("usePersistedSectionSelection: failed to hydrate state", error)
      }
    })

    return () => {
      isMounted = false
      task?.cancel?.()
    }
  }, [onSectionChange, selectedSectionId, sections])

  useEffect(() => {
    if (selectedSectionId == null) return
    const task = InteractionManager.runAfterInteractions(() => {
      AsyncStorage.setItem(SELECTED_KEY, String(selectedSectionId)).catch((error) => {
        console.warn("usePersistedSectionSelection: failed to persist selected id", error)
      })
    })
    return () => {
      task?.cancel?.()
    }
  }, [selectedSectionId])

  const handleSectionPress = useCallback(
    async (sectionId: number) => {
      if (sectionId === selectedSectionId) return

      const section = sections.find((s) => s.id === sectionId)
      const variants =
        section?.variants?.length
          ? section.variants
          : section?.types?.[0]?.variants ?? []

      const first = variants[0]
      if (first?.bigImg || first?.img) {
        const prefetchPromise = prefetchLocalAssets([first?.bigImg, first?.img])
        await Promise.race([prefetchPromise, delay(250)]).catch(() => undefined)
      }

      onSectionChange(sectionId)
    },
    [onSectionChange, selectedSectionId, sections],
  )

  const togglePin = useCallback(
    (sectionId: number) => {
      setPinnedSectionId((current) => {
        const nextPinned = current === sectionId ? null : sectionId

        InteractionManager.runAfterInteractions(() => {
          const action =
            nextPinned == null
              ? AsyncStorage.removeItem(PINNED_KEY)
              : AsyncStorage.setItem(PINNED_KEY, String(nextPinned))

          action.catch((error) => console.warn("usePersistedSectionSelection: failed to persist pin", error))
        })

        if (nextPinned != null && sectionId !== selectedSectionId) {
          onSectionChange(sectionId)
        }

        return nextPinned
      })
    },
    [onSectionChange, selectedSectionId],
  )

  return { pinnedSectionId, handleSectionPress, togglePin }
}



