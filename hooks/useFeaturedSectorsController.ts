import { useCallback, useState } from "react"

import {
  deleteFeaturedSectorMobile,
  getFeaturedSectorsMobile,
  type FeaturedSectorRow,
} from "../lib/featured-sectors"
import { useLanguage } from "./useLanguage"

export function useFeaturedSectorsController() {
  const { language } = useLanguage("en")
  const [items, setItems] = useState<FeaturedSectorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    const result = await getFeaturedSectorsMobile(language)
    if (result.error) {
      setError(result.error)
    }
    setItems(result.items || [])
    setLoading(false)
  }, [language])

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteFeaturedSectorMobile(id, language)
    if (!result.success) {
      if (result.error) {
        setError(result.error)
      }
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [language])

  return {
    items,
    loading,
    error,
    refresh,
    handleDelete,
  }
}
