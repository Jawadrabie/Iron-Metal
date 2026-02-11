import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Dropdown, type IDropdownRef } from 'react-native-element-dropdown'
import { DENSITY_GROUPS, DENSITY_UNITS, DIM_UNITS, type DimUnit } from './constants'
import { convertFromKgM3, formatDensity } from './utils'
import { normalizeNumericInput, toNumber } from './numeric'
import { getFieldConfigForFormula } from './fieldConfig'
import { calculateResultsEngine } from './calcEngine'
import { useI18n } from '../../contexts/I18nContext'
import { getLocalAssetModuleId, resolveLocalAssetUri } from '../../lib/localAssets'

function getLocalizedPlaceholder(title: string, language: string) {
  const raw = String(title || '').trim()
  if (!raw) return ''

  const match = raw.match(/^(.*?)\s*\(([^()]*)\)\s*$/)
  if (!match) return raw

  const ar = match[1].trim()
  const en = match[2].trim()

  return language === 'ar' ? ar : en
}

type Props = {
  selectedCalc: any
  dims: any
  setDims: React.Dispatch<React.SetStateAction<any>>
  qty: number
  setQty: React.Dispatch<React.SetStateAction<number>>
  price: number | null
  setPrice: React.Dispatch<React.SetStateAction<number | null>>
  currencyCode: string
  setResults: (r: any) => void
  openPickerFromNode: (node: any, args: any) => void
  closePicker: () => void
  styles: any
  theme: any
  screenWidth: number
  screenHeight: number
  calcT: any
}

