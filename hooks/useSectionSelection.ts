import { useCallback, useEffect, useMemo, useState } from "react"

import type { Section, Variant } from "../types/sections"

export function useSectionSelection(data: Section[]) {
  const initialSection = data[0] ?? null

  // نستخدم أول قطاع (وأول نوع له) كاختيار ابتدائي عندما تكون البيانات جاهزة
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    initialSection ? initialSection.id : null,
  )
  const [selectedType, setSelectedType] = useState<string>(() => {
    if (!initialSection) return ""
    if (initialSection.types?.length) return initialSection.types[0].name
    return ""
  })
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const selectedSection = useMemo(() => data.find((section) => section.id === selectedSectionId) ?? null, [data, selectedSectionId])

  useEffect(() => {
    if (selectedSectionId == null && data.length) {
      setSelectedSectionId(data[0].id)
    }
  }, [data, selectedSectionId])

  useEffect(() => {
    if (!data.length || !selectedSectionId) return

    const section = data.find((s) => s.id === selectedSectionId)
    if (!section) return

    if (!section.types?.length) {
      if (selectedType) {
        setSelectedType("")
        setExpandedTypes(new Set())
      }
      return
    }

    const hasValidSelection = section.types.some((type) => type.name === selectedType)
    if (hasValidSelection) return

    const fallbackType = section.types[0].name
    setSelectedType(fallbackType)
    setExpandedTypes(new Set([fallbackType]))
  }, [data, selectedSectionId, selectedType])

  const currentVariants: Variant[] = useMemo(() => {
    if (!selectedSection) return []
    if (selectedSection.variants) return selectedSection.variants
    if (selectedSection.types) {
      const type = selectedSection.types.find((t) => t.name === selectedType)
      return type?.variants ?? []
    }
    return []
  }, [selectedSection, selectedType])

  const currentVariant = useMemo(
    () => currentVariants[selectedVariantIndex] ?? currentVariants[0],
    [currentVariants, selectedVariantIndex],
  )

  const handleSectionChange = useCallback(
    (id: number) => {
      setSelectedSectionId(id)
      const section = data.find((s) => s.id === id)
      if (section?.types?.length) {
        const firstType = section.types[0].name
        setSelectedType(firstType)
        setExpandedTypes(new Set([firstType]))
      } else {
        setSelectedType("")
        setExpandedTypes(new Set())
      }
      setSelectedVariantIndex(0)
    },
    [data],
  )

  const handleTypeToggle = useCallback((name: string) => {
    setSelectedType(name)
    setSelectedVariantIndex(0)
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  const handleVariantSelect = useCallback((index: number, typeName?: string) => {
    if (typeName) setSelectedType(typeName)
    setSelectedVariantIndex(index)
  }, [])

  const handleSliderChange = useCallback(
    (percent: number) => {
      if (currentVariants.length <= 1) return
      const clamped = Math.max(0, Math.min(percent, 100))
      const ratio = clamped / 100
      const targetIndex = Math.round(ratio * (currentVariants.length - 1))
      setSelectedVariantIndex(Math.max(0, Math.min(targetIndex, currentVariants.length - 1)))
    },
    [currentVariants.length],
  )

  const sliderValue = useMemo(() => {
    if (currentVariants.length <= 1) return 0
    return (selectedVariantIndex / (currentVariants.length - 1)) * 100
  }, [currentVariants.length, selectedVariantIndex])

  return {
    selectedSectionId: selectedSection?.id ?? null,
    selectedSection,
    selectedType,
    selectedVariantIndex,
    expandedTypes,
    currentVariants,
    currentVariant,
    sliderValue,
    handleSectionChange,
    handleTypeToggle,
    handleVariantSelect,
    handleSliderChange,
    setSelectedSectionId,
  }
}


