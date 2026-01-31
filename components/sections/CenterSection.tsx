import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity } from "react-native"

import type { Section, Variant } from "../../types/sections"
import type { Dims } from "../../hooks/useSidebarCalculations"
import { useTheme } from "../../contexts/ThemeContext"
import { MaskedSectionImage } from "./MaskedSectionImage"
import { DimensionOverlay } from "../overlay/DimensionOverlay"
import { getOverlayConfig } from "../overlay/config"
import { VariantSlider } from "./VariantSlider"
import { SectionInfoModal } from "./SectionInfoModal"

type CenterSectionProps = {
  selectedSection?: Section
  currentVariant?: Variant
  currentVariants: Variant[]
  selectedVariantIndex: number
  sliderValue: number
  onSliderChange: (value: number) => void
  onVariantSelect: (index: number) => void
  selectedType: string
  onCalculatorPress?: () => void
  dims?: Dims
}

const getVariantValue = (variant: Variant | undefined, key: keyof Variant, fallbackKey?: keyof Variant) => {
  if (!variant) return undefined
  const primary = variant[key]
  if (primary != null) return primary
  if (fallbackKey) return variant[fallbackKey]
  return undefined
}

export function CenterSection({
  selectedSection,
  currentVariant,
  currentVariants,
  selectedVariantIndex,
  sliderValue,
  onSliderChange,
  onVariantSelect,
  selectedType,
  onCalculatorPress,
  dims,
}: CenterSectionProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const shouldForceBlackSectionImage = [9, 10, 11].includes(selectedSection?.id ?? 0)
  const displayVariant = currentVariant ?? selectedSection?.variants?.[0]
  const imageVariant = useMemo(() => {
    // إذا كان القطاع H والنوع UC، نعرض صورة RSJ بدلاً من صورة UC
    if ((selectedSection?.id === 1 || selectedSection?.label === "H") && selectedType === "UC") {
      const rsjType = selectedSection?.types?.find((t) => t.name === "RSJ")
      if (rsjType?.variants?.length) {
        return rsjType.variants[selectedVariantIndex] ?? rsjType.variants[0]
      }
    }

    return displayVariant
  }, [displayVariant, selectedSection?.id, selectedSection?.label, selectedSection?.types, selectedType, selectedVariantIndex])
  const [infoOpen, setInfoOpen] = useState(false)
  const mainImageUri = imageVariant?.bigImg || imageVariant?.img || null
  const fallbackImageUri = useMemo(() => {
    if (!selectedSection) return null
    const isISection = selectedSection.id === 2 || selectedSection.label === "I"
    if (!isISection) return null
    const fallbackUri = "/icons/ip1.svg"
    if (fallbackUri === mainImageUri) return null
    return fallbackUri
  }, [mainImageUri, selectedSection])

  const overlayValues = useMemo(() => {
    if (!displayVariant) return {}

    const next: Record<string, number | string | undefined> = {}
    Object.entries(displayVariant).forEach(([key, value]) => {
      if (typeof value === "number" || typeof value === "string") {
        next[key] = value
      }
    })

    const measureB = getVariantValue(displayVariant, "B" as keyof Variant, "b" as keyof Variant)
    const measureH = getVariantValue(displayVariant, "H" as keyof Variant, "h" as keyof Variant)
    const measureTf =
      getVariantValue(displayVariant, "Tf" as keyof Variant, "tf" as keyof Variant) ??
      getVariantValue(displayVariant, "T" as keyof Variant, "t" as keyof Variant) ??
      (typeof displayVariant?.thickness === "number" ? displayVariant?.thickness : undefined)
    const measureTw = getVariantValue(displayVariant, "Tw" as keyof Variant, "tw" as keyof Variant)

    next.H = typeof measureH === "object" ? undefined : measureH
    next.B = typeof measureB === "object" ? undefined : measureB
    next.Tf = typeof measureTf === "object" ? undefined : measureTf
    next.tf = typeof measureTf === "object" ? undefined : measureTf
    next.Tw = typeof measureTw === "object" ? undefined : measureTw

    // للأقسام 13 و 15 و 16 نستخدم قيم الأبعاد اليدوية من الحاسبة عند توفرها
    const sectionId = selectedSection?.id ?? null
    if (dims && sectionId && [13, 15, 16].includes(sectionId)) {
      const normalize = (val: number | null | undefined): number | undefined => {
        if (val == null) return undefined
        const n = Number(val)
        return Number.isNaN(n) ? undefined : n
      }

      const hVal = normalize(dims.h)
      const wVal = normalize(dims.w)
      const thVal = normalize(dims.th)
      const tVal = normalize(dims.t)

      if (sectionId === 13) {
        // قطاع الشريط: H (label=L) للطول، Tf (label=W) للعرض، Tw (label=Th) للسماكة
        if (hVal !== undefined) next.H = hVal
        if (wVal !== undefined) next.Tf = wVal
        if (thVal !== undefined) next.Tw = thVal
      } else if (sectionId === 15 || sectionId === 16) {
        // قطاعات Z و C: H للطول الرأسي، Tf (label=W) للعرض، Tw (label=Th) للسماكة، t (label=T) للذيل
        if (hVal !== undefined) next.H = hVal
        if (wVal !== undefined) next.Tf = wVal
        if (thVal !== undefined) next.Tw = thVal
        if (tVal !== undefined) (next as any).t = tVal
      }
    }

    // إذا لم توجد قيم رقمية بعد (الحالة الابتدائية)، نضع قيمًا فارغة حتى نرسم الخطوط مع الحروف فقط
    if (sectionId && [13, 15, 16].includes(sectionId)) {
      if (next.H == null) next.H = ""
      if (next.Tf == null) next.Tf = ""
      if (next.Tw == null) next.Tw = ""
      if ((sectionId === 15 || sectionId === 16) && (next as any).t == null) {
        ;(next as any).t = ""
      }
    }

    return next
  }, [displayVariant, dims, selectedSection?.id])

  const overlayConfig = useMemo(
    () => getOverlayConfig(selectedSection?.id ?? 1),
    [selectedSection?.id],
  )

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapperOuter}>
        {mainImageUri && (
          <View style={styles.imageWrapper}>
            {displayVariant &&
              ![9, 10, 11, 13, 15, 16].includes(selectedSection?.id ?? 0) && (
                <TouchableOpacity
                  onPress={() =>  setInfoOpen(true) }
                  style={[
                    styles.infoButton,
                    {
                      backgroundColor: theme.isDark ? theme.colors.surface2 : theme.colors.surface,
                      shadowColor: theme.isDark ? "transparent" : "#000000",
                      elevation: theme.isDark ? 0 : 3,
                      shadowOpacity: theme.isDark ? 0 : 0.18,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.infoButtonText, { color: theme.colors.text }]}>i</Text>
                </TouchableOpacity>
              )}
            <MaskedSectionImage
              uri={mainImageUri}
              fallbackUri={fallbackImageUri}
              width={350}
              height={250}
              color={shouldForceBlackSectionImage ? "#000000" : isDark ? theme.colors.icon : "#000000"}
            />
            <DimensionOverlay config={overlayConfig} values={overlayValues} width={350} height={280} />
            <TouchableOpacity
              style={[
                styles.sliderIconFloating,
                {
                  backgroundColor: "transparent",
                  shadowColor: "transparent",
                  elevation: 3,
                  shadowOpacity: 0,
                },
              ]}
              activeOpacity={0.7}
              onPress={onCalculatorPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={!onCalculatorPress}
            >
              <MaterialCommunityIcons name="calculator" size={22} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>
         )}
      </View>

      {![13, 15, 16].includes(selectedSection?.id ?? 0) && currentVariants.length > 1 && (
        <VariantSlider
          variants={currentVariants}
          selectedIndex={selectedVariantIndex}
          sliderValue={sliderValue}
          onSliderChange={onSliderChange}
          onVariantSelect={onVariantSelect}
        />
      )}
      {displayVariant && (
        <SectionInfoModal
          visible={infoOpen}
          onClose={() => setInfoOpen(false)}
          title={
            displayVariant.name?.en ||
            (displayVariant as any).nameEn ||
            displayVariant.size
          }
          infoPath={(displayVariant as any).info ?? null}
          country={(displayVariant as any).country ?? null}
          data={displayVariant as unknown as Record<string, unknown>}
          sectionId={selectedSection?.id}
          sectionType={selectedType}
          variantIndex={selectedVariantIndex}
          sliderValue={sliderValue}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
  // backgroundColor: "blue",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  imageWrapperOuter: {
   // backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    width: 350,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  infoButton: {
    position: "absolute",
    bottom: 22,
    left: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
     zIndex: 10,  
  },
  infoButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  noImageText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  sliderIconFloating: {
    position: "absolute",
    left: -6,
    bottom: 60,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
})


