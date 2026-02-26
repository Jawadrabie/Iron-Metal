import React from "react"
import {
  InteractionManager,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { useI18n } from "../../contexts/I18nContext"

export type LanguageModalProps = {
  visible: boolean
  onClose: () => void
  onSelectLanguage?: (language: "en" | "ar") => void
  styles: any
}

export function LanguageModal({
  visible,
  onClose,
  onSelectLanguage,
  styles,
}: LanguageModalProps) {
  if (!visible) return null

  const { language, setLanguage, t } = useI18n()
  const tt = t.profile.content

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalBackdrop, styles.languageModalBackdrop]}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={{ paddingVertical: 4 }}>
                {(
                  language === "en"
                    ? [
                        {
                          code: "en" as const,
                          label: tt.languageEnglish,
                          onSelect: () => setLanguage("en"),
                        },
                        {
                          code: "ar" as const,
                          label: tt.languageArabic,
                          onSelect: () => setLanguage("ar"),
                        },
                      ]
                    : [
                        {
                          code: "ar" as const,
                          label: tt.languageArabic,
                          onSelect: () => setLanguage("ar"),
                        },
                        {
                          code: "en" as const,
                          label: tt.languageEnglish,
                          onSelect: () => setLanguage("en"),
                        },
                      ]
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.code}
                    style={[
                      styles.countryRow,
                      { height: 38, marginBottom: 2 },
                      language === opt.code && styles.countryRowActive,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => {
                      onClose()
                      InteractionManager.runAfterInteractions(() => {
                        if (onSelectLanguage) {
                          onSelectLanguage(opt.code)
                        } else {
                          opt.onSelect()
                        }
                      })
                    }}
                  >
                    <Text
                      style={[
                        styles.countryRowText,
                        language === opt.code &&
                          styles.countryRowTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
