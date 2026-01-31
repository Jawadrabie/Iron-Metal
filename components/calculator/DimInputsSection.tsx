import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { Dropdown, type IDropdownRef } from "react-native-element-dropdown"
import { Feather } from "@expo/vector-icons"

import type { Dims } from "../../hooks/useSidebarCalculations"
import { useTheme } from "../../contexts/ThemeContext"
import { calculatorStyles as styles } from "./styles"
import { DENSITIES, DIM_UNITS } from "./constants"

type DimInputsSectionProps = {
  dimsMode: boolean
  dims: Dims
  dimsUnitDropdownOpen: boolean
  densityDropdownOpen: boolean
  cardRef: RefObject<View | null>
  onToggleUnitDropdown: () => void
  onToggleDensityDropdown: () => void
  onSelectUnit: (unit: (typeof DIM_UNITS)[number]) => void
  onSelectDensity: (value: string) => void
  onChangeField: (field: "h" | "w" | "th", value: string) => void
  onReset: () => void
}

const DIM_FIELDS: Array<{ key: "h" | "w" | "th"; label: string; placeholder: string }> = [
  { key: "h", label: "L", placeholder: "Length" },
  { key: "w", label: "W", placeholder: "Width" },
  { key: "th", label: "T", placeholder: "Thickness" },
]

