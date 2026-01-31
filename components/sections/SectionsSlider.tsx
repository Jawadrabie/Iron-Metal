import { memo, useCallback } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import type { Section } from "../../types/sections"
import { MaskedSectionIcon } from "./MaskedSectionIcon"
import { usePersistedSectionSelection } from "../../hooks/usePersistedSectionSelection"
import { useTheme } from "../../contexts/ThemeContext"

type SectionsSliderProps = {
  data: Section[]
  selectedSectionId: number | null
  onSectionChange: (id: number) => void
}

type SectionItemProps = {
  section: Section
  isActive: boolean
  isPinned: boolean
  onPress: (id: number) => void
  onTogglePin: (id: number) => void
}

const SectionItem = memo(({ section, isActive, isPinned, onPress, onTogglePin }: SectionItemProps) => {
  const theme = useTheme()
  const isDark = theme.isDark
  const iconUri = section.symbol ?? null
  const handlePress = useCallback(() => onPress(section.id), [onPress, section.id])
  const handleTogglePin = useCallback(() => onTogglePin(section.id), [onTogglePin, section.id])

  return (
    <View style={styles.itemWrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.itemButton,
          isActive ? [styles.itemButtonActive, isDark ? { backgroundColor: theme.colors.surface2 } : null] : null,
        ]}
        onPress={handlePress}
      >
        {iconUri ? (
          <MaskedSectionIcon
            uri={iconUri}
            size={40}
            color={isDark ? (isActive ? theme.colors.text : theme.colors.icon) : undefined}
          />
        ) : (
          <Text
            style={[
              styles.symbolText,
              isDark ? { color: theme.colors.text } : null,
              isActive ? [styles.symbolTextActive, isDark ? { color: theme.colors.text } : null] : null,
            ]}
          >
            {section.label}
          </Text>
        )}
      </TouchableOpacity>

      <Text
        style={[
          styles.labelText,
          isDark ? { color: theme.colors.textSecondary } : null,
          isActive ? [styles.labelTextActive, isDark ? { color: theme.colors.secondary } : null] : null,
        ]}
        numberOfLines={1}
      >
        {section.label}
      </Text>

      {isActive && (
        <TouchableOpacity
          style={[
            styles.pinButton,
            isDark ? { backgroundColor: theme.colors.surface } : null,
            isPinned ? (isDark ? { backgroundColor: theme.colors.surface2 } : null) : null,
          ]}
          onPress={handleTogglePin}
          activeOpacity={0.9}
        >
          <Text
            style={[
              styles.pinText,
              isDark ? { color: theme.colors.textSecondary } : null,
              isPinned ? [styles.pinTextActive, isDark ? { color: theme.colors.secondary } : null] : null,
            ]}
          >
            {isPinned ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
})

export function SectionsSlider({ data, selectedSectionId, onSectionChange }: SectionsSliderProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { pinnedSectionId, handleSectionPress, togglePin } = usePersistedSectionSelection({
    sections: data,
    selectedSectionId,
    onSectionChange,
  })

  return (
    <View style={[styles.container, isDark ? { backgroundColor: theme.colors.background } : null]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        overScrollMode="never"
        bounces={false}
      >
        {data.map((item) => (
          <View key={item.id} style={styles.itemContainer}>
            <SectionItem
              section={item}
              isActive={selectedSectionId != null && item.id === selectedSectionId}
              isPinned={item.id === pinnedSectionId}
              onPress={handleSectionPress}
              onTogglePin={togglePin}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingVertical: 4,
  },
  itemWrapper: {
    alignItems: "center",
  },
  itemContainer: {
    marginRight: 12,
  },
  itemButton: {
    width: 65,
    height: 65,
    borderRadius: 16,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  itemButtonActive: {
    backgroundColor: "#EFEFEF",
  },
  symbolText: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "600",
  },
  symbolTextActive: {
    color: "#000000",
  },
  labelText: {
    marginTop: 6,
    maxWidth: 80,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  labelTextActive: {
    color: "#dc2626",
    fontWeight: "600",
  },
  pinButton: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  pinText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  pinTextActive: {
    color: "#f59e0b",
  },
})

