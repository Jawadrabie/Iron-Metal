import { memo } from "react"
import { Text, TextInput, TouchableOpacity, View } from "react-native"

import { useTheme } from "../../contexts/ThemeContext"
import { calculatorStyles as styles } from "./styles"
import { LENGTH_UNITS } from "./constants"

type LengthAndPiecesSectionProps = {
  dimsMode: boolean
  lengthInput: string
  lengthUnit: (typeof LENGTH_UNITS)[number]
  lengthUnitDropdownOpen: boolean
  requiredInput: string
  pricePerKgInput: string
  currencyCode: string
  onToggleLengthUnitDropdown: () => void
  onSelectLengthUnit: (unit: (typeof LENGTH_UNITS)[number]) => void
  onChangeLengthInput: (value: string) => void
  onChangeRequiredInput: (value: string) => void
  onChangePricePerKgInput: (value: string) => void
  onQuickLengthToggle: () => void
}

export const LengthAndPiecesSection = memo(function LengthAndPiecesSection({
  dimsMode,
  lengthInput,
  lengthUnit,
  lengthUnitDropdownOpen,
  requiredInput,
  pricePerKgInput,
  currencyCode,
  onToggleLengthUnitDropdown,
  onSelectLengthUnit,
  onChangeLengthInput,
  onChangeRequiredInput,
  onChangePricePerKgInput,
  onQuickLengthToggle,
}: LengthAndPiecesSectionProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  return (
    <View style={[styles.section, isDark ? { borderTopColor: theme.colors.border } : null]}>
      {!dimsMode && (
        <View style={styles.row}>
          <View style={styles.lengthLabelRow}>
            <Text style={[styles.lengthLabelText, isDark ? { color: theme.colors.textSecondary } : null]}>Length</Text>
            <TouchableOpacity style={styles.lengthQuickButton} onPress={onQuickLengthToggle}>
              <Text style={styles.lengthQuickButtonText}>6 / 12 m</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.inputWithDropdown,
              isDark
                ? {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface2,
                  }
                : null,
            ]}
          >
            <TextInput
              style={[styles.inputFlex, isDark ? { color: theme.colors.text } : null]}
              value={lengthInput}
              onChangeText={onChangeLengthInput}
              keyboardType="decimal-pad"
              placeholder="12"
              placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
              editable={true}
            />
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                isDark
                  ? {
                      borderLeftColor: theme.colors.border,
                      backgroundColor: theme.colors.surface2,
                    }
                  : null,
              ]}
              onPress={onToggleLengthUnitDropdown}
            >
              <Text style={[styles.dropdownButtonText, isDark ? { color: theme.colors.text } : null]}>{lengthUnit}</Text>
            </TouchableOpacity>
            {lengthUnitDropdownOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  isDark
                    ? {
                        backgroundColor: theme.colors.surface2,
                        borderColor: theme.colors.border,
                      }
                    : null,
                ]}
              >
                {LENGTH_UNITS.map((unit) => {
                  const isSelected = lengthUnit === unit
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
                      onPress={() => onSelectLengthUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDark ? { color: theme.colors.textSecondary } : null,
                          isSelected && styles.unitDropdownItemTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.row}>
        <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Required pieces</Text>
        <TextInput
          style={[
            styles.input,
            isDark
              ? {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
              : null,
          ]}
          value={requiredInput}
          onChangeText={onChangeRequiredInput}
          keyboardType="numeric"
          placeholder="1"
          placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
          multiline={false}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Unit price</Text>
        <View
          style={[
            styles.priceInputWithCurrency,
            isDark
              ? {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                }
              : null,
          ]}
        >
          <TextInput
            style={[styles.priceInput, isDark ? { color: theme.colors.text } : null]}
            value={pricePerKgInput}
            onChangeText={onChangePricePerKgInput}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
            multiline={false}
            scrollEnabled={false}
          />
          <Text style={[styles.priceInputCurrency, isDark ? { color: theme.colors.textSecondary } : null]}>{currencyCode}</Text>
        </View>
      </View>
    </View>
  )
})
