import { memo } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { Feather } from "@expo/vector-icons"

import { useTheme } from "../../contexts/ThemeContext"
import { calculatorStyles as styles } from "./styles"

type TotalsSectionProps = {
  totalWeightKg: number
  totalPrice: number
  currencyCode: string
  onCopyTotalWeight?: () => void
  onCopyTotalPrice?: () => void
}

export const TotalsSection = memo(function TotalsSection({
  totalWeightKg,
  totalPrice,
  currencyCode,
  onCopyTotalWeight,
  onCopyTotalPrice,
}: TotalsSectionProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  return (
    <View style={[styles.section, isDark ? { borderTopColor: theme.colors.border } : null]}>
      <View style={styles.row}>
        <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Total Weight</Text>
        <View style={styles.totalPriceValueContainer}>
          <Text style={styles.value}>{totalWeightKg.toFixed(2)} kg</Text>
          {onCopyTotalWeight && (
            <TouchableOpacity
              style={styles.copyIconButton}
              onPress={onCopyTotalWeight}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="copy" size={14} color={isDark ? theme.colors.icon : "#000000"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Total Price</Text>
        <View style={styles.totalPriceValueContainer}>
          <Text style={styles.value}>{totalPrice.toFixed(2)}</Text>
          <Text style={styles.currencyPillText}>{currencyCode}</Text>
          {onCopyTotalPrice && (
            <TouchableOpacity
              style={styles.copyIconButton}
              onPress={onCopyTotalPrice}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="copy" size={14} color={isDark ? theme.colors.icon : "#000000"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
})
