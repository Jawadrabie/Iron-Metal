import { useCallback, useEffect, useMemo, useState } from "react"

import type { Section } from "../types/sections"
import type { FeaturedSectorRow } from "../lib/featured-sectors"
import type { Dims } from "./useSidebarCalculations"

type FeaturedConfig = {
  id: string
  pricePerKgInput?: string
  requiredInput?: string
  lengthInput?: string
  lengthUnit?: "m" | "mm"
} | null

type UseHomeFeaturedOptions = {
  featuredFromRoute?: FeaturedSectorRow
  data: Section[]
  selectedSectionId: number | null
  onSectionChange: (id: number) => void
  onTypeToggle: (type: string) => void
  onVariantSelect: (index: number, typeName?: string) => void
  onSliderChange: (percent: number) => void
  /** Ensure that the visible tab is Home and close any modal calculator. */
  onEnsureHomeTab: () => void
}

type UseHomeFeaturedResult = {
  currentDims?: Dims
  featuredConfig: FeaturedConfig
  calculatorInstanceKey: number
  handleCalculatorDimsChange: (next: Dims) => void
}

/**
 * Encapsulates all logic related to applying a featured sector that
 * is passed via navigation route params into the Home screen.
 */
export function useHomeFeaturedFromRoute(options: UseHomeFeaturedOptions): UseHomeFeaturedResult {
  const {
    featuredFromRoute,
    data,
    selectedSectionId,
    onSectionChange,
    onTypeToggle,
    onVariantSelect,
    onSliderChange,
    onEnsureHomeTab,
  } = options

  const [dimsBySection, setDimsBySection] = useState<Record<number, Dims>>({})
  const [featuredConfig, setFeaturedConfig] = useState<FeaturedConfig>(null)
  const [calculatorInstanceKey, setCalculatorInstanceKey] = useState(0)
  const [appliedFeaturedId, setAppliedFeaturedId] = useState<string | null>(null)

  // Apply initial featured configuration coming from the route (once per id)
  useEffect(() => {
    if (!featuredFromRoute) return
    if (!data || !data.length) return
    if (appliedFeaturedId === featuredFromRoute.id) return

    const sectionId = featuredFromRoute.section_id
    if (sectionId != null) {
      onSectionChange(sectionId)
    }

    if (featuredFromRoute.section_type) {
      onTypeToggle(featuredFromRoute.section_type)
    }

    if (typeof featuredFromRoute.variant_index === "number") {
      onVariantSelect(featuredFromRoute.variant_index, featuredFromRoute.section_type ?? undefined)
    } else if (featuredFromRoute.slider_value) {
      const sv = Number.parseFloat(featuredFromRoute.slider_value)
      if (Number.isFinite(sv)) {
        onSliderChange(sv)
      }
    }

    let lengthUnit: "m" | "mm" = featuredFromRoute.length_unit === "mm" ? "mm" : "m"
    let lengthInput = "12"
    if (typeof featuredFromRoute.length_value === "number") {
      if (lengthUnit === "mm") {
        const mm = featuredFromRoute.length_value * 1000
        lengthInput = Number.isFinite(mm) ? String(Math.round(mm)) : "0"
      } else {
        lengthInput = String(featuredFromRoute.length_value)
      }
    }

    const pricePerKgInput =
      featuredFromRoute.price_per_kg != null ? String(featuredFromRoute.price_per_kg) : "1"
    const requiredInput =
      featuredFromRoute.required_pieces != null ? String(featuredFromRoute.required_pieces) : "1"

    let nextDims: Dims | undefined
    if (
      featuredFromRoute.height != null ||
      featuredFromRoute.width != null ||
      featuredFromRoute.thickness != null ||
      featuredFromRoute.hook_length != null
    ) {
      nextDims = {
        h: featuredFromRoute.height ?? null,
        w: featuredFromRoute.width ?? null,
        th: featuredFromRoute.thickness ?? null,
        t: featuredFromRoute.hook_length ?? null,
        unit: (featuredFromRoute.dimension_unit as any) || "mm",
        density:
          featuredFromRoute.density != null
            ? String(featuredFromRoute.density)
            : undefined,
      }
    }

    if (nextDims && sectionId != null) {
      setDimsBySection((prev) => ({
        ...prev,
        [sectionId]: nextDims as Dims,
      }))
    }

    setFeaturedConfig({
      id: featuredFromRoute.id,
      pricePerKgInput,
      requiredInput,
      lengthInput,
      lengthUnit,
    })

    setAppliedFeaturedId(featuredFromRoute.id)

    // Ensure we end up on the Home tab and close calculator if open
    onEnsureHomeTab()
  }, [
    featuredFromRoute,
    data,
    appliedFeaturedId,
    onSectionChange,
    onTypeToggle,
    onVariantSelect,
    onSliderChange,
    onEnsureHomeTab,
  ])

  // When user navigates to a different section than the featured one,
  // clear the featured config and force CalculatorModal to remount.
  useEffect(() => {
    if (!featuredFromRoute) return
    if (!featuredConfig) return

    const featuredSectionId = featuredFromRoute.section_id
    if (featuredSectionId == null) return
    if (selectedSectionId == null) return
    if (selectedSectionId === featuredSectionId) return

    setFeaturedConfig(null)
    setCalculatorInstanceKey((prev) => prev + 1)
  }, [selectedSectionId, featuredFromRoute, featuredConfig])

  // If the route param is cleared, also clear local featured state.
  useEffect(() => {
    if (featuredFromRoute) return
    if (!appliedFeaturedId) return

    setAppliedFeaturedId(null)
    setFeaturedConfig(null)
  }, [featuredFromRoute, appliedFeaturedId])

  const currentDims: Dims | undefined = useMemo(() => {
    if (selectedSectionId == null) return undefined
    return dimsBySection[selectedSectionId]
  }, [selectedSectionId, dimsBySection])

  const handleCalculatorDimsChange = useCallback(
    (next: Dims) => {
      if (selectedSectionId == null) return
      setDimsBySection((prev) => ({ ...prev, [selectedSectionId]: next }))
    },
    [selectedSectionId],
  )

  return {
    currentDims,
    featuredConfig,
    calculatorInstanceKey,
    handleCalculatorDimsChange,
  }
}
