import { memo, useMemo, useState } from "react"
import { Platform, StyleSheet, View, ScrollView } from "react-native"

import type { Section, Variant } from "../../types/sections"
import type { Dims } from "../../hooks/useSidebarCalculations"
import { SectionsSlider } from "../sections/SectionsSlider"
import { TypeSelector } from "../sections/TypeSelector"
import { CenterSection } from "../sections/CenterSection"
import { useTheme } from "../../contexts/ThemeContext"

type HomeMainContentProps = {
  data: Section[]
  selectedSectionId: number | null
  selectedSection?: Section
  selectedType: string
  currentVariant?: Variant
  currentVariants: Variant[]
  selectedVariantIndex: number
  sliderValue: number
  onSectionChange: (id: number) => void
  onTypeToggle: (typeName: string) => void
  onVariantSelect: (index: number) => void
  onSliderChange: (value: number) => void
  onCalculatorPress: () => void
  dims?: Dims
  bottomPadding?: number
}

export const HomeMainContent = memo(function HomeMainContent({
  data,
  selectedSectionId,
  selectedSection,
  selectedType,
  currentVariant,
  currentVariants,
  selectedVariantIndex,
  sliderValue,
  onSectionChange,
  onTypeToggle,
  onVariantSelect,
  onSliderChange,
  onCalculatorPress,
  dims,
  bottomPadding,
}: HomeMainContentProps) {
  const theme = useTheme()
  const selectionReady = useMemo(() => selectedSectionId != null && Boolean(selectedSection), [selectedSectionId, selectedSection])
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const needsScroll = contentHeight > containerHeight + 2

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces={false}
      alwaysBounceVertical={false}
      contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "never" : undefined}
      scrollEnabled={needsScroll}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      onContentSizeChange={(_, h) => setContentHeight(h)}
    >
      <SectionsSlider
        data={data}
        selectedSectionId={selectedSectionId}
        onSectionChange={onSectionChange}
      />

      {selectionReady ? (
        <>
          {selectedSection?.types && selectedSection.types.length > 1 ? (
            <TypeSelector
              types={selectedSection.types}
              selectedType={selectedType}
              onSelectType={onTypeToggle}
            />
          ) : null}

          <CenterSection
            selectedSection={selectedSection}
            currentVariant={currentVariant}
            currentVariants={currentVariants}
            selectedVariantIndex={selectedVariantIndex}
            sliderValue={sliderValue}
            onSliderChange={onSliderChange}
            onVariantSelect={onVariantSelect}
            selectedType={selectedType}
            onCalculatorPress={onCalculatorPress}
            dims={dims}
          />
        </>
      ) : (
        <View style={styles.placeholder}>
          <View style={[styles.placeholderBox, { backgroundColor: theme.colors.surface2 }]} />
        </View>
      )}

      <View style={{ height: bottomPadding ?? 0 }} />
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  placeholder: {
    height: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBox: {
    width: 320,
    height: 260,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
  },
})