export const DimInputsSection = memo(function DimInputsSection({
  dimsMode,
  dims,
  dimsUnitDropdownOpen,
  densityDropdownOpen,
  cardRef,
  onToggleUnitDropdown,
  onToggleDensityDropdown,
  onSelectUnit,
  onSelectDensity,
  onChangeField,
  onReset,
}: DimInputsSectionProps) {
  if (!dimsMode) return null

  const theme = useTheme()
  const isDark = theme.isDark

  const densityDropdownRef = useRef<IDropdownRef>(null)
  const densityButtonRef = useRef<View>(null)
  const [densityDropdownLeft, setDensityDropdownLeft] = useState<number | null>(null)
  const [densityDropdownWidth, setDensityDropdownWidth] = useState<number>(210)
  const [densityDropdownMaxHeight, setDensityDropdownMaxHeight] = useState<number>(240)
  const [pendingOpen, setPendingOpen] = useState(false)

  const DENSITY_HEADER_HEIGHT = 24
  const DENSITY_ITEM_HEIGHT = 30
  const DENSITY_DROPDOWN_TARGET_WIDTH = 210
  const CARD_PADDING = 8
  const DROPDOWN_MARGIN_TOP = 2

  const selectedDensity = String(dims.density ?? "7.85")

  const densityListHeader = useMemo(
    () => (
      <View
        style={[
          styles.densityDropdownHeader,
          isDark
            ? {
                backgroundColor: theme.colors.surface2,
                borderBottomColor: theme.colors.border,
              }
            : null,
        ]}
      >
        <Text style={[styles.densityDropdownHeaderLeft, isDark ? { color: theme.colors.textSecondary } : null]}>Material</Text>
        <Text style={[styles.densityDropdownHeaderRight, isDark ? { color: theme.colors.textSecondary } : null]}>Density</Text>
      </View>
    ),
    [isDark, theme.colors.border, theme.colors.surface2, theme.colors.textSecondary],
  )

  const densityFlatListProps = useMemo(() => {
    const base = {
      showsVerticalScrollIndicator: false,
      bounces: false,
      overScrollMode: "never" as const,
      contentContainerStyle: { paddingVertical: 0 },
      ListHeaderComponent: densityListHeader,
    }

    const selectedIndex = DENSITIES.findIndex((d) => d.value === selectedDensity)
    if (selectedIndex < 0) return base

    return {
      ...base,
      initialScrollIndex: selectedIndex,
      getItemLayout: (_data: unknown, index: number) => ({
        length: DENSITY_ITEM_HEIGHT,
        offset: DENSITY_HEADER_HEIGHT + DENSITY_ITEM_HEIGHT * index,
        index,
      }),
    }
  }, [DENSITY_HEADER_HEIGHT, densityListHeader, selectedDensity])

  const computeDropdownPlacement = () => {
    const buttonNode = densityButtonRef.current
    const cardNode = cardRef.current

    if (!buttonNode) return

    const fallbackLeft = 8
    const fallbackWidth = DENSITY_DROPDOWN_TARGET_WIDTH
    const fallbackMaxHeight = 240

    const applyFallback = () => {
      setDensityDropdownLeft(fallbackLeft)
      setDensityDropdownWidth(fallbackWidth)
      setDensityDropdownMaxHeight(fallbackMaxHeight)
    }

    if (!cardNode || !cardNode.measureInWindow) {
      applyFallback()
      return
    }

    cardNode.measureInWindow((cardX, cardY, cardW, cardH) => {
      buttonNode.measureInWindow((btnX, btnY, btnW, btnH) => {
        const cardRight = cardX + cardW
        const btnRight = btnX + btnW

        const maxAllowedWidth = Math.max(0, cardW - CARD_PADDING * 2)
        const width = Math.min(DENSITY_DROPDOWN_TARGET_WIDTH, maxAllowedWidth)
        const finalWidth = width > 0 ? width : fallbackWidth

        // Align dropdown's top-right under the button's right edge
        const leftUnclamped = btnRight - finalWidth
        const minLeft = cardX + CARD_PADDING
        const maxLeft = cardRight - finalWidth - CARD_PADDING
        const left = Math.max(minLeft, Math.min(leftUnclamped, maxLeft))

        // Constrain height so it doesn't go outside the calculator card
        const dropdownTop = btnY + btnH + DROPDOWN_MARGIN_TOP
        const availableHeight = cardY + cardH - dropdownTop - CARD_PADDING
        const maxHeight = Math.max(0, Math.min(240, availableHeight))

        setDensityDropdownLeft(Number.isFinite(left) ? left : fallbackLeft)
        setDensityDropdownWidth(Number.isFinite(finalWidth) ? finalWidth : fallbackWidth)
        setDensityDropdownMaxHeight(Number.isFinite(maxHeight) ? maxHeight : fallbackMaxHeight)
      })
    })
  }

  useEffect(() => {
    if (!densityDropdownOpen) {
      densityDropdownRef.current?.close?.()
    }
  }, [densityDropdownOpen])

  useEffect(() => {
    if (!pendingOpen) return
    if (!densityDropdownOpen) return
    if (densityDropdownLeft == null) return

    if (!Number.isFinite(densityDropdownWidth) || densityDropdownWidth <= 0) return

    requestAnimationFrame(() => densityDropdownRef.current?.open?.())
    setPendingOpen(false)
  }, [pendingOpen, densityDropdownOpen, densityDropdownLeft, densityDropdownWidth])

  return (
    <View style={[styles.section, isDark ? { borderTopColor: theme.colors.border } : null]}>
      <View style={styles.dimsHeaderRow}>
        <TouchableOpacity style={[styles.resetButton, styles.dimsHeaderControl]} onPress={onReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <View style={styles.dimsHeaderButtons}>
          <View style={[styles.dimsDropdownWrapper, styles.dimsHeaderControl]}>
            <TouchableOpacity
              style={[
                styles.dimDropdownButton,
                styles.dimDropdownButtonUnit,
                isDark
                  ? {
                      backgroundColor: theme.colors.surface2,
                      borderColor: theme.colors.border,
                    }
                  : null,
              ]}
              onPress={onToggleUnitDropdown}
            >
              <Text style={[styles.dimDropdownLabel, isDark ? { color: theme.colors.textSecondary } : null]}>Unit</Text>
              <Text style={[styles.dimDropdownValue, isDark ? { color: theme.colors.text } : null]}>{dims.unit ?? "mm"}</Text>
              <Feather name="chevron-down" size={14} color={isDark ? theme.colors.textSecondary : "#4b5563"} style={styles.dimDropdownIcon} />
            </TouchableOpacity>
            {dimsUnitDropdownOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  styles.dropdownMenuFullWidth,
                  isDark
                    ? {
                        backgroundColor: theme.colors.surface2,
                        borderColor: theme.colors.border,
                      }
                    : null,
                ]}
              >
                {DIM_UNITS.map((unit) => {
                  const label = unit === "ft" ? "ft'" : unit === "in" ? "in''" : unit
                  const isSelected = dims.unit === unit
                  return (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.dropdownItem,
                        isSelected
                          ? isDark
                            ? { backgroundColor: "rgba(240,140,33,0.16)", borderRadius: 6 }
                            : styles.unitDropdownItemSelected
                          : null,
                      ]}
                      onPress={() => onSelectUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDark ? { color: theme.colors.textSecondary } : null,
                          isSelected && styles.unitDropdownItemTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>

          <View style={[styles.dimsDropdownWrapper, styles.dimsHeaderControlWide]}>
            <View ref={densityButtonRef} collapsable={false}>
              <TouchableOpacity
                style={[
                  styles.dimDropdownButton,
                  styles.dimDropdownButtonWide,
                  isDark
                    ? {
                        backgroundColor: theme.colors.surface2,
                        borderColor: theme.colors.border,
                      }
                    : null,
                ]}
                onPress={() => {
                  if (densityDropdownOpen) {
                    onToggleDensityDropdown()
                    return
                  }

                  setPendingOpen(true)
                  computeDropdownPlacement()
                  onToggleDensityDropdown()
                }}
              >
                <Text style={[styles.dimDropdownLabel, isDark ? { color: theme.colors.textSecondary } : null]}>Density</Text>
                <Text style={[styles.dimDropdownValue, isDark ? { color: theme.colors.text } : null]}>{selectedDensity}</Text>
                <Feather name="chevron-down" size={14} color={isDark ? theme.colors.textSecondary : "#4b5563"} />
              </TouchableOpacity>

              <View pointerEvents="none" collapsable={false} style={styles.densityDropdownAnchor}>
                <Dropdown
                  ref={densityDropdownRef}
                  data={DENSITIES}
                  labelField="label"
                  valueField="value"
                  value={selectedDensity}
                  style={StyleSheet.absoluteFillObject}
                  mode="auto"
                  containerStyle={[
                    styles.densityDropdownMenu,
                    isDark
                      ? {
                          backgroundColor: theme.colors.surface2,
                          borderColor: theme.colors.border,
                        }
                      : null,
                    {
                      width: densityDropdownWidth,
                      left: densityDropdownLeft ?? undefined,
                    },
                  ]}
                  placeholder=""
                  selectedTextStyle={styles.dropdownHiddenText}
                  itemContainerStyle={{ height: DENSITY_ITEM_HEIGHT, paddingHorizontal: 0 }}
                  itemTextStyle={isDark ? [styles.dropdownItemText, { color: theme.colors.textSecondary }] : styles.dropdownItemText}
                  maxHeight={densityDropdownMaxHeight}
                  activeColor="transparent"
                  dropdownPosition="bottom"
                  showsVerticalScrollIndicator={false}
                  closeModalWhenSelectedItem
                  autoScroll={false}
                  flatListProps={densityFlatListProps}
                  onBlur={() => {
                    if (densityDropdownOpen) onToggleDensityDropdown()
                  }}
                  onChange={(item: { label: string; value: string }) => {
                    onSelectDensity(item.value)
                    densityDropdownRef.current?.close?.()
                  }}
                  renderItem={(item: { label: string; value: string }) => {
                    const opt = item
                    const isSelected = opt.value === String(dims.density ?? "7.85")
                    return (
                      <View
                        style={[
                          styles.densityDropdownItem,
                          isSelected
                            ? isDark
                              ? { backgroundColor: "rgba(240,140,33,0.16)", borderRadius: 6 }
                              : styles.dropdownItemSelected
                            : null,
                        ]}
                      >
                        <View style={styles.densityItemRow}>
                          <View style={styles.densityItemLabelRow}>
                            {isSelected && (
                              <Feather
                                name="check"
                                size={14}
                                color="#ea580c"
                                style={styles.densityCheckIcon}
                              />
                            )}
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.densityItemLabel,
                                isDark ? { color: theme.colors.textSecondary } : null,
                                isSelected && styles.densityItemLabelSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.densityItemValue,
                              isDark ? { color: theme.colors.text } : null,
                              isSelected && styles.densityItemValueSelected,
                            ]}
                          >
                            {opt.value}
                          </Text>
                        </View>
                      </View>
                    )
                  }}
                  renderLeftIcon={() => null}
                  renderRightIcon={() => null}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {DIM_FIELDS.map((field) => (
        <View key={field.key} style={styles.row}>
          <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>{field.label}</Text>
          <View
            style={[
              styles.dimsInputWithUnit,
              isDark
                ? {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface2,
                  }
                : null,
            ]}
          >
            <TextInput
              style={[styles.dimsInput, isDark ? { color: theme.colors.text } : null]}
              value={dims[field.key] != null ? String(dims[field.key]) : ""}
              onChangeText={(txt) => onChangeField(field.key, txt)}
              keyboardType="numeric"
              placeholder={field.placeholder}
              placeholderTextColor={isDark ? theme.colors.textSecondary : "#9CA3AF"}
            />
            <Text style={[styles.dimsInputUnit, isDark ? { color: theme.colors.textSecondary } : null]}>{dims.unit ?? "mm"}</Text>
          </View>
        </View>
      ))}
    </View>
  )
})
