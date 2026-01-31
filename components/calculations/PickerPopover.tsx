import React from "react"
import { StyleSheet, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import type { PickerState } from "./types"

type Props = {
  picker: PickerState
  theme: any
  styles: any
  screenWidth: number
  screenHeight: number
  onClose: () => void
}

export function PickerPopover({ picker, theme, styles, screenWidth, screenHeight, onClose }: Props) {
  if (!picker) return null

  const menuWidth = picker.width ?? 240
  const menuMaxHeight = picker.maxHeight ?? Math.min(360, Math.max(180, screenHeight * 0.45))

  const left = Math.min(
    Math.max(8, picker.anchor.x - menuWidth / 2),
    Math.max(8, screenWidth - menuWidth - 8),
  )

  const verticalOffset = picker.compact ? -10 : -6
  const belowTop = picker.anchor.y + verticalOffset
  const aboveTop = picker.anchor.y + verticalOffset - menuMaxHeight
  const topCandidate = belowTop + menuMaxHeight > screenHeight - 8 ? aboveTop : belowTop
  const top = Math.min(Math.max(8, topCandidate), Math.max(8, screenHeight - menuMaxHeight - 8))

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "transparent" }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                picker.compact && styles.modalCardCompact,
                { backgroundColor: theme.colors.surface, width: menuWidth, maxHeight: menuMaxHeight, left, top },
              ]}
            >
              {picker.showTitle !== false && !!picker.title && (
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{picker.title}</Text>
              )}

              <ScrollView
                style={styles.modalList}
                contentContainerStyle={[styles.modalListContent, picker.compact && styles.modalListContentCompact]}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                overScrollMode="never"
              >
                {picker.options.map((opt) => {
                  const isActive = opt.value === picker.value
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.modalOption, picker.compact && styles.modalOptionCompact, isActive && styles.modalOptionActive]}
                      activeOpacity={0.9}
                      onPress={() => picker.onSelect(opt.value)}
                    >
                      {opt.rightLabel ? (
                        <View style={[styles.modalOptionRow, picker.compact && styles.modalOptionRowCompact]}>
                          <Text
                            numberOfLines={picker.compact ? 1 : 2}
                            ellipsizeMode="clip"
                            style={[
                              styles.modalOptionLeftText,
                              picker.compact && styles.modalOptionLeftTextCompact,
                              { color: theme.colors.text },
                              isActive && styles.modalOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.modalOptionRightText,
                              picker.compact && styles.modalOptionRightTextCompact,
                              { color: theme.colors.textSecondary },
                              isActive && styles.modalOptionTextActive,
                            ]}
                          >
                            {opt.rightLabel}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.modalOptionText, { color: theme.colors.text }, isActive && styles.modalOptionTextActive]}>
                          {opt.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}