export function CalculationsFormSection({
  selectedCalc,
  dims,
  setDims,
  qty,
  setQty,
  price,
  setPrice,
  currencyCode,
  setResults,
  openPickerFromNode,
  closePicker,
  styles,
  theme,
  screenWidth,
  screenHeight,
  calcT,
}: Props) {
  const { language } = useI18n()
  const [qtyText, setQtyText] = useState<string>(qty > 0 ? String(qty) : '')
  const [densityGroup, setDensityGroup] = useState<string>('Steel & Iron')
  const [densityMaterial, setDensityMaterial] = useState<string>('Carbon Steel')
  const [densityUnit, setDensityUnit] = useState<string>('kg_m3')

  const selectedGroup =
    DENSITY_GROUPS.find((g) => g.label === densityGroup) || DENSITY_GROUPS[0]
  const selectedMaterial =
    selectedGroup.items.find((m) => m.label === densityMaterial) || selectedGroup.items[0]
  const densityKgM3 = selectedMaterial?.value ?? 7850

  const previewImagePath = useMemo(() => {
    return selectedCalc?.svgImg ?? selectedCalc?.symbol ?? null
  }, [selectedCalc?.svgImg, selectedCalc?.symbol])

  const previewImageSource = useMemo(() => {
    if (!previewImagePath) return null

    // Attempt to find a high-res (.1) version first
    if (typeof previewImagePath === 'string') {
      const dotOnePath = previewImagePath.replace(/(\.png|\.svg)$/, '.1$1')
      const dotOneModuleId = getLocalAssetModuleId(dotOnePath)
      if (dotOneModuleId) return dotOneModuleId
    }

    const moduleId = getLocalAssetModuleId(previewImagePath)
    if (moduleId) return moduleId

    const uri = resolveLocalAssetUri(previewImagePath)
    if (uri) return { uri }

    return null
  }, [previewImagePath])

  const getImageSourceKey = (source: any) => {
    if (!source) return ''
    if (typeof source === 'number') return `m:${source}`
    if (typeof source === 'object' && typeof source?.uri === 'string') return `u:${source.uri}`
    return ''
  }

  const initialPreviewKey = getImageSourceKey(previewImageSource)
  const displayedPreviewKeyRef = useRef<string>(initialPreviewKey)
  const [displayedPreviewSource, setDisplayedPreviewSource] = useState<any>(() => previewImageSource)
  const [pendingPreviewSource, setPendingPreviewSource] = useState<any>(null)
  const [pendingPreviewKey, setPendingPreviewKey] = useState<string>('')
  const [pendingPreviewLoaded, setPendingPreviewLoaded] = useState(false)

  useEffect(() => {
    if (!previewImageSource) {
      displayedPreviewKeyRef.current = ''
      setDisplayedPreviewSource(null)
      setPendingPreviewSource(null)
      setPendingPreviewKey('')
      setPendingPreviewLoaded(false)
      return
    }

    const nextKey = getImageSourceKey(previewImageSource)
    if (!nextKey) return

    if (!displayedPreviewKeyRef.current) {
      displayedPreviewKeyRef.current = nextKey
      setDisplayedPreviewSource(previewImageSource)
      return
    }

    if (nextKey === displayedPreviewKeyRef.current) return

    setPendingPreviewLoaded(false)
    setPendingPreviewKey(nextKey)
    setPendingPreviewSource(previewImageSource)
  }, [previewImageSource])

  useEffect(() => {
    if (!pendingPreviewSource || !pendingPreviewLoaded) return

    displayedPreviewKeyRef.current = pendingPreviewKey
    setDisplayedPreviewSource(pendingPreviewSource)

    const t = setTimeout(() => {
      setPendingPreviewSource(null)
      setPendingPreviewKey('')
      setPendingPreviewLoaded(false)
    }, 0)

    return () => clearTimeout(t)
  }, [pendingPreviewLoaded, pendingPreviewKey, pendingPreviewSource])

  const previewColumnWidth = useMemo(() => {
    const raw = Math.round(screenWidth * 0.32)
    return Math.max(96, Math.min(140, raw))
  }, [screenWidth])

  const materialDensityInline = useMemo(() => {
    const unitLabel = DENSITY_UNITS.find((u) => u.value === densityUnit)?.label || ''
    const v = formatDensity(convertFromKgM3(densityKgM3, densityUnit), densityUnit)
    return `${v} ${unitLabel}`.trim()
  }, [densityKgM3, densityUnit])

  const materialOptions = useMemo(() => {
    return selectedGroup.items.map((item) => ({
      label: item.label,
      value: item.label,
      rightLabel: `${formatDensity(convertFromKgM3(item.value, densityUnit), densityUnit)} ${DENSITY_UNITS.find((u) => u.value === densityUnit)?.label || ''
        }`,
    }))
  }, [densityUnit, selectedGroup.items])

  const MATERIAL_ITEM_HEIGHT = 28

  const baseMaterialFlatListProps = {
    bounces: false,
    overScrollMode: 'never' as const,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { paddingVertical: 0 },
    removeClippedSubviews: true,
    windowSize: 8,
    initialNumToRender: 12,
    maxToRenderPerBatch: 12,
    updateCellsBatchingPeriod: 50,
  }

  const selectedMaterialIndex = materialOptions.findIndex((o) => o.value === densityMaterial)
  const materialFlatListProps =
    selectedMaterialIndex > -1
      ? {
        ...baseMaterialFlatListProps,
        initialScrollIndex: selectedMaterialIndex,
        getItemLayout: (_data: any, index: number) => ({
          length: MATERIAL_ITEM_HEIGHT,
          offset: MATERIAL_ITEM_HEIGHT * index,
          index,
        }),
      }
      : baseMaterialFlatListProps

  const autoCalcTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const densityGroupDropdownRef = useRef<IDropdownRef>(null)
  const densityMaterialDropdownRef = useRef<IDropdownRef>(null)
  const densityUnitDropdownRef = useRef<IDropdownRef>(null)
  const unitAnchorRefs = useRef<Record<string, View | null>>({})

  useEffect(() => {
    setDims((prev: any) => ({ ...prev, density: String(densityKgM3 / 1000) }))
  }, [densityKgM3, setDims])

  useEffect(() => {
    setDims((prev: any) => ({
      ...prev,
      densityGroup,
      densityMaterial,
      densityUnit,
    }))
  }, [densityGroup, densityMaterial, densityUnit, setDims])

  useEffect(() => {
    setQty(1)
    setQtyText('1')
  }, [selectedCalc?.id])

  useEffect(() => {
    if (!selectedCalc) return

    if (selectedCalc.formula === 'expanded_metal') {
      setDims((prev: any) => (prev.calcMode ? prev : { ...prev, calcMode: 'thickness' }))
    }

    if (selectedCalc.formula === 'steel_grating') {
      setDims((prev: any) => (prev.calcMode ? prev : { ...prev, calcMode: 'weight' }))
    }

    if (selectedCalc.formula === 'wire_mesh') {
      setDims((prev: any) => (prev.calcMode ? prev : { ...prev, calcMode: 'weight' }))
    }

    if (selectedCalc.formula === 'i_beam') {
      setDims((prev: any) =>
        typeof prev.includeRadius === 'boolean' ? prev : { ...prev, includeRadius: false },
      )
    }
  }, [selectedCalc?.id, selectedCalc?.formula, setDims])

  const getDefaultUnitForKey = (key: string): DimUnit => {
    if (key === 'h') return 'm'

    if (
      key === 'tf' &&
      (selectedCalc?.formula === 'steel_grating' ||
        selectedCalc?.formula === 'wire_mesh' ||
        selectedCalc?.formula === 'expanded_metal')
    ) {
      return 'm'
    }

    return 'mm'
  }

  const getUnitForKey = (key: string): DimUnit => {
    const u = dims?.[`${key}_unit`]
    if (u === 'mm' || u === 'm' || u === 'ft' || u === 'in') return u
    return getDefaultUnitForKey(key)
  }

  const setUnitForKey = (key: string, unit: DimUnit) => {
    setDims((prev: any) => ({ ...prev, [`${key}_unit`]: unit }))
  }

  const shouldShowUnitForKey = (key: string) => {
    if (!selectedCalc) return true

    if (selectedCalc.formula === 'flange_ring' && key === 'r') return false

    if (
      (selectedCalc.formula === 'expanded_metal' &&
        dims.calcMode === 'weight' &&
        (key === 'tf' || key === 'h')) ||
      ((selectedCalc.formula === 'steel_grating' || selectedCalc.formula === 'wire_mesh') &&
        dims.calcMode === 'weight' &&
        key === 'tw')
    ) {
      return false
    }

    return true
  }

  const handleDimChange = (key: string, value: string) => {
    setDims((prev: any) => ({ ...prev, [key]: normalizeNumericInput(value) }))
  }

  const handleReset = () => {
    setDims((prev: any) => {
      const next = { ...prev }
        ;['h', 'tf', 'tw', 't', 'r', 's', 'u'].forEach((k) => {
          next[k] = ''
        })
      return next
    })
    setQty(1)
    setQtyText('1')
    setPrice(null)
  }

  const fields = useMemo(
    () => (selectedCalc ? getFieldConfigForFormula(selectedCalc.formula, dims) : []),
    [dims, selectedCalc],
  )

  useEffect(() => {
    if (autoCalcTimeoutRef.current) clearTimeout(autoCalcTimeoutRef.current)

    if (!selectedCalc) {
      setResults(null)
      return
    }

    if (qty <= 0) {
      setResults(null)
      return
    }

    const hasAllRequiredInputs = fields.length > 0 &&
      fields.every((f) => {
        const raw = dims?.[f.key]
        const normalized = normalizeNumericInput(raw)
        if (!normalized) return false
        return true
      })

    if (!hasAllRequiredInputs) {
      setResults(null)
      return
    }

    autoCalcTimeoutRef.current = setTimeout(() => {
      const next = calculateResultsEngine({
        formula: selectedCalc.formula,
        dims,
        qty,
        price,
        getUnitForKey,
      })
      setResults(next)
    }, 180)

    return () => {
      if (autoCalcTimeoutRef.current) clearTimeout(autoCalcTimeoutRef.current)
    }
  }, [dims, fields, price, qty, selectedCalc, setResults])

  return (
    <View style={styles.inputsContainer}>
      {selectedCalc.formula === 'expanded_metal' && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              (!dims.calcMode || dims.calcMode === 'thickness') && styles.modeButtonActive,
            ]}
            onPress={() => setDims((prev: any) => ({ ...prev, calcMode: 'thickness' }))}
          >
            <Text style={styles.modeButtonText}>حسب السماكة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, dims.calcMode === 'weight' && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, calcMode: 'weight' }))}
          >
            <Text style={styles.modeButtonText}>حسب الوزن / م²</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedCalc.formula === 'steel_grating' && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, (!dims.calcMode || dims.calcMode === 'weight') && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, calcMode: 'weight' }))}
          >
            <Text style={styles.modeButtonText}>وزن جاهز / م²</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, dims.calcMode === 'thickness' && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, calcMode: 'thickness' }))}
          >
            <Text style={styles.modeButtonText}>حساب هندسي</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedCalc.formula === 'wire_mesh' && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, (!dims.calcMode || dims.calcMode === 'weight') && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, calcMode: 'weight' }))}
          >
            <Text style={styles.modeButtonText}>وزن جاهز / م²</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, dims.calcMode === 'thickness' && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, calcMode: 'thickness' }))}
          >
            <Text style={styles.modeButtonText}>حساب هندسي</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedCalc.formula === 'i_beam' && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, !dims.includeRadius && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, includeRadius: false }))}
          >
            <Text style={styles.modeButtonText}>بدون R</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, !!dims.includeRadius && styles.modeButtonActive]}
            onPress={() => setDims((prev: any) => ({ ...prev, includeRadius: true }))}
          >
            <Text style={styles.modeButtonText}>مع R</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.densityRow, { direction: 'ltr', flexDirection: 'row' }]}>
        <View collapsable={false} style={{ flex: 0.85, minWidth: 0 }}>
          <TouchableOpacity
            style={styles.densitySelect}
            onPress={() => densityGroupDropdownRef.current?.open?.()}
          >
            <Text style={styles.densitySelectText} numberOfLines={1} ellipsizeMode="tail">
              {densityGroup}
            </Text>
          </TouchableOpacity>

          <View pointerEvents="none" collapsable={false} style={styles.dropdownAnchor}>
            <Dropdown
              ref={densityGroupDropdownRef}
              data={DENSITY_GROUPS.map((g) => ({ label: g.label, value: g.label }))}
              labelField="label"
              valueField="value"
              value={densityGroup}
              style={StyleSheet.absoluteFillObject}
              dropdownPosition="bottom"
              containerStyle={[
                styles.dropdownContainer,
                {
                  width: 180,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
              placeholder=""
              selectedTextStyle={styles.dropdownHiddenText}
              itemContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              maxHeight={320}
              showsVerticalScrollIndicator={false}
              activeColor="transparent"
              closeModalWhenSelectedItem
              flatListProps={{
                bounces: false,
                overScrollMode: 'never',
                showsVerticalScrollIndicator: false,
                contentContainerStyle: { paddingVertical: 0 },
              }}
              onChange={(item: { label: string; value: string }) => {
                setDensityGroup(item.value)
                const first = DENSITY_GROUPS.find((g) => g.label === item.value)?.items?.[0]?.label
                if (first) setDensityMaterial(first)
                densityGroupDropdownRef.current?.close?.()
              }}
              renderLeftIcon={() => null}
              renderRightIcon={() => null}
              renderItem={(item: { label: string; value: string }) => {
                const isSelected = item.value === densityGroup
                return (
                  <View style={[styles.modalOption, isSelected ? styles.modalOptionActive : null]}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: theme.colors.text },
                        isSelected ? styles.modalOptionTextActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                )
              }}
            />
          </View>
        </View>

        <View collapsable={false} style={{ flex: 1.15, minWidth: 0 }}>
          <TouchableOpacity
            style={styles.densitySelect}
            onPress={() => densityMaterialDropdownRef.current?.open?.()}
          >
            <Text style={styles.densitySelectText} numberOfLines={1} ellipsizeMode="tail">
              {densityMaterial}
              {materialDensityInline ? ` ${materialDensityInline}` : ''}
            </Text>
          </TouchableOpacity>

          <View pointerEvents="none" collapsable={false} style={styles.dropdownAnchor}>
            <Dropdown
              ref={densityMaterialDropdownRef}
              data={materialOptions}
              labelField="label"
              valueField="value"
              value={densityMaterial}
              style={StyleSheet.absoluteFillObject}
              dropdownPosition="bottom"
              containerStyle={[
                styles.dropdownContainer,
                {
                  width: Math.min(220, Math.max(180, Math.round(screenWidth * 0.6))),
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
              placeholder=""
              selectedTextStyle={styles.dropdownHiddenText}
              itemContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              maxHeight={Math.min(180, Math.max(130, screenHeight * 0.24))}
              showsVerticalScrollIndicator={false}
              activeColor="transparent"
              closeModalWhenSelectedItem
              autoScroll={false}
              flatListProps={materialFlatListProps}
              onChange={(item: { label: string; value: string; rightLabel?: string }) => {
                setDensityMaterial(item.value)
                densityMaterialDropdownRef.current?.close?.()
              }}
              renderLeftIcon={() => null}
              renderRightIcon={() => null}
              renderItem={(item: { label: string; value: string; rightLabel?: string }) => {
                const isSelected = item.value === densityMaterial
                return (
                  <View
                    style={[
                      styles.modalOption,
                      styles.modalOptionCompact,
                      { height: MATERIAL_ITEM_HEIGHT, marginBottom: 0, paddingVertical: 3 },
                      isSelected ? styles.modalOptionActive : null,
                    ]}
                  >
                    <View style={[styles.modalOptionRow, styles.modalOptionRowCompact]}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="clip"
                        style={[
                          styles.modalOptionLeftText,
                          styles.modalOptionLeftTextCompact,
                          { color: theme.colors.text },
                          isSelected ? styles.modalOptionTextActive : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {!!item.rightLabel && (
                        <Text
                          style={[
                            styles.modalOptionRightText,
                            styles.modalOptionRightTextCompact,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {item.rightLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                )
              }}
            />
          </View>
        </View>

        <View collapsable={false}>
          <TouchableOpacity
            style={styles.densitySelectUnit}
            onPress={() => densityUnitDropdownRef.current?.open?.()}
          >
            <Text style={styles.densitySelectText} numberOfLines={1}>
              {DENSITY_UNITS.find((u) => u.value === densityUnit)?.label || 'kg/m³'}
            </Text>
          </TouchableOpacity>

          <View pointerEvents="none" collapsable={false} style={styles.dropdownAnchor}>
            <Dropdown
              ref={densityUnitDropdownRef}
              data={DENSITY_UNITS.map((u) => ({ label: u.label, value: u.value }))}
              labelField="label"
              valueField="value"
              value={densityUnit}
              style={StyleSheet.absoluteFillObject}
              dropdownPosition="bottom"
              containerStyle={[
                styles.dropdownContainer,
                {
                  width: 100,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
              placeholder=""
              selectedTextStyle={styles.dropdownHiddenText}
              itemContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              maxHeight={220}
              showsVerticalScrollIndicator={false}
              activeColor="transparent"
              closeModalWhenSelectedItem
              flatListProps={{
                bounces: false,
                overScrollMode: 'never',
                showsVerticalScrollIndicator: false,
                contentContainerStyle: { paddingVertical: 0 },
              }}
              onChange={(item: { label: string; value: string }) => {
                setDensityUnit(item.value)
                densityUnitDropdownRef.current?.close?.()
              }}
              renderLeftIcon={() => null}
              renderRightIcon={() => null}
              renderItem={(item: { label: string; value: string }) => {
                const isSelected = item.value === densityUnit
                return (
                  <View style={[styles.modalOption, isSelected ? styles.modalOptionActive : null]}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        { color: theme.colors.text },
                        isSelected ? styles.modalOptionTextActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                )
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.densityResetButton}
          onPress={handleReset}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="rotate-ccw" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.formTwoColRow, { direction: 'ltr' }]}>
        <View style={[styles.formLeftCol, language === 'ar' ? { direction: 'rtl' } : null]}>

          {fields.map((field) => (
            <View key={field.key} style={styles.inputRow}>
              {shouldShowUnitForKey(field.key) ? (
                <View style={styles.inputWithUnit}>
                  <View style={styles.inputPrefix}>
                    <Text style={[styles.inputPrefixText, { color: theme.colors.text }]} numberOfLines={1}>
                      {field.label}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.inputFlex}
                    value={dims[field.key] || ''}
                    onChangeText={(text) => handleDimChange(field.key, text)}
                    keyboardType="numeric"
                    multiline={false}
                    numberOfLines={1}
                    placeholder={getLocalizedPlaceholder(field.title, language)}
                    placeholderTextColor={theme.colors.textSecondary}
                    selectionColor={theme.colors.secondary}
                  />
                  <View
                    ref={(node) => {
                      unitAnchorRefs.current[field.key] = node
                    }}
                    collapsable={false}
                  >
                    <TouchableOpacity
                      style={styles.unitButton}
                      onPress={() => {
                        const node = unitAnchorRefs.current[field.key] ?? null
                        openPickerFromNode(node, {
                          showTitle: false,
                          title: undefined,
                          options: DIM_UNITS.map((u) => ({ label: u, value: u })),
                          value: getUnitForKey(field.key),
                          width: 65,
                          maxHeight: 170,
                          onSelect: (value: string) => {
                            setUnitForKey(field.key, value as DimUnit)
                            closePicker()
                          },
                        })
                      }}
                    >
                      <Text style={styles.unitButtonText}>{getUnitForKey(field.key)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.inputWithPrefix}>
                  <View style={styles.inputPrefix}>
                    <Text style={[styles.inputPrefixText, { color: theme.colors.text }]} numberOfLines={1}>
                      {field.label}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.inputFlexNoUnit}
                    value={dims[field.key] || ''}
                    onChangeText={(text) => handleDimChange(field.key, text)}
                    keyboardType="numeric"
                    multiline={false}
                    numberOfLines={1}
                    placeholder={getLocalizedPlaceholder(field.title, language)}
                    placeholderTextColor={theme.colors.textSecondary}
                    selectionColor={theme.colors.secondary}
                  />
                </View>
              )}
            </View>
          ))}

          <View style={styles.inputRow}>
            <View style={styles.inputWithPrefix}>
              <View style={styles.inputPrefix}>
                <Text style={[styles.inputPrefixText, { color: theme.colors.text }]} numberOfLines={1}>
                  {calcT.quantity}
                </Text>
              </View>
              <TextInput
                style={styles.inputFlexNoUnit}
                value={qtyText}
                onChangeText={(text) => {
                  const normalized = normalizeNumericInput(text)
                  const n = toNumber(normalized)

                  setQtyText(normalized)

                  if (!normalized) {
                    setQty(0)
                    return
                  }

                  if (!n || n <= 0) {
                    setQty(0)
                    return
                  }

                  setQty(Math.floor(n))
                }}
                onBlur={() => {
                  const n = toNumber(qtyText)

                  if (!qtyText || !n || n <= 0) {
                    setQty(0)
                    setQtyText('')
                    return
                  }

                  const next = Math.floor(n)
                  setQty(next)
                  setQtyText(String(next))
                }}
                keyboardType="numeric"
                multiline={false}
                numberOfLines={1}
                placeholder="1"
                placeholderTextColor={theme.colors.textSecondary}
                selectionColor={theme.colors.secondary}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.priceInputWithPrefixCurrency}>
              <View style={styles.inputPrefix}>
                <Text style={[styles.inputPrefixText, { color: theme.colors.text }]} numberOfLines={1}>
                  {calcT.pricePerKg}
                </Text>
              </View>
              <TextInput
                style={styles.priceInput}
                value={price ? String(price) : ''}
                onChangeText={(text) => {
                  const normalized = normalizeNumericInput(text)
                  if (!normalized) {
                    setPrice(null)
                    return
                  }
                  const n = toNumber(normalized)
                  setPrice(n > 0 ? n : null)
                }}
                keyboardType="numeric"
                multiline={false}
                numberOfLines={1}
                placeholder={calcT.pricePerKg}
                placeholderTextColor={theme.colors.textSecondary}
                selectionColor={theme.colors.secondary}
              />
              <Text style={styles.priceInputCurrency}>{currencyCode}</Text>
            </View>
          </View>

        </View>

        {(!!displayedPreviewSource || !!pendingPreviewSource) && (
          <View style={[styles.formRightCol, { width: previewColumnWidth }]}>
            <View style={styles.calcPreviewContainer}>
              {!!displayedPreviewSource && (
                <Image
                  source={displayedPreviewSource as any}
                  style={styles.calcPreviewImage}
                  resizeMode="contain"
                  resizeMethod="resize"
                  fadeDuration={0}
                />
              )}
              {!!pendingPreviewSource && (
                <Image
                  source={pendingPreviewSource as any}
                  style={[
                    styles.calcPreviewImage,
                    StyleSheet.absoluteFillObject,
                    { opacity: pendingPreviewLoaded ? 1 : 0 },
                  ]}
                  resizeMode="contain"
                  resizeMethod="resize"
                  fadeDuration={0}
                  onLoadEnd={() => setPendingPreviewLoaded(true)}
                  onError={() => setPendingPreviewLoaded(true)}
                />
              )}
            </View>
          </View>
        )}
      </View>

    </View>
  )
}
