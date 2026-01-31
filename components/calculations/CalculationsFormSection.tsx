import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Image } from 'react-native'
import { Dropdown, type IDropdownRef } from 'react-native-element-dropdown'
import { DENSITY_GROUPS, DENSITY_UNITS, DIM_UNITS, type DimUnit } from './constants'
import { convertFromKgM3, formatDensity } from './utils'
import { normalizeNumericInput, toNumber } from './numeric'
import { getFieldConfigForFormula } from './fieldConfig'
import { calculateResultsEngine } from './calcEngine'
import { useI18n } from '../../contexts/I18nContext'
import { resolveLocalAssetUri } from '../../lib/localAssets'

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

  const previewImageUri = useMemo(() => {
    const path = selectedCalc?.svgImg ?? selectedCalc?.symbol
    return path ? resolveLocalAssetUri(path) : null
  }, [selectedCalc?.svgImg, selectedCalc?.symbol])

  const autoCalcTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const densityGroupDropdownRef = useRef<IDropdownRef>(null)
  const densityMaterialDropdownRef = useRef<IDropdownRef>(null)
  const densityUnitDropdownRef = useRef<IDropdownRef>(null)
  const unitAnchorRefs = useRef<Record<string, View | null>>({})

  const selectedGroup =
    DENSITY_GROUPS.find((g) => g.label === densityGroup) || DENSITY_GROUPS[0]
  const selectedMaterial =
    selectedGroup.items.find((m) => m.label === densityMaterial) || selectedGroup.items[0]
  const densityKgM3 = selectedMaterial?.value ?? 7850

  useEffect(() => {
    setDims((prev: any) => ({ ...prev, density: String(densityKgM3 / 1000) }))
  }, [densityKgM3, setDims])

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

    const hasAnyInput =
      fields.some((f) => {
        const raw = dims?.[f.key]
        if (!raw) return false
        return toNumber(raw) > 0
      }) || (typeof price === 'number' && price > 0)

    if (!hasAnyInput) {
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

      {!!previewImageUri && (
        <View style={styles.calcPreviewContainer}>
          <Image source={{ uri: previewImageUri }} style={styles.calcPreviewImage} resizeMode="contain" />
        </View>
      )}

      <View style={styles.densityRow}>
        <View collapsable={false} style={{ flex: 1, minWidth: 0 }}>
          <TouchableOpacity
            style={styles.densitySelect}
            onPress={() => densityGroupDropdownRef.current?.open?.()}
          >
            <Text style={styles.densitySelectText} numberOfLines={1}>
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

        <View collapsable={false} style={{ flex: 1, minWidth: 0 }}>
          <TouchableOpacity
            style={styles.densitySelect}
            onPress={() => densityMaterialDropdownRef.current?.open?.()}
          >
            <Text style={styles.densitySelectText} numberOfLines={1}>
              {densityMaterial}
            </Text>
          </TouchableOpacity>

          <View pointerEvents="none" collapsable={false} style={styles.dropdownAnchor}>
            <Dropdown
              ref={densityMaterialDropdownRef}
              data={selectedGroup.items.map((item) => ({
                label: item.label,
                value: item.label,
                rightLabel: `${formatDensity(convertFromKgM3(item.value, densityUnit), densityUnit)} ${
                  DENSITY_UNITS.find((u) => u.value === densityUnit)?.label || ''
                }`,
              }))}
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
              flatListProps={{
                bounces: false,
                overScrollMode: 'never',
                showsVerticalScrollIndicator: false,
                contentContainerStyle: { paddingVertical: 0 },
              }}
              onChange={(item: { label: string; value: string; rightLabel?: string }) => {
                setDensityMaterial(item.value)
                densityMaterialDropdownRef.current?.close?.()
              }}
              renderLeftIcon={() => null}
              renderRightIcon={() => null}
              renderItem={(item: { label: string; value: string; rightLabel?: string }) => {
                const isSelected = item.value === densityMaterial
                return (
                  <View style={[styles.modalOption, styles.modalOptionCompact, isSelected ? styles.modalOptionActive : null]}>
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
                  width: 90,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
              placeholder=""
              selectedTextStyle={styles.dropdownHiddenText}
              itemContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
              maxHeight={240}
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
      </View>

      {fields.map((field) => (
        <View key={field.key} style={styles.inputRow}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{field.label}</Text>
          {shouldShowUnitForKey(field.key) ? (
            <View style={styles.inputWithUnit}>
              <TextInput
                style={styles.inputFlex}
                value={dims[field.key] || ''}
                onChangeText={(text) => handleDimChange(field.key, text)}
                keyboardType="numeric"
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
                      width: 96,
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
            <TextInput
              style={styles.input}
              value={dims[field.key] || ''}
              onChangeText={(text) => handleDimChange(field.key, text)}
              keyboardType="numeric"
              placeholder={getLocalizedPlaceholder(field.title, language)}
              placeholderTextColor={theme.colors.textSecondary}
              selectionColor={theme.colors.secondary}
            />
          )}
        </View>
      ))}

      <View style={styles.inputRow}>
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{calcT.quantity}</Text>
        <TextInput
          style={styles.input}
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
          placeholder="1"
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.secondary}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{calcT.pricePerKg}</Text>
        <View style={styles.priceInputWithCurrency}>
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
            placeholder={calcT.pricePerKg}
            placeholderTextColor={theme.colors.textSecondary}
            selectionColor={theme.colors.secondary}
          />
          <Text style={styles.priceInputCurrency}>{currencyCode}</Text>
        </View>
      </View>

    </View>
  )
}
